/**
 * Institution Settings Page
 * Admin configures institution branding and details
 */
import { useState, useEffect } from 'react';
import { Save, Loader } from 'lucide-react';
import api from '../../lib/api';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

const InstitutionSettings = () => {
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

  useEffect(() => {
    fetchConfig();
  }, []);

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
