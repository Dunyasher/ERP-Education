import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
  Calendar,
  Download,
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Filter,
  Printer,
  ArrowUpCircle,
  ArrowDownCircle
} from 'lucide-react';

const DateReport = () => {
  const today = new Date().toISOString().split('T')[0];
  const [reportType, setReportType] = useState('single');
  const [reportDate, setReportDate] = useState(today);
  const [dateRange, setDateRange] = useState({
    startDate: today,
    endDate: today
  });

  const getParams = () => {
    if (reportType === 'single') {
      return { date: reportDate };
    }
    return {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    };
  };

  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['dateReport', reportType, reportDate, dateRange],
    queryFn: async () => {
      const params = getParams();
      const response = await api.get('/reports/financial', { params });
      return response.data;
    },
    enabled: reportType === 'single' ? !!reportDate : !!(dateRange.startDate && dateRange.endDate),
    onError: () => toast.error('Failed to load report')
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handlePrint = () => window.print();
  const handleExport = () => toast('Export feature coming soon');

  const period = reportData?.period;
  const summary = reportData?.summary || {};
  const transactions = reportData?.transactions || {};
  const incomeList = transactions.income || [];
  const expenseList = transactions.expenses || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
            <Link to="/admin/reports" className="hover:text-blue-600 dark:hover:text-blue-400">
              Reporting Area
            </Link>
            <span>/</span>
            <span className="text-gray-900 dark:text-white font-medium">Date Report</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Date Report</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Income, expenses, and transactions for a specific date or date range
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="btn-secondary flex items-center gap-2">
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Date Filters */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Select Period
        </h2>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="reportType"
              checked={reportType === 'single'}
              onChange={() => setReportType('single')}
              className="rounded"
            />
            Single Date
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="reportType"
              checked={reportType === 'range'}
              onChange={() => setReportType('range')}
              className="rounded"
            />
            Date Range
          </label>
          {reportType === 'single' ? (
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="input-field max-w-[180px]"
              />
            </div>
          ) : (
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">From</span>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange((r) => ({ ...r, startDate: e.target.value }))}
                  className="input-field max-w-[160px]"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">To</span>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange((r) => ({ ...r, endDate: e.target.value }))}
                  className="input-field max-w-[160px]"
                />
              </div>
              {dateRange.startDate > dateRange.endDate && (
                <p className="text-sm text-red-600">End date must be after start date</p>
              )}
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="card py-12 text-center text-gray-500">Loading report...</div>
      ) : reportData ? (
        <>
          {/* Period Label */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Report for: {period?.start && period?.end
              ? `${formatDate(period.start)} - ${formatDate(period.end)}`
              : formatDate(reportDate)}
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Income</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(summary.totalIncome)}
                </p>
                <p className="text-xs text-gray-500">{summary.incomeCount || 0} transactions</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <ArrowUpCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="card flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Expenses</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(summary.totalExpenses)}
                </p>
                <p className="text-xs text-gray-500">{summary.expenseCount || 0} transactions</p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <ArrowDownCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div className="card flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Net Balance</p>
                <p className={`text-xl font-bold ${(summary.netBalance || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency(summary.netBalance)}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${(summary.netBalance || 0) >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                <DollarSign className={`w-8 h-8 ${(summary.netBalance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
          </div>

          {/* Income Transactions */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Income Transactions
            </h3>
            {incomeList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Student</th>
                      <th className="text-right py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Amount</th>
                      <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incomeList.map((inv, i) => (
                      <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-3 text-gray-900 dark:text-white">
                          {inv.studentId?.personalInfo?.fullName || inv.studentId?.srNo || 'N/A'}
                        </td>
                        <td className="py-3 text-right font-medium text-green-600 dark:text-green-400">
                          {formatCurrency(inv.paidAmount)}
                        </td>
                        <td className="py-3 text-gray-600 dark:text-gray-400 text-sm">
                          {formatDate(inv.paymentDate || inv.updatedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 py-6 text-center">No income transactions in this period</p>
            )}
          </div>

          {/* Expense Transactions */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-500" />
              Expense Transactions
            </h3>
            {expenseList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Description</th>
                      <th className="text-right py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Amount</th>
                      <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenseList.map((exp, i) => (
                      <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-3 text-gray-900 dark:text-white">
                          {exp.description || exp.category || 'Expense'}
                        </td>
                        <td className="py-3 text-right font-medium text-red-600 dark:text-red-400">
                          {formatCurrency(exp.amount)}
                        </td>
                        <td className="py-3 text-gray-600 dark:text-gray-400 text-sm">
                          {formatDate(exp.date)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 py-6 text-center">No expense transactions in this period</p>
            )}
          </div>
        </>
      ) : (
        <div className="card py-12 text-center text-gray-500">
          Select a date or date range and ensure start date is before end date.
        </div>
      )}
    </div>
  );
};

export default DateReport;
