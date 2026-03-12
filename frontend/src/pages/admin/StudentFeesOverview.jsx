import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Search, ChevronDown, Download, Trash2, Eye, Banknote } from 'lucide-react';

const formatCurrency = (amount) => {
  return `Rs ${Number(amount || 0).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const StudentFeesOverview = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const dropdownRef = useRef(null);

  const { data: invoices, isLoading, error } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const response = await api.get('/fees/invoices');
      return response.data || [];
    },
    retry: 1
  });

  // Handle query errors (avoids onError callback which can cause hooks issues in React Query v5)
  useEffect(() => {
    if (error) {
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        setTimeout(() => { window.location.href = '/login'; }, 2000);
      } else {
        toast.error('Failed to load fee records.');
      }
    }
  }, [error]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (openDropdownId && dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdownId]);

  const handlePayInvoice = async (invoiceId) => {
    setOpenDropdownId(null);
    const amount = prompt('Enter payment amount:');
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    try {
      await api.put(`/fees/invoices/${invoiceId}/pay`, {
        paidAmount: parseFloat(amount),
        paymentMethod: 'cash',
        paymentDate: new Date()
      });
      toast.success('Payment recorded successfully!');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    }
  };

  const handleViewDetails = (invoice) => {
    setOpenDropdownId(null);
    const studentId = invoice.studentId?._id || invoice.studentId;
    if (studentId) {
      navigate(`/admin/students/${studentId}/fee-history`);
    }
  };

  const handleDownloadInvoice = (invoiceId) => {
    setOpenDropdownId(null);
    toast('Invoice download coming soon!');
  };

  const handleDeleteInvoice = async (invoiceId) => {
    setOpenDropdownId(null);
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    try {
      await api.delete(`/fees/invoices/${invoiceId}`);
      toast.success('Invoice deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete invoice');
    }
  };

  const filteredInvoices = (invoices || []).filter((inv) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const name = inv.studentId?.personalInfo?.fullName || '';
    const father = inv.studentId?.parentInfo?.fatherName || '';
    const srNo = inv.studentId?.srNo || '';
    const course = inv.studentId?.academicInfo?.courseId?.name || '';
    const invoiceNo = inv.invoiceNo || '';
    return [name, father, srNo, course, invoiceNo].some((v) =>
      String(v).toLowerCase().includes(term)
    );
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Student Fees Overview</h1>
        <div className="card flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Student Fees Overview</h1>
        <div className="card text-center py-8 text-red-600 dark:text-red-400">
          {error.response?.status === 401 ? 'Please login to view fees.' : 'Failed to load fee records.'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          Student Fees Overview
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          View and manage all student fee records
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search students, father name, course, invoice..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Fees Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-blue-900 dark:bg-blue-950">
                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Fees
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Paid
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Remaining
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((invoice) => {
                  const totalFee = invoice.totalAmount || 0;
                  const paid = invoice.paidAmount || 0;
                  const remaining = invoice.pendingAmount || 0;
                  const displayDate = invoice.invoiceDate || invoice.createdAt;
                  const dueDate = invoice.dueDate || displayDate;
                  const studentName = invoice.studentId?.personalInfo?.fullName || 'N/A';

                  return (
                    <tr
                      key={invoice._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(totalFee)}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(displayDate)}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate max-w-[200px]">
                            {studentName} • {invoice.invoiceNo || 'N/A'}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(paid)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <span className="font-semibold text-red-600 dark:text-red-400">
                            {formatCurrency(remaining)}
                          </span>
                          {remaining > 0 && (
                            <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">
                              Due {formatDate(dueDate)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 relative" ref={openDropdownId === invoice._id ? dropdownRef : null}>
                        <div className="relative">
                          <button
                            onClick={() => setOpenDropdownId(openDropdownId === invoice._id ? null : invoice._id)}
                            className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                          >
                            Action
                            <ChevronDown className={`w-4 h-4 transition-transform ${openDropdownId === invoice._id ? 'rotate-180' : ''}`} />
                          </button>

                          {openDropdownId === invoice._id && (
                            <div className="absolute right-0 top-full mt-1 z-20 w-48 py-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                              {invoice.status !== 'paid' && (
                                <button
                                  onClick={() => handlePayInvoice(invoice._id)}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  <Banknote className="w-4 h-4 text-green-600" />
                                  Record Payment
                                </button>
                              )}
                              <button
                                onClick={() => handleViewDetails(invoice)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <Eye className="w-4 h-4 text-blue-600" />
                                View Details
                              </button>
                              <button
                                onClick={() => handleDownloadInvoice(invoice._id)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <Download className="w-4 h-4" />
                                Download
                              </button>
                              <button
                                onClick={() => handleDeleteInvoice(invoice._id)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
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
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    {searchTerm ? 'No matching fee records found.' : 'No fee records found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentFeesOverview;
