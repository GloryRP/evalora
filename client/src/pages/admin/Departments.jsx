/**
 * Departments Management Page - Enhanced
 * Features: Live search, pagination, stats counts (students & faculty), Excel export (with field selection), styled confirm dialog
 */
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/api';
import { Plus, Edit2, Trash2, Building2, Search, Upload, Download, Users, GraduationCap, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import BulkImportModal from '../../components/BulkImportModal';
import ConfirmDialog from '../../components/ConfirmDialog';
import ExportModal from '../../components/ExportModal';

const PAGE_SIZE = 10;

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

const Departments = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [formData, setFormData] = useState({
    departmentName: '',
    departmentCode: '',
    hodId: '',
  });

  // Fetch departments
  const { data: departmentsData, isLoading: isDeptsLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/departments');
      return response.data;
    },
  });

  // Fetch stats to get student & faculty counts per dept
  const { data: statsData } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/stats');
      return response.data.data;
    },
    staleTime: 30000,
  });

  // Fetch HOD users
  const { data: hodUsers } = useQuery({
    queryKey: ['hodUsers'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/users?role=hod');
      return response.data.data || [];
    },
  });

  const allDepartments = departmentsData?.data || [];
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return q
      ? allDepartments.filter(
          (d) =>
            d.departmentName?.toLowerCase().includes(q) ||
            d.departmentCode?.toLowerCase().includes(q) ||
            d.hodId?.name?.toLowerCase()?.includes(q)
        )
      : allDepartments;
  }, [allDepartments, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Helper lookups for counts
  const getStudentCount = (code) => {
    return statsData?.studentsByDepartment?.find((d) => d.department === code)?.count || 0;
  };

  const getFacultyCount = (code) => {
    return statsData?.facultyByDept?.find((f) => f._id === code)?.count || 0;
  };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data) => apiClient.post('/admin/departments', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['departments']);
      queryClient.invalidateQueries(['adminStats']);
      closeModal();
      toast.success('Department created successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create department');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.put(`/admin/departments/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['departments']);
      queryClient.invalidateQueries(['adminStats']);
      closeModal();
      toast.success('Department updated successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update department');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/admin/departments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['departments']);
      queryClient.invalidateQueries(['adminStats']);
      toast.success('Department deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete department');
    },
  });

  const openModal = (department = null) => {
    if (department) {
      setEditingDepartment(department);
      setFormData({
        departmentName: department.departmentName,
        departmentCode: department.departmentCode,
        hodId: department.hodId?._id || '',
      });
    } else {
      setEditingDepartment(null);
      setFormData({
        departmentName: '',
        departmentCode: '',
        hodId: '',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDepartment(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingDepartment) {
      const { departmentCode, ...updateData } = formData;
      updateMutation.mutate({ id: editingDepartment._id, data: updateData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div style={{ marginBottom: '20px' }}>
          {/* ROW 1: Title + Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: 0 }}>
              Departments
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button onClick={() => setIsExportModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', backgroundColor: 'white', color: 'var(--color-text)', border: '1.5px solid #E0E0E0', borderRadius: '6px', fontSize: '0.825rem', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 150ms ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-navy)'; e.currentTarget.style.color = 'var(--color-navy)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E0E0E0'; e.currentTarget.style.color = 'var(--color-text)'; }}>
                <Download size={17} /> Export Excel
              </button>
              <button
                onClick={() => setIsBulkModalOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', backgroundColor: 'white', color: 'var(--color-text)', border: '1.5px solid #E0E0E0', borderRadius: '6px', fontSize: '0.825rem', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 150ms ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-navy)'; e.currentTarget.style.color = 'var(--color-navy)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E0E0E0'; e.currentTarget.style.color = 'var(--color-text)'; }}
              >
                <Upload size={18} />
                Import CSV/Excel
              </button>
              <button
                onClick={() => openModal()}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', backgroundColor: 'var(--color-gold)', color: 'var(--color-navy)', border: 'none', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 150ms ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#B8911F'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-gold)'; }}
              >
                <Plus size={20} />
                Add Department
              </button>
            </div>
          </div>

          {/* ROW 2: Record count */}
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontWeight: 400, marginBottom: '16px' }}>
            {filtered.length} department{filtered.length !== 1 ? 's' : ''}{search ? ' found' : ' total'}
          </p>

          {/* ROW 3: Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search by code, name, or HOD..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ flex: 1, minWidth: '200px', padding: '10px 16px', border: '1.5px solid #E0E0E0', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--color-text)', backgroundColor: 'white', outline: 'none', fontFamily: 'var(--font-body)', transition: 'border-color 200ms ease' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-gold)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,162,39,0.08)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#E0E0E0'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #F0F0F0', overflow: 'hidden' }}>
          {isDeptsLoading ? (
            <div className="p-6">
              <LoadingSkeleton rows={5} columns={6} />
            </div>
          ) : paginated.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <Building2 size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-[#1A1A1A] mb-1">
                {search ? 'No results found' : 'No departments found'}
              </h3>
              <p className="text-[#5C5C5C] mb-4">
                {search ? `No departments match "${search}"` : 'Get started by adding your first department'}
              </p>
              {!search && (
                <Button onClick={() => openModal()} variant="primary">
                  <Plus size={18} className="inline mr-2" />
                  Add Department
                </Button>
              )}
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ backgroundColor: 'var(--color-navy)' }}>
                    <tr>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'white', whiteSpace: 'nowrap', borderBottom: 'none' }}>
                        Code
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'white', whiteSpace: 'nowrap', borderBottom: 'none' }}>
                        Department Name
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'white', whiteSpace: 'nowrap', borderBottom: 'none' }}>
                        HOD
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'white', whiteSpace: 'nowrap', borderBottom: 'none' }}>
                        Faculty
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'white', whiteSpace: 'nowrap', borderBottom: 'none' }}>
                        Students
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'white', whiteSpace: 'nowrap', borderBottom: 'none' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((department, index) => {
                      const code = department.departmentCode;
                      return (
                        <tr
                          key={department._id}
                          style={{ borderBottom: '1px solid #F5F5F5', transition: 'background-color 150ms ease' }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F9FAFB'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-xs font-mono font-bold text-[#1E3A5F] bg-blue-50 px-2.5 py-1 rounded-md">
                              {code}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                                <Building2 size={13} className="text-[#C9A227]" />
                              </div>
                              <span className="text-sm font-semibold text-[#1A1A1A]">{department.departmentName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {department.hodId?.name ? (
                              <span className="text-sm text-[#5C5C5C] font-medium">{department.hodId.name}</span>
                            ) : (
                              <span className="text-sm text-gray-400 italic">Not Assigned</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#5B21B6] bg-purple-50 px-2.5 py-1 rounded-full">
                              <Users size={12} />
                              {getFacultyCount(code)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#065F46] bg-emerald-50 px-2.5 py-1 rounded-full">
                              <GraduationCap size={12} />
                              {getStudentCount(code)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <button
                              onClick={() => openModal(department)}
                              className="text-[#1E3A5F] hover:text-[#152B45] mr-3 p-1.5 rounded-lg hover:bg-blue-50 transition"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => setConfirm({ id: department._id, name: department.departmentName })}
                              className="text-[#B3413E] hover:text-[#9A3633] p-1.5 rounded-lg hover:bg-red-50 transition"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            {/* Navy Header */}
            <div style={{ backgroundColor: 'var(--color-navy)', padding: '16px 24px', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'white', margin: 0 }}>
                {editingDepartment ? 'Edit Department' : 'Add New Department'}
              </h2>
              <button onClick={closeModal} type="button" style={{ color: 'white', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', opacity: 0.8, transition: 'opacity 150ms' }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                  Department Code <span className="text-[#B3413E]">*</span>
                </label>
                <input
                  type="text"
                  value={formData.departmentCode}
                  onChange={(e) => setFormData({ ...formData, departmentCode: e.target.value })}
                  disabled={!!editingDepartment}
                  required
                  autoFocus={!editingDepartment}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none disabled:bg-gray-100 disabled:text-gray-500 font-mono uppercase text-sm"
                  placeholder="e.g., CSE"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                  Department Name <span className="text-[#B3413E]">*</span>
                </label>
                <input
                  type="text"
                  value={formData.departmentName}
                  onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none text-sm"
                  placeholder="e.g., Computer Science and Engineering"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                  Head of Department
                  <span className="text-[#5C5C5C] text-xs font-normal ml-1">(Optional)</span>
                </label>
                <select
                  value={formData.hodId}
                  onChange={(e) => setFormData({ ...formData, hodId: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none text-sm bg-white"
                >
                  <option value="">-- No HOD Assigned --</option>
                  {hodUsers?.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.username})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-[#5C5C5C] mt-1.5">
                  Select a user with HOD role to assign as department head
                </p>
              </div>

              </div>

              {/* Sticky Footer */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid #E0E0E0', display: 'flex', gap: '12px', flexShrink: 0 }}>
                <Button
                  type="button"
                  onClick={closeModal}
                  variant="ghost"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  variant="primary"
                  className="flex-1"
                >
                  {editingDepartment ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {isBulkModalOpen && (
        <BulkImportModal
          type="departments"
          onClose={() => setIsBulkModalOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries(['departments']);
            queryClient.invalidateQueries(['adminStats']);
          }}
        />
      )}

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        fields={[
          { key: 'departmentCode', label: 'Code' },
          { key: 'departmentName', label: 'Department Name' },
          { key: 'hodId', label: 'HOD Name', valueMap: (d) => d.hodId?.name || 'Not Assigned' },
          { key: 'facultyCount', label: 'Faculty Count', valueMap: (d) => getFacultyCount(d.departmentCode) },
          { key: 'studentCount', label: 'Student Count', valueMap: (d) => getStudentCount(d.departmentCode) }
        ]}
        data={filtered}
        fileName="Departments_Export"
        sheetName="Departments"
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!confirm}
        title="Delete Department?"
        message={`Are you sure you want to delete "${confirm?.name}"? This action cannot be undone and may affect associated courses and students.`}
        confirmLabel="Delete Department"
        onConfirm={() => {
          deleteMutation.mutate(confirm.id);
          setConfirm(null);
        }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
};

export default Departments;
