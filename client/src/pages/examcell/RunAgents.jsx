/**
 * Run Agents Page - AI Pipeline Wizard
 * Multi-step interface for running the exam automation pipeline
 */
import { useState, useEffect } from 'react';
import { Play, CheckCircle, XCircle, Loader, ChevronRight, ChevronLeft } from 'lucide-react';
import api from '../../lib/api';
import Button from '../../components/ui/Button';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';

const RunAgents = () => {
  const [step, setStep] = useState(1);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [constraints, setConstraints] = useState({
    minGapBetweenExams: 1,
    maxExamsPerDay: 3,
    fillPercentage: 70,
  });
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/subjects');
      setSubjects(response.data.data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSubject = (subjectId) => {
    setSelectedSubjects(prev => 
      prev.includes(subjectId) 
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleRunPipeline = async () => {
    if (selectedSubjects.length === 0) {
      alert('Please select at least one subject');
      return;
    }

    setRunning(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.post('/examcell/agents/run-pipeline', {
        subjectIds: selectedSubjects,
        constraints,
      });

      setResult(response.data);
      setStep(4); // Move to results step
    } catch (error) {
      console.error('Error running pipeline:', error);
      setError(error.response?.data?.message || 'Failed to run pipeline');
    } finally {
      setRunning(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setSelectedSubjects([]);
    setResult(null);
    setError(null);
  };

  const steps = [
    { num: 1, label: 'Select Subjects' },
    { num: 2, label: 'Configure' },
    { num: 3, label: 'Review & Run' },
    { num: 4, label: 'Results' },
  ];

  if (loading) {
    return (
      <div style={{ padding: '2rem' }}>
        <LoadingSkeleton count={5} />
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ 
          fontFamily: 'var(--font-display)', 
          fontSize: '2rem', 
          fontWeight: '700', 
          color: 'var(--color-navy)',
          marginBottom: '0.5rem'
        }}>
          Run AI Pipeline
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
          Automate exam scheduling, hall allocation, and invigilator assignment
        </p>
      </div>

      {/* Step Indicator */}
      <div style={{ 
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        {steps.map((s, idx) => (
          <div key={s.num} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: step >= s.num ? 'var(--color-navy)' : '#E5E5E5',
                color: step >= s.num ? 'white' : 'var(--color-text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '600',
                fontSize: '1rem'
              }}>
                {step > s.num ? <CheckCircle size={20} /> : s.num}
              </div>
              <span style={{ 
                fontSize: '0.9rem', 
                fontWeight: step === s.num ? '600' : '400',
                color: step >= s.num ? 'var(--color-navy)' : 'var(--color-text-secondary)'
              }}>
                {s.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div style={{ 
                flex: 1, 
                height: '2px', 
                background: step > s.num ? 'var(--color-navy)' : '#E5E5E5',
                marginLeft: '1rem'
              }} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '2rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        minHeight: '400px'
      }}>
        {/* Step 1: Select Subjects */}
        {step === 1 && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: '600', color: 'var(--color-navy)', marginBottom: '1rem' }}>
              Select Subjects for Exam
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
              Choose the subjects that need to be scheduled for examination
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              {subjects.map(subject => (
                <div 
                  key={subject._id}
                  onClick={() => toggleSubject(subject._id)}
                  style={{
                    padding: '1rem',
                    border: selectedSubjects.includes(subject._id) ? '2px solid var(--color-gold)' : '1px solid #E5E5E5',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: selectedSubjects.includes(subject._id) ? 'var(--color-gold)10' : 'transparent',
                    transition: 'all 150ms'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--color-text)', marginBottom: '0.25rem' }}>
                      {subject.subjectCode}
                    </h3>
                    {selectedSubjects.includes(subject._id) && (
                      <CheckCircle size={20} color="var(--color-gold)" />
                    )}
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                    {subject.subjectName}
                  </p>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                    Sem {subject.semester} • {subject.department}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={() => setStep(2)} disabled={selectedSubjects.length === 0}>
                Next <ChevronRight size={20} />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Configure Constraints */}
        {step === 2 && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: '600', color: 'var(--color-navy)', marginBottom: '1rem' }}>
              Configure Pipeline
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
              Set constraints for exam scheduling and hall allocation
            </p>

            <div style={{ maxWidth: '600px' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.95rem', fontWeight: '500', color: 'var(--color-text)' }}>
                  Minimum Gap Between Exams (days)
                </label>
                <input 
                  type="number" 
                  value={constraints.minGapBetweenExams}
                  onChange={(e) => setConstraints({ ...constraints, minGapBetweenExams: parseInt(e.target.value) })}
                  min="0"
                  max="7"
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #E5E5E5', borderRadius: '4px', fontSize: '0.95rem' }}
                />
                <small style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                  Recommended: 1-2 days for student preparation
                </small>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.95rem', fontWeight: '500', color: 'var(--color-text)' }}>
                  Maximum Exams Per Day
                </label>
                <input 
                  type="number" 
                  value={constraints.maxExamsPerDay}
                  onChange={(e) => setConstraints({ ...constraints, maxExamsPerDay: parseInt(e.target.value) })}
                  min="1"
                  max="6"
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #E5E5E5', borderRadius: '4px', fontSize: '0.95rem' }}
                />
                <small style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                  Recommended: 2-3 exams per day
                </small>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.95rem', fontWeight: '500', color: 'var(--color-text)' }}>
                  Hall Fill Percentage (%)
                </label>
                <input 
                  type="number" 
                  value={constraints.fillPercentage}
                  onChange={(e) => setConstraints({ ...constraints, fillPercentage: parseInt(e.target.value) })}
                  min="50"
                  max="100"
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #E5E5E5', borderRadius: '4px', fontSize: '0.95rem' }}
                />
                <small style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                  Lower percentage = more spacing between students (anti-malpractice). Recommended: 70%
                </small>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <Button variant="outline" onClick={() => setStep(1)}>
                <ChevronLeft size={20} /> Back
              </Button>
              <Button onClick={() => setStep(3)}>
                Next <ChevronRight size={20} />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Run */}
        {step === 3 && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: '600', color: 'var(--color-navy)', marginBottom: '1rem' }}>
              Review & Run Pipeline
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
              Review your selections and start the AI automation pipeline
            </p>

            <div style={{ marginBottom: '2rem' }}>
              <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--color-bg)', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--color-text)', marginBottom: '0.75rem' }}>
                  Selected Subjects ({selectedSubjects.length})
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {subjects.filter(s => selectedSubjects.includes(s._id)).map(subject => (
                    <span key={subject._id} style={{
                      padding: '0.5rem 1rem',
                      background: 'white',
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                      color: 'var(--color-text)',
                      border: '1px solid #E5E5E5'
                    }}>
                      {subject.subjectCode} - {subject.subjectName}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ padding: '1rem', background: 'var(--color-bg)', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--color-text)', marginBottom: '0.75rem' }}>
                  Configuration
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Min Gap</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--color-navy)' }}>{constraints.minGapBetweenExams} days</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Max Exams/Day</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--color-navy)' }}>{constraints.maxExamsPerDay}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Hall Fill</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--color-navy)' }}>{constraints.fillPercentage}%</div>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div style={{ 
                padding: '1rem', 
                background: '#B3413E20', 
                border: '1px solid #B3413E',
                borderRadius: '8px', 
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <XCircle size={20} color="#B3413E" />
                <span style={{ color: '#B3413E', fontSize: '0.95rem' }}>{error}</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <Button variant="outline" onClick={() => setStep(2)} disabled={running}>
                <ChevronLeft size={20} /> Back
              </Button>
              <Button onClick={handleRunPipeline} disabled={running}>
                {running ? (
                  <>
                    <Loader size={20} className="animate-spin" /> Running Pipeline...
                  </>
                ) : (
                  <>
                    <Play size={20} /> Run Pipeline
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Results */}
        {step === 4 && result && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <CheckCircle size={40} color="var(--color-success)" />
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: '600', color: 'var(--color-navy)', marginBottom: '0.25rem' }}>
                  Pipeline Completed Successfully
                </h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
                  Exams scheduled, halls allocated, and invigilators assigned
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ padding: '1.5rem', background: 'var(--color-bg)', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--color-navy)', marginBottom: '0.5rem' }}>
                  {result.data?.examsCreated || 0}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Exams Scheduled
                </div>
              </div>
              <div style={{ padding: '1.5rem', background: 'var(--color-bg)', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--color-gold)', marginBottom: '0.5rem' }}>
                  {result.data?.allocationsCreated || 0}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Hall Allocations
                </div>
              </div>
              <div style={{ padding: '1.5rem', background: 'var(--color-bg)', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--color-success)', marginBottom: '0.5rem' }}>
                  {result.data?.assignmentsCreated || 0}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Invigilators Assigned
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <Button onClick={handleReset} style={{ flex: 1 }}>
                Run New Pipeline
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/examcell/timetable'} style={{ flex: 1 }}>
                View Timetable
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RunAgents;
