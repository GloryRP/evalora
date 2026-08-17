import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';
import {
  BookOpen, Clock, CheckCircle2, AlertCircle, Star,
  FileText, Archive, XCircle, ArrowRight, Calendar, Award, Edit3, Eye, AlertTriangle
} from 'lucide-react';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';

// ─── Helpers ───────────────────────────────────────────────────────────────────
const getExamTypeLabel = (type) => {
  const m = {
    internal1: 'Internal 1 (CIE)',
    internal2: 'Internal 2 (CIE)',
    external: 'End Semester (SEE)',
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
  if (!deadline) return { text: '—', color: '#6B7280', passed: false, days: 999 };
  const diff = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { text: 'Deadline passed', color: '#B91C1C', passed: true, days: diff };
  if (diff === 0) return { text: 'Due Today', color: '#B91C1C', passed: false, days: 0 };
  if (diff === 1) return { text: '1 day remaining', color: '#D97706', passed: false, days: 1 };
  if (diff <= 3) return { text: `${diff} days remaining`, color: '#D97706', passed: false, days: diff };
  return { text: `${diff} days remaining`, color: '#059669', passed: false, days: diff };
};

// ─── Status Config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  assigned:           { bg: '#EEF2FF', color: '#3730A3', label: 'Assigned — Not Started', icon: <BookOpen size={13} /> },
  draft:              { bg: '#FEF3C7', color: '#92400E', label: 'In Progress — Draft',    icon: <Clock size={13} /> },
  submitted:          { bg: '#DBEAFE', color: '#1D4ED8', label: 'Submitted — Awaiting Review', icon: <FileText size={13} /> },
  under_review:       { bg: '#FDE8D0', color: '#9A3412', label: 'Under Review',           icon: <Clock size={13} /> },
  revision_requested: { bg: '#FFEDD5', color: '#C2410C', label: 'Revision Requested ⚡',  icon: <AlertCircle size={13} /> },
  selected:           { bg: '#FEF9C3', color: '#713F12', label: '★ Selected as Final',   icon: <Award size={13} /> },
  archived:           { bg: '#F3F4F6', color: '#9CA3AF', label: 'Archived',               icon: <Archive size={13} /> },
  rejected:           { bg: '#FEE2E2', color: '#B91C1C', label: 'Rejected',               icon: <XCircle size={13} /> },
};

const StatusBadge = ({ status }) => {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.assigned;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', fontWeight: 700, padding: '4px 12px', borderRadius: '12px', backgroundColor: c.bg, color: c.color, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
      {c.icon}{c.label}
    </span>
  );
};

// ─── Redesigned Assignment Card (FIX 3) ───────────────────────────────────────
const AssignmentCard = ({ submission, onOpen }) => {
  const [hovered, setHovered] = useState(false);
  const { subjectId, status, deadline, reviewNote, patternRef, submittedQuestions, academicYear } = submission;

  const daysInfo = getDaysRemaining(deadline);
  const isSelected = status === 'selected';
  const isArchived = status === 'archived';
  const isDraft = status === 'draft';
  const isRevisionRequested = status === 'revision_requested';

  // Compute total questions & OR count
  const patternQs = patternRef?.questions || [];
  const totalQuestions = patternQs.length;
  const orQuestionsCount = patternQs.filter(q => q.isOrQuestion).length;
  const questionsLabel = totalQuestions > 0
    ? `${totalQuestions} Questions${orQuestionsCount > 0 ? ` (${orQuestionsCount} with OR)` : ''}`
    : '5 Questions (2 with OR)';

  // Compute draft progress
  const filledCount = (submittedQuestions || []).filter(q => q.questionText && q.questionText.trim()).length;
  const progressPercent = totalQuestions > 0 ? Math.round((filledCount / totalQuestions) * 100) : 0;

  // Deadline row background color
  const deadlineRowBg = daysInfo.passed
    ? { bg: '#FEF2F2', border: '1px solid #FECACA' }
    : daysInfo.days <= 2
    ? { bg: '#FFFBEB', border: '1px solid #FCD34D' }
    : { bg: '#F8F9FA', border: '1px solid #EEEEEE' };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: 'white',
        border: isSelected ? '2px solid #C9A227' : `1.5px solid ${hovered ? 'var(--color-navy)' : '#EEEEEE'}`,
        borderRadius: '14px',
        overflow: 'hidden',
        boxShadow: hovered ? '0 6px 20px rgba(30,58,95,0.12)' : '0 1px 4px rgba(0,0,0,0.06)',
        transition: 'all 250ms ease',
        opacity: isArchived ? 0.8 : 1,
        display: 'flex',
        flexDirection: 'column',
        justify: 'space-between',
      }}
    >
      <div>
        {/* Selected Banner */}
        {isSelected && (
          <div style={{ backgroundColor: '#FEF9C3', padding: '8px 16px', borderBottom: '2px solid #C9A227', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Star size={15} style={{ color: '#C9A227' }} />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#713F12', letterSpacing: '0.05em' }}>
              ★ SELECTED AS FINAL QUESTION PAPER
            </span>
          </div>
        )}

        <div style={{ padding: '20px 20px 16px 20px' }}>
          {/* Card Top Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div style={{ flex: 1, paddingRight: '12px' }}>
              {/* Subject Code */}
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '4px' }}>
                {subjectId?.subjectCode || 'CS501'}
              </div>
              {/* Subject Name */}
              <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>
                {subjectId?.subjectName || 'Subject Name'}
              </div>

              {/* Badge Row */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {/* Badge 1 — Exam Type */}
                <span style={{ backgroundColor: '#EEF2FF', color: '#1E40AF', padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 600 }}>
                  {getExamTypeLabel(patternRef?.examType)}
                </span>
                {/* Badge 2 — Semester */}
                <span style={{ backgroundColor: '#F0FDF4', color: '#065F46', padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 600 }}>
                  Semester {subjectId?.semester || 5}
                </span>
                {/* Badge 3 — Academic Year */}
                <span style={{ backgroundColor: '#FFF7ED', color: '#92400E', padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 600 }}>
                  {academicYear || '2025-26'}
                </span>
                {/* Badge 4 — Credits */}
                <span style={{ backgroundColor: '#F3F4F6', color: '#374151', padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 600 }}>
                  {subjectId?.credits || 4} Credits
                </span>
              </div>
            </div>

            {/* Status Badge */}
            <StatusBadge status={status} />
          </div>

          {/* Card Middle Row — 3 Column Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginTop: '16px', padding: '14px 16px', backgroundColor: '#F8F9FA', borderRadius: '8px' }}>
            {/* Cell 1 — Department */}
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                DEPARTMENT
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)' }}>
                {subjectId?.department || 'Computer Science'}
              </div>
            </div>

            {/* Cell 2 — Total Marks */}
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                TOTAL MARKS
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-navy)' }}>
                {patternRef?.totalMarks || 50}M
              </div>
            </div>

            {/* Cell 3 — Questions */}
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                QUESTIONS
              </div>
              <div style={{ fontSize: '0.825rem', fontWeight: 500, color: 'var(--color-text)' }}>
                {questionsLabel}
              </div>
            </div>
          </div>

          {/* Card Deadline Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '14px', padding: '10px 14px', borderRadius: '8px', backgroundColor: deadlineRowBg.bg, border: deadlineRowBg.border }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.825rem', fontWeight: 500, color: 'var(--color-text)' }}>
              <Calendar size={14} style={{ color: daysInfo.passed ? '#B91C1C' : '#6B7280' }} />
              <span>Deadline: <strong>{formatDateFormatted(deadline)}</strong></span>
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: daysInfo.color }}>
              {daysInfo.text}
            </div>
          </div>

          {/* Revision Requested Box */}
          {isRevisionRequested && reviewNote && (
            <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: '8px', padding: '12px 14px', marginTop: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.875rem', color: '#D97706' }}>
                <AlertTriangle size={15} />
                Revision Requested by Exam Cell
              </div>
              <div style={{ fontSize: '0.825rem', color: 'var(--color-text)', marginTop: '6px', fontStyle: 'italic', lineHeight: 1.5 }}>
                "{reviewNote}"
              </div>
            </div>
          )}

          {/* Card Progress Row (for draft status) */}
          {isDraft && totalQuestions > 0 && (
            <div style={{ marginTop: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                <span>{filledCount} of {totalQuestions} questions filled</span>
                <span style={{ fontWeight: 600 }}>{progressPercent}%</span>
              </div>
              <div style={{ height: '6px', backgroundColor: '#EEEEEE', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', backgroundColor: 'var(--color-gold)', borderRadius: '3px', width: `${progressPercent}%`, transition: 'width 300ms ease' }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card Action Row */}
      <div style={{ padding: '14px 20px', borderTop: '1px solid #F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', backgroundColor: '#FAFBFD' }}>
        {status === 'assigned' && (
          <>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Not started yet</span>
            <button
              onClick={onOpen}
              style={{ padding: '9px 18px', backgroundColor: 'var(--color-navy)', color: 'white', border: 'none', borderRadius: '7px', fontSize: '0.825rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Edit3 size={14} /> Open &amp; Start Writing
            </button>
          </>
        )}

        {status === 'draft' && (
          <>
            <button
              onClick={onOpen}
              style={{ padding: '8px 14px', backgroundColor: 'transparent', color: 'var(--color-navy)', border: '1px solid var(--color-navy)', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Eye size={13} /> Preview Draft
            </button>
            <button
              onClick={onOpen}
              style={{ padding: '9px 18px', backgroundColor: 'var(--color-navy)', color: 'white', border: 'none', borderRadius: '7px', fontSize: '0.825rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Edit3 size={14} /> Continue Writing
            </button>
          </>
        )}

        {status === 'submitted' && (
          <>
            <div style={{ color: '#1E40AF', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
              <Clock size={14} style={{ animation: 'spin 3s linear infinite' }} /> Awaiting Exam Cell Review
            </div>
            <button
              onClick={onOpen}
              style={{ padding: '8px 16px', backgroundColor: 'transparent', color: 'var(--color-navy)', border: '1.5px solid var(--color-navy)', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
            >
              View Submission
            </button>
          </>
        )}

        {status === 'revision_requested' && (
          <>
            <span style={{ fontSize: '0.75rem', color: '#92400E', fontWeight: 600 }}>Please update and resubmit</span>
            <button
              onClick={onOpen}
              style={{ padding: '9px 18px', backgroundColor: '#F59E0B', color: 'white', border: 'none', borderRadius: '7px', fontSize: '0.825rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Edit3 size={14} /> Make Revisions
            </button>
          </>
        )}

        {status === 'selected' && (
          <>
            <div style={{ color: 'var(--color-gold)', fontWeight: 700, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Star size={16} fill="var(--color-gold)" /> ★ Selected as Final Paper
            </div>
            <button
              onClick={onOpen}
              style={{ padding: '8px 16px', backgroundColor: 'transparent', color: 'var(--color-gold)', border: '1.5px solid var(--color-gold)', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
            >
              View Final Paper
            </button>
          </>
        )}

        {status === 'archived' && (
          <>
            <span style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>A different paper was selected</span>
            <button
              onClick={onOpen}
              style={{ padding: '8px 14px', backgroundColor: 'transparent', color: '#6B7280', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '0.78rem', cursor: 'pointer' }}
            >
              View My Submission
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Main Faculty QP Submissions List ─────────────────────────────────────────
const QuestionPaperSubmissions = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => { loadAssignments(); }, []);

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/qp-submissions/my-assignments');
      setAssignments(res.data?.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load question paper assignments');
    } finally {
      setLoading(false);
    }
  };

  const FILTERS = [
    { key: 'all',       label: 'All' },
    { key: 'pending',   label: 'Pending' },
    { key: 'submitted', label: 'Submitted' },
    { key: 'selected',  label: 'Selected ★' },
    { key: 'archived',  label: 'Archived' },
  ];

  const grouped = {
    all:       assignments,
    pending:   assignments.filter(a => ['assigned', 'draft', 'revision_requested'].includes(a.status)),
    submitted: assignments.filter(a => ['submitted', 'under_review'].includes(a.status)),
    selected:  assignments.filter(a => a.status === 'selected'),
    archived:  assignments.filter(a => ['archived', 'rejected'].includes(a.status)),
  };
  const filtered = grouped[filter] || assignments;

  // Stats
  const stats = {
    total:     assignments.length,
    pending:   grouped.pending.length,
    submitted: grouped.submitted.length,
    selected:  grouped.selected.length,
  };

  if (loading) return <div style={{ padding: '24px' }}><LoadingSkeleton count={4} /></div>;

  return (
    <div style={{ padding: '0' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.65rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FileText size={24} style={{ color: 'var(--color-gold)' }} />
          My Question Paper Assignments
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
          Review and submit question papers assigned to you by the Exam Cell.
        </p>
      </div>

      {/* Stats */}
      {assignments.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Total Assigned', val: stats.total, color: '#3B82F6', bg: '#EFF6FF' },
            { label: 'Pending Action', val: stats.pending, color: '#D97706', bg: '#FFFBEB' },
            { label: 'Submitted', val: stats.submitted, color: '#059669', bg: '#F0FDF4' },
            { label: 'Selected as Final', val: stats.selected, color: '#C9A227', bg: '#FEF9C3' },
          ].map(({ label, val, color, bg }) => (
            <div key={label} style={{ backgroundColor: bg, border: `1px solid ${color}25`, borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color, lineHeight: 1 }}>{val}</div>
              <div style={{ fontSize: '0.72rem', color: '#6B7280', marginTop: '4px', fontWeight: 500 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filter Tabs */}
      {assignments.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: '6px 14px',
                fontSize: '0.8rem',
                fontWeight: filter === f.key ? 700 : 500,
                borderRadius: '20px',
                border: `1.5px solid ${filter === f.key ? 'var(--color-navy)' : '#E0E0E0'}`,
                backgroundColor: filter === f.key ? 'var(--color-navy)' : 'white',
                color: filter === f.key ? 'white' : 'var(--color-text-secondary)',
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              {f.label}
              {f.key !== 'all' && grouped[f.key]?.length > 0 && (
                <span style={{ marginLeft: '6px', fontSize: '0.72rem', backgroundColor: filter === f.key ? 'rgba(255,255,255,0.25)' : '#F3F4F6', color: filter === f.key ? 'white' : '#6B7280', borderRadius: '10px', padding: '1px 6px', fontWeight: 700 }}>
                  {grouped[f.key].length}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Cards Grid */}
      {assignments.length === 0 ? (
        <div style={{ backgroundColor: 'white', borderRadius: '14px', padding: '60px 24px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '8px' }}>
            No Question Paper Assignments
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', maxWidth: '380px', margin: '0 auto' }}>
            The Exam Cell has not assigned any question papers to you yet. You will receive an email notification when an assignment is created.
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
          No assignments found for this filter.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '20px' }}>
          {filtered.map(sub => (
            <AssignmentCard
              key={sub._id}
              submission={sub}
              onOpen={() => navigate(`/faculty/question-papers/${sub._id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default QuestionPaperSubmissions;
