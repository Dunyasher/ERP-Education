import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import { ArrowLeft, Users, DollarSign, Edit, X, User, Phone, Mail, Calendar, GraduationCap, BookOpen, MapPin, CreditCard, FileText, CheckCircle, Clock, AlertCircle, UserCircle, PhoneCall, Printer } from 'lucide-react';
import { useAuth } from '../../store/hooks';
import { useEffect } from 'react';

const StudentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const isAccountant = user?.role === 'accountant';
  
  const getBackPath = () => {
    if (location.pathname.includes('/accountant/')) {
      return '/accountant/students';
    }
    return '/admin/students';
  };

  // Fetch student details
  const { data: studentDetail, isLoading: isLoadingDetail, error: studentError } = useQuery({
    queryKey: ['studentDetail', id],
    queryFn: async () => {
      if (!id) return null;
      try {
        const response = await api.get(`/students/${id}`);
        
        // Check if response contains an error message
        if (response.data?.message === 'Access denied') {
          throw new Error('Access denied: You do not have permission to view this student');
        }
        
        // Verify data exists
        if (!response.data) {
          throw new Error('No student data received');
        }
        
        // Check for missing nested objects and log warnings
        if (!response.data.personalInfo) {
          console.error('❌ Missing personalInfo in response!');
          console.error('   Response keys:', Object.keys(response.data));
        }
        if (!response.data.contactInfo) {
          console.error('❌ Missing contactInfo in response!');
        }
        
        // If nested objects are missing, create empty objects to prevent crashes
        if (!response.data.personalInfo) {
          response.data.personalInfo = {};
        }
        if (!response.data.contactInfo) {
          response.data.contactInfo = { address: {} };
        }
        if (!response.data.parentInfo) {
          response.data.parentInfo = {};
        }
        if (!response.data.academicInfo) {
          response.data.academicInfo = {};
        }
        if (!response.data.feeInfo) {
          response.data.feeInfo = {};
        }
        
        return response.data;
      } catch (error) {
        console.error('❌ Error fetching student:', error);
        console.error('   Status:', error.response?.status);
        console.error('   Message:', error.response?.data?.message || error.message);
        throw error;
      }
    },
    enabled: !!id,
  });

  // Fetch invoices for the student to get fee breakdown
  const { data: studentInvoices = [] } = useQuery({
    queryKey: ['studentInvoices', id],
    queryFn: async () => {
      if (!id) return [];
      try {
        const response = await api.get('/fees/invoices');
        const allInvoices = response.data || [];
        // Filter invoices for this student
        return allInvoices.filter(inv => {
          const invStudentId = inv.studentId?._id?.toString() || inv.studentId?.toString() || inv.studentId;
          return invStudentId === id.toString();
        });
      } catch (error) {
        console.error('Error fetching invoices:', error);
        return [];
      }
    },
    enabled: !!id,
  });

  // Print styles - Optimized to fit all data on one page
  // IMPORTANT: useEffect must be called before any early returns to follow Rules of Hooks
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @media print {
        @page {
          margin: 0.3cm;
          size: A4;
        }
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          background: white !important;
          font-size: 9px !important;
          line-height: 1.2 !important;
        }
        .print\\:hidden {
          display: none !important;
        }
        /* Remove all padding and margins */
        .min-h-screen {
          min-height: auto !important;
          padding: 0 !important;
        }
        .p-4, .p-6, .p-8, .p-3 {
          padding: 4px !important;
        }
        .mb-6, .mb-4, .mb-8, .mb-2 {
          margin-bottom: 4px !important;
        }
        .mt-4, .mt-2, .mt-6, .mt-8 {
          margin-top: 4px !important;
        }
        .gap-4, .gap-6, .gap-3, .gap-2 {
          gap: 4px !important;
        }
        .space-y-4 > * + * {
          margin-top: 4px !important;
        }
        /* Ensure all backgrounds are white for print */
        .bg-gray-50, .bg-white, .bg-gray-800, .bg-blue-50, .bg-green-50, .bg-red-50,
        .bg-orange-50, .bg-purple-50, .bg-indigo-50, .bg-yellow-50,
        .bg-gradient-to-br, .bg-gradient-to-r,
        .dark\\:bg-gray-900, .dark\\:bg-gray-800, .dark\\:bg-gray-700 {
          background: white !important;
        }
        /* Text colors for print - smaller sizes */
        .text-gray-900, .text-gray-800, .text-gray-700, .text-gray-600, .text-gray-500,
        .text-blue-600, .text-green-600, .text-red-600, .text-orange-600, .text-purple-600,
        .dark\\:text-white, .dark\\:text-gray-300, .dark\\:text-gray-400 {
          color: black !important;
        }
        .text-2xl, .text-3xl, .text-4xl {
          font-size: 14px !important;
        }
        .text-xl {
          font-size: 12px !important;
        }
        .text-lg {
          font-size: 11px !important;
        }
        .text-sm {
          font-size: 9px !important;
        }
        .text-xs {
          font-size: 8px !important;
        }
        /* Headers */
        h1 {
          font-size: 16px !important;
          margin-bottom: 4px !important;
        }
        h2 {
          font-size: 12px !important;
          margin-bottom: 4px !important;
        }
        h3 {
          font-size: 11px !important;
          margin-bottom: 3px !important;
        }
        /* Borders for print */
        .border-gray-200, .border-gray-700, .border-blue-200, .border-green-200, .border-red-200 {
          border-color: #000 !important;
          border-width: 0.5px !important;
        }
        /* Tables - compact */
        table {
          page-break-inside: auto;
          border-collapse: collapse !important;
          width: 100% !important;
          font-size: 8px !important;
        }
        thead {
          display: table-header-group !important;
          background: #f3f4f6 !important;
        }
        thead th {
          background: #f3f4f6 !important;
          color: black !important;
          border: 0.5px solid #000 !important;
          padding: 3px 4px !important;
          font-size: 8px !important;
        }
        tbody tr {
          page-break-inside: avoid;
          page-break-after: auto;
          border-bottom: 0.5px solid #000 !important;
        }
        tbody td {
          border: 0.5px solid #ccc !important;
          padding: 3px 4px !important;
          font-size: 8px !important;
        }
        /* Remove rounded corners and shadows */
        .rounded-lg, .rounded-xl, .rounded-full, .rounded-2xl {
          border-radius: 0 !important;
        }
        .shadow-sm, .shadow-lg, .shadow-xl, .shadow-2xl {
          box-shadow: none !important;
        }
        /* Cards and sections - compact */
        .bg-white, .bg-gray-800 {
          border: 0.5px solid #000 !important;
          margin-bottom: 4px !important;
          padding: 4px !important;
          page-break-inside: avoid;
        }
        /* Grid layouts for print - tighter */
        .grid {
          display: grid !important;
          gap: 4px !important;
        }
        /* Icons - hide or make smaller */
        svg {
          width: 10px !important;
          height: 10px !important;
        }
        /* Profile image area */
        .w-24, .w-32, .h-24, .h-32 {
          width: 50px !important;
          height: 50px !important;
        }
        img {
          max-width: 100% !important;
          height: auto !important;
        }
        /* Flex containers */
        .flex {
          display: flex !important;
        }
        .flex-col {
          flex-direction: column !important;
        }
        /* Remove decorative elements */
        .absolute {
          display: none !important;
        }
        /* Compact fee cards */
        .group {
          padding: 4px !important;
        }
        /* Ensure everything fits */
        .max-w-7xl {
          max-width: 100% !important;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  // Helper function to get latest invoice
  const getLatestInvoice = () => {
    if (!studentInvoices || studentInvoices.length === 0) return null;
    return studentInvoices.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.invoiceDate || 0);
      const dateB = new Date(b.createdAt || b.invoiceDate || 0);
      return dateB - dateA;
    })[0];
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };


  if (isLoadingDetail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">Loading student details...</p>
        </div>
      </div>
    );
  }

  if (studentError) {
    const errorMessage = studentError.response?.data?.message || studentError.message || 'Failed to load student details';
    console.error('❌ StudentDetails Error:', {
      error: studentError,
      status: studentError.response?.status,
      message: errorMessage,
      data: studentError.response?.data
    });
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-6">
        <div className="text-center bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-2 text-lg font-semibold">Error Loading Student</p>
          <p className="text-gray-500 dark:text-gray-500 mb-6 text-sm">{errorMessage}</p>
          <p className="text-gray-400 dark:text-gray-600 mb-6 text-xs">Status: {studentError.response?.status || 'Unknown'}</p>
          <button
            onClick={() => navigate(getBackPath())}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl font-medium"
          >
            Back to Students
          </button>
        </div>
      </div>
    );
  }

  // Check if studentDetail exists but has no data
  if (!studentDetail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-6">
        <div className="text-center bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-2 text-lg font-semibold">No Student Data</p>
          <p className="text-gray-500 dark:text-gray-500 mb-6 text-sm">Student data not found or not loaded yet.</p>
          <button
            onClick={() => navigate(getBackPath())}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl font-medium"
          >
            Back to Students
          </button>
        </div>
      </div>
    );
  }

  if (!studentDetail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-6">
        <div className="text-center bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">Student not found</p>
          <p className="text-gray-500 dark:text-gray-500 mb-6 text-sm">Student ID: {id}</p>
          <button
            onClick={() => navigate(getBackPath())}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl font-medium"
          >
            Back to Students
          </button>
        </div>
      </div>
    );
  }

  const latestInvoice = getLatestInvoice();
  
  // Calculate admission fee from invoice items
  let admissionFee = 0;
  if (latestInvoice?.items && Array.isArray(latestInvoice.items)) {
    const admissionItem = latestInvoice.items.find(item => 
      item.description?.toLowerCase().includes('admission')
    );
    admissionFee = admissionItem?.amount || 0;
  }
  
  // If no admission fee in latest invoice, check all invoices
  if (admissionFee === 0 && studentInvoices.length > 0) {
    for (const inv of studentInvoices) {
      if (inv.items && Array.isArray(inv.items)) {
        const admissionItem = inv.items.find(item => 
          item.description?.toLowerCase().includes('admission')
        );
        if (admissionItem) {
          admissionFee = admissionItem.amount || 0;
          break;
        }
      }
    }
  }

  const totalFee = studentDetail?.feeInfo?.totalFee || latestInvoice?.totalAmount || 0;
  const paidFee = studentDetail?.feeInfo?.paidFee || latestInvoice?.paidAmount || 0;
  const pendingFee = studentDetail?.feeInfo?.pendingFee || latestInvoice?.pendingAmount || (totalFee - paidFee);
  const remainingFee = pendingFee;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header with Gradient */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-2xl p-6 sm:p-8 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => navigate(getBackPath())}
                className="p-3 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white transition-all duration-200 hover:scale-105 shadow-lg"
                title="Back to Students"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Users className="w-8 h-8 sm:w-10 sm:h-10" />
                  </div>
                  Student Details
                </h1>
                <p className="text-blue-100 text-lg">
                  Complete information and fee structure for <span className="font-semibold text-white">{studentDetail.personalInfo?.fullName || 'Student'}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Student Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 mb-6 border border-gray-100 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg overflow-hidden relative">
              {studentDetail.personalInfo?.photo ? (
                <img 
                  src={
                    studentDetail.personalInfo.photo.startsWith('http') || studentDetail.personalInfo.photo.startsWith('data:')
                      ? studentDetail.personalInfo.photo 
                      : studentDetail.personalInfo.photo.startsWith('/uploads')
                      ? studentDetail.personalInfo.photo
                      : `/uploads/${studentDetail.personalInfo.photo}`
                  } 
                  alt={studentDetail.personalInfo?.fullName || 'Student Photo'}
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    // Hide image and show icon if image fails to load
                    e.target.style.display = 'none';
                    const iconElement = e.target.parentElement.querySelector('svg');
                    if (iconElement) {
                      iconElement.style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <User className={`w-12 h-12 sm:w-16 sm:h-16 text-white ${studentDetail.personalInfo?.photo ? 'absolute' : ''}`} style={{ display: studentDetail.personalInfo?.photo ? 'none' : 'flex' }} />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {studentDetail.personalInfo?.fullName || 'N/A'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-500">Serial Number</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{studentDetail.srNo || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <GraduationCap className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-500">Course</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {studentDetail.academicInfo?.courseId?.name || 'Not Assigned'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-500">Status</p>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      studentDetail.academicInfo?.status === 'active' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}>
                      {studentDetail.academicInfo?.status?.toUpperCase() || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fee Structure Cards - Enhanced Design */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 mb-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Fee Structure Breakdown</h2>
          </div>
          
          {/* Enhanced Fee Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="group relative overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-6 border-2 border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-purple-300/20 rounded-full -mr-10 -mt-10"></div>
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Admission Fee</p>
                </div>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {formatCurrency(admissionFee)}
                </p>
              </div>
            </div>

            <div className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 border-2 border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-300/20 rounded-full -mr-10 -mt-10"></div>
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Fee</p>
                </div>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(totalFee)}
                </p>
              </div>
            </div>

            <div className="group relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-6 border-2 border-green-200 dark:border-green-800 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-green-300/20 rounded-full -mr-10 -mt-10"></div>
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">Paid Fee</p>
                </div>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(paidFee)}
                </p>
              </div>
            </div>

            <div className="group relative overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-6 border-2 border-orange-200 dark:border-orange-800 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-orange-300/20 rounded-full -mr-10 -mt-10"></div>
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Pending Fee</p>
                </div>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {formatCurrency(pendingFee)}
                </p>
              </div>
            </div>
          </div>

          {/* Fee Breakdown Table - Enhanced */}
          {latestInvoice?.items && latestInvoice.items.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Fee Breakdown Details
              </h3>
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {latestInvoice.items.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {item.description || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {item.quantity || 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(item.amount || 0)}
                        </td>
                      </tr>
                    ))}
                    {latestInvoice.discount > 0 && (
                      <tr className="bg-yellow-50 dark:bg-yellow-900/20">
                        <td colSpan="2" className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                          Discount
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">
                          -{formatCurrency(latestInvoice.discount || 0)}
                        </td>
                      </tr>
                    )}
                    <tr className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 font-bold">
                      <td colSpan="2" className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        Total Amount
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatCurrency(latestInvoice.totalAmount || totalFee)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Invoice Information - Enhanced */}
          {latestInvoice && (
            <div className="p-6 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Invoice Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Invoice Number</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {latestInvoice.invoiceNo || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Calendar className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Invoice Date</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatDate(latestInvoice.invoiceDate || latestInvoice.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      latestInvoice.status === 'paid' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : latestInvoice.status === 'partial'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {latestInvoice.status?.toUpperCase() || 'PENDING'}
                    </span>
                  </div>
                </div>
                {latestInvoice.collectedByName && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                      <UserCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Collected By</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {latestInvoice.collectedByName}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Information Grid - Enhanced Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Personal Information */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl">
                <User className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Personal Information</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Date of Birth</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatDate(studentDetail.personalInfo?.dateOfBirth)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Gender</p>
                  <p className="font-semibold text-gray-900 dark:text-white capitalize">
                    {studentDetail.personalInfo?.gender || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <Mail className="w-5 h-5 text-green-600 dark:text-green-400" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {studentDetail.userId?.email || studentDetail.contactInfo?.email || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <Phone className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {studentDetail.contactInfo?.phone || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Parent/Guardian Information */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-xl">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Parent/Guardian Information</h2>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Father's Name</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {studentDetail.parentInfo?.fatherName || 'N/A'}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Father's Phone</p>
                  <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                    <PhoneCall className="w-3 h-3" />
                    {studentDetail.parentInfo?.fatherPhone || 'N/A'}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Mother's Name</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {studentDetail.parentInfo?.motherName || 'N/A'}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Mother's Phone</p>
                  <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                    <PhoneCall className="w-3 h-3" />
                    {studentDetail.parentInfo?.motherPhone || 'N/A'}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Guardian Name</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {studentDetail.parentInfo?.guardianName || 'N/A'}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Guardian Phone</p>
                  <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                    <PhoneCall className="w-3 h-3" />
                    {studentDetail.parentInfo?.guardianPhone || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Academic Information */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 mb-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Academic Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Course</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {studentDetail.academicInfo?.courseId?.name || 'Not Assigned'}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Status</p>
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                studentDetail.academicInfo?.status === 'active' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
              }`}>
                {studentDetail.academicInfo?.status?.toUpperCase() || 'N/A'}
              </span>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Admission Date</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {formatDate(studentDetail.academicInfo?.admissionDate || studentDetail.createdAt)}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Admitted By</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {studentDetail.academicInfo?.admittedByName || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons - Enhanced */}
        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <button
            onClick={() => window.print()}
            className="px-4 sm:px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl font-medium flex items-center justify-center gap-2 text-sm sm:text-base w-full sm:w-auto print:hidden"
          >
            <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Print Student Details</span>
            <span className="sm:hidden">Print</span>
          </button>
          {!isAccountant && (
            <button
              onClick={() => {
                navigate(getBackPath());
              }}
              className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-medium print:hidden"
            >
              Back to Students
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDetails;
