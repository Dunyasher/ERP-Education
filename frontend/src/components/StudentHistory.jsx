import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import { X, DollarSign, Calendar, FileText, CheckCircle, Clock, AlertCircle, User } from 'lucide-react';

const StudentHistory = ({ studentId, onClose }) => {
  const { data, isLoading, error } = useQuery(
    ['studentHistory', studentId],
    async () => {
      const response = await api.get(`/students/${studentId}/history`);
      return response.data;
    },
    {
      enabled: !!studentId,
      retry: 1
    }
  );

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      paid: { bg: 'bg-green-100 dark:bg-green-900/20', text: 'text-green-800 dark:text-green-200', icon: CheckCircle },
      partial: { bg: 'bg-yellow-100 dark:bg-yellow-900/20', text: 'text-yellow-800 dark:text-yellow-200', icon: Clock },
      pending: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-200', icon: AlertCircle },
      overdue: { bg: 'bg-red-100 dark:bg-red-900/20', text: 'text-red-800 dark:text-red-200', icon: AlertCircle }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
        {status?.toUpperCase() || 'PENDING'}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading student history...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <p className="text-red-600 dark:text-red-400">Failed to load student history</p>
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { student, paymentHistory, paymentInstallments, summary } = data || {};

  if (!student) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto my-8 shadow-2xl">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <User className="w-6 h-6" />
                Student History
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {student.personalInfo?.fullName || 'N/A'} - {student.srNo || 'N/A'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Student Info Header */}
          <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Student Name</p>
                <p className="font-semibold text-gray-900 dark:text-white">{student.personalInfo?.fullName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Serial No</p>
                <p className="font-semibold text-gray-900 dark:text-white">{student.srNo || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Course</p>
                <p className="font-semibold text-gray-900 dark:text-white">{student.academicInfo?.courseId?.name || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Payment Installments Table - Shows all individual payments */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Payment Installments History
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      SERIAL NO
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      INVOICE NO
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      AMOUNT PAID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      PAYMENT METHOD
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      PAYMENT DATE
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      COLLECTED BY
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {paymentInstallments && paymentInstallments.length > 0 ? (
                    paymentInstallments.map((installment, index) => (
                      <tr key={installment.transactionNo || index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">
                          {student.srNo || 'N/A'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {installment.invoiceNo || 'N/A'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-green-600 dark:text-green-400">
                          {formatCurrency(installment.amount || 0)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 capitalize">
                          {installment.paymentMethod?.replace('_', ' ') || 'N/A'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(installment.paymentDate || installment.createdAt)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 font-medium">
                          {installment.collectedByName || 'N/A'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p>No payment installments found</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Invoice Summary Table */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Invoice Summary
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      INVOICE NO
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      TOTAL FEE
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      TOTAL PAID FEE
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      REMAINING FEE
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      STATUS
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      DATE
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      ADMITTED BY
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {paymentHistory && paymentHistory.length > 0 ? (
                    paymentHistory.map((payment, index) => (
                      <tr key={payment.invoiceNo || index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {payment.invoiceNo || 'N/A'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(payment.totalAmount || 0)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-green-600 dark:text-green-400">
                          {formatCurrency(payment.paidAmount || 0)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-red-600 dark:text-red-400">
                          {formatCurrency(payment.pendingAmount || 0)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200">
                            {student.academicInfo?.status || 'active'}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(payment.invoiceDate || payment.createdAt)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 font-medium">
                          {payment.collectedByName || student.academicInfo?.admittedByName || 'N/A'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p>No invoice history found</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Footer */}
          {summary && (
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Total Fee</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatCurrency(summary.totalFee || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Total Paid</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(summary.totalPaid || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Remaining Fee</p>
                  <p className="text-lg font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(summary.pendingFee || 0)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentHistory;

