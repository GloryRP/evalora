/**
 * Invigilator Assignments Page — Decoupled & Enhanced
 * View faculty duties, print schedules, and run the Invigilator Assignment Agent separately.
 */
import { useState, useEffect, useMemo } from 'react';
import { ClipboardList, Calendar, Clock, User, Landmark, Shield, Printer, Loader, Play } from 'lucide-react';
import api from '../../lib/api';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

const InvigilatorAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState('5');
  const [runningAgent, setRunningAgent] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedSemester]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch exams for the selected semester
      const examsRes = await api.get(`/examcell/exams?semester=${selectedSemester}&status=scheduled`);
      const semesterExams = examsRes.data.data;
      setExams(semesterExams);
      
      // Fetch assignments
      const response = await api.get('/examcell/invigilator-assignments');
      // Filter assignments to only show those for this semester's exams
      const filteredAssignments = response.data.data.filter(assign => 
        assign.examId && semesterExams.some(e => e._id === (assign.examId._id || assign.examId))
      );
      setAssignments(filteredAssignments);
    } catch (error) {
      console.error('Error fetching invigilation duties:', error);
      toast.error('Failed to load invigilator schedules');
    } finally {
      setLoading(false);
    }
  };

  const handleRunInvigilatorAssignment = async () => {
    if (exams.length === 0) {
      toast.error('No scheduled exams found for this semester to assign invigilators!');
      return;
    }

    try {
      setRunningAgent(true);
      const examIds = exams.map(e => e._id);
      
      const response = await api.post('/examcell/invigilator-assignments/generate', {
        examIds,
        constraints: {}
      });

      if (response.data.success) {
        toast.success(response.data.message);
        await fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate invigilator duties');
    } finally {
      setRunningAgent(false);
    }
  };

  // Group by exam
  const groupedAssignments = useMemo(() => {
    return assignments.reduce((acc, assignment) => {
      if (!assignment.examId) return acc;
      const examKey = assignment.examId._id?.toString() || assignment.examId?.toString();
      if (!examKey) return acc;

      if (!acc[examKey]) {
        acc[examKey] = { exam: assignment.examId, assignments: [] };
      }
      acc[examKey].assignments.push(assignment);
      return acc;
    }, {});
  }, [assignments]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <LoadingSkeleton count={4} />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header (Hidden during print) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 print:hidden">
        <div>
          <h1 className="text-3xl font-display font-bold text-[#1A1A1A] mb-1">
            Invigilator Assignments
          </h1>
          <p className="text-[#5C5C5C] text-sm font-medium">
            Faculty invigilation duties and hall supervisors.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Semester Selector */}
          <select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none text-sm bg-white font-semibold">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
              <option key={sem} value={sem}>Semester {sem}</option>
            ))}
          </select>

          <Button onClick={handlePrint} variant="ghost" className="flex items-center gap-2 border border-gray-300 text-xs">
            <Printer size={14} /> Print Duties
          </Button>

          {/* Decoupled Run Invigilator Agent Button */}
          <Button onClick={handleRunInvigilatorAssignment} disabled={runningAgent || exams.length === 0} variant="gold" className="flex items-center gap-1.5 font-bold">
            {runningAgent ? <Loader className="animate-spin" size={16} /> : <Play size={16} />}
            Generate Invigilator Duties
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      {Object.keys(groupedAssignments).length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-gray-100 shadow-sm print:hidden">
          <ClipboardList size={48} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-[#1A1A1A] mb-1">No duties assigned</h3>
          <p className="text-[#5C5C5C] text-sm mb-6">Make sure seating allocations are generated, then run the invigilator agent separately.</p>
          <Button onClick={handleRunInvigilatorAssignment} variant="gold"><Play size={16} className="inline mr-1.5" />Generate Invigilator Duties</Button>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Institution Header for Printing */}
          <div className="hidden print:block text-center mb-8 border-b-2 border-[#1E3A5F] pb-4">
            <h2 className="text-2xl font-bold font-display text-[#1E3A5F] uppercase">PES Institute of Technology & Management</h2>
            <p className="text-xs font-semibold text-[#5C5C5C] tracking-wide">NH-206, SAGAR ROAD, SHIVAMOGGA - 577204</p>
            <h3 className="text-sm font-bold text-[#C9A227] uppercase tracking-wider mt-2">Invigilation Duty Allocation Sheet</h3>
            <p className="text-xs font-semibold text-gray-500 mt-1">Semester {selectedSemester} Exams</p>
          </div>

          {Object.values(groupedAssignments).map(({ exam, assignments: examAssignments }) => (
            <div key={exam._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 print:border-none print:shadow-none print:p-0 print:mb-8">
              <div className="border-b border-gray-100 pb-4 mb-6">
                <h2 className="font-display font-bold text-xl text-[#1E3A5F]">{exam.subjectId?.subjectName || 'Subject'}</h2>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-[#5C5C5C] font-semibold">
                  <span className="flex items-center gap-1"><Calendar size={13} className="text-[#C9A227]" /> {new Date(exam.examDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                  <span>•</span>
                  <span>{exam.startTime} - {exam.endTime}</span>
                  <span>•</span>
                  <span className="capitalize">{exam.examType || 'Regular'}</span>
                </div>
              </div>

              <div className="overflow-x-auto border border-gray-100 rounded-xl print:border-none print:rounded-none">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-gray-50 border-b border-gray-100 print:bg-white print:border-b-2 print:border-gray-300">
                    <tr>
                      <th className="border-b border-gray-100 print:border-b-2 print:border-gray-300 px-6 py-3 text-left text-xs font-semibold text-[#5C5C5C] uppercase tracking-wider">Hall</th>
                      <th className="border-b border-gray-100 print:border-b-2 print:border-gray-300 px-6 py-3 text-left text-xs font-semibold text-[#5C5C5C] uppercase tracking-wider">Invigilator / Faculty</th>
                      <th className="border-b border-gray-100 print:border-b-2 print:border-gray-300 px-6 py-3 text-left text-xs font-semibold text-[#5C5C5C] uppercase tracking-wider">Employee ID</th>
                      <th className="border-b border-gray-100 print:border-b-2 print:border-gray-300 px-6 py-3 text-left text-xs font-semibold text-[#5C5C5C] uppercase tracking-wider">Department</th>
                      <th className="border-b border-gray-100 print:border-b-2 print:border-gray-300 px-6 py-3 text-left text-xs font-semibold text-[#5C5C5C] uppercase tracking-wider">Role</th>
                      <th className="border-b border-gray-100 print:border-b-2 print:border-gray-300 px-6 py-3 text-left text-xs font-semibold text-[#5C5C5C] uppercase tracking-wider">Duty Slot</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 print:divide-y print:divide-gray-300">
                    {examAssignments
                      .sort((a, b) => {
                        const hallA = a.hallId?.hallName || '';
                        const hallB = b.hallId?.hallName || '';
                        return hallA.localeCompare(hallB);
                      })
                      .map((assignment) => (
                        <tr key={assignment._id} className="hover:bg-gray-50/50 transition">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Landmark size={14} className="text-gray-400 print:hidden" />
                              <span className="font-bold text-[#1E3A5F]">{assignment.hallId?.hallName || '—'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-amber-50 text-[#C9A227] flex items-center justify-center text-[10px] font-bold print:hidden">
                                {assignment.facultyId?.name ? assignment.facultyId.name[0] : '?'}
                              </div>
                              <span className="font-semibold text-[#1A1A1A]">{assignment.facultyId?.name || '—'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-[#5B21B6]">{assignment.facultyId?.employeeId || '—'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-[#5C5C5C]">{assignment.facultyId?.department || '—'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize bg-indigo-50 text-indigo-700 border border-indigo-100 print:bg-white print:border-none print:p-0 print:font-bold">
                              {assignment.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-[#5C5C5C] font-medium">
                            <span className="flex items-center gap-1.5">
                              <Clock size={12} className="text-gray-400 print:hidden" /> {assignment.startTime || '—'} - {assignment.endTime || '—'}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InvigilatorAssignments;
