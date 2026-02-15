import { useState } from 'react';
import { useQuery } from 'react-query';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Calendar, Download, FileText, DollarSign, TrendingDown, Filter, Printer } from 'lucide-react';

const DailyExpenseReport = () => {
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [reportType, setReportType] = useState('single'); // 'single' or 'range'

  // Fetch daily expense report
  const { data: reportData, isLoading, refetch } = useQuery(
    ['dailyExpenseReport', reportDate, dateRange, reportType],
    async () => {
      const params = new URLSearchParams();
      if (reportType === 'single') {
        params.append('date', reportDate);
      } else {
        if (dateRange.startDate) params.append('startDate', dateRange.startDate);
        if (dateRange.endDate) params.append('endDate', dateRange.endDate);
      }
      
      const response = await api.get(`/expenses/reports/daily?${params.toString()}`);
      return response.data;
    },
    {
      enabled: reportType === 'single' ? !!reportDate : (!!dateRange.startDate && !!dateRange.endDate),
      onError: (error) => {
        toast.error('Failed to load expense report');
      }
    }
  );

  const handleGenerateReport = () => {
    if (reportType === 'range' && (!dateRange.startDate || !dateRange.endDate)) {
      toast.error('Please select both start and end dates');
      return;
    }
    refetch();
  };

  const handleExportPDF = () => {
    // TODO: Implement PDF export
    toast.info('PDF export feature coming soon');
  };

  const handleExportExcel = () => {
    // TODO: Implement Excel export
    toast.info('Excel export feature coming soon');
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading report...</div>;
  }

  const expenses = reportData?.expenses || [];
  const summary = reportData?.summary || { totalAmount: 0, totalCount: 0 };
  const categoryBreakdown = reportData?.categoryBreakdown || {};
  const departmentBreakdown = reportData?.departmentBreakdown || {};

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Daily Expense Report
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and analyze daily expense reports
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="btn-secondary flex items-center gap-2"
          >
            <Printer className="w-5 h-5" />
            Print
          </button>
          <button
            onClick={handleExportPDF}
            className="btn-secondary flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Report Filters */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Report Options
          </h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="single"
                checked={reportType === 'single'}
                onChange={(e) => setReportType(e.target.value)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Single Date</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="range"
                checked={reportType === 'range'}
                onChange={(e) => setReportType(e.target.value)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Date Range</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {reportType === 'single' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select Date *
                </label>
                <input
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="input-field"
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                    className="input-field"
                  />
                </div>
              </>
            )}
            <div className="flex items-end">
              <button
                onClick={handleGenerateReport}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Calendar className="w-5 h-5" />
                Generate Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-400">
                Total Expenses
              </p>
              <p className="text-3xl font-bold text-red-900 dark:text-red-300 mt-2">
                {formatCurrency(summary.totalAmount)}
              </p>
            </div>
            <div className="bg-red-500 p-4 rounded-lg">
              <TrendingDown className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
        <div className="card bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                Total Records
              </p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-300 mt-2">
                {summary.totalCount}
              </p>
            </div>
            <div className="bg-blue-500 p-4 rounded-lg">
              <FileText className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
        <div className="card bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                Average Expense
              </p>
              <p className="text-3xl font-bold text-green-900 dark:text-green-300 mt-2">
                {formatCurrency(summary.totalCount > 0 ? summary.totalAmount / summary.totalCount : 0)}
              </p>
            </div>
            <div className="bg-green-500 p-4 rounded-lg">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Report Header */}
      {expenses.length > 0 && (
        <div className="card bg-gray-50 dark:bg-gray-800">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Daily Expense Report
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {reportType === 'single' 
                ? formatDate(reportDate)
                : `${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`
              }
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Generated on {new Date().toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      {Object.keys(categoryBreakdown).length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Category Breakdown
          </h2>
          <div className="space-y-4">
            {Object.entries(categoryBreakdown).map(([category, data]) => (
              <div key={category} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white capitalize">
                      {category}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {data.count} expense{data.count !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatCurrency(data.total)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {((data.total / summary.totalAmount) * 100).toFixed(1)}% of total
                    </p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(data.total / summary.totalAmount) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Department Breakdown */}
      {Object.keys(departmentBreakdown).length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Department Breakdown
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(departmentBreakdown).map(([department, data]) => (
              <div key={department} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {department}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {data.count} expense{data.count !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatCurrency(data.total)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Expense List */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Detailed Expense List
        </h2>
        {expenses.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No expenses found for the selected date(s)</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    SR No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {expenses.map((expense) => (
                  <tr key={expense._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {expense.srNo || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(expense.date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white max-w-xs truncate">
                      {expense.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 capitalize">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {expense.department || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {expense.vendor?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 capitalize">
                      {expense.paymentMethod?.replace('_', ' ') || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white text-right">
                      {formatCurrency(expense.amount)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50 dark:bg-gray-800 font-bold">
                  <td colSpan="7" className="px-6 py-4 text-right text-sm text-gray-900 dark:text-white">
                    Total:
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white text-right">
                    {formatCurrency(summary.totalAmount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyExpenseReport;

