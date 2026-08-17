/**
 * Faculty Management — Enhanced
 * Features: live search, pagination, initials avatars, export to Excel (with field selection), bulk import, password reset, styled confirm dialog
 */
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/api';
import { Plus, Edit2, Trash2, Search, Filter, Upload, Download, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import BulkImportModal from '../../components/BulkImportModal';
import ConfirmDialog from '../../components/ConfirmDialog';
import ExportModal from '../../components/ExportModal';

const PAGE_SIZE = 10;

const Avatar = ({ name }) => {
  const initials = name ? name.replace(/^(Dr\.|Mr\.|Ms\.|Mrs\.)\s*/i, '').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : '?';
  return (
    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-navy)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
      {initials}
    </div>
  );
};

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

const designations = ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Lab Assistant', 'Other'];

const Faculty = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [assigningFaculty, setAssigningFaculty] = useState(null);
  const [assignedSubjectsTemp, setAssignedSubjectsTemp] = useState([]);
  const [confirm, setConfirm] = useState(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ department: '' });
  const [page, setPage] = useState(1);
  const [formData, setFormData] = useState({ employeeId: '', name: '', department: '', designation: '', email: '', phone: '' });

  const { data: facultyData, isLoading } = useQuery({
    queryKey: ['faculty', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.department) params.append('department', filters.department);
      const response = await apiClient.get(`/admin/faculty?${params}`);
      return response.data;
    },
  });

  const { data: subjectsData } = useQuery({
    queryKey: ['admin-subjects-list'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/subjects');
      return response.data?.data || [];
    }
  });

  // Fetch departments for dropdown
  const { data: departmentsData } = useQuery({
    queryKey: ['departments-list'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/departments');
      return response.data?.data || [];
    },
  });

  const allFaculty = facultyData?.data || [];
  const allSubjects = subjectsData || [];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q ? allFaculty.filter(f => f.name?.toLowerCase().includes(q) || f.employeeId?.toLowerCase().includes(q) || f.email?.toLowerCase().includes(q)) : allFaculty;
  }, [allFaculty, search]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const createMutation = useMutation({
    mutationFn: (data) => apiClient.post('/admin/faculty', data),
    onSuccess: () => { queryClient.invalidateQueries(['faculty']); closeModal(); toast.success('Faculty created successfully!'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to create faculty'),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.put(`/admin/faculty/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries(['faculty']); closeModal(); setAssigningFaculty(null); toast.success('Faculty updated!'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to update faculty'),
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/admin/faculty/${id}`),
    onSuccess: () => { queryClient.invalidateQueries(['faculty']); toast.success('Faculty deleted!'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to delete faculty'),
  });

  const openModal = (faculty = null) => {
    if (faculty) {
      setEditingFaculty(faculty);
      setFormData({ employeeId: faculty.employeeId, name: faculty.name, department: faculty.department, designation: faculty.designation, email: faculty.email || '', phone: faculty.phone || '' });
    } else {
      setEditingFaculty(null);
      setFormData({ employeeId: '', name: '', department: '', designation: '', email: '', phone: '' });
    }
    setIsModalOpen(true);
  };
  const closeModal = () => { setIsModalOpen(false); setEditingFaculty(null); };

  const openAssignSubjectsModal = (faculty) => {
    setAssigningFaculty(faculty);
    setAssignedSubjectsTemp(faculty.subjectsAssigned?.map(s => s._id || s) || []);
  };

  const handleSaveSubjects = () => {
    if (!assigningFaculty) return;
    const updateData = {
      name: assigningFaculty.name,
      department: assigningFaculty.department,
      designation: assigningFaculty.designation,
      email: assigningFaculty.email || '',
      phone: assigningFaculty.phone || '',
      subjectsAssigned: assignedSubjectsTemp
    };
    updateMutation.mutate({ id: assigningFaculty._id, data: updateData });
  };

  const toggleSubjectTemp = (subId) => {
    setAssignedSubjectsTemp(prev => 
      prev.includes(subId) ? prev.filter(id => id !== subId) : [...prev, subId]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingFaculty) {
      const { employeeId, ...updateData } = formData;
      if (!updateData.password || updateData.password.trim() === '') {
        delete updateData.password;
      }
      updateMutation.mutate({ id: editingFaculty._id, data: updateData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const designationStyle = (d) => {
    if (!d) return { backgroundColor: '#F3F4F6', color: '#6B7280' };
    if (d === 'Professor') return { backgroundColor: '#FEF3C7', color: '#92400E' };
    if (d === 'Associate Professor') return { backgroundColor: '#EEF2FF', color: '#1E40AF' };
    return { backgroundColor: '#ECFDF5', color: '#065F46' }; // Assistant Professor or other
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div style={{ marginBottom: '20px' }}>
          {/* ROW 1: Title + Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: 0 }}>
              Faculty
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
                <Plus size={20} /> Add Faculty
              </button>
            </div>
          </div>

          {/* ROW 2: Record count */}
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontWeight: 400, marginBottom: '16px' }}>
            {filtered.length} member{filtered.length !== 1 ? 's' : ''}{search ? ' found' : ' total'}
          </p>

          {/* ROW 3: Search + Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <input type="text" placeholder="Search by name, Employee ID or email…" value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{ flex: 1, minWidth: '200px', padding: '10px 16px', border: '1.5px solid #E0E0E0', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--color-text)', backgroundColor: 'white', outline: 'none', fontFamily: 'var(--font-body)', transition: 'border-color 200ms ease' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-gold)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,162,39,0.08)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#E0E0E0'; e.currentTarget.style.boxShadow = 'none'; }} />
            <input type="text" placeholder="Department…" value={filters.department}
              onChange={e => { setFilters({ department: e.target.value }); setPage(1); }}
              style={{ width: '180px', flexShrink: 0, padding: '10px 14px', border: '1.5px solid #E0E0E0', borderRadius: '8px', fontSize: '0.875rem', color: 'var(--color-text)', backgroundColor: 'white', outline: 'none', fontFamily: 'var(--font-body)', transition: 'border-color 200ms ease' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-gold)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#E0E0E0'; }} />
          </div>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #F0F0F0', overflow: 'hidden' }}>
          {isLoading ? (
            <div className="p-6"><LoadingSkeleton rows={5} columns={7} /></div>
          ) : paginated.length === 0 ? (
            <div className="p-12 text-center">
              <Search size={32} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[#1A1A1A] mb-1">{search ? 'No results' : 'No faculty yet'}</h3>
              <p className="text-[#5C5C5C] mb-4">{search ? `No faculty match "${search}"` : 'Add your first faculty member'}</p>
              {!search && <Button onClick={() => openModal()} variant="primary"><Plus size={18} className="inline mr-2" />Add Faculty</Button>}
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ backgroundColor: 'var(--color-navy)' }}>
                    <tr>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'white', whiteSpace: 'nowrap', borderBottom: 'none' }}>Faculty Member</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'white', whiteSpace: 'nowrap', borderBottom: 'none' }}>Employee ID</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'white', whiteSpace: 'nowrap', borderBottom: 'none' }}>Department</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'white', whiteSpace: 'nowrap', borderBottom: 'none' }}>Designation</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'white', whiteSpace: 'nowrap', borderBottom: 'none' }}>Email</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'white', whiteSpace: 'nowrap', borderBottom: 'none' }}>Phone</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'white', whiteSpace: 'nowrap', borderBottom: 'none' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((faculty) => (
                      <tr key={faculty._id} style={{ borderBottom: '1px solid #F5F5F5', transition: 'background-color 150ms ease' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F9FAFB'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                        <td className="px-6 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <Avatar name={faculty.name} />
                            <div>
                              <span className="text-sm font-semibold text-[#1A1A1A] block">{faculty.name}</span>
                              {faculty.subjectsAssigned && faculty.subjectsAssigned.length > 0 ? (
                                <div className="flex flex-wrap gap-1 mt-1 max-w-[220px]">
                                  {faculty.subjectsAssigned.map(sub => (
                                    <span key={sub._id} className="text-[9px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-100 font-mono font-medium" title={sub.subjectName}>
                                      {sub.subjectCode}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span style={{ backgroundColor: '#F3F4F6', color: '#9CA3AF', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', marginTop: '2px', display: 'inline-block' }}>No subjects assigned</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap">
                          <span className="text-xs font-mono font-semibold text-[#5B21B6] bg-purple-50 px-2 py-1 rounded-md">{faculty.employeeId}</span>
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap"><span className="text-sm text-[#5C5C5C]">{faculty.department}</span></td>
                        <td className="px-6 py-3.5 whitespace-nowrap">
                          <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600, ...designationStyle(faculty.designation) }}>{faculty.designation || '—'}</span>
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap"><span className="text-sm text-[#5C5C5C]">{faculty.email || '—'}</span></td>
                        <td className="px-6 py-3.5 whitespace-nowrap"><span className="text-sm text-[#5C5C5C]">{faculty.phone || '—'}</span></td>
                        <td style={{ padding: '14px 16px', fontSize: '0.875rem', color: 'var(--color-text)', verticalAlign: 'middle', textAlign: 'right' }}>
                          <button onClick={() => openAssignSubjectsModal(faculty)} className="text-[#C9A227] hover:text-[#B08A1E] mr-3 p-1.5 rounded-lg hover:bg-yellow-50 transition" title="Assign Subjects"><BookOpen size={15} /></button>
                          <button onClick={() => openModal(faculty)} className="text-[#1E3A5F] hover:text-[#152B45] mr-3 p-1.5 rounded-lg hover:bg-blue-50 transition"><Edit2 size={15} /></button>
                          <button onClick={() => setConfirm({ id: faculty._id, name: faculty.name })} className="text-[#B3413E] hover:text-[#9A3633] p-1.5 rounded-lg hover:bg-red-50 transition"><Trash2 size={15} /></button>
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            {/* Navy Header */}
            <div style={{ backgroundColor: 'var(--color-navy)', padding: '16px 24px', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'white', margin: 0 }}>
                {editingFaculty ? 'Edit Faculty' : 'Add New Faculty'}
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
                  {/* Row 1: Employee ID (full width) */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                      Employee ID <span style={{ color: 'var(--color-error)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.employeeId}
                      onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                      disabled={!!editingFaculty}
                      required
                      placeholder="e.g., EMP1001"
                      style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E0E0E0', borderRadius: '8px', fontSize: '0.875rem', fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-text)', backgroundColor: editingFaculty ? '#F5F5F5' : 'white', outline: 'none', transition: 'all 200ms' }}
                      onFocus={(e) => { if (!editingFaculty) { e.currentTarget.style.borderColor = 'var(--color-gold)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,162,39,0.1)'; } }}
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
                      placeholder="Faculty Full Name"
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

                  {/* Row 4: Designation (SELECT dropdown) */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                      Designation <span style={{ color: 'var(--color-error)' }}>*</span>
                    </label>
                    <select
                      value={formData.designation}
                      onChange={e => setFormData({ ...formData, designation: e.target.value })}
                      required
                      style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E0E0E0', borderRadius: '8px', fontSize: '0.875rem', color: 'var(--color-text)', backgroundColor: 'white', outline: 'none', cursor: 'pointer', transition: 'all 200ms' }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-gold)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,162,39,0.1)'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = '#E0E0E0'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      <option value="">Select Designation</option>
                      {designations.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
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
                        placeholder="faculty@college.edu"
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

                  {/* Amber Note Box (only for new faculty) */}
                  {!editingFaculty && (
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
                            Default password will be <strong>{formData.employeeId ? formData.employeeId.toUpperCase() : 'EMPLOYEEID'}@123</strong>. Faculty can change it after first login.
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
                  {editingFaculty ? 'Update Faculty' : 'Create Faculty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {assigningFaculty && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
              <h2 className="text-lg font-bold text-[#1E3A5F]">Assign Subjects</h2>
              <p className="text-xs text-gray-500">Select subjects taught by <strong className="text-gray-700">{assigningFaculty.name}</strong></p>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              {/* Filtered Subject Options */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Subject Options ({allSubjects.length}):</p>
                {allSubjects.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No subjects configured in system. Add subjects under Subjects tab first.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {allSubjects.map(sub => {
                      const isChecked = assignedSubjectsTemp.includes(sub._id);
                      const isSameDept = sub.department?.toLowerCase() === assigningFaculty.department?.toLowerCase();
                      return (
                        <label key={sub._id} className={`flex items-start gap-2.5 p-2 rounded-lg border cursor-pointer transition ${
                          isChecked 
                            ? 'bg-[#1E3A5F]/5 border-[#1E3A5F]/20 text-[#1E3A5F]' 
                            : isSameDept
                              ? 'bg-amber-50/20 border-amber-100/50 text-gray-700 hover:bg-gray-50'
                              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSubjectTemp(sub._id)}
                            className="mt-0.5 rounded text-[#1E3A5F] focus:ring-[#1E3A5F]"
                          />
                          <div className="text-xs">
                            <span className="font-mono font-bold block">{sub.subjectCode}</span>
                            <span className="block font-medium truncate max-w-[170px]" title={sub.subjectName}>{sub.subjectName}</span>
                            <span className="text-[10px] text-gray-400 block">{sub.department} - Sem {sub.semester}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-150 flex gap-3 bg-gray-50/50">
              <Button type="button" onClick={() => setAssigningFaculty(null)} variant="ghost" className="flex-1">
                Cancel
              </Button>
              <Button type="button" onClick={handleSaveSubjects} disabled={updateMutation.isPending} variant="primary" className="flex-1">
                {updateMutation.isPending ? 'Saving...' : 'Save Subject Allocations'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {isBulkModalOpen && <BulkImportModal type="faculty" onClose={() => setIsBulkModalOpen(false)} onSuccess={() => queryClient.invalidateQueries(['faculty'])} />}

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        fields={[
          { key: 'employeeId', label: 'Employee ID' },
          { key: 'name', label: 'Faculty Name' },
          { key: 'department', label: 'Department' },
          { key: 'designation', label: 'Designation' },
          { key: 'email', label: 'Email' },
          { key: 'phone', label: 'Phone' }
        ]}
        data={filtered}
        fileName="Faculty_Export"
        sheetName="Faculty"
      />

      <ConfirmDialog isOpen={!!confirm} title="Delete Faculty Member?"
        message={`Remove "${confirm?.name}" from the system? Their login account will also be deleted.`}
        confirmLabel="Delete" onConfirm={() => { deleteMutation.mutate(confirm.id); setConfirm(null); }} onCancel={() => setConfirm(null)} />
    </div>
  );
};

export default Faculty;
