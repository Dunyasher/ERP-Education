import { useQuery } from 'react-query';
import api from '../../utils/api';
import { BookOpen, DollarSign, FileText, Calendar, User, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const navigate = useNavigate();

  // Fetch student dashboard stats
  const { data: stats, isLoading } = useQuery('studentStats', async () => {
    try {
      const response = await api.get('/dashboard/student');
      return response.data;
    } catch (error) {
      console.error('Error fetching student stats:', error);
      return {
        myCourses: [],
        pendingFees: 0,
        totalFees: 0,
        paidFees: 0,
        attendance: { present: 0, total: 0 }
      };
    }
  });

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

  const quickActions = [
    {
      title: 'My Courses',
      description: 'View enrolled courses',
      icon: BookOpen,
      color: 'from-blue-500 to-blue-600',
      hoverColor: 'hover:from-blue-600 hover:to-blue-700',
      onClick: () => navigate('/student/courses')
    },
    {
      title: 'My Fees',
      description: 'View fee details and payment history',
      icon: DollarSign,
      color: 'from-green-500 to-green-600',
      hoverColor: 'hover:from-green-600 hover:to-green-700',
      onClick: () => navigate('/student/fees')
    },
    {
      title: 'My Attendance',
      description: 'View attendance records',
      icon: Calendar,
      color: 'from-purple-500 to-purple-600',
      hoverColor: 'hover:from-purple-600 hover:to-purple-700',
      onClick: () => navigate('/student/attendance')
    }
  ];

  const attendancePercentage = stats?.attendance?.total > 0
    ? ((stats.attendance.present / stats.attendance.total) * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Student Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome! View your courses, fees, and attendance here.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                My Courses
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats?.myCourses?.length || 0}
              </p>
            </div>
            <div className="bg-blue-500 p-4 rounded-lg">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Fees
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {formatCurrency(stats?.totalFees || 0)}
              </p>
            </div>
            <div className="bg-green-500 p-4 rounded-lg">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Pending Fees
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {formatCurrency(stats?.pendingFees || 0)}
              </p>
            </div>
            <div className="bg-red-500 p-4 rounded-lg">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Attendance
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {attendancePercentage}%
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {stats?.attendance?.present || 0} / {stats?.attendance?.total || 0} days
              </p>
            </div>
            <div className="bg-purple-500 p-4 rounded-lg">
              <Calendar className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={action.onClick}
                className={`bg-gradient-to-br ${action.color} ${action.hoverColor} p-6 rounded-xl text-white text-left transition-all transform hover:scale-105 shadow-lg`}
              >
                <Icon className="w-8 h-8 mb-3" />
                <h3 className="text-xl font-bold mb-2">{action.title}</h3>
                <p className="text-white/80">{action.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* My Courses */}
      {stats?.myCourses && stats.myCourses.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            My Enrolled Courses
          </h2>
          <div className="space-y-4">
            {stats.myCourses.map((course, index) => (
              <div
                key={index}
                className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                      <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {course.name || 'Course Name'}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {course.category || 'Category'}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
                    Enrolled
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fee Summary */}
      {(stats?.totalFees > 0 || stats?.pendingFees > 0) && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Fee Summary
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-gray-700 dark:text-gray-300">Total Fees:</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {formatCurrency(stats?.totalFees || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <span className="text-gray-700 dark:text-gray-300">Paid:</span>
              <span className="font-bold text-green-600 dark:text-green-400">
                {formatCurrency(stats?.paidFees || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <span className="text-gray-700 dark:text-gray-300">Pending:</span>
              <span className="font-bold text-red-600 dark:text-red-400">
                {formatCurrency(stats?.pendingFees || 0)}
              </span>
            </div>
            {stats?.totalFees > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Payment Progress</span>
                  <span className="text-gray-700 dark:text-gray-300">
                    {((stats.paidFees / stats.totalFees) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-green-500 h-3 rounded-full transition-all duration-300"
                    style={{
                      width: `${(stats.paidFees / stats.totalFees) * 100}%`
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;

