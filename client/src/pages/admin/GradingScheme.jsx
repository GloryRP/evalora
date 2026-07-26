/**
 * GradingScheme - Multi-scheme management with history sidebar
 * Supports: view all schemes, create new, edit any, activate historical, delete
 */
import { useState, useEffect } from 'react';
import {
  Award, Plus, Trash2, Save, RefreshCw, CheckCircle2,
  Clock, ChevronRight, BookOpen, Zap, X, AlertTriangle, Edit3,
} from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

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
  if (g === 'P')  return '#F59E0B';
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
  const [form, setForm] = useState({
    schemeName: '',
    academicYear: '',
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        style={{ animation: 'pop .22s cubic-bezier(.34,1.56,.64,1)' }}>
        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100"
          style={{ background: 'linear-gradient(135deg,#1E3A5F,#2D5A8E)' }}>
          <div>
            <h2 className="text-lg font-bold text-white">Create New Grading Scheme</h2>
            <p className="text-xs text-blue-200 mt-0.5">Saves as a separate historical record</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* name + year + pass % */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-[#5C5C5C] uppercase tracking-wider mb-1.5">Academic Year *</label>
              <input value={form.academicYear} onChange={e => setForm({...form, academicYear: e.target.value})}
                placeholder="e.g. 2024-25" required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#5C5C5C] uppercase tracking-wider mb-1.5">Scheme Name *</label>
              <input value={form.schemeName} onChange={e => setForm({...form, schemeName: e.target.value})}
                placeholder="e.g. VTU CBCS 2021 Scheme" required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5C5C5C] uppercase tracking-wider mb-1.5">Pass Mark %</label>
              <input type="number" value={form.passMarkPercentage} min={1} max={100}
                onChange={e => setForm({...form, passMarkPercentage: parseFloat(e.target.value)})}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none" />
            </div>
            <div className="sm:col-span-2 flex items-center gap-3 mt-2">
              <input type="checkbox" id="setActive" checked={form.setActive}
                onChange={e => setForm({...form, setActive: e.target.checked})}
                className="w-4 h-4 rounded accent-[#C9A227]" />
              <label htmlFor="setActive" className="text-sm font-medium text-[#1A1A1A]">
                Set as <span className="text-[#C9A227] font-semibold">Active</span> scheme immediately
              </label>
            </div>
          </div>

          {/* Grade table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#1E3A5F]">Grade Point Map</h3>
              <button type="button" onClick={() => setGradeTable([...gradeTable, { minPercentage: 0, maxPercentage: 9, grade: '', gradePoint: 0, description: '' }])}
                className="text-xs px-3 py-1.5 rounded-lg border border-dashed border-[#C9A227] text-[#C9A227] font-semibold hover:bg-amber-50 transition">
                + Add Row
              </button>
            </div>
            <div className="overflow-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-[#1E3A5F] text-white">
                  <tr>{['Min %','Max %','Grade','Points','Description',''].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {gradeTable.map((row, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      {['minPercentage','maxPercentage'].map(f => (
                        <td key={f} className="px-2 py-1.5">
                          <input type="number" step="0.01" value={row[f]}
                            onChange={e => handleRowChange(i, f, e.target.value)}
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-xs text-center focus:ring-1 focus:ring-[#C9A227] outline-none" />
                        </td>
                      ))}
                      <td className="px-2 py-1.5">
                        <input type="text" value={row.grade} onChange={e => handleRowChange(i, 'grade', e.target.value)}
                          className="w-14 px-2 py-1 border border-gray-300 rounded text-xs text-center font-bold focus:ring-1 focus:ring-[#C9A227] outline-none"
                          style={{ color: gradeColor(row.grade) }} />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" value={row.gradePoint} onChange={e => handleRowChange(i, 'gradePoint', e.target.value)}
                          className="w-14 px-2 py-1 border border-gray-300 rounded text-xs text-center focus:ring-1 focus:ring-[#C9A227] outline-none" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="text" value={row.description} onChange={e => handleRowChange(i, 'description', e.target.value)}
                          className="w-full min-w-[120px] px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-[#C9A227] outline-none" />
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <button type="button" onClick={() => setGradeTable(gradeTable.filter((_,j)=>j!==i))}
                          className="text-red-400 hover:text-red-600 transition"><Trash2 size={14}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </form>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button type="button" onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-[#5C5C5C] hover:bg-gray-200 transition">Cancel</button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#1E3A5F,#2D5A8E)' }}>
            {saving ? 'Creating…' : <><Save size={15}/> Create Scheme</>}
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
      <div className="w-72 shrink-0 bg-white border-r border-gray-100 flex flex-col"
        style={{ minHeight: '100vh' }}>
        {/* Sidebar header */}
        <div className="px-5 py-4 border-b border-gray-100"
          style={{ background: 'linear-gradient(135deg,#1E3A5F,#2D5A8E)' }}>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={18} className="text-[#C9A227]" />
            <h2 className="text-sm font-bold text-white">Scheme History</h2>
          </div>
          <button onClick={() => setShowNewModal(true)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-[#C9A227] hover:bg-[#b8911f] text-[#1A1A1A] text-xs font-bold transition">
            <Plus size={14}/> New Scheme
          </button>
        </div>

        {/* Scheme list */}
        <div className="flex-1 overflow-y-auto py-2">
          {loading ? (
            <div className="space-y-2 p-3">
              {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse"/>)}
            </div>
          ) : allSchemes.length === 0 ? (
            <div className="p-5 text-center text-sm text-gray-400">No schemes yet</div>
          ) : (
            allSchemes.map(scheme => (
              <button key={scheme._id}
                onClick={() => handleSelectScheme(scheme)}
                className={`w-full text-left px-4 py-3.5 border-b border-gray-50 transition-all group hover:bg-blue-50/60 ${selectedId === scheme._id ? 'bg-blue-50 border-l-4 border-l-[#1E3A5F]' : 'border-l-4 border-l-transparent'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className={`text-xs font-bold truncate ${selectedId===scheme._id ? 'text-[#1E3A5F]' : 'text-[#1A1A1A]'}`}>
                      {scheme.schemeName}
                    </p>
                    <p className="text-xs text-[#5C5C5C] mt-0.5 flex items-center gap-1">
                      <Clock size={10}/>{scheme.academicYear || 'No Year'}
                    </p>
                  </div>
                  <div className="shrink-0 mt-0.5">
                    {scheme.isActive
                      ? <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold"><CheckCircle2 size={10}/>Active</span>
                      : <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-semibold">Archive</span>}
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">{scheme.gradeTable?.length || 0} grades · Pass {scheme.passMarkPercentage}%</p>
              </button>
            ))
          )}
        </div>

        {/* Refresh */}
        <div className="border-t border-gray-100 p-3">
          <button onClick={fetchAll}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-gray-200 text-xs text-[#5C5C5C] hover:bg-gray-50 transition">
            <RefreshCw size={12}/> Refresh
          </button>
        </div>
      </div>

      {/* ── RIGHT PANEL — Selected Scheme Editor ── */}
      <div className="flex-1 overflow-y-auto">
        {!editData ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-10">
            <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
              <Award size={36} className="text-gray-300"/>
            </div>
            <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">Select a Scheme</h3>
            <p className="text-sm text-[#5C5C5C] mb-5">Choose a grading scheme from the left panel, or create a new one.</p>
            <button onClick={() => setShowNewModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg,#1E3A5F,#2D5A8E)' }}>
              <Plus size={16}/> Create First Scheme
            </button>
          </div>
        ) : (
          <div className="p-6 lg:p-8 space-y-6">

            {/* ── Top bar ── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-[#1A1A1A]">{editData.schemeName}</h1>
                  {isActiveSelected
                    ? <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold"><CheckCircle2 size={12}/>Active</span>
                    : <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold">Archived</span>}
                  {isDirty && <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">Unsaved</span>}
                </div>
                <p className="text-sm text-[#5C5C5C]">Academic Year: <span className="font-semibold text-[#1A1A1A]">{editData.academicYear}</span></p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {!isActiveSelected && (
                  <button onClick={handleActivate} disabled={activating}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 border-green-500 text-green-600 hover:bg-green-50 transition disabled:opacity-50">
                    <Zap size={15}/>{activating ? 'Activating…' : 'Set as Active'}
                  </button>
                )}
                {!isActiveSelected && (
                  <button onClick={() => setConfirmDelete(selectedId)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-red-200 text-red-500 hover:bg-red-50 transition">
                    <Trash2 size={15}/> Delete
                  </button>
                )}
                <button onClick={handleSave} disabled={saving || !isDirty}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition disabled:opacity-50"
                  style={{ background: isDirty ? 'linear-gradient(135deg,#1E3A5F,#2D5A8E)' : '#9CA3AF' }}>
                  <Save size={15}/>{saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>

            {/* ── Meta fields ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-bold text-[#5C5C5C] uppercase tracking-wider mb-4 flex items-center gap-2">
                <Edit3 size={14}/> Scheme Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#5C5C5C] mb-1.5">Scheme Name</label>
                  <input value={editData.schemeName}
                    onChange={e => handleFieldChange('schemeName', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5C5C5C] mb-1.5">Academic Year</label>
                  <input value={editData.academicYear}
                    onChange={e => handleFieldChange('academicYear', e.target.value)}
                    placeholder="e.g. 2024-25"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5C5C5C] mb-1.5">Pass Mark %</label>
                  <input type="number" min={1} max={100} value={editData.passMarkPercentage}
                    onChange={e => handleFieldChange('passMarkPercentage', parseFloat(e.target.value))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none" />
                </div>
              </div>
            </div>

            {/* ── Grade table ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-[#5C5C5C] uppercase tracking-wider flex items-center gap-2">
                  <Award size={14} className="text-[#C9A227]"/> Grade Point Map
                </h2>
                <button onClick={addRow}
                  className="text-xs px-3 py-1.5 rounded-lg border border-dashed border-[#C9A227] text-[#C9A227] font-semibold hover:bg-amber-50 transition flex items-center gap-1">
                  <Plus size={12}/> Add Row
                </button>
              </div>
              <div className="overflow-auto rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#1E3A5F] text-white">
                      {['Min %','Max %','Grade','Points','Description',''].map(h => (
                        <th key={h} className="px-3 py-3 text-left text-xs font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {editData.gradeTable.map((row, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        {['minPercentage','maxPercentage'].map(f => (
                          <td key={f} className="px-2 py-2">
                            <input type="number" step="0.01" value={row[f]}
                              onChange={e => handleRowChange(i, f, e.target.value)}
                              className="w-18 px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-center focus:ring-1 focus:ring-[#C9A227] outline-none transition" style={{width:'72px'}} />
                          </td>
                        ))}
                        <td className="px-2 py-2">
                          <input type="text" value={row.grade}
                            onChange={e => handleRowChange(i, 'grade', e.target.value)}
                            className="w-14 px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-center font-bold focus:ring-1 focus:ring-[#C9A227] outline-none transition"
                            style={{ color: gradeColor(row.grade), width:'56px' }} />
                        </td>
                        <td className="px-2 py-2">
                          <input type="number" value={row.gradePoint}
                            onChange={e => handleRowChange(i, 'gradePoint', e.target.value)}
                            className="w-14 px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-center focus:ring-1 focus:ring-[#C9A227] outline-none transition" style={{width:'56px'}} />
                        </td>
                        <td className="px-2 py-2">
                          <input type="text" value={row.description}
                            onChange={e => handleRowChange(i, 'description', e.target.value)}
                            className="w-full min-w-[130px] px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#C9A227] outline-none transition" />
                        </td>
                        <td className="px-2 py-2 text-center">
                          <button onClick={() => removeRow(i)}
                            className="text-red-300 hover:text-red-500 transition"><Trash2 size={14}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Grade badge preview */}
              <div className="mt-4 flex flex-wrap gap-2">
                {editData.gradeTable.map((row,i) => (
                  <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border"
                    style={{ borderColor: gradeColor(row.grade), color: gradeColor(row.grade), background: `${gradeColor(row.grade)}15` }}>
                    {row.grade || '?'} <span className="font-normal opacity-60">({row.gradePoint}pt)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── CGPA Calculator Preview ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-bold text-[#5C5C5C] uppercase tracking-wider mb-4 flex items-center gap-2">
                <ChevronRight size={14}/> Grade Preview Calculator
              </h2>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 border border-gray-200">
                  <label className="text-sm font-medium text-[#5C5C5C] whitespace-nowrap">Enter Marks %</label>
                  <input type="number" min={0} max={100} value={previewMarks}
                    onChange={e => setPreviewMarks(e.target.value)}
                    placeholder="e.g. 75"
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm text-center font-semibold focus:ring-2 focus:ring-[#C9A227] outline-none" />
                </div>
                {previewGrade ? (
                  <div className="flex items-center gap-3 px-5 py-3 rounded-xl border-2"
                    style={{ borderColor: gradeColor(previewGrade.grade), background: `${gradeColor(previewGrade.grade)}12` }}>
                    <span className="text-3xl font-black" style={{ color: gradeColor(previewGrade.grade) }}>
                      {previewGrade.grade}
                    </span>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: gradeColor(previewGrade.grade) }}>
                        {previewGrade.gradePoint} Grade Points
                      </p>
                      <p className="text-xs text-[#5C5C5C]">{previewGrade.description}</p>
                    </div>
                  </div>
                ) : previewMarks ? (
                  <div className="px-4 py-3 rounded-xl bg-gray-100 text-sm text-gray-500">No matching grade found</div>
                ) : (
                  <p className="text-sm text-gray-400 italic">Enter a percentage to see the grade →</p>
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
