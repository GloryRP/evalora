/**
 * Student Results Page
 */
import { useState, useEffect } from 'react';
import { Award, Printer, BookOpen, AlertTriangle } from 'lucide-react';
import api from '../../lib/api';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import Button from '../../components/ui/Button';
import { useInstitution } from '../../contexts/InstitutionContext';
import toast from 'react-hot-toast';

const Results = () => {
  const institution = useInstitution();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const response = await api.get('/student/results');
      if (response.data?.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
      toast.error('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div style={{ padding: '2rem' }}><LoadingSkeleton count={5} /></div>;
  }

  if (!data || !data.results || data.results.length === 0) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ background: 'white', border: '1px solid #E5E5E5', borderRadius: '12px', padding: '3rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <AlertTriangle size={48} color="var(--color-gold)" style={{ marginBottom: '1.5rem', opacity: 0.8 }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--color-navy)', marginBottom: '0.5rem' }}>
            Results Awaiting Publication
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', margin: 0 }}>
            Your examination answer scripts are currently undergoing evaluation. Once the Exam Cell completes final reviews, your semester grade card will be available here.
          </p>
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalEarnedCredits = data.results
    .filter(r => r.grade !== 'F')
    .reduce((sum, r) => sum + r.credits, 0);

  return (
    <div className="printable-results" style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Actions (Hide during printing) */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
        <Button onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Printer size={18} /> Print Grade Card
        </Button>
      </div>

      {/* Grade Card Container */}
      <div style={{ background: 'white', borderRadius: '8px', padding: '2.5rem', border: '2px solid var(--color-navy)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        
        {/* Academic Header */}
        <div style={{ textAlign: 'center', paddingBottom: '1.5rem', borderBottom: '3px solid var(--color-gold)', marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--color-navy)', margin: '0 0 0.5rem 0', fontWeight: '800', textTransform: 'uppercase' }}>
            {institution.institutionName}
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', margin: '0 0 0.5rem 0' }}>
            {institution.address?.street}, {institution.address?.city}, {institution.address?.state} - {institution.address?.postalCode}
          </p>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-navy)', margin: '1rem 0 0 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Semester Grade Sheet
          </h2>
        </div>

        {/* Student Info Card */}
        <div style={{ background: 'var(--color-bg)', padding: '1.5rem', borderRadius: '6px', marginBottom: '2rem', border: '1px solid #E5E5E5' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div>
              <p style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Student Name</p>
              <p style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--color-navy)', margin: 0 }}>{data.student.name}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>USN / ID</p>
              <p style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--color-navy)', margin: 0, fontFamily: 'monospace' }}>{data.student.usn}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Department</p>
              <p style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--color-navy)', margin: 0 }}>{data.student.department}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Semester</p>
              <p style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--color-navy)', margin: 0 }}>Semester {data.student.semester}</p>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
          <thead>
            <tr style={{ background: 'var(--color-navy)', color: 'white' }}>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600' }}>Subject Code</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600' }}>Subject Title</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.85rem', fontWeight: '600' }}>Credits</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.85rem', fontWeight: '600' }}>Marks</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.85rem', fontWeight: '600' }}>Percentage</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.85rem', fontWeight: '600' }}>Grade</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.85rem', fontWeight: '600' }}>Result</th>
            </tr>
          </thead>
          <tbody>
            {data.results.map((res, idx) => (
              <tr key={res.resultId} style={{ borderBottom: '1px solid #E5E5E5', background: idx % 2 === 0 ? 'white' : 'var(--color-bg)' }}>
                <td style={{ padding: '0.75rem 1rem', fontSize: '0.9rem', fontFamily: 'monospace' }}>{res.subjectCode}</td>
                <td style={{ padding: '0.75rem 1rem', fontSize: '0.9rem', fontWeight: '500' }}>{res.subjectName}</td>
                <td style={{ padding: '0.75rem 1rem', fontSize: '0.9rem', textAlign: 'center' }}>{res.credits}</td>
                <td style={{ padding: '0.75rem 1rem', fontSize: '0.9rem', textAlign: 'center', fontWeight: '600' }}>{res.marksObtained} / {res.maxMarks}</td>
                <td style={{ padding: '0.75rem 1rem', fontSize: '0.9rem', textAlign: 'center' }}>{res.percentage}%</td>
                <td style={{ padding: '0.75rem 1rem', fontSize: '0.95rem', textAlign: 'center', fontWeight: '700', color: 'var(--color-gold)' }}>{res.grade}</td>
                <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', textAlign: 'center', fontWeight: '700', color: res.passStatus === 'PASS' ? '#2D7A5F' : '#ef4444' }}>
                  {res.passStatus}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary Card */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', borderTop: '2px solid #E5E5E5', paddingTop: '1.5rem' }}>
          <div style={{ padding: '1rem', background: '#F8F9FA', borderRadius: '6px', borderLeft: '4px solid var(--color-navy)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Credits Registered</span>
            <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-navy)' }}>{data.totalCredits}</h3>
          </div>
          <div style={{ padding: '1rem', background: '#F8F9FA', borderRadius: '6px', borderLeft: '4px solid var(--color-navy)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Credits Earned</span>
            <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-navy)' }}>{totalEarnedCredits}</h3>
          </div>
          <div style={{ padding: '1rem', background: '#FFFDF5', borderRadius: '6px', borderLeft: '4px solid var(--color-gold)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-gold)', textTransform: 'uppercase' }}>SGPA Score</span>
            <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-navy)' }}>{data.sgpa ? data.sgpa.toFixed(2) : '-'}</h3>
          </div>
        </div>

        {/* Signatures */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4rem', padding: '0 1rem' }}>
          <div style={{ textAlign: 'center', width: '200px' }}>
            <div style={{ borderBottom: '1px solid #999', height: '40px', marginBottom: '0.5rem' }}></div>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: 0 }}>Evaluator Signature</p>
          </div>
          <div style={{ textAlign: 'center', width: '200px' }}>
            <div style={{ borderBottom: '1px solid #999', height: '40px', marginBottom: '0.5rem' }}></div>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: 0 }}>Controller of Examinations</p>
          </div>
        </div>
      </div>

      {/* Print stylesheet override */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .printable-results {
            max-width: 100% !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          aside {
            display: none !important;
          }
          main {
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Results;
