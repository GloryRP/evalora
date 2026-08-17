import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft, Save, Send, AlertTriangle, CheckCircle2, Clock,
  FileText, HelpCircle, AlertCircle, Award, Archive, GitMerge, RotateCcw
} from 'lucide-react';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';

const BLOOMS_LEVELS = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];

const getExamTypeLabel = (type) => {
  const m = {
    internal1: 'Internal Assessment 1 (CIE-1)',
    internal2: 'Internal Assessment 2 (CIE-2)',
    external: 'End Semester Exam (SEE)',
    makeup: 'Make-up / Supplementary',
  };
  return m[type] || type;
};

const formatDateFormatted = (d) => {
  if (!d) return '—';
  const dateObj = new Date(d);
  const dayName = dateObj.toLocaleDateString('en-IN', { weekday: 'short' });
  const formatted = dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  return `${dayName}, ${formatted}`;
};

const getDaysRemaining = (deadline) => {
  if (!deadline) return { text: '—', passed: false, days: 999 };
  const diff = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { text: 'Deadline passed', passed: true, days: diff };
  if (diff === 0) return { text: 'Due Today', passed: false, days: 0 };
  if (diff === 1) return { text: '1 day remaining', passed: false, days: 1 };
  return { text: `${diff} days remaining`, passed: false, days: diff };
};

const SubmitQuestionPaper = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submission, setSubmission] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState(''); // 'saving', 'saved', 'error'
  const autoSaveTimerRef = useRef(null);

  useEffect(() => {
    loadSubmission();
  }, [id]);

  const loadSubmission = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/qp-submissions/my-assignments/${id}`);
      const data = res.data?.data;
      if (!data) {
        toast.error('Assignment not found');
        navigate('/faculty/question-papers');
        return;
      }
      setSubmission(data);

      // Initialize questions array
      if (data.submittedQuestions && data.submittedQuestions.length > 0) {
        setQuestions(data.submittedQuestions);
      } else if (data.patternRef?.questions && data.patternRef.questions.length > 0) {
        // Pre-fill structure from patternRef
        const initial = data.patternRef.questions.map((q) => ({
          qNo: q.qNo,
          questionText: '',
          marks: q.maxMarks,
          isOrQuestion: q.isOrQuestion || false,
          orGroupId: q.orGroupId || null,
          unit: 'Unit 1',
          bloomsLevel: 'Understand',
          co: 'CO1',
        }));
        setQuestions(initial);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load assignment');
      navigate('/faculty/question-papers');
    } finally {
      setLoading(false);
    }
  };

  // Handle question field update
  const handleQuestionChange = (index, field, value) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    scheduleAutoSave();
  };

  // Debounced auto-save
  const scheduleAutoSave = () => {
    if (['selected', 'archived', 'submitted', 'under_review'].includes(submission?.status)) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      triggerAutoSave();
    }, 5000);
  };

  const triggerAutoSave = async () => {
    if (!submission || ['selected', 'archived', 'submitted', 'under_review'].includes(submission.status)) return;
    setAutoSaveStatus('saving');
    try {
      await api.patch(`/qp-submissions/${id}/save-draft`, { submittedQuestions: questions });
      setAutoSaveStatus('saved');
      setLastSavedAt(new Date());
    } catch {
      setAutoSaveStatus('error');
    }
  };

  // Explicit Save Draft
  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await api.patch(`/qp-submissions/${id}/save-draft`, { submittedQuestions: questions });
      toast.success('Draft saved successfully!');
      setAutoSaveStatus('saved');
      setLastSavedAt(new Date());
      setSubmission((prev) => ({ ...prev, status: prev.status === 'assigned' ? 'draft' : prev.status }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  // Submit or Revise
  const handleSubmit = async () => {
    const empty = questions.filter((q) => !q.questionText || !q.questionText.trim());
    if (empty.length > 0) {
      toast.error(`Please fill all question fields before submitting (${empty.map((q) => q.qNo).join(', ')})`);
      return;
    }

    const isRevision = submission.status === 'revision_requested';
    const endpoint = isRevision ? `/qp-submissions/${id}/revise` : `/qp-submissions/${id}/submit`;

    setSubmitting(true);
    try {
      const res = await api.patch(endpoint, { submittedQuestions: questions });
      toast.success(isRevision ? 'Question paper resubmitted!' : 'Question paper submitted for review!');
      setSubmission(res.data?.data || { ...submission, status: 'submitted' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>
        <LoadingSkeleton count={6} />
      </div>
    );
  }

  if (!submission) return null;

  const isReadOnly = ['selected', 'archived', 'submitted', 'under_review'].includes(submission.status);
  const isSelected = submission.status === 'selected';
  const isArchived = submission.status === 'archived';
  const isRevisionRequested = submission.status === 'revision_requested';

  const daysInfo = getDaysRemaining(submission.deadline);
  const subjectObj = submission.subjectId || {};

  return (
    <div style={{ padding: '0', maxWidth: '1140px', margin: '0 auto' }}>
      {/* Sticky Action Header Bar */}
      <div
        style={{
          position: 'sticky',
          top: '0',
          zIndex: 100,
          backgroundColor: 'white',
          borderBottom: '1.5px solid #EEEEEE',
          padding: '12px 24px',
          margin: '0 -24px 0 -24px',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        <button
          onClick={() => navigate('/faculty/question-papers')}
          style={{
            padding: '6px 14px',
            backgroundColor: '#F3F4F6',
            border: 'none',
            borderRadius: '6px',
            color: 'var(--color-navy)',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <ArrowLeft size={15} /> Back to Assignments
        </button>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {autoSaveStatus === 'saving' && <span style={{ fontSize: '0.75rem', color: '#D97706', fontStyle: 'italic' }}>Saving draft...</span>}
          {autoSaveStatus === 'saved' && (
            <span style={{ fontSize: '0.72rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={12} /> Auto-saved {lastSavedAt ? lastSavedAt.toLocaleTimeString() : ''}
            </span>
          )}

          {!isReadOnly && (
            <>
              <button
                onClick={handleSaveDraft}
                disabled={saving || submitting}
                style={{
                  padding: '9px 18px',
                  backgroundColor: 'white',
                  color: 'var(--color-navy)',
                  border: '1.5px solid var(--color-navy)',
                  borderRadius: '7px',
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Save size={15} /> {saving ? 'Saving...' : 'Save Draft'}
              </button>

              <button
                onClick={handleSubmit}
                disabled={saving || submitting}
                style={{
                  padding: '9px 20px',
                  backgroundColor: isRevisionRequested ? '#F59E0B' : 'var(--color-navy)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '7px',
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Send size={15} /> {submitting ? 'Submitting...' : isRevisionRequested ? 'Resubmit Revision' : 'Submit for Review'}
              </button>
            </>
          )}

          {isReadOnly && (
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: isSelected ? '#15803D' : '#6B7280', padding: '6px 14px', backgroundColor: '#F3F4F6', borderRadius: '6px' }}>
              {isSelected ? '✓ Selected as Final Paper' : isArchived ? 'Archived' : 'Submitted (Read Only)'}
            </span>
          )}
        </div>
      </div>

      {/* FIX 4: Navy Header Card showing ALL Subject details clearly */}
      <div
        style={{
          backgroundColor: 'var(--color-navy)',
          color: 'white',
          borderRadius: '10px 10px 0 0',
          padding: '24px 28px',
          marginTop: '20px',
          boxShadow: '0 4px 12px rgba(30,58,95,0.15)',
        }}
      >
        {/* Row 1: Subject Code + Subject Name */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, letterSpacing: '0.02em', marginBottom: '2px' }}>
              {subjectObj.subjectCode || 'CS501'}
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 400, opacity: 0.9 }}>
              {subjectObj.subjectName || 'Subject Name'}
            </div>
          </div>

          {/* Row 3: Deadline right-aligned */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.75, marginBottom: '2px' }}>
              Submission Deadline
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: daysInfo.passed ? '#FCA5A5' : (daysInfo.days <= 2 ? '#FCD34D' : 'rgba(255,255,255,0.95)') }}>
              {formatDateFormatted(submission.deadline)} ({daysInfo.text})
            </div>
          </div>
        </div>

        {/* Row 2: Smaller details pills */}
        <div style={{ display: 'flex', gap: '18px', marginTop: '16px', flexWrap: 'wrap', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.15)', fontSize: '0.825rem', color: 'rgba(255,255,255,0.85)' }}>
          <div>📚 <strong>Semester {subjectObj.semester || 5}</strong></div>
          <div>📅 <strong>Academic Year: {submission.academicYear || '2025-26'}</strong></div>
          <div>📝 <strong>Exam Type: {getExamTypeLabel(submission.patternRef?.examType)}</strong></div>
          <div>🏛 <strong>Department: {subjectObj.department || 'Computer Science'}</strong></div>
          <div>⭐ <strong>{subjectObj.credits || 4} Credits</strong></div>
          <div>📊 <strong>Total Marks: {submission.patternRef?.totalMarks || 50}M</strong></div>
        </div>
      </div>

      {/* Content area below header */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '0 0 10px 10px',
          border: '1px solid #EEEEEE',
          borderTop: 'none',
          padding: '24px 28px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          marginBottom: '40px',
        }}
      >
        {/* Selected Banner */}
        {isSelected && (
          <div style={{ backgroundColor: '#FEF9C3', border: '2px solid #C9A227', borderRadius: '10px', padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Award size={24} style={{ color: '#C9A227' }} />
            <div>
              <div style={{ fontWeight: 700, color: '#713F12', fontSize: '0.95rem' }}>★ Your Question Paper Selected as Final</div>
              <div style={{ fontSize: '0.825rem', color: '#854D0E', marginTop: '2px' }}>
                Exam Cell has selected your submission as the official paper for this exam. This paper is locked for examination.
              </div>
            </div>
          </div>
        )}

        {/* Revision Banner */}
        {isRevisionRequested && submission.reviewNote && (
          <div style={{ backgroundColor: '#FFF7ED', border: '1.5px solid #FED7AA', borderRadius: '10px', padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <AlertCircle size={20} style={{ color: '#EA580C', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 700, color: '#9A3412', fontSize: '0.9rem', marginBottom: '4px' }}>
                Revision Requested by Exam Cell
              </div>
              <div style={{ fontSize: '0.875rem', color: '#C2410C', lineHeight: 1.5 }}>
                "{submission.reviewNote}"
              </div>
              <div style={{ fontSize: '0.78rem', color: '#EA580C', marginTop: '6px', fontWeight: 600 }}>
                Please update the questions as requested and click "Resubmit Revision" in the top bar.
              </div>
            </div>
          </div>
        )}

        {/* Questions Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {questions.map((q, idx) => {
            const isOr = q.isOrQuestion;
            const prevQ = questions[idx - 1];
            const showOrDivider = isOr && prevQ && prevQ.orGroupId === q.orGroupId;

            return (
              <React.Fragment key={idx}>
                {showOrDivider && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '8px 0' }}>
                    <div style={{ flex: 1, borderBottom: '2px dashed #E8D5A0' }} />
                    <span style={{ backgroundColor: '#FFFBEB', border: '1px solid #E8D5A0', borderRadius: '20px', padding: '4px 14px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-gold)', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <GitMerge size={12} /> OR ALTERNATIVE QUESTION
                    </span>
                    <div style={{ flex: 1, borderBottom: '2px dashed #E8D5A0' }} />
                  </div>
                )}

                <div
                  style={{
                    backgroundColor: isOr ? '#FFFDF5' : 'white',
                    borderRadius: '10px',
                    padding: '20px',
                    border: isOr ? '1.5px solid #F0E8C8' : '1px solid #EEEEEE',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  }}
                >
                  {/* Header line */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: isOr ? '#F59E0B' : 'var(--color-navy)', color: 'white', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {q.qNo}
                      </div>
                      <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-navy)' }}>
                        Question {q.qNo} {isOr ? '(OR Option)' : ''}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.825rem', fontWeight: 700, backgroundColor: '#FEF3C7', color: '#92400E', padding: '4px 12px', borderRadius: '12px' }}>
                      {q.marks} Marks
                    </span>
                  </div>

                  {/* Question Textarea */}
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', marginBottom: '6px' }}>
                      QUESTION CONTENT <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <textarea
                      disabled={isReadOnly}
                      value={q.questionText || ''}
                      onChange={(e) => handleQuestionChange(idx, 'questionText', e.target.value)}
                      placeholder={`Enter question ${q.qNo} text here...`}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: '1.5px solid #E0E0E0',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        lineHeight: 1.6,
                        outline: 'none',
                        resize: 'vertical',
                        boxSizing: 'border-box',
                        backgroundColor: isReadOnly ? '#F9FAFB' : 'white',
                      }}
                    />
                  </div>

                  {/* Metadata: Bloom's Level, Unit, CO */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', marginBottom: '4px' }}>
                        BLOOM'S TAXONOMY
                      </label>
                      <select
                        disabled={isReadOnly}
                        value={q.bloomsLevel || 'Understand'}
                        onChange={(e) => handleQuestionChange(idx, 'bloomsLevel', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          border: '1.5px solid #E0E0E0',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          outline: 'none',
                          backgroundColor: isReadOnly ? '#F9FAFB' : 'white',
                        }}
                      >
                        {BLOOMS_LEVELS.map((lvl) => (
                          <option key={lvl} value={lvl}>{lvl}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', marginBottom: '4px' }}>
                        UNIT / MODULE
                      </label>
                      <select
                        disabled={isReadOnly}
                        value={q.unit || 'Unit 1'}
                        onChange={(e) => handleQuestionChange(idx, 'unit', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          border: '1.5px solid #E0E0E0',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          outline: 'none',
                          backgroundColor: isReadOnly ? '#F9FAFB' : 'white',
                        }}
                      >
                        {['Unit 1', 'Unit 2', 'Unit 3', 'Unit 4', 'Unit 5'].map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', marginBottom: '4px' }}>
                        COURSE OUTCOME (CO)
                      </label>
                      <input
                        type="text"
                        disabled={isReadOnly}
                        value={q.co || ''}
                        onChange={(e) => handleQuestionChange(idx, 'co', e.target.value)}
                        placeholder="e.g. CO1, CO2"
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          border: '1.5px solid #E0E0E0',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          outline: 'none',
                          boxSizing: 'border-box',
                          backgroundColor: isReadOnly ? '#F9FAFB' : 'white',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SubmitQuestionPaper;
