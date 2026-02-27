import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { 
  Plus, 
  Search, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Printer, 
  CreditCard, 
  Key, 
  MoreVertical,
  ChevronDown,
  ArrowUpDown,
  User,
  Mail,
  Phone,
  Building2,
  Edit,
  Trash2,
  FolderTree,
  X,
  Users
} from 'lucide-react';

const StaffManagement = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(20);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showMoreOptions, setShowMoreOptions] = useState(null);
  const dropdownRef = useRef(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    instituteType: 'college',
    description: '',
    isActive: true
  });
  const [showAddStaffForm, setShowAddStaffForm] = useState(false);
  const [staffFormData, setStaffFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    basicSalary: '',
    cnic: '',
    photo: null,
    photoPreview: null,
    instituteType: 'college',
    staffCategoryId: '',
    courses: []
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Safety check: ensure ref and target exist
      if (dropdownRef.current && event.target && dropdownRef.current.contains(event.target)) {
        return; // Click was inside dropdown
      }
      if (showMoreOptions) {
        setShowMoreOptions(null);
      }
    };

    if (showMoreOptions && dropdownRef.current) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMoreOptions]);

  // Fetch staff (teachers)
  const { data: staff = [], isLoading, refetch: refetchStaff, error: staffError } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      try {
        const response = await api.get('/teachers?includeInactive=true');
        console.log('📋 Staff API Response:', response.data);
        console.log('📋 Staff Count:', Array.isArray(response.data) ? response.data.length : 'Not an array');
        
        // Handle both array and object with data property
        let staffData = [];
        if (Array.isArray(response.data)) {
          staffData = response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
          staffData = response.data.data;
        } else if (response.data && response.data.total !== undefined) {
          staffData = response.data.data || [];
        }
        
        console.log('📋 Processed Staff Data:', staffData.length, 'staff members');
        if (staffData.length > 0) {
          console.log('📋 First Staff Member:', staffData[0]);
        }
        
        return staffData;
      } catch (error) {
        console.error('❌ Error fetching staff:', error);
        console.error('❌ Error response:', error.response?.data);
        toast.error('Failed to load staff members. Please refresh the page.');
        return [];
      }
    },
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 0,
    retry: 2
  });

  // Fetch staff categories
  const { data: staffCategories = [] } = useQuery({
    queryKey: ['staffCategories'],
    queryFn: async () => {
      try {
        const response = await api.get('/staff-categories');
        return response.data;
      } catch (error) {
        console.error('Error fetching staff categories:', error);
        return [];
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000
  });

  // Fetch courses for Teacher Of field
  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      try {
        const response = await api.get('/courses');
        return Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        console.error('Error fetching courses:', error);
        return [];
      }
    },
    staleTime: 2 * 60 * 1000
  });

  // Filter courses by institute type
  const filteredCourses = useMemo(() => {
    if (!staffFormData.instituteType) return [];
    return courses.filter(course => 
      course.instituteType === staffFormData.instituteType
    );
  }, [courses, staffFormData.instituteType]);

  // Filter staff categories by institute type
  const filteredStaffCategories = useMemo(() => {
    if (!staffFormData.instituteType) return [];
    return staffCategories.filter(category => 
      category.instituteType === staffFormData.instituteType && 
      category.isActive !== false
    );
  }, [staffCategories, staffFormData.instituteType]);

  // Filter staff based on search
  const filteredStaff = useMemo(() => {
    if (!searchTerm) return staff;
    const searchLower = searchTerm.toLowerCase();
    return staff.filter(member => {
      return (
        member.personalInfo?.fullName?.toLowerCase().includes(searchLower) ||
        member.userId?.email?.toLowerCase().includes(searchLower) ||
        member.contactInfo?.phone?.toLowerCase().includes(searchLower) ||
        member.userId?.uniqueId?.toLowerCase().includes(searchLower) ||
        member.srNo?.toLowerCase().includes(searchLower)
      );
    });
  }, [staff, searchTerm]);

  // Sort staff
  const sortedStaff = useMemo(() => {
    if (!sortConfig.key) return filteredStaff;
    
    return [...filteredStaff].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortConfig.key) {
        case 'empId':
          aValue = a.userId?.uniqueId || a.srNo || '';
          bValue = b.userId?.uniqueId || b.srNo || '';
          break;
        case 'name':
          aValue = a.personalInfo?.fullName || '';
          bValue = b.personalInfo?.fullName || '';
          break;
        case 'email':
          aValue = a.userId?.email || '';
          bValue = b.userId?.email || '';
          break;
        case 'phone':
          aValue = a.contactInfo?.phone || '';
          bValue = b.contactInfo?.phone || '';
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredStaff, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(sortedStaff.length / entriesPerPage);
  const paginatedStaff = useMemo(() => {
    const startIndex = (currentPage - 1) * entriesPerPage;
    return sortedStaff.slice(startIndex, startIndex + entriesPerPage);
  }, [sortedStaff, currentPage, entriesPerPage]);

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
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('Password reset successfully!');
      setShowPasswordModal(false);
      setSelectedStaff(null);
      setPasswordForm({ newPassword: '', confirmPassword: '' });
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 'Failed to reset password';
      toast.error(errorMessage);
    }
  });

  // Handle password reset
  const handleResetPassword = (member) => {
    setSelectedStaff(member);
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
      userId: selectedStaff.userId?._id || selectedStaff.userId,
      newPassword: passwordForm.newPassword
    });
  };

  // Generate ID Card
  const handleGenerateID = (member) => {
    // Navigate to print staff cards page with selected staff
    window.location.href = `/admin/print-staff-cards?staffId=${member._id}`;
  };

  // Export functions
  const exportToExcel = () => {
    const headers = ['Emp. ID', 'Name', 'Email', 'Phone', 'Campus'];
    const data = sortedStaff.map(member => [
      member.userId?.uniqueId || member.srNo || 'N/A',
      member.personalInfo?.fullName || 'N/A',
      member.userId?.email || 'N/A',
      member.contactInfo?.phone || 'N/A',
      member.employment?.campus || 'Main Campus'
    ]);
    
    const csvContent = [headers, ...data]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `staff-management-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Data exported to CSV (Excel compatible)');
  };

  const exportToCSV = () => {
    const headers = ['Emp. ID', 'Name', 'Email', 'Phone', 'Campus'];
    const data = sortedStaff.map(member => [
      member.userId?.uniqueId || member.srNo || 'N/A',
      member.personalInfo?.fullName || 'N/A',
      member.userId?.email || 'N/A',
      member.contactInfo?.phone || 'N/A',
      member.employment?.campus || 'Main Campus'
    ]);
    
    const csvContent = [headers, ...data]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `staff-management-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Data exported to CSV');
  };

  const exportToPDF = () => {
    toast.loading('Generating PDF...', { id: 'pdf-export' });
    
    // Create a print-friendly HTML content
    const printContent = `
      <html>
        <head>
          <title>Staff Management Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #4f46e5; color: white; }
            tr:nth-child(even) { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Staff Management Report</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                <th>Emp. ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Campus</th>
              </tr>
            </thead>
            <tbody>
              ${sortedStaff.map(member => `
                <tr>
                  <td>${member.userId?.uniqueId || member.srNo || 'N/A'}</td>
                  <td>${member.personalInfo?.fullName || 'N/A'}</td>
                  <td>${member.userId?.email || 'N/A'}</td>
                  <td>${member.contactInfo?.phone || 'N/A'}</td>
                  <td>${member.employment?.campus || 'Main Campus'}</td>
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

  // Delete staff mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return api.delete(`/teachers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('Staff member deleted successfully!');
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 'Failed to delete staff member';
      toast.error(errorMessage);
    }
  });

  const handleDelete = (member) => {
    if (window.confirm(`Are you sure you want to delete ${member.personalInfo?.fullName || 'this staff member'}?`)) {
      deleteMutation.mutate(member._id);
    }
  };

  // Staff Category mutation
  const categoryMutation = useMutation({
    mutationFn: async (data) => {
      if (editingCategory) {
        return api.put(`/staff-categories/${editingCategory._id}`, data);
      } else {
        return api.post('/staff-categories', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffCategories'] });
      toast.success(editingCategory ? 'Category updated successfully!' : 'Category created successfully!');
      setShowCategoryForm(false);
      setEditingCategory(null);
      setCategoryFormData({
        name: '',
        instituteType: 'college',
        description: '',
        isActive: true
      });
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 'Failed to save category';
      toast.error(errorMessage);
    }
  });

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!categoryFormData.name || !categoryFormData.instituteType) {
      toast.error('Please fill in all required fields');
      return;
    }
    categoryMutation.mutate(categoryFormData);
  };

  const resetCategoryForm = () => {
    setCategoryFormData({
      name: '',
      instituteType: 'college',
      description: '',
      isActive: true
    });
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name || '',
      instituteType: category.instituteType || 'college',
      description: category.description || '',
      isActive: category.isActive !== undefined ? category.isActive : true
    });
    setShowCategoryForm(true);
  };

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id) => api.delete(`/staff-categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffCategories'] });
      toast.success('Category deleted successfully!');
    },
    onError: () => {
      toast.error('Failed to delete category');
    }
  });

  const handleDeleteCategory = (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      deleteCategoryMutation.mutate(id);
    }
  };

  // Add Staff mutation
  const addStaffMutation = useMutation({
    mutationFn: async (data) => {
      // Convert photo to base64 if provided
      let photoBase64 = null;
      if (data.photo) {
        try {
          photoBase64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(data.photo);
          });
        } catch (error) {
          console.error('Error converting photo to base64:', error);
        }
      }

      // Prepare teacher data structure matching backend expectations
      const teacherData = {
        email: data.email,
        password: data.password,
        personalInfo: {
          fullName: data.fullName,
          ...(data.cnic && { cnic: data.cnic }),
          ...(photoBase64 && { photo: photoBase64 })
        },
        contactInfo: {
          phone: data.phone,
          email: data.email
        },
        salary: {
          basicSalary: data.basicSalary ? parseFloat(data.basicSalary) : 0,
          allowances: 0
        },
        employment: {
          instituteType: data.instituteType || 'college',
          status: 'active',
          courses: data.courses || []
        },
        ...(data.staffCategoryId && { staffCategoryId: data.staffCategoryId })
      };

      return api.post('/teachers', teacherData);
    },
    onSuccess: async (data) => {
      console.log('✅ Staff added successfully:', data);
      toast.success('Staff member added successfully!');
      setShowAddStaffForm(false);
      resetStaffForm();
      
      // Force refetch with a small delay to ensure backend has processed
      setTimeout(async () => {
        console.log('🔄 Refetching staff list...');
        await queryClient.invalidateQueries({ queryKey: ['teachers'] });
        const result = await refetchStaff();
        console.log('✅ Staff list refetched. Count:', result.data?.length || 0);
        if (result.data && result.data.length > 0) {
          console.log('📋 Staff members:', result.data.map(s => s.personalInfo?.fullName || 'N/A'));
        }
      }, 500);
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 'Failed to add staff member';
      toast.error(errorMessage);
    }
  });

  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    
    if (!staffFormData.fullName || !staffFormData.email || !staffFormData.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!staffFormData.password || staffFormData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    addStaffMutation.mutate({
      ...staffFormData
    });
  };

  const resetStaffForm = () => {
    setStaffFormData({
      fullName: '',
      email: '',
      phone: '',
      password: '',
      basicSalary: '',
      cnic: '',
      photo: null,
      photoPreview: null,
      instituteType: 'college',
      staffCategoryId: '',
      courses: []
    });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setStaffFormData({
        ...staffFormData,
        photo: file,
        photoPreview: URL.createObjectURL(file)
      });
    }
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading staff members...</div>;
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
          <span className="text-gray-900 dark:text-white font-medium">Staff Management</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setShowCategoryForm(true);
              setEditingCategory(null);
              resetCategoryForm();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            <FolderTree className="w-5 h-5" />
            Category
          </button>
          <button
            onClick={() => {
              setShowAddStaffForm(true);
              resetStaffForm();
            }}
            className="btn-primary flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-5 h-5" />
            Add Staff
          </button>
        </div>
      </div>

      {/* Section Title */}
      <div className="bg-blue-600 text-white p-4 rounded-lg flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <User className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold">Manage Staff Accounts</h1>
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
                placeholder="Search staff..."
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-blue-600 text-white">
              <th 
                className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-blue-700 transition-colors"
                onClick={() => handleSort('empId')}
              >
                <div className="flex items-center gap-2">
                  Emp. ID
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
              <th 
                className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-blue-700 transition-colors"
                onClick={() => handleSort('phone')}
              >
                <div className="flex items-center gap-2">
                  Phone
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Campus</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">ID Card</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Password</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">More Options</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedStaff.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  <User className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No staff members found</p>
                  {searchTerm && <p className="text-sm mt-2">Try adjusting your search</p>}
                </td>
              </tr>
            ) : (
              paginatedStaff.map((member) => (
                <tr key={member._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {member.userId?.uniqueId || member.srNo || 'N/A'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      {member.personalInfo?.photo ? (
                        <img 
                          src={member.personalInfo.photo} 
                          alt={member.personalInfo?.fullName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {member.personalInfo?.fullName || 'N/A'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {member.userId?.email || 'N/A'}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {member.contactInfo?.phone || 'N/A'}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      {member.employment?.campus || 'Main Campus'}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleGenerateID(member)}
                      className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                    >
                      <CreditCard className="w-4 h-4" />
                      Generate ID
                    </button>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleResetPassword(member)}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                    >
                      <Key className="w-4 h-4" />
                      Reset Password
                    </button>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap relative" ref={dropdownRef}>
                    <button
                      onClick={() => setShowMoreOptions(showMoreOptions === member._id ? null : member._id)}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                    >
                      Action
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    {showMoreOptions === member._id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                        <Link
                          to={`/admin/teachers`}
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </Link>
                        <button
                          onClick={() => {
                            handleDelete(member);
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
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="card flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {paginatedStaff.length > 0 ? (currentPage - 1) * entriesPerPage + 1 : 0} to{' '}
          {Math.min(currentPage * entriesPerPage, sortedStaff.length)} of {sortedStaff.length} entries
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
      {showPasswordModal && selectedStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Reset Password
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Reset password for <strong>{selectedStaff.personalInfo?.fullName || 'Staff Member'}</strong>
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
                    setSelectedStaff(null);
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

      {/* Category Form Modal */}
      {showCategoryForm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCategoryForm(false);
              setEditingCategory(null);
              resetCategoryForm();
            }
          }}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full shadow-xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 overflow-y-auto flex-1">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h2>
                <button
                  onClick={() => {
                    setShowCategoryForm(false);
                    setEditingCategory(null);
                    resetCategoryForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCategorySubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Type of Employee *</label>
                  <input
                    type="text"
                    required
                    value={categoryFormData.name}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                    className="input-field"
                    placeholder="e.g., Teacher, Madam, Sir, Principal"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Institute Type *</label>
                  <select
                    required
                    value={categoryFormData.instituteType}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, instituteType: e.target.value })}
                    className="input-field"
                  >
                    <option value="school">School</option>
                    <option value="college">College</option>
                    <option value="academy">Academy</option>
                    <option value="short_course">Short Course</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={categoryFormData.description}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                    className="input-field"
                    rows="3"
                    placeholder="Category description..."
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={categoryFormData.isActive}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, isActive: e.target.checked })}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm font-medium">
                    Active
                  </label>
                </div>
                <div className="flex justify-end gap-4 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCategoryForm(false);
                      setEditingCategory(null);
                      resetCategoryForm();
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={categoryMutation.isLoading}
                    className="btn-primary"
                  >
                    {categoryMutation.isLoading ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
                  </button>
                </div>
              </form>

              {/* Existing Categories List */}
              <div className="mt-8 pt-6 border-t">
                <h3 className="text-lg font-semibold mb-4">Existing Categories</h3>
                {staffCategories.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No categories created yet. Add your first category above.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <select
                      className="input-field w-full"
                      value={selectedCategoryId}
                      onChange={(e) => setSelectedCategoryId(e.target.value)}
                    >
                      <option value="">Select a category to edit or delete</option>
                      {staffCategories.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name} ({category.instituteType})
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => {
                          if (selectedCategoryId) {
                            const selectedCategory = staffCategories.find(cat => cat._id === selectedCategoryId);
                            if (selectedCategory) {
                              handleEditCategory(selectedCategory);
                              setSelectedCategoryId('');
                            }
                          }
                        }}
                        className="btn-secondary flex items-center gap-2"
                        disabled={!selectedCategoryId}
                      >
                        <Edit className="w-4 h-4" />
                        Edit Selected
                      </button>
                      <button
                        onClick={() => {
                          if (selectedCategoryId) {
                            handleDeleteCategory(selectedCategoryId);
                            setSelectedCategoryId('');
                          }
                        }}
                        className="btn-secondary flex items-center gap-2 text-red-600 hover:text-red-700"
                        disabled={!selectedCategoryId}
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Selected
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Form Modal */}
      {showAddStaffForm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddStaffForm(false);
              resetStaffForm();
            }
          }}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full shadow-xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 overflow-y-auto flex-1">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Add New Staff
                </h2>
                <button
                  onClick={() => {
                    setShowAddStaffForm(false);
                    resetStaffForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleStaffSubmit} className="space-y-6">
                {/* Photo Upload */}
                <div>
                  <label className="block text-sm font-medium mb-2">Photo</label>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                      {staffFormData.photoPreview ? (
                        <img 
                          src={staffFormData.photoPreview} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-12 h-12 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="block w-full text-sm text-gray-500 dark:text-gray-400
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-lg file:border-0
                          file:text-sm file:font-semibold
                          file:bg-blue-50 file:text-blue-700
                          hover:file:bg-blue-100
                          dark:file:bg-blue-900 dark:file:text-blue-300"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        JPG, PNG or GIF (Max. 5MB)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Teacher Name */}
                <div>
                  <label className="block text-sm font-medium mb-1">Teacher Name *</label>
                  <input
                    type="text"
                    required
                    value={staffFormData.fullName}
                    onChange={(e) => setStaffFormData({ ...staffFormData, fullName: e.target.value })}
                    className="input-field"
                    placeholder="Enter full name"
                  />
                </div>

                {/* Auto Employee ID - Display only */}
                <div>
                  <label className="block text-sm font-medium mb-1">Employee ID</label>
                  <input
                    type="text"
                    disabled
                    value="Auto-generated"
                    className="input-field bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Employee ID will be automatically generated
                  </p>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={staffFormData.email}
                    onChange={(e) => setStaffFormData({ ...staffFormData, email: e.target.value })}
                    className="input-field"
                    placeholder="example@email.com"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium mb-1">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={staffFormData.phone}
                    onChange={(e) => setStaffFormData({ ...staffFormData, phone: e.target.value })}
                    className="input-field"
                    placeholder="0300-1234567"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    value={staffFormData.password}
                    onChange={(e) => setStaffFormData({ ...staffFormData, password: e.target.value })}
                    className="input-field"
                    placeholder="Enter password (min. 6 characters)"
                    minLength={6}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Password must be at least 6 characters long
                  </p>
                </div>

                {/* CNIC Number */}
                <div>
                  <label className="block text-sm font-medium mb-1">CNIC Number</label>
                  <input
                    type="text"
                    value={staffFormData.cnic}
                    onChange={(e) => setStaffFormData({ ...staffFormData, cnic: e.target.value })}
                    className="input-field"
                    placeholder="12345-1234567-1"
                    maxLength={15}
                  />
                </div>

                {/* Basic Salary */}
                <div>
                  <label className="block text-sm font-medium mb-1">Basic Salary</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={staffFormData.basicSalary}
                    onChange={(e) => setStaffFormData({ ...staffFormData, basicSalary: e.target.value })}
                    className="input-field"
                    placeholder="0.00"
                  />
                </div>

                {/* Institute Type */}
                <div>
                  <label className="block text-sm font-medium mb-1">Institute Type *</label>
                  <select
                    required
                    value={staffFormData.instituteType}
                    onChange={(e) => {
                      setStaffFormData({ 
                        ...staffFormData, 
                        instituteType: e.target.value,
                        courses: [], // Clear courses when institute type changes
                        staffCategoryId: '' // Clear category when institute type changes
                      });
                    }}
                    className="input-field"
                  >
                    <option value="school">School</option>
                    <option value="college">College</option>
                    <option value="academy">Academy</option>
                    <option value="short_course">Short Course</option>
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    value={staffFormData.staffCategoryId}
                    onChange={(e) => setStaffFormData({ ...staffFormData, staffCategoryId: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Select Category (e.g., Principal, Teacher, etc.)</option>
                    {filteredStaffCategories.map(category => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {filteredStaffCategories.length === 0 && staffFormData.instituteType && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      No categories available for {staffFormData.instituteType}. Create one using the Category button.
                    </p>
                  )}
                </div>

                {/* Teacher Of (Courses) */}
                <div>
                  <label className="block text-sm font-medium mb-1">Teacher Of</label>
                  <select
                    multiple
                    value={staffFormData.courses}
                    onChange={(e) => {
                      const selectedCourses = Array.from(e.target.selectedOptions, option => option.value);
                      setStaffFormData({ ...staffFormData, courses: selectedCourses });
                    }}
                    className="input-field min-h-[100px]"
                    size="4"
                  >
                    {filteredCourses.length === 0 ? (
                      <option disabled>No courses available for {staffFormData.instituteType}</option>
                    ) : (
                      filteredCourses.map(course => (
                        <option key={course._id} value={course._id}>
                          {course.name} ({course.category?.name || 'No Category'})
                        </option>
                      ))
                    )}
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Hold Ctrl (Windows) or Cmd (Mac) to select multiple courses
                  </p>
                  {staffFormData.courses.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {staffFormData.courses.map(courseId => {
                        const course = filteredCourses.find(c => c._id === courseId);
                        return course ? (
                          <span
                            key={courseId}
                            className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs flex items-center gap-1"
                          >
                            {course.name}
                            <button
                              type="button"
                              onClick={() => {
                                setStaffFormData({
                                  ...staffFormData,
                                  courses: staffFormData.courses.filter(id => id !== courseId)
                                });
                              }}
                              className="ml-1 hover:text-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddStaffForm(false);
                      resetStaffForm();
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addStaffMutation.isLoading}
                    className="btn-primary"
                  >
                    {addStaffMutation.isLoading ? 'Adding...' : 'Add Staff'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;

