/**
 * Students Management Page - Redesigned with polished UI
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/api';
import { Plus, Edit2, Trash2, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';

const Students = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [filters, setFilters] = useState({ department: '', semester: '' });
  const [formData, setFormData] = useState({
    usn: '',
    name: '',
    department: '',
    semester: '',
    email: '',
    phone: '',
    password: '',
  });

  // Fetch students with filters
  const { data: studentsData, isLoading } = useQuery({
    queryKey: ['students', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.department) params.append('department', filters.department);
      if (filters.semester) params.append('semester', filters.semester);
      const response = await apiClient.get(`/admin/students?${params}`);
      return response.data;
    },
  });

  // Create student mutation
  const createMutation = useMutation({
    mutationFn: (data) => apiClient.post('/admin/students', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['students']);
      closeModal();
      toast.success('Student created successfully!', {
        style: { background: '#2D7A5F', color: '#fff' },
      });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create student', {
        style: { background: '#B3413E', color: '#fff' },
      });
    },
  });

  // Update student mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.put(`/admin/students/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['students']);
      closeModal();
      toast.success('Student updated successfully!', {
        style: { background: '#2D7A5F', color: '#fff' },
      });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update student', {
        style: { background: '#B3413E', color: '#fff' },
      });
    },
  });

  // Delete student mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/admin/students/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['students']);
      toast.success('Student deleted successfully!', {
        style: { background: '#2D7A5F', color: '#fff' },
      });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete student', {
        style: { background: '#B3413E', color: '#fff' },
      });
    },
  });

  const openModal = (student = null) => {
    if (student) {
      setEditingStudent(student);
      setFormData({
        usn: student.usn,
        name: student.name,
        department: student.department,
        semester: student.semester,
        email: student.email || '',
        phone: student.phone || '',
        password: '',
      });
    } else {
      setEditingStudent(null);
      setFormData({
        usn: '',
        name: '',
        department: '',
        semester: '',
        email: '',
        phone: '',
        password: '',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingStudent) {
      const { password, usn, ...updateData } = formData;
      updateMutation.mutate({ id: editingStudent._id, data: updateData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-display font-bold text-[#1A1A1A] mb-1">
                Students
              </h1>
              <p className="text-[#5C5C5C]">Manage student records and profiles</p>
            </div>
            <Button
              onClick={() => openModal()}
              variant="gold"
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <Plus size={20} />
              Add Student
            </Button>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3 text-[#5C5C5C]">
              <Filter size={18} />
              <span className="text-sm font-medium">Filters</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Filter by department..."
                  value={filters.department}
                  onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none"
                />
              </div>
              <select
                value={filters.semester}
                onChange={(e) => setFilters({ ...filters, semester: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none"
              >
                <option value="">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <option key={sem} value={sem}>
                    Semester {sem}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="p-6">
              <LoadingSkeleton rows={5} columns={6} />
            </div>
          ) : studentsData?.count === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <Search size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-[#1A1A1A] mb-1">No students found</h3>
              <p className="text-[#5C5C5C] mb-4">Get started by adding your first student</p>
              <Button onClick={() => openModal()} variant="primary">
                <Plus size={18} className="inline mr-2" />
                Add Student
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#5C5C5C] uppercase tracking-wider">
                      USN
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#5C5C5C] uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#5C5C5C] uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#5C5C5C] uppercase tracking-wider">
                      Semester
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#5C5C5C] uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#5C5C5C] uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-[#5C5C5C] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {studentsData?.data?.map((student, index) => (
                    <tr key={student._id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-[#1A1A1A]">{student.usn}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-[#1A1A1A]">{student.name}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-[#5C5C5C]">{student.department}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="navy">Semester {student.semester}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-[#5C5C5C]">{student.email || '-'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-[#5C5C5C]">{student.phone || '-'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => openModal(student)}
                          className="text-[#1E3A5F] hover:text-[#152B45] mr-3 inline-flex items-center gap-1 transition"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(student._id)}
                          className="text-[#B3413E] hover:text-[#9A3633] inline-flex items-center gap-1 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <h2 className="text-2xl font-display font-bold text-[#1A1A1A]">
                {editingStudent ? 'Edit Student' : 'Add New Student'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                  USN <span className="text-[#B3413E]">*</span>
                </label>
                <input
                  type="text"
                  value={formData.usn}
                  onChange={(e) => setFormData({ ...formData, usn: e.target.value })}
                  disabled={!!editingStudent}
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none disabled:bg-gray-100 disabled:text-gray-500"
                  placeholder="e.g., 1PE21CS001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                  Name <span className="text-[#B3413E]">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none"
                  placeholder="Full Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                  Department <span className="text-[#B3413E]">*</span>
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none"
                  placeholder="e.g., Computer Science"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                  Semester <span className="text-[#B3413E]">*</span>
                </label>
                <select
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none"
                >
                  <option value="">Select Semester</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={sem}>
                      Semester {sem}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none"
                  placeholder="student@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none"
                  placeholder="10-digit phone number"
                  pattern="[0-9]{10}"
                />
              </div>

              {!editingStudent && (
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                    Password <span className="text-[#B3413E]">*</span>
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none"
                    placeholder="Minimum 6 characters"
                  />
                </div>
              )}

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
                  {editingStudent ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
