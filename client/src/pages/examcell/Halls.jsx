/**
 * Halls Management Page — Enhanced
 * CRUD operations for exam halls with search, pagination, excel export, and styled warnings.
 * Restricted to admins for write/edit operations; view-only for exam cell.
 */
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { Plus, Edit2, Trash2, Search, Building2, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import ConfirmDialog from '../../components/ConfirmDialog';
import ExportModal from '../../components/ExportModal';
import { useAuth } from '../../contexts/AuthContext';

const PAGE_SIZE = 9;

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

const Halls = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [editingHall, setEditingHall] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [formData, setFormData] = useState({
    hallName: '',
    capacity: '',
    building: '',
    floor: '',
    facilities: '',
  });

  const isAdmin = user?.role === 'admin';

  // Query to fetch halls
  const { data: hallsData, isLoading } = useQuery({
    queryKey: ['halls'],
    queryFn: async () => {
      const response = await api.get('/examcell/halls');
      return response.data.data;
    },
  });

  const allHalls = hallsData || [];
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return q ? allHalls.filter(h => 
      h.hallName?.toLowerCase().includes(q) || 
      h.building?.toLowerCase().includes(q) ||
      h.facilities?.some(f => f.toLowerCase().includes(q))
    ) : allHalls;
  }, [allHalls, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => api.post('/examcell/halls', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['halls']);
      closeModal();
      toast.success('Exam hall created successfully!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create hall'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/examcell/halls/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['halls']);
      closeModal();
      toast.success('Exam hall updated successfully!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update hall'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/examcell/halls/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['halls']);
      toast.success('Exam hall deleted successfully!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete hall'),
  });

  const handleEdit = (hall) => {
    setEditingHall(hall);
    setFormData({
      hallName: hall.hallName,
      capacity: hall.capacity,
      building: hall.building || '',
      floor: hall.floor || '',
      facilities: hall.facilities?.join(', ') || '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingHall(null);
    setFormData({ hallName: '', capacity: '', building: '', floor: '', facilities: '' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSend = {
      ...formData,
      facilities: formData.facilities.split(',').map(f => f.trim()).filter(Boolean),
    };

    if (editingHall) {
      updateMutation.mutate({ id: editingHall._id, data: dataToSend });
    } else {
      createMutation.mutate(dataToSend);
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
                Halls
              </h1>
              <p className="text-[#5C5C5C]">
                {filtered.length} exam classroom{filtered.length !== 1 ? 's' : ''}{search ? ' found' : ' total'}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button onClick={() => setIsExportModalOpen(true)} variant="ghost" className="flex items-center gap-2 whitespace-nowrap border border-gray-300 hover:border-green-500 hover:text-green-600">
                <Download size={17} /> Export Excel
              </Button>
              {isAdmin && (
                <Button onClick={() => { setEditingHall(null); setShowModal(true); }} variant="gold" className="flex items-center gap-2 whitespace-nowrap">
                  <Plus size={20} /> Add Hall
                </Button>
              )}
            </div>
          </div>

          {/* Search bar */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
              <input type="text" placeholder="Search halls by name, building, floor or resources…" value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none text-sm" />
            </div>
          </div>
        </div>

        {/* Grid Content */}
        {isLoading ? (
          <div className="p-6"><LoadingSkeleton rows={5} columns={4} /></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 bg-white rounded-xl border border-gray-100 text-center">
            <Building2 size={36} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#1A1A1A] mb-1">{search ? 'No matches' : 'No halls configured'}</h3>
            <p className="text-[#5C5C5C] mb-4">{search ? `No classrooms match "${search}"` : 'Get started by creating your first exam hall layout'}</p>
            {!search && isAdmin && <Button onClick={() => setShowModal(true)} variant="primary"><Plus size={18} className="inline mr-2" />Add Hall</Button>}
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {paginated.map((hall) => (
                <div key={hall._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between hover:shadow-md transition group relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-[#1E3A5F] group-hover:bg-[#C9A227] transition" />
                  
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-display font-bold text-lg text-[#1A1A1A] group-hover:text-[#1E3A5F] transition">{hall.hallName}</h3>
                        <p className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded mt-1 inline-block uppercase tracking-wider">{hall.building || 'Main Block'}</p>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => handleEdit(hall)} className="text-gray-400 hover:text-[#1E3A5F] p-1.5 rounded-lg hover:bg-blue-50 transition"><Edit2 size={14} /></button>
                          <button onClick={() => setConfirm({ id: hall._id, name: hall.hallName })} className="text-gray-400 hover:text-[#B3413E] p-1.5 rounded-lg hover:bg-red-50 transition"><Trash2 size={14} /></button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-xl mb-4 border border-gray-100">
                      <div>
                        <span className="text-2xl font-black text-[#1E3A5F] tracking-tight">{hall.capacity}</span>
                        <div className="text-[10px] font-bold text-[#5C5C5C] uppercase tracking-wider mt-0.5">Seating Cap</div>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-[#1A1A1A] block mt-1">{hall.floor || 'Ground'}</span>
                        <div className="text-[10px] font-bold text-[#5C5C5C] uppercase tracking-wider mt-0.5">Location</div>
                      </div>
                    </div>
                  </div>

                  {hall.facilities && hall.facilities.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-100">
                      {hall.facilities.map((fac, i) => (
                        <span key={i} className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{fac}</span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] text-gray-400 italic pt-2 border-t border-gray-100">No special resources listed</div>
                  )}
                </div>
              ))}
            </div>
            {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && isAdmin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-bold text-[#1A1A1A]">
                {editingHall ? 'Edit Exam Hall' : 'Add New Exam Hall'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Hall Name <span className="text-[#B3413E]">*</span></label>
                <input type="text" value={formData.hallName} onChange={e => setFormData({ ...formData, hallName: e.target.value })} required
                  placeholder="e.g., Hall A, Lab 1" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none text-sm" />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Seating Capacity <span className="text-[#B3413E]">*</span></label>
                <input type="number" value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: e.target.value })} required min="1"
                  placeholder="Total seats" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none text-sm" />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Building (Optional)</label>
                <input type="text" value={formData.building} onChange={e => setFormData({ ...formData, building: e.target.value })}
                  placeholder="e.g., Main Block, IT Block" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none text-sm" />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Floor (Optional)</label>
                <input type="text" value={formData.floor} onChange={e => setFormData({ ...formData, floor: e.target.value })}
                  placeholder="e.g., Ground Floor, 2nd Floor" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none text-sm" />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Facilities / Resources (Optional)</label>
                <input type="text" value={formData.facilities} onChange={e => setFormData({ ...formData, facilities: e.target.value })}
                  placeholder="Comma-separated: AC, Projector, CCTV" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none text-sm" />
                <p className="text-[11px] text-[#5C5C5C] mt-1.5">Separate multiple facilities with commas.</p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" onClick={closeModal} variant="ghost" className="flex-1">Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} variant="primary" className="flex-1">
                  {editingHall ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        fields={[
          { key: 'hallName', label: 'Hall Name' },
          { key: 'capacity', label: 'Capacity' },
          { key: 'building', label: 'Building' },
          { key: 'floor', label: 'Floor' },
          { key: 'facilities', label: 'Facilities', valueMap: (h) => h.facilities?.join(', ') || 'None' }
        ]}
        data={filtered}
        fileName="Halls_Export"
        sheetName="Exam_Halls"
      />

      {/* Confirm Warning Modal */}
      <ConfirmDialog isOpen={!!confirm} title="Delete Exam Hall?"
        message={`Delete "${confirm?.name}" from the database? This will clear its allocations and assignments.`}
        confirmLabel="Delete" onConfirm={() => { deleteMutation.mutate(confirm.id); setConfirm(null); }} onCancel={() => setConfirm(null)} />
    </div>
  );
};

export default Halls;
