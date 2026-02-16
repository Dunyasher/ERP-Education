import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { X, Save, Calendar, DollarSign, CreditCard, User, Building2 } from 'lucide-react';

const MonthlyPaymentRecording = ({ student, onClose, showOverlay = true }) => {
  const queryClient = useQueryClient();
  const modalRef = useRef(null);
  const [formData, setFormData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    amount: student?.feeInfo?.monthlyFee || '',
    paymentMethod: 'cash',
    paymentDate: new Date().toISOString().split('T')[0],
    accountName: '',
    notes: '',
    receiptNo: ''
  });

  const months = [
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

  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'online', label: 'Online' },
    { value: 'cheque', label: 'Cheque' }
  ];

  const paymentMutation = useMutation(
    async (data) => {
      return api.post('/accountant/monthly-payments', {
        ...data,
        studentId: student._id
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('students');
        queryClient.invalidateQueries('accountantStats');
        queryClient.invalidateQueries(['monthlyPayments', student._id]);
        toast.success('Monthly payment recorded successfully!');
        onClose();
      },
      onError: (error) => {
        const errorMessage = error.response?.data?.message || 
                           error.response?.data?.error || 
                           error.message || 
                           'Failed to record payment';
        toast.error(errorMessage);
      }
    }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!formData.accountName || !formData.accountName.trim()) {
      toast.error('Please enter the account name');
      return;
    }

    paymentMutation.mutate(formData);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <>
      {showOverlay && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-1 xs:p-2 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          <div 
            ref={modalRef}
            className="bg-white dark:bg-gray-800 rounded-lg xs:rounded-xl shadow-2xl w-full max-w-xs xs:max-w-sm sm:max-w-md md:max-w-2xl max-h-[98vh] xs:max-h-[95vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-3 xs:p-4 sm:p-6 rounded-t-lg xs:rounded-t-xl">
              <div className="flex justify-between items-center gap-2">
                <div className="flex items-center gap-2 xs:gap-3 flex-1 min-w-0">
                  <Calendar className="w-5 h-5 xs:w-6 xs:h-6 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold truncate">Record Monthly Payment</h2>
                    <p className="text-xs xs:text-sm text-green-100 mt-1 truncate">
                      {student?.personalInfo?.fullName} - {student?.srNo}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 xs:p-2 rounded-full hover:bg-white/20 transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4 xs:w-5 xs:h-5" />
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-3 xs:p-4 sm:p-6 space-y-4 xs:space-y-5 sm:space-y-6">
              {/* Student Info */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 xs:p-4">
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <User className="w-4 h-4 xs:w-5 xs:h-5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm xs:text-base truncate">{student?.personalInfo?.fullName}</p>
                    <p className="text-xs xs:text-sm text-gray-500 dark:text-gray-400 truncate">
                      Serial: {student?.srNo} | Course: {student?.academicInfo?.courseId?.name || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Month and Year */}
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 xs:gap-4">
                <div>
                  <label className="block text-xs xs:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 xs:mb-2">
                    Month *
                  </label>
                  <select
                    name="month"
                    value={formData.month}
                    onChange={handleInputChange}
                    required
                    className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-2 xs:px-3 py-1.5 xs:py-2.5 text-sm xs:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {months.map(month => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs xs:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 xs:mb-2">
                    Year *
                  </label>
                  <input
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    required
                    min="2020"
                    max="2100"
                    className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-2 xs:px-3 py-1.5 xs:py-2.5 text-sm xs:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs xs:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 xs:mb-2 flex items-center gap-1 xs:gap-2">
                  <DollarSign className="w-3 h-3 xs:w-4 xs:h-4" />
                  <span>Payment Amount *</span>
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-2 xs:px-3 py-1.5 xs:py-2.5 text-sm xs:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Monthly fee: Rs. {student?.feeInfo?.monthlyFee || '0.00'}
                </p>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs xs:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 xs:mb-2 flex items-center gap-1 xs:gap-2">
                  <CreditCard className="w-3 h-3 xs:w-4 xs:h-4" />
                  <span>Payment Method *</span>
                </label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleInputChange}
                  required
                  className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-2 xs:px-3 py-1.5 xs:py-2.5 text-sm xs:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {paymentMethods.map(method => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Date */}
              <div>
                <label className="block text-xs xs:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 xs:mb-2">
                  Payment Date *
                </label>
                <input
                  type="date"
                  name="paymentDate"
                  value={formData.paymentDate}
                  onChange={handleInputChange}
                  required
                  className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-2 xs:px-3 py-1.5 xs:py-2.5 text-sm xs:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Account Name */}
              <div>
                <label className="block text-xs xs:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 xs:mb-2 flex items-center gap-1 xs:gap-2">
                  <Building2 className="w-3 h-3 xs:w-4 xs:h-4" />
                  <span>Account Name *</span>
                </label>
                <input
                  type="text"
                  name="accountName"
                  value={formData.accountName}
                  onChange={handleInputChange}
                  required
                  className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-2 xs:px-3 py-1.5 xs:py-2.5 text-sm xs:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter account name (e.g., Main Account, Bank Account)"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Specify which account this payment was made to
                </p>
              </div>

              {/* Receipt Number */}
              <div>
                <label className="block text-xs xs:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 xs:mb-2">
                  Receipt Number (Optional)
                </label>
                <input
                  type="text"
                  name="receiptNo"
                  value={formData.receiptNo}
                  onChange={handleInputChange}
                  className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-2 xs:px-3 py-1.5 xs:py-2.5 text-sm xs:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter receipt number"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs xs:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 xs:mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="2"
                  className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-2 xs:px-3 py-1.5 xs:py-2.5 text-sm xs:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  placeholder="Additional notes about this payment"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col xs:flex-row justify-end gap-2 xs:gap-3 pt-3 xs:pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full xs:w-auto px-4 xs:px-6 py-2 xs:py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all font-semibold text-sm xs:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentMutation.isLoading}
                  className="w-full xs:w-auto px-4 xs:px-6 py-2 xs:py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold text-sm xs:text-base shadow-lg"
                >
                  <Save className="w-4 h-4 xs:w-5 xs:h-5" />
                  {paymentMutation.isLoading ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default MonthlyPaymentRecording;

