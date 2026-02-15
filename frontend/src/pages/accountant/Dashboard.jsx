import { useQuery } from 'react-query';
import api from '../../utils/api';
import { Users, DollarSign, FileText, TrendingUp, GraduationCap, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AccountantDashboard = () => {
  const navigate = useNavigate();

  // Fetch dashboard stats
  const { data: stats, isLoading } = useQuery('accountantStats', async () => {
    const response = await api.get('/accountant/dashboard');
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
    <div className="space-y-3 xs:space-y-4 sm:space-y-6 p-2 xs:p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 xs:mb-2">
          Accountant Dashboard
        </h1>
        <p className="text-xs xs:text-sm text-gray-600 dark:text-gray-400">
          Manage student data, admissions, and fee records
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 xs:gap-4 sm:gap-6">
        <div className="card-hover bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs xs:text-sm font-medium text-blue-600 dark:text-blue-300">Total Students</p>
              <p className="text-xl xs:text-2xl sm:text-3xl font-bold text-blue-900 dark:text-blue-100 mt-1 xs:mt-2 truncate">
                {stats?.students || 0}
              </p>
            </div>
            <GraduationCap className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 text-blue-600 dark:text-blue-300 flex-shrink-0 ml-2" />
          </div>
        </div>

        <div className="card-hover bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs xs:text-sm font-medium text-green-600 dark:text-green-300">Total Fees Collected</p>
              <p className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-bold text-green-900 dark:text-green-100 mt-1 xs:mt-2 truncate">
                Rs. {stats?.totalFeesCollected?.toLocaleString() || 0}
              </p>
            </div>
            <DollarSign className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 text-green-600 dark:text-green-300 flex-shrink-0 ml-2" />
          </div>
        </div>

        <div className="card-hover bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs xs:text-sm font-medium text-purple-600 dark:text-purple-300">Pending Fees</p>
              <p className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-bold text-purple-900 dark:text-purple-100 mt-1 xs:mt-2 truncate">
                Rs. {stats?.pendingFees?.toLocaleString() || 0}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 text-purple-600 dark:text-purple-300 flex-shrink-0 ml-2" />
          </div>
        </div>

        <div className="card-hover bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs xs:text-sm font-medium text-orange-600 dark:text-orange-300">Today's Admissions</p>
              <p className="text-xl xs:text-2xl sm:text-3xl font-bold text-orange-900 dark:text-orange-100 mt-1 xs:mt-2 truncate">
                {stats?.todayAdmissions || 0}
              </p>
            </div>
            <Calendar className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 text-orange-600 dark:text-orange-300 flex-shrink-0 ml-2" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3 xs:mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 xs:gap-4 sm:gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={action.onClick}
                className={`card-hover bg-gradient-to-br ${action.color} ${action.hoverColor} text-white p-4 xs:p-5 sm:p-6 text-left transition-all transform hover:scale-105`}
              >
                <Icon className="w-8 h-8 xs:w-10 xs:h-10 mb-3 xs:mb-4" />
                <h3 className="text-base xs:text-lg sm:text-xl font-bold mb-1 xs:mb-2">{action.title}</h3>
                <p className="text-white/90 text-xs xs:text-sm">{action.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xs:gap-4 sm:gap-6">
        <div className="card-hover bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900 dark:to-indigo-800">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs xs:text-sm font-medium text-indigo-600 dark:text-indigo-300">This Month's Collections</p>
              <p className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-bold text-indigo-900 dark:text-indigo-100 mt-1 xs:mt-2 truncate">
                Rs. {stats?.thisMonthCollections?.toLocaleString() || 0}
              </p>
            </div>
            <Calendar className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 text-indigo-600 dark:text-indigo-300 flex-shrink-0 ml-2" />
          </div>
        </div>

        <div className="card-hover bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900 dark:to-red-800">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs xs:text-sm font-medium text-red-600 dark:text-red-300">Students with Pending Fees</p>
              <p className="text-xl xs:text-2xl sm:text-3xl font-bold text-red-900 dark:text-red-100 mt-1 xs:mt-2 truncate">
                {stats?.studentsWithPendingFees || 0}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 text-red-600 dark:text-red-300 flex-shrink-0 ml-2" />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h2 className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3 xs:mb-4">Recent Activity</h2>
        <div className="space-y-3 xs:space-y-4">
          <p className="text-xs xs:text-sm text-gray-600 dark:text-gray-400">
            Your recent student admissions and fee transactions will appear here.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccountantDashboard;

