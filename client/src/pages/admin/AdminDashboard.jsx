/**
 * Admin Dashboard - Landing page with quick stats
 */
import { useAuth } from '../../contexts/AuthContext';
import { GraduationCap, Users, BookOpen, Building2 } from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();

  const stats = [
    {
      icon: GraduationCap,
      label: 'Students',
      description: 'Manage student records and profiles',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: Users,
      label: 'Faculty',
      description: 'Manage faculty members and assignments',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      icon: BookOpen,
      label: 'Subjects',
      description: 'Manage course subjects and credits',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      icon: Building2,
      label: 'Departments',
      description: 'Manage academic departments',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-display font-bold text-[#1A1A1A] mb-2">
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-[#5C5C5C]">
            Manage your institution's examination system from one place
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className={`${stat.bgColor} ${stat.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                  <Icon size={24} />
                </div>
                <h3 className="text-lg font-semibold text-[#1A1A1A] mb-1">
                  {stat.label}
                </h3>
                <p className="text-sm text-[#5C5C5C]">{stat.description}</p>
              </div>
            );
          })}
        </div>

        {/* Quick Info */}
        <div className="mt-8 bg-gradient-to-r from-[#1E3A5F] to-[#2A4A70] rounded-xl p-8 text-white">
          <h2 className="text-2xl font-display font-semibold mb-4">
            System Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-blue-200 text-sm mb-1">Department</p>
              <p className="text-lg font-medium">{user?.department}</p>
            </div>
            <div>
              <p className="text-blue-200 text-sm mb-1">Username</p>
              <p className="text-lg font-medium">{user?.username}</p>
            </div>
            <div>
              <p className="text-blue-200 text-sm mb-1">Access Level</p>
              <p className="text-lg font-medium">Administrator</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
