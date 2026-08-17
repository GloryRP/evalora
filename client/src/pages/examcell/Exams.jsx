/**
 * ExamCell Exams Page — Grouped by Semester and Exam Type
 * Enables scheduling and managing exam series at a high level.
 */
import { useState, useEffect, useMemo } from 'react';
import { Calendar, Play, Loader, Trash2, Eye, Plus, Search, Clock, Settings, FileText } from 'lucide-react';
import api from '../../lib/api';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import Button from '../../components/ui/Button';
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
  const [searchFocused, setSearchFocused] = useState(false);

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
    component: 'both',
    startDate: new Date().toISOString().split('T')[0],
    internalDuration: '1.5',
    externalDuration: '3.0',
    theoryStartTime: '09:00',
    labStartTime: '13:30',
    labDuration: '3.0',
  });
  const [draftTimetable, setDraftTimetable] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Hover states for cards
  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredViewBtn, setHoveredViewBtn] = useState(null);
  const [scheduleHovered, setScheduleHovered] = useState(false);

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
      <div style={{ padding: '24px 32px', maxWidth: '1152px', margin: '0 auto' }}>
        <LoadingSkeleton count={4} />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1152px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '20px' }}>
        {/* ROW 1: Title + Action Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: 0 }}>
            Exam Series &amp; Schedules
          </h1>
          <button
            onClick={() => setShowWizard(true)}
            onMouseEnter={() => setScheduleHovered(true)}
            onMouseLeave={() => setScheduleHovered(false)}
            style={{
              backgroundColor: scheduleHovered ? '#B8911F' : 'var(--color-gold)',
              color: 'var(--color-navy)',
              padding: '9px 18px',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background-color 150ms ease',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
          >
            <Plus size={16} />
            Schedule Exam Series
          </button>
        </div>

        {/* ROW 2: Description */}
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontWeight: 400, marginBottom: '16px' }}>
          Manage assessment schedules grouped by semester and type (CIE / SEE).
        </p>

        {/* ROW 3: Search Bar */}
        <input
          type="text"
          placeholder="Search by Semester or Exam Type (e.g. Sem 5, Internal 1)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          style={{
            width: '100%',
            padding: '10px 16px',
            border: `1.5px solid ${searchFocused ? 'var(--color-gold)' : '#E0E0E0'}`,
            borderRadius: '8px',
            fontSize: '0.9rem',
            marginBottom: '0',
            outline: 'none',
            fontFamily: 'var(--font-body)',
            backgroundColor: 'white',
            boxSizing: 'border-box',
            transition: 'border-color 200ms ease',
            boxShadow: searchFocused ? '0 0 0 3px rgba(201,162,39,0.08)' : 'none',
          }}
        />
      </div>

      {/* Cards Grid */}
      {groupedSeries.length === 0 ? (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '64px 24px',
          textAlign: 'center',
          border: '1px solid #F0F0F0',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>
          <Calendar size={48} style={{ color: '#D1D5DB', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1A1A1A', marginBottom: '4px' }}>
            No exam series found
          </h3>
          <p style={{ color: '#5C5C5C', fontSize: '0.875rem', marginBottom: '24px' }}>
            Create a scheduled exam series using the wizard.
          </p>
          <button
            onClick={() => setShowWizard(true)}
            style={{
              backgroundColor: 'var(--color-navy)',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Plus size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
            Schedule Series
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
          {groupedSeries.map((series) => {
            const cardKey = `${series.semester}-${series.examType}`;
            const isHovered = hoveredCard === cardKey;
            const minDateStr = series.minDate
              ? series.minDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
              : '—';
            const maxDateStr = series.maxDate
              ? series.maxDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
              : '—';
            const isViewHovered = hoveredViewBtn === cardKey;

            return (
              <div
                key={cardKey}
                onMouseEnter={() => setHoveredCard(cardKey)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '10px',
                  padding: '20px 24px',
                  boxShadow: isHovered ? '0 4px 12px rgba(0,0,0,0.1)' : '0 1px 4px rgba(0,0,0,0.06)',
                  border: '1px solid #F0F0F0',
                  position: 'relative',
                  transition: 'box-shadow 150ms ease',
                }}
              >
                {/* Status Badge — absolute top right */}
                <div style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  backgroundColor: series.status === 'scheduled' ? '#EFF6FF' : '#F3F4F6',
                  color: series.status === 'scheduled' ? '#1E40AF' : '#6B7280',
                }}>
                  {series.status}
                </div>

                {/* Semester label */}
                <div style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--color-gold)',
                  marginBottom: '6px',
                }}>
                  Semester {series.semester}
                </div>

                {/* Exam title */}
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: 'var(--color-navy)',
                  marginBottom: '12px',
                  paddingRight: '80px',
                  margin: '0 0 12px 0',
                }}>
                  {getExamTypeLabel(series.examType)}
                </h3>

                {/* Meta Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.825rem', color: 'var(--color-text-secondary)' }}>
                    <Clock size={16} style={{ color: 'var(--color-gold)', flexShrink: 0 }} />
                    <span>
                      Date Range: <strong style={{ color: '#374151' }}>{minDateStr}</strong> to <strong style={{ color: '#374151' }}>{maxDateStr}</strong>
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.825rem', color: 'var(--color-text-secondary)' }}>
                    <FileText size={16} style={{ color: 'var(--color-gold)', flexShrink: 0 }} />
                    <span>
                      Scheduled Papers: <strong style={{ color: '#374151' }}>{series.exams.length} Courses</strong>
                    </span>
                  </div>
                </div>

                {/* Action Row */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button
                    onClick={() => setActiveDetailsSeries(series)}
                    onMouseEnter={() => setHoveredViewBtn(cardKey)}
                    onMouseLeave={() => setHoveredViewBtn(null)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      border: '1px solid #E8E8E8',
                      borderRadius: '6px',
                      backgroundColor: isViewHovered ? 'var(--color-navy)' : 'transparent',
                      color: isViewHovered ? 'white' : 'var(--color-navy)',
                      borderColor: isViewHovered ? 'var(--color-navy)' : '#E8E8E8',
                      fontSize: '0.825rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'all 150ms ease',
                    }}
                  >
                    <Eye size={14} />
                    View Details
                  </button>
                  <button
                    onClick={() => setConfirmDelete({ semester: series.semester, examType: series.examType })}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #FECACA',
                      borderRadius: '6px',
                      backgroundColor: '#FEF2F2',
                      color: '#B91C1C',
                      fontSize: '0.825rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Series Details Modal */}
      {activeDetailsSeries && (
        <div style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px', zIndex: 50,
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            width: '100%', maxWidth: '672px',
            overflow: 'hidden', display: 'flex', flexDirection: 'column',
            maxHeight: '75vh',
          }}>
            <div style={{
              backgroundColor: 'var(--color-navy)', padding: '16px 24px',
              color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <h2 style={{ fontWeight: 700, fontSize: '1rem', margin: 0 }}>
                  Semester {activeDetailsSeries.semester} — {getExamTypeLabel(activeDetailsSeries.examType)}
                </h2>
                <p style={{ fontSize: '0.7rem', color: '#93C5FD', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '4px 0 0' }}>
                  Timetable Breakdown
                </p>
              </div>
              <button
                onClick={() => setActiveDetailsSeries(null)}
                style={{
                  background: 'rgba(255,255,255,0.1)', border: 'none',
                  color: 'white', padding: '6px 12px', borderRadius: '6px',
                  cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500,
                }}
              >
                Close
              </button>
            </div>
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              <table style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, fontSize: '0.72rem', color: '#6B7280', width: '96px' }}>Date</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, fontSize: '0.72rem', color: '#6B7280', width: '128px' }}>Time</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, fontSize: '0.72rem', color: '#6B7280', width: '96px' }}>Subject Code</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, fontSize: '0.72rem', color: '#6B7280' }}>Subject Name</th>
                    <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 700, fontSize: '0.72rem', color: '#6B7280', width: '80px' }}>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {activeDetailsSeries.exams
                    .sort((a, b) => new Date(a.examDate) - new Date(b.examDate) || a.startTime.localeCompare(b.startTime))
                    .map((ex) => (
                      <tr key={ex._id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '10px 16px', fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>
                          {new Date(ex.examDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </td>
                        <td style={{ padding: '10px 16px', fontSize: '0.8rem', color: '#6B7280', fontWeight: 500 }}>
                          {ex.startTime} to {ex.endTime}
                        </td>
                        <td style={{ padding: '10px 16px', fontSize: '0.8rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-navy)' }}>
                          {ex.subjectId?.subjectCode || '—'}
                        </td>
                        <td style={{ padding: '10px 16px', fontSize: '0.8rem', fontWeight: 600, color: '#1F2937' }}>
                          {ex.subjectId?.subjectName || '—'}
                        </td>
                        <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                          <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'capitalize', backgroundColor: '#F3F4F6', color: '#374151' }}>
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
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '540px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
            overflow: 'hidden',
          }}>

            {/* ── HEADER ── */}
            <div style={{
              backgroundColor: 'var(--color-navy)',
              padding: '18px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Settings size={18} color="#C9A227" />
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: 'white',
                }}>Schedule Exam Series</span>
              </div>
              <button
                type="button"
                onClick={() => setShowWizard(false)}
                style={{
                  padding: '6px 14px',
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                }}
              >Cancel</button>
            </div>

            {/* ── BODY ── */}
            <div style={{
              padding: '24px',
              flex: 1,
              overflowY: 'auto',
            }}>
              {wizardStep === 1 ? (
                <>
                  {/* Description card */}
                  <div style={{
                    fontSize: '0.825rem',
                    color: 'var(--color-text-secondary)',
                    lineHeight: 1.5,
                    marginBottom: '20px',
                    padding: '10px 14px',
                    backgroundColor: '#F8F9FA',
                    borderRadius: '8px',
                    border: '1px solid #EEEEEE',
                  }}>
                    Configure exam scheduling parameters. The system automatically skips weekends and avoids scheduling conflicts between subjects in the same semester.
                  </div>

                  {/* ROW 1: Semester + Exam Category */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px',
                    marginBottom: '18px',
                  }}>
                    {/* Semester */}
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'var(--color-text-secondary)',
                        marginBottom: '6px',
                      }}>SEMESTER</label>
                      <select
                        value={wizardParams.semester}
                        onChange={e => setWizardParams({ ...wizardParams, semester: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          border: '1.5px solid #E0E0E0',
                          borderRadius: '8px',
                          fontSize: '0.9rem',
                          color: 'var(--color-text)',
                          backgroundColor: 'white',
                          outline: 'none',
                          fontFamily: 'var(--font-body)',
                          boxSizing: 'border-box',
                          appearance: 'none',
                          cursor: 'pointer',
                        }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-gold)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,162,39,0.08)'; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = '#E0E0E0'; e.currentTarget.style.boxShadow = 'none'; }}
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                      </select>
                    </div>

                    {/* Exam Category */}
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'var(--color-text-secondary)',
                        marginBottom: '6px',
                      }}>EXAM CATEGORY</label>
                      <select
                        value={wizardParams.examCategory}
                        onChange={e => setWizardParams({ ...wizardParams, examCategory: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          border: '1.5px solid #E0E0E0',
                          borderRadius: '8px',
                          fontSize: '0.9rem',
                          color: 'var(--color-text)',
                          backgroundColor: 'white',
                          outline: 'none',
                          fontFamily: 'var(--font-body)',
                          boxSizing: 'border-box',
                          appearance: 'none',
                          cursor: 'pointer',
                        }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-gold)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,162,39,0.08)'; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = '#E0E0E0'; e.currentTarget.style.boxShadow = 'none'; }}
                      >
                        <option value="internal1">Internal 1 (CIE)</option>
                        <option value="internal2">Internal 2 (CIE)</option>
                        <option value="external">External (SEE)</option>
                        <option value="makeup">Make-up / Supplementary</option>
                      </select>
                    </div>
                  </div>

                  {/* ROW 2: Start Date (full width) */}
                  <div style={{ marginBottom: '18px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'var(--color-text-secondary)',
                      marginBottom: '6px',
                    }}>START DATE</label>
                    <input
                      type="date"
                      value={wizardParams.startDate}
                      onChange={e => setWizardParams({ ...wizardParams, startDate: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: '1.5px solid #E0E0E0',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        color: 'var(--color-text)',
                        backgroundColor: 'white',
                        outline: 'none',
                        fontFamily: 'var(--font-body)',
                        boxSizing: 'border-box',
                        appearance: 'none',
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-gold)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,162,39,0.08)'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = '#E0E0E0'; e.currentTarget.style.boxShadow = 'none'; }}
                    />
                  </div>

                  {/* ROW 3: Morning + Afternoon time */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px',
                    marginBottom: '0',
                  }}>
                    {/* Morning */}
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'var(--color-text-secondary)',
                        marginBottom: '6px',
                      }}>MORNING START TIME</label>
                      <input
                        type="time"
                        value={wizardParams.theoryStartTime}
                        onChange={e => setWizardParams({ ...wizardParams, theoryStartTime: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          border: '1.5px solid #E0E0E0',
                          borderRadius: '8px',
                          fontSize: '0.9rem',
                          color: 'var(--color-text)',
                          backgroundColor: 'white',
                          outline: 'none',
                          fontFamily: 'var(--font-body)',
                          boxSizing: 'border-box',
                          appearance: 'none',
                        }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-gold)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,162,39,0.08)'; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = '#E0E0E0'; e.currentTarget.style.boxShadow = 'none'; }}
                      />
                    </div>

                    {/* Afternoon */}
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'var(--color-text-secondary)',
                        marginBottom: '6px',
                      }}>AFTERNOON START TIME</label>
                      <input
                        type="time"
                        value={wizardParams.labStartTime}
                        onChange={e => setWizardParams({ ...wizardParams, labStartTime: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          border: '1.5px solid #E0E0E0',
                          borderRadius: '8px',
                          fontSize: '0.9rem',
                          color: 'var(--color-text)',
                          backgroundColor: 'white',
                          outline: 'none',
                          fontFamily: 'var(--font-body)',
                          boxSizing: 'border-box',
                          appearance: 'none',
                        }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-gold)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,162,39,0.08)'; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = '#E0E0E0'; e.currentTarget.style.boxShadow = 'none'; }}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h4 style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-navy)', borderBottom: '1px solid #E5E7EB', paddingBottom: '8px', margin: 0 }}>
                    Draft Timetable Preview
                  </h4>
                  <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#6B7280' }}>Date</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#6B7280' }}>Slot Time</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#6B7280' }}>Subject Code</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#6B7280' }}>Subject Name</th>
                      </tr>
                    </thead>
                    <tbody>
                      {draftTimetable?.map((dt, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #F3F4F6' }}>
                          <td style={{ padding: '8px 12px', color: '#374151', fontWeight: 600 }}>
                            {new Date(dt.examDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </td>
                          <td style={{ padding: '8px 12px', color: '#6B7280' }}>{dt.startTime} to {dt.endTime}</td>
                          <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-navy)' }}>{dt.subjectCode}</td>
                          <td style={{ padding: '8px 12px', color: '#1F2937', fontWeight: 500 }}>{dt.subjectName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid #F3F4F6' }}>
                    <button
                      onClick={() => setWizardStep(1)}
                      style={{
                        background: 'white', border: '1px solid #D1D5DB', color: '#374151',
                        padding: '10px 20px', borderRadius: '8px', fontSize: '0.875rem',
                        fontWeight: 500, cursor: 'pointer',
                      }}
                    >
                      Back to Config
                    </button>
                    <button
                      onClick={handleConfirmTimetable}
                      disabled={isGenerating}
                      style={{
                        backgroundColor: 'var(--color-gold)', color: 'white',
                        padding: '10px 24px', border: 'none', borderRadius: '8px',
                        fontSize: '0.875rem', fontWeight: 700,
                        cursor: isGenerating ? 'not-allowed' : 'pointer',
                        opacity: isGenerating ? 0.7 : 1,
                      }}
                    >
                      {isGenerating ? 'Saving...' : 'Confirm and Save Timetable'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── FOOTER (only on step 1) ── */}
            {wizardStep === 1 && (
              <div style={{
                padding: '16px 24px',
                borderTop: '1px solid #F0F0F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
                backgroundColor: 'white',
              }}>
                <span style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-text-secondary)',
                  maxWidth: '200px',
                  lineHeight: 1.4,
                }}>Exams will be scheduled starting from the selected start date</span>
                <button
                  onClick={handleRunScheduler}
                  disabled={isGenerating}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '11px 22px',
                    backgroundColor: 'var(--color-navy)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    cursor: isGenerating ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--font-body)',
                    whiteSpace: 'nowrap',
                    transition: 'background-color 150ms ease',
                    opacity: isGenerating ? 0.7 : 1,
                  }}
                  onMouseEnter={(e) => { if (!isGenerating) e.currentTarget.style.backgroundColor = 'var(--color-navy-light)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-navy)'; }}
                >
                  {isGenerating ? <Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={15} />}
                  Generate Timetable Draft
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default Exams;
