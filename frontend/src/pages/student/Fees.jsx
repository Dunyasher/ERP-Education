import { useQuery } from 'react-query';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { DollarSign, CheckCircle, XCircle, Clock, AlertTriangle, Calendar, Receipt, TrendingUp } from 'lucide-react';
import { useState } from 'react';

const StudentFees = () => {
  const { user } = useAuth();
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Get student ID from user
  const getStudentId = async () => {
    try {
      const response = await api.get('/students');
      const students = response.data;
      const student = students.find(s => s.userId?._id === user?.id || s.userId === user?.id);
      return student?._id;
    } catch (error) {
      console.error('Error fetching student ID:', error);
      return null;
    }
  };

  // Fetch student fee summary
  const { data: feeSummary, isLoading, error } = useQuery(
    ['studentFeeSummary', user?.id],
    async () => {
      const studentId = await getStudentId();
      if (!studentId) {
        throw new Error('Student record not found');
      }
      const response = await api.get(`/fees/student/${studentId}/summary`);
      return response.data;
    },
    {
      enabled: !!user?.id,
      retry: 1
    }
  );

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

  const getPaymentStatusBadge = (status, isOverdue) => {
    const badges = {
      paid_on_time: { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle, text: 'Paid On Time' },
      paid_late: { color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock, text: 'Paid Late' },
      paid: { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle, text: 'Paid' },
      partial: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Clock, text: 'Partial' },
      overdue: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: AlertTriangle, text: 'Overdue' },
      pending: { color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300', icon: Clock, text: 'Pending' }
    };
    
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        <Icon className="w-4 h-4" />
        {badge.text}
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

  if (error || !feeSummary) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Fees</h1>
        <div className="card">
          <p className="text-gray-600 dark:text-gray-400">
            {error?.message || 'No fee information found.'}
          </p>
        </div>
      </div>
    );
  }

  const { summary, invoices, confirmation, paymentStatus } = feeSummary;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          My Fees
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track your fee payments, due dates, and payment status
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-100">Total Fee</p>
              <p className="text-3xl font-bold mt-2">{formatCurrency(summary.totalFeeAmount)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-100">Total Paid</p>
              <p className="text-3xl font-bold mt-2">{formatCurrency(summary.totalPaidAmount)}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-200" />
          </div>
        </div>

        <div className={`card bg-gradient-to-br ${summary.totalPendingAmount > 0 ? 'from-red-500 to-red-600' : 'from-gray-500 to-gray-600'} text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/80">Total Due</p>
              <p className="text-3xl font-bold mt-2">{formatCurrency(summary.totalPendingAmount)}</p>
            </div>
            <XCircle className="w-8 h-8 text-white/80" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-100">Payment %</p>
              <p className="text-3xl font-bold mt-2">{summary.paymentPercentage}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Payment Confirmation */}
      <div className="card bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-2 border-green-200 dark:border-green-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Payment Confirmation
            </h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="text-gray-700 dark:text-gray-300">
                  <strong>Total Paid Overall:</strong> {formatCurrency(confirmation.totalPaidOverall)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-gray-700 dark:text-gray-300">
                  <strong>Total Due Overall:</strong> {formatCurrency(confirmation.totalDueOverall)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span className="text-gray-700 dark:text-gray-300">
                  <strong>Total Payments Made:</strong> {confirmation.paymentCount}
                </span>
              </div>
              {confirmation.lastPaymentDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  <span className="text-gray-700 dark:text-gray-300">
                    <strong>Last Payment Date:</strong> {formatDate(confirmation.lastPaymentDate)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Paid On Time</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {paymentStatus.paidOnTime}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overdue</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                {paymentStatus.overdue}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                {paymentStatus.pending}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Invoices</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {paymentStatus.totalInvoices}
              </p>
            </div>
            <Receipt className="w-8 h-8 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Payment Progress */}
      {summary.totalFeeAmount > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Payment Progress
            </h2>
            <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              {summary.paymentPercentage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
            <div
              className="bg-green-500 h-4 rounded-full transition-all duration-300"
              style={{ width: `${summary.paymentPercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-2">
            <span>Paid: {formatCurrency(summary.totalPaidAmount)}</span>
            <span>Due: {formatCurrency(summary.totalPendingAmount)}</span>
          </div>
        </div>
      )}

      {/* Invoices List */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          Invoice Details
        </h2>
        
        {invoices && invoices.length > 0 ? (
          <div className="space-y-4">
            {invoices.map((invoice, index) => (
              <div
                key={invoice.invoiceId || index}
                className={`p-6 rounded-lg border-2 ${
                  invoice.isOverdue 
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
                    : invoice.isPaidOnTime
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}
              >
                {/* Invoice Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Invoice #{invoice.invoiceNo}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Date: {formatDate(invoice.invoiceDate)}
                    </p>
                  </div>
                  {getPaymentStatusBadge(invoice.paymentStatus, invoice.isOverdue)}
                </div>

                {/* Invoice Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Amount</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatCurrency(invoice.totalAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Paid Amount</p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(invoice.paidAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Amount</p>
                    <p className={`text-lg font-bold ${
                      invoice.pendingAmount > 0 
                        ? 'text-red-600 dark:text-red-400' 
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {formatCurrency(invoice.pendingAmount)}
                    </p>
                  </div>
                </div>

                {/* Due Date and Payment Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Due Date</p>
                    <p className={`text-base font-semibold ${
                      invoice.dueDate && new Date(invoice.dueDate) < new Date() && invoice.pendingAmount > 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {formatDate(invoice.dueDate)}
                      {invoice.dueDate && new Date(invoice.dueDate) < new Date() && invoice.pendingAmount > 0 && (
                        <span className="ml-2 text-xs">(Overdue)</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Payment Date</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">
                      {formatDate(invoice.paymentDate) || 'Not Paid'}
                    </p>
                    {invoice.paymentDate && invoice.dueDate && (
                      <p className="text-xs mt-1">
                        {new Date(invoice.paymentDate) <= new Date(invoice.dueDate) ? (
                          <span className="text-green-600 dark:text-green-400">✓ Paid on time</span>
                        ) : (
                          <span className="text-yellow-600 dark:text-yellow-400">⚠ Paid after due date</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>

                {/* Payment Transactions */}
                {invoice.transactions && invoice.transactions.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Payment Transactions:
                    </p>
                    <div className="space-y-2">
                      {invoice.transactions.map((txn, txnIndex) => (
                        <div
                          key={txnIndex}
                          className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatCurrency(txn.amount)} - {txn.paymentMethod}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(txn.paymentDate)}
                              {txn.receiptNo && ` • Receipt: ${txn.receiptNo}`}
                            </p>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {txn.transactionNo}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No invoices found.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentFees;

