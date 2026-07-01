/**
 * Subjects Management Page
 * CRUD operations for subject/course records
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/api';

const Subjects = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [filters, setFilters] = useState({ department: '', semester: '' });

  const [formData, setFormData] = useState({
    subjectCode: '',
    subjectName: '',
    department: '',
    semester: '',
    credits: '',
  });

  // Fetch subjects
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

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data) => apiClient.post('/admin/subjects', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['subjects']);
      closeModal();
      alert('Subject created successfully!');
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to create subject');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.put(`/admin/subjects/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['subjects']);
      closeModal();
      alert('Subject updated successfully!');
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to update subject');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/admin/subjects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['subjects']);
      alert('Subject deleted successfully!');
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to delete subject');
    },
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
      });
    } else {
      setEditingSubject(null);
      setFormData({
        subjectCode: '',
        subjectName: '',
        department: '',
        semester: '',
        credits: '',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSubject(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingSubject) {
      const { subjectCode, ...updateData } = formData;
      updateMutation.mutate({ id: editingSubject._id, data: updateData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this subject?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Subjects</h1>
            <p className="text-gray-600 mt-1">Manage course subjects</p>
          </div>
          <button
            onClick={() => openModal()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            + Add Subject
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6 flex gap-4">
          <input
            type="text"
            placeholder="Filter by department..."
            value={filters.department}
            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg flex-1"
          />
          <select
            value={filters.semester}
            onChange={(e) => setFilters({ ...filters, semester: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
              <option key={sem} value={sem}>
                Semester {sem}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Loading subjects...</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Semester
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Credits
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subjectsData?.data?.map((subject) => (
                  <tr key={subject._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {subject.subjectCode}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {subject.subjectName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {subject.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      Semester {subject.semester}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {subject.credits}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openModal(subject)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(subject._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          
          {!isLoading && subjectsData?.count === 0 && (
            <div className="p-8 text-center text-gray-500">
              No subjects found. Click "Add Subject" to create one.
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {editingSubject ? 'Edit Subject' : 'Add New Subject'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject Code *
                </label>
                <input
                  type="text"
                  value={formData.subjectCode}
                  onChange={(e) => setFormData({ ...formData, subjectCode: e.target.value })}
                  disabled={!!editingSubject}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                  placeholder="e.g., CS101"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject Name *
                </label>
                <input
                  type="text"
                  value={formData.subjectName}
                  onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., Data Structures"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department *
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., Computer Science"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Semester *
                </label>
                <select
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Credits *
                </label>
                <select
                  value={formData.credits}
                  onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Select Credits</option>
                  {[1, 2, 3, 4, 5, 6].map((credit) => (
                    <option key={credit} value={credit}>
                      {credit} Credit{credit > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
                >
                  {editingSubject ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subjects;
