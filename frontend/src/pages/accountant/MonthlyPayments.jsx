import { useState } from 'react';
import { useQuery } from 'react-query';
import api from '../../utils/api';
import { Calendar, DollarSign, Search, Plus, Eye } from 'lucide-react';
import MonthlyPaymentRecording from '../../components/MonthlyPaymentRecording';

const MonthlyPayments = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  // Fetch students
  const { data: students = [], isLoading: studentsLoading } = useQuery('students', async () => {
    const response = await api.get('/students');
    return response.data;
  });

  // Fetch monthly payments
  const { data: monthlyPayments = [], isLoading: paymentsLoading } = useQuery(
    ['monthlyPayments', filters],
    async () => {
      const params = new URLSearchParams();
      if (filters.month) params.append('month', filters.month);
      if (filters.year) params.append('year', filters.year);
      const response = await api.get(`/accountant/monthly-payments?${params.toString()}`);
      return response.data;
    }
  );

  const months = [
    { value: '', label: 'All Months' },
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  const filteredStudents = students.filter(student => {
    const searchLower = searchTerm.toLowerCase();
    return (
      student.personalInfo?.fullName?.toLowerCase().includes(searchLower) ||
      student.srNo?.toLowerCase().includes(searchLower) ||
      student.contactInfo?.phone?.includes(searchTerm)
    );
  });

  const handleRecordPayment = (student) => {
    setSelectedStudent(student);
    setShowPaymentForm(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const totalCollected = monthlyPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

  return (
    <div className="space-y-3 xs:space-y-4 sm:space-y-6 p-2 xs:p-4 sm:p-6">
      {/* Header */}
      <div>
        <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 xs:mb-2">
          Monthly Payments
        </h1>
        <p className="text-xs xs:text-sm text-gray-600 dark:text-gray-400">
          Record and track monthly fee payments for students
        </p>
      </div>

      {/* Filters and Stats */}
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-2 xs:gap-3 sm:gap-4">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-300">Total Collected</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                Rs. {totalCollected.toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-10 h-10 text-blue-600 dark:text-blue-300" />
          </div>
        </div>

        <div className="card">
          <label className="block text-xs xs:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 xs:mb-2">
            Month
          </label>
          <select
            value={filters.month}
            onChange={(e) => setFilters(prev => ({ ...prev, month: e.target.value ? parseInt(e.target.value) : '' }))}
            className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-2 xs:px-3 py-1.5 xs:py-2 text-sm xs:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {months.map(month => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </div>

        <div className="card">
          <label className="block text-xs xs:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 xs:mb-2">
            Year
          </label>
          <input
            type="number"
            value={filters.year}
            onChange={(e) => setFilters(prev => ({ ...prev, year: parseInt(e.target.value) || new Date().getFullYear() }))}
            min="2020"
            max="2100"
            className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-2 xs:px-3 py-1.5 xs:py-2 text-sm xs:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div className="card xs:col-span-2 md:col-span-1">
          <label className="block text-xs xs:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 xs:mb-2">
            Search Student
          </label>
          <div className="relative">
            <Search className="absolute left-2 xs:left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 xs:w-5 xs:h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or serial..."
              className="w-full pl-8 xs:pl-10 border-2 border-gray-300 dark:border-gray-600 rounded-lg px-2 xs:px-3 py-1.5 xs:py-2 text-sm xs:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Students List */}
      <div className="card">
        <h2 className="text-base xs:text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3 xs:mb-4">
          Students - Record Monthly Payment
        </h2>
        {studentsLoading ? (
          <div className="text-center py-6 xs:py-8">
            <div className="animate-spin rounded-full h-8 w-8 xs:h-12 xs:w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-6 xs:py-8 text-gray-500 dark:text-gray-400 text-sm xs:text-base">
            No students found
          </div>
        ) : (
          <div className="overflow-x-auto -mx-2 xs:-mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="hidden sm:table-header-group bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="text-left py-2 xs:py-3 px-2 xs:px-4 text-xs xs:text-sm font-semibold text-gray-700 dark:text-gray-300">Serial</th>
                      <th className="text-left py-2 xs:py-3 px-2 xs:px-4 text-xs xs:text-sm font-semibold text-gray-700 dark:text-gray-300">Name</th>
                      <th className="text-left py-2 xs:py-3 px-2 xs:px-4 text-xs xs:text-sm font-semibold text-gray-700 dark:text-gray-300 hidden md:table-cell">Course</th>
                      <th className="text-left py-2 xs:py-3 px-2 xs:px-4 text-xs xs:text-sm font-semibold text-gray-700 dark:text-gray-300">Monthly Fee</th>
                      <th className="text-left py-2 xs:py-3 px-2 xs:px-4 text-xs xs:text-sm font-semibold text-gray-700 dark:text-gray-300">Paid</th>
                      <th className="text-left py-2 xs:py-3 px-2 xs:px-4 text-xs xs:text-sm font-semibold text-gray-700 dark:text-gray-300">Pending</th>
                      <th className="text-left py-2 xs:py-3 px-2 xs:px-4 text-xs xs:text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredStudents.map((student) => {
                      const pending = (student.feeInfo?.totalFee || 0) - (student.feeInfo?.paidFee || 0);
                      const hasPaymentThisMonth = monthlyPayments.some(
                        payment => payment.studentId?._id === student._id || payment.studentId === student._id
                      );
                      
                      return (
                        <tr key={student._id} className="sm:table-row block sm:table-row hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sm:border-0 mb-3 sm:mb-0 rounded-lg sm:rounded-none shadow sm:shadow-none">
                          <td className="block sm:table-cell py-2 xs:py-3 px-2 xs:px-4 text-gray-900 dark:text-white font-medium text-xs xs:text-sm sm:text-base" data-label="Serial">
                            <span className="sm:hidden font-semibold mr-2">Serial:</span>
                            {student.srNo}
                          </td>
                          <td className="block sm:table-cell py-2 xs:py-3 px-2 xs:px-4 text-gray-900 dark:text-white text-xs xs:text-sm sm:text-base" data-label="Name">
                            <span className="sm:hidden font-semibold mr-2">Name:</span>
                            {student.personalInfo?.fullName}
                          </td>
                          <td className="hidden md:table-cell py-2 xs:py-3 px-2 xs:px-4 text-gray-600 dark:text-gray-400 text-xs xs:text-sm sm:text-base" data-label="Course">
                            <span className="sm:hidden font-semibold mr-2">Course:</span>
                            {student.academicInfo?.courseId?.name || 'N/A'}
                          </td>
                          <td className="block sm:table-cell py-2 xs:py-3 px-2 xs:px-4 text-gray-900 dark:text-white text-xs xs:text-sm sm:text-base" data-label="Monthly Fee">
                            <span className="sm:hidden font-semibold mr-2">Monthly Fee:</span>
                            Rs. {(student.feeInfo?.monthlyFee || 0).toLocaleString()}
                          </td>
                          <td className="block sm:table-cell py-2 xs:py-3 px-2 xs:px-4 text-green-600 dark:text-green-400 font-semibold text-xs xs:text-sm sm:text-base" data-label="Paid">
                            <span className="sm:hidden font-semibold mr-2">Paid:</span>
                            Rs. {(student.feeInfo?.paidFee || 0).toLocaleString()}
                          </td>
                          <td className={`block sm:table-cell py-2 xs:py-3 px-2 xs:px-4 font-semibold text-xs xs:text-sm sm:text-base ${
                            pending > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-600 dark:text-gray-400'
                          }`} data-label="Pending">
                            <span className="sm:hidden font-semibold mr-2">Pending:</span>
                            Rs. {pending.toLocaleString()}
                          </td>
                          <td className="block sm:table-cell py-2 xs:py-3 px-2 xs:px-4 text-xs xs:text-sm sm:text-base" data-label="Actions">
                            <button
                              onClick={() => handleRecordPayment(student)}
                              disabled={hasPaymentThisMonth && filters.month}
                              className={`w-full sm:w-auto px-3 xs:px-4 py-1.5 xs:py-2 rounded-lg font-semibold text-xs xs:text-sm transition-all flex items-center justify-center gap-1 xs:gap-2 ${
                                hasPaymentThisMonth && filters.month
                                  ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                  : 'bg-green-600 hover:bg-green-700 text-white'
                              }`}
                            >
                              <Plus className="w-3 h-3 xs:w-4 xs:h-4" />
                              {hasPaymentThisMonth && filters.month ? 'Paid' : 'Record Payment'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Payments */}
      <div className="card">
        <h2 className="text-base xs:text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3 xs:mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 xs:w-5 xs:h-5" />
          <span>Recent Monthly Payments</span>
        </h2>
        {paymentsLoading ? (
          <div className="text-center py-6 xs:py-8">
            <div className="animate-spin rounded-full h-8 w-8 xs:h-12 xs:w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : monthlyPayments.length === 0 ? (
          <div className="text-center py-6 xs:py-8 text-gray-500 dark:text-gray-400 text-sm xs:text-base">
            No payments recorded for selected period
          </div>
        ) : (
          <div className="overflow-x-auto -mx-2 xs:-mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="hidden sm:table-header-group bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="text-left py-2 xs:py-3 px-2 xs:px-4 text-xs xs:text-sm font-semibold text-gray-700 dark:text-gray-300">Payment No</th>
                      <th className="text-left py-2 xs:py-3 px-2 xs:px-4 text-xs xs:text-sm font-semibold text-gray-700 dark:text-gray-300">Student</th>
                      <th className="text-left py-2 xs:py-3 px-2 xs:px-4 text-xs xs:text-sm font-semibold text-gray-700 dark:text-gray-300">Month/Year</th>
                      <th className="text-left py-2 xs:py-3 px-2 xs:px-4 text-xs xs:text-sm font-semibold text-gray-700 dark:text-gray-300">Amount</th>
                      <th className="text-left py-2 xs:py-3 px-2 xs:px-4 text-xs xs:text-sm font-semibold text-gray-700 dark:text-gray-300 hidden md:table-cell">Method</th>
                      <th className="text-left py-2 xs:py-3 px-2 xs:px-4 text-xs xs:text-sm font-semibold text-gray-700 dark:text-gray-300">Date</th>
                      <th className="text-left py-2 xs:py-3 px-2 xs:px-4 text-xs xs:text-sm font-semibold text-gray-700 dark:text-gray-300 hidden lg:table-cell">Collected By</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {monthlyPayments.map((payment) => {
                      const student = payment.studentId;
                      const monthName = new Date(payment.year, payment.month - 1).toLocaleString('en-US', { month: 'long' });
                      
                      return (
                        <tr key={payment._id} className="sm:table-row block sm:table-row hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sm:border-0 mb-3 sm:mb-0 rounded-lg sm:rounded-none shadow sm:shadow-none">
                          <td className="block sm:table-cell py-2 xs:py-3 px-2 xs:px-4 text-gray-900 dark:text-white font-medium text-xs xs:text-sm sm:text-base" data-label="Payment No">
                            <span className="sm:hidden font-semibold mr-2">Payment No:</span>
                            {payment.paymentNo}
                          </td>
                          <td className="block sm:table-cell py-2 xs:py-3 px-2 xs:px-4 text-gray-900 dark:text-white text-xs xs:text-sm sm:text-base" data-label="Student">
                            <span className="sm:hidden font-semibold mr-2">Student:</span>
                            {student?.personalInfo?.fullName || 'N/A'} ({student?.srNo || 'N/A'})
                          </td>
                          <td className="block sm:table-cell py-2 xs:py-3 px-2 xs:px-4 text-gray-600 dark:text-gray-400 text-xs xs:text-sm sm:text-base" data-label="Month/Year">
                            <span className="sm:hidden font-semibold mr-2">Month/Year:</span>
                            {monthName} {payment.year}
                          </td>
                          <td className="block sm:table-cell py-2 xs:py-3 px-2 xs:px-4 text-green-600 dark:text-green-400 font-semibold text-xs xs:text-sm sm:text-base" data-label="Amount">
                            <span className="sm:hidden font-semibold mr-2">Amount:</span>
                            {formatCurrency(payment.amount)}
                          </td>
                          <td className="hidden md:table-cell py-2 xs:py-3 px-2 xs:px-4 text-gray-600 dark:text-gray-400 capitalize text-xs xs:text-sm sm:text-base" data-label="Method">
                            <span className="sm:hidden font-semibold mr-2">Method:</span>
                            {payment.paymentMethod?.replace('_', ' ')}
                          </td>
                          <td className="block sm:table-cell py-2 xs:py-3 px-2 xs:px-4 text-gray-600 dark:text-gray-400 text-xs xs:text-sm sm:text-base" data-label="Date">
                            <span className="sm:hidden font-semibold mr-2">Date:</span>
                            {formatDate(payment.paymentDate)}
                          </td>
                          <td className="hidden lg:table-cell py-2 xs:py-3 px-2 xs:px-4 text-gray-600 dark:text-gray-400 text-xs xs:text-sm sm:text-base" data-label="Collected By">
                            <span className="sm:hidden font-semibold mr-2">Collected By:</span>
                            {payment.collectedByName || 'N/A'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment Form Modal */}
      {showPaymentForm && selectedStudent && (
        <MonthlyPaymentRecording
          student={selectedStudent}
          onClose={() => {
            setShowPaymentForm(false);
            setSelectedStudent(null);
          }}
        />
      )}
    </div>
  );
};

export default MonthlyPayments;

