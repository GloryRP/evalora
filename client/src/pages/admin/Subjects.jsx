/**
 * Subjects Management — Enhanced
 * Features: live search, pagination, bulk import, export to Excel (with field selection), styled confirm dialog
 */
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/api';
import { Plus, Edit2, Trash2, Search, Filter, BookOpen, Upload, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import BulkImportModal from '../../components/BulkImportModal';
import ConfirmDialog from '../../components/ConfirmDialog';
import ExportModal from '../../components/ExportModal';

const PAGE_SIZE = 12;

const Pagination = ({ page, totalPages, onChange }) => (
  <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50">
    <p className="text-xs text-[#5C5C5C]">Page {page} of {totalPages}</p>
    <div className="flex items-center gap-1">
      <button onClick={() => onChange(page - 1)} disabled={page <= 1}
        className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition">
        <ChevronLeft size={14} />
      </button>
      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
        const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
        return p <= totalPages ? (
          <button key={p} onClick={() => onChange(p)}
            className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${p === page ? 'bg-[#1E3A5F] text-white' : 'border border-gray-200 text-gray-600 hover:bg-white'}`}>
            {p}
          </button>
        ) : null;
      })}
      <button onClick={() => onChange(page + 1)} disabled={page >= totalPages}
        className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition">
        <ChevronRight size={14} />
      </button>
    </div>
  </div>
);

const Subjects = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ department: '', semester: '' });
  const [page, setPage] = useState(1);
  const [formData, setFormData] = useState({
    subjectCode: '',
    subjectName: '',
    department: '',
    semester: '',
    credits: '',
    subjectType: 'theory'
  });

  const { data: subjectsData, isLoading } = useQuery({
    queryKey: ['subjects', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.department) params.append('department', filters.department);
      if (filters.semester) params.append('semester', filters.semester);
      const response = await apiClient.get(`/admin/subjects?${params}`);
      return response.data;
    },
  });

  const allSubjects = subjectsData?.data || [];
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q ? allSubjects.filter(s => s.subjectName?.toLowerCase().includes(q) || s.subjectCode?.toLowerCase().includes(q) || s.department?.toLowerCase().includes(q)) : allSubjects;
  }, [allSubjects, search]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const createMutation = useMutation({
    mutationFn: (data) => apiClient.post('/admin/subjects', data),
    onSuccess: () => { queryClient.invalidateQueries(['subjects']); closeModal(); toast.success('Subject created successfully!'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to create subject'),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.put(`/admin/subjects/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries(['subjects']); closeModal(); toast.success('Subject updated!'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to update subject'),
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/admin/subjects/${id}`),
    onSuccess: () => { queryClient.invalidateQueries(['subjects']); toast.success('Subject deleted!'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to delete subject'),
  });

  const openModal = (subject = null) => {
    if (subject) {
      setEditingSubject(subject);
      setFormData({
        subjectCode: subject.subjectCode,
        subjectName: subject.subjectName,
        department: subject.department,
        semester: subject.semester,
        credits: subject.credits,
        subjectType: subject.subjectType || 'theory'
      });
    } else {
      setEditingSubject(null);
      setFormData({
        subjectCode: '',
        subjectName: '',
        department: '',
        semester: '',
        credits: '',
        subjectType: 'theory'
      });
    }
    setIsModalOpen(true);
  };
  const closeModal = () => { setIsModalOpen(false); setEditingSubject(null); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingSubject) {
      const { subjectCode, ...updateData } = formData;
      updateMutation.mutate({ id: editingSubject._id, data: updateData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const creditColors = { 1: '#6B7280', 2: '#0E7490', 3: '#2563EB', 4: '#5B21B6', 5: '#9D174D', 6: '#065F46' };

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div style={{ marginBottom: '20px' }}>
          {/* ROW 1: Title + Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: 0 }}>
              Subjects
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button onClick={() => setIsExportModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', backgroundColor: 'white', color: 'var(--color-text)', border: '1.5px solid #E0E0E0', borderRadius: '6px', fontSize: '0.825rem', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 150ms ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-navy)'; e.currentTarget.style.color = 'var(--color-navy)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E0E0E0'; e.currentTarget.style.color = 'var(--color-text)'; }}>
                <Download size={17} /> Export Excel
              </button>
              <button onClick={() => setIsBulkModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', backgroundColor: 'white', color: 'var(--color-text)', border: '1.5px solid #E0E0E0', borderRadius: '6px', fontSize: '0.825rem', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 150ms ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-navy)'; e.currentTarget.style.color = 'var(--color-navy)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E0E0E0'; e.currentTarget.style.color = 'var(--color-text)'; }}>
                <Upload size={17} /> Import CSV/Excel
              </button>
              <button onClick={() => openModal()} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', backgroundColor: 'var(--color-gold)', color: 'var(--color-navy)', border: 'none', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 150ms ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#B8911F'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-gold)'; }}>
                <Plus size={20} /> Add Subject
              </button>
            </div>
          </div>

          {/* ROW 2: Record count */}
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontWeight: 400, marginBottom: '16px' }}>
            {filtered.length} subject{filtered.length !== 1 ? 's' : ''}{search ? ' found' : ' total'}
          </p>

          {/* ROW 3: Search + Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <input type="text" placeholder="Search by subject name, code or department…" value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{ flex: 1, minWidth: '200px', padding: '10px 16px', border: '1.5px solid #E0E0E0', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--color-text)', backgroundColor: 'white', outline: 'none', fontFamily: 'var(--font-body)', transition: 'border-color 200ms ease' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-gold)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,162,39,0.08)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#E0E0E0'; e.currentTarget.style.boxShadow = 'none'; }} />
            <input type="text" placeholder="Department…" value={filters.department}
              onChange={e => { setFilters({ ...filters, department: e.target.value }); setPage(1); }}
              style={{ width: '180px', flexShrink: 0, padding: '10px 14px', border: '1.5px solid #E0E0E0', borderRadius: '8px', fontSize: '0.875rem', color: 'var(--color-text)', backgroundColor: 'white', outline: 'none', fontFamily: 'var(--font-body)', transition: 'border-color 200ms ease' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-gold)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#E0E0E0'; }} />
            <select value={filters.semester} onChange={e => { setFilters({ ...filters, semester: e.target.value }); setPage(1); }}
              style={{ width: '150px', padding: '10px 14px', border: '1.5px solid #E0E0E0', borderRadius: '8px', fontSize: '0.875rem', color: 'var(--color-text)', backgroundColor: 'white', outline: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', appearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235C5C5C' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: '32px', transition: 'border-color 200ms ease' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-gold)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#E0E0E0'; }}>
              <option value="">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
            </select>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #F0F0F0', overflow: 'hidden' }}>
          {isLoading ? (
            <div className="p-6"><LoadingSkeleton rows={5} columns={5} /></div>
          ) : paginated.length === 0 ? (
            <div className="p-12 text-center">
              <BookOpen size={36} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[#1A1A1A] mb-1">{search ? 'No subjects found' : 'No subjects yet'}</h3>
              <p className="text-[#5C5C5C] mb-4">{search ? `No subjects match "${search}"` : 'Add your first subject or import from Excel'}</p>
              {!search && <Button onClick={() => openModal()} variant="primary"><Plus size={18} className="inline mr-2" />Add Subject</Button>}
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ backgroundColor: 'var(--color-navy)' }}>
                    <tr>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'white', whiteSpace: 'nowrap', borderBottom: 'none' }}>Subject Code</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'white', whiteSpace: 'nowrap', borderBottom: 'none' }}>Subject Name</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'white', whiteSpace: 'nowrap', borderBottom: 'none' }}>Department</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'white', whiteSpace: 'nowrap', borderBottom: 'none' }}>Semester</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'white', whiteSpace: 'nowrap', borderBottom: 'none' }}>Type</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'white', whiteSpace: 'nowrap', borderBottom: 'none' }}>Credits</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'white', whiteSpace: 'nowrap', borderBottom: 'none' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((subject) => (
                      <tr key={subject._id} style={{ borderBottom: '1px solid #F5F5F5', transition: 'background-color 150ms ease' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F9FAFB'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                        <td className="px-6 py-3.5 whitespace-nowrap">
                          <span className="text-xs font-mono font-bold text-[#1E3A5F] bg-blue-50 px-2.5 py-1 rounded-md">{subject.subjectCode}</span>
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-[#1E3A5F]/8 flex items-center justify-center shrink-0">
                              <BookOpen size={13} className="text-[#1E3A5F]" />
                            </div>
                            <span className="text-sm font-medium text-[#1A1A1A]">{subject.subjectName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap"><span className="text-sm text-[#5C5C5C]">{subject.department}</span></td>
                        <td className="px-6 py-3.5 whitespace-nowrap"><Badge variant="navy">Sem {subject.semester}</Badge></td>
                        <td className="px-6 py-3.5 whitespace-nowrap">
                          <span className="text-xs font-semibold capitalize" style={{ color: 'var(--color-navy)' }}>
                            {subject.subjectType === 'integrated' ? 'Theory + Lab' : subject.subjectType === 'lab' ? 'Lab' : 'Theory'}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap">
                          <span style={{ fontWeight: 700, color: 'var(--color-navy)', fontSize: '1rem' }}>{subject.credits}</span>
                          <span style={{ color: '#9CA3AF', fontSize: '0.75rem', marginLeft: '2px' }}>cr</span>
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap text-right">
                          <button onClick={() => openModal(subject)} className="text-[#1E3A5F] hover:text-[#152B45] mr-3 p-1.5 rounded-lg hover:bg-blue-50 transition"><Edit2 size={15} /></button>
                          <button onClick={() => setConfirm({ id: subject._id, name: subject.subjectName })} className="text-[#B3413E] hover:text-[#9A3633] p-1.5 rounded-lg hover:bg-red-50 transition"><Trash2 size={15} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', padding: '0 4px' }}>
                  <p style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)' }}>Page {page} of {totalPages}</p>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={() => setPage(page - 1)} disabled={page <= 1}
                      style={{ width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', border: '1.5px solid #E0E0E0', backgroundColor: 'white', fontSize: '0.875rem', cursor: page <= 1 ? 'not-allowed' : 'pointer', color: 'var(--color-text)', transition: 'all 150ms ease', opacity: page <= 1 ? 0.4 : 1 }}
                      onMouseEnter={(e) => { if (page > 1) { e.currentTarget.style.borderColor = 'var(--color-navy)'; e.currentTarget.style.color = 'var(--color-navy)'; } }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E0E0E0'; e.currentTarget.style.color = 'var(--color-text)'; }}>
                      <ChevronLeft size={14} />
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                      return p <= totalPages ? (
                        <button key={p} onClick={() => setPage(p)}
                          style={{ width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', border: p === page ? 'none' : '1.5px solid #E0E0E0', backgroundColor: p === page ? 'var(--color-navy)' : 'white', color: p === page ? 'white' : 'var(--color-text)', fontSize: '0.875rem', cursor: 'pointer', transition: 'all 150ms ease' }}
                          onMouseEnter={(e) => { if (p !== page) { e.currentTarget.style.borderColor = 'var(--color-navy)'; e.currentTarget.style.color = 'var(--color-navy)'; } }}
                          onMouseLeave={(e) => { if (p !== page) { e.currentTarget.style.borderColor = '#E0E0E0'; e.currentTarget.style.color = 'var(--color-text)'; } }}>
                          {p}
                        </button>
                      ) : null;
                    })}
                    <button onClick={() => setPage(page + 1)} disabled={page >= totalPages}
                      style={{ width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', border: '1.5px solid #E0E0E0', backgroundColor: 'white', fontSize: '0.875rem', cursor: page >= totalPages ? 'not-allowed' : 'pointer', color: 'var(--color-text)', transition: 'all 150ms ease', opacity: page >= totalPages ? 0.4 : 1 }}
                      onMouseEnter={(e) => { if (page < totalPages) { e.currentTarget.style.borderColor = 'var(--color-navy)'; e.currentTarget.style.color = 'var(--color-navy)'; } }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E0E0E0'; e.currentTarget.style.color = 'var(--color-text)'; }}>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', width: '100%', maxWidth: '520px', maxHeight: '88vh', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column' }}>
            {/* Navy Header */}
            <div style={{ backgroundColor: 'var(--color-navy)', padding: '18px 24px', borderRadius: '12px 12px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, color: 'white', margin: 0 }}>
                {editingSubject ? 'Edit Subject' : 'Add New Subject'}
              </h2>
              <button onClick={closeModal} type="button" style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ×
              </button>
            </div>

            {/* Scrollable Body */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
                {/* Row 1: Subject Code */}
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                    Subject Code <span style={{ color: 'var(--color-error)', marginLeft: '2px' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.subjectCode}
                    onChange={e => setFormData({ ...formData, subjectCode: e.target.value })}
                    disabled={!!editingSubject}
                    required
                    placeholder="e.g., CS601"
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E0E0E0', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--color-text)', backgroundColor: editingSubject ? '#F5F5F5' : 'white', outline: 'none', fontFamily: 'monospace', fontWeight: 600, boxSizing: 'border-box', transition: 'border-color 200ms ease' }}
                    onFocus={(e) => { if (!editingSubject) { e.currentTarget.style.borderColor = 'var(--color-gold)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,162,39,0.08)'; } }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#E0E0E0'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>

                {/* Row 2: Subject Name */}
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                    Subject Name <span style={{ color: 'var(--color-error)', marginLeft: '2px' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.subjectName}
                    onChange={e => setFormData({ ...formData, subjectName: e.target.value })}
                    required
                    placeholder="e.g., Machine Learning"
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E0E0E0', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--color-text)', backgroundColor: 'white', outline: 'none', fontFamily: 'var(--font-body)', boxSizing: 'border-box', transition: 'border-color 200ms ease' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-gold)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,162,39,0.08)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#E0E0E0'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>

                {/* Row 3: Department (SELECT dropdown) */}
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                    Department <span style={{ color: 'var(--color-error)', marginLeft: '2px' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                    required
                    placeholder="e.g., Computer Science"
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E0E0E0', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--color-text)', backgroundColor: 'white', outline: 'none', fontFamily: 'var(--font-body)', boxSizing: 'border-box', transition: 'border-color 200ms ease' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-gold)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,162,39,0.08)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#E0E0E0'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>

                {/* Row 4: Semester + Credits (two columns) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                      Semester <span style={{ color: 'var(--color-error)', marginLeft: '2px' }}>*</span>
                    </label>
                    <select
                      value={formData.semester}
                      onChange={e => setFormData({ ...formData, semester: e.target.value })}
                      required
                      style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E0E0E0', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--color-text)', backgroundColor: 'white', outline: 'none', fontFamily: 'var(--font-body)', boxSizing: 'border-box', cursor: 'pointer', transition: 'border-color 200ms ease' }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-gold)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,162,39,0.08)'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = '#E0E0E0'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      <option value="">Select</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                        <option key={s} value={s}>Semester {s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                      Credits <span style={{ color: 'var(--color-error)', marginLeft: '2px' }}>*</span>
                    </label>
                    <select
                      value={formData.credits}
                      onChange={e => setFormData({ ...formData, credits: e.target.value })}
                      required
                      style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E0E0E0', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--color-text)', backgroundColor: 'white', outline: 'none', fontFamily: 'var(--font-body)', boxSizing: 'border-box', cursor: 'pointer', transition: 'border-color 200ms ease' }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-gold)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,162,39,0.08)'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = '#E0E0E0'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      <option value="">Select</option>
                      {[1, 2, 3, 4, 5].map(c => (
                        <option key={c} value={c}>{c} Credit{c > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 5: Subject Type */}
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                    Subject Type <span style={{ color: 'var(--color-error)', marginLeft: '2px' }}>*</span>
                  </label>
                  <select
                    value={formData.subjectType}
                    onChange={e => setFormData({ ...formData, subjectType: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E0E0E0', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--color-text)', backgroundColor: 'white', outline: 'none', fontFamily: 'var(--font-body)', boxSizing: 'border-box', cursor: 'pointer', transition: 'border-color 200ms ease' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-gold)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,162,39,0.08)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#E0E0E0'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <option value="theory">Theory Only</option>
                    <option value="lab">Lab Only</option>
                    <option value="integrated">Theory + Lab</option>
                  </select>
                </div>
              </div>

              {/* Sticky Footer */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid #F0F0F0', display: 'flex', gap: '12px', justifyContent: 'flex-end', flexShrink: 0, backgroundColor: 'white', borderRadius: '0 0 12px 12px' }}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{ padding: '10px 20px', border: '1.5px solid #E0E0E0', borderRadius: '8px', backgroundColor: 'white', color: 'var(--color-text-secondary)', fontSize: '0.875rem', cursor: 'pointer', transition: 'all 150ms' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F5F5F5'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white'; }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  style={{ padding: '10px 24px', backgroundColor: 'var(--color-navy)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, cursor: createMutation.isPending || updateMutation.isPending ? 'not-allowed' : 'pointer', opacity: createMutation.isPending || updateMutation.isPending ? 0.6 : 1, transition: 'all 150ms' }}
                  onMouseEnter={(e) => { if (!createMutation.isPending && !updateMutation.isPending) e.currentTarget.style.backgroundColor = '#152B45'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-navy)'; }}
                >
                  {editingSubject ? 'Update Subject' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isBulkModalOpen && <BulkImportModal type="subjects" onClose={() => setIsBulkModalOpen(false)} onSuccess={() => queryClient.invalidateQueries(['subjects'])} />}

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        fields={[
          { key: 'subjectCode', label: 'Subject Code' },
          { key: 'subjectName', label: 'Subject Name' },
          { key: 'department', label: 'Department' },
          { key: 'semester', label: 'Semester' },
          { key: 'credits', label: 'Credits' }
        ]}
        data={filtered}
        fileName="Subjects_Export"
        sheetName="Subjects"
      />

      <ConfirmDialog isOpen={!!confirm} title="Delete Subject?"
        message={`Remove "${confirm?.name}" from the curriculum? This cannot be undone.`}
        confirmLabel="Delete Subject" onConfirm={() => { deleteMutation.mutate(confirm.id); setConfirm(null); }} onCancel={() => setConfirm(null)} />
    </div>
  );
};

export default Subjects;
