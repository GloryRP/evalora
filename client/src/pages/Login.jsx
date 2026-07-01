/**
 * Login Page - Minimal, content-first design
 * Single calm surface with typography-focused layout
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GraduationCap, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userData = await login(formData.username, formData.password);
      toast.success(`Welcome back, ${userData.name}!`, {
        style: { background: 'var(--color-navy)', color: '#fff' },
      });
      const roleRoutes = {
        admin: '/admin/dashboard',
        examcell: '/examcell/dashboard',
        faculty: '/faculty/dashboard',
        student: '/student/dashboard',
        hod: '/hod/dashboard',
        principal: '/principal/dashboard',
      };
      navigate(roleRoutes[userData.role] || '/', { replace: true });
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Invalid credentials. Please try again.', {
        style: { background: 'var(--color-error)', color: '#fff' },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-bg)',
        fontFamily: 'var(--font-body)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* ── Top-left logo lockup ── */}
      <div
        style={{
          position: 'fixed',
          top: '24px',
          left: '28px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 10,
        }}
      >
        <GraduationCap size={18} color="var(--color-navy)" strokeWidth={2} />
        <span
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--color-navy)',
            fontSize: '1.1rem',
            fontWeight: 600,
            letterSpacing: '-0.01em',
          }}
        >
          Vidyā
        </span>
      </div>

      {/* ── Main centered area ── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 24px',
        }}
      >
        {/* Content block — fixed width, truly centered */}
        <div
          style={{
            width: '100%',
            maxWidth: '400px',
            animation: 'fadeInUp 0.3s ease-out forwards',
          }}
        >
          {/* ── Headline ── */}
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2.6rem',
              fontWeight: 700,
              color: 'var(--color-navy)',
              lineHeight: 1.1,
              marginBottom: '10px',
            }}
          >
            Sign in
          </h1>

          {/* Gold underline — the single signature detail */}
          <div
            style={{
              width: '48px',
              height: '3px',
              backgroundColor: 'var(--color-gold)',
              borderRadius: '2px',
              marginBottom: '14px',
            }}
          />

          {/* Subtitle */}
          <p
            style={{
              fontSize: '0.9rem',
              color: 'var(--color-text-secondary)',
              marginBottom: '40px',
            }}
          >
            Enter your credentials to access the system
          </p>

          {/* ── Form ── */}
          <form onSubmit={handleSubmit}>

            {/* Username */}
            <div style={{ marginBottom: '32px' }}>
              <label
                htmlFor="username"
                style={{
                  display: 'block',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: focusedField === 'username'
                    ? 'var(--color-gold)'
                    : 'var(--color-text-secondary)',
                  marginBottom: '8px',
                  transition: 'color 200ms ease',
                }}
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                onFocus={() => setFocusedField('username')}
                onBlur={() => setFocusedField(null)}
                placeholder="USN or Employee ID"
                required
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: `1.5px solid ${focusedField === 'username' ? 'var(--color-gold)' : '#D1D1D1'}`,
                  outline: 'none',
                  padding: '8px 0',
                  fontSize: '1rem',
                  color: 'var(--color-text)',
                  fontFamily: 'var(--font-body)',
                  transition: 'border-color 200ms ease',
                  boxSizing: 'border-box',
                }}
              />
              <p
                style={{
                  fontSize: '0.73rem',
                  color: 'var(--color-text-secondary)',
                  marginTop: '6px',
                }}
              >
                Students use USN · Staff use Employee ID
              </p>
            </div>

            {/* Password */}
            <div style={{ marginBottom: '40px' }}>
              <label
                htmlFor="password"
                style={{
                  display: 'block',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: focusedField === 'password'
                    ? 'var(--color-gold)'
                    : 'var(--color-text-secondary)',
                  marginBottom: '8px',
                  transition: 'color 200ms ease',
                }}
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                placeholder="Enter your password"
                required
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: `1.5px solid ${focusedField === 'password' ? 'var(--color-gold)' : '#D1D1D1'}`,
                  outline: 'none',
                  padding: '8px 0',
                  fontSize: '1rem',
                  color: 'var(--color-text)',
                  fontFamily: 'var(--font-body)',
                  transition: 'border-color 200ms ease',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Sign In button */}
            <button
              type="submit"
              disabled={loading}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = 'var(--color-navy-light)';
                  const arrow = e.currentTarget.querySelector('.btn-arrow');
                  if (arrow) arrow.style.transform = 'translateX(4px)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-navy)';
                const arrow = e.currentTarget.querySelector('.btn-arrow');
                if (arrow) arrow.style.transform = 'translateX(0)';
              }}
              style={{
                width: '100%',
                backgroundColor: 'var(--color-navy)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                padding: '14px 20px',
                fontSize: '0.95rem',
                fontWeight: 600,
                fontFamily: 'var(--font-body)',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'background-color 150ms ease',
                opacity: loading ? 0.7 : 1,
                boxSizing: 'border-box',
              }}
            >
              {loading ? 'Signing in...' : (
                <>
                  <span>Sign In</span>
                  <ArrowRight
                    size={17}
                    className="btn-arrow"
                    style={{ transition: 'transform 150ms ease' }}
                  />
                </>
              )}
            </button>

            {/* Helper text */}
            <p
              style={{
                textAlign: 'center',
                fontSize: '0.73rem',
                color: 'var(--color-text-secondary)',
                marginTop: '20px',
              }}
            >
              Authorized personnel only. Contact your administrator for access.
            </p>
          </form>
        </div>
      </div>

      {/* ── Bottom institution credit ── */}
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: '0.62rem',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#BBBBBB',
          fontFamily: 'var(--font-body)',
          pointerEvents: 'none',
        }}
      >
        PES Institute of Technology and Management
      </div>

      {/* Fade-up animation */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>
    </div>
  );
};

export default Login;