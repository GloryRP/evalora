import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AlertTriangle } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const ChangePassword = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const isForced = user?.isFirstLogin;

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

  const passwordStrength = getPasswordStrength(formData.newPassword);
  const passwordsMatch = formData.newPassword && formData.confirmPassword && 
                         formData.newPassword === formData.confirmPassword;
  const passwordsDontMatch = formData.confirmPassword && 
                            formData.newPassword !== formData.confirmPassword;

  const canSubmit = formData.currentPassword && 
                   formData.newPassword && 
                   formData.confirmPassword &&
                   passwordsMatch &&
                   passwordStrength.strength === 100;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!canSubmit) return;

    setLoading(true);
    try {
      await api.patch('/auth/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword
      });

      toast.success('Password updated successfully');

      // If forced change, update user context and navigate to dashboard
      if (isForced) {
        setUser(prev => ({ ...prev, isFirstLogin: false }));
        const roleRoutes = {
          admin: '/admin/dashboard',
          examcell: '/examcell/dashboard',
          faculty: '/faculty/dashboard',
          student: '/student/dashboard',
          hod: '/hod/dashboard',
          principal: '/principal/dashboard'
        };
        navigate(roleRoutes[user.role] || '/', { replace: true });
      } else {
        navigate('/profile');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--color-bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '40px',
        width: '100%',
        maxWidth: '440px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
      }}>
        {/* Forced change banner */}
        {isForced && (
          <div style={{
            backgroundColor: '#FFF7ED',
            border: '1px solid #FCD34D',
            borderRadius: '8px',
            padding: '14px 16px',
            marginBottom: '24px',
            display: 'flex',
            gap: '10px'
          }}>
            <AlertTriangle size={18} style={{ color: '#D97706', flexShrink: 0, marginTop: '1px' }} />
            <span style={{
              fontWeight: 500,
              fontSize: '0.875rem',
              color: '#92400E'
            }}>
              For security, please change your default password before continuing.
            </span>
          </div>
        )}

        {/* Page Title */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.75rem',
            fontWeight: 700,
            color: 'var(--color-navy)',
            marginBottom: '8px'
          }}>
            Change Password
          </h1>
          <div style={{
            width: '48px',
            height: '3px',
            backgroundColor: 'var(--color-gold)',
            margin: '0 auto'
          }} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Current Password */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--color-text-secondary)',
              marginBottom: '8px'
            }}>
              Current Password
            </label>
            <input
              type="password"
              value={formData.currentPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
              placeholder="Enter current password"
              style={{
                width: '100%',
                padding: '14px 0',
                fontSize: '1rem',
                color: 'var(--color-navy)',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: '2px solid #E5E7EB',
                outline: 'none',
                fontFamily: 'var(--font-body)',
                transition: 'border-color 200ms ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => { e.target.style.borderBottomColor = 'var(--color-gold)'; }}
              onBlur={(e) => { e.target.style.borderBottomColor = '#E5E7EB'; }}
            />
          </div>

          {/* New Password */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--color-text-secondary)',
              marginBottom: '8px'
            }}>
              New Password
            </label>
            <input
              type="password"
              value={formData.newPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
              placeholder="At least 8 characters"
              style={{
                width: '100%',
                padding: '14px 0',
                fontSize: '1rem',
                color: 'var(--color-navy)',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: '2px solid #E5E7EB',
                outline: 'none',
                fontFamily: 'var(--font-body)',
                transition: 'border-color 200ms ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => { e.target.style.borderBottomColor = 'var(--color-gold)'; }}
              onBlur={(e) => { e.target.style.borderBottomColor = '#E5E7EB'; }}
            />
            
            {/* Password Strength Indicator */}
            {formData.newPassword && (
              <div style={{ marginTop: '8px' }}>
                <div style={{
                  width: '100%',
                  height: '4px',
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
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--color-text-secondary)',
              marginBottom: '8px'
            }}>
              Confirm New Password
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              placeholder="Re-enter new password"
              style={{
                width: '100%',
                padding: '14px 0',
                fontSize: '1rem',
                color: 'var(--color-navy)',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: '2px solid #E5E7EB',
                outline: 'none',
                fontFamily: 'var(--font-body)',
                transition: 'border-color 200ms ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => { e.target.style.borderBottomColor = 'var(--color-gold)'; }}
              onBlur={(e) => { e.target.style.borderBottomColor = '#E5E7EB'; }}
            />
            
            {/* Match Indicator */}
            {formData.confirmPassword && (
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!canSubmit || loading}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: canSubmit && !loading ? 'var(--color-navy)' : '#9CA3AF',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: canSubmit && !loading ? 'pointer' : 'not-allowed',
              marginTop: '8px',
              transition: 'all 150ms ease',
              fontFamily: 'var(--font-body)'
            }}
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;