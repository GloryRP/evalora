/**
 * Hall Allocations Page — Streamlined & Decoupled Seating Plan (Image 2 Style)
 * Supports running the Seating Allocation Agent separately after the timetable is created,
 * and renders both a visual Bench Grid layout and a printable Branch Allotment sheet.
 */
import { useState, useEffect, useMemo } from 'react';
import { Users, LayoutGrid, Calendar, Landmark, Settings, Play, Loader, Printer, Search, Clipboard } from 'lucide-react';
import api from '../../lib/api';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

const getBranchCode = (dept) => {
  if (!dept) return '—';
  const clean = dept.toLowerCase().trim();
  if (clean.includes('computer science')) return 'CS';
  if (clean.includes('artificial intelligence') || clean.includes('ai')) return 'AI';
  if (clean.includes('information science') || clean.includes('is')) return 'IS';
  if (clean.includes('electronics') || clean.includes('ec')) return 'EC';
  if (clean.includes('electrical') || clean.includes('eee')) return 'EEE';
  if (clean.includes('mechanical') || clean.includes('me')) return 'ME';
  if (clean.includes('civil') || clean.includes('cv')) return 'CV';
  if (clean.includes('chemical') || clean.includes('ch')) return 'CH';
  if (clean.includes('data science') || clean.includes('cd')) return 'CD';
  
  return dept.split(' ').map(w => w[0]).join('').toUpperCase();
};

const HallAllocations = () => {
  const [allocations, setAllocations] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState('5');
  const [viewMode, setViewMode] = useState('sheet'); // 'sheet' (Image 2 Style) or 'grid' (Bench Grid)
  const [selectedBranch, setSelectedBranch] = useState('all');
  
  // Seating Agent controls
  const [runningAgent, setRunningAgent] = useState(false);
  const [fillPct, setFillPct] = useState(70);
  const [showAgentModal, setShowAgentModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedSemester]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch exams scheduled for this semester
      const examsRes = await api.get(`/examcell/exams?semester=${selectedSemester}&status=scheduled`);
      const fetchedExams = examsRes.data.data;
      setExams(fetchedExams);
      
      // Fetch allocations for these exams
      if (fetchedExams.length > 0) {
        const examIdsStr = fetchedExams.map(e => e._id).join(',');
        const response = await api.get('/examcell/hall-allocations');
        // Filter allocations that match this semester's exams
        const filteredAllocations = response.data.data.filter(alloc => 
          alloc.examId && fetchedExams.some(e => e._id === (alloc.examId._id || alloc.examId))
        );
        setAllocations(filteredAllocations);
      } else {
        setAllocations([]);
      }
    } catch (error) {
      console.error('Error fetching seating data:', error);
      toast.error('Failed to load seating plans');
    } finally {
      setLoading(false);
    }
  };

  const handleRunSeatingAllocation = async () => {
    if (exams.length === 0) {
      toast.error('No scheduled exams found for this semester to allocate seating!');
      return;
    }

    try {
      setRunningAgent(true);
      setShowAgentModal(false);
      const examIds = exams.map(e => e._id);
      
      const response = await api.post('/examcell/hall-allocations/generate', {
        examIds,
        constraints: {
          fillPercentage: parseInt(fillPct),
        }
      });

      if (response.data.success) {
        toast.success(response.data.message);
        await fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate seating allocations');
    } finally {
      setRunningAgent(false);
    }
  };

  // Group allocations by exam and hall for Bench layout view
  const groupedAllocationsForGrid = useMemo(() => {
    return allocations.reduce((acc, alloc) => {
      if (!alloc.examId || !alloc.hallId) return acc;
      const examKey = alloc.examId._id?.toString() || alloc.examId?.toString();
      const hallKey = alloc.hallId._id?.toString() || alloc.hallId?.toString();
      if (!examKey || !hallKey) return acc;

      if (!acc[examKey]) {
        acc[examKey] = { exam: alloc.examId, halls: {} };
      }
      if (!acc[examKey].halls[hallKey]) {
        acc[examKey].halls[hallKey] = { hall: alloc.hallId, students: [] };
      }
      acc[examKey].halls[hallKey].students.push(alloc);
      return acc;
    }, {});
  }, [allocations]);

  // Map allocations into a flat list sorted for VTU Seating Sheet (Image 2 Style)
  const sheetRows = useMemo(() => {
    const seenUSNs = new Set();
    const rows = [];
    
    allocations.forEach((alloc) => {
      const usn = alloc.studentUSN || alloc.studentId?.usn;
      if (!usn) return;
      
      const usnUpper = usn.toUpperCase();
      if (seenUSNs.has(usnUpper)) return; // Deduplicate!
      
      seenUSNs.add(usnUpper);
      const branchCode = getBranchCode(alloc.studentId?.department);
      
      rows.push({
        usn: usn,
        name: alloc.studentId?.name || '—',
        semester: alloc.studentId?.semester || selectedSemester,
        branch: branchCode,
        roomNo: alloc.hallId?.hallName || '—',
        seatNo: `${alloc.benchNumber}${alloc.seatPosition === 'left' ? 'L' : 'R'}`,
        original: alloc
      });
    });

    return rows
      .filter(row => selectedBranch === 'all' || row.branch === selectedBranch)
      .sort((a, b) => {
        // Sort by Branch, then by Room No, then by Seat No
        const branchComp = a.branch.localeCompare(b.branch);
        if (branchComp !== 0) return branchComp;
        const roomComp = a.roomNo.localeCompare(b.roomNo);
        if (roomComp !== 0) return roomComp;
        return a.seatNo.localeCompare(b.seatNo, undefined, { numeric: true });
      });
  }, [allocations, selectedBranch, selectedSemester]);

  // Extract unique branches present in this allotment
  const uniqueBranches = useMemo(() => {
    const branches = new Set(allocations.map(a => getBranchCode(a.studentId?.department)));
    return Array.from(branches).sort();
  }, [allocations]);

  const dateRangeStr = useMemo(() => {
    if (exams.length === 0) return '—';
    const dates = exams.map(e => new Date(e.examDate)).filter(d => !isNaN(d));
    if (dates.length === 0) return '—';
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    const format = (d) => d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
    return `${format(minDate)} to ${format(maxDate)}`;
  }, [exams]);

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
            Seating & Hall Allotments
          </h1>
          <p className="text-[#5C5C5C] text-sm">
            Seat layouts and student classroom allocations matching VTU assessment sheets.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Semester Selector */}
          <select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none text-sm bg-white font-semibold">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
              <option key={sem} value={sem}>Semester {sem}</option>
            ))}
          </select>

          {/* Decoupled Run Seating Allocation Agent Button */}
          <Button onClick={() => setShowAgentModal(true)} disabled={runningAgent || exams.length === 0} variant="gold" className="flex items-center gap-1.5 font-bold">
            {runningAgent ? <Loader className="animate-spin" size={16} /> : <Play size={16} />}
            Generate Seating Allotments
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      {allocations.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-gray-100 shadow-sm print:hidden">
          <Users size={48} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-[#1A1A1A] mb-1">No seating allotments generated</h3>
          <p className="text-[#5C5C5C] text-sm mb-6">First configure and confirm the timetable, then click 'Generate Seating Allotments' to allocate students to desks.</p>
          <Button onClick={() => setShowAgentModal(true)} variant="gold"><Play size={16} className="inline mr-1.5" />Generate Seating Allotments</Button>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Tab Selector & Controls (Hidden during print) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4 print:hidden">
            <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-xl self-start">
              <button
                onClick={() => setViewMode('sheet')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${viewMode === 'sheet' ? 'bg-white text-[#1E3A5F] shadow-sm' : 'text-[#5C5C5C] hover:text-[#1A1A1A]'}`}
              >
                <Clipboard size={14} /> Branch Allotment Details
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${viewMode === 'grid' ? 'bg-white text-[#1E3A5F] shadow-sm' : 'text-[#5C5C5C] hover:text-[#1A1A1A]'}`}
              >
                <LayoutGrid size={14} /> Bench Grid Layout
              </button>
            </div>

            <div className="flex items-center gap-3">
              {viewMode === 'sheet' && (
                <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs bg-white font-semibold">
                  <option value="all">All Branches</option>
                  {uniqueBranches.map(br => (
                    <option key={br} value={br}>{br} Branch</option>
                  ))}
                </select>
              )}

              <Button onClick={handlePrint} variant="ghost" className="flex items-center gap-2 border border-gray-300 font-semibold text-xs">
                <Printer size={14} /> Print Allotment Details
              </Button>
            </div>
          </div>

          {/* VIEW MODE 1: SHEET VIEW (Image 2 format) */}
          {viewMode === 'sheet' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm print:shadow-none print:border-none print:p-0">
              
              {/* Printable Header Block */}
              <div className="text-center mb-6 border-b-2 border-[#1E3A5F] pb-4">
                <h2 className="text-xl font-bold font-display text-[#1E3A5F] uppercase">P.E.S. Institute of Technology & Management, Shivamogga</h2>
                <p className="text-[10px] font-semibold text-[#5C5C5C] tracking-wide">AFFILIATED TO VTU, BELAGAVI</p>
                <h3 className="text-sm font-bold text-[#C9A227] uppercase tracking-wider mt-2">Centralized IA Examination Seating</h3>
                
                <div className="flex justify-center flex-wrap gap-4 text-xs font-bold text-gray-500 mt-2">
                  <span>Academic Year: 2025-26</span>
                  <span>•</span>
                  <span>Test: IA - II</span>
                  <span>•</span>
                  <span>Test Date: {dateRangeStr}</span>
                  <span>•</span>
                  <span>Branch: {selectedBranch === 'all' ? 'All Branches' : `${selectedBranch}`}</span>
                </div>
              </div>

              {/* Branch Allotment Details Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-700">
                      <th className="border border-gray-300 px-4 py-2 text-center font-bold text-xs w-16">Sl. No.</th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-bold text-xs w-36">USN</th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-bold text-xs">Student Name</th>
                      <th className="border border-gray-300 px-4 py-2 text-center font-bold text-xs w-16">Sem.</th>
                      <th className="border border-gray-300 px-4 py-2 text-center font-bold text-xs w-20">Branch</th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-bold text-xs w-28">Room No.</th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-bold text-xs w-28">Seat No.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sheetRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 transition">
                        <td className="border border-gray-300 px-4 py-2 text-center text-xs font-medium text-[#5C5C5C]">{idx + 1}</td>
                        <td className="border border-gray-300 px-4 py-2 text-xs font-mono font-bold text-[#1E3A5F]">{row.usn}</td>
                        <td className="border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-800">{row.name}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center text-xs text-gray-600">{row.semester}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center text-xs font-bold text-gray-700">{row.branch}</td>
                        <td className="border border-gray-300 px-4 py-2 text-xs font-bold text-[#C9A227]">{row.roomNo}</td>
                        <td className="border border-gray-300 px-4 py-2 text-xs font-bold text-purple-700">{row.seatNo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW MODE 2: BENCH GRID LAYOUT */}
          {viewMode === 'grid' && (
            <div className="space-y-8">
              {Object.values(groupedAllocationsForGrid).map(({ exam, halls }) => (
                <div key={exam._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
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

                  <div className="grid grid-cols-1 gap-8">
                    {Object.values(halls).map(({ hall, students }) => {
                      const cap = hall.capacity || 40;
                      const usagePct = Math.min(100, Math.round((students.length / cap) * 100));
                      
                      return (
                        <div key={hall._id} className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
                            <div className="flex items-center gap-2">
                              <Landmark className="text-[#C9A227]" size={20} />
                              <div>
                                <h3 className="font-bold text-[#1A1A1A] text-md">{hall.hallName || 'Hall'}</h3>
                                <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">{hall.building || 'Main Block'}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <div className="w-28 bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div className="bg-[#1E3A5F] h-full" style={{ width: `${usagePct}%` }} />
                              </div>
                              <span className="text-xs font-bold text-gray-700 bg-white border border-gray-200 px-2 py-1 rounded-lg">
                                {students.length} / {cap} Seats Allocated
                              </span>
                            </div>
                          </div>

                          {/* Bench seating layout grid */}
                          {(() => {
                            const groupedByBench = students.reduce((benchAcc, alloc) => {
                              const bNum = alloc.benchNumber || 1;
                              if (!benchAcc[bNum]) {
                                benchAcc[bNum] = { left: null, right: null };
                              }
                              if (alloc.seatPosition === 'right') {
                                benchAcc[bNum].right = alloc;
                              } else {
                                benchAcc[bNum].left = alloc;
                              }
                              return benchAcc;
                            }, {});

                            return (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Object.entries(groupedByBench)
                                  .sort(([a], [b]) => parseInt(a) - parseInt(b))
                                  .map(([bNum, seats]) => (
                                    <div key={bNum} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                                      <div className="text-xs font-bold text-[#5C5C5C] border-b border-gray-100 pb-1.5 mb-3 uppercase tracking-wider flex justify-between items-center">
                                        <span>Bench {bNum}</span>
                                        <span className="text-[10px] text-purple-600 bg-purple-50 px-2 py-0.5 rounded font-bold">Desk Pair</span>
                                      </div>
                                      <div className="grid grid-cols-2 gap-3 divide-x divide-gray-100">
                                        {/* Left Seat */}
                                        <div className="pr-2">
                                          <span className="text-[9px] font-bold text-gray-400 block uppercase">Left ({bNum}L)</span>
                                          {seats.left ? (
                                            <div className="mt-1">
                                              <span className="text-xs font-bold text-[#5B21B6] block truncate">{seats.left.studentUSN || seats.left.studentId?.usn}</span>
                                              <span className="text-xs font-semibold text-[#1A1A1A] block truncate">{seats.left.studentId?.name}</span>
                                              <span className="text-[10px] text-gray-500 block truncate">{getBranchCode(seats.left.studentId?.department)}</span>
                                              {seats.left.subjectCode && <span className="text-[9px] font-mono font-bold text-[#1E3A5F] bg-blue-50 px-1.5 py-0.5 rounded mt-1 inline-block">{seats.left.subjectCode}</span>}
                                            </div>
                                          ) : (
                                            <span className="text-xs text-gray-300 italic block mt-1">Empty Seat</span>
                                          )}
                                        </div>
                                        {/* Right Seat */}
                                        <div className="pl-3">
                                          <span className="text-[9px] font-bold text-gray-400 block uppercase">Right ({bNum}R)</span>
                                          {seats.right ? (
                                            <div className="mt-1">
                                              <span className="text-xs font-bold text-[#5B21B6] block truncate">{seats.right.studentUSN || seats.right.studentId?.usn}</span>
                                              <span className="text-xs font-semibold text-[#1A1A1A] block truncate">{seats.right.studentId?.name}</span>
                                              <span className="text-[10px] text-gray-500 block truncate">{getBranchCode(seats.right.studentId?.department)}</span>
                                              {seats.right.subjectCode && <span className="text-[9px] font-mono font-bold text-[#1E3A5F] bg-blue-50 px-1.5 py-0.5 rounded mt-1 inline-block">{seats.right.subjectCode}</span>}
                                            </div>
                                          ) : (
                                            <span className="text-xs text-gray-300 italic block mt-1">Empty Seat</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* Constraints Modal for seating allocation agent */}
      {showAgentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-[#1E3A5F] px-6 py-4 text-white flex items-center gap-2">
              <Settings size={20} className="text-[#C9A227]" />
              <h2 className="text-lg font-bold">Generate Seating Allocations</h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-[#5C5C5C]">
                Running this seating agent maps students from scheduled exams for **Semester {selectedSemester}** into physical rooms.
              </p>
              <div>
                <label className="block text-sm font-semibold text-[#1A1A1A] mb-1.5">Hall Fill Capacity Limit (%)</label>
                <input
                  type="number"
                  value={fillPct}
                  onChange={(e) => setFillPct(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  min="50"
                  max="100"
                />
                <small className="text-xs text-gray-400 mt-1 block">Prevents seating overcrowding (anti-malpractice space). Recommended: 70%.</small>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <Button onClick={() => setShowAgentModal(false)} variant="ghost" className="flex-1">Cancel</Button>
                <Button onClick={handleRunSeatingAllocation} variant="gold" className="flex-1 font-bold">
                  Run Seating Agent
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HallAllocations;
