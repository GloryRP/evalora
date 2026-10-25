/**
 * Run Agents Page — Streamlined Configuration Interface
 * Allows exam cell to select semester, exam category, component, start date, and constraints.
 */
import { useState } from 'react';
import { Play, CheckCircle, XCircle, Loader, ChevronRight, ChevronLeft, Sparkles, Settings, Calendar, Shield, AlertTriangle } from 'lucide-react';
import api from '../../lib/api';
import Button from '../../components/ui/Button';

const RunAgents = () => {
  const [step, setStep] = useState(1); // 1: Configure & Constraints, 2: Review & Run, 3: Results
  const [wizardParams, setWizardParams] = useState({
    semester: '5',
    examCategory: 'internal1',
    component: 'theory',
    startDate: new Date().toISOString().split('T')[0],
    internalDuration: '1.5',
    externalDuration: '3.0',
    theoryStartTime: '09:00',
    labStartTime: '13:30',
    labDuration: '3.0',
  });
  const [constraints, setConstraints] = useState({
    minGapBetweenExams: 1,
    maxExamsPerDay: 3,
    fillPercentage: 70,
  });
  
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleRunPipeline = async () => {
    setRunning(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.post('/examcell/agents/run-pipeline', {
        semester: parseInt(wizardParams.semester),
        examCategory: wizardParams.examCategory,
        component: wizardParams.component,
        startDate: wizardParams.startDate,
        constraints: {
          ...constraints,
          internalDuration: parseFloat(wizardParams.internalDuration),
          externalDuration: parseFloat(wizardParams.externalDuration),
          theoryStartTime: wizardParams.theoryStartTime,
          labStartTime: wizardParams.labStartTime,
          labDuration: parseFloat(wizardParams.labDuration),
        },
      });

      setResult(response.data);
      setStep(3); // Move to results step
    } catch (error) {
      console.error('Error running pipeline:', error);
      setError(error.response?.data?.message || 'Failed to run pipeline');
    } finally {
      setRunning(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setResult(null);
    setError(null);
  };

  const steps = [
    { num: 1, label: 'Configure & Constraints' },
    { num: 2, label: 'Review & Run' },
    { num: 3, label: 'Results' },
  ];

  const getExamCategoryLabel = (cat) => {
    switch (cat) {
      case 'internal1': return 'Internal 1 (CIE)';
      case 'internal2': return 'Internal 2 (CIE)';
      case 'external': return 'External SEE';
      default: return cat;
    }
  };

  return (
    <div style={{ padding: '40px 48px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '36px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: '#1A1A1A', marginBottom: '8px', lineHeight: 1.2 }}>
          Run AI Automation Pipeline
        </h1>
        <p style={{ color: '#5C5C5C', fontSize: '0.95rem', lineHeight: 1.6 }}>
          Select parameters to schedule exams, allocate seats, and assign invigilators in a single operation.
        </p>
      </div>

      {/* Step Indicators */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'white', padding: '24px 28px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #E5E5E5', marginBottom: '32px' }}>
        {steps.map((s, idx) => (
          <div key={s.num} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                width: '36px', 
                height: '36px', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '0.875rem', 
                fontWeight: 700,
                backgroundColor: step >= s.num ? '#1E3A5F' : '#F0F0F0',
                color: step >= s.num ? 'white' : '#9CA3AF',
                boxShadow: step >= s.num ? '0 2px 4px rgba(30,58,95,0.2)' : 'none',
                transition: 'all 200ms ease'
              }}>
                {step > s.num ? <CheckCircle size={18} style={{ color: '#10B981' }} /> : s.num}
              </div>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: step === s.num ? '#1E3A5F' : '#9CA3AF' }}>
                {s.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div style={{ flex: 1, height: '2px', marginLeft: '16px', marginRight: '16px', backgroundColor: step > s.num ? '#1E3A5F' : '#E5E5E5', transition: 'all 200ms ease' }} />
            )}
          </div>
        ))}
      </div>

      {/* Step Card Content */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '40px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #E5E5E5', minHeight: '400px' }}>
        {/* Step 1: Configure & Constraints */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <div style={{ borderLeft: '4px solid #C9A227', backgroundColor: 'rgba(201,162,39,0.05)', padding: '20px', borderRadius: '0 10px 10px 0' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1A1A1A', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} style={{ color: '#C9A227' }} /> Pipeline Configuration
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#5C5C5C', lineHeight: 1.6 }}>
                Running the pipeline automatically processes subject scheduling, seating (2 per bench), and subject-aware invigilator loading for the selected semester.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#5C5C5C', marginBottom: '10px' }}>Semester</label>
                <select value={wizardParams.semester} onChange={e => setWizardParams({ ...wizardParams, semester: e.target.value })}
                  style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #D1D5DB', borderRadius: '8px', fontSize: '0.95rem', backgroundColor: 'white', outline: 'none', transition: 'border-color 200ms ease' }}
                  onFocus={(e) => e.target.style.borderColor = '#C9A227'}
                  onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#5C5C5C', marginBottom: '10px' }}>Exam Category</label>
                <select value={wizardParams.examCategory} onChange={e => setWizardParams({ ...wizardParams, examCategory: e.target.value })}
                  style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #D1D5DB', borderRadius: '8px', fontSize: '0.95rem', backgroundColor: 'white', outline: 'none', transition: 'border-color 200ms ease' }}
                  onFocus={(e) => e.target.style.borderColor = '#C9A227'}
                  onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}>
                  <option value="internal1">Internal 1 (CIE)</option>
                  <option value="internal2">Internal 2 (CIE)</option>
                  <option value="external">External (SEE)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#5C5C5C', marginBottom: '10px' }}>Component Type</label>
                <select value={wizardParams.component} onChange={e => setWizardParams({ ...wizardParams, component: e.target.value })}
                  style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #D1D5DB', borderRadius: '8px', fontSize: '0.95rem', backgroundColor: 'white', outline: 'none', transition: 'border-color 200ms ease' }}
                  onFocus={(e) => e.target.style.borderColor = '#C9A227'}
                  onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}>
                  <option value="theory">Theory Only</option>
                  <option value="lab">Lab Only</option>
                  <option value="both">Both (theory & lab separate)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#5C5C5C', marginBottom: '10px' }}>Start Date</label>
                <input type="date" value={wizardParams.startDate} onChange={e => setWizardParams({ ...wizardParams, startDate: e.target.value })}
                  style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #D1D5DB', borderRadius: '8px', fontSize: '0.95rem', backgroundColor: 'white', outline: 'none', transition: 'border-color 200ms ease' }}
                  onFocus={(e) => e.target.style.borderColor = '#C9A227'}
                  onBlur={(e) => e.target.style.borderColor = '#D1D5DB'} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#5C5C5C', marginBottom: '10px' }}>Morning Start Time</label>
                <input type="time" value={wizardParams.theoryStartTime} onChange={e => setWizardParams({ ...wizardParams, theoryStartTime: e.target.value })}
                  style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #D1D5DB', borderRadius: '8px', fontSize: '0.95rem', outline: 'none', transition: 'border-color 200ms ease' }}
                  onFocus={(e) => e.target.style.borderColor = '#C9A227'}
                  onBlur={(e) => e.target.style.borderColor = '#D1D5DB'} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#5C5C5C', marginBottom: '10px' }}>Afternoon Start Time</label>
                <input type="time" value={wizardParams.labStartTime} onChange={e => setWizardParams({ ...wizardParams, labStartTime: e.target.value })}
                  style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #D1D5DB', borderRadius: '8px', fontSize: '0.95rem', outline: 'none', transition: 'border-color 200ms ease' }}
                  onFocus={(e) => e.target.style.borderColor = '#C9A227'}
                  onBlur={(e) => e.target.style.borderColor = '#D1D5DB'} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', backgroundColor: '#F9FAFB', padding: '24px', borderRadius: '10px', border: '1px solid #E5E7EB' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B7280', marginBottom: '10px' }}>Internal Slot (hrs)</label>
                <input type="number" step="0.5" value={wizardParams.internalDuration} onChange={e => setWizardParams({ ...wizardParams, internalDuration: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #D1D5DB', borderRadius: '6px', fontSize: '0.9rem', backgroundColor: 'white', outline: 'none' }}
                  onFocus={(e) => e.target.style.borderColor = '#C9A227'}
                  onBlur={(e) => e.target.style.borderColor = '#D1D5DB'} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B7280', marginBottom: '10px' }}>External Slot (hrs)</label>
                <input type="number" step="0.5" value={wizardParams.externalDuration} onChange={e => setWizardParams({ ...wizardParams, externalDuration: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #D1D5DB', borderRadius: '6px', fontSize: '0.9rem', backgroundColor: 'white', outline: 'none' }}
                  onFocus={(e) => e.target.style.borderColor = '#C9A227'}
                  onBlur={(e) => e.target.style.borderColor = '#D1D5DB'} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B7280', marginBottom: '10px' }}>Lab Slot (hrs)</label>
                <input type="number" step="0.5" value={wizardParams.labDuration} onChange={e => setWizardParams({ ...wizardParams, labDuration: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #D1D5DB', borderRadius: '6px', fontSize: '0.9rem', backgroundColor: 'white', outline: 'none' }}
                  onFocus={(e) => e.target.style.borderColor = '#C9A227'}
                  onBlur={(e) => e.target.style.borderColor = '#D1D5DB'} />
              </div>
            </div>

            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1A1A1A', borderBottom: '1px solid #E5E5E5', paddingBottom: '12px', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings size={16} style={{ color: '#C9A227' }} /> Constraints & Rule Controls
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', backgroundColor: '#F9FAFB', padding: '24px', borderRadius: '10px', border: '1px solid #E5E7EB' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B7280', marginBottom: '10px' }}>Min Prep Gap (days)</label>
                <input type="number" value={constraints.minGapBetweenExams} onChange={e => setConstraints({ ...constraints, minGapBetweenExams: parseInt(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #D1D5DB', borderRadius: '6px', fontSize: '0.9rem', backgroundColor: 'white', outline: 'none' }}
                  onFocus={(e) => e.target.style.borderColor = '#C9A227'}
                  onBlur={(e) => e.target.style.borderColor = '#D1D5DB'} min="0" max="7" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B7280', marginBottom: '10px' }}>Max Exams/Day</label>
                <input type="number" value={constraints.maxExamsPerDay} onChange={e => setConstraints({ ...constraints, maxExamsPerDay: parseInt(e.target.value) || 1 })}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #D1D5DB', borderRadius: '6px', fontSize: '0.9rem', backgroundColor: 'white', outline: 'none' }}
                  onFocus={(e) => e.target.style.borderColor = '#C9A227'}
                  onBlur={(e) => e.target.style.borderColor = '#D1D5DB'} min="1" max="4" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B7280', marginBottom: '10px' }}>Hall Fill %</label>
                <input type="number" value={constraints.fillPercentage} onChange={e => setConstraints({ ...constraints, fillPercentage: parseInt(e.target.value) || 70 })}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #D1D5DB', borderRadius: '6px', fontSize: '0.9rem', backgroundColor: 'white', outline: 'none' }}
                  onFocus={(e) => e.target.style.borderColor = '#C9A227'}
                  onBlur={(e) => e.target.style.borderColor = '#D1D5DB'} min="50" max="100" />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px' }}>
              <Button onClick={() => setStep(2)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                Review & Confirm <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Review & Run */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-[#1E3A5F] flex items-center gap-2">
              <Play size={18} className="text-[#C9A227]" /> Review Parameters Before Launch
            </h2>
            <p className="text-xs text-[#5C5C5C]">
              Please double check the scheduled configuration details. Click 'Run Pipeline' to trigger AI agents.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Schedule Scope</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-[#5C5C5C]">Semester:</span> <span className="font-bold text-[#1A1A1A]">Semester {wizardParams.semester}</span></div>
                  <div className="flex justify-between"><span className="text-[#5C5C5C]">Exam Category:</span> <span className="font-bold text-[#1A1A1A]">{getExamCategoryLabel(wizardParams.examCategory)}</span></div>
                  <div className="flex justify-between"><span className="text-[#5C5C5C]">Component Type:</span> <span className="font-bold text-[#1A1A1A] capitalize">{wizardParams.component}</span></div>
                  <div className="flex justify-between"><span className="text-[#5C5C5C]">Start Date:</span> <span className="font-bold text-[#1A1A1A]">{wizardParams.startDate}</span></div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Applied Constraints</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-[#5C5C5C]">Min Gap:</span> <span className="font-bold text-[#1A1A1A]">{constraints.minGapBetweenExams} days</span></div>
                  <div className="flex justify-between"><span className="text-[#5C5C5C]">Max Exams Per Day:</span> <span className="font-bold text-[#1A1A1A]">{constraints.maxExamsPerDay}</span></div>
                  <div className="flex justify-between"><span className="text-[#5C5C5C]">Hall Fill Percentage:</span> <span className="font-bold text-[#1A1A1A]">{constraints.fillPercentage}%</span></div>
                </div>
              </div>
            </div>

            {error && (
              <div style={{
                padding: '16px',
                borderRadius: '12px',
                fontSize: '0.825rem',
                backgroundColor: error.includes('AI Service') || error.includes('8000') || error.includes('offline') ? '#FFFBEB' : '#FEF2F2',
                border: error.includes('AI Service') || error.includes('8000') || error.includes('offline') ? '1.5px solid #FCD34D' : '1px solid #FECACA',
                color: error.includes('AI Service') || error.includes('8000') || error.includes('offline') ? '#92400E' : '#B3413E'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', fontWeight: 700, fontSize: '0.9rem' }}>
                  {error.includes('AI Service') || error.includes('8000') || error.includes('offline') ? (
                    <AlertTriangle size={18} style={{ color: '#D97706' }} />
                  ) : (
                    <XCircle size={18} style={{ color: '#EF4444' }} />
                  )}
                  <span>{error.includes('AI Service') || error.includes('8000') || error.includes('offline') ? 'AI Service Offline' : 'Pipeline Execution Failed'}</span>
                </div>
                <p style={{ margin: '4px 0 0 26px', fontSize: '0.85rem', color: '#4B5563', lineHeight: 1.5 }}>{error}</p>
                {(error.includes('AI Service') || error.includes('8000') || error.includes('offline')) && (
                  <div style={{ margin: '10px 0 0 26px', padding: '8px 12px', backgroundColor: '#FEF3C7', borderRadius: '6px', fontSize: '0.75rem', fontFamily: 'monospace', color: '#78350F' }}>
                    <strong>Start AI Service:</strong> .\\venv\\Scripts\\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between pt-6 border-t border-gray-100">
              <Button variant="ghost" onClick={() => setStep(1)} disabled={running}>&lt; Back</Button>
              <Button onClick={handleRunPipeline} disabled={running} variant="primary" className="flex items-center gap-1.5 font-bold">
                {running ? (
                  <>
                    <Loader size={16} className="animate-spin" /> Orchestrating Pipeline...
                  </>
                ) : (
                  <>
                    <Play size={16} /> Run Full Pipeline
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Results */}
        {step === 3 && result && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle size={36} className="text-emerald-500" />
              <div>
                <h2 className="text-lg font-bold text-[#1A1A1A]">Pipeline Executed Successfully</h2>
                <p className="text-xs text-[#5C5C5C]">The AI Orchestrator scheduled all subjects, paired seat positions, and loaded balanced invigilators.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 bg-gray-50 border border-gray-100 rounded-2xl text-center">
                <div className="text-3xl font-display font-bold text-[#1E3A5F] mb-1">{result.data?.examsCreated || 0}</div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Exams Scheduled</div>
              </div>
              <div className="p-5 bg-gray-50 border border-gray-100 rounded-2xl text-center">
                <div className="text-3xl font-display font-bold text-[#C9A227] mb-1">{result.data?.allocationsCreated || 0}</div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Hall Seating Paired</div>
              </div>
              <div className="p-5 bg-gray-50 border border-gray-100 rounded-2xl text-center">
                <div className="text-3xl font-display font-bold text-emerald-600 mb-1">{result.data?.assignmentsCreated || 0}</div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Invigilators Assigned</div>
              </div>
            </div>

            {/* Unseated Students Warning (F8) */}
            {(result.data?.result?.unseated_count > 0 || (result.data?.result?.unseated_students && result.data.result.unseated_students.length > 0)) && (
              <div style={{
                backgroundColor: '#FFFBEB',
                border: '1.5px solid #FCD34D',
                borderRadius: '12px',
                padding: '20px',
                marginTop: '16px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <AlertTriangle size={20} style={{ color: '#D97706' }} />
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#92400E', margin: 0 }}>
                    Seating Capacity Warning: {result.data.result.unseated_count} Student(s) Unseated
                  </h3>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#B45309', margin: '0 0 12px 0', lineHeight: 1.5 }}>
                  {result.data.result.warning || `Total students exceed usable hall seats at ${constraints.fillPercentage}% fill limit. Consider adding more examination halls or increasing the hall fill percentage.`}
                </p>
                {result.data.result.unseated_students?.length > 0 && (
                  <div style={{ maxHeight: '140px', overflowY: 'auto', border: '1px solid #FDE68A', borderRadius: '8px', backgroundColor: 'white' }}>
                    <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
                      <thead style={{ backgroundColor: '#FEF3C7' }}>
                        <tr>
                          <th style={{ padding: '6px 12px', textAlign: 'left', color: '#92400E' }}>USN</th>
                          <th style={{ padding: '6px 12px', textAlign: 'left', color: '#92400E' }}>Subject Code</th>
                          <th style={{ padding: '6px 12px', textAlign: 'left', color: '#92400E' }}>Exam Date / Slot</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.data.result.unseated_students.map((st, i) => (
                          <tr key={i} style={{ borderTop: '1px solid #FEF3C7' }}>
                            <td style={{ padding: '6px 12px', fontFamily: 'monospace', fontWeight: 600 }}>{st.usn || st.studentUSN || 'N/A'}</td>
                            <td style={{ padding: '6px 12px' }}>{st.subjectCode || 'N/A'}</td>
                            <td style={{ padding: '6px 12px', color: '#6B7280' }}>{st.examDate || ''} {st.slot || ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-6 border-t border-gray-100">
              <Button onClick={handleReset} variant="ghost" className="flex-1">Run New Pipeline</Button>
              <Button onClick={() => window.location.href = '/examcell/timetable'} variant="gold" className="flex-1">Go to Timetable</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RunAgents;
