import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { 
  Search, 
  FileSpreadsheet, 
  FileText, 
  Printer, 
  Eye,
  DollarSign,
  ArrowUpDown,
  MoreVertical,
  ChevronDown,
  CheckCircle,
  XCircle,
  AlertCircle,
  CreditCard,
  ShoppingCart,
  Edit,
  Trash2,
  Calendar
} from 'lucide-react';

const StudentFeePayment = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('search');
  const [searchTerm, setSearchTerm] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(20);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showQuickPaymentModal, setShowQuickPaymentModal] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(null);
  const [selectedFee, setSelectedFee] = useState(null);
  const dropdownRefs = useRef({});
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'cash',
    notes: '',
    lateFee: 0,
    discount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    smsNotification: 'yes'
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside all dropdowns
      const clickedOutside = Object.values(dropdownRefs.current).every(ref => {
        return !ref || !ref.contains(event.target);
      });

      if (clickedOutside && showMoreOptions) {
        setShowMoreOptions(null);
      }
    };

    if (showMoreOptions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMoreOptions]);

  // Fetch students
  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const response = await api.get('/students');
      return response.data || [];
    }
  });

  // Fetch student invoices directly
  const { data: studentInvoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['studentInvoices', selectedStudent?._id],
    queryFn: async () => {
      if (!selectedStudent?._id) return [];
      try {
        const response = await api.get(`/fees/invoices?studentId=${selectedStudent._id}`);
        return response.data || [];
      } catch (error) {
        console.error('Error fetching invoices:', error);
        return [];
      }
    },
    enabled: !!selectedStudent?._id
  });

  // Fetch student fee summary when student is selected
  const { data: feeSummary, isLoading: feeLoading } = useQuery({
    queryKey: ['studentFeeSummary', selectedStudent?._id],
    queryFn: async () => {
      if (!selectedStudent?._id) return null;
      try {
        const response = await api.get(`/fees/student/${selectedStudent._id}/summary`);
        return response.data;
      } catch (error) {
        // If endpoint doesn't exist, return null and use invoices instead
        if (error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!selectedStudent?._id
  });

  // Fetch student history as fallback
  const { data: studentHistory } = useQuery({
    queryKey: ['studentHistory', selectedStudent?._id],
    queryFn: async () => {
      if (!selectedStudent?._id) return null;
      try {
        const response = await api.get(`/students/${selectedStudent._id}/history`);
        return response.data;
      } catch (error) {
        return null;
      }
    },
    enabled: !!selectedStudent?._id
  });

  // Search for student
  const handleStudentSearch = () => {
    if (!studentSearch.trim()) {
      toast.error('Please enter a student name, roll number, or ID');
      return;
    }

    const searchLower = studentSearch.toLowerCase().trim();
    const foundStudent = students.find(student => {
      const rollNo = student.rollNo || student.srNo || '';
      const name = student.personalInfo?.fullName || '';
      const admissionNo = student.admissionNo || '';
      
      return (
        name.toLowerCase().includes(searchLower) ||
        rollNo.toLowerCase().includes(searchLower) ||
        admissionNo.toLowerCase().includes(searchLower) ||
        student._id.toString().includes(searchLower)
      );
    });

    if (foundStudent) {
      setSelectedStudent(foundStudent);
      setActiveTab('search');
      toast.success('Student found!');
    } else {
      toast.error('Student not found. Please check the search term.');
    }
  };

  // Get fee invoices from multiple sources
  const feeInvoices = useMemo(() => {
    // Priority 1: Use invoices from direct API call
    if (studentInvoices && studentInvoices.length > 0) {
      return studentInvoices.map(invoice => ({
        _id: invoice._id,
        invoiceNo: invoice.invoiceNo || invoice._id,
        feeTitle: invoice.items?.[0]?.description || 
                 invoice.feeStructureId?.name || 
                 `Fee Invoice ${invoice.invoiceNo || invoice._id}`,
        totalAmount: invoice.totalAmount || 0,
        paidAmount: invoice.paidAmount || 0,
        pendingAmount: (invoice.totalAmount || 0) - (invoice.paidAmount || 0),
        discount: invoice.discount || 0,
        lateFee: invoice.lateFee || 0,
        status: invoice.status || (invoice.paidAmount >= invoice.totalAmount ? 'paid' : 'unpaid'),
        dueDate: invoice.dueDate,
        paymentDate: invoice.paymentDate,
        invoiceDate: invoice.invoiceDate || invoice.createdAt
      }));
    }

    // Priority 2: Use invoiceDetails from fee summary
    if (feeSummary?.invoiceDetails && Array.isArray(feeSummary.invoiceDetails)) {
      return feeSummary.invoiceDetails.map(invoice => ({
        _id: invoice.invoiceId || invoice._id,
        invoiceNo: invoice.invoiceNo || invoice._id,
        feeTitle: invoice.items?.[0]?.description || 
                 invoice.feeTitle || 
                 `Fee Invoice ${invoice.invoiceNo || invoice._id}`,
        totalAmount: invoice.totalAmount || 0,
        paidAmount: invoice.paidAmount || 0,
        pendingAmount: invoice.pendingAmount || 0,
        discount: invoice.discount || 0,
        lateFee: invoice.lateFee || 0,
        status: invoice.status || invoice.paymentStatus || 'unpaid',
        dueDate: invoice.dueDate,
        paymentDate: invoice.paymentDate,
        invoiceDate: invoice.invoiceDate
      }));
    }

    // Priority 3: Use invoices array from fee summary
    if (feeSummary?.invoices && Array.isArray(feeSummary.invoices)) {
      return feeSummary.invoices;
    }

    // Priority 4: Use payment history from student history
    if (studentHistory?.paymentHistory && Array.isArray(studentHistory.paymentHistory)) {
      return studentHistory.paymentHistory.map(payment => ({
        _id: payment.invoiceId || payment._id,
        invoiceNo: payment.invoiceNo || payment._id,
        feeTitle: payment.description || payment.feeTitle || `Fee Payment ${payment.invoiceNo || payment._id}`,
        totalAmount: payment.totalAmount || payment.amount || 0,
        paidAmount: payment.paidAmount || payment.amount || 0,
        pendingAmount: payment.pendingAmount || payment.balance || 0,
        discount: payment.discount || 0,
        lateFee: payment.lateFee || 0,
        status: payment.status || 'paid',
        dueDate: payment.dueDate,
        paymentDate: payment.paymentDate || payment.date,
        invoiceDate: payment.invoiceDate || payment.date
      }));
    }

    // Priority 5: Use student's fee info to create a single fee entry
    if (selectedStudent?.feeInfo) {
      const feeInfo = selectedStudent.feeInfo;
      const totalFee = feeInfo.totalFee || 0;
      const paidFee = feeInfo.paidFee || 0;
      const pendingFee = feeInfo.pendingFee || (totalFee - paidFee);
      
      if (totalFee > 0) {
        return [{
          _id: 'student-fee',
          invoiceNo: 'STU-FEE',
          feeTitle: 'Total Fee',
          totalAmount: totalFee,
          paidAmount: paidFee,
          pendingAmount: pendingFee,
          discount: feeInfo.discount || 0,
          lateFee: feeInfo.lateFee || 0,
          status: pendingFee > 0 ? 'unpaid' : 'paid',
          dueDate: null,
          paymentDate: null,
          invoiceDate: null
        }];
      }
    }

    return [];
  }, [studentInvoices, feeSummary, studentHistory, selectedStudent]);

  // Filter fees based on search
  const filteredFees = useMemo(() => {
    if (!searchTerm) return feeInvoices;
    const searchLower = searchTerm.toLowerCase();
    return feeInvoices.filter(fee => {
      return (
        fee.feeTitle?.toLowerCase().includes(searchLower) ||
        fee.invoiceNo?.toLowerCase().includes(searchLower) ||
        fee.status?.toLowerCase().includes(searchLower)
      );
    });
  }, [feeInvoices, searchTerm]);

  // Sort fees
  const sortedFees = useMemo(() => {
    const feesArray = Array.isArray(filteredFees) ? filteredFees : [];
    if (!sortConfig.key) return feesArray;
    
    return [...feesArray].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortConfig.key) {
        case 'roll':
          aValue = selectedStudent?.rollNo || selectedStudent?.srNo || '';
          bValue = selectedStudent?.rollNo || selectedStudent?.srNo || '';
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredFees, sortConfig, selectedStudent]);

  // Pagination
  const totalPages = Math.ceil(sortedFees.length / entriesPerPage);
  const paginatedFees = useMemo(() => {
    const startIndex = (currentPage - 1) * entriesPerPage;
    return sortedFees.slice(startIndex, startIndex + entriesPerPage);
  }, [sortedFees, currentPage, entriesPerPage]);

  // Handle sort
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Handle take payment
  const handleTakePayment = (fee) => {
    setSelectedFee(fee);
    const today = new Date().toISOString().split('T')[0];
    setPaymentForm({
      amount: '',
      paymentMethod: 'cash',
      notes: '',
      lateFee: fee.lateFee || 0,
      discount: fee.discount || 0,
      paymentDate: today,
      smsNotification: 'yes'
    });
    setShowPaymentModal(true);
  };

  // Handle quick payment
  const handleQuickPayment = (fee) => {
    setSelectedFee(fee);
    setPaymentForm({
      amount: fee.pendingAmount || fee.totalAmount || '',
      paymentMethod: 'cash',
      notes: 'Quick Payment'
    });
    setShowQuickPaymentModal(true);
  };

  // Handle pay all
  const handlePayAll = () => {
    if (!selectedStudent) return;
    
    const totalDue = sortedFees.reduce((sum, fee) => {
      return sum + (fee.pendingAmount || 0);
    }, 0);

    if (totalDue === 0) {
      toast.error('No pending fees to pay');
      return;
    }

    setSelectedFee(null);
    setPaymentForm({
      amount: totalDue,
      paymentMethod: 'cash',
      notes: `Pay All for ${selectedStudent.personalInfo?.fullName || 'Student'}`
    });
    setShowPaymentModal(true);
  };

  // Handle print voucher
  const handlePrintVoucher = (fee) => {
    // Navigate to voucher print page
    window.open(`/admin/fees/voucher/${fee._id}`, '_blank');
  };

  // Handle edit fee
  const handleEditFee = (fee) => {
    // Navigate to edit fee page or open edit modal
    toast.info('Edit fee functionality coming soon');
    setShowMoreOptions(null);
  };

  // Handle delete fee
  const handleDeleteFee = (fee) => {
    if (window.confirm(`Are you sure you want to delete this fee: ${fee.feeTitle || 'N/A'}?`)) {
      // Delete fee mutation
      toast.info('Delete fee functionality coming soon');
      setShowMoreOptions(null);
    }
  };

  // Submit payment mutation
  const paymentMutation = useMutation({
    mutationFn: async ({ invoiceId, paymentData }) => {
      return api.post(`/fees/invoices/${invoiceId}/payment`, paymentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentFeeSummary', selectedStudent?._id] });
      queryClient.invalidateQueries({ queryKey: ['studentInvoices', selectedStudent?._id] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Payment recorded successfully!');
      setShowPaymentModal(false);
      setShowQuickPaymentModal(false);
      setSelectedFee(null);
      const today = new Date().toISOString().split('T')[0];
      setPaymentForm({ amount: '', paymentMethod: 'cash', notes: '', lateFee: 0, discount: 0, paymentDate: today, smsNotification: 'yes' });
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 'Failed to record payment';
      toast.error(errorMessage);
    }
  });

  // Handle payment submit
  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    const actualDues = selectedFee?.pendingAmount || selectedFee?.totalAmount || 0;
    const lateFee = paymentForm.lateFee || 0;
    const discount = paymentForm.discount || 0;
    const totalDue = actualDues + lateFee - discount;
    const paymentAmount = parseFloat(paymentForm.amount);
    
    if (paymentAmount > totalDue) {
      toast.error(`Payment amount cannot exceed total due of ${formatCurrency(totalDue)}`);
      return;
    }
    
    if (selectedFee) {
      paymentMutation.mutate({
        invoiceId: selectedFee._id,
        paymentData: {
          amount: paymentAmount,
          paymentMethod: paymentForm.paymentMethod,
          notes: paymentForm.notes,
          lateFee: lateFee,
          discount: discount,
          paymentDate: paymentForm.paymentDate,
          smsNotification: paymentForm.smsNotification === 'yes'
        }
      });
    } else {
      // Pay all fees
      const unpaidFees = sortedFees.filter(fee => fee.status !== 'paid' && (fee.pendingAmount || 0) > 0);
      if (unpaidFees.length === 0) {
        toast.error('No unpaid fees to process');
        return;
      }
      
      // Process payment for all unpaid fees
      unpaidFees.forEach(fee => {
        paymentMutation.mutate({
          invoiceId: fee._id,
          paymentData: {
            amount: fee.pendingAmount || fee.totalAmount || 0,
            paymentMethod: paymentForm.paymentMethod,
            notes: paymentForm.notes,
            lateFee: lateFee,
            discount: discount,
            paymentDate: paymentForm.paymentDate,
            smsNotification: paymentForm.smsNotification === 'yes'
          }
        });
      });
    }
  };

  // Handle print receipt
  const handlePrintReceipt = (fee) => {
    // Navigate to receipt print page or open print dialog
    window.open(`/admin/fees/receipt/${fee._id}`, '_blank');
  };

  // Export functions
  const exportToExcel = () => {
    if (!selectedStudent) {
      toast.error('Please search for a student first');
      return;
    }

    const headers = ['Roll', 'Student', 'Parent', 'Fee Title', 'Total', 'Discount', 'Late Fee', 'Paid', 'Due', 'Status'];
    const data = sortedFees.map(fee => [
      selectedStudent.rollNo || selectedStudent.srNo || 'N/A',
      selectedStudent.personalInfo?.fullName || 'N/A',
      selectedStudent.parentInfo?.fatherName || 'N/A',
      fee.feeTitle || 'N/A',
      fee.totalAmount || 0,
      fee.discount || 0,
      fee.lateFee || 0,
      fee.paidAmount || 0,
      fee.pendingAmount || 0,
      fee.status || 'unpaid'
    ]);
    
    const csvContent = [headers, ...data]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `student-fees-${selectedStudent.rollNo || selectedStudent.srNo}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Data exported to CSV (Excel compatible)');
  };

  const exportToCSV = () => {
    exportToExcel();
  };

  const exportToPDF = () => {
    if (!selectedStudent) {
      toast.error('Please search for a student first');
      return;
    }

    toast.loading('Generating PDF...', { id: 'pdf-export' });
    
    const printContent = `
      <html>
        <head>
          <title>Student Fee Report - ${selectedStudent.personalInfo?.fullName || 'N/A'}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #4f46e5; color: white; }
            tr:nth-child(even) { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Student Fee Report</h1>
          <p><strong>Student:</strong> ${selectedStudent.personalInfo?.fullName || 'N/A'}</p>
          <p><strong>Roll No:</strong> ${selectedStudent.rollNo || selectedStudent.srNo || 'N/A'}</p>
          <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                <th>Fee Title</th>
                <th>Total</th>
                <th>Discount</th>
                <th>Late Fee</th>
                <th>Paid</th>
                <th>Due</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${sortedFees.map(fee => `
                <tr>
                  <td>${fee.feeTitle || 'N/A'}</td>
                  <td>${fee.totalAmount || 0}</td>
                  <td>${fee.discount || 0}</td>
                  <td>${fee.lateFee || 0}</td>
                  <td>${fee.paidAmount || 0}</td>
                  <td>${fee.pendingAmount || 0}</td>
                  <td>${fee.status || 'unpaid'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
    
    toast.dismiss('pdf-export');
    toast.success('PDF ready for printing');
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb and Search Button */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Link to="/admin/dashboard" className="hover:text-blue-600 dark:hover:text-blue-400">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white font-medium">Fee Payment</span>
        </div>
        <button
          onClick={() => {
            setSelectedStudent(null);
            setStudentSearch('');
            setActiveTab('search');
          }}
          className="btn-primary flex items-center gap-2 bg-green-600 hover:bg-green-700"
        >
          <Search className="w-5 h-5" />
          Search Another Student
        </button>
      </div>

      {/* Section Title */}
      <div className="bg-blue-600 text-white p-4 rounded-lg flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <DollarSign className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold">Student Fee Management</h1>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === 'search'
                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Search Student
          </button>
          <button
            onClick={() => setActiveTab('cross-campus')}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === 'cross-campus'
                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Cross-Campus Payment Or Payment By CNIC
          </button>
        </div>

        {/* Search Student Tab */}
        {activeTab === 'search' && (
          <div className="p-6">
            {!selectedStudent ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Search Student by Name, Roll Number, or ID
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleStudentSearch()}
                      placeholder="Enter student name, roll number, or ID..."
                      className="flex-1 input-field"
                    />
                    <button
                      onClick={handleStudentSearch}
                      className="btn-primary"
                    >
                      <Search className="w-5 h-5" />
                      Search
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                    Student: {selectedStudent.personalInfo?.fullName || 'N/A'}
                  </h3>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Roll No: {selectedStudent.rollNo || selectedStudent.srNo || 'N/A'} | Parent: {selectedStudent.parentInfo?.fatherName || 'N/A'}
                  </p>
                </div>

                {/* Table Controls */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600 dark:text-gray-400">Show</label>
                    <select
                      value={entriesPerPage}
                      onChange={(e) => {
                        setEntriesPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span className="text-sm text-gray-600 dark:text-gray-400">entries</span>
                  </div>
                  
                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      onClick={exportToExcel}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      Excel
                    </button>
                    <button
                      onClick={exportToCSV}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      CSV
                    </button>
                    <button
                      onClick={exportToPDF}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      PDF
                    </button>
                    <button
                      onClick={handlePrint}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                    >
                      <Printer className="w-4 h-4" />
                      Print
                    </button>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600 dark:text-gray-400">Search:</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                          }}
                          placeholder="Search fees..."
                          className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fees Table */}
                {(feeLoading || invoicesLoading) ? (
                  <div className="text-center py-12">Loading fees...</div>
                ) : (
                  <div className="card overflow-x-auto mt-4">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-blue-600 text-white">
                          <th 
                            className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-blue-700 transition-colors"
                            onClick={() => handleSort('roll')}
                          >
                            <div className="flex items-center gap-2">
                              Roll
                              <ArrowUpDown className="w-4 h-4" />
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Student</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Parent</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Fee Title</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Total</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Dis.</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Late Fee</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Paid</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Due</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">More</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {paginatedFees.length === 0 ? (
                          <tr>
                            <td colSpan="12" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                              <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                              <p>No fees found</p>
                            </td>
                          </tr>
                        ) : (
                          paginatedFees.map((fee) => {
                            const isPaid = fee.status === 'paid' || (fee.paidAmount >= fee.totalAmount);
                            const hasLateFee = fee.lateFee && fee.lateFee > 0;
                            
                            return (
                              <tr key={fee._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                  {selectedStudent.rollNo || selectedStudent.srNo || 'N/A'}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                  {selectedStudent.personalInfo?.fullName || 'N/A'}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                  {selectedStudent.parentInfo?.fatherName || 'N/A'}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                  {fee.feeTitle || 'N/A'}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                  {formatCurrency(fee.totalAmount || 0)}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                  {formatCurrency(fee.discount || 0)}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                  <div className="flex items-center gap-2">
                                    {hasLateFee ? (
                                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    ) : null}
                                    {formatCurrency(fee.lateFee || 0)}
                                  </div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                  {formatCurrency(fee.paidAmount || 0)}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                  {formatCurrency(fee.pendingAmount || 0)}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  {isPaid ? (
                                    <span className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm font-medium">
                                      Paid
                                    </span>
                                  ) : (
                                    <span className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm font-medium">
                                      Unpaid
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  {isPaid ? (
                                    <button
                                      onClick={() => handlePrintReceipt(fee)}
                                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                                    >
                                      <Printer className="w-4 h-4" />
                                      Print Receipt
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleTakePayment(fee)}
                                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                                    >
                                      <Eye className="w-4 h-4" />
                                      Take Payment
                                    </button>
                                  )}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap relative">
                                  <div ref={(el) => { dropdownRefs.current[fee._id] = el; }}>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setShowMoreOptions(showMoreOptions === fee._id ? null : fee._id);
                                      }}
                                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                                    >
                                      Options
                                      <ChevronDown className="w-4 h-4" />
                                    </button>
                                    {showMoreOptions === fee._id && (
                                      <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                                      <button
                                        onClick={() => {
                                          handleQuickPayment(fee);
                                          setShowMoreOptions(null);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                      >
                                        <CreditCard className="w-4 h-4" />
                                        Quick Payment
                                      </button>
                                      <button
                                        onClick={() => {
                                          handlePayAll();
                                          setShowMoreOptions(null);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                      >
                                        <CreditCard className="w-4 h-4" />
                                        Pay All : {selectedStudent.personalInfo?.fullName || 'Student'}
                                      </button>
                                      <button
                                        onClick={() => {
                                          handlePrintVoucher(fee);
                                          setShowMoreOptions(null);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                      >
                                        <ShoppingCart className="w-4 h-4" />
                                        Print Voucher
                                      </button>
                                      <button
                                        onClick={() => {
                                          handleEditFee(fee);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                      >
                                        <Edit className="w-4 h-4" />
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => {
                                          handleDeleteFee(fee);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination */}
                {paginatedFees.length > 0 && (
                  <div className="card flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Showing {paginatedFees.length > 0 ? (currentPage - 1) * entriesPerPage + 1 : 0} to{' '}
                      {Math.min(currentPage * entriesPerPage, sortedFees.length)} of {sortedFees.length} entries
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      <span className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                        Page {currentPage} of {totalPages || 1}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage >= totalPages}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Cross-Campus Payment Tab */}
        {activeTab === 'cross-campus' && (
          <div className="p-6">
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p>Cross-Campus Payment functionality coming soon...</p>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedFee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full shadow-xl">
            {/* Header */}
            <div className="bg-gray-600 text-white px-6 py-4 rounded-t-lg">
              <h2 className="text-xl font-bold">Take Payment</h2>
            </div>
            
            {/* Form Content */}
            <div className="p-6">
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                {/* Campus */}
                <div className="flex items-center gap-4">
                  <label className="w-32 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Campus
                  </label>
                  <select
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue="main-campus"
                  >
                    <option value="main-campus">Main Campus</option>
                    <option value="branch-campus">Branch Campus</option>
                    <option value="online-campus">Online Campus</option>
                  </select>
                </div>

                {/* Student */}
                <div className="flex items-center gap-4">
                  <label className="w-32 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Student
                  </label>
                  <input
                    type="text"
                    value={selectedStudent?.personalInfo?.fullName || 'N/A'}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Fee Title */}
                <div className="flex items-center gap-4">
                  <label className="w-32 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Fee Title
                  </label>
                  <input
                    type="text"
                    value={selectedFee.feeTitle || 'N/A'}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Actual Dues */}
                <div className="flex items-center gap-4">
                  <label className="w-32 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Actual Dues
                  </label>
                  <input
                    type="text"
                    value={formatCurrency(selectedFee.pendingAmount || selectedFee.totalAmount || 0)}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Late Fee */}
                <div className="flex items-center gap-4">
                  <label className="w-32 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Late Fee
                  </label>
                  <input
                    type="number"
                    value={paymentForm.lateFee}
                    onChange={(e) => {
                      const lateFee = parseFloat(e.target.value) || 0;
                      setPaymentForm({ ...paymentForm, lateFee });
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                  />
                </div>

                {/* Total Due */}
                <div className="flex items-center gap-4">
                  <label className="w-32 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Total Due
                  </label>
                  <input
                    type="text"
                    value={formatCurrency((selectedFee.pendingAmount || selectedFee.totalAmount || 0) + (paymentForm.lateFee || 0) - (paymentForm.discount || 0))}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Payment */}
                <div className="flex items-center gap-4">
                  <label className="w-32 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Payment
                  </label>
                  <div className="flex-1 relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                      placeholder="Enter Payment Amount"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      min="0"
                      max={(selectedFee.pendingAmount || selectedFee.totalAmount || 0) + (paymentForm.lateFee || 0) - (paymentForm.discount || 0)}
                      step="0.01"
                    />
                  </div>
                </div>

                {/* Discount */}
                <div className="flex items-center gap-4">
                  <label className="w-32 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Discount
                  </label>
                  <input
                    type="number"
                    value={paymentForm.discount}
                    onChange={(e) => {
                      const discount = parseFloat(e.target.value) || 0;
                      setPaymentForm({ ...paymentForm, discount });
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                  />
                </div>

                {/* Method */}
                <div className="flex items-center gap-4">
                  <label className="w-32 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Method
                  </label>
                  <div className="flex-1 relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      value={paymentForm.paymentMethod}
                      onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                      className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                      required
                    >
                      <option value="cash">Cash</option>
                      <option value="bank">Bank Transfer</option>
                      <option value="card">Card</option>
                      <option value="cheque">Cheque</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Date */}
                <div className="flex items-center gap-4">
                  <label className="w-32 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Date
                  </label>
                  <div className="flex-1 relative">
                    <input
                      type="date"
                      value={paymentForm.paymentDate}
                      onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* SMS Notification */}
                <div className="flex items-center gap-4">
                  <label className="w-32 text-sm font-medium text-gray-700 dark:text-gray-300">
                    SMS Notification
                  </label>
                  <div className="flex-1 relative">
                    <select
                      value={paymentForm.smsNotification}
                      onChange={(e) => setPaymentForm({ ...paymentForm, smsNotification: e.target.value })}
                      className="w-full px-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                    >
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPaymentModal(false);
                      setSelectedFee(null);
                      const today = new Date().toISOString().split('T')[0];
                      setPaymentForm({ amount: '', paymentMethod: 'cash', notes: '', lateFee: 0, discount: 0, paymentDate: today, smsNotification: 'yes' });
                    }}
                    className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={paymentMutation.isLoading}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {paymentMutation.isLoading ? 'Processing...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Quick Payment Modal */}
      {showQuickPaymentModal && selectedFee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Quick Payment
            </h2>
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fee Title
                </label>
                <p className="text-sm text-gray-900 dark:text-white">{selectedFee.feeTitle || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Due Amount
                </label>
                <p className="text-sm text-gray-900 dark:text-white">{formatCurrency(selectedFee.pendingAmount || selectedFee.totalAmount || 0)}</p>
              </div>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              handlePaymentSubmit(e);
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Payment Method *
                </label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="cash">Cash</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="card">Card</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowQuickPaymentModal(false);
                    setSelectedFee(null);
                    setPaymentForm({ amount: '', paymentMethod: 'cash', notes: '' });
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentMutation.isLoading}
                  className="btn-primary"
                >
                  {paymentMutation.isLoading ? 'Processing...' : 'Pay Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentFeePayment;

