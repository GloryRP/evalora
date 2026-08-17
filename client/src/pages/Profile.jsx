import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Edit2, Key, Shield, Calendar, CheckCircle } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  
  const [profileData, setProfileData] = useState({
    email: user?.email || '',
    phone: user?.phone || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Password strength calculation
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    if (password.length < 6) {
      return { strength: 33, label: 'Weak', color: '#DC2626' };
    } else if (password.length < 8 || !/^(?=.*[A-Za-z])(?=.*\d)/.test(password)) {
      return { strength: 66, label: 'Fair', color: '#D97706' };
    } else {
      return { strength: 100, label: 'Strong', color: '#059669' };
    }
  };

  const passwordStrength = getPasswordStrength(passwordData.newPassword);
  const passwordsMatch = passwordData.newPassword && passwordData.confirmPassword && 
                         passwordData.newPassword === passwordData.confirmPassword;
  const passwordsDontMatch = passwordData.confirmPassword && 
                            passwordData.newPassword !== passwordData.confirmPassword;

  const canChangePassword = passwordData.currentPassword && 
                           passwordData.newPassword && 
                           passwordData.confirmPassword &&
                           passwordsMatch &&
                           passwordStrength.strength === 100;

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await api.patch('/auth/update-profile', profileData);
      toast.success('Profile updated successfully');
      setEditMode(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (!canChangePassword) return;

    setChangingPassword(true);
    try {
      await api.patch('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword
      });

      toast.success('Password updated successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.75rem',
          fontWeight: 700,
          color: 'var(--color-navy)',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <User size={24} style={{ color: 'var(--color-gold)' }} />
          Profile
        </h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Section 1: Personal Information */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          border: '1px solid #F0F0F0'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.1rem',
              fontWeight: 700,
              color: 'var(--color-navy)',
              margin: 0
            }}>
              Profile Information
            </h2>
            
            <button
              onClick={() => setEditMode(!editMode)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                backgroundColor: editMode ? '#F3F4F6' : 'var(--color-gold)',
                color: editMode ? 'var(--color-text)' : 'var(--color-navy)',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 150ms ease'
              }}
            >
              <Edit2 size={16} />
              {editMode ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          {!editMode ? (
            /* Read-only display */
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '6px'
                }}>
                  Full Name
                </label>
                <div style={{
                  fontSize: '1rem',
                  fontWeight: 500,
                  color: 'var(--color-navy)'
                }}>
                  {user?.name}
                </div>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '6px'
                }}>
                  {user?.role === 'student' ? 'USN' : user?.role === 'faculty' ? 'Employee ID' : 'Username'}
                </label>
                <div style={{
                  fontSize: '1rem',
                  fontWeight: 500,
                  color: 'var(--color-navy)'
                }}>
                  {user?.username}
                </div>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '6px'
                }}>
                  Role
                </label>
                <div style={{
                  fontSize: '1rem',
                  fontWeight: 500,
                  color: 'var(--color-navy)'
                }}>
                  {user?.role?.toUpperCase()}
                </div>
              </div>

              {user?.department && (
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: 'var(--color-text-secondary)',
                    marginBottom: '6px'
                  }}>
                    Department
                  </label>
                  <div style={{
                    fontSize: '1rem',
                    fontWeight: 500,
                    color: 'var(--color-navy)'
                  }}>
                    {user.department}
                  </div>
                </div>
              )}

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '6px'
                }}>
                  Email
                </label>
                <div style={{
                  fontSize: '1rem',
                  fontWeight: 500,
                  color: 'var(--color-navy)'
                }}>
                  {user?.email || 'Not provided'}
                </div>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '6px'
                }}>
                  Phone
                </label>
                <div style={{
                  fontSize: '1rem',
                  fontWeight: 500,
                  color: 'var(--color-navy)'
                }}>
                  {user?.phone || 'Not provided'}
                </div>
              </div>
            </div>
          ) : (
            /* Edit form */
            <form onSubmit={handleUpdateProfile}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px',
                marginBottom: '20px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: 'var(--color-text-secondary)',
                    marginBottom: '8px'
                  }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1.5px solid #E0E0E0',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 200ms ease'
                    }}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--color-gold)'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#E0E0E0'; }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: 'var(--color-text-secondary)',
                    marginBottom: '8px'
                  }}>
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1.5px solid #E0E0E0',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 200ms ease'
                    }}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--color-gold)'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#E0E0E0'; }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: loading ? '#9CA3AF' : 'var(--color-navy)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'background-color 150ms ease'
                  }}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Section 2: Change Password */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          border: '1px solid #F0F0F0'
        }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.1rem',
            fontWeight: 700,
            color: 'var(--color-navy)',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Key size={20} style={{ color: 'var(--color-gold)' }} />
            Change Password
          </h2>

          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Current Password */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: 'var(--color-text-secondary)',
                marginBottom: '8px'
              }}>
                Current Password
              </label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1.5px solid #E0E0E0',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 200ms ease'
                }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--color-gold)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#E0E0E0'; }}
              />
            </div>

            {/* New Password */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: 'var(--color-text-secondary)',
                marginBottom: '8px'
              }}>
                New Password
              </label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1.5px solid #E0E0E0',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 200ms ease'
                }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--color-gold)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#E0E0E0'; }}
              />
              
              {/* Password Strength Indicator */}
              {passwordData.newPassword && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{
                    width: '100%',
                    height: '3px',
                    backgroundColor: '#F3F4F6',
                    borderRadius: '2px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${passwordStrength.strength}%`,
                      height: '100%',
                      backgroundColor: passwordStrength.color,
                      transition: 'all 300ms ease'
                    }} />
                  </div>
                  <span style={{
                    fontSize: '0.72rem',
                    color: passwordStrength.color,
                    fontWeight: 600,
                    marginTop: '4px',
                    display: 'block'
                  }}>
                    {passwordStrength.label}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: 'var(--color-text-secondary)',
                marginBottom: '8px'
              }}>
                Confirm New Password
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1.5px solid #E0E0E0',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 200ms ease'
                }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--color-gold)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#E0E0E0'; }}
              />
              
              {/* Match Indicator */}
              {passwordData.confirmPassword && (
                <div style={{ marginTop: '6px' }}>
                  {passwordsMatch ? (
                    <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 500 }}>
                      ✓ Passwords match
                    </span>
                  ) : passwordsDontMatch ? (
                    <span style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: 500 }}>
                      ✗ Passwords do not match
                    </span>
                  ) : null}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!canChangePassword || changingPassword}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: canChangePassword && !changingPassword ? 'var(--color-navy)' : '#9CA3AF',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: canChangePassword && !changingPassword ? 'pointer' : 'not-allowed',
                transition: 'background-color 150ms ease'
              }}
            >
              {changingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Section 3: Account Info */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          border: '1px solid #F0F0F0'
        }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.1rem',
            fontWeight: 700,
            color: 'var(--color-navy)',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Shield size={20} style={{ color: 'var(--color-gold)' }} />
            Account Information
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: 'var(--color-text-secondary)',
                marginBottom: '6px'
              }}>
                Account Status
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <CheckCircle size={16} style={{ color: '#059669' }} />
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#059669'
                }}>
                  Active
                </span>
              </div>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: 'var(--color-text-secondary)',
                marginBottom: '6px'
              }}>
                Member Since
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Calendar size={16} style={{ color: 'var(--color-text-secondary)' }} />
                <span style={{
                  fontSize: '0.875rem',
                  color: 'var(--color-text)'
                }}>
                  {user?.createdAt ? formatDate(user.createdAt) : 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;