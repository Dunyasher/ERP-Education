import { useQuery } from '@tanstack/react-query';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { 
  GraduationCap, 
  DollarSign, 
  TrendingUp, 
  BarChart3,
  Search,
  FileText,
  ChevronDown,
  Calendar
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [periodFilter, setPeriodFilter] = useState('today'); // 'today' | 'month' | 'year'
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const calendarRef = useRef(null);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminStats', selectedDate],
    queryFn: async () => {
      const params = {
        date: selectedDate.toISOString().split('T')[0],
        month: selectedDate.getMonth() + 1,
        year: selectedDate.getFullYear()
      };
      const response = await api.get('/dashboard/admin', { params });
      return response.data;
    }
  });

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target)) {
        setShowCalendar(false);
      }
    };
    if (showCalendar) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCalendar]);

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
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Pending fee: use Invoice-based when > 0, else Student-based (totalFee - collected) to match Fee Details
  const pendingFromStudents = Math.max(0, (stats?.totalFeeAmount || 0) - (stats?.amountCollected || 0));
  const invoicePending = Math.max(stats?.duesAmount || 0, stats?.pendingFees || 0);
  const duesAmount = invoicePending > 0 ? invoicePending : pendingFromStudents;
  const collectionRate = stats?.totalFeeAmount > 0
    ? ((stats.amountCollected / stats.totalFeeAmount) * 100).toFixed(1)
    : 0;
  const remainingAmount = Math.max(0, (stats?.totalFeeAmount || 0) - (stats?.amountCollected || 0));
  const monthlyChartData = stats?.monthlyFinancialSummary || [];

  // Computed values per period
  const todayProfit = (stats?.todayIncome || 0) - (stats?.todayExpenses || 0);
  const yearlyProfit = (stats?.totalIncomeThisYear || 0) - (stats?.totalExpenseThisYear || 0);

  return (
    <div className="space-y-6">
      {/* Header: Logo, Today/This Month toggle, Date, Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">ToBay</h1>
          <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
            <button
              type="button"
              onClick={() => setPeriodFilter('today')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${periodFilter === 'today' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setPeriodFilter('month')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${periodFilter === 'month' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => setPeriodFilter('year')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${periodFilter === 'year' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
            >
              This Year
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative" ref={calendarRef}>
            <button
              type="button"
              onClick={() => setShowCalendar(!showCalendar)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <Calendar className="w-4 h-4" />
              {selectedDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              <ChevronDown className="w-4 h-4" />
            </button>
            {showCalendar && (
              <div className="absolute right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 z-10">
                <DatePicker
                  selected={selectedDate}
                  onChange={(date) => { setSelectedDate(date); setShowCalendar(false); }}
                  inline
                  className="border-0"
                />
              </div>
            )}
          </div>
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-40 sm:w-48 px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Row 1 & 2: Period-aware stats - Today | Month | Year */}
      {periodFilter === 'today' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500 rounded-lg">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Remaining Fee</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(duesAmount)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Outstanding amount</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Income Today</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats?.todayIncome || 0)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Selected date</p>
              </div>
              <div className="p-3 bg-blue-500 rounded-full">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Expense Today</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats?.todayExpenses || 0)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Selected date</p>
              </div>
              <div className="p-3 bg-orange-500 rounded-full">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Profit Today</p>
                <p className={`text-2xl font-bold ${todayProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency(todayProfit)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Income − Expenses</p>
              </div>
              <div className={`p-3 rounded-lg ${todayProfit >= 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      )}
      {periodFilter === 'month' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500 rounded-lg">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Remaining Fee</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(duesAmount)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Outstanding amount</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Income This Month</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats?.monthlyIncome || 0)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Selected month</p>
              </div>
              <div className="p-3 bg-green-500 rounded-full">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Expense This Month</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats?.monthlyExpenses || 0)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Selected month</p>
              </div>
              <div className="p-3 bg-orange-500 rounded-full">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Profit This Month</p>
                <p className={`text-2xl font-bold ${(stats?.profitThisMonth || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency(stats?.profitThisMonth || 0)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Income − Expenses</p>
              </div>
              <div className={`p-3 rounded-lg ${(stats?.profitThisMonth || 0) >= 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      )}
      {periodFilter === 'year' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500 rounded-lg">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Remaining Fee</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(duesAmount)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Outstanding amount</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Income This Year</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats?.totalIncomeThisYear || 0)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Selected year</p>
              </div>
              <div className="p-3 bg-cyan-500 rounded-full">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Expense This Year</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats?.totalExpenseThisYear || 0)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Selected year</p>
              </div>
              <div className="p-3 bg-orange-500 rounded-full">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Profit This Year</p>
                <p className={`text-2xl font-bold ${yearlyProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency(yearlyProfit)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Income − Expenses</p>
              </div>
              <div className={`p-3 rounded-lg ${yearlyProfit >= 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Row 2: Summary for selected period */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {periodFilter === 'today' && (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats?.todayIncome || 0)}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Income today</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats?.todayExpenses || 0)}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Expense today</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(todayProfit)}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Net today</p>
            </div>
          </>
        )}
        {periodFilter === 'month' && (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats?.monthlyIncome || 0)}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Income this month</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats?.monthlyExpenses || 0)}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Expense this month</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats?.profitThisMonth || 0)}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Net this month</p>
            </div>
          </>
        )}
        {periodFilter === 'year' && (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats?.totalIncomeThisYear || 0)}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Income this year</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats?.totalExpenseThisYear || 0)}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Expense this year</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(yearlyProfit)}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Net this year</p>
            </div>
          </>
        )}
      </div>

      {/* Fee Details */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            Fee Details
          </h2>
          <div className="flex gap-4 text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Total: <strong className="text-gray-900 dark:text-white">{formatCurrency(stats?.totalFeeAmount || 0)}</strong>
            </span>
            <span className="text-green-600 dark:text-green-400">
              Collected: <strong>{formatCurrency(stats?.amountCollected || 0)}</strong>
            </span>
            <span className="text-red-600 dark:text-red-400">
              Remaining: <strong>{formatCurrency(remainingAmount)}</strong>
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2">
          <div className="h-64">
            {stats?.totalFeeAmount > 0 ? (
              <>
                <p className="text-lg font-bold text-gray-900 dark:text-white mb-2">Collected {collectionRate}%</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {formatCurrency(stats?.amountCollected || 0)} {formatCurrency(stats?.totalFeeAmount || 0)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {formatCurrency(remainingAmount)} {formatCurrency(remainingAmount)}
                </p>
                <ResponsiveContainer width="100%" height="70%">
                  <RechartsPieChart>
                    <Pie
                      data={[
                        { name: 'Collected', value: stats?.amountCollected || 0, color: '#22c55e' },
                        { name: 'Remaining', value: remainingAmount, color: '#ef4444' }
                      ].filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {[
                        { name: 'Collected', value: stats?.amountCollected || 0, color: '#22c55e' },
                        { name: `Remaining ${(100 - parseFloat(collectionRate)).toFixed(1)}%`, value: remainingAmount, color: '#ef4444' }
                      ].filter(d => d.value > 0).map((entry, index) => (
                        <Cell key={index} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="mt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Collection Rate:</p>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div
                      className="bg-green-500 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, parseFloat(collectionRate))}%` }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
                No fee data to display
              </div>
            )}
          </div>
          <div className="h-64">
            {stats?.totalFeeAmount > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: 'Total Fee', amount: stats?.totalFeeAmount || 0 },
                    { name: 'Collected', amount: stats?.amountCollected || 0 },
                    { name: 'Remaining', amount: remainingAmount }
                  ]}
                  margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="name" tick={{ fill: 'currentColor', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'currentColor', fontSize: 12 }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                    <Cell fill="#3b82f6" />
                    <Cell fill="#22c55e" />
                    <Cell fill="#ef4444" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
                No fee data to display
              </div>
            )}
          </div>
        </div>
        {stats?.totalFeeAmount > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end">
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{collectionRate}%</span>
          </div>
        )}
      </div>

      {/* Students by Department & Monthly Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              Students by Department
            </h2>
            <button
              type="button"
              onClick={() => navigate('/admin/students')}
              className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {stats?.departmentBreakdown && stats.departmentBreakdown.length > 0 ? (
              stats.departmentBreakdown.map((dept, index) => {
                const maxCount = Math.max(...stats.departmentBreakdown.map(d => d.count), 1);
                const barWidth = (dept.count / maxCount) * 100;
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
                        {dept.count} students
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div
                        className={`${color} h-2.5 rounded-full transition-all duration-300`}
                        style={{ width: `${barWidth}%` }}
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

        {/* Monthly Financial Summary - Line Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              Monthly Financial Summary
            </h2>
            <button
              type="button"
              onClick={() => navigate('/admin/reports')}
              className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              View All
            </button>
          </div>
          <div className="h-64">
            {monthlyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="month" tick={{ fill: 'currentColor', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'currentColor', fontSize: 12 }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                  <Tooltip
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: 'var(--tw-bg-opacity)', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="income" name="Total Income" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                  <Line type="monotone" dataKey="expense" name="Total Expense" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
                No monthly data available
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;

