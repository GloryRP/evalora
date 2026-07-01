/**
 * Placeholder Dashboard - Branded empty state for non-admin roles
 */
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Users, 
  BookOpen, 
  UserCheck, 
  Building2, 
  LogOut,
  GraduationCap 
} from 'lucide-react';
import Button from '../components/ui/Button';

const PlaceholderDashboard = ({ roleTitle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleIcons = {
    'Exam Cell': FileText,
    'Faculty': Users,
    'Student': BookOpen,
    'Head of Department': UserCheck,
    'Principal': Building2,
  };

  const roleDescriptions = {
    'Exam Cell': 'Your exam scheduling, question bank management, and invigilator assignments will appear here.',
    'Faculty': 'Your question paper submissions, evaluation dashboard, and grade management will appear here.',
    'Student': 'Your exam timetable, hall ticket downloads, and results will appear here.',
    'Head of Department': 'Your department analytics, approval workflows, and performance reports will appear here.',
    'Principal': 'System-wide oversight, institutional reports, and critical approvals will appear here.',
  };

  const RoleIcon = roleIcons[roleTitle] || GraduationCap;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAFAF8] to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 lg:p-12 max-w-2xl w-full text-center">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <GraduationCap size={32} className="text-[#1E3A5F]" />
          <h1 className="text-2xl font-display font-bold text-[#1E3A5F]">Vidyā</h1>
        </div>

        {/* Role Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 bg-[#1E3A5F]/10 rounded-full mb-6">
          <RoleIcon size={40} className="text-[#1E3A5F]" />
        </div>

        {/* Welcome Message */}
        <h2 className="text-3xl lg:text-4xl font-display font-bold text-[#1A1A1A] mb-3">
          Welcome, {user?.name?.split(' ')[0]}
        </h2>
        <p className="text-xl text-[#5C5C5C] mb-8">{roleTitle} Dashboard</p>

        {/* User Info Card */}
        <div className="bg-gradient-to-r from-[#1E3A5F] to-[#2A4A70] rounded-xl p-6 text-white mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div>
              <p className="text-blue-200 text-sm mb-1">Role</p>
              <p className="font-semibold">{user?.role?.toUpperCase()}</p>
            </div>
            <div>
              <p className="text-blue-200 text-sm mb-1">Username</p>
              <p className="font-semibold">{user?.username}</p>
            </div>
            <div>
              <p className="text-blue-200 text-sm mb-1">Department</p>
              <p className="font-semibold">{user?.department}</p>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-8">
          <p className="text-[#5C5C5C] leading-relaxed">
            {roleDescriptions[roleTitle]}
          </p>
          <p className="text-sm text-amber-800 mt-3 font-medium">
            Features for this role will be available in future phases.
          </p>
        </div>

        {/* Logout Button */}
        <Button
          onClick={handleLogout}
          variant="danger"
          className="w-full sm:w-auto flex items-center justify-center gap-2"
        >
          <LogOut size={18} />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default PlaceholderDashboard;
