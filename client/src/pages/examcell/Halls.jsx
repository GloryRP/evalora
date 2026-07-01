/**
 * Halls Management Page
 * CRUD operations for exam halls
 */
import { useState, useEffect } from 'react';
import { Plus, Edit2, X } from 'lucide-react';
import api from '../../lib/api';
import Button from '../../components/ui/Button';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';

const Halls = () => {
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingHall, setEditingHall] = useState(null);
  const [formData, setFormData] = useState({
    hallName: '',
    capacity: '',
    building: '',
    floor: '',
    facilities: '',
  });

  useEffect(() => {
    fetchHalls();
  }, []);

  const fetchHalls = async () => {
    try {
      setLoading(true);
      const response = await api.get('/examcell/halls');
      setHalls(response.data.data);
    } catch (error) {
      console.error('Error fetching halls:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        ...formData,
        facilities: formData.facilities.split(',').map(f => f.trim()).filter(Boolean),
      };

      if (editingHall) {
        await api.put(`/examcell/halls/${editingHall._id}`, dataToSend);
      } else {
        await api.post('/examcell/halls', dataToSend);
      }
      
      setShowModal(false);
      setEditingHall(null);
      setFormData({ hallName: '', capacity: '', building: '', floor: '', facilities: '' });
      fetchHalls();
    } catch (error) {
      console.error('Error saving hall:', error);
      alert('Failed to save hall');
    }
  };

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

  if (loading) {
    return (
      <div style={{ padding: '2rem' }}>
        <LoadingSkeleton count={5} />
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ 
            fontFamily: 'var(--font-display)', 
            fontSize: '2rem', 
            fontWeight: '700', 
            color: 'var(--color-navy)',
            marginBottom: '0.5rem'
          }}>
            Halls
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
            Manage exam halls and capacities
          </p>
        </div>
        <Button onClick={() => { setEditingHall(null); setShowModal(true); }}>
          <Plus size={20} /> Add Hall
        </Button>
      </div>

      {/* Halls Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '1.5rem'
      }}>
        {halls.map((hall) => (
          <div key={hall._id} style={{
            background: 'white',
            borderRadius: '8px',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #E5E5E5',
            position: 'relative'
          }}>
            <button 
              onClick={() => handleEdit(hall)} 
              style={{ 
                position: 'absolute', 
                top: '1rem', 
                right: '1rem', 
                border: 'none', 
                background: 'var(--color-navy)', 
                color: 'white',
                borderRadius: '4px',
                padding: '0.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Edit2 size={16} />
            </button>

            <h3 style={{ 
              fontFamily: 'var(--font-display)', 
              fontSize: '1.25rem', 
              fontWeight: '600', 
              color: 'var(--color-navy)',
              marginBottom: '0.5rem'
            }}>
              {hall.hallName}
            </h3>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-gold)' }}>
                {hall.capacity}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Capacity
              </div>
            </div>

            {hall.building && (
              <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text)' }}>
                <strong>Building:</strong> {hall.building}
              </div>
            )}

            {hall.floor && (
              <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text)' }}>
                <strong>Floor:</strong> {hall.floor}
              </div>
            )}

            {hall.facilities && hall.facilities.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  Facilities
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {hall.facilities.map((facility, idx) => (
                    <span key={idx} style={{
                      padding: '0.25rem 0.75rem',
                      background: 'var(--color-bg)',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      color: 'var(--color-text-secondary)'
                    }}>
                      {facility}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {halls.length === 0 && (
          <div style={{ 
            gridColumn: '1 / -1',
            textAlign: 'center',
            padding: '4rem 2rem',
            color: 'var(--color-text-secondary)'
          }}>
            No halls found. Add your first hall to get started.
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '2rem',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: '600', color: 'var(--color-navy)' }}>
                {editingHall ? 'Edit Hall' : 'Add Hall'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '0.5rem' }}>
                <X size={24} color="var(--color-text-secondary)" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500', color: 'var(--color-text)' }}>Hall Name</label>
                <input 
                  type="text" 
                  value={formData.hallName} 
                  onChange={(e) => setFormData({ ...formData, hallName: e.target.value })}
                  required
                  placeholder="e.g., Hall A, Lab 1"
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #E5E5E5', borderRadius: '4px', fontSize: '0.95rem' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500', color: 'var(--color-text)' }}>Capacity</label>
                <input 
                  type="number" 
                  value={formData.capacity} 
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  required
                  min="1"
                  placeholder="Total seating capacity"
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #E5E5E5', borderRadius: '4px', fontSize: '0.95rem' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500', color: 'var(--color-text)' }}>Building (Optional)</label>
                <input 
                  type="text" 
                  value={formData.building} 
                  onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                  placeholder="e.g., Main Block, IT Block"
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #E5E5E5', borderRadius: '4px', fontSize: '0.95rem' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500', color: 'var(--color-text)' }}>Floor (Optional)</label>
                <input 
                  type="text" 
                  value={formData.floor} 
                  onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                  placeholder="e.g., Ground Floor, 2nd Floor"
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #E5E5E5', borderRadius: '4px', fontSize: '0.95rem' }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500', color: 'var(--color-text)' }}>Facilities (Optional)</label>
                <input 
                  type="text" 
                  value={formData.facilities} 
                  onChange={(e) => setFormData({ ...formData, facilities: e.target.value })}
                  placeholder="Comma-separated: AC, Projector, Audio"
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #E5E5E5', borderRadius: '4px', fontSize: '0.95rem' }}
                />
                <small style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>Separate multiple facilities with commas</small>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <Button type="submit" style={{ flex: 1 }}>
                  {editingHall ? 'Update Hall' : 'Add Hall'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} style={{ flex: 1 }}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Halls;
