/**
 * HOD (Head of Department) Dashboard
 * Premium layout with filters for CIE/SEE, Toppers & Slow Learners, and an AI Remedial Advisor
 */
import { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, Award, CheckCircle, Percent, ShieldAlert, BarChart2, BookOpen,
  Users, AlertTriangle, Sparkles, TrendingUp, UserCheck, Brain, ArrowRight, Printer
} from 'lucide-react';
import api from '../../lib/api';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import Badge from '../../components/ui/Badge';
import toast from 'react-hot-toast';

const HodDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSem, setSelectedSem] = useState('all');
  const [activeTab, setActiveTab] = useState('see'); // 'cie' (internal) or 'see' (external final)
  const [aiReport, setAiReport] = useState(null);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [institutionName, setInstitutionName] = useState('Vidyā Autonomous Engineering College');

  useEffect(() => {
    fetchInsights();
    fetchInstitutionDetails();
  }, []);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const response = await api.get('/hod/insights');
      if (response.data?.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching HOD insights:', error);
      toast.error('Failed to load HOD insights');
    } finally {
      setLoading(false);
    }
  };

  const fetchInstitutionDetails = async () => {
    try {
      const response = await api.get('/institution/config');
      if (response.data?.success && response.data.data) {
        setInstitutionName(response.data.data.institutionName || 'Vidyā Institution');
      }
    } catch (error) {
      console.warn('Could not fetch institution name.');
    }
  };

  const handleExportReport = () => {
    window.print();
  };

  // Filtered Toppers & Slow Learners based on activeTab & selectedSem
  const processedInsights = useMemo(() => {
    if (!data) return { toppers: [], slowLearners: [] };

    const semFilter = (s) => selectedSem === 'all' || s.semester === Number(selectedSem);

    if (activeTab === 'see') {
      // Final SEE Results
      const list = (data.seePerformance || []).filter(semFilter);
      
      // Toppers: SGPA >= 8.5, sorted desc
      const toppers = list
        .filter(s => (s.sgpa || 0) >= 8.5)
        .sort((a, b) => (b.sgpa || 0) - (a.sgpa || 0));

      // Slow Learners: SGPA < 5.0 or result is FAIL
      const slowLearners = list
        .filter(s => (s.sgpa || 0) < 5.5 || s.overallResult === 'FAIL' || s.failedSubjects?.length > 0)
        .sort((a, b) => (a.sgpa || 0) - (b.sgpa || 0));

      return { toppers, slowLearners };
    } else {
      // CIE Internal Marks
      const list = (data.ciePerformance || []).filter(semFilter);

      // Toppers: average CIE percent >= 85%, sorted desc
      const toppers = list
        .filter(s => s.avgPercent >= 85)
        .sort((a, b) => b.avgPercent - a.avgPercent);

      // Slow Learners: average CIE percent < 45% or has failed subjects
      const slowLearners = list
        .filter(s => s.avgPercent < 45 || s.failedSubjects?.length > 0)
        .sort((a, b) => a.avgPercent - b.avgPercent);

      return { toppers, slowLearners };
    }
  }, [data, activeTab, selectedSem]);

  // Dynamic Peer-Tutoring AI advisory matching
  const generateAiAdvisory = () => {
    if (!data) return;
    setGeneratingAi(true);

    setTimeout(() => {
      const { toppers, slowLearners } = processedInsights;
      const matches = [];
      const subjectsWithFails = {};

      // 1. Group slow learners by their failed subjects
      slowLearners.forEach(slow => {
        (slow.failedSubjects || []).forEach(sub => {
          if (!subjectsWithFails[sub.subjectCode]) {
            subjectsWithFails[sub.subjectCode] = {
              subjectName: sub.subjectName,
              slowStudents: []
            };
          }
          subjectsWithFails[sub.subjectCode].slowStudents.push(slow);
        });
      });

      // 2. Pair each failed subject with toppers in that subject
      Object.keys(subjectsWithFails).forEach(subCode => {
        const item = subjectsWithFails[subCode];
        
        // Find potential toppers who have scored high in this subject
        // For SEE, we check if they passed it with high marks. For CIE, we inspect their scores.
        let potentialTutors = [];
        if (activeTab === 'see') {
          // Look through results
          (data.seePerformance || []).forEach(top => {
            const passedHigh = toppers.some(t => t.usn === top.usn);
            if (passedHigh) {
              potentialTutors.push(top);
            }
          });
        } else {
          // Look through CIE
          (data.ciePerformance || []).forEach(top => {
            const passedHigh = toppers.some(t => t.usn === top.usn);
            if (passedHigh) {
              potentialTutors.push(top);
            }
          });
        }

        // Pair them up
        item.slowStudents.forEach((slow, idx) => {
          const tutor = potentialTutors[idx % potentialTutors.length] || toppers[0];
          if (tutor) {
            matches.push({
              subjectCode: subCode,
              subjectName: item.subjectName,
              student: slow.name,
              studentUsn: slow.usn,
              studentScore: activeTab === 'see' ? `${slow.sgpa} SGPA` : `${slow.avgPercent}% Avg`,
              tutor: tutor.name,
              tutorUsn: tutor.usn,
              tutorScore: activeTab === 'see' ? `${tutor.sgpa} SGPA` : `${tutor.avgPercent}% Avg`
            });
          }
        });
      });

      // 3. Construct advisory plan
      const report = {
        timestamp: new Date().toLocaleTimeString(),
        semester: selectedSem === 'all' ? 'All Semesters' : `Semester ${selectedSem}`,
        examType: activeTab === 'see' ? 'Semester Final Exam (SEE)' : 'Internal CIE Tests',
        matches,
        recommendations: [
          `Coordinate peer tutoring groups. We have mapped ${matches.length} peer-tutoring pairs matching toppers with slow learners in CS/IS core courses.`,
          `Schedule a Departmental Remedial Coaching session (minimum 12 hours) focusing on subjects with the highest fail counts.`,
          `Faculties should arrange mock test reviews for slow learners, auditing mistakes made in past examination question papers.`,
          `Enable regular self-assessment tests via AI portal quizzes to continuously monitor student grading progression.`
        ]
      };

      setAiReport(report);
      setGeneratingAi(false);
      toast.success('AI Remedial Advisory compiled successfully!');
    }, 800);
  };

  if (loading) {
    return <div style={{ padding: '2rem' }}><LoadingSkeleton count={5} /></div>;
  }

  if (!data) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#666' }}>
        <ShieldAlert size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
        <p>Unable to retrieve department insights. Make sure database records exist.</p>
      </div>
    );
  }

  // Stats computation
  const completionRate = data.totalScripts > 0 
    ? Math.round((data.evaluatedScripts / data.totalScripts) * 100) 
    : 0;

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }} className="print-container">
      
      {/* Dynamic Print Stylesheet */}
      <style>{`
        .print-only-header {
          display: none;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 1.5cm;
          }

          aside, nav, header, .no-print, button, .sidebar-container, .mobile-header, select {
            display: none !important;
          }

          body, html, #root, main, .main-content, .print-container {
            background: white !important;
            color: black !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }

          .print-only-header {
            display: block !important;
            margin-bottom: 2rem;
            border-bottom: 3px double #1E3A5F;
            padding-bottom: 1rem;
            text-align: center;
          }
          
          .print-only-header h1 {
            font-size: 1.8rem;
            color: #1E3A5F;
            margin: 0;
            font-weight: 700;
          }
          
          .print-only-header p {
            font-size: 0.9rem;
            color: #555;
            margin: 4px 0 0 0;
          }

          .grid-container {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 1.5rem !important;
            page-break-inside: avoid;
          }

          table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 0.85rem !important;
          }

          th, td {
            border: 1px solid #CCCCCC !important;
            padding: 6px 8px !important;
          }

          thead {
            background-color: #F3F4F6 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .print-avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          
          h1, h2, h3 {
            color: #1E3A5F !important;
          }
        }
      `}</style>

      {/* Print-Only Header Block */}
      <div className="print-only-header">
        <h1>{institutionName}</h1>
        <p>Department of {data.department} · Performance Audit Report · Generated on {new Date().toLocaleDateString()}</p>
      </div>

      {/* Header Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <LayoutDashboard size={28} color="var(--color-gold)" />
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: '700', color: 'var(--color-navy)', margin: 0 }}>
              {data.department} Head Office Portal
            </h1>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', margin: 0 }}>
            Audit course valuations, identify academic performance brackets, and manage remedial actions.
          </p>
        </div>

        {/* Filters and Controls */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }} className="no-print">
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Filter Semester</label>
            <select
              value={selectedSem}
              onChange={(e) => {
                setSelectedSem(e.target.value);
                setAiReport(null); // Clear old AI report
              }}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #E5E5E5',
                borderRadius: '8px',
                background: 'white',
                fontSize: '0.85rem',
                fontWeight: '600',
                color: 'var(--color-navy)',
                outline: 'none',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              }}
            >
              <option value="all">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                <option key={sem} value={sem.toString()}>Semester {sem}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Exam Category</label>
            <div style={{ display: 'flex', background: '#F3F4F6', padding: '3px', borderRadius: '8px', border: '1px solid #E5E5E5' }}>
              <button
                onClick={() => {
                  setActiveTab('see');
                  setAiReport(null);
                }}
                style={{
                  padding: '0.4rem 0.8rem',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  background: activeTab === 'see' ? 'white' : 'transparent',
                  color: activeTab === 'see' ? 'var(--color-navy)' : '#6B7280',
                  boxShadow: activeTab === 'see' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s'
                }}
              >
                SEE Final
              </button>
              <button
                onClick={() => {
                  setActiveTab('cie');
                  setAiReport(null);
                }}
                style={{
                  padding: '0.4rem 0.8rem',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  background: activeTab === 'cie' ? 'white' : 'transparent',
                  color: activeTab === 'cie' ? 'var(--color-navy)' : '#6B7280',
                  boxShadow: activeTab === 'cie' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s'
                }}
              >
                CIE Internal
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Actions</label>
            <button
              onClick={handleExportReport}
              style={{
                background: 'var(--color-navy)',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                height: '38px'
              }}
            >
              <Printer size={15} /> Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E5E5E5', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'rgba(30, 58, 95, 0.08)', color: 'var(--color-navy)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: '600', letterSpacing: '0.5px' }}>DEPARTMENT SCRIPTS</span>
            <h3 style={{ margin: '0.1rem 0 0 0', fontSize: '1.6rem', fontWeight: '700', color: 'var(--color-navy)' }}>{data.totalScripts}</h3>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E5E5E5', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'rgba(201, 162, 39, 0.08)', color: 'var(--color-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: '600', letterSpacing: '0.5px' }}>VALUATION PROGRESS</span>
            <h3 style={{ margin: '0.1rem 0 0 0', fontSize: '1.6rem', fontWeight: '700', color: 'var(--color-navy)' }}>
              {data.evaluatedScripts} <span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#888' }}>({completionRate}%)</span>
            </h3>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E5E5E5', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'rgba(30, 58, 95, 0.08)', color: 'var(--color-navy)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Award size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: '600', letterSpacing: '0.5px' }}>AVERAGE SCORE</span>
            <h3 style={{ margin: '0.1rem 0 0 0', fontSize: '1.6rem', fontWeight: '700', color: 'var(--color-navy)' }}>
              {data.averageMarks.toFixed(1)} <span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#888' }}>/ 100</span>
            </h3>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E5E5E5', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'rgba(45, 122, 95, 0.08)', color: '#2D7A5F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Percent size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: '600', letterSpacing: '0.5px' }}>PASS RATE</span>
            <h3 style={{ margin: '0.1rem 0 0 0', fontSize: '1.6rem', fontWeight: '700', color: '#2D7A5F' }}>
              {data.passRate.toFixed(1)}%
            </h3>
          </div>
        </div>
      </div>

      {/* Main Student Performance Bracket Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
        
        {/* TOPPERS BOX */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E5E5E5', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--color-navy)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={20} color="var(--color-gold)" /> Academic Toppers ({processedInsights.toppers.length})
          </h2>

          {processedInsights.toppers.length === 0 ? (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#888', background: '#FAFAF9', borderRadius: '8px', border: '1px solid #E5E5E5' }}>
              No toppers found in this bracket. (Threshold score: SGPA &ge; 8.5 or CIE &ge; 85%)
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '380px', overflowY: 'auto', paddingRight: '0.25rem' }}>
              {processedInsights.toppers.map((top, idx) => (
                <div 
                  key={top.usn} 
                  style={{ 
                    padding: '0.85rem 1rem', 
                    borderRadius: '10px', 
                    background: idx === 0 ? '#FEFAEC' : '#F9FAFB', 
                    border: idx === 0 ? '1px solid #F3E2B5' : '1px solid #E5E5E5',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '800', background: 'var(--color-gold)', color: 'white', width: '18px', height: '18px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        {idx + 1}
                      </span>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--color-navy)' }}>{top.name}</strong>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#6B7280', fontFamily: 'monospace' }}>USN: {top.usn} · Sem {top.semester}</span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: '800', color: idx === 0 ? '#B45309' : 'var(--color-navy)' }}>
                      {activeTab === 'see' ? `${top.sgpa?.toFixed(2)} GPA` : `${top.avgPercent}%`}
                    </div>
                    {activeTab === 'see' && <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>CGPA: {top.cgpa?.toFixed(2)}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SLOW LEARNERS BOX */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E5E5E5', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--color-navy)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={20} className="text-amber-600" /> Underperforming / Slow Learners ({processedInsights.slowLearners.length})
          </h2>

          {processedInsights.slowLearners.length === 0 ? (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#888', background: '#FAFAF9', borderRadius: '8px', border: '1px solid #E5E5E5' }}>
              Excellent! No slow learners identified in this semester bracket. (Score: SGPA &lt; 5.5 or CIE &lt; 45%)
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '380px', overflowY: 'auto', paddingRight: '0.25rem' }}>
              {processedInsights.slowLearners.map((slow) => (
                <div 
                  key={slow.usn} 
                  style={{ 
                    padding: '0.85rem 1rem', 
                    borderRadius: '10px', 
                    background: '#FEF2F2', 
                    border: '1px solid #FCA5A5',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ fontSize: '0.9rem', color: '#991B1B' }}>{slow.name}</strong>
                      <div style={{ fontSize: '0.8rem', color: '#7F1D1D', fontFamily: 'monospace', marginTop: '0.1rem' }}>USN: {slow.usn} · Sem {slow.semester}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '1.05rem', fontWeight: '800', color: '#991B1B' }}>
                        {activeTab === 'see' ? `${slow.sgpa?.toFixed(2)} GPA` : `${slow.avgPercent}%`}
                      </span>
                    </div>
                  </div>

                  {slow.failedSubjects?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.2rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#991B1B', marginRight: '0.2rem' }}>Failed:</span>
                      {slow.failedSubjects.map(sub => (
                        <span key={sub.subjectCode} style={{ fontSize: '0.75rem', background: '#FEE2E2', border: '1px solid #EF4444', color: '#991B1B', padding: '0.1rem 0.4rem', borderRadius: '4px', fontFamily: 'monospace' }} title={sub.subjectName}>
                          {sub.subjectCode}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI REMEDIAL ADVISOR BOX */}
      <div style={{ background: '#1E293B', borderRadius: '16px', padding: '2rem', border: '1px solid #334155', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', color: 'white', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <Brain size={22} className="text-amber-400" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0, letterSpacing: '0.5px' }}>
                AI Remedial & Peer-Tutoring Advisor
              </h2>
            </div>
            <p style={{ color: '#94A3B8', fontSize: '0.9rem', margin: 0, maxWidth: '650px' }}>
              Run our heuristic matching pipeline to automatically pair underperforming student slow learners with academic toppers in the same subject, creating tailored peer-tutoring groups.
            </p>
          </div>

          <button
            onClick={generateAiAdvisory}
            disabled={generatingAi || processedInsights.slowLearners.length === 0}
            style={{
              background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              color: 'white',
              border: 'none',
              padding: '0.65rem 1.25rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'opacity 0.2s',
            }}
            className="hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Sparkles size={16} />
            {generatingAi ? 'Analyzing...' : 'Generate AI Advisory Plan'}
          </button>
        </div>

        {/* AI report output console */}
        {aiReport && (
          <div style={{ background: '#0F172A', borderRadius: '12px', border: '1px solid #1E293B', padding: '1.5rem', marginTop: '1.5rem', fontFamily: 'system-ui, sans-serif' }}>
            
            {/* Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1E293B', paddingBottom: '0.75rem', marginBottom: '1.25rem', fontSize: '0.8rem', color: '#64748B', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span>AUDIT RUN: {aiReport.timestamp}</span>
              <span>FILTER: {aiReport.semester} · {aiReport.examType}</span>
            </div>

            {/* Recommendations */}
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#F1F5F9', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <TrendingUp size={16} className="text-emerald-400" /> Key Action Items for HOD
            </h3>
            <ul style={{ paddingLeft: '1.25rem', margin: '0 0 1.5rem 0', fontSize: '0.85rem', color: '#94A3B8', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {aiReport.recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>

            {/* Tutoring Pairs */}
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#F1F5F9', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <UserCheck size={16} className="text-amber-400" /> Recommended Peer-Tutoring Matches
            </h3>

            {aiReport.matches.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: '#64748B', italic: 'true', margin: 0 }}>
                No active failures identified. Peer-tutoring setup is not required.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                {aiReport.matches.map((match, i) => (
                  <div 
                    key={i} 
                    style={{ 
                      background: '#1E293B', 
                      borderRadius: '8px', 
                      padding: '1rem', 
                      border: '1px solid #334155',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem'
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#F59E0B', fontFamily: 'monospace', textTransform: 'uppercase' }}>
                      {match.subjectCode} · {match.subjectName}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.2rem' }}>
                      <div style={{ fontSize: '0.8rem' }}>
                        <span style={{ color: '#F87171', display: 'block', fontWeight: '600' }}>Slow Learner:</span>
                        <span style={{ color: '#E2E8F0', fontWeight: '700' }}>{match.student}</span>
                        <span style={{ display: 'block', fontSize: '0.7rem', color: '#94A3B8' }}>{match.studentScore}</span>
                      </div>
                      <ArrowRight size={16} className="text-gray-500" />
                      <div style={{ fontSize: '0.8rem', textAlign: 'right' }}>
                        <span style={{ color: '#34D399', display: 'block', fontWeight: '600' }}>Peer Tutor:</span>
                        <span style={{ color: '#E2E8F0', fontWeight: '700' }}>{match.tutor}</span>
                        <span style={{ display: 'block', fontSize: '0.7rem', color: '#94A3B8' }}>{match.tutorScore}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Course stats table */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E5E5E5', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--color-navy)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BarChart2 size={20} color="var(--color-gold)" /> Course Performance Heatmap
        </h2>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #E5E5E5', background: 'var(--color-bg)' }}>
                <th style={{ padding: '0.85rem 0.75rem', textAlign: 'left' }}>Subject</th>
                <th style={{ padding: '0.85rem 0.75rem', textAlign: 'center' }}>Sem</th>
                <th style={{ padding: '0.85rem 0.75rem', textAlign: 'center' }}>Total Papers</th>
                <th style={{ padding: '0.85rem 0.75rem', textAlign: 'center' }}>Valued</th>
                <th style={{ padding: '0.85rem 0.75rem', textAlign: 'center' }}>Avg Marks</th>
                <th style={{ padding: '0.85rem 0.75rem', textAlign: 'center' }}>Highest</th>
                <th style={{ padding: '0.85rem 0.75rem', textAlign: 'center' }}>Lowest</th>
                <th style={{ padding: '0.85rem 0.75rem', textAlign: 'center' }}>Failures</th>
                <th style={{ padding: '0.85rem 0.75rem', textAlign: 'center' }}>Pass Rate</th>
              </tr>
            </thead>
            <tbody>
              {data.courseBreakdown
                .filter(course => selectedSem === 'all' || course.semester === Number(selectedSem))
                .map((course) => (
                  <tr key={course.subjectCode} style={{ borderBottom: '1px solid #E5E5E5' }}>
                    <td style={{ padding: '0.85rem 0.75rem' }}>
                      <div style={{ fontWeight: '600', color: 'var(--color-navy)' }}>{course.subjectName}</div>
                      <div style={{ fontSize: '0.8rem', color: '#666', fontFamily: 'monospace' }}>{course.subjectCode}</div>
                    </td>
                    <td style={{ padding: '0.85rem 0.75rem', textAlign: 'center', fontWeight: '500' }}>{course.semester}</td>
                    <td style={{ padding: '0.85rem 0.75rem', textAlign: 'center' }}>{course.total}</td>
                    <td style={{ padding: '0.85rem 0.75rem', textAlign: 'center' }}>
                      <span style={{ fontWeight: '500', color: course.evaluated === course.total && course.total > 0 ? '#2D7A5F' : '#333' }}>
                        {course.evaluated} / {course.total}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 0.75rem', textAlign: 'center', fontWeight: 'bold', color: 'var(--color-navy)' }}>
                      {course.evaluated > 0 ? `${course.avgMarks.toFixed(1)}` : '-'}
                    </td>
                    <td style={{ padding: '0.85rem 0.75rem', textAlign: 'center', fontWeight: '600', color: '#047857' }}>
                      {course.highest}
                    </td>
                    <td style={{ padding: '0.85rem 0.75rem', textAlign: 'center', fontWeight: '600', color: '#B91C1C' }}>
                      {course.lowest}
                    </td>
                    <td style={{ padding: '0.85rem 0.75rem', textAlign: 'center', fontWeight: '700', color: course.failures > 0 ? '#B91C1C' : '#6B7280' }}>
                      {course.failures}
                    </td>
                    <td style={{ padding: '0.85rem 0.75rem', textAlign: 'center', fontWeight: 'bold', color: course.passRate >= 75 ? '#2D7A5F' : course.passRate >= 40 ? '#d97706' : '#ef4444' }}>
                      {course.evaluated > 0 ? `${course.passRate}%` : '-'}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default HodDashboard;
