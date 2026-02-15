import { useState } from 'react';
import { useQuery } from 'react-query';
import api from '../../utils/api';
import { 
  BarChart3, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar,
  Download,
  Filter,
  FileText,
  PieChart
} from 'lucide-react';
import toast from 'react-hot-toast';

const Reports = () => {
  const [reportType, setReportType] = useState('financial');
  const [dateFilter, setDateFilter] = useState('month');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Financial Report
  const { data: financialData, isLoading: financialLoading } = useQuery(
    ['financialReport', dateFilter, selectedDate, startDate, endDate, selectedMonth, selectedYear],
    async () => {
      let params = {};
      if (dateFilter === 'date') {
        params.date = selectedDate;
      } else if (dateFilter === 'range') {
        params.startDate = startDate;
        params.endDate = endDate;
      } else if (dateFilter === 'month') {
        params.month = selectedMonth;
        params.year = selectedYear;
      }
      const response = await api.get('/reports/financial', { params });
      return response.data;
    },
    { enabled: reportType === 'financial', refetchOnWindowFocus: false }
  );

  // Admissions Report
  const { data: admissionsData, isLoading: admissionsLoading } = useQuery(
    ['admissionsReport', startDate, endDate, selectedMonth, selectedYear],
    async () => {
      let params = {};
      if (startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      } else {
        params.month = selectedMonth;
        params.year = selectedYear;
      }
      const response = await api.get('/reports/admissions', { params });
      return response.data;
    },
    { enabled: reportType === 'admissions', refetchOnWindowFocus: false }
  );

  // Students by Department
  const { data: departmentData, isLoading: departmentLoading } = useQuery(
    'studentsByDepartment',
    async () => {
      const response = await api.get('/reports/students-by-department');
      return response.data;
    },
    { enabled: reportType === 'students', refetchOnWindowFocus: false }
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
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

  const handlePrint = () => {
    window.print();
  };

  const handleExport = async () => {
    toast.info('Export feature coming soon!');
  };

  return (
    <div className="space-y-6 print:p-4">
      {/* Header */}
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Reports & Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive financial, admission, and student reports
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="btn-secondary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={handlePrint}
            className="btn-primary flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="card print:hidden">
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setReportType('financial')}
            className={`px-6 py-3 font-medium transition-colors ${
              reportType === 'financial'
                ? 'text-primary-600 border-b-2 border-primary-600 dark:text-primary-400 dark:border-primary-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <DollarSign className="w-4 h-4 inline mr-2" />
            Financial Report
          </button>
          <button
            onClick={() => setReportType('admissions')}
            className={`px-6 py-3 font-medium transition-colors ${
              reportType === 'admissions'
                ? 'text-primary-600 border-b-2 border-primary-600 dark:text-primary-400 dark:border-primary-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Admissions Report
          </button>
          <button
            onClick={() => setReportType('students')}
            className={`px-6 py-3 font-medium transition-colors ${
              reportType === 'students'
                ? 'text-primary-600 border-b-2 border-primary-600 dark:text-primary-400 dark:border-primary-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <PieChart className="w-4 h-4 inline mr-2" />
            Students by Department/Class
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card print:hidden">
        <div className="flex items-center gap-4 flex-wrap">
          <Filter className="w-5 h-5 text-gray-500" />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="input-field"
          >
            <option value="month">This Month</option>
            <option value="date">Specific Date</option>
            <option value="range">Date Range</option>
          </select>

          {dateFilter === 'date' && (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input-field"
            />
          )}

          {dateFilter === 'range' && (
            <>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="Start Date"
                className="input-field"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="End Date"
                className="input-field"
              />
            </>
          )}

          {dateFilter === 'month' && (
            <>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="input-field"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={month}>
                    {new Date(2000, month - 1).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                min="2020"
                max="2100"
                className="input-field w-32"
              />
            </>
          )}
        </div>
      </div>

      {/* Financial Report */}
      {reportType === 'financial' && (
        <div className="space-y-6">
          {financialLoading ? (
            <div className="text-center py-12">Loading financial report...</div>
          ) : financialData ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="card bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-700 dark:text-green-400">
                        Total Income
                      </p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-300 mt-1">
                        {formatCurrency(financialData.summary?.totalIncome || 0)}
                      </p>
                    </div>
                    <TrendingUp className="w-10 h-10 text-green-500" />
                  </div>
                </div>

                <div className="card bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-700 dark:text-red-400">
                        Total Expenses
                      </p>
                      <p className="text-2xl font-bold text-red-900 dark:text-red-300 mt-1">
                        {formatCurrency(financialData.summary?.totalExpenses || 0)}
                      </p>
                    </div>
                    <TrendingDown className="w-10 h-10 text-red-500" />
                  </div>
                </div>

                <div className={`card bg-gradient-to-br ${
                  (financialData.summary?.netBalance || 0) >= 0
                    ? 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800'
                    : 'from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                        Net Balance
                      </p>
                      <p className={`text-2xl font-bold mt-1 ${
                        (financialData.summary?.netBalance || 0) >= 0
                          ? 'text-blue-900 dark:text-blue-300'
                          : 'text-orange-900 dark:text-orange-300'
                      }`}>
                        {formatCurrency(financialData.summary?.netBalance || 0)}
                      </p>
                    </div>
                    <BarChart3 className="w-10 h-10 text-blue-500" />
                  </div>
                </div>

                <div className="card bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-700 dark:text-purple-400">
                        Transactions
                      </p>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-300 mt-1">
                        {(financialData.summary?.incomeCount || 0) + (financialData.summary?.expenseCount || 0)}
                      </p>
                    </div>
                    <FileText className="w-10 h-10 text-purple-500" />
                  </div>
                </div>
              </div>

              {/* Daily Income & Expenses Chart */}
              <div className="card">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Daily Income & Expenses
                </h2>
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead className="table-header">
                      <tr>
                        <th>Date</th>
                        <th className="text-green-600">Daily Income</th>
                        <th className="text-red-600">Daily Expenses</th>
                        <th>Net</th>
                        <th>Income Transactions</th>
                        <th>Expense Transactions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {financialData.dailyIncome && financialData.dailyIncome.length > 0 ? (
                        financialData.dailyIncome.map((day, index) => {
                          const expenseDay = financialData.dailyExpenses?.find(e => e._id === day._id);
                          const dailyNet = (day.total || 0) - (expenseDay?.total || 0);
                          return (
                            <tr key={day._id || index} className="table-row">
                              <td>{formatDate(day._id)}</td>
                              <td className="text-green-600 font-medium">
                                {formatCurrency(day.total || 0)}
                              </td>
                              <td className="text-red-600 font-medium">
                                {formatCurrency(expenseDay?.total || 0)}
                              </td>
                              <td className={dailyNet >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {formatCurrency(dailyNet)}
                              </td>
                              <td>{day.count || 0}</td>
                              <td>{expenseDay?.count || 0}</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="6" className="text-center py-8 text-gray-500">
                            No data available for the selected period
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Transactions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Income Transactions */}
                <div className="card">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Income Transactions
                  </h2>
                  <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <table className="table">
                      <thead className="table-header sticky top-0">
                        <tr>
                          <th>Date</th>
                          <th>Student</th>
                          <th>Amount</th>
                          <th>Invoice No</th>
                        </tr>
                      </thead>
                      <tbody>
                        {financialData.transactions?.income && financialData.transactions.income.length > 0 ? (
                          financialData.transactions.income.map((transaction) => (
                            <tr key={transaction._id} className="table-row">
                              <td>{formatDate(transaction.paymentDate || transaction.updatedAt)}</td>
                              <td>{transaction.studentId?.personalInfo?.fullName || 'N/A'}</td>
                              <td className="text-green-600 font-medium">
                                {formatCurrency(transaction.paidAmount || 0)}
                              </td>
                              <td>{transaction.invoiceNo || 'N/A'}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="text-center py-8 text-gray-500">
                              No income transactions
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Expense Transactions */}
                <div className="card">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Expense Transactions
                  </h2>
                  <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <table className="table">
                      <thead className="table-header sticky top-0">
                        <tr>
                          <th>Date</th>
                          <th>Description</th>
                          <th>Category</th>
                          <th>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {financialData.transactions?.expenses && financialData.transactions.expenses.length > 0 ? (
                          financialData.transactions.expenses.map((expense) => (
                            <tr key={expense._id} className="table-row">
                              <td>{formatDate(expense.date)}</td>
                              <td>{expense.description || 'N/A'}</td>
                              <td>{expense.category || 'N/A'}</td>
                              <td className="text-red-600 font-medium">
                                {formatCurrency(expense.amount || 0)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="text-center py-8 text-gray-500">
                              No expense transactions
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="card text-center py-12">
              <p className="text-gray-500">No financial data available</p>
            </div>
          )}
        </div>
      )}

      {/* Admissions Report */}
      {reportType === 'admissions' && (
        <div className="space-y-6">
          {admissionsLoading ? (
            <div className="text-center py-12">Loading admissions report...</div>
          ) : admissionsData ? (
            <>
              {/* Summary */}
              <div className="card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                      Total Admissions
                    </p>
                    <p className="text-3xl font-bold text-blue-900 dark:text-blue-300 mt-1">
                      {admissionsData.statistics?.total || 0}
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                      {formatDate(admissionsData.period?.start)} - {formatDate(admissionsData.period?.end)}
                    </p>
                  </div>
                  <Users className="w-16 h-16 text-blue-500" />
                </div>
              </div>

              {/* Department Breakdown */}
              <div className="card">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Admissions by Department
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(admissionsData.statistics?.byDepartment || {}).map(([dept, count]) => (
                    <div key={dept} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="font-medium text-gray-900 dark:text-white">{dept}</p>
                      <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-1">
                        {count}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Course Breakdown */}
              <div className="card">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Admissions by Course
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(admissionsData.statistics?.byCourse || {}).map(([course, count]) => (
                    <div key={course} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="font-medium text-gray-900 dark:text-white">{course}</p>
                      <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-1">
                        {count}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Admissions List */}
              <div className="card">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Recent Admissions
                </h2>
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead className="table-header">
                      <tr>
                        <th>SR NO</th>
                        <th>Student Name</th>
                        <th>Department</th>
                        <th>Course</th>
                        <th>Admission Date</th>
                        <th>Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {admissionsData.data && admissionsData.data.length > 0 ? (
                        admissionsData.data.map((admission) => (
                          <tr key={admission._id} className="table-row">
                            <td>{admission.srNo || 'N/A'}</td>
                            <td>{admission.personalInfo?.fullName || 'N/A'}</td>
                            <td>
                              {admission.academicInfo?.courseId?.categoryId?.name || 'Uncategorized'}
                            </td>
                            <td>
                              {admission.academicInfo?.courseId?.name || 'Not Assigned'}
                            </td>
                            <td>
                              {formatDate(admission.academicInfo?.admissionDate || admission.createdAt)}
                            </td>
                            <td>{admission.userId?.email || 'N/A'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="text-center py-8 text-gray-500">
                            No admissions found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="card text-center py-12">
              <p className="text-gray-500">No admissions data available</p>
            </div>
          )}
        </div>
      )}

      {/* Students by Department/Class */}
      {reportType === 'students' && (
        <div className="space-y-6">
          {departmentLoading ? (
            <div className="text-center py-12">Loading student statistics...</div>
          ) : departmentData ? (
            <>
              {/* Summary */}
              <div className="card bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-700 dark:text-purple-400">
                      Total Active Students
                    </p>
                    <p className="text-3xl font-bold text-purple-900 dark:text-purple-300 mt-1">
                      {departmentData.total || 0}
                    </p>
                  </div>
                  <Users className="w-16 h-16 text-purple-500" />
                </div>
              </div>

              {/* Department Breakdown */}
              <div className="card">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Students by Department
                </h2>
                <div className="space-y-4">
                  {departmentData.byDepartment && departmentData.byDepartment.length > 0 ? (
                    departmentData.byDepartment.map((dept) => (
                      <div key={dept.name} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            {dept.name}
                          </h3>
                          <span className="badge-primary text-lg px-4 py-1">
                            {dept.count} Students
                          </span>
                        </div>
                        
                        {/* Courses in Department */}
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                            Courses:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(dept.courses || {}).map(([course, count]) => (
                              <span key={course} className="badge bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                {course} ({count})
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Students List */}
                        <div className="max-h-48 overflow-y-auto">
                          <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                              <tr>
                                <th className="px-3 py-2 text-left">SR NO</th>
                                <th className="px-3 py-2 text-left">Name</th>
                                <th className="px-3 py-2 text-left">Course</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dept.students && dept.students.length > 0 ? (
                                dept.students.map((student, idx) => (
                                  <tr key={idx} className="border-b border-gray-100 dark:border-gray-700">
                                    <td className="px-3 py-2">{student.srNo || 'N/A'}</td>
                                    <td className="px-3 py-2">{student.name || 'N/A'}</td>
                                    <td className="px-3 py-2">{student.course || 'N/A'}</td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan="3" className="px-3 py-2 text-center text-gray-500">
                                    No students
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-8">No department data available</p>
                  )}
                </div>
              </div>

              {/* Course Breakdown */}
              <div className="card">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Students by Course/Class
                </h2>
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead className="table-header">
                      <tr>
                        <th>Course/Class</th>
                        <th>Department</th>
                        <th>Students</th>
                      </tr>
                    </thead>
                    <tbody>
                      {departmentData.byCourse && departmentData.byCourse.length > 0 ? (
                        departmentData.byCourse.map((course) => (
                          <tr key={course.name} className="table-row">
                            <td className="font-medium">{course.name}</td>
                            <td>{course.department}</td>
                            <td>
                              <span className="badge-primary">{course.count} Students</span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="text-center py-8 text-gray-500">
                            No course data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="card text-center py-12">
              <p className="text-gray-500">No student data available</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;

