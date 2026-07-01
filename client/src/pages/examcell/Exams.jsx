/**
 * Exams Management Page
 * CRUD operations for exams
 */
import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import api from '../../lib/api';
import Button from '../../components/ui/Button';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';

const Exams = () => {
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [formData, setFormData] = useState({
    subjectId: '',
    examDate: '',
    startTime: '',
    endTime: '',
    semester: '',
    examType: 'regular',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [examsRes, subjectsRes] = await Promise.all([
        api.get('/examcell/exams'),
        api.get('/admin/subjects'),
      ]);
      setExams(examsRes.data.data);
      setSubjects(subjectsRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingExam) {
        await api.put(`/examcell/exams/${editingExam._id}`, formData);
      } else {
        await api.post('/examcell/exams', formData);
      }
      setShowModal(false);
      setEditingExam(null);
      setFormData({ subjectId: '', examDate: '', startTime: '', endTime: '', semester: '', examType: 'regular' });
      fetchData();
    } catch (error) {
      console.error('Error saving exam:', error);
      alert('Failed to save exam');
    }
  };

  const handleEdit = (exam) => {
    setEditingExam(exam);
    setFormData({
      subjectId: exam.subjectId._id,
      examDate: exam.examDate.split('T')[0],
      startTime: exam.startTime,
      endTime: exam.endTime,
      semester: exam.semester,
      examType: exam.examType,
    });
    setShowModal(true);
  };

  const handleDelete = async (examId) => {
    if (!confirm('Are you sure you want to delete this exam?')) return;
    try {
      await api.delete(`/examcell/exams/${examId}`);
      fetchData();
    } catch (error) {
      console.error('Error deleting exam:', error);
      alert('Failed to delete exam');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return '#2D7A5F';
      case 'draft': return '#5C5C5C';
      case 'completed': return '#1E3A5F';
      case 'cancelled': return '#B3413E';
      default: return '#5C5C5C';
    }
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
            Exams
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
            Manage exam schedules and details
          </p>
        </div>
        <Button onClick={() => { setEditingExam(null); setShowModal(true); }}>
          <Plus size={20} /> Create Exam
        </Button>
      </div>

      {/* Exams Table */}
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #E5E5E5'
      }}>
        {exams.length === 0 ? (
          <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '2rem' }}>
            No exams found. Create your first exam to get started.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E5E5E5' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Subject</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Date</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Time</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Semester</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Type</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((exam, idx) => (
                  <tr key={exam._id} style={{ 
                    borderBottom: '1px solid #F0F0F0',
                    background: idx % 2 === 0 ? 'transparent' : '#FAFAF8'
                  }}>
                    <td style={{ padding: '0.75rem', fontSize: '0.9rem', color: 'var(--color-text)', fontWeight: '500' }}>
                      {exam.subjectId.subjectName}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.9rem', color: 'var(--color-text)' }}>
                      {new Date(exam.examDate).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.9rem', color: 'var(--color-text)' }}>
                      {exam.startTime} - {exam.endTime}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.9rem', color: 'var(--color-text)' }}>
                      Sem {exam.semester}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.9rem', color: 'var(--color-text)', textTransform: 'capitalize' }}>
                      {exam.examType}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        background: `${getStatusColor(exam.status)}20`,
                        color: getStatusColor(exam.status),
                        textTransform: 'capitalize'
                      }}>
                        {exam.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      <button onClick={() => handleEdit(exam)} style={{ marginRight: '0.5rem', padding: '0.5rem', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-navy)' }}>
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(exam._id)} style={{ padding: '0.5rem', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-error)' }}>
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                {editingExam ? 'Edit Exam' : 'Create Exam'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '0.5rem' }}>
                <X size={24} color="var(--color-text-secondary)" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500', color: 'var(--color-text)' }}>Subject</label>
                <select 
                  value={formData.subjectId} 
                  onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                  required
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #E5E5E5', borderRadius: '4px', fontSize: '0.95rem' }}
                >
                  <option value="">Select Subject</option>
                  {subjects.map(sub => (
                    <option key={sub._id} value={sub._id}>{sub.subjectName} ({sub.subjectCode})</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500', color: 'var(--color-text)' }}>Exam Date</label>
                <input 
                  type="date" 
                  value={formData.examDate} 
                  onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                  required
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #E5E5E5', borderRadius: '4px', fontSize: '0.95rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500', color: 'var(--color-text)' }}>Start Time</label>
                  <input 
                    type="time" 
                    value={formData.startTime} 
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #E5E5E5', borderRadius: '4px', fontSize: '0.95rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500', color: 'var(--color-text)' }}>End Time</label>
                  <input 
                    type="time" 
                    value={formData.endTime} 
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #E5E5E5', borderRadius: '4px', fontSize: '0.95rem' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500', color: 'var(--color-text)' }}>Semester</label>
                <input 
                  type="number" 
                  value={formData.semester} 
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  required
                  min="1"
                  max="8"
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #E5E5E5', borderRadius: '4px', fontSize: '0.95rem' }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500', color: 'var(--color-text)' }}>Exam Type</label>
                <select 
                  value={formData.examType} 
                  onChange={(e) => setFormData({ ...formData, examType: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #E5E5E5', borderRadius: '4px', fontSize: '0.95rem' }}
                >
                  <option value="regular">Regular</option>
                  <option value="midterm">Midterm</option>
                  <option value="final">Final</option>
                  <option value="makeup">Makeup</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <Button type="submit" style={{ flex: 1 }}>
                  {editingExam ? 'Update Exam' : 'Create Exam'}
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

export default Exams;
