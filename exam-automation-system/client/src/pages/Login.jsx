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
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userData = await login(formData.username, formData.password);
      
      toast.success(`Welcome back, ${userData.name}!`, {
        style: {
          background: 'var(--color-navy)',
          color: '#fff',
        },
      });
      
      const roleRoutes = {
        admin: '/admin/dashboard',
        examcell: '/examcell/dashboard',
        faculty: '/faculty/dashboard',
        student: '/student/dashboard',
        hod: '/hod/dashboard',
        principal: '/principal/dashboard',
      };

      const redirectTo = roleRoutes[userData.role] || '/';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      toast.error(err, {
        style: {
          background: 'var(--color-error)',
          color: '#fff',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
      {/* Top-left logo lockup */}
      <div className="fixed top-6 left-6 flex items-center gap-2 z-10">
        <GraduationCap size={18} className="text-[var(--color-navy)]" strokeWidth={2} />
        <span className="text-lg font-display font-semibold text-[var(--color-navy)]">
          Vidyā
        </span>
      </div>

      {/* Centered content with fade-in animation */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div 
          className="w-full max-w-[420px] animate-fadeInUp"
          style={{
            animation: 'fadeInUp 0.3s ease-out forwards'
          }}
        >
          {/* Headline with gold underline */}
          <div className="mb-10">
            <h1 className="text-4xl font-display font-bold text-[var(--color-navy)] mb-3">
              Sign in
            </h1>
            {/* Gold accent underline - the signature visual detail */}
            <div className="w-12 h-[3px] bg-[var(--color-gold)]" />
            <p className="text-sm text-[var(--color-text-secondary)] mt-4">
              Enter your credentials to access the system
            </p>
          </div>

          {/* Form - no card, direct on background */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Username field */}
            <div className="relative">
              <label
                htmlFor="username"
                className={`block text-xs uppercase tracking-wide font-medium mb-3 transition-colors duration-200 ${
                  focusedField === 'username' 
                    ? 'text-[var(--color-gold)]' 
                    : 'text-[var(--color-text-secondary)]'
                }`}
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
                required
                className="w-full bg-transparent border-0 border-b-[1.5px] border-gray-300 px-0 py-2.5 text-[var(--color-text)] font-body focus:outline-none focus:border-[var(--color-gold)] transition-colors duration-200 placeholder:text-gray-400"
                placeholder="USN or Employee ID"
              />
              <p className="text-xs text-[var(--color-text-secondary)] mt-2">
                Students use USN, staff use Employee ID
              </p>
            </div>

            {/* Password field */}
            <div className="relative">
              <label
                htmlFor="password"
                className={`block text-xs uppercase tracking-wide font-medium mb-3 transition-colors duration-200 ${
                  focusedField === 'password' 
                    ? 'text-[var(--color-gold)]' 
                    : 'text-[var(--color-text-secondary)]'
                }`}
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
                required
                className="w-full bg-transparent border-0 border-b-[1.5px] border-gray-300 px-0 py-2.5 text-[var(--color-text)] font-body focus:outline-none focus:border-[var(--color-gold)] transition-colors duration-200 placeholder:text-gray-400"
                placeholder="Enter your password"
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--color-navy)] hover:bg-[var(--color-navy-light)] text-white py-3.5 px-6 rounded-md font-medium flex items-center justify-center gap-3 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)] focus:ring-offset-2 group mt-10"
            >
              {loading ? (
                'Signing in...'
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight 
                    size={18} 
                    className="transition-transform duration-150 group-hover:translate-x-1" 
                  />
                </>
              )}
            </button>

            {/* Helper text */}
            <p className="text-xs text-center text-[var(--color-text-secondary)] mt-6">
              Authorized personnel only. Contact your administrator for access.
            </p>
          </form>
        </div>
      </div>

      {/* Bottom institution credit */}
      <div className="fixed bottom-6 left-0 right-0 text-center">
        <p className="text-xs uppercase tracking-widest text-[var(--color-text-secondary)]">
          PES Institute of Technology and Management
        </p>
      </div>

      {/* Inline keyframe animation */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default Login;
