import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { 
  Plus, 
  Search, 
  FileSpreadsheet, 
  FileText, 
  Printer, 
  Key, 
  ChevronDown,
  ArrowUpDown,
  User,
  Mail,
  Building2,
  Edit,
  Trash2,
  Lock
} from 'lucide-react';

const AccountantManagement = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(20);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedAccountant, setSelectedAccountant] = useState(null);
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showMoreOptions, setShowMoreOptions] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
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

  // Fetch accountants (users with role 'accountant')
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['allUsers'],
    queryFn: async () => {
      const response = await api.get('/settings/users');
      return response.data;
    }
  });

  // Filter accountants
  const accountants = useMemo(() => {
    return users.filter(user => user.role === 'accountant');
  }, [users]);

  // Filter accountants based on search
  const filteredAccountants = useMemo(() => {
    if (!searchTerm) return accountants;
    const searchLower = searchTerm.toLowerCase();
    return accountants.filter(accountant => {
      const fullName = `${accountant.profile?.firstName || ''} ${accountant.profile?.lastName || ''}`.trim();
      return (
        fullName.toLowerCase().includes(searchLower) ||
        accountant.email?.toLowerCase().includes(searchLower) ||
        accountant.uniqueId?.toLowerCase().includes(searchLower) ||
        accountant.srNo?.toLowerCase().includes(searchLower)
      );
    });
  }, [accountants, searchTerm]);

  // Sort accountants
  const sortedAccountants = useMemo(() => {
    if (!sortConfig.key) return filteredAccountants;
    
    return [...filteredAccountants].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortConfig.key) {
        case 'accId':
          aValue = a.uniqueId || a.srNo || a._id || '';
          bValue = b.uniqueId || b.srNo || b._id || '';
          break;
        case 'name':
          const aName = `${a.profile?.firstName || ''} ${a.profile?.lastName || ''}`.trim();
          const bName = `${b.profile?.firstName || ''} ${b.profile?.lastName || ''}`.trim();
          aValue = aName || '';
          bValue = bName || '';
          break;
        case 'email':
          aValue = a.email || '';
          bValue = b.email || '';
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredAccountants, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(sortedAccountants.length / entriesPerPage);
  const paginatedAccountants = useMemo(() => {
    const startIndex = (currentPage - 1) * entriesPerPage;
    return sortedAccountants.slice(startIndex, startIndex + entriesPerPage);
  }, [sortedAccountants, currentPage, entriesPerPage]);

  // Handle sort
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }) => {
      return api.put(`/settings/password/${userId}`, { newPassword });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      toast.success('Password reset successfully!');
      setShowPasswordModal(false);
      setSelectedAccountant(null);
      setPasswordForm({ newPassword: '', confirmPassword: '' });
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 'Failed to reset password';
      toast.error(errorMessage);
    }
  });

  // Handle password reset
  const handleResetPassword = (accountant) => {
    setSelectedAccountant(accountant);
    setShowPasswordModal(true);
    setPasswordForm({ newPassword: '', confirmPassword: '' });
  };

  // Submit password reset
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    resetPasswordMutation.mutate({
      userId: selectedAccountant._id,
      newPassword: passwordForm.newPassword
    });
  };

  // Handle permissions
  const handlePermissions = (accountant) => {
    setSelectedAccountant(accountant);
    setShowPermissionsModal(true);
  };

  // Delete accountant mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return api.delete(`/settings/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      toast.success('Accountant deleted successfully!');
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 'Failed to delete accountant';
      toast.error(errorMessage);
    }
  });

  const handleDelete = (accountant) => {
    const fullName = `${accountant.profile?.firstName || ''} ${accountant.profile?.lastName || ''}`.trim() || 'this accountant';
    if (window.confirm(`Are you sure you want to delete ${fullName}?`)) {
      deleteMutation.mutate(accountant._id);
    }
  };

  // Export functions
  const exportToExcel = () => {
    const headers = ['Acc. ID', 'Name', 'Email', 'Campus'];
    const data = sortedAccountants.map(accountant => {
      const fullName = `${accountant.profile?.firstName || ''} ${accountant.profile?.lastName || ''}`.trim();
      return [
        accountant.uniqueId || accountant.srNo || accountant._id || 'N/A',
        fullName || 'N/A',
        accountant.email || 'N/A',
        accountant.collegeId?.name || 'Main Campus'
      ];
    });
    
    const csvContent = [headers, ...data]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `accountants-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Data exported to CSV (Excel compatible)');
  };

  const exportToCSV = () => {
    exportToExcel(); // Same functionality
  };

  const exportToPDF = () => {
    toast.loading('Generating PDF...', { id: 'pdf-export' });
    
    const printContent = `
      <html>
        <head>
          <title>Accountant Management Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #4f46e5; color: white; }
            tr:nth-child(even) { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Accountant Management Report</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                <th>Acc. ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Campus</th>
              </tr>
            </thead>
            <tbody>
              ${sortedAccountants.map(accountant => {
                const fullName = `${accountant.profile?.firstName || ''} ${accountant.profile?.lastName || ''}`.trim();
                return `
                  <tr>
                    <td>${accountant.uniqueId || accountant.srNo || accountant._id || 'N/A'}</td>
                    <td>${fullName || 'N/A'}</td>
                    <td>${accountant.email || 'N/A'}</td>
                    <td>${accountant.collegeId?.name || 'Main Campus'}</td>
                  </tr>
                `;
              }).join('')}
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

  if (isLoading) {
    return <div className="text-center py-12">Loading accountants...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb and Add Button */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Link to="/admin/dashboard" className="hover:text-blue-600 dark:hover:text-blue-400">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white font-medium">Accountant Management</span>
        </div>
        <Link
          to="/admin/teachers"
          className="btn-primary flex items-center gap-2 bg-green-600 hover:bg-green-700"
        >
          <Plus className="w-5 h-5" />
          Add Accountant
        </Link>
      </div>

      {/* Section Title */}
      <div className="bg-blue-600 text-white p-4 rounded-lg flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <User className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold">Manage Accountants</h1>
      </div>

      {/* Table Controls */}
      <div className="card flex items-center justify-between flex-wrap gap-4">
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
                placeholder="Search accountants..."
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Accountants Table */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-blue-600 text-white">
              <th 
                className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-blue-700 transition-colors"
                onClick={() => handleSort('accId')}
              >
                <div className="flex items-center gap-2">
                  Acc. ID
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Photo</th>
              <th 
                className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-blue-700 transition-colors"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-2">
                  Name
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-blue-700 transition-colors"
                onClick={() => handleSort('email')}
              >
                <div className="flex items-center gap-2">
                  Email
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Campus</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Password</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Permissions</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Options</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedAccountants.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  <User className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No accountants found</p>
                  {searchTerm && <p className="text-sm mt-2">Try adjusting your search</p>}
                </td>
              </tr>
            ) : (
              paginatedAccountants.map((accountant) => {
                const fullName = `${accountant.profile?.firstName || ''} ${accountant.profile?.lastName || ''}`.trim();
                const accId = accountant.uniqueId || accountant.srNo || accountant._id?.toString().slice(-6) || 'N/A';
                return (
                  <tr key={accountant._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {accId}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {fullName || 'N/A'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <a 
                          href={`mailto:${accountant.email}`}
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {accountant.email || 'N/A'}
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        {accountant.collegeId?.name || 'Main Campus'}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleResetPassword(accountant)}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                      >
                        <Key className="w-4 h-4" />
                        Reset Password
                      </button>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handlePermissions(accountant)}
                        className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                      >
                        <Lock className="w-4 h-4" />
                        Permissions
                      </button>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap relative" ref={dropdownRef}>
                      <button
                        onClick={() => setShowMoreOptions(showMoreOptions === accountant._id ? null : accountant._id)}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                      >
                        Action
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      {showMoreOptions === accountant._id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                          <Link
                            to={`/admin/settings?tab=users&edit=${accountant._id}`}
                            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                            onClick={() => setShowMoreOptions(null)}
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </Link>
                          <button
                            onClick={() => {
                              handleDelete(accountant);
                              setShowMoreOptions(null);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="card flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {paginatedAccountants.length > 0 ? (currentPage - 1) * entriesPerPage + 1 : 0} to{' '}
          {Math.min(currentPage * entriesPerPage, sortedAccountants.length)} of {sortedAccountants.length} entries
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

      {/* Password Reset Modal */}
      {showPasswordModal && selectedAccountant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Reset Password
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Reset password for <strong>{`${selectedAccountant.profile?.firstName || ''} ${selectedAccountant.profile?.lastName || ''}`.trim() || 'Accountant'}</strong>
            </p>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">New Password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="input-field"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="input-field"
                  required
                  minLength={6}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setSelectedAccountant(null);
                    setPasswordForm({ newPassword: '', confirmPassword: '' });
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetPasswordMutation.isLoading}
                  className="btn-primary"
                >
                  {resetPasswordMutation.isLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && selectedAccountant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Accountant Permissions
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Permissions for <strong>{`${selectedAccountant.profile?.firstName || ''} ${selectedAccountant.profile?.lastName || ''}`.trim() || 'Accountant'}</strong>
            </p>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Role: <span className="font-semibold">{selectedAccountant.role}</span></p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Accountants have access to:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300 list-disc list-inside">
                  <li>Student admissions</li>
                  <li>Fee management</li>
                  <li>Payment records</li>
                  <li>Monthly payments</li>
                  <li>Financial reports</li>
                </ul>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 mt-4">
              <button
                onClick={() => {
                  setShowPermissionsModal(false);
                  setSelectedAccountant(null);
                }}
                className="btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountantManagement;

