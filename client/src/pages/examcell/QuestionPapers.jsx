import React, { useState, useEffect } from 'react';
import {
  FileText, Plus, Trash2, ChevronDown, ChevronUp,
  Save, AlertTriangle, CheckCircle, BookOpen, Settings2, GitMerge, Clipboard, Download, Printer
} from 'lucide-react';
import api from '../../lib/api';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

const EXAM_TYPES = [
  { key: 'internal1', label: 'Internal 1 (CIE-1)', color: '#1E3A5F', bg: '#EBF4FF', border: '#BFDBFE' },
  { key: 'internal2', label: 'Internal 2 (CIE-2)', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
  { key: 'external',  label: 'External (SEE)',      color: '#B91C1C', bg: '#FEF2F2', border: '#FECACA' },
  { key: 'makeup',    label: 'Make-up / Supplementary', color: '#92400E', bg: '#FFFBEB', border: '#FDE68A' },
];

const DEFAULT_SLOTS = {
  internal1: {
    maxMarks: 50,
    slots: [
      { questionNumber: 'Q1', maxMarks: 20, or: { questionNumber: 'Q2', maxMarks: 20 } },
      { questionNumber: 'Q3', maxMarks: 20, or: { questionNumber: 'Q4', maxMarks: 20 } },
      { questionNumber: 'Q5', maxMarks: 10, or: null },
    ]
  },
  internal2: {
    maxMarks: 50,
    slots: [
      { questionNumber: 'Q1', maxMarks: 20, or: { questionNumber: 'Q2', maxMarks: 20 } },
      { questionNumber: 'Q3', maxMarks: 20, or: { questionNumber: 'Q4', maxMarks: 20 } },
      { questionNumber: 'Q5', maxMarks: 10, or: null },
    ]
  },
  external: {
    maxMarks: 100,
    slots: [
      { questionNumber: 'Q1', maxMarks: 20, or: { questionNumber: 'Q2', maxMarks: 20 } },
      { questionNumber: 'Q3', maxMarks: 20, or: { questionNumber: 'Q4', maxMarks: 20 } },
      { questionNumber: 'Q5', maxMarks: 20, or: { questionNumber: 'Q6', maxMarks: 20 } },
      { questionNumber: 'Q7', maxMarks: 20, or: { questionNumber: 'Q8', maxMarks: 20 } },
      { questionNumber: 'Q9', maxMarks: 20, or: { questionNumber: 'Q10', maxMarks: 20 } },
    ]
  },
  makeup: {
    maxMarks: 50,
    slots: [
      { questionNumber: 'Q1', maxMarks: 20, or: { questionNumber: 'Q2', maxMarks: 20 } },
      { questionNumber: 'Q3', maxMarks: 20, or: { questionNumber: 'Q4', maxMarks: 20 } },
      { questionNumber: 'Q5', maxMarks: 10, or: null },
    ]
  },
};

// ─── Single Slot Row ──────────────────────────────────────────────────────────
const SlotRow = ({ slot, idx, onChange, onRemove, totalSlots }) => {
  const addOr = () => {
    const mainNum = parseInt(slot.questionNumber.replace(/\D/g, '')) || idx + 1;
    onChange({ ...slot, or: { questionNumber: `Q${mainNum + 1}`, maxMarks: slot.maxMarks } });
  };
  const removeOr = () => onChange({ ...slot, or: null });

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5 shadow-sm">
        <div className="w-6 h-6 rounded-full bg-[#1E3A5F]/10 flex items-center justify-center shrink-0">
          <span className="text-[10px] font-bold text-[#1E3A5F]">{idx + 1}</span>
        </div>
        <input
          type="text"
          value={slot.questionNumber}
          onChange={e => onChange({ ...slot, questionNumber: e.target.value })}
          placeholder="Q1"
          className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-xs font-mono text-center focus:ring-2 focus:ring-[#C9A227] outline-none"
        />
        <span className="text-xs text-gray-400 flex-1 text-center font-medium italic">
          {slot.or ? 'Student chooses this OR the alternative below' : 'No alternative (compulsory)'}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <input
            type="number"
            value={slot.maxMarks}
            onChange={e => {
              const v = parseFloat(e.target.value) || 0;
              onChange({ ...slot, maxMarks: v, or: slot.or ? { ...slot.or, maxMarks: v } : null });
            }}
            className="w-14 px-2 py-1 border border-gray-200 rounded-lg text-xs font-bold text-right focus:ring-2 focus:ring-[#C9A227] outline-none"
          />
          <span className="text-[10px] text-gray-400 font-semibold">M</span>
        </div>

        {!slot.or ? (
          <button
            type="button"
            onClick={addOr}
            title="Add OR alternative"
            className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 border border-dashed border-emerald-300 hover:bg-emerald-50 px-2 py-1 rounded-lg transition"
          >
            <GitMerge size={10} /> OR
          </button>
        ) : (
          <div className="w-[42px]" />
        )}

        <button
          type="button"
          onClick={onRemove}
          disabled={totalSlots <= 1}
          className="text-gray-300 hover:text-red-400 transition p-0.5 disabled:opacity-30"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {slot.or && (
        <>
          <div className="flex items-center gap-2 pl-6">
            <div className="flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 border border-amber-200 rounded-full">
              <GitMerge size={10} className="text-amber-500" />
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">OR</span>
            </div>
            <div className="flex-1 border-t border-dashed border-amber-200" />
          </div>

          <div className="flex items-center gap-2 ml-6 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
            <input
              type="text"
              value={slot.or.questionNumber}
              onChange={e => onChange({ ...slot, or: { ...slot.or, questionNumber: e.target.value } })}
              placeholder="Q2"
              className="w-16 px-2 py-1 border border-amber-200 rounded-lg text-xs font-mono text-center focus:ring-2 focus:ring-[#C9A227] outline-none bg-white"
            />
            <span className="text-xs text-amber-600 flex-1 text-center font-medium italic">
              Alternative question — same marks, student picks one
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs text-amber-500 font-bold">{slot.or.maxMarks}M</span>
              <span className="text-[10px] text-amber-400">(same)</span>
            </div>
            <button
              type="button"
              onClick={removeOr}
              title="Remove OR alternative"
              className="text-amber-300 hover:text-red-400 transition p-0.5"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Slots Editor ─────────────────────────────────────────────────────────────
const SlotsEditor = ({ slots, onChange, maxMarks, onMaxMarksChange }) => {
  const computedTotal = slots.reduce((s, sl) => s + (parseFloat(sl.maxMarks) || 0), 0);
  const mismatch = computedTotal !== parseFloat(maxMarks);

  const updateSlot = (idx, val) => onChange(slots.map((s, i) => i === idx ? val : s));
  const removeSlot = (idx) => { if (slots.length > 1) onChange(slots.filter((_, i) => i !== idx)); };
  const addSlot = () => {
    const next = slots.length + 1;
    onChange([...slots, { questionNumber: `Q${next * 2 - 1}`, maxMarks: 10, or: null }]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Max Marks</label>
        <input
          type="number"
          value={maxMarks}
          onChange={e => onMaxMarksChange(e.target.value)}
          className="w-20 px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-[#C9A227] outline-none text-right"
        />
        <span className="text-xs text-gray-400 flex-1">
          Questions sum: <strong className={mismatch ? 'text-amber-600' : 'text-emerald-600'}>{computedTotal}M</strong>
          {mismatch && <span className="text-amber-500 ml-2 font-semibold">(mismatch!)</span>}
        </span>
      </div>

      <div className="space-y-3">
        {slots.map((slot, idx) => (
          <SlotRow
            key={idx}
            slot={slot}
            idx={idx}
            onChange={val => updateSlot(idx, val)}
            onRemove={() => removeSlot(idx)}
            totalSlots={slots.length}
          />
        ))}
      </div>

      <div className="flex items-start gap-3 text-[11px] text-gray-400 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
        <GitMerge size={13} className="text-amber-500 mt-0.5 shrink-0" />
        <span>
          Use the <strong className="text-amber-600">OR</strong> button on any question to add an alternative.
          Both questions carry the same marks, but only one is attempted — so it counts once in the total.
        </span>
      </div>

      <button
        type="button"
        onClick={addSlot}
        className="text-[#C9A227] border border-dashed border-[#C9A227] hover:bg-amber-50 transition px-3 py-1.5 rounded-lg text-xs font-semibold w-full"
      >
        + Add Question
      </button>
    </div>
  );
};

// ─── Exception subject row ────────────────────────────────────────────────────
const ExceptionRow = ({ exception, subjects, onRemove, onUpdate }) => {
  const [open, setOpen] = useState(false);
  const sub = subjects.find(s => s._id === (exception.subjectId?._id || exception.subjectId));
  const label = sub ? `${sub.subjectName} (${sub.subjectCode})` : 'Select a subject above';

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition text-left"
      >
        <div className="flex items-center gap-2">
          <BookOpen size={14} className="text-[#C9A227]" />
          <span className="text-sm font-semibold text-gray-800">{label}</span>
          {exception.reason && (
            <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">{exception.reason}</span>
          )}
          <span className="text-xs text-gray-500">{exception.maxMarks}M total · {(exception.slots || []).length} slot(s)</span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={e => { e.stopPropagation(); onRemove(); }}
            className="text-gray-300 hover:text-red-400 transition p-1"><Trash2 size={13} /></button>
          {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="px-4 py-4 space-y-4 bg-white">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Reason / Note</label>
            <input
              type="text"
              value={exception.reason}
              onChange={e => onUpdate({ ...exception, reason: e.target.value })}
              placeholder="e.g. MCQ Only, 1 Credit – 25 marks, Lab Component..."
              className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#C9A227] outline-none"
            />
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

// ─── Main Page ────────────────────────────────────────────────────────────────
const QuestionPapers = () => {
  const [activeTab, setActiveTab] = useState('submissions'); // 'templates' or 'submissions'
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [templates, setTemplates] = useState({});
  const [saving, setSaving] = useState(null);
  const [openPanel, setOpenPanel] = useState('internal1');

  // Submissions state
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [activePaper, setActivePaper] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [questionPapers, setQuestionPapers] = useState([]);
  const [showPrintModal, setShowPrintModal] = useState(false);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [tmplRes, subRes, examRes, qpRes] = await Promise.all([
        api.get('/examcell/qp-templates').catch(() => ({ data: { data: [] } })),
        api.get('/examcell/subjects').catch(() => ({ data: { data: [] } })),
        api.get('/examcell/exams').catch(() => ({ data: { data: [] } })),
        api.get('/examcell/question-papers').catch(() => ({ data: { data: [] } })),
      ]);

      const map = {};
      EXAM_TYPES.forEach(et => {
        const found = tmplRes.data?.data?.find(t => t.examType === et.key);
        if (found) {
          const slots = found.slots || found.questions?.map(q => ({ questionNumber: q.questionNumber, maxMarks: q.maxMarks, or: null })) || DEFAULT_SLOTS[et.key].slots;
          map[et.key] = {
            maxMarks: found.maxMarks,
            slots,
            exceptions: (found.exceptions || []).map(ex => ({
              ...ex,
              subjectId: ex.subjectId?._id || ex.subjectId,
              slots: ex.slots || ex.questions?.map(q => ({ questionNumber: q.questionNumber, maxMarks: q.maxMarks, or: null })) || [],
            })),
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
      setExams(examRes.data?.data || []);
      setQuestionPapers(qpRes.data?.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load configurations');
    } finally {
      setLoading(false);
    }
  };

  const update = (examType, patch) =>
    setTemplates(prev => ({ ...prev, [examType]: { ...prev[examType], ...patch } }));

  const addException = (examType) => {
    const tmpl = templates[examType];
    const usedIds = tmpl.exceptions.map(e => e.subjectId);
    const available = subjects.filter(s => !usedIds.includes(s._id));
    if (available.length === 0) { toast.error('All subjects already have exceptions'); return; }
    const first = available[0];
    update(examType, {
      exceptions: [...tmpl.exceptions, {
        subjectId: first._id,
        reason: '',
        maxMarks: 25,
        slots: [{ questionNumber: 'Q1', maxMarks: 10, or: null }, { questionNumber: 'Q2', maxMarks: 10, or: null }, { questionNumber: 'Q3', maxMarks: 5, or: null }],
      }]
    });
  };

  const removeException = (examType, idx) =>
    update(examType, { exceptions: templates[examType].exceptions.filter((_, i) => i !== idx) });

  const updateException = (examType, idx, val) =>
    update(examType, { exceptions: templates[examType].exceptions.map((ex, i) => i === idx ? val : ex) });

  const saveTemplate = async (examType) => {
    const tmpl = templates[examType];
    setSaving(examType);
    try {
      await api.post('/examcell/qp-templates', {
        examType,
        maxMarks: tmpl.maxMarks,
        slots: tmpl.slots,
        questions: tmpl.slots.map(s => ({ questionNumber: s.questionNumber, description: '', maxMarks: s.maxMarks })),
        exceptions: tmpl.exceptions,
      });
      toast.success('Template saved!');
      update(examType, { saved: true });
    } catch (err) {
      console.error(err);
      toast.error('Failed to save template');
    } finally {
      setSaving(null);
    }
  };

  // Submissions approval handlers
  const handleExamChange = async (examId) => {
    setSelectedExamId(examId);
    if (!examId) {
      setActivePaper(null);
      return;
    }
    try {
      const res = await api.get(`/examcell/question-papers/exam/${examId}`);
      if (res.data?.success) {
        setActivePaper(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setActivePaper(null);
      toast.error('No question paper scheme found for this exam.');
    }
  };

  const handleApprovePaper = async () => {
    if (!activePaper) return;
    try {
      setActionLoading(true);
      const res = await api.put(`/examcell/question-papers/${activePaper._id}/approve`);
      if (res.data?.success) {
        toast.success('Question paper approved successfully!');
        setActivePaper(res.data.data);
        // update local list
        setQuestionPapers(prev => {
          const match = prev.find(p => p._id === res.data.data._id);
          if (match) {
            return prev.map(p => p._id === res.data.data._id ? res.data.data : p);
          } else {
            return [...prev, res.data.data];
          }
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to approve question paper');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrintFinalQP = () => {
    const printContent = document.getElementById('final-qp-printable').innerHTML;
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
  };

  const getExamTypeLabel = (type) => {
    switch (type) {
      case 'internal1': return 'Internal 1 (CIE)';
      case 'internal2': return 'Internal 2 (CIE)';
      case 'external': return 'External (SEE)';
      case 'makeup': return 'Makeup/Supplementary';
      default: return type;
    }
  };

  if (loading) return <div className="p-6 max-w-4xl mx-auto"><LoadingSkeleton count={6} /></div>;

  return (
    <div>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Settings2 size={24} style={{ color: 'var(--color-gold)' }} />
            Question Papers
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: 0 }}>
            Set global templates, exceptions, and review faculty-submitted question papers.
          </p>
        </div>

        {/* Top-right action buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('templates')}
            style={{
              padding: '8px 16px',
              fontSize: '0.8rem',
              fontWeight: 500,
              borderRadius: '6px',
              cursor: 'pointer',
              border: '1.5px solid #E0E0E0',
              backgroundColor: activeTab === 'templates' ? 'var(--color-navy)' : 'white',
              color: activeTab === 'templates' ? 'white' : 'var(--color-text-secondary)',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'templates') {
                e.currentTarget.style.borderColor = 'var(--color-navy)';
                e.currentTarget.style.color = 'var(--color-navy)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'templates') {
                e.currentTarget.style.borderColor = '#E0E0E0';
                e.currentTarget.style.color = 'var(--color-text-secondary)';
              }
            }}
          >
            Config Patterns
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            style={{
              padding: '8px 16px',
              fontSize: '0.8rem',
              fontWeight: 500,
              borderRadius: '6px',
              cursor: 'pointer',
              border: '1.5px solid #E0E0E0',
              backgroundColor: activeTab === 'submissions' ? 'var(--color-navy)' : 'white',
              color: activeTab === 'submissions' ? 'white' : 'var(--color-text-secondary)',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'submissions') {
                e.currentTarget.style.borderColor = 'var(--color-navy)';
                e.currentTarget.style.color = 'var(--color-navy)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'submissions') {
                e.currentTarget.style.borderColor = '#E0E0E0';
                e.currentTarget.style.color = 'var(--color-text-secondary)';
              }
            }}
          >
            Review Submissions
          </button>
        </div>
      </div>

      {activeTab === 'templates' ? (
        // ─── TAB 1: TEMPLATE EDITOR ───
        <div className="space-y-4">
          {EXAM_TYPES.map(et => {
            const tmpl = templates[et.key];
            if (!tmpl) return null;
            const slots = tmpl.slots || [];
            const exceptions = tmpl.exceptions || [];
            const isOpen = openPanel === et.key;
            const isSaving = saving === et.key;

            return (
              <div key={et.key} className="rounded-2xl overflow-hidden shadow-sm border bg-white" style={{ borderColor: et.border }}>
                <button
                  type="button"
                  onClick={() => setOpenPanel(isOpen ? null : et.key)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left transition"
                  style={{ background: et.bg }}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-base" style={{ color: et.color }}>{et.label}</span>
                    {tmpl.saved && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <CheckCircle size={10} /> Saved
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      {tmpl.maxMarks}M &bull; {slots.length} question slot{slots.length !== 1 ? 's' : ''}
                      {slots.filter(s => s.or).length > 0 && ` · ${slots.filter(s => s.or).length} with OR`}
                      {exceptions.length > 0 && ` · ${exceptions.length} exception${exceptions.length > 1 ? 's' : ''}`}
                    </span>
                  </div>
                  {isOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                </button>

                {isOpen && (
                  <div className="bg-white px-6 py-5 space-y-6">
                    {/* Default Template */}
                    <div>
                      <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider flex items-center gap-2">
                        <FileText size={14} className="text-[#C9A227]" /> Default Pattern (applies to all subjects)
                      </h3>
                      <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                        <SlotsEditor
                          slots={slots}
                          onChange={s => update(et.key, { slots: s })}
                          maxMarks={tmpl.maxMarks}
                          onMaxMarksChange={v => update(et.key, { maxMarks: parseFloat(v) || 0 })}
                        />
                      </div>
                    </div>

                    {/* Exceptions */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                          <AlertTriangle size={14} className="text-amber-500" /> Exceptional Subjects
                        </h3>
                        <button
                          type="button"
                          onClick={() => addException(et.key)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-[#C9A227] border border-dashed border-[#C9A227] hover:bg-amber-50 transition px-3 py-1.5 rounded-lg"
                        >
                          <Plus size={13} /> Add Exception
                        </button>
                      </div>

                      {exceptions.length === 0 ? (
                        <p className="text-xs text-gray-400 italic py-3 text-center border border-dashed border-gray-200 rounded-xl">
                          No exceptions — the default pattern above applies to all subjects.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {exceptions.map((ex, idx) => (
                            <div key={idx}>
                              <div className="flex items-center gap-2 mb-1.5 pl-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Subject:</span>
                                <select
                                  value={ex.subjectId}
                                  onChange={e => updateException(et.key, idx, { ...ex, subjectId: e.target.value })}
                                  className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-[#C9A227] outline-none bg-white"
                                >
                                  {subjects.map(s => (
                                    <option key={s._id} value={s._id}>
                                      {s.subjectName} ({s.subjectCode}){s.credits ? ` – ${s.credits} CR` : ''}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <ExceptionRow
                                exception={ex}
                                subjects={subjects}
                                onRemove={() => removeException(et.key, idx)}
                                onUpdate={val => updateException(et.key, idx, val)}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Save */}
                    <div className="flex justify-end pt-2 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => saveTemplate(et.key)}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition"
                        style={{ background: isSaving ? '#aaa' : et.color }}
                      >
                        <Save size={15} />
                        {isSaving ? 'Saving...' : `Save ${et.label} Template`}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        // ─── TAB 2: FACULTY SUBMISSIONS REVIEW (Two-Panel Layout) ───
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '20px', height: 'calc(100vh - 200px)' }}>
          
          {/* LEFT PANEL: Exams list */}
          <div style={{ backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Left panel header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #F0F0F0', flexShrink: 0 }}>
              <h3 style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Clipboard size={14} style={{ color: 'var(--color-gold)' }} /> Select Exam
              </h3>
            </div>

            {/* Left panel list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
              {exams.length === 0 ? (
                <p style={{ fontSize: '0.75rem', color: '#999', fontStyle: 'italic', textAlign: 'center', padding: '24px 16px' }}>
                  No scheduled exams found.
                </p>
              ) : (
                exams.map(e => {
                  const isActive = selectedExamId === e._id;
                  const qp = questionPapers.find(p => p.examId === e._id || (p.examId?._id && p.examId._id === e._id));
                  const status = qp?.status || 'draft';
                  
                  return (
                    <button
                      key={e._id}
                      onClick={() => handleExamChange(e._id)}
                      style={{
                        width: '100%',
                        padding: '12px 20px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #F8F8F8',
                        borderLeft: isActive ? '3px solid var(--color-navy)' : '3px solid transparent',
                        paddingLeft: isActive ? '17px' : '20px',
                        backgroundColor: isActive ? '#EEF2FF' : 'transparent',
                        transition: 'background-color 150ms ease',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        border: 'none',
                        textAlign: 'left',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.backgroundColor = '#F5F7FF';
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {/* Top row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-navy)', letterSpacing: '0.04em' }}>
                          {e.subjectId?.subjectCode || 'N/A'}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--color-text-secondary)' }}>
                          {getExamTypeLabel(e.examType)}
                        </span>
                      </div>

                      {/* Subject name */}
                      <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-text)', lineHeight: 1.3 }}>
                        {e.subjectId?.subjectName || 'Unknown Subject'}
                      </div>

                      {/* Bottom row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                        <span style={{ fontSize: '0.68rem', color: 'var(--color-text-secondary)' }}>
                          {/* Exam type already shown above */}
                        </span>
                        <span style={{
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '10px',
                          backgroundColor: status === 'approved' ? '#ECFDF5' : status === 'submitted' ? '#FEF3C7' : '#F3F4F6',
                          color: status === 'approved' ? '#065F46' : status === 'submitted' ? '#92400E' : '#6B7280',
                        }}>
                          {status === 'submitted' ? 'Submitted' : status === 'approved' ? 'Approved' : 'Draft'}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT PANEL: Details */}
          <div style={{ backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {!activePaper ? (
              // Empty state
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', color: 'var(--color-text-secondary)' }}>
                <div style={{ fontSize: '48px' }}>📋</div>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)' }}>Select an exam</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', textAlign: 'center', maxWidth: '300px' }}>
                  Choose an exam from the left panel to view or edit its question paper
                </div>
              </div>
            ) : (
              <>
                {/* Right panel header */}
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #F0F0F0', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '4px' }}>
                      {activePaper.subjectId?.subjectName}
                    </h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'flex', gap: '16px' }}>
                      <span>Code: {activePaper.subjectId?.subjectCode}</span>
                      <span>Max Marks: {activePaper.maxMarks}</span>
                    </div>
                  </div>
                  
                  {/* Status badge */}
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    padding: '4px 12px',
                    borderRadius: '10px',
                    backgroundColor: activePaper.status === 'approved' ? '#ECFDF5' : activePaper.status === 'submitted' ? '#FEF3C7' : '#F3F4F6',
                    color: activePaper.status === 'approved' ? '#065F46' : activePaper.status === 'submitted' ? '#92400E' : '#6B7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    {activePaper.status}
                  </span>
                </div>

                {/* Right panel content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                    Questions / Slots Breakdown:
                  </h4>

                  {(activePaper.questions || []).map((q, idx) => (
                    <div key={idx} style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: idx === activePaper.questions.length - 1 ? 'none' : '1px solid #F5F5F5' }}>
                      {/* Question row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-navy)' }}>
                          Question {q.questionNumber}
                        </span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', backgroundColor: '#F3F4F6', padding: '3px 10px', borderRadius: '4px' }}>
                          {q.maxMarks} Marks
                        </span>
                      </div>

                      {/* Question content */}
                      {q.description ? (
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontStyle: 'italic', padding: '10px 14px', backgroundColor: '#FAFAFA', borderRadius: '6px', border: '1px dashed #E0E0E0', lineHeight: 1.5 }}>
                          {q.description}
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.825rem', color: '#AAAAAA', fontStyle: 'italic' }}>
                          [ No question content typed online yet ]
                        </div>
                      )}

                      {/* OR alternative if exists */}
                      {q.or && (
                        <>
                          <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', color: '#C9A227', textTransform: 'uppercase', marginTop: '12px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '20px', height: '1px', backgroundColor: '#C9A227' }}></span>
                            OR ALTERNATIVE
                            <span style={{ width: '20px', height: '1px', backgroundColor: '#C9A227' }}></span>
                          </div>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-navy)' }}>
                              Question {q.or.questionNumber}
                            </span>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', backgroundColor: '#F3F4F6', padding: '3px 10px', borderRadius: '4px' }}>
                              {q.or.maxMarks} Marks
                            </span>
                          </div>

                          {q.or.description ? (
                            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontStyle: 'italic', padding: '10px 14px', backgroundColor: '#FAFAFA', borderRadius: '6px', border: '1px dashed #E0E0E0', lineHeight: 1.5 }}>
                              {q.or.description}
                            </div>
                          ) : (
                            <div style={{ fontSize: '0.825rem', color: '#AAAAAA', fontStyle: 'italic' }}>
                              [ No question content typed online yet ]
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}

                  {/* Action buttons */}
                  {activePaper.status === 'submitted' && (
                    <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #F0F0F0' }}>
                      <Button
                        onClick={handleApprovePaper}
                        disabled={actionLoading}
                        style={{ backgroundColor: 'var(--color-navy)', color: 'white', padding: '12px 24px', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 600 }}
                      >
                        {actionLoading ? 'Approving...' : 'Approve Question Paper'}
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionPapers;
