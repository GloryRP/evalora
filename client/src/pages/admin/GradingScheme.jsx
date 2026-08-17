/**
 * GradingScheme - Multi-scheme management with history sidebar
 * Supports: view all schemes, create new, edit any, activate historical, delete
 */
import { useState, useEffect } from 'react';
import {
  Award, Plus, Trash2, Save, RefreshCw, CheckCircle2,
  BookOpen, Zap, X, AlertTriangle, Edit3, Calculator
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
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center"
      style={{ animation: 'pop .2s cubic-bezier(.34,1.56,.64,1)' }}>
      <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
        <AlertTriangle size={26} className="text-red-500" />
      </div>
      <p className="text-base font-semibold text-[#1A1A1A] mb-5">{message}</p>
      <div className="flex gap-3">
        <button onClick={onCancel}
          className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
          Cancel
        </button>
        <button onClick={onConfirm}
          className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition">
          Delete
        </button>
      </div>
    </div>
    <style>{`@keyframes pop{from{opacity:0;transform:scale(.88)}to{opacity:1;transform:scale(1)}}`}</style>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
        style={{ animation: 'pop .22s cubic-bezier(.34,1.56,.64,1)' }}>
        {/* header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100"
          style={{ background: 'var(--color-navy)' }}>
          <div>
            <h2 className="text-xl font-bold text-white">Create New Grading Scheme</h2>
            <p className="text-xs text-blue-200 mt-1">Saves as a separate historical record for your institution</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
          {/* name + year + pass % */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-[#5C5C5C] uppercase tracking-wider mb-2">Academic Year *</label>
              <input value={form.academicYear} onChange={e => setForm({...form, academicYear: e.target.value})}
                placeholder={`e.g. ${currentAcademicYear}`} required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#5C5C5C] uppercase tracking-wider mb-2">Scheme Name *</label>
              <input value={form.schemeName} onChange={e => setForm({...form, schemeName: e.target.value})}
                placeholder="e.g. VTU CBCS 2024 Scheme" required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#5C5C5C] uppercase tracking-wider mb-2">Pass Mark %</label>
              <input type="number" value={form.passMarkPercentage} min={1} max={100}
                onChange={e => setForm({...form, passMarkPercentage: parseFloat(e.target.value)})}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none" />
            </div>
            <div className="sm:col-span-2 flex items-center gap-3 pt-2">
              <input type="checkbox" id="setActive" checked={form.setActive}
                onChange={e => setForm({...form, setActive: e.target.checked})}
                className="w-5 h-5 rounded accent-[#C9A227]" />
              <label htmlFor="setActive" className="text-sm font-medium text-[#1A1A1A]">
                Set as <span className="text-[#C9A227] font-bold">Active</span> scheme immediately
              </label>
            </div>
          </div>

          {/* Grade table */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#1E3A5F]">Grade Point Map</h3>
              <button type="button" onClick={() => setGradeTable([...gradeTable, { minPercentage: 0, maxPercentage: 9, grade: '', gradePoint: 0, description: '' }])}
                className="text-xs px-4 py-2 rounded-xl border border-dashed border-[#C9A227] text-[#C9A227] font-bold hover:bg-amber-50 transition flex items-center gap-1.5">
                <Plus size={14} /> Add Row
              </button>
            </div>
            <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-[#1E3A5F] text-white">
                  <tr>{['Min %','Max %','Grade','Points','Description',''].map(h => (
                    <th key={h} className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {gradeTable.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50/80 transition-colors">
                      {['minPercentage','maxPercentage'].map(f => (
                        <td key={f} className="px-3 py-2.5">
                          <input type="number" step="0.01" value={row[f]}
                            onChange={e => handleRowChange(i, f, e.target.value)}
                            className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-center focus:ring-1 focus:ring-[#C9A227] outline-none" />
                        </td>
                      ))}
                      <td className="px-3 py-2.5">
                        <input type="text" value={row.grade} onChange={e => handleRowChange(i, 'grade', e.target.value)}
                          className="w-16 px-3 py-2 border border-gray-300 rounded-lg text-xs text-center font-bold focus:ring-1 focus:ring-[#C9A227] outline-none"
                          style={{ color: gradeColor(row.grade) }} />
                      </td>
                      <td className="px-3 py-2.5">
                        <input type="number" value={row.gradePoint} onChange={e => handleRowChange(i, 'gradePoint', e.target.value)}
                          className="w-16 px-3 py-2 border border-gray-300 rounded-lg text-xs text-center font-semibold focus:ring-1 focus:ring-[#C9A227] outline-none" />
                      </td>
                      <td className="px-3 py-2.5">
                        <input type="text" value={row.description} onChange={e => handleRowChange(i, 'description', e.target.value)}
                          className="w-full min-w-[140px] px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-[#C9A227] outline-none" />
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <button type="button" onClick={() => setGradeTable(gradeTable.filter((_,j)=>j!==i))}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={16}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </form>

        <div className="px-8 py-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button type="button" onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-[#5C5C5C] hover:bg-gray-200 transition">Cancel</button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex items-center gap-2 px-7 py-2.5 rounded-xl text-sm font-bold text-white transition disabled:opacity-60 shadow-md"
            style={{ background: 'var(--color-navy)' }}>
            {saving ? 'Creating…' : <><Save size={16}/> Create Scheme</>}
          </button>
        </div>
      </div>
      <style>{`@keyframes pop{from{opacity:0;transform:scale(.9) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
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
    <div className="flex h-full min-h-screen" style={{ background: '#F8FAFC' }}>

      {/* ── LEFT SIDEBAR — Scheme History ── */}
      <div style={{
        width: '320px',
        flexShrink: 0,
        backgroundColor: 'white',
        borderRight: '1px solid #E5E7EB',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        boxShadow: '2px 0 8px rgba(0,0,0,0.02)',
        overflow: 'hidden'
      }}>
        {/* Sidebar header */}
        <div style={{
          backgroundColor: '#F8FAFC',
          padding: '20px 20px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            fontSize: '0.8125rem',
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--color-navy)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <BookOpen size={16} style={{ color: 'var(--color-navy)' }} />
            Scheme History
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            style={{
              fontSize: '0.78125rem',
              padding: '7px 14px',
              backgroundColor: 'var(--color-gold)',
              color: 'var(--color-navy)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 2px 4px rgba(201,162,39,0.2)',
              transition: 'all 150ms ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#B8911F'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-gold)'}
          >
            <Plus size={14} /> New
          </button>
        </div>

        {/* Scheme list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[1,2,3].map(i => <div key={i} style={{ height: '72px', borderRadius: '12px', backgroundColor: '#F3F4F6', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}/>)}
            </div>
          ) : allSchemes.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: '0.875rem', color: '#9CA3AF' }}>No schemes configured yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                      borderRadius: '12px',
                      border: isSelected ? '1.5px solid var(--color-navy)' : '1px solid #E5E7EB',
                      backgroundColor: isSelected ? '#F0F4F8' : 'white',
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                      boxShadow: isSelected ? '0 2px 8px rgba(30,58,95,0.08)' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = '#F8FAFC';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'white';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
                      <p style={{
                        fontSize: '0.90rem',
                        fontWeight: isSelected ? 700 : 600,
                        color: 'var(--color-navy)',
                        margin: 0,
                        lineHeight: 1.3
                      }}>
                        {scheme.schemeName}
                      </p>
                      {scheme.isActive && (
                        <span style={{
                          backgroundColor: '#DCFCE7',
                          color: '#065F46',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          flexShrink: 0
                        }}>
                          Active
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', itemsCenter: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
                      <span>Year: <strong>{scheme.academicYear || '—'}</strong></span>
                      <span>Pass: <strong>{scheme.passMarkPercentage}%</strong></span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Refresh */}
        <div className="border-t border-gray-100 p-4 bg-gray-50/50">
          <button onClick={fetchAll}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-[#5C5C5C] hover:bg-white transition shadow-sm">
            <RefreshCw size={13}/> Refresh Schemes
          </button>
        </div>
      </div>

      {/* ── RIGHT PANEL — Selected Scheme Editor ── */}
      <div className="flex-1 overflow-y-auto">
        {!editData ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-12">
            <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center mb-5">
              <Award size={40} className="text-[#1E3A5F]"/>
            </div>
            <h3 className="text-xl font-bold text-[#1E3A5F] mb-2">Select a Grading Scheme</h3>
            <p className="text-sm text-[#64748B] mb-6 max-w-sm">Choose a scheme from the left panel to inspect or edit its rules, or create a brand new scheme.</p>
            <button onClick={() => setShowNewModal(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white shadow-md transition hover:bg-[#152B45]"
              style={{ backgroundColor: 'var(--color-navy)' }}>
              <Plus size={18}/> Create New Scheme
            </button>
          </div>
        ) : (
          <div className="p-8 lg:p-10 space-y-8 max-w-6xl mx-auto">

            {/* ── Top Header Section ── */}
            <div style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '6px' }}>
                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: 'var(--color-navy)', margin: 0 }}>
                      {editData.schemeName}
                    </h1>
                    {isActiveSelected ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 12px', borderRadius: '20px', backgroundColor: '#DCFCE7', color: '#065F46', fontSize: '0.78125rem', fontWeight: 700 }}>
                        <CheckCircle2 size={14}/> Active Scheme
                      </span>
                    ) : (
                      <span style={{ padding: '4px 12px', borderRadius: '20px', backgroundColor: '#F1F5F9', color: '#64748B', fontSize: '0.78125rem', fontWeight: 600 }}>
                        Historical Scheme
                      </span>
                    )}
                    {isDirty && (
                      <span style={{ padding: '4px 12px', borderRadius: '20px', backgroundColor: '#FEF3C7', color: '#92400E', fontSize: '0.78125rem', fontWeight: 700 }}>
                        Unsaved Changes
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#64748B', margin: 0 }}>
                    Academic Year: <strong style={{ color: '#1E293B', fontWeight: 600 }}>{editData.academicYear || 'Not Specified'}</strong> &bull; Minimum Pass Mark: <strong style={{ color: '#1E293B', fontWeight: 600 }}>{editData.passMarkPercentage}%</strong>
                  </p>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  {!isActiveSelected && (
                    <button onClick={handleActivate} disabled={activating}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', backgroundColor: 'white', color: '#059669', border: '1.5px solid #059669', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 700, cursor: activating ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', transition: 'all 150ms ease', opacity: activating ? 0.5 : 1 }}
                      onMouseEnter={(e) => { if (!activating) { e.currentTarget.style.backgroundColor = '#F0FDF4'; } }}
                      onMouseLeave={(e) => { if (!activating) { e.currentTarget.style.backgroundColor = 'white'; } }}>
                      <Zap size={16}/>{activating ? 'Activating…' : 'Set as Active'}
                    </button>
                  )}
                  {!isActiveSelected && (
                    <button onClick={() => setConfirmDelete(selectedId)}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', backgroundColor: 'white', color: '#DC2626', border: '1.5px solid #DC2626', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 150ms ease' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FEF2F2'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white'; }}>
                      <Trash2 size={16}/> Delete
                    </button>
                  )}
                  <button onClick={handleSave} disabled={saving || !isDirty}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 22px', backgroundColor: 'var(--color-navy)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 700, cursor: saving || !isDirty ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', boxShadow: '0 2px 6px rgba(30,58,95,0.15)', transition: 'all 150ms ease', opacity: saving || !isDirty ? 0.5 : 1 }}
                    onMouseEnter={(e) => { if (!saving && isDirty) e.currentTarget.style.backgroundColor = '#152B45'; }}
                    onMouseLeave={(e) => { if (!saving && isDirty) e.currentTarget.style.backgroundColor = 'var(--color-navy)'; }}>
                    <Save size={16}/>{saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>

            {/* ── CARD 1: Scheme Details ── */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-7">
              <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
                <Edit3 size={18} className="text-[#1E3A5F]"/>
                <h2 className="text-base font-bold text-[#1E3A5F] uppercase tracking-wider margin-0">
                  Scheme Details
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2">Scheme Name</label>
                  <input value={editData.schemeName}
                    onChange={e => handleFieldChange('schemeName', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-[#1E293B] focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none transition" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2">Academic Year</label>
                  <input value={editData.academicYear}
                    onChange={e => handleFieldChange('academicYear', e.target.value)}
                    placeholder={`e.g. ${currentAcademicYear}`}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-[#1E293B] focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none transition" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2">Pass Mark %</label>
                  <input type="number" min={1} max={100} value={editData.passMarkPercentage}
                    onChange={e => handleFieldChange('passMarkPercentage', parseFloat(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-[#1E293B] focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none transition" />
                </div>
              </div>
            </div>

            {/* ── CARD 2: Grade Point Map ── */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-7">
              <div className="flex items-center justify-between gap-4 mb-6 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-2">
                  <Award size={20} className="text-[#C9A227]"/>
                  <div>
                    <h2 className="text-base font-bold text-[#1E3A5F] uppercase tracking-wider margin-0">
                      Grade Point Map
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">Configure marks percentage ranges, corresponding letter grades, and grade points</p>
                  </div>
                </div>
                <button onClick={addRow}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#FEF3C7',
                    color: '#92400E',
                    border: '1.5px solid #FCD34D',
                    borderRadius: '8px',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 150ms'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FDE68A'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FEF3C7'}
                >
                  <Plus size={16}/> Add Row
                </button>
              </div>

              {/* Spacious Table Container */}
              <div className="overflow-hidden rounded-xl border border-gray-200 mb-6">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-[#1E3A5F] text-white">
                      <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider w-24">Min %</th>
                      <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider w-24">Max %</th>
                      <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider w-20">Grade</th>
                      <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider w-20">Points</th>
                      <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Description</th>
                      <th className="px-4 py-3.5 text-center text-xs font-bold uppercase tracking-wider w-16">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {editData.gradeTable.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-4 py-3">
                          <input type="number" step="0.01" value={row.minPercentage}
                            onChange={e => handleRowChange(i, 'minPercentage', e.target.value)}
                            className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-xs font-bold text-center focus:ring-2 focus:ring-[#C9A227] outline-none" />
                        </td>
                        <td className="px-4 py-3">
                          <input type="number" step="0.01" value={row.maxPercentage}
                            onChange={e => handleRowChange(i, 'maxPercentage', e.target.value)}
                            className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-xs font-bold text-center focus:ring-2 focus:ring-[#C9A227] outline-none" />
                        </td>
                        <td className="px-4 py-3">
                          <input type="text" value={row.grade}
                            onChange={e => handleRowChange(i, 'grade', e.target.value)}
                            className="w-16 px-3 py-2 border border-gray-300 rounded-lg text-xs text-center font-extrabold focus:ring-2 focus:ring-[#C9A227] outline-none"
                            style={{ color: gradeColor(row.grade) }} />
                        </td>
                        <td className="px-4 py-3">
                          <input type="number" value={row.gradePoint}
                            onChange={e => handleRowChange(i, 'gradePoint', e.target.value)}
                            className="w-16 px-3 py-2 border border-gray-300 rounded-lg text-xs text-center font-bold focus:ring-2 focus:ring-[#C9A227] outline-none" />
                        </td>
                        <td className="px-4 py-3">
                          <input type="text" value={row.description}
                            onChange={e => handleRowChange(i, 'description', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-800 focus:ring-2 focus:ring-[#C9A227] outline-none" />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => removeRow(i)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete Row">
                            <Trash2 size={16}/>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Grade Badges Quick Reference */}
              <div className="bg-gray-50/80 rounded-xl p-5 border border-gray-200/60">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                  Grade Badges Quick Reference
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {editData.gradeTable.map((row, i) => (
                    <div key={i} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border shadow-xs"
                      style={{ borderColor: gradeColor(row.grade), color: gradeColor(row.grade), background: `${gradeColor(row.grade)}12` }}>
                      <span>{row.grade || '?'}</span>
                      <span className="font-semibold opacity-75">({row.gradePoint} pt)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── CARD 3: Grade Preview Calculator ── */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-7">
              <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
                <Calculator size={18} className="text-[#1E3A5F]"/>
                <h2 className="text-base font-bold text-[#1E3A5F] uppercase tracking-wider margin-0">
                  Grade Preview Calculator
                </h2>
              </div>

              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <label className="text-sm font-bold text-[#1E293B] whitespace-nowrap">Enter Marks %</label>
                  <input type="number" min={0} max={100} value={previewMarks}
                    onChange={e => setPreviewMarks(e.target.value)}
                    placeholder="e.g. 75"
                    className="w-28 px-3 py-2.5 border border-gray-300 rounded-lg text-base text-center font-bold text-[#1E3A5F] focus:ring-2 focus:ring-[#C9A227] outline-none" />
                </div>

                {previewGrade ? (
                  <div className="flex items-center gap-4 px-6 py-3.5 rounded-xl border-2 shadow-xs"
                    style={{ borderColor: gradeColor(previewGrade.grade), background: `${gradeColor(previewGrade.grade)}10` }}>
                    <span className="text-4xl font-black" style={{ color: gradeColor(previewGrade.grade) }}>
                      {previewGrade.grade}
                    </span>
                    <div>
                      <p className="text-base font-bold" style={{ color: gradeColor(previewGrade.grade) }}>
                        {previewGrade.gradePoint} Grade Points
                      </p>
                      <p className="text-xs font-medium text-gray-600">{previewGrade.description}</p>
                    </div>
                  </div>
                ) : previewMarks ? (
                  <div className="px-5 py-3.5 rounded-xl bg-gray-100 text-sm font-semibold text-gray-500">No matching grade found for {previewMarks}%</div>
                ) : (
                  <p className="text-sm font-medium text-gray-400 italic">Enter a percentage to test grade calculation →</p>
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
          message="Delete this grading scheme? This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
};

export default GradingScheme;

