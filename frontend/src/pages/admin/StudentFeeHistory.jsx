import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../../utils/api';
import { ArrowLeft, DollarSign, CheckCircle, AlertCircle, Calendar, Clock } from 'lucide-react';

const StudentFeeHistory = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const getBackPath = () => {
    if (location.pathname.includes('/accountant/')) {
      return '/accountant/students';
    }
    return '/admin/students';
  };

  const { data, isLoading, error } = useQuery(
    ['studentHistory', id],
    async () => {
      try {
        if (!id) {
          throw new Error('Student ID is required');
        }
        const response = await api.get(`/students/${id}/history`);
        if (!response.data) {
          throw new Error('No data received from server');
        }
        return response.data;
      } catch (err) {
        console.error('Error fetching student history:', err);
        console.error('Error response:', err.response);
        console.error('Error response data:', err.response?.data);
        
        // If we get a response with student data but with a warning, still return it
        if (err.response?.data?.student && err.response?.data?.warning) {
          console.log('⚠️ Received student data with warning, returning it anyway');
          return err.response.data;
        }
        
        if (err.response?.status === 404) {
          const serverMessage = err.response?.data?.message || 'Student not found';
          throw new Error(serverMessage);
        }
        
        if (!err.response) {
          throw new Error('Unable to connect to server. Please check if the backend is running.');
        }
        
        throw err;
      }
    },
    { 
      enabled: !!id, 
      retry: false,
      refetchOnWindowFocus: false
    }
  );

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '$0';
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

  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading student fee history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to load student fee history';
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Error</h2>
          <p className="text-red-600 dark:text-red-400 mb-4">{errorMessage}</p>
          <button
            onClick={() => navigate(getBackPath())}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Back to Students
          </button>
        </div>
      </div>
    );
  }

  const student = data?.student || null;
  const paymentHistory = Array.isArray(data?.paymentHistory) ? data.paymentHistory : [];
  const paymentInstallments = Array.isArray(data?.paymentInstallments) ? data.paymentInstallments : [];
  const monthlyBreakdown = Array.isArray(data?.monthlyBreakdown) ? data.monthlyBreakdown : [];
  const summary = data?.summary || {
    totalFee: 0,
    totalPaid: 0,
    pendingFee: 0
  };

  if (!student) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Student not found</p>
          <button
            onClick={() => navigate(getBackPath())}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Back to Students
          </button>
        </div>
      </div>
    );
  }

  // Sort payment installments by date (oldest first for timeline)
  const sortedInstallments = [...paymentInstallments].sort((a, b) => {
    const dateA = new Date(a.paymentDate || a.createdAt);
    const dateB = new Date(b.paymentDate || b.createdAt);
    return dateA - dateB;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => navigate(getBackPath())}
          className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Back to Students"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Complete Student Details
          </h1>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Serial No:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">{student.srNo || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Student Name:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">{student.personalInfo?.fullName || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Father Name:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">{student.parentInfo?.fatherName || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Course/Branch:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                {student.academicInfo?.courseId?.name || 'N/A'}
                {student.academicInfo?.courseId?.categoryId?.name && ` (${student.academicInfo.courseId.categoryId.name})`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Fee Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-blue-900 dark:text-blue-200">Total Fee</h3>
          </div>
          <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
            {formatCurrency(summary.totalFee || student.feeInfo?.totalFee || 0)}
          </p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            <h3 className="font-semibold text-green-900 dark:text-green-200">Total Paid Fee</h3>
          </div>
          <p className="text-3xl font-bold text-green-700 dark:text-green-300">
            {formatCurrency(summary.totalPaid || student.feeInfo?.paidFee || 0)}
          </p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            <h3 className="font-semibold text-red-900 dark:text-red-200">Remaining Fee</h3>
          </div>
          <p className="text-3xl font-bold text-red-700 dark:text-red-300">
            {formatCurrency(summary.pendingFee || student.feeInfo?.pendingFee || 
              (student.feeInfo?.totalFee || 0) - (student.feeInfo?.paidFee || 0))}
          </p>
        </div>
      </div>

      {/* Personal Information Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Personal Information</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Serial Number</p>
              <p className="font-semibold text-gray-900 dark:text-white">{student.srNo || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Admission Number</p>
              <p className="font-semibold text-gray-900 dark:text-white">{student.admissionNo || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Roll Number</p>
              <p className="font-semibold text-gray-900 dark:text-white">{student.rollNo || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Full Name</p>
              <p className="font-semibold text-gray-900 dark:text-white">{student.personalInfo?.fullName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Date of Birth</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {formatDate(student.personalInfo?.dateOfBirth)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Gender</p>
              <p className="font-semibold text-gray-900 dark:text-white capitalize">
                {student.personalInfo?.gender || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Blood Group</p>
              <p className="font-semibold text-gray-900 dark:text-white">{student.personalInfo?.bloodGroup || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Nationality</p>
              <p className="font-semibold text-gray-900 dark:text-white">{student.personalInfo?.nationality || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Contact Information</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Phone Number</p>
              <p className="font-semibold text-gray-900 dark:text-white">{student.contactInfo?.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Email Address</p>
              <p className="font-semibold text-gray-900 dark:text-white">{student.contactInfo?.email || 'N/A'}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Address</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {student.contactInfo?.address?.street && `${student.contactInfo.address.street}, `}
                {student.contactInfo?.address?.city && `${student.contactInfo.address.city}, `}
                {student.contactInfo?.address?.state && `${student.contactInfo.address.state} `}
                {student.contactInfo?.address?.zipCode && `${student.contactInfo.address.zipCode}, `}
                {student.contactInfo?.address?.country || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Parent/Guardian Information Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Parent/Guardian Information</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Father's Information</p>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Name</p>
                  <p className="font-medium text-gray-900 dark:text-white">{student.parentInfo?.fatherName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                  <p className="font-medium text-gray-900 dark:text-white">{student.parentInfo?.fatherPhone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Occupation</p>
                  <p className="font-medium text-gray-900 dark:text-white">{student.parentInfo?.fatherOccupation || 'N/A'}</p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Mother's Information</p>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Name</p>
                  <p className="font-medium text-gray-900 dark:text-white">{student.parentInfo?.motherName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                  <p className="font-medium text-gray-900 dark:text-white">{student.parentInfo?.motherPhone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Occupation</p>
                  <p className="font-medium text-gray-900 dark:text-white">{student.parentInfo?.motherOccupation || 'N/A'}</p>
                </div>
              </div>
            </div>
            {(student.parentInfo?.guardianName || student.parentInfo?.guardianPhone) && (
              <div className="md:col-span-2">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Guardian Information</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Name</p>
                    <p className="font-medium text-gray-900 dark:text-white">{student.parentInfo?.guardianName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                    <p className="font-medium text-gray-900 dark:text-white">{student.parentInfo?.guardianPhone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Relation</p>
                    <p className="font-medium text-gray-900 dark:text-white">{student.parentInfo?.guardianRelation || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Academic Information Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Academic Information</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Institute Type</p>
              <p className="font-semibold text-gray-900 dark:text-white capitalize">
                {student.academicInfo?.instituteType?.replace('_', ' ') || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Course/Branch</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {student.academicInfo?.courseId?.name || 'N/A'}
                {student.academicInfo?.courseId?.categoryId?.name && (
                  <span className="text-gray-500 dark:text-gray-400 ml-2">
                    ({student.academicInfo.courseId.categoryId.name})
                  </span>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Session</p>
              <p className="font-semibold text-gray-900 dark:text-white">{student.academicInfo?.session || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Admission Date</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {formatDate(student.academicInfo?.admissionDate || student.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Status</p>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                student.academicInfo?.status === 'active' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
                  : student.academicInfo?.status === 'inactive'
                  ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
              }`}>
                {student.academicInfo?.status?.toUpperCase() || 'N/A'}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Admitted By</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {student.academicInfo?.admittedByName || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Fee Information Summary Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Fee Information Summary</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Fee</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(summary.totalFee || student.feeInfo?.totalFee || 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Paid</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(summary.totalPaid || student.feeInfo?.paidFee || 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Remaining Fee</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(summary.pendingFee || student.feeInfo?.pendingFee || 
                  (student.feeInfo?.totalFee || 0) - (student.feeInfo?.paidFee || 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Month-by-Month Breakdown */}
      {monthlyBreakdown && monthlyBreakdown.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Month-by-Month Payment Breakdown</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Complete payment history organized by month - All payments from admission to date
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {monthlyBreakdown.map((month, index) => (
                <div key={month.monthKey} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/30">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{month.month}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {month.transactions.length} payment{month.transactions.length !== 1 ? 's' : ''} this month
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(month.totalAmount)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Total for {month.month}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {month.transactions.map((txn, txnIndex) => (
                      <div key={txnIndex} className="flex justify-between items-center text-sm bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center gap-4">
                          <span className="font-medium text-gray-900 dark:text-white">
                            Payment #{txnIndex + 1}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400">
                            {formatDateTime(txn.paymentDate || txn.createdAt)}
                          </span>
                          <span className="text-gray-600 dark:text-gray-300 capitalize px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                            {txn.paymentMethod?.replace('_', ' ') || 'N/A'}
                          </span>
                          {txn.invoiceNo && txn.invoiceNo !== 'N/A' && (
                            <span className="text-gray-500 dark:text-gray-400 text-xs">
                              Invoice: {txn.invoiceNo}
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-green-600 dark:text-green-400 text-lg">
                            {formatCurrency(txn.amount || 0)}
                          </span>
                          {txn.collectedByName && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              By: {txn.collectedByName}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step-by-Step Payment Timeline */}
      {sortedInstallments && sortedInstallments.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Step-by-Step Payment History</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Complete chronological payment timeline</p>
          </div>
          <div className="p-6">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-600"></div>
              
              <div className="space-y-6">
                {sortedInstallments.map((installment, index) => {
                  const runningTotal = sortedInstallments.slice(0, index + 1).reduce((sum, txn) => sum + (txn.amount || 0), 0);
                  return (
                    <div key={index} className="relative flex items-start gap-4">
                      {/* Timeline dot */}
                      <div className="relative z-10 flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{index + 1}</span>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              Payment #{index + 1} - {formatDate(installment.paymentDate || installment.createdAt)}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Transaction: {installment.transactionNo || 'N/A'} | Invoice: {installment.invoiceNo || 'N/A'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600 dark:text-green-400">
                              {formatCurrency(installment.amount || 0)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Running Total: {formatCurrency(runningTotal)}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <span>Method: {installment.paymentMethod?.replace('_', ' ').toUpperCase() || 'N/A'}</span>
                          <span>Collected by: {installment.collectedByName || 'N/A'}</span>
                          {installment.notes && <span>Note: {installment.notes}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All Payment Transactions Table */}
      {paymentInstallments && paymentInstallments.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">All Payment Transactions</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Complete list of all payment installments</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Transaction No</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Invoice No</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Amount Paid</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Payment Method</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Payment Date</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Collected By</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {paymentInstallments.map((installment, index) => (
                  <tr key={installment.transactionNo || index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{index + 1}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {installment.transactionNo || 'N/A'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {installment.invoiceNo || 'N/A'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-green-600 dark:text-green-400">
                      {formatCurrency(installment.amount || 0)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 capitalize">
                      {installment.paymentMethod?.replace('_', ' ') || 'N/A'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDateTime(installment.paymentDate || installment.createdAt)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {installment.collectedByName || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invoice Summary Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Complete Invoice & Fee Summary</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            All fee records from admission to date - Course/Branch: {student.academicInfo?.courseId?.name || 'N/A'}
            {student.academicInfo?.courseId?.categoryId?.name && ` (${student.academicInfo.courseId.categoryId.name})`}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">INVOICE NO</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">TOTAL FEE</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">TOTAL PAID FEE</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">REMAINING FEE</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">STATUS</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">DATE</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">ADMITTED BY</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {paymentHistory && paymentHistory.length > 0 ? (
                paymentHistory.map((payment, index) => (
                  <tr key={payment.invoiceNo || index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">
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
                        {payment.status || student.academicInfo?.status || 'active'}
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
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">N/A</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(student.feeInfo?.totalFee || 0)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-green-600 dark:text-green-400">
                    {formatCurrency(student.feeInfo?.paidFee || 0)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-red-600 dark:text-red-400">
                    {formatCurrency(student.feeInfo?.pendingFee || (student.feeInfo?.totalFee || 0) - (student.feeInfo?.paidFee || 0))}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200">
                      {student.academicInfo?.status || 'active'}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(student.academicInfo?.admissionDate || student.createdAt)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 font-medium">
                    {student.academicInfo?.admittedByName || 'N/A'}
                  </td>
                </tr>
              )}
            </tbody>
            {/* Summary Footer */}
            <tfoot className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <td colSpan="2" className="px-4 py-4 text-sm font-bold text-gray-900 dark:text-white text-right">
                  Grand Total:
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                  {formatCurrency(summary.totalFee || student.feeInfo?.totalFee || 0)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(summary.totalPaid || student.feeInfo?.paidFee || 0)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(summary.pendingFee || student.feeInfo?.pendingFee || 
                    (student.feeInfo?.totalFee || 0) - (student.feeInfo?.paidFee || 0))}
                </td>
                <td colSpan="2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentFeeHistory;
