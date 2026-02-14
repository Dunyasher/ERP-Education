import { useQuery } from 'react-query';
import api from '../../utils/api';
import { Users, DollarSign, FileText, TrendingUp, GraduationCap, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AccountantDashboard = () => {
  const navigate = useNavigate();

  // Fetch dashboard stats
  const { data: stats, isLoading } = useQuery('accountantStats', async () => {
    const response = await api.get('/dashboard');
    return response.data;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const quickActions = [
    {
      title: 'Manage Students',
      description: 'Record student data and track admissions',
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      hoverColor: 'hover:from-blue-600 hover:to-blue-700',
      onClick: () => navigate('/accountant/students')
    },
    {
      title: 'Fee Management',
      description: 'Record fees and view payment history',
      icon: DollarSign,
      color: 'from-green-500 to-green-600',
      hoverColor: 'hover:from-green-600 hover:to-green-700',
      onClick: () => navigate('/accountant/fees')
    },
    {
      title: 'Fee Reports',
      description: 'View complete fee history and reports',
      icon: FileText,
      color: 'from-purple-500 to-purple-600',
      hoverColor: 'hover:from-purple-600 hover:to-purple-700',
      onClick: () => navigate('/accountant/reports')
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Accountant Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage student data, admissions, and fee records
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card-hover bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-300">Total Students</p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-2">
                {stats?.students || 0}
              </p>
            </div>
            <GraduationCap className="w-12 h-12 text-blue-600 dark:text-blue-300" />
          </div>
        </div>

        <div className="card-hover bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-300">Total Fees Collected</p>
              <p className="text-3xl font-bold text-green-900 dark:text-green-100 mt-2">
                ${stats?.totalFeesCollected?.toLocaleString() || 0}
              </p>
            </div>
            <DollarSign className="w-12 h-12 text-green-600 dark:text-green-300" />
          </div>
        </div>

        <div className="card-hover bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 dark:text-purple-300">Pending Fees</p>
              <p className="text-3xl font-bold text-purple-900 dark:text-purple-100 mt-2">
                ${stats?.pendingFees?.toLocaleString() || 0}
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-purple-600 dark:text-purple-300" />
          </div>
        </div>

        <div className="card-hover bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600 dark:text-orange-300">Today's Admissions</p>
              <p className="text-3xl font-bold text-orange-900 dark:text-orange-100 mt-2">
                {stats?.todayAdmissions || 0}
              </p>
            </div>
            <Calendar className="w-12 h-12 text-orange-600 dark:text-orange-300" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={action.onClick}
                className={`card-hover bg-gradient-to-br ${action.color} ${action.hoverColor} text-white p-6 text-left transition-all transform hover:scale-105`}
              >
                <Icon className="w-10 h-10 mb-4" />
                <h3 className="text-xl font-bold mb-2">{action.title}</h3>
                <p className="text-white/90 text-sm">{action.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Your recent student admissions and fee transactions will appear here.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccountantDashboard;

