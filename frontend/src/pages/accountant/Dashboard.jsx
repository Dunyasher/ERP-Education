import { useState } from 'react';
import { useQuery } from 'react-query';
import api from '../../utils/api';
import { Users, DollarSign, FileText, TrendingUp, GraduationCap, Calendar, Receipt, CheckCircle, Clock, AlertCircle, Eye, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AccountantDashboard = () => {
  const navigate = useNavigate();

  const [feeFilter, setFeeFilter] = useState('all'); // all, pending, paid, overdue

  // Fetch dashboard stats
  const { data: stats, isLoading } = useQuery('accountantStats', async () => {
    const response = await api.get('/accountant/dashboard');
    return response.data;
  });

  // Fetch fee invoices
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery('feeInvoices', async () => {
    const response = await api.get('/fees/invoices');
    return response.data || [];
  });

  // Filter invoices based on status
  const filteredInvoices = invoices.filter(invoice => {
    if (feeFilter === 'all') return true;
    if (feeFilter === 'pending') return invoice.status === 'pending';
    if (feeFilter === 'paid') return invoice.status === 'paid';
    if (feeFilter === 'overdue') return invoice.status === 'overdue';
    return true;
  });

  // Calculate fee statistics
  const feeStats = {
    total: invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0),
    paid: invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0),
    pending: invoices.reduce((sum, inv) => sum + ((inv.totalAmount || 0) - (inv.paidAmount || 0)), 0),
    pendingCount: invoices.filter(inv => inv.status === 'pending' || inv.status === 'partial').length,
    paidCount: invoices.filter(inv => inv.status === 'paid').length,
    overdueCount: invoices.filter(inv => inv.status === 'overdue').length
  };

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
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      paid: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: CheckCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: Clock },
      partial: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: Clock },
      overdue: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: AlertCircle }
    };
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${config.color}`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

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

      {/* Fee Details Section */}
      <div className="space-y-3 xs:space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Fee Details</h2>
          <div className="flex items-center gap-2">
            <select
              value={feeFilter}
              onChange={(e) => setFeeFilter(e.target.value)}
              className="text-xs xs:text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2 xs:px-3 py-1.5 xs:py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Fees</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>

        {/* Fee Statistics */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 xs:gap-4 sm:gap-6">
          <div className="card-hover bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs xs:text-sm font-medium text-blue-600 dark:text-blue-300">Total Fees</p>
                <p className="text-lg xs:text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1 xs:mt-2 truncate">
                  {formatCurrency(feeStats.total)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 text-blue-600 dark:text-blue-300 flex-shrink-0 ml-2" />
            </div>
          </div>

          <div className="card-hover bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs xs:text-sm font-medium text-green-600 dark:text-green-300">Paid Amount</p>
                <p className="text-lg xs:text-xl sm:text-2xl font-bold text-green-900 dark:text-green-100 mt-1 xs:mt-2 truncate">
                  {formatCurrency(feeStats.paid)}
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">{feeStats.paidCount} invoices</p>
              </div>
              <CheckCircle className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 text-green-600 dark:text-green-300 flex-shrink-0 ml-2" />
            </div>
          </div>

          <div className="card-hover bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900 dark:to-yellow-800">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs xs:text-sm font-medium text-yellow-600 dark:text-yellow-300">Pending Amount</p>
                <p className="text-lg xs:text-xl sm:text-2xl font-bold text-yellow-900 dark:text-yellow-100 mt-1 xs:mt-2 truncate">
                  {formatCurrency(feeStats.pending)}
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">{feeStats.pendingCount} invoices</p>
              </div>
              <Clock className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 text-yellow-600 dark:text-yellow-300 flex-shrink-0 ml-2" />
            </div>
          </div>

          <div className="card-hover bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900 dark:to-red-800">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs xs:text-sm font-medium text-red-600 dark:text-red-300">Overdue</p>
                <p className="text-xl xs:text-2xl sm:text-3xl font-bold text-red-900 dark:text-red-100 mt-1 xs:mt-2 truncate">
                  {feeStats.overdueCount}
                </p>
                <p className="text-xs text-red-700 dark:text-red-300 mt-1">invoices</p>
              </div>
              <AlertCircle className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 text-red-600 dark:text-red-300 flex-shrink-0 ml-2" />
            </div>
          </div>
        </div>

        {/* Fee Invoices Table */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base xs:text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Fee Invoices</h3>
            <button
              onClick={() => navigate('/accountant/monthly-payments')}
              className="text-xs xs:text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
            >
              View All →
            </button>
          </div>
          
          {invoicesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400">No invoices found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-3 xs:px-4 py-2 xs:py-3 text-xs xs:text-sm font-semibold text-gray-700 dark:text-gray-300">Invoice #</th>
                    <th className="px-3 xs:px-4 py-2 xs:py-3 text-xs xs:text-sm font-semibold text-gray-700 dark:text-gray-300">Student</th>
                    <th className="px-3 xs:px-4 py-2 xs:py-3 text-xs xs:text-sm font-semibold text-gray-700 dark:text-gray-300">Date</th>
                    <th className="px-3 xs:px-4 py-2 xs:py-3 text-xs xs:text-sm font-semibold text-gray-700 dark:text-gray-300">Total</th>
                    <th className="px-3 xs:px-4 py-2 xs:py-3 text-xs xs:text-sm font-semibold text-gray-700 dark:text-gray-300">Paid</th>
                    <th className="px-3 xs:px-4 py-2 xs:py-3 text-xs xs:text-sm font-semibold text-gray-700 dark:text-gray-300">Pending</th>
                    <th className="px-3 xs:px-4 py-2 xs:py-3 text-xs xs:text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredInvoices.slice(0, 10).map((invoice) => (
                    <tr key={invoice._id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-3 xs:px-4 py-2 xs:py-3 text-xs xs:text-sm text-gray-900 dark:text-white font-medium">
                        {invoice.invoiceNo || 'N/A'}
                      </td>
                      <td className="px-3 xs:px-4 py-2 xs:py-3 text-xs xs:text-sm text-gray-700 dark:text-gray-300">
                        {invoice.studentId?.personalInfo?.fullName || invoice.studentId?.name || 'N/A'}
                      </td>
                      <td className="px-3 xs:px-4 py-2 xs:py-3 text-xs xs:text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(invoice.invoiceDate)}
                      </td>
                      <td className="px-3 xs:px-4 py-2 xs:py-3 text-xs xs:text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(invoice.totalAmount)}
                      </td>
                      <td className="px-3 xs:px-4 py-2 xs:py-3 text-xs xs:text-sm text-green-600 dark:text-green-400 font-medium">
                        {formatCurrency(invoice.paidAmount)}
                      </td>
                      <td className="px-3 xs:px-4 py-2 xs:py-3 text-xs xs:text-sm text-red-600 dark:text-red-400 font-medium">
                        {formatCurrency((invoice.totalAmount || 0) - (invoice.paidAmount || 0))}
                      </td>
                      <td className="px-3 xs:px-4 py-2 xs:py-3 text-xs xs:text-sm">
                        {getStatusBadge(invoice.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredInvoices.length > 10 && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => navigate('/accountant/monthly-payments')}
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
                  >
                    View all {filteredInvoices.length} invoices →
                  </button>
                </div>
              )}
            </div>
          )}
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

