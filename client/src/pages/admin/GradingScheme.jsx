/**
 * GradingScheme - Multi-scheme management with history sidebar
 * Supports: view all schemes, create new, edit any, activate historical, delete
 */
import { useState, useEffect } from 'react';
import {
  Award, Plus, Trash2, Save, RefreshCw, CheckCircle2,
  BookOpen, Zap, X, AlertTriangle, Edit3, Calculator, ChevronRight
} from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { useAcademicYear } from '../../contexts/InstitutionContext';

// ── Grade colour helpers ──────────────────────────────────────────────────────
const gradeColor = (grade) => {
  if (!grade) return '#6B7280';
  const g = grade.toUpperCase();
  if (g === 'O')  return '#059669';
  if (g === 'A+') return '#0891B2';
  if (g === 'A')  return '#2563EB';
  if (g === 'B+') return '#7C3AED';
  if (g === 'B')  return '#9333EA';
  if (g === 'C')  return '#D97706';
  if (g === 'P')  return '#D97706';
  if (g === 'F')  return '#DC2626';
  return '#6B7280';
};

const DEFAULT_GRADE_TABLE = [
  { minPercentage: 90,    maxPercentage: 100,   grade: 'O',  gradePoint: 10, description: 'Outstanding' },
  { minPercentage: 80,    maxPercentage: 89.99, grade: 'A+', gradePoint: 9,  description: 'Excellent' },
  { minPercentage: 70,    maxPercentage: 79.99, grade: 'A',  gradePoint: 8,  description: 'Very Good' },
  { minPercentage: 60,    maxPercentage: 69.99, grade: 'B+', gradePoint: 7,  description: 'Good' },
  { minPercentage: 55,    maxPercentage: 59.99, grade: 'B',  gradePoint: 6,  description: 'Above Average' },
  { minPercentage: 50,    maxPercentage: 54.99, grade: 'C',  gradePoint: 5,  description: 'Average' },
  { minPercentage: 40,    maxPercentage: 49.99, grade: 'P',  gradePoint: 4,  description: 'Pass' },
  { minPercentage: 0,     maxPercentage: 39.99, grade: 'F',  gradePoint: 0,  description: 'Fail' },
];

// ── Confirmation dialog ───────────────────────────────────────────────────────
const ConfirmDialog = ({ message, onConfirm, onCancel }) => (
  <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
    <div style={{ background: 'white', borderRadius: '20px', boxShadow: '0 24px 48px rgba(0,0,0,0.18)', width: '100%', maxWidth: '380px', padding: '36px 32px', textAlign: 'center', animation: 'gsSchemeIn .22s ease' }}>
      <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
        <AlertTriangle size={28} style={{ color: '#DC2626' }} />
      </div>
      <p style={{ fontSize: '1rem', fontWeight: 600, color: '#1A1A1A', marginBottom: '8px' }}>Delete Scheme?</p>
      <p style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '28px', lineHeight: 1.5 }}>{message}</p>
      <div style={{ display: 'flex', gap: '12px' }}>
        <button onClick={onCancel} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', background: 'white', color: '#64748B', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
          Cancel
        </button>
        <button onClick={onConfirm} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#DC2626', color: 'white', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>
          Delete
        </button>
      </div>
    </div>
  </div>
);

// ── New Scheme Modal ──────────────────────────────────────────────────────────
const NewSchemeModal = ({ onClose, onCreated }) => {
  const { currentAcademicYear } = useAcademicYear();
  const [form, setForm] = useState({
    schemeName: '',
    academicYear: currentAcademicYear,
    passMarkPercentage: 40,
    setActive: false,
  });
  const [gradeTable, setGradeTable] = useState(DEFAULT_GRADE_TABLE.map(r => ({ ...r })));
  const [saving, setSaving] = useState(false);

  const handleRowChange = (i, field, val) => {
    const t = [...gradeTable];
    t[i][field] = ['minPercentage','maxPercentage','gradePoint'].includes(field)
      ? (parseFloat(val) || 0) : val;
    setGradeTable(t);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.schemeName.trim() || !form.academicYear.trim()) {
      toast.error('Scheme name and academic year are required');
      return;
    }
    setSaving(true);
    try {
      const res = await api.post('/admin/grading-schemes', { ...form, gradeTable });
      toast.success('New scheme created!');
      onCreated(res.data.data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create scheme');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(10,20,40,0.65)', backdropFilter: 'blur(8px)' }}>
      <div style={{ background: 'white', borderRadius: '24px', boxShadow: '0 32px 64px rgba(0,0,0,0.22)', width: '100%', maxWidth: '760px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'gsSchemeIn .24s cubic-bezier(.34,1.56,.64,1)' }}>

        {/* Modal Header */}
        <div style={{ background: 'var(--color-navy)', padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={22} style={{ color: '#C9A227' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'white', margin: 0 }}>Create New Grading Scheme</h2>
              <p style={{ fontSize: '0.78125rem', color: 'rgba(148,200,255,0.85)', margin: '3px 0 0' }}>Saved as a permanent historical record for your institution</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 150ms' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>

          {/* Section: Basic Info */}
          <div style={{ marginBottom: '32px' }}>
            <p style={{ fontSize: '0.6875rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: '16px' }}>Basic Information</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '8px', letterSpacing: '0.04em' }}>ACADEMIC YEAR *</label>
                <input value={form.academicYear} onChange={e => setForm({...form, academicYear: e.target.value})}
                  placeholder={`e.g. ${currentAcademicYear}`} required
                  style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #E2E8F0', borderRadius: '12px', fontSize: '0.875rem', color: '#1E293B', outline: 'none', transition: 'border-color 150ms', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#C9A227'}
                  onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '8px', letterSpacing: '0.04em' }}>SCHEME NAME *</label>
                <input value={form.schemeName} onChange={e => setForm({...form, schemeName: e.target.value})}
                  placeholder="e.g. VTU 2022 Scheme" required
                  style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #E2E8F0', borderRadius: '12px', fontSize: '0.875rem', color: '#1E293B', outline: 'none', transition: 'border-color 150ms', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#C9A227'}
                  onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '16px', alignItems: 'center' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '8px', letterSpacing: '0.04em' }}>PASS MARK %</label>
                <input type="number" value={form.passMarkPercentage} min={1} max={100}
                  onChange={e => setForm({...form, passMarkPercentage: parseFloat(e.target.value)})}
                  style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #E2E8F0', borderRadius: '12px', fontSize: '0.875rem', color: '#1E293B', outline: 'none', transition: 'border-color 150ms', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#C9A227'}
                  onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', border: '1.5px solid #E2E8F0', borderRadius: '12px', cursor: 'pointer', marginTop: '20px', transition: 'border-color 150ms, background 150ms' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A227'; e.currentTarget.style.background = '#FFFBEB'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = 'white'; }}>
                <input type="checkbox" id="setActive" checked={form.setActive}
                  onChange={e => setForm({...form, setActive: e.target.checked})}
                  style={{ width: '18px', height: '18px', accentColor: '#C9A227', cursor: 'pointer', flexShrink: 0 }} />
                <span style={{ fontSize: '0.875rem', color: '#334155', fontWeight: 500 }}>
                  Set as <strong style={{ color: '#C9A227' }}>Active</strong> scheme immediately
                </span>
              </label>
            </div>
          </div>

          {/* Section: Grade Table */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <p style={{ fontSize: '0.6875rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94A3B8', margin: '0 0 4px' }}>Grade Point Map</p>
                <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: 0 }}>Marks percentage ranges and corresponding letter grades</p>
              </div>
              <button type="button" onClick={() => setGradeTable([...gradeTable, { minPercentage: 0, maxPercentage: 9, grade: '', gradePoint: 0, description: '' }])}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', background: '#F8FAFC', border: '1.5px dashed #CBD5E1', borderRadius: '10px', color: '#475569', fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer', transition: 'all 150ms' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A227'; e.currentTarget.style.color = '#92400E'; e.currentTarget.style.background = '#FFFBEB'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.color = '#475569'; e.currentTarget.style.background = '#F8FAFC'; }}>
                <Plus size={15} /> Add Row
              </button>
            </div>

            <div style={{ borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ background: '#1E3A5F' }}>
                    {['Min %', 'Max %', 'Grade', 'Points', 'Description', ''].map(h => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {gradeTable.map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #F1F5F9', background: i % 2 === 0 ? 'white' : '#FAFBFC' }}>
                      {['minPercentage', 'maxPercentage'].map(f => (
                        <td key={f} style={{ padding: '10px 14px' }}>
                          <input type="number" step="0.01" value={row[f]}
                            onChange={e => handleRowChange(i, f, e.target.value)}
                            style={{ width: '72px', padding: '7px 10px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '0.8125rem', fontWeight: 600, textAlign: 'center', outline: 'none', color: '#1E293B', transition: 'border-color 150ms' }}
                            onFocus={e => e.target.style.borderColor = '#C9A227'}
                            onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
                        </td>
                      ))}
                      <td style={{ padding: '10px 14px' }}>
                        <input type="text" value={row.grade} onChange={e => handleRowChange(i, 'grade', e.target.value)}
                          style={{ width: '56px', padding: '7px 10px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 800, textAlign: 'center', outline: 'none', color: gradeColor(row.grade), transition: 'border-color 150ms' }}
                          onFocus={e => e.target.style.borderColor = '#C9A227'}
                          onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <input type="number" value={row.gradePoint} onChange={e => handleRowChange(i, 'gradePoint', e.target.value)}
                          style={{ width: '56px', padding: '7px 10px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '0.8125rem', fontWeight: 700, textAlign: 'center', outline: 'none', color: '#1E293B', transition: 'border-color 150ms' }}
                          onFocus={e => e.target.style.borderColor = '#C9A227'}
                          onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <input type="text" value={row.description} onChange={e => handleRowChange(i, 'description', e.target.value)}
                          style={{ width: '100%', minWidth: '130px', padding: '7px 10px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '0.8125rem', color: '#475569', outline: 'none', transition: 'border-color 150ms', boxSizing: 'border-box' }}
                          onFocus={e => e.target.style.borderColor = '#C9A227'}
                          onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <button type="button" onClick={() => setGradeTable(gradeTable.filter((_, j) => j !== i))}
                          style={{ width: '30px', height: '30px', borderRadius: '8px', border: 'none', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 150ms' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
                          onMouseLeave={e => e.currentTarget.style.background = '#FEF2F2'}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div style={{ padding: '20px 32px', borderTop: '1px solid #F1F5F9', background: '#FAFBFC', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <button type="button" onClick={onClose}
            style={{ padding: '11px 22px', borderRadius: '12px', border: '1.5px solid #E2E8F0', background: 'white', color: '#475569', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', transition: 'all 150ms' }}
            onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
            onMouseLeave={e => e.currentTarget.style.background = 'white'}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 26px', borderRadius: '12px', border: 'none', background: 'var(--color-navy)', color: 'white', fontWeight: 700, fontSize: '0.875rem', cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(30,58,95,0.25)', opacity: saving ? 0.7 : 1, transition: 'all 150ms' }}>
            {saving ? <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Creating…</> : <><Save size={15} /> Create Scheme</>}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes gsSchemeIn { from { opacity:0; transform:scale(.94) translateY(12px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════
const GradingScheme = () => {
  const { currentAcademicYear } = useAcademicYear();
  const [allSchemes, setAllSchemes]   = useState([]);
  const [selectedId, setSelectedId]   = useState(null);
  const [editData, setEditData]       = useState(null);   // working copy
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [activating, setActivating]   = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); // id to delete
  const [isDirty, setIsDirty]         = useState(false);

  const selectedScheme = allSchemes.find(s => s._id === selectedId);
  const isActiveSelected = selectedScheme?.isActive;

  // ── Fetch all ────────────────────────────────────────────────────
  const fetchAll = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/grading-schemes/all');
      const schemes = res.data.data || [];
      setAllSchemes(schemes);
      // auto-select the active one on first load
      if (!selectedId) {
        const active = schemes.find(s => s.isActive);
        if (active) { setSelectedId(active._id); loadEdit(active); }
        else if (schemes.length > 0) { setSelectedId(schemes[0]._id); loadEdit(schemes[0]); }
      } else {
        // refresh the edit data for the currently selected scheme
        const updated = schemes.find(s => s._id === selectedId);
        if (updated) loadEdit(updated);
      }
    } catch {
      toast.error('Failed to load grading schemes');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);   // eslint-disable-line

  const loadEdit = (scheme) => {
    setEditData({
      schemeName: scheme.schemeName,
      academicYear: scheme.academicYear || '',
      passMarkPercentage: scheme.passMarkPercentage,
      gradeTable: scheme.gradeTable.map(r => ({ ...r })),
    });
    setIsDirty(false);
  };

  const handleSelectScheme = (scheme) => {
    if (isDirty && !window.confirm('You have unsaved changes. Discard them?')) return;
    setSelectedId(scheme._id);
    loadEdit(scheme);
  };

  // ── Row editing ──────────────────────────────────────────────────
  const handleRowChange = (i, field, val) => {
    const t = [...editData.gradeTable];
    t[i][field] = ['minPercentage','maxPercentage','gradePoint'].includes(field)
      ? (parseFloat(val) || 0) : val;
    setEditData({ ...editData, gradeTable: t });
    setIsDirty(true);
  };

  const handleFieldChange = (field, val) => {
    setEditData({ ...editData, [field]: val });
    setIsDirty(true);
  };

  const addRow = () => {
    setEditData({ ...editData, gradeTable: [...editData.gradeTable, { minPercentage: 0, maxPercentage: 9, grade: '', gradePoint: 0, description: '' }] });
    setIsDirty(true);
  };

  const removeRow = (i) => {
    if (editData.gradeTable.length <= 1) { toast.error('At least one grade row is required'); return; }
    setEditData({ ...editData, gradeTable: editData.gradeTable.filter((_,j)=>j!==i) });
    setIsDirty(true);
  };

  // ── Save ─────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/grading-schemes/${selectedId}`, editData);
      toast.success('Scheme saved successfully!');
      setIsDirty(false);
      fetchAll();
    } catch { toast.error('Failed to save scheme'); }
    finally { setSaving(false); }
  };

  // ── Activate ─────────────────────────────────────────────────────
  const handleActivate = async () => {
    setActivating(true);
    try {
      await api.put(`/admin/grading-schemes/${selectedId}/activate`);
      toast.success(`Scheme set as active!`);
      fetchAll();
    } catch { toast.error('Failed to activate scheme'); }
    finally { setActivating(false); }
  };

  // ── Delete ───────────────────────────────────────────────────────
  const handleDelete = async () => {
    try {
      await api.delete(`/admin/grading-schemes/${confirmDelete}`);
      toast.success('Scheme deleted');
      setConfirmDelete(null);
      if (selectedId === confirmDelete) { setSelectedId(null); setEditData(null); }
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete scheme');
      setConfirmDelete(null);
    }
  };

  // ── CGPA preview ─────────────────────────────────────────────────
  const [previewMarks, setPreviewMarks] = useState('');
  const previewGrade = (() => {
    const m = parseFloat(previewMarks);
    if (!editData || isNaN(m)) return null;
    return editData.gradeTable.find(r => m >= r.minPercentage && m <= r.maxPercentage) || null;
  })();

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', height: '100%', minHeight: '100vh', background: '#F0F4F8' }}>

      {/* ── LEFT SIDEBAR ── */}
      <div style={{
        width: '280px',
        flexShrink: 0,
        background: 'white',
        borderRight: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}>
        {/* Sidebar header */}
        <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={15} style={{ color: 'var(--color-navy)' }} />
              <span style={{ fontSize: '0.6875rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-navy)' }}>
                Scheme History
              </span>
            </div>
            <button
              onClick={() => setShowNewModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 13px', background: 'var(--color-gold)', color: 'var(--color-navy)', border: 'none', borderRadius: '9px', cursor: 'pointer', fontWeight: 800, fontSize: '0.75rem', boxShadow: '0 2px 6px rgba(201,162,39,0.25)', transition: 'all 150ms' }}
              onMouseEnter={e => e.currentTarget.style.background = '#B8911F'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--color-gold)'}>
              <Plus size={13} /> New
            </button>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#94A3B8', margin: '6px 0 0' }}>
            {loading ? 'Loading…' : `${allSchemes.length} scheme${allSchemes.length !== 1 ? 's' : ''} configured`}
          </p>
        </div>

        {/* Scheme list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ height: '76px', borderRadius: '14px', background: '#F1F5F9', animation: 'pulse 2s ease infinite' }} />
              ))}
            </div>
          ) : allSchemes.length === 0 ? (
            <div style={{ padding: '40px 16px', textAlign: 'center' }}>
              <Award size={32} style={{ color: '#CBD5E1', margin: '0 auto 12px' }} />
              <p style={{ fontSize: '0.8125rem', color: '#94A3B8', margin: 0 }}>No schemes configured yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {allSchemes.map(scheme => {
                const isSelected = selectedId === scheme._id;
                return (
                  <button
                    key={scheme._id}
                    onClick={() => handleSelectScheme(scheme)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '14px 16px',
                      borderRadius: '14px',
                      border: isSelected ? '1.5px solid var(--color-navy)' : '1.5px solid transparent',
                      background: isSelected ? '#EFF4FC' : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 150ms',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#F8FAFC'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: isSelected ? 'var(--color-navy)' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 150ms' }}>
                      <Award size={16} style={{ color: isSelected ? '#C9A227' : '#94A3B8' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '3px' }}>
                        <p style={{ fontSize: '0.8125rem', fontWeight: isSelected ? 700 : 600, color: isSelected ? 'var(--color-navy)' : '#334155', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {scheme.schemeName}
                        </p>
                        {scheme.isActive && (
                          <span style={{ flexShrink: 0, background: '#DCFCE7', color: '#065F46', padding: '2px 8px', borderRadius: '20px', fontSize: '0.625rem', fontWeight: 700 }}>
                            Active
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.6875rem', color: '#94A3B8', margin: 0 }}>
                        {scheme.academicYear || '—'} · Pass {scheme.passMarkPercentage}%
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Refresh */}
        <div style={{ padding: '12px', borderTop: '1px solid #F1F5F9' }}>
          <button onClick={fetchAll}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', padding: '10px', borderRadius: '12px', border: '1px solid #E2E8F0', background: 'white', color: '#64748B', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', transition: 'all 150ms' }}
            onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
            onMouseLeave={e => e.currentTarget.style.background = 'white'}>
            <RefreshCw size={13}/> Refresh
          </button>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {!editData ? (
          /* Empty state */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'white', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <Award size={38} style={{ color: '#1E3A5F' }} />
            </div>
            <h3 style={{ fontSize: '1.375rem', fontWeight: 800, color: '#1E3A5F', margin: '0 0 10px' }}>Select a Grading Scheme</h3>
            <p style={{ fontSize: '0.9rem', color: '#64748B', maxWidth: '340px', lineHeight: 1.6, margin: '0 0 28px' }}>
              Choose a scheme from the sidebar to view or edit its rules, or create a new one for a fresh academic year.
            </p>
            <button onClick={() => setShowNewModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '13px 24px', background: 'var(--color-navy)', color: 'white', border: 'none', borderRadius: '14px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(30,58,95,0.25)', transition: 'all 150ms' }}
              onMouseEnter={e => e.currentTarget.style.background = '#152B45'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--color-navy)'}>
              <Plus size={18}/> Create New Scheme
            </button>
          </div>
        ) : (
          <div style={{ maxWidth: '900px', margin: '0 auto', padding: '36px 32px 56px' }}>

            {/* ── Page Header ── */}
            <div style={{ marginBottom: '32px' }}>
              {/* Breadcrumb */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '14px', fontWeight: 500 }}>
                <span>Grading Scheme</span>
                <ChevronRight size={13} />
                <span style={{ color: '#475569' }}>{editData.schemeName}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--color-navy)', margin: 0, letterSpacing: '-0.02em' }}>
                      {editData.schemeName}
                    </h1>
                    {isActiveSelected ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 13px', borderRadius: '20px', background: '#DCFCE7', color: '#065F46', fontSize: '0.78125rem', fontWeight: 700 }}>
                        <CheckCircle2 size={13}/> Active Scheme
                      </span>
                    ) : (
                      <span style={{ padding: '5px 13px', borderRadius: '20px', background: '#F1F5F9', color: '#64748B', fontSize: '0.78125rem', fontWeight: 600 }}>
                        Historical
                      </span>
                    )}
                    {isDirty && (
                      <span style={{ padding: '5px 13px', borderRadius: '20px', background: '#FEF3C7', color: '#92400E', fontSize: '0.78125rem', fontWeight: 700 }}>
                        Unsaved Changes
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#64748B', margin: 0 }}>
                    Academic Year: <strong style={{ color: '#334155' }}>{editData.academicYear || 'Not specified'}</strong>
                    &nbsp;·&nbsp;
                    Minimum Pass Mark: <strong style={{ color: '#334155' }}>{editData.passMarkPercentage}%</strong>
                  </p>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  {!isActiveSelected && (
                    <button onClick={handleActivate} disabled={activating}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', background: 'white', color: '#059669', border: '1.5px solid #059669', borderRadius: '10px', fontWeight: 700, fontSize: '0.8125rem', cursor: activating ? 'not-allowed' : 'pointer', opacity: activating ? 0.6 : 1, transition: 'all 150ms', whiteSpace: 'nowrap' }}
                      onMouseEnter={e => { if (!activating) e.currentTarget.style.background = '#F0FDF4'; }}
                      onMouseLeave={e => { if (!activating) e.currentTarget.style.background = 'white'; }}>
                      <Zap size={15}/>{activating ? 'Activating…' : 'Set Active'}
                    </button>
                  )}
                  {!isActiveSelected && (
                    <button onClick={() => setConfirmDelete(selectedId)}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', background: 'white', color: '#DC2626', border: '1.5px solid #DC2626', borderRadius: '10px', fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer', transition: 'all 150ms', whiteSpace: 'nowrap' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                      onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                      <Trash2 size={15}/> Delete
                    </button>
                  )}
                  <button onClick={handleSave} disabled={saving || !isDirty}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 22px', background: 'var(--color-navy)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '0.8125rem', cursor: saving || !isDirty ? 'not-allowed' : 'pointer', boxShadow: isDirty ? '0 4px 12px rgba(30,58,95,0.25)' : 'none', opacity: saving || !isDirty ? 0.45 : 1, transition: 'all 150ms', whiteSpace: 'nowrap' }}
                    onMouseEnter={e => { if (!saving && isDirty) e.currentTarget.style.background = '#152B45'; }}
                    onMouseLeave={e => { if (!saving && isDirty) e.currentTarget.style.background = 'var(--color-navy)'; }}>
                    <Save size={15}/>{saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>

            {/* ── CARD 1: Scheme Details ── */}
            <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '28px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: '#EFF4FC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Edit3 size={15} style={{ color: 'var(--color-navy)' }} />
                </div>
                <h2 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-navy)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Scheme Details</h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                {[
                  { label: 'Scheme Name', field: 'schemeName', type: 'text', placeholder: '' },
                  { label: 'Academic Year', field: 'academicYear', type: 'text', placeholder: `e.g. ${currentAcademicYear}` },
                  { label: 'Pass Mark %', field: 'passMarkPercentage', type: 'number', placeholder: '' },
                ].map(({ label, field, type, placeholder }) => (
                  <div key={field}>
                    <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>{label}</label>
                    <input
                      type={type} value={editData[field]} placeholder={placeholder}
                      min={type === 'number' ? 1 : undefined} max={type === 'number' ? 100 : undefined}
                      onChange={e => handleFieldChange(field, type === 'number' ? parseFloat(e.target.value) : e.target.value)}
                      style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #E2E8F0', borderRadius: '12px', fontSize: '0.875rem', fontWeight: 500, color: '#1E293B', outline: 'none', transition: 'border-color 150ms', boxSizing: 'border-box', background: 'white' }}
                      onFocus={e => e.target.style.borderColor = '#C9A227'}
                      onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
                  </div>
                ))}
              </div>
            </div>

            {/* ── CARD 2: Grade Point Map ── */}
            <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '28px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Award size={16} style={{ color: '#C9A227' }} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-navy)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Grade Point Map</h2>
                    <p style={{ fontSize: '0.75rem', color: '#94A3B8', margin: '2px 0 0' }}>Configure marks ranges, letter grades, and grade points</p>
                  </div>
                </div>
                <button onClick={addRow}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', background: '#FFFBEB', border: '1.5px dashed #F59E0B', borderRadius: '10px', color: '#92400E', fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer', transition: 'all 150ms', whiteSpace: 'nowrap' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#FEF3C7'; e.currentTarget.style.borderColor = '#D97706'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#FFFBEB'; e.currentTarget.style.borderColor = '#F59E0B'; }}>
                  <Plus size={15}/> Add Row
                </button>
              </div>

              {/* Grade badges row */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                {editData.gradeTable.map((row, i) => (
                  <div key={i} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    padding: '5px 13px', borderRadius: '20px', border: `1.5px solid ${gradeColor(row.grade)}22`,
                    background: `${gradeColor(row.grade)}0D`, color: gradeColor(row.grade),
                    fontSize: '0.75rem', fontWeight: 700
                  }}>
                    <span>{row.grade || '?'}</span>
                    <span style={{ opacity: 0.65, fontWeight: 500 }}>{row.gradePoint}pt</span>
                  </div>
                ))}
              </div>

              {/* Table */}
              <div style={{ borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                  <thead>
                    <tr style={{ background: '#1E3A5F' }}>
                      {['MIN %', 'MAX %', 'GRADE', 'POINTS', 'DESCRIPTION', 'ACTION'].map((h, idx) => (
                        <th key={h} style={{ padding: '13px 16px', textAlign: idx === 5 ? 'center' : 'left', fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.09em', color: 'rgba(255,255,255,0.7)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {editData.gradeTable.map((row, i) => (
                      <tr key={i}
                        style={{ borderBottom: '1px solid #F1F5F9', background: 'white', transition: 'background 120ms' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#FAFBFC'}
                        onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                        {['minPercentage', 'maxPercentage'].map(f => (
                          <td key={f} style={{ padding: '10px 16px' }}>
                            <input type="number" step="0.01" value={row[f]}
                              onChange={e => handleRowChange(i, f, e.target.value)}
                              style={{ width: '74px', padding: '8px 10px', border: '1.5px solid #E2E8F0', borderRadius: '9px', fontSize: '0.8125rem', fontWeight: 700, textAlign: 'center', color: '#1E293B', outline: 'none', transition: 'border-color 150ms', boxSizing: 'border-box' }}
                              onFocus={e => e.target.style.borderColor = '#C9A227'}
                              onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
                          </td>
                        ))}
                        <td style={{ padding: '10px 16px' }}>
                          <input type="text" value={row.grade} onChange={e => handleRowChange(i, 'grade', e.target.value)}
                            style={{ width: '58px', padding: '8px 10px', border: `1.5px solid ${gradeColor(row.grade)}44`, borderRadius: '9px', fontSize: '0.9rem', fontWeight: 900, textAlign: 'center', color: gradeColor(row.grade), background: `${gradeColor(row.grade)}0D`, outline: 'none', transition: 'border-color 150ms', boxSizing: 'border-box' }}
                            onFocus={e => e.target.style.borderColor = gradeColor(row.grade)}
                            onBlur={e => e.target.style.borderColor = `${gradeColor(row.grade)}44`} />
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          <input type="number" value={row.gradePoint} onChange={e => handleRowChange(i, 'gradePoint', e.target.value)}
                            style={{ width: '58px', padding: '8px 10px', border: '1.5px solid #E2E8F0', borderRadius: '9px', fontSize: '0.8125rem', fontWeight: 700, textAlign: 'center', color: '#1E293B', outline: 'none', transition: 'border-color 150ms', boxSizing: 'border-box' }}
                            onFocus={e => e.target.style.borderColor = '#C9A227'}
                            onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          <input type="text" value={row.description} onChange={e => handleRowChange(i, 'description', e.target.value)}
                            style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #E2E8F0', borderRadius: '9px', fontSize: '0.8125rem', color: '#475569', outline: 'none', transition: 'border-color 150ms', boxSizing: 'border-box' }}
                            onFocus={e => e.target.style.borderColor = '#C9A227'}
                            onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
                        </td>
                        <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                          <button onClick={() => removeRow(i)} title="Remove row"
                            style={{ width: '32px', height: '32px', borderRadius: '9px', border: 'none', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'background 150ms' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
                            onMouseLeave={e => e.currentTarget.style.background = '#FEF2F2'}>
                            <Trash2 size={14}/>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── CARD 3: Grade Preview Calculator ── */}
            <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: '#EFF4FC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calculator size={15} style={{ color: 'var(--color-navy)' }} />
                </div>
                <h2 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-navy)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Grade Preview Calculator</h2>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#F8FAFC', borderRadius: '14px', padding: '14px 18px', border: '1.5px solid #E2E8F0' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#334155', whiteSpace: 'nowrap' }}>Enter Marks %</label>
                  <input type="number" min={0} max={100} value={previewMarks}
                    onChange={e => setPreviewMarks(e.target.value)}
                    placeholder="e.g. 75"
                    style={{ width: '90px', padding: '10px 12px', border: '1.5px solid #E2E8F0', borderRadius: '10px', fontSize: '1rem', fontWeight: 700, textAlign: 'center', color: '#1E3A5F', outline: 'none', transition: 'border-color 150ms' }}
                    onFocus={e => e.target.style.borderColor = '#C9A227'}
                    onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
                </div>

                {previewGrade ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 22px', borderRadius: '14px', border: `2px solid ${gradeColor(previewGrade.grade)}33`, background: `${gradeColor(previewGrade.grade)}08` }}>
                    <span style={{ fontSize: '2.5rem', fontWeight: 900, color: gradeColor(previewGrade.grade), lineHeight: 1 }}>
                      {previewGrade.grade}
                    </span>
                    <div>
                      <p style={{ fontSize: '1rem', fontWeight: 700, color: gradeColor(previewGrade.grade), margin: '0 0 2px' }}>
                        {previewGrade.gradePoint} Grade Points
                      </p>
                      <p style={{ fontSize: '0.78125rem', color: '#64748B', margin: 0 }}>{previewGrade.description}</p>
                    </div>
                  </div>
                ) : previewMarks ? (
                  <div style={{ padding: '14px 18px', borderRadius: '14px', background: '#F1F5F9', fontSize: '0.875rem', color: '#64748B', fontWeight: 500 }}>
                    No matching grade for {previewMarks}%
                  </div>
                ) : (
                  <p style={{ fontSize: '0.875rem', color: '#CBD5E1', fontStyle: 'italic', margin: 0 }}>
                    Enter a percentage to test grade calculation →
                  </p>
                )}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showNewModal && (
        <NewSchemeModal
          onClose={() => setShowNewModal(false)}
          onCreated={(s) => { fetchAll(); setSelectedId(s._id); }}
        />
      )}
      {confirmDelete && (
        <ConfirmDialog
          message="This action cannot be undone. All grade configurations in this scheme will be permanently removed."
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
};

export default GradingScheme;
