import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  DollarSign, 
  TrendingUp, 
  AlertCircle,
  Building2,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  PieChart,
  Calendar,
  CreditCard,
  ShoppingBag,
  TrendingDown,
  BarChart3,
  Search
} from 'lucide-react';

const AdminDashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/admin');
      return response.data;
    }
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to students page with search query
      window.location.href = `/admin/students?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const statCards = [
    {
      title: 'Dues - Amount',
      value: stats?.duesCount || 0,
      amount: formatCurrency(stats?.duesAmount || 0),
      icon: CreditCard,
      color: 'bg-red-500',
      subtitle: `Amount: ${formatCurrency(stats?.duesAmount || 0)}`
    },
    {
      title: 'Total Income This Year',
      value: formatCurrency(stats?.totalIncomeThisYear || 0),
      icon: DollarSign,
      color: 'bg-cyan-500',
      subtitle: 'This year'
    },
    {
      title: 'Income This Month',
      value: formatCurrency(stats?.monthlyIncome || 0),
      icon: BarChart3,
      color: 'bg-green-500',
      subtitle: 'This month'
    },
    {
      title: 'Income Today',
      value: formatCurrency(stats?.todayIncome || 0),
      icon: PieChart,
      color: 'bg-blue-500',
      subtitle: 'Today'
    },
    {
      title: 'Profit This Month',
      value: formatCurrency(stats?.profitThisMonth || 0),
      icon: BarChart3,
      color: stats?.profitThisMonth >= 0 ? 'bg-green-500' : 'bg-red-500',
      subtitle: 'Income - Expenses'
    },
    {
      title: 'Total Expense This Year',
      value: formatCurrency(stats?.totalExpenseThisYear || 0),
      icon: TrendingUp,
      color: 'bg-red-500',
      subtitle: 'This year'
    },
    {
      title: 'Expense This Month',
      value: formatCurrency(stats?.monthlyExpenses || 0),
      icon: AlertCircle,
      color: 'bg-orange-500',
      subtitle: 'This month'
    },
    {
      title: 'Expense Today',
      value: formatCurrency(stats?.todayExpenses || 0),
      icon: ShoppingBag,
      color: 'bg-cyan-500',
      subtitle: 'Today'
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive overview of students, departments, and finances
          </p>
        </div>
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search students, classes..."
              className="w-64 px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Search size={18} />
            Search
          </button>
        </form>
      </div>

      {/* Main Statistics Cards - 2x4 Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card-hover animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {stat.value}
                  </p>
                  {stat.amount && (
                    <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mt-1">
                      {stat.amount}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {stat.subtitle}
                  </p>
                </div>
                <div className={`${stat.color} p-4 rounded-xl shadow-lg`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Department Breakdown and Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Breakdown */}
        <div className="card animate-slide-up">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              Students by Department
            </h2>
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
              Total: {stats?.totalStudents || 0}
            </span>
          </div>
          <div className="space-y-3">
            {stats?.departmentBreakdown && stats.departmentBreakdown.length > 0 ? (
              stats.departmentBreakdown.map((dept, index) => {
                const percentage = stats.totalStudents > 0 
                  ? ((dept.count / stats.totalStudents) * 100).toFixed(1) 
                  : 0;
                const colors = [
                  'bg-blue-500',
                  'bg-green-500',
                  'bg-purple-500',
                  'bg-yellow-500',
                  'bg-indigo-500',
                  'bg-pink-500',
                  'bg-red-500',
                  'bg-teal-500'
                ];
                const color = colors[index % colors.length];
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {dept.name}
                      </span>
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                        {dept.count} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div
                        className={`${color} h-2.5 rounded-full transition-all duration-300`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No department data available
              </p>
            )}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="card animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <PieChart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              Monthly Financial Summary
            </h2>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">
                    Total Income
                  </p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-300 mt-1">
                    {formatCurrency(stats?.monthlyIncome || 0)}
                  </p>
                </div>
                <ArrowUpCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>
            
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">
                    Total Expenses
                  </p>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-300 mt-1">
                    {formatCurrency(stats?.monthlyExpenses || 0)}
                  </p>
                </div>
                <ArrowDownCircle className="w-8 h-8 text-red-500" />
              </div>
            </div>
            
            <div className={`p-4 rounded-lg border ${
              (stats?.netBalance || 0) >= 0
                ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800'
                : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${
                    (stats?.netBalance || 0) >= 0
                      ? 'text-indigo-700 dark:text-indigo-400'
                      : 'text-orange-700 dark:text-orange-400'
                  }`}>
                    Net Balance
                  </p>
                  <p className={`text-2xl font-bold mt-1 ${
                    (stats?.netBalance || 0) >= 0
                      ? 'text-indigo-900 dark:text-indigo-300'
                      : 'text-orange-900 dark:text-orange-300'
                  }`}>
                    {formatCurrency(stats?.netBalance || 0)}
                  </p>
                </div>
                <TrendingUp className={`w-8 h-8 ${
                  (stats?.netBalance || 0) >= 0 ? 'text-indigo-500' : 'text-orange-500'
                }`} />
              </div>
            </div>

            {/* Fee Collection Summary */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Fee Collection Status
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Total Fee Amount:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(stats?.totalFeeAmount || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Amount Collected:</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(stats?.amountCollected || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Pending Amount:</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    {formatCurrency((stats?.totalFeeAmount || 0) - (stats?.amountCollected || 0))}
                  </span>
                </div>
                {stats?.totalFeeAmount > 0 && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500 dark:text-gray-400">Collection Rate</span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {((stats.amountCollected / stats.totalFeeAmount) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${(stats.amountCollected / stats.totalFeeAmount) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Teachers
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {stats?.totalTeachers || 0}
              </p>
            </div>
            <div className="bg-green-500 p-4 rounded-lg">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Courses
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {stats?.totalCourses || 0}
              </p>
            </div>
            <div className="bg-purple-500 p-4 rounded-lg">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Pending Fees
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {formatCurrency(stats?.pendingFees || 0)}
              </p>
            </div>
            <div className="bg-red-500 p-4 rounded-lg">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;

