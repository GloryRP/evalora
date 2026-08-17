/**
 * Students Management — Enhanced
 * Features: live search, batch/year-wise filtering (e.g. 2021-2025, 2023-2027), pagination, initials avatars, export to Excel (with field selection), bulk import, password reset, styled confirm dialog
 */
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/api';
import { Plus, Edit2, Trash2, Search, Filter, Upload, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import BulkImportModal from '../../components/BulkImportModal';
import ConfirmDialog from '../../components/ConfirmDialog';
import ExportModal from '../../components/ExportModal';

const PAGE_SIZE = 10;

// Avatar initials helper
const Avatar = ({ name }) => {
  const initials = name ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : '?';
  return (
    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-navy)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
      {initials}
    </div>
  );
};

// Pagination component
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

const Students = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [confirm, setConfirm] = useState(null); // { id, name }
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ department: '', semester: '', batch: '' });
  const [page, setPage] = useState(1);
  const [formData, setFormData] = useState({ usn: '', name: '', department: '', semester: '', email: '', phone: '', batch: '' });

  const { data: studentsData, isLoading } = useQuery({
    queryKey: ['students', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.department) params.append('department', filters.department);
      if (filters.semester) params.append('semester', filters.semester);
      if (filters.batch) params.append('batch', filters.batch);
      const response = await apiClient.get(`/admin/students?${params}`);
      return response.data;
    },
  });

  // Fetch departments for dropdown
  const { data: departmentsData } = useQuery({
    queryKey: ['departments-list'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/departments');
      return response.data?.data || [];
    },
  });

  // Client-side search + pagination
  const allStudents = studentsData?.data || [];
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return q 
      ? allStudents.filter(s => 
          s.name?.toLowerCase().includes(q) || 
          s.usn?.toLowerCase().includes(q) || 
          s.email?.toLowerCase().includes(q) ||
          s.batch?.toLowerCase().includes(q)
        ) 
      : allStudents;
  }, [allStudents, search]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const createMutation = useMutation({
    mutationFn: (data) => apiClient.post('/admin/students', data),
    onSuccess: () => { queryClient.invalidateQueries(['students']); closeModal(); toast.success('Student created successfully!'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to create student'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.put(`/admin/students/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries(['students']); closeModal(); toast.success('Student updated successfully!'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to update student'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/admin/students/${id}`),
    onSuccess: () => { queryClient.invalidateQueries(['students']); toast.success('Student deleted successfully!'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to delete student'),
  });

  const openModal = (student = null) => {
    if (student) {
      setEditingStudent(student);
      setFormData({ usn: student.usn, name: student.name, department: student.department, semester: student.semester, email: student.email || '', phone: student.phone || '', batch: student.batch || '' });
    } else {
      setEditingStudent(null);
      setFormData({ usn: '', name: '', department: '', semester: '', email: '', phone: '', batch: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingStudent(null); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingStudent) {
      const { usn, ...updateData } = formData;
      if (!updateData.password || updateData.password.trim() === '') {
        delete updateData.password;
      }
      updateMutation.mutate({ id: editingStudent._id, data: updateData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div style={{ marginBottom: '20px' }}>
          {/* ROW 1: Title + Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: 0 }}>
              Students
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
                <Plus size={20} /> Add Student
              </button>
            </div>
          </div>

          {/* ROW 2: Record count */}
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontWeight: 400, marginBottom: '16px' }}>
            {filtered.length} student{filtered.length !== 1 ? 's' : ''}{search ? ' found' : ' total'}
          </p>

          {/* ROW 3: Search + Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <input type="text" placeholder="Search by name, USN or email…" value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{ flex: 1, minWidth: '200px', padding: '10px 16px', border: '1.5px solid #E0E0E0', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--color-text)', backgroundColor: 'white', outline: 'none', fontFamily: 'var(--font-body)', transition: 'border-color 200ms ease' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-gold)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,162,39,0.08)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#E0E0E0'; e.currentTarget.style.boxShadow = 'none'; }} />
            <input type="text" placeholder="Department…" value={filters.department}
              onChange={e => { setFilters({ ...filters, department: e.target.value }); setPage(1); }}
              style={{ width: '180px', flexShrink: 0, padding: '10px 14px', border: '1.5px solid #E0E0E0', borderRadius: '8px', fontSize: '0.875rem', color: 'var(--color-text)', backgroundColor: 'white', outline: 'none', fontFamily: 'var(--font-body)', transition: 'border-color 200ms ease' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-gold)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#E0E0E0'; }} />
            <select value={filters.batch} onChange={e => { setFilters({ ...filters, batch: e.target.value }); setPage(1); }}
              style={{ width: '140px', padding: '10px 14px', border: '1.5px solid #E0E0E0', borderRadius: '8px', fontSize: '0.875rem', color: 'var(--color-text)', backgroundColor: 'white', outline: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', appearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235C5C5C' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: '32px', transition: 'border-color 200ms ease' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-gold)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#E0E0E0'; }}>
              <option value="">All Batches</option>
              {['2020-2024', '2021-2025', '2022-2026', '2023-2027', '2024-2028', '2025-2029'].map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <select value={filters.semester} onChange={e => { setFilters({ ...filters, semester: e.target.value }); setPage(1); }}
              style={{ width: '150px', padding: '10px 14px', border: '1.5px solid #E0E0E0', borderRadius: '8px', fontSize: '0.875rem', color: 'var(--color-text)', backgroundColor: 'white', outline: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', appearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235C5C5C' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: '32px', transition: 'border-color 200ms ease' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-gold)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#E0E0E0'; }}>
              <option value="">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => <option key={sem} value={sem}>Semester {sem}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        <div style={{ backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #F0F0F0', overflow: 'hidden' }}>
          {isLoading ? (
            <div className="p-6"><LoadingSkeleton rows={5} columns={8} /></div>
          ) : paginated.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <Search size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-[#1A1A1A] mb-1">{search ? 'No results found' : 'No students yet'}</h3>
              <p className="text-[#5C5C5C] mb-4">{search ? `No students match "${search}"` : 'Get started by adding your first student'}</p>
              {!search && <Button onClick={() => openModal()} variant="primary"><Plus size={18} className="inline mr-2" />Add Student</Button>}
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ backgroundColor: 'var(--color-navy)' }}>
                    <tr>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'white', whiteSpace: 'nowrap', borderBottom: 'none' }}>Student</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'white', whiteSpace: 'nowrap', borderBottom: 'none' }}>Department</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'white', whiteSpace: 'nowrap', borderBottom: 'none' }}>Semester</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'white', whiteSpace: 'nowrap', borderBottom: 'none' }}>Email</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'white', whiteSpace: 'nowrap', borderBottom: 'none' }}>Phone</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'white', whiteSpace: 'nowrap', borderBottom: 'none' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((student) => (
                      <tr key={student._id} style={{ borderBottom: '1px solid #F5F5F5', transition: 'background-color 150ms ease' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F9FAFB'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                        <td style={{ padding: '14px 16px', fontSize: '0.875rem', color: 'var(--color-text)', verticalAlign: 'middle' }}>
                          <div className="flex items-center gap-3">
                            <Avatar name={student.name} />
                            <div>
                              <span className="text-sm font-semibold text-[#1A1A1A] block">{student.name}</span>
                              <span className="text-xs font-mono text-[#1E3A5F]">{student.usn}</span>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '0.875rem', color: 'var(--color-text)', verticalAlign: 'middle' }}><span className="text-sm text-[#5C5C5C]">{student.department}</span></td>
                        <td style={{ padding: '14px 16px', fontSize: '0.875rem', color: 'var(--color-text)', verticalAlign: 'middle' }}>
                          <span style={{ backgroundColor: '#EEF2FF', color: 'var(--color-navy)', padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>Sem {student.semester}</span>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '0.875rem', color: 'var(--color-text)', verticalAlign: 'middle' }}><span className="text-sm text-[#5C5C5C]">{student.email || '—'}</span></td>
                        <td style={{ padding: '14px 16px', fontSize: '0.875rem', color: 'var(--color-text)', verticalAlign: 'middle' }}><span className="text-sm text-[#5C5C5C]">{student.phone || '—'}</span></td>
                        <td style={{ padding: '14px 16px', fontSize: '0.875rem', color: 'var(--color-text)', verticalAlign: 'middle', textAlign: 'right' }}>
                          <button onClick={() => openModal(student)} className="text-[#1E3A5F] hover:text-[#152B45] mr-3 p-1.5 rounded-lg hover:bg-blue-50 transition"><Edit2 size={15} /></button>
                          <button onClick={() => setConfirm({ id: student._id, name: student.name })} className="text-[#B3413E] hover:text-[#9A3633] p-1.5 rounded-lg hover:bg-red-50 transition"><Trash2 size={15} /></button>
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

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            {/* Navy Header */}
            <div style={{ backgroundColor: 'var(--color-navy)', padding: '16px 24px', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'white', margin: 0 }}>
                {editingStudent ? 'Edit Student' : 'Add New Student'}
              </h2>
              <button onClick={closeModal} style={{ color: 'white', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', opacity: 0.8, transition: 'opacity 150ms' }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable Body */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Row 1: USN (full width) */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                      USN <span style={{ color: 'var(--color-error)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.usn}
                      onChange={e => setFormData({ ...formData, usn: e.target.value })}
                      disabled={!!editingStudent}
                      required
                      placeholder="e.g., 1PE21CS001"
                      style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E0E0E0', borderRadius: '8px', fontSize: '0.875rem', fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-text)', backgroundColor: editingStudent ? '#F5F5F5' : 'white', outline: 'none', transition: 'all 200ms' }}
                      onFocus={(e) => { if (!editingStudent) { e.currentTarget.style.borderColor = 'var(--color-gold)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,162,39,0.1)'; } }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = '#E0E0E0'; e.currentTarget.style.boxShadow = 'none'; }}
                    />
                  </div>

                  {/* Row 2: Full Name (full width) */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                      Full Name <span style={{ color: 'var(--color-error)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      required
                      placeholder="Student Full Name"
                      style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E0E0E0', borderRadius: '8px', fontSize: '0.875rem', color: 'var(--color-text)', backgroundColor: 'white', outline: 'none', transition: 'all 200ms' }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-gold)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,162,39,0.1)'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = '#E0E0E0'; e.currentTarget.style.boxShadow = 'none'; }}
                    />
                  </div>

                  {/* Row 3: Department (SELECT dropdown) */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                      Department <span style={{ color: 'var(--color-error)' }}>*</span>
                    </label>
                    <select
                      value={formData.department}
                      onChange={e => setFormData({ ...formData, department: e.target.value })}
                      required
                      style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E0E0E0', borderRadius: '8px', fontSize: '0.875rem', color: 'var(--color-text)', backgroundColor: 'white', outline: 'none', cursor: 'pointer', transition: 'all 200ms' }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-gold)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,162,39,0.1)'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = '#E0E0E0'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      <option value="">Select Department</option>
                      {(departmentsData || []).map(dept => (
                        <option key={dept._id} value={dept.departmentCode}>
                          {dept.departmentName} ({dept.departmentCode})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Row 4: Semester + Batch (two columns) */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                        Semester <span style={{ color: 'var(--color-error)' }}>*</span>
                      </label>
                      <select
                        value={formData.semester}
                        onChange={e => setFormData({ ...formData, semester: e.target.value })}
                        required
                        style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E0E0E0', borderRadius: '8px', fontSize: '0.875rem', color: 'var(--color-text)', backgroundColor: 'white', outline: 'none', cursor: 'pointer', transition: 'all 200ms' }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-gold)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,162,39,0.1)'; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = '#E0E0E0'; e.currentTarget.style.boxShadow = 'none'; }}
                      >
                        <option value="">Select</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                          <option key={s} value={s}>Semester {s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                        Batch
                      </label>
                      <input
                        type="text"
                        value={formData.batch}
                        onChange={e => setFormData({ ...formData, batch: e.target.value })}
                        placeholder="2023-2027"
                        style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E0E0E0', borderRadius: '8px', fontSize: '0.875rem', color: 'var(--color-text)', backgroundColor: 'white', outline: 'none', transition: 'all 200ms' }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-gold)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,162,39,0.1)'; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = '#E0E0E0'; e.currentTarget.style.boxShadow = 'none'; }}
                      />
                    </div>
                  </div>

                  {/* Row 5: Email + Phone (two columns) */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        placeholder="student@college.edu"
                        style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E0E0E0', borderRadius: '8px', fontSize: '0.875rem', color: 'var(--color-text)', backgroundColor: 'white', outline: 'none', transition: 'all 200ms' }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-gold)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,162,39,0.1)'; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = '#E0E0E0'; e.currentTarget.style.boxShadow = 'none'; }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="10-digit"
                        style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E0E0E0', borderRadius: '8px', fontSize: '0.875rem', color: 'var(--color-text)', backgroundColor: 'white', outline: 'none', transition: 'all 200ms' }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-gold)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,162,39,0.1)'; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = '#E0E0E0'; e.currentTarget.style.boxShadow = 'none'; }}
                      />
                    </div>
                  </div>

                  {/* Amber Note Box (only for new students) */}
                  {!editingStudent && (
                    <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '8px', padding: '12px 14px', marginTop: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#92400E" strokeWidth="2" style={{ flexShrink: 0, marginTop: '1px' }}>
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 16v-4M12 8h.01" />
                        </svg>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#92400E', margin: '0 0 4px 0' }}>
                            Password Auto-Generated
                          </p>
                          <p style={{ fontSize: '0.75rem', color: '#92400E', margin: 0, lineHeight: '1.4' }}>
                            Default password will be <strong>{formData.usn ? formData.usn.toUpperCase() : 'USN'}@123</strong>. Student can change it after first login.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sticky Footer */}
              <div style={{ borderTop: '1px solid #E5E7EB', padding: '16px 24px', display: 'flex', gap: '12px', backgroundColor: '#F9FAFB' }}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{ flex: 1, padding: '10px 20px', backgroundColor: 'white', color: 'var(--color-text)', border: '1.5px solid #E0E0E0', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', transition: 'all 150ms' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F5F5F5'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white'; }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  style={{ flex: 1, padding: '10px 20px', backgroundColor: 'var(--color-navy)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, cursor: createMutation.isPending || updateMutation.isPending ? 'not-allowed' : 'pointer', opacity: createMutation.isPending || updateMutation.isPending ? 0.6 : 1, transition: 'all 150ms' }}
                  onMouseEnter={(e) => { if (!createMutation.isPending && !updateMutation.isPending) e.currentTarget.style.backgroundColor = '#152B45'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-navy)'; }}
                >
                  {editingStudent ? 'Update Student' : 'Create Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isBulkModalOpen && (
        <BulkImportModal type="students" onClose={() => setIsBulkModalOpen(false)} onSuccess={() => queryClient.invalidateQueries(['students'])} />
      )}

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        fields={[
          { key: 'usn', label: 'USN' },
          { key: 'name', label: 'Student Name' },
          { key: 'department', label: 'Department' },
          { key: 'batch', label: 'Batch' },
          { key: 'semester', label: 'Semester' },
          { key: 'email', label: 'Email' },
          { key: 'phone', label: 'Phone' }
        ]}
        data={filtered}
        fileName="Students_Export"
        sheetName="Students"
      />

      <ConfirmDialog
        isOpen={!!confirm}
        title="Delete Student?"
        message={`Are you sure you want to delete "${confirm?.name}"? This will also remove their login account.`}
        confirmLabel="Delete Student"
        onConfirm={() => { deleteMutation.mutate(confirm.id); setConfirm(null); }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
};

export default Students;
