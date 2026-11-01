/**
 * ExamCellMembers Management Page
 * Admin can add, edit, activate/deactivate, and reset passwords for Exam Cell officers.
 * Each officer gets an individual account — no shared credentials.
 */
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/api';
import toast from 'react-hot-toast';
import {
  ShieldCheck,
  Plus,
  Edit2,
  RotateCcw,
  ToggleLeft,
  ToggleRight,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import ConfirmDialog from '../../components/ConfirmDialog';

const PAGE_SIZE = 10;

const DESIGNATION_OPTIONS = [
  'Exam Cell Officer',
  'Assistant Controller',
  'Controller of Examinations',
];

const ExamCellMembers = () => {
  const queryClient = useQueryClient();

  // UI state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Form state
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    email: '',
    phone: '',
    designation: 'Exam Cell Officer',
  });

  // ── Fetch members ──
  const { data: membersResponse, isLoading } = useQuery({
    queryKey: ['examcellMembers'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/examcell');
      return res.data;
    },
  });

  const allMembers = membersResponse?.data || [];

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return q
      ? allMembers.filter(
          (m) =>
            m.name?.toLowerCase().includes(q) ||
            m.username?.toLowerCase().includes(q) ||
            m.email?.toLowerCase().includes(q) ||
            m.designation?.toLowerCase().includes(q)
        )
      : allMembers;
  }, [allMembers, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── Mutations ──
  const createMutation = useMutation({
    mutationFn: (data) => apiClient.post('/admin/examcell', data),
    onSuccess: () => {
      toast.success('Exam Cell member created successfully');
      queryClient.invalidateQueries(['examcellMembers']);
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create member'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.put(`/admin/examcell/${id}`, data),
    onSuccess: () => {
      toast.success('Member updated successfully');
      queryClient.invalidateQueries(['examcellMembers']);
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update member'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }) =>
      apiClient.patch(`/admin/examcell/${id}/status`, { isActive }),
    onSuccess: (res) => {
      toast.success(res.data.message);
      queryClient.invalidateQueries(['examcellMembers']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update status'),
  });

  const resetMutation = useMutation({
    mutationFn: (id) => apiClient.patch(`/admin/examcell/${id}/reset-password`),
    onSuccess: (res) => {
      toast.success(res.data.message);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to reset password'),
  });

  // ── Handlers ──
  const openAddModal = () => {
    setEditingMember(null);
    setFormData({ employeeId: '', name: '', email: '', phone: '', designation: 'Exam Cell Officer' });
    setIsModalOpen(true);
  };

  const openEditModal = (member) => {
    setEditingMember(member);
    setFormData({
      employeeId: member.username,
      name: member.name,
      email: member.email || '',
      phone: member.phone || '',
      designation: member.designation || 'Exam Cell Officer',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMember(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingMember) {
      updateMutation.mutate({
        id: editingMember._id,
        data: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          designation: formData.designation,
        },
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleToggleStatus = (member) => {
    const newStatus = !member.isActive;
    setConfirm({
      type: 'status',
      member,
      title: newStatus ? 'Activate Account?' : 'Deactivate Account?',
      message: newStatus
        ? `Re-activate ${member.name}'s account? They will be able to log in again.`
        : `Deactivate ${member.name}'s account? They will not be able to log in until re-activated.`,
      confirmLabel: newStatus ? 'Activate' : 'Deactivate',
      variant: newStatus ? 'warning' : 'danger',
      onConfirm: () => {
        statusMutation.mutate({ id: member._id, isActive: newStatus });
        setConfirm(null);
      },
    });
  };

  const handleResetPassword = (member) => {
    setConfirm({
      type: 'reset',
      member,
      title: 'Reset Password?',
      message: `Reset ${member.name}'s password to ${member.username}@123? They will be prompted to change it on next login.`,
      confirmLabel: 'Reset Password',
      variant: 'warning',
      onConfirm: () => {
        resetMutation.mutate(member._id);
        setConfirm(null);
      },
    });
  };

  // ── Loading state ──
  if (isLoading) {
    return (
      <div style={{ padding: '2rem' }}>
        <LoadingSkeleton count={5} />
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2rem',
            fontWeight: '700',
            color: 'var(--color-navy)',
            marginBottom: '0.25rem',
          }}>
            Exam Cell Members
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
            Manage individual Exam Cell officer accounts
          </p>
        </div>
        <button
          onClick={openAddModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1.25rem',
            backgroundColor: 'var(--color-gold)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background-color 150ms',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-gold-light)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-gold)')}
        >
          <Plus size={18} /> Add Member
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '1rem', position: 'relative', maxWidth: '360px' }}>
        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
        <input
          type="text"
          placeholder="Search by name, ID, email…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{
            width: '100%',
            padding: '0.625rem 0.75rem 0.625rem 2.25rem',
            border: '1px solid #E0E0E0',
            borderRadius: '8px',
            fontSize: '0.875rem',
            outline: 'none',
            fontFamily: 'var(--font-body)',
          }}
        />
      </div>

      {/* Table card */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid #E5E5E5',
        overflow: 'hidden',
      }}>
        {paginated.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <ShieldCheck size={48} style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }} />
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
              {search ? 'No members match your search.' : 'No Exam Cell members yet. Click "Add Member" to create one.'}
            </p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E5E5E5' }}>
                    {['Name', 'Employee ID', 'Email', 'Phone', 'Designation', 'Status', 'Actions'].map((h) => (
                      <th key={h} style={{
                        padding: '0.75rem 1rem',
                        textAlign: h === 'Actions' ? 'right' : 'left',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        color: 'var(--color-text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em',
                        whiteSpace: 'nowrap',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((m, idx) => (
                    <tr key={m._id} style={{ borderBottom: '1px solid #F0F0F0', background: idx % 2 === 0 ? 'transparent' : '#FAFAF8' }}>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.9rem', fontWeight: '500', color: 'var(--color-text)' }}>
                        {m.name}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--color-text)' }}>
                        {m.username}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                        {m.email || '—'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                        {m.phone || '—'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                        {m.designation || 'Exam Cell Officer'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.2rem 0.65rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          background: m.isActive ? '#2D7A5F20' : '#B3413E20',
                          color: m.isActive ? 'var(--color-success)' : 'var(--color-error)',
                        }}>
                          {m.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                          <button
                            title="Edit"
                            onClick={() => openEditModal(m)}
                            style={actionBtnStyle}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-gold)'; e.currentTarget.style.color = 'var(--color-gold)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E0E0E0'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            title="Reset Password"
                            onClick={() => handleResetPassword(m)}
                            style={actionBtnStyle}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#C9A227'; e.currentTarget.style.color = '#C9A227'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E0E0E0'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
                          >
                            <RotateCcw size={14} />
                          </button>
                          <button
                            title={m.isActive ? 'Deactivate' : 'Activate'}
                            onClick={() => handleToggleStatus(m)}
                            style={actionBtnStyle}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = m.isActive ? 'var(--color-error)' : 'var(--color-success)'; e.currentTarget.style.color = m.isActive ? 'var(--color-error)' : 'var(--color-success)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E0E0E0'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
                          >
                            {m.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                borderTop: '1px solid #F0F0F0',
                background: '#FAFAF8',
              }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  Page {page} of {totalPages}
                </p>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                    style={pageBtnStyle(false)}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages}
                    style={pageBtnStyle(false)}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Add / Edit Modal ── */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 50,
        }}>
          <div style={{
            background: 'white', borderRadius: '16px', boxShadow: 'var(--shadow-lg)',
            width: '100%', maxWidth: '440px', maxHeight: '90vh', display: 'flex', flexDirection: 'column',
          }}>
            {/* Navy Header */}
            <div style={{
              backgroundColor: 'var(--color-navy)', padding: '16px 24px',
              borderTopLeftRadius: '16px', borderTopRightRadius: '16px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
            }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'white', margin: 0 }}>
                {editingMember ? 'Edit Member' : 'Add New Member'}
              </h2>
              <button onClick={closeModal} type="button" style={{
                color: 'white', background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                display: 'flex', alignItems: 'center', opacity: 0.8, transition: 'opacity 150ms',
              }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.8')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* White Body */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={{ padding: '24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Employee ID */}
                <div>
                  <label style={labelStyle}>
                    Employee ID <span style={{ color: 'var(--color-error)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    disabled={!!editingMember}
                    required
                    autoFocus={!editingMember}
                    placeholder="e.g., EC001"
                    style={{
                      ...inputStyle,
                      ...(editingMember ? { backgroundColor: '#F5F5F5', color: 'var(--color-text-secondary)', cursor: 'not-allowed' } : {}),
                      fontFamily: 'monospace',
                      textTransform: 'uppercase',
                    }}
                  />
                </div>

                {/* Full Name */}
                <div>
                  <label style={labelStyle}>
                    Full Name <span style={{ color: 'var(--color-error)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    autoFocus={!!editingMember}
                    placeholder="Full name of the officer"
                    style={inputStyle}
                  />
                </div>

                {/* Email */}
                <div>
                  <label style={labelStyle}>
                    Email <span style={{ color: 'var(--color-error)' }}>*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="officer@college.edu"
                    style={inputStyle}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label style={labelStyle}>
                    Phone <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', fontWeight: '400', marginLeft: '4px' }}>(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="10-digit phone number"
                    style={inputStyle}
                  />
                </div>

                {/* Designation */}
                <div>
                  <label style={labelStyle}>Designation</label>
                  <select
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    style={inputStyle}
                  >
                    {DESIGNATION_OPTIONS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* Amber note — only for new member */}
                {!editingMember && (
                  <div style={{
                    backgroundColor: '#FFF8E1',
                    border: '1px solid #FFE082',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    fontSize: '0.8rem',
                    color: '#6D5D00',
                    lineHeight: '1.45',
                  }}>
                    <strong>Note:</strong> Default password will be <strong>EmployeeID@123</strong>.
                    The officer must change it on first login.
                  </div>
                )}
              </div>

              {/* Footer buttons */}
              <div style={{
                padding: '16px 24px', borderTop: '1px solid #E0E0E0',
                display: 'flex', gap: '12px', flexShrink: 0,
              }}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    flex: 1, padding: '0.625rem', border: '1px solid #E0E0E0', borderRadius: '10px',
                    background: 'white', fontSize: '0.875rem', fontWeight: '600',
                    color: 'var(--color-text-secondary)', cursor: 'pointer', transition: 'background 150ms',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#F5F5F5')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  style={{
                    flex: 1, padding: '0.625rem', border: 'none', borderRadius: '10px',
                    background: 'var(--color-navy)', fontSize: '0.875rem', fontWeight: '600',
                    color: 'white', cursor: 'pointer', transition: 'background 150ms',
                    opacity: createMutation.isPending || updateMutation.isPending ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-navy-light)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-navy)')}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving…'
                    : editingMember ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel={confirm?.confirmLabel}
        variant={confirm?.variant || 'warning'}
        onConfirm={confirm?.onConfirm}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
};

// ── Shared inline style objects ──
const labelStyle = {
  display: 'block',
  fontSize: '0.85rem',
  fontWeight: '500',
  color: 'var(--color-text)',
  marginBottom: '6px',
};

const inputStyle = {
  width: '100%',
  padding: '0.6rem 0.75rem',
  border: '1px solid #D1D5DB',
  borderRadius: '8px',
  fontSize: '0.875rem',
  outline: 'none',
  fontFamily: 'var(--font-body)',
  transition: 'border-color 150ms',
};

const actionBtnStyle = {
  width: '32px',
  height: '32px',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid #E0E0E0',
  background: 'white',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
  transition: 'border-color 150ms, color 150ms',
};

const pageBtnStyle = () => ({
  width: '32px',
  height: '32px',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid #E0E0E0',
  background: 'white',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
});

export default ExamCellMembers;
