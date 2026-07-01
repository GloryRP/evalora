/**
 * Departments Management Page
 * CRUD operations for department records
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/api';

const Departments = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);

  const [formData, setFormData] = useState({
    departmentName: '',
    departmentCode: '',
    hodId: '',
  });

  // Fetch departments
  const { data: departmentsData, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/departments');
      return response.data;
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data) => apiClient.post('/admin/departments', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['departments']);
      closeModal();
      alert('Department created successfully!');
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to create department');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.put(`/admin/departments/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['departments']);
      closeModal();
      alert('Department updated successfully!');
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to update department');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/admin/departments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['departments']);
      alert('Department deleted successfully!');
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to delete department');
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

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Departments</h1>
            <p className="text-gray-600 mt-1">Manage academic departments</p>
          </div>
          <button
            onClick={() => openModal()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            + Add Department
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Loading departments...</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    HOD
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {departmentsData?.data?.map((department) => (
                  <tr key={department._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {department.departmentCode}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {department.departmentName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {department.hodId?.name || 'Not Assigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openModal(department)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(department._id)}
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
          
          {!isLoading && departmentsData?.count === 0 && (
            <div className="p-8 text-center text-gray-500">
              No departments found. Click "Add Department" to create one.
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {editingDepartment ? 'Edit Department' : 'Add New Department'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department Code *
                </label>
                <input
                  type="text"
                  value={formData.departmentCode}
                  onChange={(e) => setFormData({ ...formData, departmentCode: e.target.value })}
                  disabled={!!editingDepartment}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                  placeholder="e.g., CSE"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department Name *
                </label>
                <input
                  type="text"
                  value={formData.departmentName}
                  onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., Computer Science and Engineering"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  HOD (Optional)
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Note: HOD assignment functionality will be enhanced in future phases
                </p>
                <input
                  type="text"
                  value={formData.hodId}
                  onChange={(e) => setFormData({ ...formData, hodId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="User ID (optional)"
                />
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
                  {editingDepartment ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;
