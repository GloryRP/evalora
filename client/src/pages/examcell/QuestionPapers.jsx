import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, Plus, Trash2, ChevronDown,
  Save, AlertTriangle, CheckCircle, BookOpen, Settings2, GitMerge,
  Zap, Users, Clock, Star, RotateCcw, Send, ChevronRight, ChevronLeft, X
} from 'lucide-react';
import api from '../../lib/api';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import toast from 'react-hot-toast';
import { useAcademicYear } from '../../contexts/InstitutionContext';

const EXAM_TYPES = [
  { key: 'internal1', label: 'Internal Assessment 1 (CIE-1)' },
  { key: 'internal2', label: 'Internal Assessment 2 (CIE-2)' },
  { key: 'external',  label: 'End Semester Exam (SEE)' },
  { key: 'makeup',    label: 'Make-up / Supplementary' },
];

const DEFAULT_SLOTS = {
  internal1: { maxMarks: 50, slots: [
    { questionNumber: 'Q1', maxMarks: 20, or: { questionNumber: 'Q2', maxMarks: 20 } },
    { questionNumber: 'Q3', maxMarks: 20, or: { questionNumber: 'Q4', maxMarks: 20 } },
    { questionNumber: 'Q5', maxMarks: 10, or: null },
  ]},
  internal2: { maxMarks: 50, slots: [
    { questionNumber: 'Q1', maxMarks: 20, or: { questionNumber: 'Q2', maxMarks: 20 } },
    { questionNumber: 'Q3', maxMarks: 20, or: { questionNumber: 'Q4', maxMarks: 20 } },
    { questionNumber: 'Q5', maxMarks: 10, or: null },
  ]},
  external: { maxMarks: 100, slots: [
    { questionNumber: 'Q1', maxMarks: 20, or: { questionNumber: 'Q2', maxMarks: 20 } },
    { questionNumber: 'Q3', maxMarks: 20, or: { questionNumber: 'Q4', maxMarks: 20 } },
    { questionNumber: 'Q5', maxMarks: 20, or: { questionNumber: 'Q6', maxMarks: 20 } },
    { questionNumber: 'Q7', maxMarks: 20, or: { questionNumber: 'Q8', maxMarks: 20 } },
    { questionNumber: 'Q9', maxMarks: 20, or: { questionNumber: 'Q10', maxMarks: 20 } },
  ]},
  makeup: { maxMarks: 50, slots: [
    { questionNumber: 'Q1', maxMarks: 20, or: { questionNumber: 'Q2', maxMarks: 20 } },
    { questionNumber: 'Q3', maxMarks: 20, or: { questionNumber: 'Q4', maxMarks: 20 } },
    { questionNumber: 'Q5', maxMarks: 10, or: null },
  ]},
};

const getExamTypeLabel = (type) => {
  const m = {
    internal1: 'Internal Assessment 1 (CIE-1)',
    internal2: 'Internal Assessment 2 (CIE-2)',
    external: 'End Semester Exam (SEE)',
    makeup: 'Make-up / Supplementary',
  };
  return m[type] || type;
};

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const formatDatetime = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = {
    assigned:           { bg: '#F3F4F6', color: '#6B7280', label: 'Awaiting' },
    draft:              { bg: '#FEF3C7', color: '#92400E', label: 'In Progress' },
    submitted:          { bg: '#DBEAFE', color: '#1D4ED8', label: 'Submitted' },
    under_review:       { bg: '#FDE8D0', color: '#C2410C', label: 'Under Review' },
    revision_requested: { bg: '#FFEDD5', color: '#C2410C', label: 'Revision Sent' },
    selected:           { bg: '#FEF9C3', color: '#713F12', label: '✓ Selected' },
    archived:           { bg: '#F3F4F6', color: '#9CA3AF', label: 'Archived' },
    rejected:           { bg: '#FEE2E2', color: '#B91C1C', label: 'Rejected' },
  };
  const c = cfg[status] || cfg.assigned;
  return (
    <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '3px 10px', borderRadius: '12px', backgroundColor: c.bg, color: c.color, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
      {c.label}
    </span>
  );
};

// ─── Tab Button ───────────────────────────────────────────────────────────────
const TabButton = ({ active, onClick, label }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '8px 16px', fontSize: '0.8rem', fontWeight: 500, borderRadius: '6px', cursor: 'pointer',
        border: '1.5px solid #E0E0E0',
        backgroundColor: active ? 'var(--color-navy)' : 'white',
        color: active ? 'white' : (hovered ? 'var(--color-navy)' : 'var(--color-text-secondary)'),
        borderColor: active ? 'var(--color-navy)' : (hovered ? 'var(--color-navy)' : '#E0E0E0'),
        transition: 'all 150ms ease',
      }}
    >{label}</button>
  );
};

// ─── Slot Row ─────────────────────────────────────────────────────────────────
const SlotRow = ({ slot, idx, onChange, onRemove, totalSlots }) => {
  const [deleteHovered, setDeleteHovered] = useState(false);
  const [orHovered, setOrHovered] = useState(false);
  const [orDeleteHovered, setOrDeleteHovered] = useState(false);
  const addOr = () => {
    const mainNum = parseInt(slot.questionNumber.replace(/\D/g, '')) || idx + 1;
    onChange({ ...slot, or: { questionNumber: `Q${mainNum + 1}`, maxMarks: slot.maxMarks } });
  };
  const removeOr = () => onChange({ ...slot, or: null });
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', backgroundColor: 'white', border: '1px solid #EEEEEE', borderRadius: '8px', marginBottom: slot.or ? '0' : '8px', borderBottomLeftRadius: slot.or ? '0' : '8px', borderBottomRightRadius: slot.or ? '0' : '8px' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--color-navy)', color: 'white', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{idx + 1}</div>
        <input type="text" value={slot.questionNumber} onChange={e => onChange({ ...slot, questionNumber: e.target.value })} placeholder="Q1" style={{ width: '60px', padding: '6px 10px', border: '1.5px solid #E0E0E0', borderRadius: '6px', fontSize: '0.875rem', textAlign: 'center', outline: 'none', fontFamily: 'monospace' }} />
        <span style={{ flex: 1, fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>{slot.or ? 'Student chooses this OR the alternative below' : 'No alternative (compulsory)'}</span>
        <input type="number" value={slot.maxMarks} onChange={e => { const v = parseFloat(e.target.value) || 0; onChange({ ...slot, maxMarks: v, or: slot.or ? { ...slot.or, maxMarks: v } : null }); }} style={{ width: '70px', padding: '6px 10px', border: '1.5px solid #E0E0E0', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 600, textAlign: 'center', outline: 'none' }} />
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>M</span>
        {!slot.or ? (
          <button type="button" onClick={addOr} onMouseEnter={() => setOrHovered(true)} onMouseLeave={() => setOrHovered(false)} style={{ padding: '4px 10px', border: `1.5px solid var(--color-gold)`, borderRadius: '4px', backgroundColor: orHovered ? 'rgba(201,162,39,0.08)' : 'transparent', color: 'var(--color-gold)', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', transition: 'background-color 150ms ease' }}>OR</button>
        ) : (<div style={{ width: '42px' }} />)}
        <button type="button" onClick={onRemove} disabled={totalSlots <= 1} onMouseEnter={() => setDeleteHovered(true)} onMouseLeave={() => setDeleteHovered(false)} style={{ padding: '6px', border: 'none', backgroundColor: 'transparent', color: deleteHovered && totalSlots > 1 ? 'var(--color-error, #B91C1C)' : '#CCCCCC', cursor: totalSlots <= 1 ? 'not-allowed' : 'pointer', borderRadius: '4px', opacity: totalSlots <= 1 ? 0.3 : 1, transition: 'color 150ms ease' }}><Trash2 size={13} /></button>
      </div>
      {slot.or && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', backgroundColor: '#FFFDF5', border: '1px dashed #E8D5A0', borderTop: 'none', borderRadius: '0 0 8px 8px', marginBottom: '8px', marginLeft: '40px' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-gold)', letterSpacing: '0.1em', textTransform: 'uppercase', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px', minWidth: '32px' }}><GitMerge size={10} />OR</span>
          <input type="text" value={slot.or.questionNumber} onChange={e => onChange({ ...slot, or: { ...slot.or, questionNumber: e.target.value } })} placeholder="Q2" style={{ width: '60px', padding: '6px 10px', border: '1.5px solid #E8D5A0', borderRadius: '6px', fontSize: '0.875rem', textAlign: 'center', outline: 'none', fontFamily: 'monospace', backgroundColor: 'white' }} />
          <span style={{ flex: 1, fontSize: '0.825rem', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>Alternative question — student picks one</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--color-gold)', fontWeight: 500, whiteSpace: 'nowrap' }}>{slot.or.maxMarks}M (same marks)</span>
          <button type="button" onClick={removeOr} onMouseEnter={() => setOrDeleteHovered(true)} onMouseLeave={() => setOrDeleteHovered(false)} style={{ padding: '6px', border: 'none', backgroundColor: 'transparent', color: orDeleteHovered ? 'var(--color-error, #B91C1C)' : '#CCCCCC', cursor: 'pointer', borderRadius: '4px', transition: 'color 150ms ease' }}><Trash2 size={13} /></button>
        </div>
      )}
    </div>
  );
};

// ─── Slots Editor ─────────────────────────────────────────────────────────────
const SlotsEditor = ({ slots, onChange, maxMarks, onMaxMarksChange }) => {
  const [addHovered, setAddHovered] = useState(false);
  const computedTotal = slots.reduce((s, sl) => s + (parseFloat(sl.maxMarks) || 0), 0);
  const mismatch = computedTotal !== parseFloat(maxMarks);
  const updateSlot = (idx, val) => onChange(slots.map((s, i) => i === idx ? val : s));
  const removeSlot = (idx) => { if (slots.length > 1) onChange(slots.filter((_, i) => i !== idx)); };
  const addSlot = () => { const next = slots.length + 1; onChange([...slots, { questionNumber: `Q${next * 2 - 1}`, maxMarks: 10, or: null }]); };
  return (
    <div>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '16px', marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <FileText size={12} style={{ color: 'var(--color-gold)' }} />
        Default Pattern (applies to all subjects)
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', padding: '12px 16px', backgroundColor: '#F8F9FA', borderRadius: '8px' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>Total Max Marks</span>
        <input type="number" value={maxMarks} onChange={e => onMaxMarksChange(e.target.value)} style={{ width: '80px', padding: '6px 12px', border: '1.5px solid #E0E0E0', borderRadius: '6px', fontSize: '1rem', fontWeight: 700, color: 'var(--color-navy)', textAlign: 'center', outline: 'none' }} />
        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginLeft: 'auto' }}>Questions sum: <strong style={{ color: mismatch ? '#D97706' : '#059669' }}>{computedTotal}M</strong>{mismatch && <span style={{ color: '#D97706', marginLeft: '8px', fontWeight: 600 }}>(mismatch!)</span>}</span>
      </div>
      <div>{slots.map((slot, idx) => (<SlotRow key={idx} slot={slot} idx={idx} onChange={val => updateSlot(idx, val)} onRemove={() => removeSlot(idx)} totalSlots={slots.length} />))}</div>
      <button type="button" onClick={addSlot} onMouseEnter={() => setAddHovered(true)} onMouseLeave={() => setAddHovered(false)} style={{ width: '100%', padding: '12px', border: `2px dashed ${addHovered ? 'var(--color-gold)' : '#E0E0E0'}`, borderRadius: '8px', backgroundColor: 'transparent', color: addHovered ? 'var(--color-gold)' : 'var(--color-text-secondary)', fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '4px', marginBottom: '16px', transition: 'all 150ms ease' }}>
        <Plus size={14} />+ Add Question
      </button>
    </div>
  );
};

// ─── Exception Row ────────────────────────────────────────────────────────────
const ExceptionRow = ({ exception, subjects, onRemove, onUpdate }) => {
  const [open, setOpen] = useState(false);
  const sub = subjects.find(s => s._id === (exception.subjectId?._id || exception.subjectId));
  const label = sub ? `${sub.subjectName} (${sub.subjectCode})` : 'Select a subject above';
  return (
    <div style={{ border: '1px solid #E0E0E0', borderRadius: '8px', overflow: 'hidden', marginBottom: '8px' }}>
      <button type="button" onClick={() => setOpen(!open)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: '#F9FAFB', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BookOpen size={14} style={{ color: 'var(--color-gold)' }} />
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1F2937' }}>{label}</span>
          {exception.reason && <span style={{ fontSize: '0.7rem', backgroundColor: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: '20px', fontWeight: 600 }}>{exception.reason}</span>}
          <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>{exception.maxMarks}M · {(exception.slots || []).length} slot(s)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button type="button" onClick={e => { e.stopPropagation(); onRemove(); }} style={{ color: '#D1D5DB', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}><Trash2 size={13} /></button>
          <ChevronDown size={16} style={{ color: '#9CA3AF', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 200ms ease' }} />
        </div>
      </button>
      {open && (
        <div style={{ padding: '16px', backgroundColor: 'white', borderTop: '1px solid #F3F4F6' }}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Reason / Note</label>
            <input type="text" value={exception.reason} onChange={e => onUpdate({ ...exception, reason: e.target.value })} placeholder="e.g. MCQ Only, 1 Credit – 25 marks, Lab Component..." style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #E0E0E0', borderRadius: '6px', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <SlotsEditor
            slots={exception.slots || [{ questionNumber: 'Q1', maxMarks: 10, or: null }]}
            onChange={sl => onUpdate({ ...exception, slots: sl })}
            maxMarks={exception.maxMarks}
            onMaxMarksChange={v => onUpdate({ ...exception, maxMarks: parseFloat(v) || 0 })}
          />
        </div>
      )}
    </div>
  );
};

// ─── Exam Type Section ────────────────────────────────────────────────────────
const ExamTypeSection = ({ et, tmpl, slots, exceptions, isOpen, isSaving, subjects, onToggle, onUpdate, onSave, onAddException, onRemoveException, onUpdateException }) => {
  const [headerHovered, setHeaderHovered] = useState(false);
  const [saveHovered, setSaveHovered] = useState(false);
  const [addExHovered, setAddExHovered] = useState(false);
  return (
    <div style={{ marginBottom: '8px' }}>
      <button type="button" onClick={onToggle} onMouseEnter={() => setHeaderHovered(true)} onMouseLeave={() => setHeaderHovered(false)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', backgroundColor: headerHovered && !isOpen ? '#F9F9FF' : 'white', borderRadius: isOpen ? '10px 10px 0 0' : '10px', border: `1px solid ${headerHovered || isOpen ? 'var(--color-navy)' : '#EEEEEE'}`, cursor: 'pointer', transition: 'all 150ms ease', textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, color: 'var(--color-navy)' }}>{et.label}</span>
          {tmpl.saved && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--color-success, #059669)', fontWeight: 500 }}><CheckCircle size={14} />Saved</span>}
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'flex', gap: '16px' }}>
            <span>{tmpl.maxMarks}M</span>
            <span>{slots.length} question slot{slots.length !== 1 ? 's' : ''}</span>
            {slots.filter(s => s.or).length > 0 && <span>{slots.filter(s => s.or).length} with OR</span>}
            {exceptions.length > 0 && <span>{exceptions.length} exception{exceptions.length > 1 ? 's' : ''}</span>}
          </span>
        </div>
        <ChevronDown size={18} style={{ color: '#9CA3AF', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms ease' }} />
      </button>
      {isOpen && (
        <div style={{ backgroundColor: 'white', border: '1px solid var(--color-navy)', borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '0 20px 20px 20px', marginBottom: '16px' }}>
          <SlotsEditor slots={slots} onChange={s => onUpdate({ slots: s })} maxMarks={tmpl.maxMarks} onMaxMarksChange={v => onUpdate({ maxMarks: parseFloat(v) || 0 })} />
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #F0F0F0' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <AlertTriangle size={13} style={{ color: '#F59E0B' }} />
              Exceptional Subjects
              <button type="button" onClick={onAddException} onMouseEnter={() => setAddExHovered(true)} onMouseLeave={() => setAddExHovered(false)} style={{ marginLeft: 'auto', fontSize: '0.8rem', color: addExHovered ? 'var(--color-gold)' : 'var(--color-navy)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, transition: 'color 150ms ease' }}>+ Add Exception</button>
            </div>
            {exceptions.length === 0 ? (
              <p style={{ fontSize: '0.825rem', color: '#AAAAAA', fontStyle: 'italic', textAlign: 'center', padding: '16px' }}>No exceptions — the default pattern above applies to all subjects.</p>
            ) : (
              <div>
                {exceptions.map((ex, idx) => (
                  <div key={idx}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', paddingLeft: '4px' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' }}>Subject:</span>
                      <select value={ex.subjectId} onChange={e => onUpdateException(idx, { ...ex, subjectId: e.target.value })} style={{ fontSize: '0.8rem', border: '1px solid #E0E0E0', borderRadius: '6px', padding: '4px 8px', outline: 'none', backgroundColor: 'white' }}>
                        {subjects.map(s => (<option key={s._id} value={s._id}>{s.subjectName} ({s.subjectCode}){s.credits ? ` – ${s.credits} CR` : ''}</option>))}
                      </select>
                    </div>
                    <ExceptionRow exception={ex} subjects={subjects} onRemove={() => onRemoveException(idx)} onUpdate={val => onUpdateException(idx, val)} />
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
            <button type="button" onClick={onSave} disabled={isSaving} onMouseEnter={() => setSaveHovered(true)} onMouseLeave={() => setSaveHovered(false)} style={{ padding: '10px 24px', backgroundColor: isSaving ? '#9CA3AF' : (saveHovered ? '#162d4a' : 'var(--color-navy)'), color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 600, cursor: isSaving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', transition: 'background-color 150ms ease' }}>
              <Save size={15} />{isSaving ? 'Saving...' : 'Save Template'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Manage Assignments Tab (FIX 1, FIX 2, FIX 5) ────────────────────────────
const ManageAssignmentsTab = ({ onSwitchToReview }) => {
  const { currentAcademicYear, currentSemester } = useAcademicYear();
  const [form, setForm] = useState({
    semester: String(currentSemester),
    academicYear: currentAcademicYear,
    examType: 'internal1',
    deadline: '',
  });

  const [previewSubjects, setPreviewSubjects] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);

  const [overview, setOverview] = useState([]);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [reminderLoading, setReminderLoading] = useState(null);
  const [revisionModal, setRevisionModal] = useState(null);
  const [revisionNote, setRevisionNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const today = new Date(); today.setDate(today.getDate() + 1);
  const minDate = today.toISOString().split('T')[0];

  // Update form when context changes
  useEffect(() => {
    setForm(prev => ({
      ...prev,
      semester: String(currentSemester),
      academicYear: currentAcademicYear,
    }));
  }, [currentAcademicYear, currentSemester]);

  // Auto-fetch subjects preview when semester changes (FIX 1)
  useEffect(() => {
    if (form.semester) {
      loadSubjectsPreview(form.semester);
    }
  }, [form.semester]);

  const loadSubjectsPreview = async (sem) => {
    setPreviewLoading(true);
    try {
      console.log('Fetching subjects for semester:', sem, typeof sem);
      const res = await api.get('/qp-submissions/subjects-preview', {
        params: { semester: Number(sem) }
      });
      setPreviewSubjects(res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch subjects preview:', err);
      setPreviewSubjects([]);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Load status overview when semester/examType changes
  useEffect(() => {
    if (form.semester) {
      loadOverview(form.semester, form.examType, form.academicYear);
    }
  }, [form.semester, form.examType, form.academicYear]);

  const loadOverview = async (sem, et, ay) => {
    setOverviewLoading(true);
    try {
      const res = await api.get('/qp-submissions/overview', {
        params: {
          semester: Number(sem),
          examType: et,
          academicYear: ay,
        }
      });
      setOverview(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load overview:', err);
      setOverview([]);
    } finally {
      setOverviewLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!form.semester || !form.examType || !form.deadline) {
      toast.error('Please select Semester, Exam Type, and Deadline');
      return;
    }
    setGenerating(true);
    setResult(null);
    try {
      const res = await api.post('/qp-submissions/auto-assign', {
        semester: Number(form.semester),
        academicYear: form.academicYear || currentAcademicYear,
        examType: form.examType,
        deadline: form.deadline,
      });
      setResult(res.data?.summary);
      toast.success('Assignments created successfully!');
      loadOverview(form.semester, form.examType, form.academicYear);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate assignments');
    } finally {
      setGenerating(false);
    }
  };

  const handleSendReminder = async (subjectId) => {
    setReminderLoading(subjectId || 'all');
    try {
      await api.post('/qp-submissions/send-reminder', {
        semester: form.semester,
        academicYear: form.academicYear,
        subjectId,
      });
      toast.success('Reminders sent!');
    } catch {
      toast.error('Failed to send reminders');
    } finally {
      setReminderLoading(null);
    }
  };

  const handleReview = async (id, action) => {
    setActionLoading(true);
    try {
      await api.patch(`/qp-submissions/${id}/review`, { action, reviewNote: revisionNote });
      toast.success(action === 'request_revision' ? 'Revision requested' : 'Review recorded');
      setRevisionModal(null);
      setRevisionNote('');
      loadOverview(form.semester, form.examType, form.academicYear);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const noFacultyCount = previewSubjects.filter(s => s.facultyCount === 0).length;

  return (
    <div>
      {/* FIX 1: Auto-Generate Form with 4 explicit fields */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={18} style={{ color: 'var(--color-gold)' }} />
          Auto-Generate Question Paper Assignments
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
          Select the target semester, academic year, exam type, and submission deadline to auto-assign all faculty members who teach subjects in this semester.
        </p>

        {/* 4 Form Fields */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
          {/* Field 1: Semester */}
          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>SEMESTER</label>
            <select
              value={form.semester}
              onChange={e => setForm(f => ({ ...f, semester: e.target.value }))}
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E0E0E0', borderRadius: '8px', fontSize: '0.875rem', outline: 'none', backgroundColor: 'white', boxSizing: 'border-box' }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
          </div>

          {/* Field 2: Academic Year */}
          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>ACADEMIC YEAR</label>
            <input
              type="text"
              placeholder={`e.g. ${currentAcademicYear}`}
              value={form.academicYear}
              onChange={e => setForm(f => ({ ...f, academicYear: e.target.value }))}
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E0E0E0', borderRadius: '8px', fontSize: '0.875rem', outline: 'none', backgroundColor: 'white', boxSizing: 'border-box' }}
            />
          </div>

          {/* Field 3: Exam Type */}
          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>EXAM TYPE</label>
            <select
              value={form.examType}
              onChange={e => setForm(f => ({ ...f, examType: e.target.value }))}
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E0E0E0', borderRadius: '8px', fontSize: '0.875rem', outline: 'none', backgroundColor: 'white', boxSizing: 'border-box' }}
            >
              <option value="internal1">Internal Assessment 1 (CIE-1)</option>
              <option value="internal2">Internal Assessment 2 (CIE-2)</option>
              <option value="external">End Semester Exam (SEE)</option>
              <option value="makeup">Make-up / Supplementary</option>
            </select>
          </div>

          {/* Field 4: Submission Deadline */}
          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>SUBMISSION DEADLINE</label>
            <input
              type="date"
              min={minDate}
              value={form.deadline}
              onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E0E0E0', borderRadius: '8px', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* SUBJECT PREVIEW SECTION */}
        {form.semester && (
          <div style={{ marginBottom: '20px', paddingTop: '16px', borderTop: '1px solid #F0F0F0' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Subjects that will be assigned:
            </div>
            {previewLoading ? (
              <div style={{ fontSize: '0.8rem', color: '#9CA3AF', padding: '8px 0' }}>Loading subjects preview...</div>
            ) : previewSubjects.length === 0 ? (
              <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #F59E0B', borderRadius: '8px', padding: '12px 16px', fontSize: '0.85rem', color: '#92400E' }}>
                No subjects found for Semester {form.semester}. Please add subjects in <strong>Admin → Subjects</strong>.
              </div>
            ) : (
              <div>
                {previewSubjects.map(s => (
                  <div key={s._id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', backgroundColor: '#F8F9FA', borderRadius: '6px', marginBottom: '4px' }}>
                    <span style={{ backgroundColor: 'var(--color-navy)', color: 'white', fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', fontFamily: 'monospace' }}>
                      {s.subjectCode}
                    </span>
                    <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)' }}>
                      {s.subjectName}
                    </span>
                    <span style={{ fontSize: '0.72rem', backgroundColor: '#E5E7EB', color: '#374151', padding: '2px 8px', borderRadius: '12px' }}>
                      {s.department}
                    </span>
                    <span style={{ fontSize: '0.72rem', backgroundColor: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                      {s.credits || 4} Credits
                    </span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: s.facultyCount > 0 ? '#059669' : '#D97706' }}>
                      {s.facultyCount > 0 ? `${s.facultyCount} faculty assigned` : '⚠ No faculty'}
                    </span>
                  </div>
                ))}

                {noFacultyCount > 0 && (
                  <div style={{ fontSize: '0.8rem', color: '#D97706', fontWeight: 600, marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    ⚠ {noFacultyCount} subject{noFacultyCount > 1 ? 's have' : ' has'} no faculty assigned. Go to <strong>Admin → Faculty</strong> to assign subjects.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={generating || previewSubjects.length === 0}
          style={{
            width: '100%',
            padding: '14px 24px',
            backgroundColor: generating || previewSubjects.length === 0 ? '#9CA3AF' : 'var(--color-navy)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.9rem',
            fontWeight: 700,
            cursor: generating || previewSubjects.length === 0 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            gap: '10px',
            transition: 'background-color 150ms ease',
          }}
        >
          <Zap size={18} />
          {generating
            ? 'Generating assignments...'
            : `Auto-Generate & Notify Faculty for ${previewSubjects.length} Subjects`}
        </button>

        {/* FIX 2: Result Summary with Subject-wise detail table */}
        {result && (
          <div style={{ marginTop: '20px' }}>
            <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '14px 18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle size={18} style={{ color: '#15803D' }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#15803D' }}>Assignments Created Successfully</span>
            </div>

            {/* 4 Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
              {[
                { label: 'Subjects Processed', val: result.subjectsProcessed, color: '#3B82F6' },
                { label: 'Assignments Created', val: result.assignmentsCreated, color: '#10B981' },
                { label: 'Faculty Notified', val: result.assignmentsCreated, color: '#6366F1' },
                { label: 'No Faculty Found', val: result.subjectsWithNoFaculty?.length || 0, color: result.subjectsWithNoFaculty?.length > 0 ? '#EF4444' : '#9CA3AF' },
              ].map(({ label, val, color }) => (
                <div key={label} style={{ backgroundColor: 'white', border: '1px solid #F0F0F0', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 700, color }}>{val}</div>
                  <div style={{ fontSize: '0.72rem', color: '#6B7280', marginTop: '2px' }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Expanded Summary Detail Table */}
            {result.subjectDetails && result.subjectDetails.length > 0 && (
              <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'white' }}>
                <div style={{ padding: '12px 16px', backgroundColor: '#F8F9FA', borderBottom: '1px solid #E5E7EB', fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-navy)' }}>
                  Subject-wise Assignment Summary
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#6B7280' }}>SUBJECT CODE</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#6B7280' }}>SUBJECT NAME</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#6B7280' }}>DEPARTMENT</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: '#6B7280' }}>SEM</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#6B7280' }}>FACULTY ASSIGNED</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: '#6B7280' }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.subjectDetails.map((sub, idx) => {
                      const facultyDisplay = sub.facultyAssignedCount === 0
                        ? <span style={{ color: '#D97706', fontWeight: 600 }}>⚠ None — Add in Admin</span>
                        : sub.facultyAssignedCount === 1
                        ? sub.facultyNames[0]
                        : `${sub.facultyNames[0]} + ${sub.facultyAssignedCount - 1} more`;

                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid #F3F4F6' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--color-navy)' }}>{sub.subjectCode}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 500 }}>{sub.subjectName}</td>
                          <td style={{ padding: '10px 12px', color: '#6B7280' }}>{sub.department}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>Sem {sub.semester}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 500 }}>{facultyDisplay}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            {sub.facultyAssignedCount > 0 ? (
                              <span style={{ backgroundColor: '#DCFCE7', color: '#15803D', fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '10px' }}>✓ Assigned</span>
                            ) : (
                              <span style={{ backgroundColor: '#FEF3C7', color: '#92400E', fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '10px' }}>⚠ No Faculty</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FIX 5: Overview Table with subject code, name, department, semester, academic year */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--color-navy)', margin: 0 }}>
            Current Assignment Status (Semester {form.semester} — {getExamTypeLabel(form.examType)})
          </h3>
          <button
            onClick={() => loadOverview(form.semester, form.examType, form.academicYear)}
            style={{ padding: '6px 12px', border: '1px solid #E0E0E0', borderRadius: '6px', fontSize: '0.75rem', backgroundColor: 'white', cursor: 'pointer' }}
          >
            Refresh Status
          </button>
        </div>

        {overviewLoading ? (
          <div style={{ padding: '24px' }}><LoadingSkeleton count={4} /></div>
        ) : overview.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>📊</div>
            No active assignments for Semester {form.semester} ({getExamTypeLabel(form.examType)}). Click Auto-Generate above.
          </div>
        ) : (
          <div>
            {overview.map(subject => {
              const isExpanded = expandedSubject === subject.subjectId?.toString();
              return (
                <div key={subject.subjectId?.toString()} style={{ borderBottom: '1px solid #F5F5F5' }}>
                  {/* Subject group header showing: [Code] [Subject Name] | [Department] | Sem [N] | [Academic Year] */}
                  <div
                    style={{ padding: '14px 24px', backgroundColor: '#1E3A5F', color: 'white', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                    onClick={() => setExpandedSubject(isExpanded ? null : subject.subjectId?.toString())}
                  >
                    <ChevronRight size={16} style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 200ms ease', flexShrink: 0 }} />
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', fontFamily: 'monospace', backgroundColor: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                      {subject.subjectCode}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', flex: 1 }}>
                      {subject.subjectName}
                    </span>
                    <span style={{ fontSize: '0.75rem', backgroundColor: 'rgba(255,255,255,0.15)', padding: '3px 10px', borderRadius: '12px' }}>
                      {subject.department}
                    </span>
                    <span style={{ fontSize: '0.75rem', backgroundColor: 'rgba(255,255,255,0.15)', padding: '3px 10px', borderRadius: '12px' }}>
                      Sem {subject.semester}
                    </span>
                    <span style={{ fontSize: '0.75rem', backgroundColor: 'rgba(255,255,255,0.15)', padding: '3px 10px', borderRadius: '12px' }}>
                      {subject.academicYear || currentAcademicYear}
                    </span>
                    <span style={{ fontSize: '0.75rem' }}>Assigned: {subject.totalAssigned}</span>
                    <span style={{ fontSize: '0.75rem' }}>Submitted: {subject.submitted}</span>
                    {subject.hasSelectedPaper ? (
                      <span style={{ fontSize: '0.72rem', backgroundColor: '#FEF9C3', color: '#713F12', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>✓ Selected</span>
                    ) : (
                      <span style={{ fontSize: '0.72rem', backgroundColor: 'rgba(255,255,255,0.12)', padding: '2px 8px', borderRadius: '10px' }}>—</span>
                    )}
                    <button
                      onClick={e => { e.stopPropagation(); handleSendReminder(subject.subjectId?.toString()); }}
                      disabled={reminderLoading !== null}
                      style={{ padding: '4px 10px', backgroundColor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '4px', color: 'white', fontSize: '0.72rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      {reminderLoading === subject.subjectId?.toString() ? 'Sending...' : 'Send Reminder'}
                    </button>
                  </div>

                  {/* Expanded rows per faculty */}
                  {isExpanded && (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#F8F9FF' }}>
                          <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>Faculty Name</th>
                          <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>Emp ID</th>
                          <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>Dept</th>
                          <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>Status</th>
                          <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>Submitted At</th>
                          <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(subject.submissions || []).map(sub => (
                          <tr key={sub.submissionId?.toString()} style={{ borderBottom: '1px solid #F5F5F5' }}>
                            <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-navy)' }}>{sub.facultyName || '—'}</td>
                            <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)', fontFamily: 'monospace', fontSize: '0.8rem' }}>{sub.employeeId || '—'}</td>
                            <td style={{ padding: '12px 16px', color: '#6B7280', fontSize: '0.8rem' }}>{sub.department || subject.department}</td>
                            <td style={{ padding: '12px 16px' }}><StatusBadge status={sub.status} /></td>
                            <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{sub.submittedAt ? formatDate(sub.submittedAt) : '—'}</td>
                            <td style={{ padding: '12px 16px' }}>
                              {['submitted', 'under_review'].includes(sub.status) ? (
                                <button
                                  onClick={() => onSwitchToReview(subject.subjectId?.toString(), form.semester, form.examType)}
                                  style={{ padding: '5px 12px', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '5px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'white' }} /> Review Now
                                </button>
                              ) : sub.status === 'selected' ? (
                                <span style={{ fontSize: '0.75rem', color: '#92400E', fontWeight: 600 }}>✓ Final Paper</span>
                              ) : sub.status === 'archived' ? (
                                <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>Archived</span>
                              ) : (
                                <button onClick={() => handleSendReminder(subject.subjectId?.toString())} style={{ padding: '5px 12px', backgroundColor: 'transparent', color: '#6B7280', border: '1px solid #E0E0E0', borderRadius: '5px', fontSize: '0.75rem', cursor: 'pointer' }}>Remind</button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Revision Modal */}
      {revisionModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '28px', maxWidth: '500px', width: '90%' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)', marginBottom: '8px', fontSize: '1.1rem' }}>Request Revision</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>{revisionModal.facultyName}</p>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', marginBottom: '6px' }}>REVISION NOTES</label>
            <textarea value={revisionNote} onChange={e => setRevisionNote(e.target.value)} placeholder="Describe what needs to be changed..." rows={4} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E0E0E0', borderRadius: '8px', fontSize: '0.875rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.5 }} />
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button onClick={() => { setRevisionModal(null); setRevisionNote(''); }} style={{ flex: 1, padding: '10px', backgroundColor: '#F3F4F6', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => handleReview(revisionModal.submissionId, 'request_revision')} disabled={actionLoading || !revisionNote.trim()} style={{ flex: 2, padding: '10px', backgroundColor: '#D97706', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', opacity: !revisionNote.trim() ? 0.5 : 1 }}>{actionLoading ? 'Sending...' : 'Send Revision Request'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Review & Select Tab ───────────────────────────────────────────────────────
const ReviewSelectTab = ({ initialSubjectId, initialSemester, initialExamType }) => {
  const { currentAcademicYear, currentSemester } = useAcademicYear();
  const [semester, setSemester] = useState(initialSemester || String(currentSemester));
  const [examType, setExamType] = useState(initialExamType || 'internal1');
  const [academicYear, setAcademicYear] = useState(currentAcademicYear);
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(initialSubjectId || '');
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectModal, setSelectModal] = useState(null);
  const [selecting, setSelecting] = useState(false);
  const [revisionModal, setRevisionModal] = useState(null);
  const [revisionNote, setRevisionNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Update when context changes
  useEffect(() => {
    setAcademicYear(currentAcademicYear);
    setSemester(String(currentSemester));
  }, [currentAcademicYear, currentSemester]);

  useEffect(() => {
    loadSubjectsForFilters(semester, examType, academicYear);
  }, [semester, examType, academicYear]);

  const loadSubjectsForFilters = async (sem, et, ay) => {
    try {
      const res = await api.get('/qp-submissions/overview', {
        params: {
          semester: Number(sem),
          examType: et,
          academicYear: ay,
        }
      });
      const overviewData = res.data?.data || [];
      setSubjectOptions(overviewData);
      if (initialSubjectId && overviewData.some(s => s.subjectId?.toString() === initialSubjectId)) {
        setSelectedSubjectId(initialSubjectId);
        loadSubmissions(initialSubjectId);
      }
    } catch (err) {
      console.error('Failed to load subjects for filters:', err);
      setSubjectOptions([]);
    }
  };

  const loadSubmissions = async (subjectId) => {
    if (!subjectId) return;
    setLoading(true);
    try {
      const res = await api.get(`/qp-submissions/subject/${subjectId}`);
      setSubmissions(res.data?.data || []);
    } catch {
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectChange = (subjectId) => {
    setSelectedSubjectId(subjectId);
    loadSubmissions(subjectId);
  };

  const handleSelectFinal = async () => {
    if (!selectModal) return;
    setSelecting(true);
    try {
      const res = await api.post('/qp-submissions/select', {
        submissionId: selectModal._id,
        examSeriesId: selectModal.examSeriesId,
        subjectId: selectedSubjectId,
      });
      toast.success(res.data.message);
      setSelectModal(null);
      loadSubmissions(selectedSubjectId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to select');
    } finally {
      setSelecting(false);
    }
  };

  const handleReview = async (id, action) => {
    setActionLoading(true);
    try {
      await api.patch(`/qp-submissions/${id}/review`, { action, reviewNote: revisionNote });
      toast.success(action === 'request_revision' ? 'Revision requested' : 'Review recorded');
      setRevisionModal(null);
      setRevisionNote('');
      loadSubmissions(selectedSubjectId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const hasSelected = submissions.some(s => s.isSelected || s.status === 'selected');
  const selectedSub = submissions.find(s => s.isSelected || s.status === 'selected');
  const selectedSubjectObj = subjectOptions.find(s => s.subjectId?.toString() === selectedSubjectId);

  // Render question block
  const renderQuestion = (q, isOr = false) => (
    <div key={q._id} style={{ backgroundColor: isOr ? '#FFFDF5' : 'white', borderRadius: '8px', padding: '12px 14px', marginBottom: '8px', border: isOr ? '1px solid #F0E8C8' : '1px solid #F0F0F0' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '6px' }}>
        <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: isOr ? '#F59E0B' : 'var(--color-navy)', color: 'white', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{q.qNo}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.88rem', color: 'var(--color-text)', lineHeight: 1.6, marginBottom: '4px' }}>
            {q.questionText || <span style={{ color: '#AAAAAA', fontStyle: 'italic' }}>No question text</span>}
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {q.bloomsLevel && <span style={{ fontSize: '0.62rem', backgroundColor: '#F3F4F6', color: '#6B7280', padding: '2px 7px', borderRadius: '8px' }}>{q.bloomsLevel}</span>}
            {q.unit && <span style={{ fontSize: '0.62rem', color: '#9CA3AF' }}>{q.unit}</span>}
            {q.co && <span style={{ fontSize: '0.62rem', color: '#9CA3AF' }}>{q.co}</span>}
          </div>
        </div>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, backgroundColor: '#FEF3C7', color: '#92400E', padding: '3px 8px', borderRadius: '6px', flexShrink: 0 }}>{q.marks}M</span>
      </div>
    </div>
  );

  const renderQuestions = (questions) => {
    const rendered = [];
    let i = 0;
    while (i < questions.length) {
      const q = questions[i];
      const nextQ = questions[i + 1];
      if (nextQ && q.orGroupId && nextQ.orGroupId === q.orGroupId && nextQ.isOrQuestion) {
        rendered.push(
          <div key={q._id || i} style={{ marginBottom: '16px' }}>
            {renderQuestion(q, false)}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '8px 0' }}>
              <div style={{ flex: 1, borderBottom: '2px dashed #E8D5A0' }} />
              <span style={{ backgroundColor: '#FFFBEB', border: '1px solid #E8D5A0', borderRadius: '20px', padding: '3px 12px', fontSize: '0.68rem', fontWeight: 700, color: 'var(--color-gold)', letterSpacing: '0.08em' }}>OR ALTERNATIVE</span>
              <div style={{ flex: 1, borderBottom: '2px dashed #E8D5A0' }} />
            </div>
            {renderQuestion(nextQ, true)}
          </div>
        );
        i += 2;
      } else {
        rendered.push(<div key={q._id || i} style={{ marginBottom: '16px' }}>{renderQuestion(q, false)}</div>);
        i++;
      }
    }
    return rendered;
  };

  return (
    <div>
      {/* Selectors */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '20px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '16px' }}>Review Submissions &amp; Select Final Paper</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>SEMESTER</label>
            <select value={semester} onChange={e => setSemester(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E0E0E0', borderRadius: '8px', fontSize: '0.875rem', outline: 'none', backgroundColor: 'white', boxSizing: 'border-box' }}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (<option key={s} value={s}>Semester {s}</option>))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>EXAM TYPE</label>
            <select value={examType} onChange={e => setExamType(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E0E0E0', borderRadius: '8px', fontSize: '0.875rem', outline: 'none', backgroundColor: 'white', boxSizing: 'border-box' }}>
              <option value="internal1">Internal Assessment 1 (CIE-1)</option>
              <option value="internal2">Internal Assessment 2 (CIE-2)</option>
              <option value="external">End Semester Exam (SEE)</option>
              <option value="makeup">Make-up / Supplementary</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>SUBJECT</label>
            <select value={selectedSubjectId} onChange={e => handleSubjectChange(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E0E0E0', borderRadius: '8px', fontSize: '0.875rem', outline: 'none', backgroundColor: 'white', boxSizing: 'border-box' }}>
              <option value="">— Select a subject —</option>
              {subjectOptions.map(s => (<option key={s.subjectId?.toString()} value={s.subjectId?.toString()}>{s.subjectCode} — {s.subjectName} ({s.submissions?.filter(x => ['submitted','under_review','selected'].includes(x.status)).length} submitted{s.hasSelectedPaper ? ', 1 selected' : ''})</option>))}
            </select>
          </div>
        </div>

        {selectedSubjectId && (
          <div style={{ marginTop: '12px', padding: '10px 16px', borderRadius: '8px', backgroundColor: hasSelected ? '#F0FDF4' : '#FFFBEB', border: `1px solid ${hasSelected ? '#BBF7D0' : '#F59E0B'}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
            {hasSelected ? (
              <><Star size={16} style={{ color: '#15803D' }} /><span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#15803D' }}>✓ Final paper selected — {selectedSub?.facultyId?.name}'s submission</span></>
            ) : (
              <><Clock size={16} style={{ color: '#D97706' }} /><span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#D97706' }}>Awaiting selection — {submissions.filter(s => ['submitted','under_review'].includes(s.status)).length} submission(s) to review</span></>
            )}
          </div>
        )}
      </div>

      {/* Submissions side-by-side cards */}
      {loading ? (
        <div style={{ padding: '24px' }}><LoadingSkeleton count={3} /></div>
      ) : submissions.length === 0 && selectedSubjectId ? (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '60px 24px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '8px' }}>No submissions yet for this subject</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Faculty have not submitted question papers yet.</div>
        </div>
      ) : submissions.length === 0 ? (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '60px 24px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '8px' }}>Select Semester and Subject</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Choose a semester and subject above to view and compare faculty submissions.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px', alignItems: 'flex-start' }}>
          {submissions.map(sub => {
            const isSelectedSub = sub.isSelected || sub.status === 'selected';
            const isArchived = sub.status === 'archived';
            const canSelect = ['submitted', 'under_review'].includes(sub.status) && !hasSelected;
            return (
              <div key={sub._id} style={{
                minWidth: submissions.length === 1 ? '100%' : '340px',
                maxWidth: submissions.length === 1 ? '100%' : '420px',
                flex: '1 0 340px',
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                border: isSelectedSub ? '2px solid #C9A227' : '1.5px solid #EEEEEE',
                overflow: 'hidden',
                opacity: isArchived ? 0.7 : 1,
                transition: 'all 300ms ease',
              }}>
                {isSelectedSub && (
                  <div style={{ backgroundColor: '#FEF9C3', padding: '8px 16px', borderBottom: '2px solid #C9A227', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Star size={15} style={{ color: '#C9A227' }} />
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#713F12', letterSpacing: '0.05em' }}>✓ SELECTED AS FINAL PAPER</span>
                  </div>
                )}
                {isArchived && (
                  <div style={{ backgroundColor: '#F3F4F6', padding: '7px 16px', borderBottom: '1px solid #E0E0E0' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9CA3AF' }}>ARCHIVED — Not selected</span>
                  </div>
                )}

                <div style={{ padding: '16px 20px', borderBottom: '1px solid #F0F0F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '2px' }}>{sub.facultyId?.name || '—'}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>{sub.facultyId?.employeeId} · {sub.facultyId?.department}</div>
                      {sub.submittedAt && <div style={{ fontSize: '0.72rem', color: '#6B7280', marginTop: '4px' }}>Submitted: {formatDatetime(sub.submittedAt)}</div>}
                    </div>
                    <StatusBadge status={sub.status} />
                  </div>
                </div>

                <div style={{ padding: '16px 20px', maxHeight: '480px', overflowY: 'auto' }}>
                  {(sub.submittedQuestions || []).length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#AAAAAA', fontStyle: 'italic', fontSize: '0.875rem', padding: '20px 0' }}>No questions submitted yet</div>
                  ) : renderQuestions(sub.submittedQuestions)}
                </div>

                {!isArchived && ['submitted', 'under_review', 'selected'].includes(sub.status) && (
                  <div style={{ padding: '14px 20px', borderTop: '1px solid #F0F0F0', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {!isSelectedSub && ['submitted', 'under_review'].includes(sub.status) && (
                      <button
                        onClick={() => setRevisionModal(sub)}
                        style={{ flex: 1, padding: '8px 12px', backgroundColor: 'transparent', color: '#D97706', border: '1.5px solid #D97706', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                      >Request Revision</button>
                    )}
                    {canSelect && (
                      <button
                        onClick={() => setSelectModal(sub)}
                        style={{ flex: 2, padding: '8px 16px', backgroundColor: 'var(--color-navy)', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                      >Select as Final ★</button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Select Modal */}
      {selectModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '14px', padding: '28px', maxWidth: '500px', width: '90%' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)', marginBottom: '12px', fontSize: '1.15rem' }}>Select Final Question Paper</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '16px', lineHeight: 1.6 }}>
              You are selecting <strong>{selectModal.facultyId?.name}'s</strong> submission as the final question paper for <strong>{selectedSubjectObj?.subjectName}</strong>.
            </p>
            <div style={{ backgroundColor: '#F8F9FA', borderRadius: '8px', padding: '14px 16px', marginBottom: '20px' }}>
              {[
                '✓ Lock this paper as the official exam question paper',
                `✓ Archive other submission(s) for this subject`,
                `✓ Notify ${selectModal.facultyId?.name} that their paper was selected`,
                '✓ Notify other faculty that a different paper was selected',
              ].map((item, i) => (
                <div key={i} style={{ fontSize: '0.825rem', color: '#374151', marginBottom: '6px' }}>{item}</div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setSelectModal(null)} style={{ flex: 1, padding: '10px', backgroundColor: '#F3F4F6', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSelectFinal} disabled={selecting} style={{ flex: 2, padding: '10px', backgroundColor: 'var(--color-navy)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, cursor: selecting ? 'not-allowed' : 'pointer' }}>
                {selecting ? 'Confirming...' : 'Confirm Selection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revision Modal */}
      {revisionModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '28px', maxWidth: '500px', width: '90%' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)', marginBottom: '8px', fontSize: '1.1rem' }}>Request Revision</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>{revisionModal.facultyId?.name}</p>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', marginBottom: '6px' }}>FEEDBACK / COMMENTS</label>
            <textarea value={revisionNote} onChange={e => setRevisionNote(e.target.value)} placeholder="Describe what needs to be changed..." rows={4} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E0E0E0', borderRadius: '8px', fontSize: '0.875rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.5 }} />
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button onClick={() => { setRevisionModal(null); setRevisionNote(''); }} style={{ flex: 1, padding: '10px', backgroundColor: '#F3F4F6', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => handleReview(revisionModal._id, 'request_revision')} disabled={actionLoading || !revisionNote.trim()} style={{ flex: 2, padding: '10px', backgroundColor: '#D97706', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', opacity: !revisionNote.trim() ? 0.5 : 1 }}>{actionLoading ? 'Sending...' : 'Send Revision Request'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main QuestionPapers Page ─────────────────────────────────────────────────
const QuestionPapers = () => {
  const [activeTab, setActiveTab] = useState('templates');
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [templates, setTemplates] = useState({});
  const [saving, setSaving] = useState(null);
  const [openPanel, setOpenPanel] = useState('internal1');
  const [reviewSubjectTarget, setReviewSubjectTarget] = useState(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [tmplRes, subRes] = await Promise.all([
        api.get('/examcell/qp-templates').catch(() => ({ data: { data: [] } })),
        api.get('/examcell/subjects').catch(() => ({ data: { data: [] } })),
      ]);

      const map = {};
      EXAM_TYPES.forEach(et => {
        const found = tmplRes.data?.data?.find(t => t.examType === et.key);
        if (found) {
          const slots = found.slots || found.questions?.map(q => ({ questionNumber: q.questionNumber, maxMarks: q.maxMarks, or: null })) || DEFAULT_SLOTS[et.key].slots;
          map[et.key] = {
            maxMarks: found.maxMarks,
            slots,
            exceptions: (found.exceptions || []).map(ex => ({ ...ex, subjectId: ex.subjectId?._id || ex.subjectId, slots: ex.slots || ex.questions?.map(q => ({ questionNumber: q.questionNumber, maxMarks: q.maxMarks, or: null })) || [] })),
            saved: true,
          };
        } else {
          map[et.key] = {
            maxMarks: DEFAULT_SLOTS[et.key].maxMarks,
            slots: JSON.parse(JSON.stringify(DEFAULT_SLOTS[et.key].slots)),
            exceptions: [],
            saved: false,
          };
        }
      });
      setTemplates(map);
      setSubjects(subRes.data?.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load configurations');
    } finally {
      setLoading(false);
    }
  };

  const update = (examType, patch) => setTemplates(prev => ({ ...prev, [examType]: { ...prev[examType], ...patch } }));

  const addException = (examType) => {
    const tmpl = templates[examType];
    const usedIds = tmpl.exceptions.map(e => e.subjectId);
    const available = subjects.filter(s => !usedIds.includes(s._id));
    if (available.length === 0) { toast.error('All subjects already have exceptions'); return; }
    const first = available[0];
    update(examType, { exceptions: [...tmpl.exceptions, { subjectId: first._id, reason: '', maxMarks: 25, slots: [{ questionNumber: 'Q1', maxMarks: 10, or: null }, { questionNumber: 'Q2', maxMarks: 10, or: null }, { questionNumber: 'Q3', maxMarks: 5, or: null }] }] });
  };

  const removeException = (examType, idx) => update(examType, { exceptions: templates[examType].exceptions.filter((_, i) => i !== idx) });
  const updateException = (examType, idx, val) => update(examType, { exceptions: templates[examType].exceptions.map((ex, i) => i === idx ? val : ex) });

  const saveTemplate = async (examType) => {
    const tmpl = templates[examType];
    setSaving(examType);
    try {
      await api.post('/examcell/qp-templates', { examType, maxMarks: tmpl.maxMarks, slots: tmpl.slots, questions: tmpl.slots.map(s => ({ questionNumber: s.questionNumber, description: '', maxMarks: s.maxMarks })), exceptions: tmpl.exceptions });
      toast.success('Template saved!');
      update(examType, { saved: true });
    } catch (err) {
      console.error(err);
      toast.error('Failed to save template');
    } finally {
      setSaving(null);
    }
  };

  const handleSwitchToReview = (subjectId, semester, examType) => {
    setReviewSubjectTarget({ subjectId, semester, examType });
    setActiveTab('review');
  };

  if (loading) return <div style={{ padding: '24px', maxWidth: '960px', margin: '0 auto' }}><LoadingSkeleton count={6} /></div>;

  return (
    <div style={{ padding: '0' }}>
      {/* Page header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Settings2 size={24} style={{ color: 'var(--color-gold)' }} />
            Question Papers
          </h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { key: 'templates', label: 'Config Patterns' },
              { key: 'assign', label: 'Manage Assignments' },
              { key: 'review', label: 'Review & Select' },
            ].map(tab => (<TabButton key={tab.key} active={activeTab === tab.key} onClick={() => setActiveTab(tab.key)} label={tab.label} />))}
          </div>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontWeight: 400, marginBottom: '0' }}>
          {activeTab === 'templates' && 'Configure global exam patterns, marks structure, and subject exceptions.'}
          {activeTab === 'assign' && 'Auto-generate assignments for all faculty teaching subjects in an exam series.'}
          {activeTab === 'review' && 'Compare all submissions for each subject and select the final question paper.'}
        </p>
      </div>

      {activeTab === 'templates' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {EXAM_TYPES.map((et) => {
            const tmpl = templates[et.key];
            if (!tmpl) return null;
            return (
              <ExamTypeSection
                key={et.key}
                et={et}
                tmpl={tmpl}
                slots={tmpl.slots || []}
                exceptions={tmpl.exceptions || []}
                isOpen={openPanel === et.key}
                isSaving={saving === et.key}
                subjects={subjects}
                onToggle={() => setOpenPanel(openPanel === et.key ? null : et.key)}
                onUpdate={patch => update(et.key, patch)}
                onSave={() => saveTemplate(et.key)}
                onAddException={() => addException(et.key)}
                onRemoveException={idx => removeException(et.key, idx)}
                onUpdateException={(idx, val) => updateException(et.key, idx, val)}
              />
            );
          })}
        </div>
      ) : activeTab === 'assign' ? (
        <ManageAssignmentsTab onSwitchToReview={handleSwitchToReview} />
      ) : (
        <ReviewSelectTab
          initialSubjectId={reviewSubjectTarget?.subjectId}
          initialSemester={reviewSubjectTarget?.semester}
          initialExamType={reviewSubjectTarget?.examType}
        />
      )}
    </div>
  );
};

export default QuestionPapers;