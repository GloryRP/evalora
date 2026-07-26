/**
 * Timetable Page — Grouped Table Layout (Image 1 Style)
 * View scheduled exams in a structured multi-branch timetable with print styles.
 */
import { useState, useEffect, useMemo } from 'react';
import { Calendar, Download, Loader, Clock, Printer, ChevronRight } from 'lucide-react';
import api from '../../lib/api';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

const getBranchCode = (dept) => {
  if (!dept) return '—';
  const clean = dept.toLowerCase().trim();
  if (clean.includes('computer science')) return 'CS';
  if (clean.includes('artificial intelligence') || clean.clean?.includes('ai')) return 'AI';
  if (clean.includes('information science') || clean.includes('is')) return 'IS';
  if (clean.includes('electronics') || clean.includes('ec')) return 'EC';
  if (clean.includes('electrical') || clean.includes('eee')) return 'EEE';
  if (clean.includes('mechanical') || clean.includes('me')) return 'ME';
  if (clean.includes('civil') || clean.includes('cv')) return 'CV';
  if (clean.includes('chemical') || clean.includes('ch')) return 'CH';
  if (clean.includes('data science') || clean.includes('cd')) return 'CD';
  
  return dept.split(' ').map(w => w[0]).join('').toUpperCase();
};

const Timetable = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [filter, setFilter] = useState({ semester: '5' });

  useEffect(() => {
    fetchTimetable();
  }, [filter]);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const params = filter.semester !== 'all' ? { semester: filter.semester } : {};
      const response = await api.get('/examcell/timetable', { params });
      setExams(response.data.data);
    } catch (error) {
      console.error('Error fetching timetable:', error);
      toast.error('Failed to load exam timetable');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloadingPDF(true);
      const semester = filter.semester !== 'all' ? filter.semester : '5';
      
      const response = await api.get(`/timetable/pdf?semester=${semester}&examType=regular`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Timetable-Sem${semester}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Timetable PDF downloaded successfully!');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download timetable PDF');
    } finally {
      setDownloadingPDF(false);
    }
  };

  // Construct tabular spans for date and slots
  const tableRows = useMemo(() => {
    const groups = {};
    exams.forEach(exam => {
      const dateStr = new Date(exam.examDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
      const timeStr = `${exam.startTime} to ${exam.endTime}`;
      if (!groups[dateStr]) groups[dateStr] = {};
      if (!groups[dateStr][timeStr]) groups[dateStr][timeStr] = [];
      groups[dateStr][timeStr].push(exam);
    });

    const rows = [];
    const sortedDates = Object.keys(groups).sort((a, b) => {
      const partsA = a.split('-');
      const partsB = b.split('-');
      return new Date(partsA[2], partsA[1] - 1, partsA[0]) - new Date(partsB[2], partsB[1] - 1, partsB[0]);
    });

    sortedDates.forEach(date => {
      const slots = groups[date];
      const sortedSlots = Object.keys(slots).sort();
      
      const totalDateRows = sortedSlots.reduce((sum, slot) => sum + slots[slot].length, 0);
      
      let isFirstSlotForDate = true;
      sortedSlots.forEach(slot => {
        const slotExams = slots[slot];
        const totalSlotRows = slotExams.length;
        
        let isFirstExamForSlot = true;
        slotExams.forEach(exam => {
          rows.push({
            exam,
            date,
            slot,
            dateRowSpan: isFirstSlotForDate && isFirstExamForSlot ? totalDateRows : 0,
            slotRowSpan: isFirstExamForSlot ? totalSlotRows : 0,
            isNewDate: isFirstSlotForDate && isFirstExamForSlot,
            isNewSlot: isFirstExamForSlot
          });
          isFirstExamForSlot = false;
        });
        isFirstSlotForDate = false;
      });
    });

    return rows;
  }, [exams]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        <LoadingSkeleton count={4} />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header controls (hidden during print) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 print:hidden">
        <div>
          <h1 className="text-3xl font-display font-bold text-[#1A1A1A] mb-1">
            Exam Timetable
          </h1>
          <p className="text-[#5C5C5C] text-sm">
            Structured timetable output matching VTU assessment sheets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select value={filter.semester} onChange={(e) => setFilter({ semester: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none text-sm bg-white font-medium">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
              <option key={sem} value={sem}>Semester {sem}</option>
            ))}
          </select>

          <Button onClick={handlePrint} variant="ghost" className="flex items-center gap-2 border border-gray-300">
            <Printer size={16} /> Print Timetable
          </Button>

          <Button onClick={handleDownloadPDF} disabled={downloadingPDF || exams.length === 0} variant="gold" className="flex items-center gap-2 font-semibold">
            {downloadingPDF ? <Loader size={16} className="animate-spin" /> : <Download size={16} />}
            Download PDF
          </Button>
        </div>
      </div>

      {/* Main Timetable Document */}
      {tableRows.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-gray-100 shadow-sm print:hidden">
          <Calendar size={48} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-[#1A1A1A] mb-1">No exam schedules generated</h3>
          <p className="text-[#5C5C5C] text-sm">Run the AI scheduler wizard to schedule exam slots first.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm print:shadow-none print:border-none print:p-0">
          
          {/* PES Institute Heading Section */}
          <div className="text-center mb-8 border-b-2 border-[#1E3A5F] pb-4">
            <h2 className="text-2xl font-bold font-display text-[#1E3A5F] uppercase">PES Institute of Technology & Management</h2>
            <p className="text-xs font-semibold text-[#5C5C5C] tracking-wide">NH-206, SAGAR ROAD, SHIVAMOGGA - 577204</p>
            <h3 className="text-md font-bold text-[#C9A227] uppercase tracking-wider mt-3">Centralized Internal Assessment Test</h3>
            <p className="text-sm font-semibold text-[#1A1A1A] mt-1">
              Time Table (BE All Branches — Semester {filter.semester})
            </p>
            <div className="flex justify-center gap-4 text-xs font-bold text-gray-500 mt-1">
              <span>Academic Year: 2025-26</span>
              <span>•</span>
              <span>Test: IA - II</span>
            </div>
          </div>

          {/* Unified Timetable Grid */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className="bg-[#1E3A5F]/5">
                  <th className="border border-gray-300 px-4 py-3 text-left font-bold text-[#1E3A5F] w-32">Date</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-bold text-[#1E3A5F] w-40">Time</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-bold text-[#1E3A5F] w-20">Branch</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-bold text-[#1E3A5F] w-36">Specific Subject Code</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-bold text-[#1E3A5F]">Subject Name</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition duration-75">
                    {row.dateRowSpan > 0 && (
                      <td rowSpan={row.dateRowSpan} className="border border-gray-300 px-4 py-3 font-bold text-[#1E3A5F] align-top bg-white">
                        {row.date}
                      </td>
                    )}
                    {row.slotRowSpan > 0 && (
                      <td rowSpan={row.slotRowSpan} className="border border-gray-300 px-4 py-3 font-semibold text-gray-700 align-top bg-white">
                        {row.slot}
                      </td>
                    )}
                    <td className="border border-gray-300 px-2 py-3 text-center font-bold text-gray-700">
                      {getBranchCode(row.exam.subjectId?.department)}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 font-mono font-bold text-[#5B21B6]">
                      {row.exam.subjectId?.subjectCode}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 font-medium text-gray-800">
                      {row.exam.subjectId?.subjectName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Verification stamp row for printout */}
          <div className="hidden print:flex justify-end mt-16 text-right">
            <div className="border border-gray-300 p-4 rounded-lg inline-block text-center bg-gray-50/50">
              <div className="w-16 h-16 rounded-full border-4 border-dashed border-[#1E3A5F]/30 mx-auto mb-2 flex items-center justify-center text-[10px] font-bold text-[#1E3A5F]/40 rotate-12">
                EXAM CELL
              </div>
              <p className="text-xs font-bold text-[#1E3A5F]">EXAM CONTROLLER</p>
              <p className="text-[10px] text-[#5C5C5C]">PESITM Shimoga</p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default Timetable;
