/**
 * Principal Dashboard - College-Wide Department Performance & Toppers Auditing
 * Premium print-optimized analytics report generator
 */
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Award, CheckCircle, Percent, ShieldAlert, BarChart2, BookOpen,
  Users, AlertTriangle, Printer, TrendingUp, UserCheck, ArrowRight
} from 'lucide-react';
import api from '../../lib/api';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import Badge from '../../components/ui/Badge';
import toast from 'react-hot-toast';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

const PrincipalDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [institutionName, setInstitutionName] = useState('Vidyā Autonomous Engineering College');

  useEffect(() => {
    fetchCollegeInsights();
    fetchInstitutionDetails();
  }, []);

  const fetchCollegeInsights = async () => {
    try {
      setLoading(true);
      const response = await api.get('/principal/insights');
      if (response.data?.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching college insights:', error);
      toast.error('Failed to load college-wide insights');
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
      console.warn('Could not fetch institution name, using default.');
    }
  };

  const handleExportReport = () => {
    window.print();
  };

  if (loading) {
    return <div style={{ padding: '2rem' }}><LoadingSkeleton count={6} /></div>;
  }

  if (!data) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#666' }}>
        <ShieldAlert size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
        <p>Unable to retrieve college-wide insights. Verify result computations are complete.</p>
      </div>
    );
  }

  const completionRate = data.totalScripts > 0 
    ? Math.round((data.evaluatedScripts / data.totalScripts) * 100) 
    : 0;

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }} className="print-container">
      
      {/* Dynamic Print Stylesheet */}
      <style>{`
        /* Print-only elements header style */
        .print-only-header {
          display: none;
        }

        @media print {
          /* Force page margins */
          @page {
            size: A4 portrait;
            margin: 1.5cm;
          }

          /* Hide sidebar, navigation menus, and non-printable panels */
          aside, nav, header, .no-print, button, .sidebar-container, .mobile-header, .lg\\:flex {
            display: none !important;
          }

          /* Body overrides for white background and full width */
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

          /* Show the printable custom header */
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

          /* Optimize grid and tables */
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

          /* Avoid breaking items inside columns */
          .print-avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          
          /* Title override */
          h1, h2, h3 {
            color: #1E3A5F !important;
          }
        }
      `}</style>

      {/* Print-Only Header Block */}
      <div className="print-only-header">
        <h1>{institutionName}</h1>
        <p>Official Academic Performance Audit Report · Generated on {new Date().toLocaleDateString()}</p>
      </div>

      {/* Header Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }} className="no-print">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <LayoutDashboard size={28} color="var(--color-gold)" />
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: '700', color: 'var(--color-navy)', margin: 0 }}>
              Principal College-Wide Insights
            </h1>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', margin: 0 }}>
            Institutional performance analysis, department grading audits, and topper registries.
          </p>
        </div>

        <button
          onClick={handleExportReport}
          style={{
            background: 'var(--color-navy)',
            color: 'white',
            border: 'none',
            padding: '0.6rem 1.25rem',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Printer size={16} /> Export Report (PDF)
        </button>
      </div>

      {/* College KPI Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E5E5E5', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'rgba(30, 58, 95, 0.08)', color: 'var(--color-navy)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: '600', letterSpacing: '0.5px' }}>COLLEGE PAPERS</span>
            <h3 style={{ margin: '0.1rem 0 0 0', fontSize: '1.6rem', fontWeight: '700', color: 'var(--color-navy)' }}>{data.totalScripts}</h3>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E5E5E5', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'rgba(201, 162, 39, 0.08)', color: 'var(--color-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: '600', letterSpacing: '0.5px' }}>VALUATION METRIC</span>
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
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: '600', letterSpacing: '0.5px' }}>COLLEGE AVERAGE</span>
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
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: '600', letterSpacing: '0.5px' }}>COLLEGE PASS RATE</span>
            <h3 style={{ margin: '0.1rem 0 0 0', fontSize: '1.6rem', fontWeight: '700', color: '#2D7A5F' }}>
              {data.passRate.toFixed(1)}%
            </h3>
          </div>
        </div>
      </div>

      {/* Department-Wise Merit Comparison Chart */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E5E5E5', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '2.5rem' }} className="print-avoid-break">
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-navy)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={20} color="var(--color-gold)" /> Department Performance Comparison (Merit Analysis)
        </h2>
        <div style={{ width: '100%', height: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.departmentBreakdown}
              margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="department" stroke="#555" fontSize={11} tickLine={false} />
              <YAxis yAxisId="left" orientation="left" stroke="#2D7A5F" label={{ value: 'Pass Rate / Avg Score (%)', angle: -90, position: 'insideLeft', offset: 0, style: { textAnchor: 'middle', fill: '#2D7A5F', fontWeight: '600', fontSize: '11px' } }} />
              <YAxis yAxisId="right" orientation="right" stroke="#C9A227" label={{ value: 'Avg Term SGPA', angle: 90, position: 'insideRight', offset: 0, style: { textAnchor: 'middle', fill: '#C9A227', fontWeight: '600', fontSize: '11px' } }} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E5E5E5', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }} />
              <Legend verticalAlign="top" height={36} />
              <Bar yAxisId="left" dataKey="passRate" name="Pass Rate (%)" fill="#2D7A5F" radius={[4, 4, 0, 0]} barSize={18} />
              <Bar yAxisId="left" dataKey="avgMarks" name="Avg Marks (%)" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={18} />
              <Bar yAxisId="right" dataKey="avgSGPA" name="Avg SGPA" fill="#C9A227" radius={[4, 4, 0, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department-Wise Insights Table */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E5E5E5', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '2.5rem' }} className="print-avoid-break">
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-navy)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BarChart2 size={20} color="var(--color-gold)" /> Department Performance Breakdown
        </h2>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #E5E5E5', background: 'var(--color-bg)', textAlign: 'left' }}>
                <th style={{ padding: '0.85rem 0.75rem' }}>Department</th>
                <th style={{ padding: '0.85rem 0.75rem', textAlign: 'center' }}>Total Papers</th>
                <th style={{ padding: '0.85rem 0.75rem', textAlign: 'center' }}>Valued</th>
                <th style={{ padding: '0.85rem 0.75rem', textAlign: 'center' }}>Avg Subject Marks</th>
                <th style={{ padding: '0.85rem 0.75rem', textAlign: 'center' }}>Avg Term SGPA</th>
                <th style={{ padding: '0.85rem 0.75rem' }}>Department Topper</th>
                <th style={{ padding: '0.85rem 0.75rem', textAlign: 'center' }}>Pass Rate</th>
              </tr>
            </thead>
            <tbody>
              {data.departmentBreakdown.map((dept) => (
                <tr key={dept.department} style={{ borderBottom: '1px solid #E5E5E5' }}>
                  <td style={{ padding: '0.85rem 0.75rem', fontWeight: '700', color: 'var(--color-navy)' }}>{dept.department}</td>
                  <td style={{ padding: '0.85rem 0.75rem', textAlign: 'center' }}>{dept.totalScripts}</td>
                  <td style={{ padding: '0.85rem 0.75rem', textAlign: 'center', color: '#555' }}>
                    {dept.evaluatedScripts} / {dept.totalScripts}
                  </td>
                  <td style={{ padding: '0.85rem 0.75rem', textAlign: 'center', fontWeight: '600' }}>{dept.avgMarks.toFixed(1)}</td>
                  <td style={{ padding: '0.85rem 0.75rem', textAlign: 'center', fontWeight: '700', color: 'var(--color-navy)' }}>{dept.avgSGPA.toFixed(2)}</td>
                  <td style={{ padding: '0.85rem 0.75rem' }}>
                    {dept.topper.name !== 'N/A' ? (
                      <div>
                        <span style={{ fontWeight: '600', display: 'block', fontSize: '0.85rem' }}>{dept.topper.name}</span>
                        <span style={{ fontSize: '0.75rem', color: '#6B7280', fontFamily: 'monospace' }}>USN: {dept.topper.usn} ({dept.topper.sgpa.toFixed(2)} SGPA)</span>
                      </div>
                    ) : (
                      <span style={{ color: '#888', fontStyle: 'italic' }}>N/A</span>
                    )}
                  </td>
                  <td style={{ padding: '0.85rem 0.75rem', textAlign: 'center', fontWeight: 'bold', color: dept.passRate >= 75 ? '#2D7A5F' : dept.passRate >= 40 ? '#d97706' : '#ef4444' }}>
                    {dept.passRate.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* College Toppers Registry */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E5E5E5', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }} className="print-avoid-break">
        <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--color-navy)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Award size={20} color="var(--color-gold)" /> College Toppers Registry (Top 10)
        </h2>

        {data.collegeToppers.length === 0 ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#888', background: '#FAFAF9', borderRadius: '8px' }}>
            No topper results computed yet.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {data.collegeToppers.map((top, idx) => (
              <div 
                key={top.usn} 
                style={{ 
                  padding: '0.75rem 1rem', 
                  borderRadius: '8px', 
                  background: idx === 0 ? '#FEFAEC' : '#F9FAFB', 
                  border: idx === 0 ? '1px solid #F3E2B5' : '1px solid #E5E5E5',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', background: 'var(--color-gold)', color: 'white', width: '18px', height: '18px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      {idx + 1}
                    </span>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--color-navy)' }}>{top.name}</strong>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>USN: {top.usn} · {top.department} (Sem {top.semester})</span>
                </div>
                <strong style={{ fontSize: '1rem', color: idx === 0 ? '#B45309' : 'var(--color-navy)' }}>
                  {top.sgpa.toFixed(2)} SGPA
                </strong>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default PrincipalDashboard;
