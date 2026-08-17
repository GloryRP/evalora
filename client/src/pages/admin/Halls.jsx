/**
 * Halls Management Page - Enhanced
 * Features: Live search, pagination, building filtering, Excel export, bulk import, styled confirm dialog
 */
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/api';
import { Plus, Edit2, Trash2, Building2, Upload, Download, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import BulkImportModal from '../../components/BulkImportModal';
import ConfirmDialog from '../../components/ConfirmDialog';
import ExportModal from '../../components/ExportModal';

const PAGE_SIZE = 10;

const Halls = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [editingHall, setEditingHall] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ building: '' });
  const [page, setPage] = useState(1);

  const [formData, setFormData] = useState({
    hallName: '',
    building: '',
    capacity: '',
    floor: '',
    facilities: '',
  });

  // Fetch halls
  const { data: hallsData, isLoading: isHallsLoading } = useQuery({
    queryKey: ['halls', filters],
    queryFn: async () => {
      const response = await apiClient.get('/admin/halls');
      return { data: response.data.data || [] };
    },
  });

  const allHalls = hallsData?.data || [];
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return q
      ? allHalls.filter(
          (h) =>
            h.hallName?.toLowerCase().includes(q) ||
            h.building?.toLowerCase().includes(q)
        )
      : allHalls;
  }, [allHalls, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Get unique buildings for filter dropdown
  const buildings = [...new Set(allHalls.map(h => h.building).filter(Boolean))].sort();

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data) => apiClient.post('/admin/halls', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['halls']);
      closeModal();
      toast.success('Hall created successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create hall');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.put(`/admin/halls/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['halls']);
      closeModal();
      toast.success('Hall updated successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update hall');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/admin/halls/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['halls']);
      toast.success('Hall deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete hall');
    },
  });

  const openModal = (hall = null) => {
    if (hall) {
      setEditingHall(hall);
      setFormData({
        hallName: hall.hallName,
        building: hall.building || '',
        capacity: hall.capacity?.toString() || '',
        floor: hall.floor || '',
        facilities: hall.facilities?.join(', ') || '',
      });
    } else {
      setEditingHall(null);
      setFormData({
        hallName: '',
        building: '',
        capacity: '',
        floor: '',
        facilities: '',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingHall(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = {
      hallName: formData.hallName,
      building: formData.building,
      capacity: parseInt(formData.capacity) || 0,
      floor: formData.floor,
      facilities: formData.facilities.split(',').map(f => f.trim()).filter(Boolean),
    };
    
    if (editingHall) {
      updateMutation.mutate({ id: editingHall._id, data: submitData });
    } else {
      createMutation.mutate(submitData);
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
              Halls
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
                Add Hall
              </button>
            </div>
          </div>

          {/* ROW 2: Record count */}
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontWeight: 400, marginBottom: '16px' }}>
            {filtered.length} hall{filtered.length !== 1 ? 's' : ''}{search ? ' found' : ' total'}
          </p>

          {/* ROW 3: Search + Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search by hall name or building..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ flex: 1, minWidth: '200px', padding: '10px 16px', border: '1.5px solid #E0E0E0', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--color-text)', backgroundColor: 'white', outline: 'none', fontFamily: 'var(--font-body)', transition: 'border-color 200ms ease' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-gold)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,162,39,0.08)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#E0E0E0'; e.currentTarget.style.boxShadow = 'none'; }}
            />
            <select
              value={filters.building}
              onChange={(e) => { setFilters({ building: e.target.value }); setPage(1); }}
              style={{ width: '180px', flexShrink: 0, padding: '10px 14px', border: '1.5px solid #E0E0E0', borderRadius: '8px', fontSize: '0.875rem', color: 'var(--color-text)', backgroundColor: 'white', outline: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', appearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235C5C5C' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: '32px', transition: 'border-color 200ms ease' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-gold)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#E0E0E0'; }}
            >
              <option value="">All Buildings</option>
              {buildings.map(building => (
                <option key={building} value={building}>{building}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div style={{ backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #F0F0F0', overflow: 'hidden' }}>
          {isHallsLoading ? (
            <div className="p-6">
              <LoadingSkeleton rows={5} columns={4} />
            </div>
          ) : paginated.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <Building2 size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-[#1A1A1A] mb-1">
                {search ? 'No results found' : 'No halls found'}
              </h3>
              <p className="text-[#5C5C5C] mb-4">
                {search ? `No halls match "${search}"` : 'Get started by adding your first hall'}
              </p>
              {!search && (
                <Button onClick={() => openModal()} variant="primary">
                  <Plus size={18} className="inline mr-2" />
                  Add Hall
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
                        Hall Name
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'white', whiteSpace: 'nowrap', borderBottom: 'none' }}>
                        Building
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'white', whiteSpace: 'nowrap', borderBottom: 'none' }}>
                        Capacity
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'white', whiteSpace: 'nowrap', borderBottom: 'none' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((hall) => (
                      <tr
                        key={hall._id}
                        style={{ borderBottom: '1px solid #F5F5F5', transition: 'background-color 150ms ease' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F9FAFB'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                              <Building2 size={13} className="text-[#1E3A5F]" />
                            </div>
                            <span className="text-sm font-semibold text-[#1A1A1A]">{hall.hallName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-mono font-bold text-[#C9A227] bg-amber-50 px-2.5 py-1 rounded-md">
                            {hall.building || 'Main'}
                          </span>
                          {hall.floor && (
                            <div className="text-xs text-gray-500 mt-1">{hall.floor}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#065F46] bg-emerald-50 px-2.5 py-1 rounded-full">
                            <Users size={12} />
                            {hall.capacity}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => openModal(hall)}
                            className="text-[#1E3A5F] hover:text-[#152B45] mr-3 p-1.5 rounded-lg hover:bg-blue-50 transition"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => setConfirm({ id: hall._id, name: hall.hallName })}
                            className="text-[#B3413E] hover:text-[#9A3633] p-1.5 rounded-lg hover:bg-red-50 transition"
                          >
                            <Trash2 size={15} />
                          </button>
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

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            {/* Navy Header */}
            <div style={{ backgroundColor: 'var(--color-navy)', padding: '16px 24px', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'white', margin: 0 }}>
                {editingHall ? 'Edit Hall' : 'Add New Hall'}
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
                  Hall Name <span className="text-[#B3413E]">*</span>
                </label>
                <input
                  type="text"
                  value={formData.hallName}
                  onChange={(e) => setFormData({ ...formData, hallName: e.target.value })}
                  required
                  autoFocus
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none text-sm"
                  placeholder="e.g., Hall A101"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                  Building <span className="text-[#B3413E]">*</span>
                </label>
                <input
                  type="text"
                  value={formData.building}
                  onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none text-sm"
                  placeholder="e.g., Building A, Main Block"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                  Floor
                </label>
                <input
                  type="text"
                  value={formData.floor}
                  onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none text-sm"
                  placeholder="e.g., Ground Floor, 2nd Floor"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                  Capacity <span className="text-[#B3413E]">*</span>
                </label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  required
                  min="1"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none text-sm"
                  placeholder="e.g., 60"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                  Facilities / Resources
                </label>
                <input
                  type="text"
                  value={formData.facilities}
                  onChange={(e) => setFormData({ ...formData, facilities: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A227] focus:border-transparent outline-none text-sm"
                  placeholder="Comma-separated: AC, Projector, CCTV"
                />
                <p className="text-xs text-gray-500 mt-1">Separate multiple facilities with commas</p>
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
                  {editingHall ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {isBulkModalOpen && (
        <BulkImportModal
          type="halls"
          onClose={() => setIsBulkModalOpen(false)}
          onSuccess={() => queryClient.invalidateQueries(['halls'])}
        />
      )}

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        fields={[
          { key: 'hallName', label: 'Hall Name' },
          { key: 'building', label: 'Building' },
          { key: 'floor', label: 'Floor' },
          { key: 'capacity', label: 'Capacity' },
          { key: 'facilities', label: 'Facilities', valueMap: (h) => h.facilities?.join(', ') || 'None' }
        ]}
        data={filtered}
        fileName="Halls_Export"
        sheetName="Halls"
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!confirm}
        title="Delete Hall?"
        message={`Are you sure you want to delete "${confirm?.name}"? This action cannot be undone and may affect exam scheduling.`}
        confirmLabel="Delete Hall"
        onConfirm={() => {
          deleteMutation.mutate(confirm.id);
          setConfirm(null);
        }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
};

export default Halls;