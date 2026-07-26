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
    subjectType: 'theory',
    examConfig: {
      theoryInternals: 2,
      theoryExternal: true,
      labInternals: 0,
      labExternal: false
    }
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

  const handleTypeChange = (type) => {
    let defaults = { theoryInternals: 2, theoryExternal: true, labInternals: 0, labExternal: false };
    if (type === 'lab') {
      defaults = { theoryInternals: 0, theoryExternal: false, labInternals: 2, labExternal: true };
    } else if (type === 'integrated') {
      defaults = { theoryInternals: 2, theoryExternal: true, labInternals: 2, labExternal: true };
    }
    setFormData(prev => ({
      ...prev,
      subjectType: type,
      examConfig: defaults
    }));
  };

  const openModal = (subject = null) => {
    if (subject) {
      setEditingSubject(subject);
      setFormData({
        subjectCode: subject.subjectCode,
        subjectName: subject.subjectName,
        department: subject.department,
        semester: subject.semester,
        credits: subject.credits,
        subjectType: subject.subjectType || 'theory',
        examConfig: subject.examConfig || {
          theoryInternals: 2,
          theoryExternal: true,
          labInternals: 0,
          labExternal: false
        }
      });
    } else {
      setEditingSubject(null);
      setFormData({
        subjectCode: '',
        subjectName: '',
        department: '',
        semester: '',
        credits: '',
        subjectType: 'theory',
        examConfig: {
          theoryInternals: 2,
          theoryExternal: true,
          labInternals: 0,
          labExternal: false
        }
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
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-display font-bold text-[#1A1A1A] mb-1">Subjects</h1>
              <p className="text-[#5C5C5C]">{filtered.length} subject{filtered.length !== 1 ? 's' : ''}{search ? ' found' : ' total'}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button onClick={() => setIsExportModalOpen(true)} variant="ghost" className="flex items-center gap-2 whitespace-nowrap border border-gray-300 hover:border-green-500 hover:text-green-600">
                <Download size={17} /> Export Excel
              </Button>
              <Button onClick={() => setIsBulkModalOpen(true)} variant="ghost" className="flex items-center gap-2 whitespace-nowrap border border-gray-300 hover:border-[#1E3A5F]">
                <Upload size={17} /> Import CSV/Excel
              </Button>
              <Button onClick={() => openModal()} variant="gold" className="flex items-center gap-2 whitespace-nowrap">
                <Plus size={20} /> Add Subject
              </Button>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                <input type="text" placeholder="Search by subject name, code or department…" value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none text-sm" />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                <input type="text" placeholder="Department…" value={filters.department}
                  onChange={e => { setFilters({ ...filters, department: e.target.value }); setPage(1); }}
                  className="pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none text-sm" />
              </div>
              <select value={filters.semester} onChange={e => { setFilters({ ...filters, semester: e.target.value }); setPage(1); }}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none text-sm">
                <option value="">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#5C5C5C] uppercase tracking-wider">Subject Code</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#5C5C5C] uppercase tracking-wider">Subject Name</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#5C5C5C] uppercase tracking-wider">Department</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#5C5C5C] uppercase tracking-wider">Semester</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#5C5C5C] uppercase tracking-wider">Type & Config</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#5C5C5C] uppercase tracking-wider">Credits</th>
                      <th className="px-6 py-3.5 text-right text-xs font-semibold text-[#5C5C5C] uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {paginated.map((subject) => (
                      <tr key={subject._id} className="hover:bg-gray-50 transition-colors">
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
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-semibold capitalize text-[#1A1A1A]">{subject.subjectType || 'theory'}</span>
                            <span className="text-[10px] text-[#5C5C5C] font-mono">
                              {subject.subjectType === 'lab' ? (
                                `Lab: ${subject.examConfig?.labInternals || 0}I + ${subject.examConfig?.labExternal ? 'E' : 'NoE'}`
                              ) : subject.subjectType === 'integrated' ? (
                                `Th: ${subject.examConfig?.theoryInternals || 0}I+${subject.examConfig?.theoryExternal ? 'E' : 'NoE'} | Lb: ${subject.examConfig?.labInternals || 0}I+${subject.examConfig?.labExternal ? 'E' : 'NoE'}`
                              ) : (
                                `Th: ${subject.examConfig?.theoryInternals || 0}I + ${subject.examConfig?.theoryExternal ? 'E' : 'NoE'}`
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
                            style={{ background: `${creditColors[subject.credits] || '#6B7280'}18`, color: creditColors[subject.credits] || '#6B7280' }}>
                            {subject.credits} cr
                          </span>
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
              {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}
            </>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-bold text-[#1A1A1A]">{editingSubject ? 'Edit Subject' : 'Add New Subject'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Subject Code <span className="text-[#B3413E]">*</span></label>
                <input type="text" value={formData.subjectCode} onChange={e => setFormData({ ...formData, subjectCode: e.target.value })}
                  disabled={!!editingSubject} required placeholder="e.g., CS601"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none disabled:bg-gray-100 font-mono text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Subject Name <span className="text-[#B3413E]">*</span></label>
                <input type="text" value={formData.subjectName} onChange={e => setFormData({ ...formData, subjectName: e.target.value })}
                  required placeholder="e.g., Machine Learning"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Department <span className="text-[#B3413E]">*</span></label>
                <input type="text" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })}
                  required placeholder="e.g., Computer Science"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Semester <span className="text-[#B3413E]">*</span></label>
                  <select value={formData.semester} onChange={e => setFormData({ ...formData, semester: e.target.value })} required
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none text-sm">
                    <option value="">Select</option>
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Credits <span className="text-[#B3413E]">*</span></label>
                  <select value={formData.credits} onChange={e => setFormData({ ...formData, credits: e.target.value })} required
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none text-sm">
                    <option value="">Select</option>
                    {[1,2,3,4,5,6].map(c => <option key={c} value={c}>{c} Credit{c > 1 ? 's' : ''}</option>)}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Subject Type <span className="text-[#B3413E]">*</span></label>
                <select value={formData.subjectType} onChange={e => handleTypeChange(e.target.value)} required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none text-sm">
                  <option value="theory">Theory Only</option>
                  <option value="lab">Lab Only</option>
                  <option value="integrated">Integrated (Theory + Lab)</option>
                </select>
              </div>

              {/* Exam Config Panel */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#5C5C5C]">Exam Configuration</h4>
                
                {formData.subjectType !== 'lab' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-[#1A1A1A]">Theory Internals Count</label>
                      <select value={formData.examConfig?.theoryInternals ?? 2}
                        onChange={e => setFormData({ ...formData, examConfig: { ...formData.examConfig, theoryInternals: parseInt(e.target.value) } })}
                        className="px-2 py-1 border border-gray-300 rounded-md text-xs">
                        <option value={0}>0</option>
                        <option value={1}>1</option>
                        <option value={2}>2</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-[#1A1A1A]">Theory External Exam</label>
                      <input type="checkbox" checked={formData.examConfig?.theoryExternal ?? true}
                        onChange={e => setFormData({ ...formData, examConfig: { ...formData.examConfig, theoryExternal: e.target.checked } })}
                        className="rounded border-gray-300 text-[#1E3A5F] focus:ring-[#C9A227] h-4 w-4" />
                    </div>
                  </div>
                )}

                {formData.subjectType !== 'theory' && (
                  <div className="space-y-3 pt-2 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-[#1A1A1A]">Lab Internals Count</label>
                      <select value={formData.examConfig?.labInternals ?? 0}
                        onChange={e => setFormData({ ...formData, examConfig: { ...formData.examConfig, labInternals: parseInt(e.target.value) } })}
                        className="px-2 py-1 border border-gray-300 rounded-md text-xs">
                        <option value={0}>0</option>
                        <option value={1}>1</option>
                        <option value={2}>2</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-[#1A1A1A]">Lab External Exam</label>
                      <input type="checkbox" checked={formData.examConfig?.labExternal ?? false}
                        onChange={e => setFormData({ ...formData, examConfig: { ...formData.examConfig, labExternal: e.target.checked } })}
                        className="rounded border-gray-300 text-[#1E3A5F] focus:ring-[#C9A227] h-4 w-4" />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" onClick={closeModal} variant="ghost" className="flex-1">Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} variant="primary" className="flex-1">
                  {editingSubject ? 'Update' : 'Create'}
                </Button>
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
