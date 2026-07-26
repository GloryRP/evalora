/**
 * ExamCell Dashboard — Revamped
 * Overview of exam automation system with stats, upcoming activities, and agent logs
 */
import { useState, useEffect } from 'react';
import { FileText, Building2, Play, Clock, Activity, Cpu, ArrowUpRight } from 'lucide-react';
import api from '../../lib/api';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import Badge from '../../components/ui/Badge';
import { Link } from 'react-router-dom';

const ExamCellDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentRuns, setRecentRuns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [examsRes, hallsRes, runsRes] = await Promise.all([
        api.get('/examcell/exams'),
        api.get('/examcell/halls'),
        api.get('/examcell/agents/runs'),
      ]);

      setStats({
        totalExams: examsRes.data.count,
        scheduledExams: examsRes.data.data.filter(e => e.status === 'scheduled').length,
        totalHalls: hallsRes.data.count,
        totalRuns: runsRes.data.count,
      });

      setRecentRuns(runsRes.data.data.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Exams', value: stats?.totalExams || 0, icon: FileText, color: 'indigo', link: '/examcell/exams' },
    { label: 'Scheduled', value: stats?.scheduledExams || 0, icon: Clock, color: 'emerald', link: '/examcell/timetable' },
    { label: 'Agent Runs', value: stats?.totalRuns || 0, icon: Play, color: 'navy', link: '/examcell/agent-logs' },
  ];

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'completed': return 'emerald';
      case 'running': return 'gold';
      case 'failed': return 'red';
      default: return 'navy';
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <LoadingSkeleton count={4} />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-[#1A1A1A] mb-1.5">
          Exam Cell Dashboard
        </h1>
        <p className="text-[#5C5C5C]">
          Orchestrate automated exams, classroom seating arrangements, and invigilation pipelines.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Link key={idx} to={stat.link} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md hover:border-gray-200 transition group">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-gray-50 text-gray-700 transition group-hover:bg-[#1E3A5F]/10 group-hover:text-[#1E3A5F]`}>
                  <Icon size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#1A1A1A] tracking-tight">{stat.value}</div>
                  <div className="text-xs font-semibold text-[#5C5C5C] uppercase tracking-wider mt-0.5">{stat.label}</div>
                </div>
              </div>
              <ArrowUpRight size={18} className="text-gray-300 group-hover:text-[#C9A227] transition" />
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Agent Runs */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-display font-bold text-[#1A1A1A] text-lg flex items-center gap-2">
              <Cpu size={18} className="text-[#C9A227]" /> Recent Agent Runs
            </h2>
            <Link to="/examcell/agent-logs" className="text-xs font-semibold text-[#1E3A5F] hover:underline">
              View All Logs
            </Link>
          </div>
          
          {recentRuns.length === 0 ? (
            <div className="p-8 text-center text-[#5C5C5C]">
              No agent execution records found. Start the AI solver to view progress.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#5C5C5C] uppercase tracking-wider">Agent Type</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#5C5C5C] uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#5C5C5C] uppercase tracking-wider">Triggered By</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#5C5C5C] uppercase tracking-wider">Execution Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentRuns.map((run) => (
                    <tr key={run._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[#1A1A1A] capitalize">
                        {run.agentType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getStatusBadgeVariant(run.status)}>{run.status}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#5C5C5C]">
                        {run.triggeredBy}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-[#5C5C5C]">
                        <div className="font-semibold">{new Date(run.createdAt).toLocaleDateString()}</div>
                        <div className="text-gray-400 mt-0.5">{run.executionTimeMs ? `${(run.executionTimeMs / 1000).toFixed(2)}s` : 'In Progress'}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Operations Guide */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
          <div>
            <h2 className="font-display font-bold text-[#1A1A1A] text-lg flex items-center gap-2 mb-4">
              <Activity size={18} className="text-[#C9A227]" /> Quick Operations
            </h2>
            <div className="space-y-4">
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-50 text-[#1E3A5F] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                <div>
                  <h4 className="text-sm font-semibold text-[#1A1A1A]">Exams Scheduling</h4>
                  <p className="text-xs text-[#5C5C5C] mt-0.5">Configure start date, duration, and generate the exam timetable.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-50 text-[#1E3A5F] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                <div>
                  <h4 className="text-sm font-semibold text-[#1A1A1A]">Seating Allotments</h4>
                  <p className="text-xs text-[#5C5C5C] mt-0.5">Generate anti-malpractice seating arrangements on physical benches.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-50 text-[#1E3A5F] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                <div>
                  <h4 className="text-sm font-semibold text-[#1A1A1A]">Invigilator Duties</h4>
                  <p className="text-xs text-[#5C5C5C] mt-0.5">Assign faculty supervisors to populated halls without scheduling clashes.</p>
                </div>
              </div>
            </div>
          </div>
          <Link to="/examcell/run-agents" className="w-full py-3 bg-[#1E3A5F] hover:bg-[#152B45] text-white rounded-xl text-center text-sm font-semibold transition mt-6 block shadow-sm shadow-blue-100">
            Launch AI Orchestrator
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ExamCellDashboard;
