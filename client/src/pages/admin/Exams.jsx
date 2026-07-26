/**
 * Admin Exams Page — Grouped by Semester and Exam Type (Image 2 Style)
 * Enables scheduling and managing exam series at a high level.
 */
import { useState, useEffect, useMemo } from 'react';
import { Calendar, Play, Loader, Printer, Trash2, Eye, Plus, Search, Clock, ArrowRight, Settings, FileText } from 'lucide-react';
import api from '../../lib/api';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ConfirmDialog';
import toast from 'react-hot-toast';

const getExamTypeLabel = (type) => {
  switch (type) {
    case 'internal1': return 'Internal Test 1 (CIE)';
    case 'internal2': return 'Internal Test 2 (CIE)';
    case 'external': return 'External Theory/Lab (SEE)';
    case 'makeup': return 'Makeup / Supp';
    default: return type || 'Regular';
  }
};

const Exams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Details Modal
  const [activeDetailsSeries, setActiveDetailsSeries] = useState(null);
  
  // Deletion state
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Scheduling wizard state
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardParams, setWizardParams] = useState({
    semester: '5',
    examCategory: 'internal1',
    component: 'both', // default both
    startDate: new Date().toISOString().split('T')[0],
    internalDuration: '1.5',
    externalDuration: '3.0',
    theoryStartTime: '09:00',
    labStartTime: '13:30',
    labDuration: '3.0',
  });
  const [draftTimetable, setDraftTimetable] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const response = await api.get('/examcell/exams');
      if (response.data?.success) {
        setExams(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
      toast.error('Failed to load scheduled exams');
    } finally {
      setLoading(false);
    }
  };

  const handleRunScheduler = async () => {
    try {
      setIsGenerating(true);
      const response = await api.post('/examcell/timetable/generate', {
        semester: parseInt(wizardParams.semester),
        examCategory: wizardParams.examCategory,
        component: wizardParams.component,
        startDate: wizardParams.startDate,
        theoryStartTime: wizardParams.theoryStartTime,
        labStartTime: wizardParams.labStartTime,
        internalDuration: parseFloat(wizardParams.internalDuration),
        externalDuration: parseFloat(wizardParams.externalDuration),
        labDuration: parseFloat(wizardParams.labDuration),
      });

      if (response.data?.success) {
        setDraftTimetable(response.data.data);
        setWizardStep(2);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate timetable drafts');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmTimetable = async () => {
    if (!draftTimetable || draftTimetable.length === 0) return;
    try {
      setIsGenerating(true);
      const response = await api.post('/examcell/timetable/confirm', {
        exams: draftTimetable,
        semester: wizardParams.semester,
        examCategory: wizardParams.examCategory,
      });

      if (response.data?.success) {
        toast.success(response.data.message);
        setShowWizard(false);
        setDraftTimetable(null);
        setWizardStep(1);
        await fetchExams();
      }
    } catch (error) {
      toast.error('Failed to confirm and save timetable');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteSeries = async () => {
    if (!confirmDelete) return;
    try {
      setDeleting(true);
      const { semester, examType } = confirmDelete;
      const response = await api.delete(`/examcell/exams/series/delete?semester=${semester}&examType=${examType}`);
      if (response.data?.success) {
        toast.success(response.data.message);
        setConfirmDelete(null);
        await fetchExams();
      }
    } catch (error) {
      toast.error('Failed to delete exam series');
    } finally {
      setDeleting(false);
    }
  };

  // Group scheduled exams by Semester and Exam Type
  const groupedSeries = useMemo(() => {
    const groups = {};
    exams.forEach((exam) => {
      const sem = exam.semester;
      const type = exam.examType;
      const key = `${sem}-${type}`;

      if (!groups[key]) {
        groups[key] = {
          semester: sem,
          examType: type,
          exams: [],
          minDate: null,
          maxDate: null,
          status: 'scheduled'
        };
      }

      groups[key].exams.push(exam);
      
      const examDateStr = exam.examDate?.split('T')[0] || exam.examDate;
      const examDate = new Date(examDateStr);

      if (!isNaN(examDate)) {
        if (!groups[key].minDate || examDate < groups[key].minDate) {
          groups[key].minDate = examDate;
        }
        if (!groups[key].maxDate || examDate > groups[key].maxDate) {
          groups[key].maxDate = examDate;
        }
      }

      if (exam.status === 'draft') {
        groups[key].status = 'draft';
      }
    });

    // Convert to array and filter by search query (semester or exam type)
    return Object.values(groups)
      .filter((g) => {
        const query = search.toLowerCase();
        return (
          !query ||
          `sem ${g.semester}`.includes(query) ||
          g.semester.toString() === query ||
          getExamTypeLabel(g.examType).toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        if (a.semester !== b.semester) return a.semester - b.semester;
        return a.examType.localeCompare(b.examType);
      });
  }, [exams, search]);

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        <LoadingSkeleton count={4} />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-[#1A1A1A] mb-1">
            Exam Series & Schedules
          </h1>
          <p className="text-[#5C5C5C] text-sm">
            Manage assessment schedules grouped by semester and type (CIE / SEE).
          </p>
        </div>

        <Button onClick={() => setShowWizard(true)} variant="gold" className="flex items-center gap-2 font-bold shadow-sm shadow-amber-100">
          <Plus size={16} /> Schedule Exam Series
        </Button>
      </div>

      {/* Search Filter */}
      <div className="mb-6 relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search by Semester or Exam Type (e.g. Sem 5, Internal 1)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none text-sm bg-white shadow-sm"
        />
      </div>

      {/* Series Grid */}
      {groupedSeries.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-gray-100 shadow-sm">
          <Calendar size={48} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-[#1A1A1A] mb-1">No exam series found</h3>
          <p className="text-[#5C5C5C] text-sm mb-6">Create a scheduled exam series using the wizard.</p>
          <Button onClick={() => setShowWizard(true)} variant="gold"><Plus size={16} className="inline mr-1.5" />Schedule Series</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {groupedSeries.map((series) => {
            const minDateStr = series.minDate ? series.minDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
            const maxDateStr = series.maxDate ? series.maxDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
            
            return (
              <div key={`${series.semester}-${series.examType}`} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-4">
                    <div>
                      <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200/50 px-2.5 py-0.5 rounded-full">
                        Semester {series.semester}
                      </span>
                    </div>
                    <Badge variant={series.status === 'scheduled' ? 'emerald' : 'gold'}>
                      {series.status}
                    </Badge>
                  </div>

                  <h3 className="text-lg font-bold text-[#1E3A5F] mb-1.5">
                    {getExamTypeLabel(series.examType)}
                  </h3>

                  <div className="space-y-2 mt-4 text-xs font-semibold text-gray-500">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-[#C9A227]" />
                      <span>Date Range: <strong className="text-gray-700">{minDateStr}</strong> to <strong className="text-gray-700">{maxDateStr}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-purple-600" />
                      <span>Scheduled Papers: <strong className="text-purple-700">{series.exams.length} Courses</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-6 mt-6 border-t border-gray-100">
                  <Button onClick={() => setActiveDetailsSeries(series)} variant="ghost" className="flex-1 text-xs border border-gray-200 flex items-center justify-center gap-1.5">
                    <Eye size={14} /> View Details
                  </Button>
                  <Button onClick={() => setConfirmDelete({ semester: series.semester, examType: series.examType })} variant="danger" className="text-xs bg-red-50 text-red-700 border border-red-100 hover:bg-red-100 py-2 px-3">
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Series Details Modal */}
      {activeDetailsSeries && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col h-[75vh]">
            <div className="bg-[#1E3A5F] px-6 py-4 text-white flex justify-between items-center shrink-0">
              <div>
                <h2 className="font-bold text-md">Semester {activeDetailsSeries.semester} — {getExamTypeLabel(activeDetailsSeries.examType)}</h2>
                <p className="text-[10px] text-blue-200 font-bold uppercase tracking-wider mt-0.5">Timetable Breakdown</p>
              </div>
              <Button onClick={() => setActiveDetailsSeries(null)} variant="ghost" className="text-white hover:bg-white/10 text-xs">
                Close
              </Button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-3 text-left font-bold text-xs text-gray-500 w-24">Date</th>
                    <th className="px-4 py-3 text-left font-bold text-xs text-gray-500 w-32">Time</th>
                    <th className="px-4 py-3 text-left font-bold text-xs text-gray-500 w-24">Subject Code</th>
                    <th className="px-4 py-3 text-left font-bold text-xs text-gray-500">Subject Name</th>
                    <th className="px-4 py-3 text-center font-bold text-xs text-gray-500 w-20">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {activeDetailsSeries.exams
                    .sort((a, b) => new Date(a.examDate) - new Date(b.examDate) || a.startTime.localeCompare(b.startTime))
                    .map((ex) => (
                      <tr key={ex._id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-xs font-semibold text-gray-700">
                          {new Date(ex.examDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 font-medium">
                          {ex.startTime} to {ex.endTime}
                        </td>
                        <td className="px-4 py-3 text-xs font-mono font-bold text-[#1E3A5F]">
                          {ex.subjectId?.subjectCode || '—'}
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-gray-800">
                          {ex.subjectId?.subjectName || '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold capitalize bg-gray-100 text-gray-700">
                            {ex.componentType || 'theory'}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Deletion Dialog */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Delete Exam Series?"
        message={`Warning: This will permanently delete the entire exam series for Semester ${confirmDelete?.semester} - ${getExamTypeLabel(confirmDelete?.examType)}. It will also remove all seating allocations and invigilator duties for these exams. Do you want to proceed?`}
        confirmLabel={deleting ? 'Deleting...' : 'Permanently Delete'}
        onConfirm={handleDeleteSeries}
        onCancel={() => setConfirmDelete(null)}
      />

      {/* Scheduling Wizard Modal */}
      {showWizard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#1E3A5F] px-6 py-4 text-white flex items-center gap-2 justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Settings className="text-[#C9A227]" size={20} />
                <h2 className="text-lg font-bold">Schedule Exam Series</h2>
              </div>
              <Button onClick={() => setShowWizard(false)} variant="ghost" className="text-white hover:bg-white/10 text-xs">
                Cancel
              </Button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {wizardStep === 1 ? (
                <div className="space-y-4">
                  <p className="text-xs text-[#5C5C5C]">
                    Enter the parameters to auto-generate exam dates. The solver skips weekends and assigns morning/afternoon slots.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#1A1A1A] mb-1.5">Semester</label>
                      <select value={wizardParams.semester} onChange={e => setWizardParams({ ...wizardParams, semester: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-sm">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#1A1A1A] mb-1.5">Exam Category</label>
                      <select value={wizardParams.examCategory} onChange={e => setWizardParams({ ...wizardParams, examCategory: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-sm">
                        <option value="internal1">Internal 1 (CIE)</option>
                        <option value="internal2">Internal 2 (CIE)</option>
                        <option value="external">External (SEE)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#1A1A1A] mb-1.5">Start Date</label>
                    <input type="date" value={wizardParams.startDate} onChange={e => setWizardParams({ ...wizardParams, startDate: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-sm" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#1A1A1A] mb-1.5">Morning Start Time</label>
                      <input type="time" value={wizardParams.theoryStartTime} onChange={e => setWizardParams({ ...wizardParams, theoryStartTime: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#1A1A1A] mb-1.5">Afternoon Start Time</label>
                      <input type="time" value={wizardParams.labStartTime} onChange={e => setWizardParams({ ...wizardParams, labStartTime: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-4 border-t border-gray-100">
                    <Button onClick={handleRunScheduler} disabled={isGenerating} variant="gold" className="px-6 font-bold flex items-center gap-1.5">
                      {isGenerating ? <Loader className="animate-spin" size={16} /> : <Play size={16} />}
                      Generate Timetable Draft
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-[#1E3A5F] border-b pb-2">Draft Timetable Preview</h4>
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="px-3 py-2 text-left font-bold text-gray-500">Date</th>
                        <th className="px-3 py-2 text-left font-bold text-gray-500">Slot Time</th>
                        <th className="px-3 py-2 text-left font-bold text-gray-500">Subject Code</th>
                        <th className="px-3 py-2 text-left font-bold text-gray-500">Subject Name</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {draftTimetable?.map((dt, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-600 font-semibold">{new Date(dt.examDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                          <td className="px-3 py-2 text-gray-500">{dt.startTime} to {dt.endTime}</td>
                          <td className="px-3 py-2 font-mono font-bold text-[#1E3A5F]">{dt.subjectCode}</td>
                          <td className="px-3 py-2 text-gray-800 font-medium">{dt.subjectName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="flex justify-between pt-4 border-t border-gray-100">
                    <Button onClick={() => setWizardStep(1)} variant="ghost" className="border border-gray-300">
                      Back to Config
                    </Button>
                    <Button onClick={handleConfirmTimetable} disabled={isGenerating} variant="gold" className="font-bold">
                      {isGenerating ? 'Saving...' : 'Confirm and Save Timetable'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Exams;
