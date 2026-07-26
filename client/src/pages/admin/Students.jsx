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
  const colors = ['#1E3A5F','#5B21B6','#065F46','#92400E','#0E7490','#9D174D','#1D4ED8','#6D28D9'];
  const color = colors[name?.charCodeAt(0) % colors.length] || colors[0];
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: color }}>
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
  const [formData, setFormData] = useState({ usn: '', name: '', department: '', semester: '', email: '', phone: '', password: '', batch: '' });

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
      setFormData({ usn: student.usn, name: student.name, department: student.department, semester: student.semester, email: student.email || '', phone: student.phone || '', password: '', batch: student.batch || '' });
    } else {
      setEditingStudent(null);
      setFormData({ usn: '', name: '', department: '', semester: '', email: '', phone: '', password: '', batch: '' });
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
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-display font-bold text-[#1A1A1A] mb-1">Students</h1>
              <p className="text-[#5C5C5C]">
                {filtered.length} student{filtered.length !== 1 ? 's' : ''}{search ? ' found' : ' total'}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button onClick={() => setIsExportModalOpen(true)} variant="ghost" className="flex items-center gap-2 whitespace-nowrap border border-gray-300 hover:border-green-500 hover:text-green-600">
                <Download size={17} /> Export Excel
              </Button>
              <Button onClick={() => setIsBulkModalOpen(true)} variant="ghost" className="flex items-center gap-2 whitespace-nowrap border border-gray-300 hover:border-[#1E3A5F]">
                <Upload size={17} /> Import CSV/Excel
              </Button>
              <Button onClick={() => openModal()} variant="gold" className="flex items-center gap-2 whitespace-nowrap">
                <Plus size={20} /> Add Student
              </Button>
            </div>
          </div>

          {/* Search + Filters */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                <input type="text" placeholder="Search by name, USN or email…" value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none text-sm" />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                <input type="text" placeholder="Department…" value={filters.department}
                  onChange={e => { setFilters({ ...filters, department: e.target.value }); setPage(1); }}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none text-sm" />
              </div>
              <select value={filters.batch} onChange={e => { setFilters({ ...filters, batch: e.target.value }); setPage(1); }}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none text-sm">
                <option value="">All Batches</option>
                {['2020-2024', '2021-2025', '2022-2026', '2023-2027', '2024-2028', '2025-2029'].map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              <select value={filters.semester} onChange={e => { setFilters({ ...filters, semester: e.target.value }); setPage(1); }}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none text-sm">
                <option value="">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => <option key={sem} value={sem}>Semester {sem}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#5C5C5C] uppercase tracking-wider">Student</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#5C5C5C] uppercase tracking-wider">USN</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#5C5C5C] uppercase tracking-wider">Department</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#5C5C5C] uppercase tracking-wider">Batch</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#5C5C5C] uppercase tracking-wider">Semester</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#5C5C5C] uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#5C5C5C] uppercase tracking-wider">Phone</th>
                      <th className="px-6 py-3.5 text-right text-xs font-semibold text-[#5C5C5C] uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {paginated.map((student) => (
                      <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <Avatar name={student.name} />
                            <span className="text-sm font-semibold text-[#1A1A1A]">{student.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap">
                          <span className="text-xs font-mono font-semibold text-[#1E3A5F] bg-blue-50 px-2 py-1 rounded-md">{student.usn}</span>
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap"><span className="text-sm text-[#5C5C5C]">{student.department}</span></td>
                        <td className="px-6 py-3.5 whitespace-nowrap"><span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{student.batch || '—'}</span></td>
                        <td className="px-6 py-3.5 whitespace-nowrap"><Badge variant="navy">Sem {student.semester}</Badge></td>
                        <td className="px-6 py-3.5 whitespace-nowrap"><span className="text-sm text-[#5C5C5C]">{student.email || '—'}</span></td>
                        <td className="px-6 py-3.5 whitespace-nowrap"><span className="text-sm text-[#5C5C5C]">{student.phone || '—'}</span></td>
                        <td className="px-6 py-3.5 whitespace-nowrap text-right">
                          <button onClick={() => openModal(student)} className="text-[#1E3A5F] hover:text-[#152B45] mr-3 p-1.5 rounded-lg hover:bg-blue-50 transition"><Edit2 size={15} /></button>
                          <button onClick={() => setConfirm({ id: student._id, name: student.name })} className="text-[#B3413E] hover:text-[#9A3633] p-1.5 rounded-lg hover:bg-red-50 transition"><Trash2 size={15} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}
            </>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-bold text-[#1A1A1A]">{editingStudent ? 'Edit Student' : 'Add New Student'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {[{ label: 'USN', key: 'usn', placeholder: '1PE21CS001', disabled: !!editingStudent, required: true },
                { label: 'Full Name', key: 'name', placeholder: 'Full Name', required: true },
                { label: 'Department', key: 'department', placeholder: 'e.g., Computer Science', required: true },
                { label: 'Email', key: 'email', placeholder: 'student@college.edu', type: 'email' },
                { label: 'Phone', key: 'phone', placeholder: '10-digit number', type: 'tel' },
              ].map(({ label, key, placeholder, disabled, required, type = 'text' }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">{label}{required && <span className="text-[#B3413E] ml-1">*</span>}</label>
                  <input type={type} value={formData[key]} onChange={e => setFormData({ ...formData, [key]: e.target.value })}
                    disabled={disabled} required={required} placeholder={placeholder}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none disabled:bg-gray-100 text-sm" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Semester <span className="text-[#B3413E]">*</span></label>
                <select value={formData.semester} onChange={e => setFormData({ ...formData, semester: e.target.value })} required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none text-sm">
                  <option value="">Select Semester</option>
                  {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Batch <span className="text-gray-400 font-normal text-xs">(e.g., 2023-2027)</span></label>
                <input type="text" value={formData.batch} onChange={e => setFormData({ ...formData, batch: e.target.value })}
                  placeholder="Derived from USN if left blank"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                  {editingStudent ? 'New Password' : 'Password'} {!editingStudent && <span className="text-[#B3413E]">*</span>}
                </label>
                <input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
                  required={!editingStudent} minLength={6} placeholder={editingStudent ? 'Leave blank to keep current password' : 'Minimum 6 characters'}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none text-sm" />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" onClick={closeModal} variant="ghost" className="flex-1">Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} variant="primary" className="flex-1">
                  {editingStudent ? 'Update' : 'Create'}
                </Button>
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
