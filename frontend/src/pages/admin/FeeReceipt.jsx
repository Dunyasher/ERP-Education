import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import { Printer, ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';

const FeeReceipt = () => {
  const { id: invoiceId } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['feeReceipt', invoiceId],
    queryFn: async () => {
      const res = await api.get(`/fees/receipt/${invoiceId}`);
      return res.data;
    },
    enabled: !!invoiceId
  });

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    if (data) {
      document.title = `Fee Receipt - ${data.invoice?.invoiceNo || invoiceId}`;
    }
    return () => {
      document.title = 'ERP Management';
    };
  }, [data, invoiceId]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">
            {error?.response?.data?.message || 'Failed to load receipt'}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="btn-secondary flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const { invoice, transactions = [] } = data;
  const student = invoice?.studentId;
  const items = invoice?.items || [];
  const subtotal = invoice?.subtotal ?? items.reduce((sum, i) => sum + (i.amount || 0) * (i.quantity || 1), 0);
  const discount = invoice?.discount || 0;
  const totalAmount = invoice?.totalAmount || subtotal - discount;
  const paidAmount = invoice?.paidAmount || 0;
  const pendingAmount = invoice?.pendingAmount ?? Math.max(0, totalAmount - paidAmount);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 print:bg-white">
      {/* Action Bar - Hidden when printing */}
      <div className="no-print sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
          >
            <Printer className="w-5 h-5" />
            Print Receipt
          </button>
        </div>
      </div>

      {/* Receipt Content */}
      <div className="max-w-4xl mx-auto p-6 print:p-0">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden print:shadow-none print:rounded-none">
          <div className="p-8 print:p-6">
            {/* Header */}
            <div className="text-center border-b-2 border-gray-300 dark:border-gray-600 pb-6 mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                Fee Receipt
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Education Management System
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Generated on: {formatDate(new Date())}
              </p>
            </div>

            {/* Student Details */}
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 border-b border-gray-200 dark:border-gray-600 pb-2">
                Student Details
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {student?.personalInfo?.fullName || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Roll / SR No</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {student?.rollNo || student?.srNo || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Admission No</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {student?.admissionNo || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Course</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {student?.academicInfo?.courseId?.name || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Father Name</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {student?.parentInfo?.fatherName || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Contact</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {student?.parentInfo?.contactNo || student?.parentInfo?.fatherContact || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Fee Details */}
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 border-b border-gray-200 dark:border-gray-600 pb-2">
                Fee Details
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Invoice No</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {invoice?.invoiceNo || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Invoice Date</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatDate(invoice?.invoiceDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Due Date</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatDate(invoice?.dueDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                    invoice?.status === 'paid'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : invoice?.status === 'partial'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {invoice?.status?.toUpperCase() || 'PENDING'}
                  </span>
                </div>
              </div>

              {/* Fee Items Breakdown */}
              {items.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-gray-300 dark:border-gray-600">
                        <th className="text-left py-2 font-semibold text-gray-900 dark:text-white">Description</th>
                        <th className="text-right py-2 font-semibold text-gray-900 dark:text-white">Qty</th>
                        <th className="text-right py-2 font-semibold text-gray-900 dark:text-white">Amount</th>
                        <th className="text-right py-2 font-semibold text-gray-900 dark:text-white">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-200 dark:border-gray-600">
                          <td className="py-2 text-gray-900 dark:text-white">
                            {item.description || item.name || 'Fee Item'}
                          </td>
                          <td className="py-2 text-right text-gray-700 dark:text-gray-300">
                            {item.quantity ?? 1}
                          </td>
                          <td className="py-2 text-right text-gray-700 dark:text-gray-300">
                            {formatCurrency(item.amount)}
                          </td>
                          <td className="py-2 text-right font-medium text-gray-900 dark:text-white">
                            {formatCurrency((item.amount || 0) * (item.quantity || 1))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Totals */}
              <div className="mt-4 flex justify-end">
                <div className="w-full max-w-xs space-y-2">
                  {items.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(subtotal)}</span>
                    </div>
                  )}
                  {discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Discount</span>
                      <span className="font-medium text-red-600 dark:text-red-400">- {formatCurrency(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-semibold pt-2 border-t border-gray-300 dark:border-gray-600">
                    <span className="text-gray-900 dark:text-white">Total Amount</span>
                    <span className="text-gray-900 dark:text-white">{formatCurrency(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                    <span>Paid Amount</span>
                    <span className="font-semibold">{formatCurrency(paidAmount)}</span>
                  </div>
                  {pendingAmount > 0 && (
                    <div className="flex justify-between text-sm text-red-600 dark:text-red-400">
                      <span>Pending Amount</span>
                      <span className="font-semibold">{formatCurrency(pendingAmount)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Payment History */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 border-b border-gray-200 dark:border-gray-600 pb-2">
                Payment History
              </h2>
              {transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-gray-300 dark:border-gray-600">
                        <th className="text-left py-2 font-semibold text-gray-900 dark:text-white">#</th>
                        <th className="text-left py-2 font-semibold text-gray-900 dark:text-white">Transaction No</th>
                        <th className="text-left py-2 font-semibold text-gray-900 dark:text-white">Receipt No</th>
                        <th className="text-left py-2 font-semibold text-gray-900 dark:text-white">Payment Date</th>
                        <th className="text-left py-2 font-semibold text-gray-900 dark:text-white">Method</th>
                        <th className="text-right py-2 font-semibold text-gray-900 dark:text-white">Amount</th>
                        <th className="text-left py-2 font-semibold text-gray-900 dark:text-white">Collected By</th>
                        <th className="text-left py-2 font-semibold text-gray-900 dark:text-white">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((txn, idx) => (
                        <tr key={txn._id || idx} className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="py-2 text-gray-700 dark:text-gray-300">{idx + 1}</td>
                          <td className="py-2 text-gray-900 dark:text-white font-medium">{txn.transactionNo || 'N/A'}</td>
                          <td className="py-2 text-gray-700 dark:text-gray-300">{txn.receiptNo || '-'}</td>
                          <td className="py-2 text-gray-700 dark:text-gray-300">{formatDate(txn.paymentDate)}</td>
                          <td className="py-2 text-gray-700 dark:text-gray-300 capitalize">
                            {txn.paymentMethod?.replace('_', ' ') || 'N/A'}
                          </td>
                          <td className="py-2 text-right font-semibold text-green-600 dark:text-green-400">
                            {formatCurrency(txn.amount)}
                          </td>
                          <td className="py-2 text-gray-700 dark:text-gray-300">{txn.collectedByName || 'N/A'}</td>
                          <td className="py-2 text-gray-600 dark:text-gray-400 max-w-[120px] truncate" title={txn.notes}>
                            {txn.notes || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-3 flex justify-end">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      Total Payments: {formatCurrency(transactions.reduce((s, t) => s + (t.amount || 0), 0))}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 italic py-4">
                  No payment transactions recorded yet.
                </p>
              )}
            </div>

            {invoice?.notes && (
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-semibold">Notes:</span> {invoice.notes}
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-6 border-t-2 border-gray-300 dark:border-gray-600">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Student/Parent Signature</p>
                  <div className="border-b border-gray-400 w-48 h-12 mt-1" />
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Authorized Signature</p>
                  <div className="border-b border-gray-400 w-48 h-12 mt-1 ml-auto" />
                </div>
              </div>
              <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">
                This is a computer-generated receipt. Valid without signature.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
};

export default FeeReceipt;
