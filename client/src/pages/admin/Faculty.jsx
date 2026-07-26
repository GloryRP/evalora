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
  const colors = ['#5B21B6','#1E3A5F','#9D174D','#065F46','#0E7490','#92400E','#6D28D9','#1D4ED8'];
  const color = colors[name?.charCodeAt(0) % colors.length] || colors[0];
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: color }}>
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
  const [formData, setFormData] = useState({ employeeId: '', name: '', department: '', designation: '', email: '', phone: '', password: '' });

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
      setFormData({ employeeId: faculty.employeeId, name: faculty.name, department: faculty.department, designation: faculty.designation, email: faculty.email || '', phone: faculty.phone || '', password: '' });
    } else {
      setEditingFaculty(null);
      setFormData({ employeeId: '', name: '', department: '', designation: '', email: '', phone: '', password: '' });
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

  const designationColor = (d) => {
    if (!d) return 'navy';
    if (d.includes('Professor') && !d.includes('Associate') && !d.includes('Assistant')) return 'gold';
    return 'navy';
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-display font-bold text-[#1A1A1A] mb-1">Faculty</h1>
              <p className="text-[#5C5C5C]">
                {filtered.length} member{filtered.length !== 1 ? 's' : ''}{search ? ' found' : ' total'}
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
                <Plus size={20} /> Add Faculty
              </Button>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                <input type="text" placeholder="Search by name, Employee ID or email…" value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none text-sm" />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                <input type="text" placeholder="Department…" value={filters.department}
                  onChange={e => { setFilters({ department: e.target.value }); setPage(1); }}
                  className="pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none text-sm" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#5C5C5C] uppercase tracking-wider">Faculty Member</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#5C5C5C] uppercase tracking-wider">Employee ID</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#5C5C5C] uppercase tracking-wider">Department</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#5C5C5C] uppercase tracking-wider">Designation</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#5C5C5C] uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#5C5C5C] uppercase tracking-wider">Phone</th>
                      <th className="px-6 py-3.5 text-right text-xs font-semibold text-[#5C5C5C] uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {paginated.map((faculty) => (
                      <tr key={faculty._id} className="hover:bg-gray-50 transition-colors">
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
                                <span className="text-[10px] text-gray-400 mt-0.5 block">No subjects assigned</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap">
                          <span className="text-xs font-mono font-semibold text-[#5B21B6] bg-purple-50 px-2 py-1 rounded-md">{faculty.employeeId}</span>
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap"><span className="text-sm text-[#5C5C5C]">{faculty.department}</span></td>
                        <td className="px-6 py-3.5 whitespace-nowrap"><Badge variant={designationColor(faculty.designation)}>{faculty.designation}</Badge></td>
                        <td className="px-6 py-3.5 whitespace-nowrap"><span className="text-sm text-[#5C5C5C]">{faculty.email || '—'}</span></td>
                        <td className="px-6 py-3.5 whitespace-nowrap"><span className="text-sm text-[#5C5C5C]">{faculty.phone || '—'}</span></td>
                        <td className="px-6 py-3.5 whitespace-nowrap text-right">
                          <button onClick={() => openAssignSubjectsModal(faculty)} className="text-[#C9A227] hover:text-[#B08A1E] mr-3 p-1.5 rounded-lg hover:bg-yellow-50 transition" title="Assign Subjects"><BookOpen size={15} /></button>
                          <button onClick={() => openModal(faculty)} className="text-[#1E3A5F] hover:text-[#152B45] mr-3 p-1.5 rounded-lg hover:bg-blue-50 transition"><Edit2 size={15} /></button>
                          <button onClick={() => setConfirm({ id: faculty._id, name: faculty.name })} className="text-[#B3413E] hover:text-[#9A3633] p-1.5 rounded-lg hover:bg-red-50 transition"><Trash2 size={15} /></button>
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-bold text-[#1A1A1A]">{editingFaculty ? 'Edit Faculty' : 'Add New Faculty'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {[{ label: 'Employee ID', key: 'employeeId', placeholder: 'EMP1001', disabled: !!editingFaculty, required: true },
                { label: 'Full Name', key: 'name', placeholder: 'Full Name', required: true },
                { label: 'Department', key: 'department', placeholder: 'e.g., Computer Science', required: true },
                { label: 'Email', key: 'email', placeholder: 'faculty@college.edu', type: 'email' },
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
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Designation <span className="text-[#B3413E]">*</span></label>
                <select value={formData.designation} onChange={e => setFormData({ ...formData, designation: e.target.value })} required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none text-sm">
                  <option value="">Select Designation</option>
                  {designations.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                  {editingFaculty ? 'New Password' : 'Password'} {!editingFaculty && <span className="text-[#B3413E]">*</span>}
                </label>
                <input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
                  required={!editingFaculty} minLength={6} placeholder={editingFaculty ? 'Leave blank to keep current password' : 'Minimum 6 characters'}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none text-sm" />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" onClick={closeModal} variant="ghost" className="flex-1">Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} variant="primary" className="flex-1">
                  {editingFaculty ? 'Update' : 'Create'}
                </Button>
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
