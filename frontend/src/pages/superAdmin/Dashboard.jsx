import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  Building2, 
  Users, 
  DollarSign, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  CreditCard,
  BarChart3,
  PieChart,
  Activity,
  Plus,
  Settings,
  Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();

  const { data: dashboardData, isLoading, refetch } = useQuery(
    'superAdminDashboard',
    async () => {
      const response = await api.get('/super-admin/dashboard');
      return response.data;
    }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const { overview, admins, systemStats, revenue, subscriptions, alerts, recentActivity } = dashboardData || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Super Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Complete system overview and management
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/settings')}
          className="btn-primary flex items-center gap-2"
        >
          <Settings className="w-5 h-5" />
          Manage System
        </button>
      </div>

      {/* Alerts */}
      {alerts && (alerts.expiringSubscriptions > 0 || alerts.blockedColleges > 0 || alerts.blockedAdmins > 0) && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-yellow-400 mr-2" />
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                System Alerts
              </p>
              <ul className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                {alerts.expiringSubscriptions > 0 && (
                  <li>• {alerts.expiringSubscriptions} subscription(s) expiring soon</li>
                )}
                {alerts.blockedColleges > 0 && (
                  <li>• {alerts.blockedColleges} college(s) blocked</li>
                )}
                {alerts.blockedAdmins > 0 && (
                  <li>• {alerts.blockedAdmins} admin(s) blocked</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-100">Total Colleges</p>
              <p className="text-3xl font-bold mt-2">{overview?.totalColleges || 0}</p>
            </div>
            <Building2 className="w-8 h-8 text-blue-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-100">Active Colleges</p>
              <p className="text-3xl font-bold mt-2">{overview?.activeColleges || 0}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-100">Total Admins</p>
              <p className="text-3xl font-bold mt-2">{admins?.total || 0}</p>
            </div>
            <Users className="w-8 h-8 text-purple-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-100">Monthly Revenue</p>
              <p className="text-3xl font-bold mt-2">{formatCurrency(revenue?.thisMonth || 0)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-orange-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-indigo-100">Total Users</p>
              <p className="text-3xl font-bold mt-2">{systemStats?.totalStudents || 0}</p>
            </div>
            <Activity className="w-8 h-8 text-indigo-200" />
          </div>
        </div>
      </div>

      {/* College Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {overview?.activeColleges || 0}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Trial</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {overview?.trialColleges || 0}
              </p>
            </div>
            <Clock className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Expired</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                {overview?.expiredColleges || 0}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Blocked</p>
              <p className="text-2xl font-bold text-gray-600 dark:text-gray-400 mt-1">
                {overview?.blockedColleges || 0}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button
          onClick={() => navigate('/admin/settings')}
          className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
        >
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-primary-600" />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Manage Institutes</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">View all colleges</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/admin/settings')}
          className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
        >
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-primary-600" />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Manage Admins</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">View all admins</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/admin/settings')}
          className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
        >
          <div className="flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-primary-600" />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Subscriptions</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Manage plans</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/admin/settings')}
          className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
        >
          <div className="flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-primary-600" />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Payments</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">View revenue</p>
            </div>
          </div>
        </button>
      </div>

      {/* Subscription Plans Distribution */}
      {subscriptions && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <PieChart className="w-6 h-6 text-primary-600" />
            Subscription Plans Distribution
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Free</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {subscriptions.byPlan?.free || 0}
              </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Basic</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-300 mt-1">
                {subscriptions.byPlan?.basic || 0}
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Premium</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-300 mt-1">
                {subscriptions.byPlan?.premium || 0}
              </p>
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
              <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Enterprise</p>
              <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-300 mt-1">
                {subscriptions.byPlan?.enterprise || 0}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Expiring Subscriptions */}
      {subscriptions?.expiring && subscriptions.expiring.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
            Expiring Subscriptions ({subscriptions.expiring.length})
          </h2>
          <div className="space-y-2">
            {subscriptions.expiring.slice(0, 5).map((college) => (
              <div
                key={college.id}
                className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{college.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {college.plan} plan • Expires in {college.daysRemaining} days
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/admin/settings?institute=${college.id}`)}
                  className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
                >
                  Renew
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Statistics */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary-600" />
          System Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Students</p>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-300 mt-1">
              {systemStats?.totalStudents || 0}
            </p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <p className="text-sm font-medium text-green-600 dark:text-green-400">Total Teachers</p>
            <p className="text-2xl font-bold text-green-900 dark:text-green-300 mt-1">
              {systemStats?.totalTeachers || 0}
            </p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Total Courses</p>
            <p className="text-2xl font-bold text-purple-900 dark:text-purple-300 mt-1">
              {systemStats?.totalCourses || 0}
            </p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
            <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Total Expenses</p>
            <p className="text-2xl font-bold text-orange-900 dark:text-orange-300 mt-1">
              {systemStats?.totalExpenses || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {recentActivity?.newColleges && recentActivity.newColleges.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary-600" />
            Recent Activity
          </h2>
          <div className="space-y-2">
            {recentActivity.newColleges.map((college) => (
              <div
                key={college.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{college.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {college.type} • Created {new Date(college.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/admin/settings?institute=${college.id}`)}
                  className="px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 text-sm flex items-center gap-1"
                >
                  <Eye className="w-4 h-4" />
                  View
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;

