/**
 * Institution Settings Page
 * Admin configures institution branding and details
 */
import { useState, useEffect } from 'react';
import { Save, Loader, Calendar, Plus, Trash2 } from 'lucide-react';
import api from '../../lib/api';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';
import { useAcademicYear } from '../../contexts/InstitutionContext';

const InstitutionSettings = () => {
  const { currentAcademicYear, currentSemester, refreshAcademicYear } = useAcademicYear();
  const [formData, setFormData] = useState({
    institutionName: '',
    abbreviation: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
    website: '',
    logoUrl: '',
    affiliatedUniversity: '',
    academicYear: '',
    examCellEmail: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Academic Year Management state
  const [academicYearForm, setAcademicYearForm] = useState({
    year: currentAcademicYear,
    semester: currentSemester,
  });
  const [academicYears, setAcademicYears] = useState([]);
  const [newYearForm, setNewYearForm] = useState({
    year: '',
    startDate: '',
    endDate: '',
  });
  const [showAddYear, setShowAddYear] = useState(false);
  const [updatingAcademicYear, setUpdatingAcademicYear] = useState(false);

  useEffect(() => {
    fetchConfig();
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    setAcademicYearForm({
      year: currentAcademicYear,
      semester: currentSemester,
    });
  }, [currentAcademicYear, currentSemester]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await api.get('/institution/config');
      if (response.data?.success && response.data?.data) {
        setFormData((prev) => ({
          ...prev,
          ...response.data.data,
        }));
      }
    } catch (error) {
      console.error('Error fetching config:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchAcademicYears = async () => {
    try {
      const response = await api.get('/institution/academic-years');
      if (response.data?.success) {
        setAcademicYears(response.data.data.academicYears || []);
      }
    } catch (error) {
      console.error('Error fetching academic years:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await api.put('/institution/config', formData);
      if (response.data?.success) {
        toast.success('Institution settings updated successfully!');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateAcademicYear = async () => {
    try {
      setUpdatingAcademicYear(true);
      const response = await api.put('/institution/academic-years/current', {
        year: academicYearForm.year,
        currentSemester: academicYearForm.semester,
      });
      if (response.data?.success) {
        toast.success('Academic year updated successfully!');
        await refreshAcademicYear();
        await fetchAcademicYears();
      }
    } catch (error) {
      console.error('Error updating academic year:', error);
      toast.error(error.response?.data?.message || 'Failed to update academic year');
    } finally {
      setUpdatingAcademicYear(false);
    }
  };

  const handleAddAcademicYear = async () => {
    if (!newYearForm.year || !newYearForm.startDate || !newYearForm.endDate) {
      toast.error('Please fill in all fields');
      return;
    }
    try {
      const response = await api.post('/institution/academic-years', {
        year: newYearForm.year,
        startDate: newYearForm.startDate,
        endDate: newYearForm.endDate,
        isCurrent: false,
      });
      if (response.data?.success) {
        toast.success('Academic year added successfully!');
        setNewYearForm({ year: '', startDate: '', endDate: '' });
        setShowAddYear(false);
        await fetchAcademicYears();
      }
    } catch (error) {
      console.error('Error adding academic year:', error);
      toast.error(error.response?.data?.message || 'Failed to add academic year');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <Loader size={32} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2rem',
            fontWeight: '700',
            color: 'var(--color-navy)',
            marginBottom: '0.5rem',
          }}
        >
          Institution Settings
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
          Configure your institution details and branding
        </p>
      </div>

      {/* Form */}
      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          padding: '2rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #E5E5E5',
        }}
      >
        {/* Section 1: Basic Info */}
        <div style={{ marginBottom: '2rem' }}>
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: 'var(--color-navy)',
              marginBottom: '1rem',
              paddingBottom: '0.75rem',
              borderBottom: '2px solid var(--color-gold)',
            }}
          >
            Basic Information
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  color: 'var(--color-text)',
                }}
              >
                Institution Name *
              </label>
              <input
                type="text"
                name="institutionName"
                value={formData.institutionName}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #E5E5E5',
                  borderRadius: '6px',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box',
                }}
                placeholder="e.g., PES Institute of Technology"
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  color: 'var(--color-text)',
                }}
              >
                Abbreviation *
              </label>
              <input
                type="text"
                name="abbreviation"
                value={formData.abbreviation}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #E5E5E5',
                  borderRadius: '6px',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box',
                }}
                placeholder="e.g., PESITM"
              />
            </div>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: '600',
                marginBottom: '0.5rem',
                color: 'var(--color-text)',
              }}
            >
              Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #E5E5E5',
                borderRadius: '6px',
                fontSize: '0.95rem',
                boxSizing: 'border-box',
              }}
              placeholder="Street address"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginTop: '1rem' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  color: 'var(--color-text)',
                }}
              >
                City
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #E5E5E5',
                  borderRadius: '6px',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box',
                }}
                placeholder="City"
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  color: 'var(--color-text)',
                }}
              >
                State
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #E5E5E5',
                  borderRadius: '6px',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box',
                }}
                placeholder="State"
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  color: 'var(--color-text)',
                }}
              >
                Pincode
              </label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #E5E5E5',
                  borderRadius: '6px',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box',
                }}
                placeholder="Pincode"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Contact Info */}
        <div style={{ marginBottom: '2rem' }}>
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: 'var(--color-navy)',
              marginBottom: '1rem',
              paddingBottom: '0.75rem',
              borderBottom: '2px solid var(--color-gold)',
            }}
          >
            Contact Information
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  color: 'var(--color-text)',
                }}
              >
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #E5E5E5',
                  borderRadius: '6px',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box',
                }}
                placeholder="+91-XXXXXXXXXX"
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  color: 'var(--color-text)',
                }}
              >
                General Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #E5E5E5',
                  borderRadius: '6px',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box',
                }}
                placeholder="info@institution.edu"
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  color: 'var(--color-text)',
                }}
              >
                Exam Cell Email
              </label>
              <input
                type="email"
                name="examCellEmail"
                value={formData.examCellEmail}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #E5E5E5',
                  borderRadius: '6px',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box',
                }}
                placeholder="examcell@institution.edu"
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  color: 'var(--color-text)',
                }}
              >
                Website
              </label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #E5E5E5',
                  borderRadius: '6px',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box',
                }}
                placeholder="www.institution.edu"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Academic Info */}
        <div style={{ marginBottom: '2rem' }}>
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: 'var(--color-navy)',
              marginBottom: '1rem',
              paddingBottom: '0.75rem',
              borderBottom: '2px solid var(--color-gold)',
            }}
          >
            Academic Information
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  color: 'var(--color-text)',
                }}
              >
                Affiliated University
              </label>
              <input
                type="text"
                name="affiliatedUniversity"
                value={formData.affiliatedUniversity}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #E5E5E5',
                  borderRadius: '6px',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box',
                }}
                placeholder="e.g., VTU, JNTUA"
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  color: 'var(--color-text)',
                }}
              >
                Academic Year
              </label>
              <input
                type="text"
                name="academicYear"
                value={formData.academicYear}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #E5E5E5',
                  borderRadius: '6px',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box',
                }}
                placeholder="2025-26"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={fetchConfig}>
            Cancel
          </Button>
          <Button variant="gold" onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {saving ? (
              <>
                <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Academic Year Management Section */}
      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          padding: '2rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #E5E5E5',
          marginTop: '2rem',
        }}
      >
        <div style={{ marginBottom: '1.5rem' }}>
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: 'var(--color-navy)',
              marginBottom: '0.5rem',
            }}
          >
            Academic Year Management
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            Set the current academic year and semester. These are used as defaults throughout the system.
          </p>
        </div>

        {/* Current Active Settings Box */}
        <div
          style={{
            backgroundColor: '#EEF2FF',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px',
          }}
        >
          <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '4px' }}>
            Current Academic Year: {currentAcademicYear}
          </p>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            Current Semester: Semester {currentSemester}
          </p>
        </div>

        {/* Update Form */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '1rem' }}>
            Update Current Academic Year & Semester
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '0.5rem',
                }}
              >
                Current Academic Year
              </label>
              <input
                type="text"
                value={academicYearForm.year}
                onChange={(e) => setAcademicYearForm({ ...academicYearForm, year: e.target.value })}
                placeholder="e.g. 2025-26"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #E5E5E5',
                  borderRadius: '6px',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box',
                }}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                Format: YYYY-YY (e.g. 2025-26)
              </p>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '0.5rem',
                }}
              >
                Current Semester
              </label>
              <select
                value={academicYearForm.semester}
                onChange={(e) => setAcademicYearForm({ ...academicYearForm, semester: Number(e.target.value) })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #E5E5E5',
                  borderRadius: '6px',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box',
                  cursor: 'pointer',
                }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <option key={sem} value={sem}>
                    Semester {sem}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleUpdateAcademicYear}
            disabled={updatingAcademicYear}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: updatingAcademicYear ? 'rgba(30, 58, 95, 0.6)' : 'var(--color-navy)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: updatingAcademicYear ? 'not-allowed' : 'pointer',
            }}
          >
            {updatingAcademicYear ? (
              <>
                <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Updating...
              </>
            ) : (
              <>
                <Calendar size={16} />
                Update Academic Year
              </>
            )}
          </button>
        </div>

        {/* Academic Years History */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)' }}>
              Academic Years History
            </h3>
            <button
              onClick={() => setShowAddYear(!showAddYear)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: 'white',
                color: 'var(--color-navy)',
                border: '1.5px solid var(--color-navy)',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Plus size={16} />
              Add New Year
            </button>
          </div>

          {/* Add New Year Form */}
          {showAddYear && (
            <div
              style={{
                backgroundColor: '#F9FAFB',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1rem',
                border: '1px solid #E5E7EB',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                    Year
                  </label>
                  <input
                    type="text"
                    value={newYearForm.year}
                    onChange={(e) => setNewYearForm({ ...newYearForm, year: e.target.value })}
                    placeholder="2026-27"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #D1D5DB',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={newYearForm.startDate}
                    onChange={(e) => setNewYearForm({ ...newYearForm, startDate: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #D1D5DB',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    value={newYearForm.endDate}
                    onChange={(e) => setNewYearForm({ ...newYearForm, endDate: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #D1D5DB',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={handleAddAcademicYear}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: 'var(--color-navy)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Add Year
                </button>
                <button
                  onClick={() => {
                    setShowAddYear(false);
                    setNewYearForm({ year: '', startDate: '', endDate: '' });
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: 'white',
                    color: '#6B7280',
                    border: '1px solid #D1D5DB',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Academic Years Table */}
          {academicYears.length > 0 ? (
            <div style={{ overflowX: 'auto', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead style={{ backgroundColor: '#F9FAFB' }}>
                  <tr>
                    <th
                      style={{
                        padding: '0.75rem 1rem',
                        textAlign: 'left',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#6B7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Year
                    </th>
                    <th
                      style={{
                        padding: '0.75rem 1rem',
                        textAlign: 'left',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#6B7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Start Date
                    </th>
                    <th
                      style={{
                        padding: '0.75rem 1rem',
                        textAlign: 'left',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#6B7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      End Date
                    </th>
                    <th
                      style={{
                        padding: '0.75rem 1rem',
                        textAlign: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#6B7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {academicYears.map((year, idx) => (
                    <tr key={idx} style={{ borderTop: '1px solid #E5E7EB' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{year.year}</td>
                      <td style={{ padding: '0.75rem 1rem', color: '#6B7280' }}>
                        {year.startDate ? new Date(year.startDate).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#6B7280' }}>
                        {year.endDate ? new Date(year.endDate).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        {year.isCurrent ? (
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '0.25rem 0.75rem',
                              backgroundColor: '#ECFDF5',
                              color: '#065F46',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                            }}
                          >
                            Current
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              style={{
                padding: '2rem',
                textAlign: 'center',
                color: '#9CA3AF',
                backgroundColor: '#F9FAFB',
                borderRadius: '8px',
                border: '1px dashed #D1D5DB',
              }}
            >
              <p>No academic years added yet. Click "Add New Year" to get started.</p>
            </div>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div
        style={{
          marginTop: '2rem',
          padding: '1.5rem',
          background: '#e8f4f8',
          borderRadius: '8px',
          borderLeft: '4px solid var(--color-navy)',
          color: 'var(--color-navy)',
        }}
      >
        <p style={{ margin: '0.5rem 0', fontSize: '0.95rem' }}>
          <strong>💡 Tip:</strong> Changes to institution settings will immediately reflect across all pages including timetables, emails, and student portals.
        </p>
      </div>
    </div>
  );
};

export default InstitutionSettings;
