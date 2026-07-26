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
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-display font-bold text-[#1A1A1A] mb-1">
                Departments
              </h1>
              <p className="text-[#5C5C5C]">
                {filtered.length} department{filtered.length !== 1 ? 's' : ''}{search ? ' found' : ' total'}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button onClick={() => setIsExportModalOpen(true)} variant="ghost" className="flex items-center gap-2 whitespace-nowrap border border-gray-300 hover:border-green-500 hover:text-green-600">
                <Download size={17} /> Export Excel
              </Button>
              <Button
                onClick={() => setIsBulkModalOpen(true)}
                variant="ghost"
                className="flex items-center gap-2 whitespace-nowrap border border-gray-300 hover:border-[#1E3A5F]"
              >
                <Upload size={18} />
                Import CSV/Excel
              </Button>
              <Button
                onClick={() => openModal()}
                variant="gold"
                className="flex items-center gap-2 whitespace-nowrap"
              >
                <Plus size={20} />
                Add Department
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
              <input
                type="text"
                placeholder="Search by code, name, or HOD..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none text-sm"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#5C5C5C] uppercase tracking-wider">
                        Code
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#5C5C5C] uppercase tracking-wider">
                        Department Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#5C5C5C] uppercase tracking-wider">
                        HOD
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-[#5C5C5C] uppercase tracking-wider">
                        Faculty
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-[#5C5C5C] uppercase tracking-wider">
                        Students
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-[#5C5C5C] uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {paginated.map((department, index) => {
                      const code = department.departmentCode;
                      return (
                        <tr
                          key={department._id}
                          className="hover:bg-gray-50 transition-colors"
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
              {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}
            </>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-bold text-[#1A1A1A]">
                {editingDepartment ? 'Edit Department' : 'Add New Department'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                  HOD User ID
                  <span className="text-[#5C5C5C] text-xs font-normal ml-1">(Optional)</span>
                </label>
                <p className="text-xs text-[#5C5C5C] mb-2">
                  Enter the MongoDB User ID of the Head of Department
                </p>
                <input
                  type="text"
                  value={formData.hodId}
                  onChange={(e) => setFormData({ ...formData, hodId: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none font-mono text-sm"
                  placeholder="User ObjectId (optional)"
                />
              </div>

              <div className="flex gap-3 pt-4">
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
