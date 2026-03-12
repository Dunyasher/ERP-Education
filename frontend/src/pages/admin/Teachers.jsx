import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, GraduationCap, User, Mail, Phone, CreditCard, Award, Users, X, DollarSign, TrendingDown, UserX, CheckCircle, CircleDot, UserMinus, ChevronDown, ChevronLeft, ChevronRight, ClipboardList, BarChart3 } from 'lucide-react';

const Teachers = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 10;
  const [showForm, setShowForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [emailError, setEmailError] = useState('');
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    instituteType: 'college',
    description: '',
    isActive: true
  });
  const [formData, setFormData] = useState({
    staffCategoryId: '',
    role: 'teacher',
    email: '',
    password: '',
    personalInfo: {
      fullName: '',
      dateOfBirth: '',
      gender: 'male'
    },
    contactInfo: {
      phone: '',
      email: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      }
    },
    qualification: {
      degree: '',
      specialization: '',
      university: '',
      yearOfPassing: '',
      experience: 0
    },
    employment: {
      instituteType: 'college',
      status: 'active',
      subjects: [],
      courses: []
    },
    salary: {
      basicSalary: 0,
      allowances: 0
    },
    advance: {
      amount: 0,
      deductionPerMonth: 0,
      balance: 0,
      dateTaken: '',
      notes: ''
    }
  });

  // Fetch teachers - optimized for performance
  const { data: teachers = [], isLoading, error: teachersError, refetch: refetchTeachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      try {
        // Fetch all teachers including inactive ones
        const response = await api.get('/teachers?includeInactive=true');
        const teachersArray = Array.isArray(response.data) ? response.data : [];
        return teachersArray;
      } catch (error) {
        // Only log errors in development
        if (import.meta.env.MODE === 'development') {
          console.error('❌ Error fetching teachers:', error);
        }
        toast.error('Failed to load teachers. Please check your connection and try again.');
        return [];
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - data is fresh for 2 minutes
    retry: 1, // Retry once on failure
    gcTime: 5 * 60 * 1000 // Keep cache for 5 minutes
  });

  // Fetch courses for assignment - optimized for performance
  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      try {
        const response = await api.get('/courses');
        return Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        console.error('Error fetching courses:', error);
        // Return empty array if endpoint doesn't exist or fails
        if (error.response?.status === 404) {
          // Silently handle missing endpoint
          return [];
        }
        return [];
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - data is fresh for 2 minutes
    gcTime: 5 * 60 * 1000 // Keep cache for 5 minutes
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
        // Return empty array if endpoint doesn't exist or fails
        if (error.response?.status === 404) {
          // Silently handle missing endpoint
          toast.error('Staff categories endpoint not found. Please restart the backend server to load the new route.');
          return [];
        }
        if (error.response?.status === 401) {
          // Silently handle unauthorized - will redirect to login
          return [];
        }
        // Don't show error for network errors (handled by interceptor)
        if (!error.response) {
          return [];
        }
        return [];
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000 // Cache for 5 minutes
  });

  // Create/Update teacher/accountant mutation
  const teacherMutation = useMutation({
    mutationFn: async (data) => {
      if (editingTeacher) {
        return api.put(`/teachers/${editingTeacher._id}`, data);
      } else {
        // If creating accountant, use settings/users route
        if (data.role === 'accountant') {
          return api.post('/settings/users', {
            email: data.email,
            password: data.password || 'password123',
            role: 'accountant',
            firstName: data.personalInfo.fullName.split(' ')[0] || data.personalInfo.fullName,
            lastName: data.personalInfo.fullName.split(' ').slice(1).join(' ') || '',
            phone: data.contactInfo.phone || ''
          });
        } else {
          // Create teacher via teachers route
          // Prepare data structure matching backend expectations
          const teacherData = {
            email: data.email,
            password: data.password || 'password123',
            personalInfo: data.personalInfo || {},
            contactInfo: data.contactInfo || {},
            qualification: data.qualification || {},
            employment: data.employment || {},
            salary: data.salary || {},
            ...(data.advance && { advance: data.advance }),
            ...(data.staffCategoryId && { staffCategoryId: data.staffCategoryId })
          };
          
          // Log the data being sent for debugging
          
          return api.post('/teachers', teacherData);
        }
      }
    },
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      const roleName = variables.role === 'accountant' ? 'Accountant' : 'Teacher';
      const teacherName = response?.data?.personalInfo?.fullName || variables.personalInfo?.fullName || roleName;
      toast.success(
        editingTeacher 
          ? `${teacherName} updated successfully!` 
          : `${teacherName} created successfully!`,
        {
          duration: 3000,
          icon: '✅'
        }
      );
      setShowForm(false);
      setEditingTeacher(null);
      resetForm();
    },
    onError: (error) => {
      // Only log errors in development
      if (import.meta.env.MODE === 'development') {
        console.error('Teacher mutation error:', error);
      }
      
      // Handle network errors
      if (!error.response) {
        if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error') || error.message?.includes('ERR_NETWORK')) {
          toast.error('Cannot connect to server. Please make sure the backend server is running on port 5000.');
          return;
        }
      }
      
      // Handle 400 Bad Request - show detailed validation errors
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        let errorMessage = errorData.message || 'Validation failed';
        
        // If there are specific validation errors, show them
        if (errorData.errors && Array.isArray(errorData.errors)) {
          errorMessage = errorData.errors.join(', ');
        } else if (errorData.details) {
          errorMessage = `${errorMessage}: ${errorData.details}`;
        }
        
        // If it's an email duplicate error, show it in the form field too
        if (errorMessage.toLowerCase().includes('email') && errorMessage.toLowerCase().includes('already exists')) {
          setEmailError(errorData.suggestion || 'This email is already registered');
        }
        
        // Show full error message with suggestion if available
        const fullMessage = errorData.suggestion 
          ? `${errorMessage}. ${errorData.suggestion}`
          : errorMessage;
        toast.error(fullMessage, {
          duration: 5000,
          icon: '❌'
        });
        
        // Log validation errors for debugging
        if (errorData.errors) {
          console.error('Validation errors:', errorData.errors);
        }
        return;
      }
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to save teacher';
      
      // If it's an email duplicate error, show it in the form field too
      if (errorMessage.toLowerCase().includes('email') && errorMessage.toLowerCase().includes('already exists')) {
        setEmailError(error.response?.data?.suggestion || 'This email is already registered');
      }
      
      // Show full error message with suggestion if available
      const fullMessage = error.response?.data?.suggestion 
        ? `${errorMessage}. ${error.response.data.suggestion}`
        : errorMessage;
      toast.error(fullMessage, {
        duration: 5000,
        icon: '❌'
      });
      
      // Log validation errors if present
      if (error.response?.data?.errors) {
        console.error('Validation errors:', error.response.data.errors);
      }
    }
  });

  // Delete teacher mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/teachers/${id}`);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      const teacherName = data?.deletedTeacher?.name || 'Teacher';
      toast.success(`${teacherName} deleted successfully!`, {
        duration: 3000,
        icon: '✅'
      });
    },
    onError: (error) => {
      console.error('Delete teacher error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to delete teacher';
      toast.error(errorMessage, {
        duration: 4000,
        icon: '❌'
      });
    }
  });

  // Check if email exists
  const checkEmailExists = async (email) => {
    if (!email || !email.trim()) {
      setEmailError('');
      return false;
    }
    
    // Skip check if editing (email won't change)
    if (editingTeacher) {
      setEmailError('');
      return false;
    }
    
    setIsCheckingEmail(true);
    try {
      // Check if email exists in teachers
      const teachersResponse = await api.get('/teachers');
      const existingTeacher = teachersResponse.data.find(
        t => t.userId?.email?.toLowerCase() === email.toLowerCase().trim()
      );
      
      if (existingTeacher) {
        setEmailError('This email is already registered to a teacher');
        setIsCheckingEmail(false);
        return true;
      }
      
      setEmailError('');
      setIsCheckingEmail(false);
      return false;
    } catch (error) {
      // If check fails, don't block submission - let backend handle it
      setEmailError('');
      setIsCheckingEmail(false);
      return false;
    }
  };

  const resetForm = () => {
    setEmailError('');
    setIsCheckingEmail(false);
    setFormData({
      staffCategoryId: '',
      role: 'teacher',
      email: '',
      password: '',
      personalInfo: {
        fullName: '',
        dateOfBirth: '',
        gender: 'male'
      },
      contactInfo: {
        phone: '',
        email: '',
        address: {}
      },
      qualification: {
        degree: '',
        specialization: '',
        university: '',
        yearOfPassing: '',
        experience: 0
      },
      employment: {
        instituteType: 'college',
        status: 'active',
        subjects: [],
        courses: []
      },
      salary: {
        basicSalary: 0,
        allowances: 0
      },
      advance: {
        amount: 0,
        deductionPerMonth: 0,
        balance: 0,
        dateTaken: '',
        notes: ''
      }
    });
  };

  const formatCurrency = (n) => `Rs ${Number(n || 0).toLocaleString('en-PK', { minimumFractionDigits: 0 })}`;

  const handleEdit = (teacher, e) => {
    if (e) e.stopPropagation();
    setEditingTeacher(teacher);
    const userRole = teacher.userId?.role || 'teacher';
    const adv = teacher.advance || {};
    setFormData({
      staffCategoryId: teacher.staffCategoryId?._id || teacher.staffCategoryId || '',
      role: userRole,
      email: teacher.userId?.email || '',
      password: '',
      personalInfo: teacher.personalInfo || {},
      contactInfo: teacher.contactInfo || {},
      qualification: teacher.qualification || {},
      employment: teacher.employment || {},
      salary: teacher.salary || { basicSalary: 0, allowances: 0 },
      advance: {
        amount: adv.amount ?? 0,
        deductionPerMonth: adv.deductionPerMonth ?? 0,
        balance: adv.balance ?? adv.amount ?? 0,
        dateTaken: adv.dateTaken ? new Date(adv.dateTaken).toISOString().split('T')[0] : '',
        notes: adv.notes || ''
      }
    });
    setShowForm(true);
  };

  const handleViewDetails = (teacher, e) => {
    if (e) e.stopPropagation();
    setSelectedTeacher(teacher);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.personalInfo?.fullName || !formData.personalInfo.fullName.trim()) {
      toast.error('Full name is required');
      return;
    }
    
    if (!formData.email || !formData.email.trim()) {
      toast.error('Email is required');
      return;
    }
    
    if (!formData.contactInfo?.phone || !formData.contactInfo.phone.trim()) {
      toast.error('Phone number is required');
      return;
    }
    
    // Validate institute type for teachers
    if (formData.role === 'teacher' && (!formData.employment?.instituteType || !formData.employment.instituteType.trim())) {
      toast.error('Institute type is required for teachers');
      return;
    }
    
    // Validate phone number for accountants
    if (formData.role === 'accountant' && !formData.contactInfo.phone) {
      toast.error('Phone number is required for accountant accounts');
      return;
    }
    
    // Check email before submission (only for new accounts)
    if (!editingTeacher && formData.email) {
      const emailExists = await checkEmailExists(formData.email);
      if (emailExists) {
        toast.error('This email is already registered. Please use a different email address.');
        return;
      }
    }
    
    // Show loading state
    toast.loading('Creating teacher...', { id: 'creating-teacher' });
    
    teacherMutation.mutate(formData, {
      onSettled: () => {
        toast.dismiss('creating-teacher');
      }
    });
  };

  const handleDeactivate = (teacher) => {
    if (window.confirm(`Deactivate ${teacher.personalInfo?.fullName || 'this teacher'}?`)) {
      api.put(`/teachers/${teacher._id}`, {
        ...teacher,
        employment: { ...teacher.employment, status: 'inactive' }
      }).then(() => {
        queryClient.invalidateQueries({ queryKey: ['teachers'] });
        toast.success('Teacher deactivated');
      }).catch(err => toast.error(err.response?.data?.message || 'Failed to deactivate'));
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this teacher? This cannot be undone.')) {
      deleteMutation.mutate(id);
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
      console.error('Category mutation error:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message ||
                          'Failed to save category';
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

  // Filter categories based on selected institute type
  const filteredCategories = useMemo(() => {
    if (!staffCategories || staffCategories.length === 0) {
      return [];
    }
    
    if (!formData.employment?.instituteType) {
      return staffCategories.filter(cat => cat.isActive !== false);
    }
    
    return staffCategories.filter(cat => 
      cat.isActive !== false && 
      cat.instituteType === formData.employment.instituteType
    );
  }, [staffCategories, formData.employment?.instituteType]);

  // Clear category selection when institute type changes if category doesn't match
  useEffect(() => {
    if (formData.employment?.instituteType && formData.staffCategoryId) {
      const selectedCategory = staffCategories.find(cat => cat._id === formData.staffCategoryId);
      if (selectedCategory && selectedCategory.instituteType !== formData.employment.instituteType) {
        setFormData(prev => ({ ...prev, staffCategoryId: '' }));
        toast('Category selection cleared - please select a category matching the institute type', {
          duration: 3000,
          icon: 'ℹ️'
        });
      }
    }
  }, [formData.employment?.instituteType, staffCategories, formData.staffCategoryId]);

  // Filter teachers
  const filteredTeachers = useMemo(() => {
    let arr = Array.isArray(teachers) ? teachers : [];
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      arr = arr.filter(t =>
        t.personalInfo?.fullName?.toLowerCase().includes(s) ||
        t.srNo?.toLowerCase().includes(s) ||
        t.userId?.email?.toLowerCase().includes(s) ||
        t.userId?.uniqueId?.toLowerCase().includes(s)
      );
    }
    if (departmentFilter) {
      const dept = departmentFilter.toLowerCase();
      arr = arr.filter(t => {
        const subj = (t.employment?.subjects || []).join(' ').toLowerCase();
        const cat = (typeof t.staffCategoryId === 'object' ? t.staffCategoryId?.name : '')?.toLowerCase() || '';
        return subj.includes(dept) || cat.includes(dept);
      });
    }
    if (statusFilter) arr = arr.filter(t => (t.employment?.status || 'active') === statusFilter);
    return arr;
  }, [teachers, searchTerm, departmentFilter, statusFilter]);

  const totalPages = Math.ceil(filteredTeachers.length / entriesPerPage) || 1;
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, departmentFilter, statusFilter]);
  const paginatedTeachers = filteredTeachers.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);

  const totalCount = filteredTeachers.length;
  const activeCount = filteredTeachers.filter(t => (t.employment?.status || 'active') === 'active').length;
  const onLeaveCount = filteredTeachers.filter(t => (t.employment?.status || '') === 'on_leave').length;
  const inactiveCount = filteredTeachers.filter(t => (t.employment?.status || '') === 'inactive').length;

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading teachers...</p>
      </div>
    );
  }

  if (teachersError) {
    return (
      <div className="space-y-6">
        <div className="card p-8 text-center">
          <div className="text-red-500 mb-4">
            <GraduationCap className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Error Loading Teachers
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {teachersError.message || 'Failed to load teachers. Please check your connection.'}
          </p>
          <button
            onClick={() => refetchTeachers()}
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const getStatusLabel = (s) => {
    const m = { active: 'Active', inactive: 'Inactive', on_leave: 'On Leave', resigned: 'Resigned' };
    return m[s] || s || 'Active';
  };

  const getStatusStyles = (s) => {
    if (s === 'active') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    if (s === 'on_leave') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  return (
    <div className="w-full">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              Teachers Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Manage all teachers in the system
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setShowCategoryForm(true); setEditingCategory(null); resetCategoryForm(); }}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <Users className="w-5 h-5" />
              Manage Categories
            </button>
            <button
              onClick={() => { setShowForm(true); setEditingTeacher(null); resetForm(); }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              <Plus className="w-5 h-5" />
              Add Teacher
            </button>
          </div>
        </div>

        {/* Search & Filters - Each 25% width */}
        <div className="grid grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search teachers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            />
          </div>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          >
            <option value="">Department</option>
            {[...new Set(teachers.flatMap(t => t.employment?.subjects || []))].filter(Boolean).map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          >
            <option value="">Status</option>
            <option value="active">Active</option>
            <option value="on_leave">On Leave</option>
            <option value="inactive">Inactive</option>
            <option value="resigned">Resigned</option>
          </select>
          <button
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            Filter
          </button>
        </div>

        {/* Teachers List */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Teachers List</h2>
          <div className="flex flex-wrap gap-3 mb-4">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm">
              <GraduationCap className="w-4 h-4" />
              Total Teachers {totalCount}
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-lg text-sm">
              <CheckCircle className="w-4 h-4" />
              Active {activeCount}
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 rounded-lg text-sm">
              <CircleDot className="w-4 h-4" />
              On Leave {onLeaveCount}
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 rounded-lg text-sm">
              <UserMinus className="w-4 h-4" />
              Inactive {inactiveCount}
            </span>
          </div>

          {/* Table */}
          <div className="w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Department</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTeachers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                      No teachers found
                    </td>
                  </tr>
                ) : (
                  paginatedTeachers.map((teacher) => {
                    const status = teacher.employment?.status || 'active';
                    return (
                      <tr key={teacher._id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3" onClick={() => handleViewDetails(teacher)}>
                            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold">
                              {teacher.personalInfo?.fullName?.charAt(0)?.toUpperCase() || 'T'}
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white cursor-pointer hover:underline">
                              {teacher.personalInfo?.fullName || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {teacher.employment?.subjects?.join(', ') || (typeof teacher.staffCategoryId === 'object' ? teacher.staffCategoryId?.name : null) || 'No Department'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyles(status)}`}>
                            {getStatusLabel(status)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(teacher)}
                              className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 text-sm"
                            >
                              <Edit className="w-4 h-4" /> Edit
                            </button>
                            <button
                              onClick={() => handleDeactivate(teacher)}
                              className="text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 text-sm"
                            >
                              <UserX className="w-4 h-4" /> Deactivate
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 disabled:opacity-50"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {editingTeacher 
                    ? `Edit ${formData.role === 'accountant' ? 'Accountant' : 'Teacher'}` 
                    : `Add New ${formData.role === 'accountant' ? 'Accountant' : 'Teacher'}`}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingTeacher(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Category field for editing */}
                {editingTeacher && (
                  <div className="space-y-4 border-b pb-4">
                    <h3 className="text-lg font-semibold">Category</h3>
                    <div>
                      <label className="block text-sm font-medium mb-1">Category</label>
                      <select
                        value={formData.staffCategoryId}
                        onChange={(e) => {
                          const categoryId = e.target.value;
                          setFormData({ 
                            ...formData, 
                            staffCategoryId: categoryId
                          });
                        }}
                        className="input-field"
                      >
                        <option value="">No category</option>
                        {filteredCategories.length > 0 ? (
                          filteredCategories.map((category) => (
                            <option key={category._id} value={category._id}>
                              {category.name}
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>
                            {formData.employment?.instituteType 
                              ? `No categories available for ${formData.employment.instituteType.replace('_', ' ')}`
                              : 'No categories available'}
                          </option>
                        )}
                      </select>
                      {formData.employment?.instituteType && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Showing categories for: <span className="font-semibold capitalize">{formData.employment.instituteType.replace('_', ' ')}</span>
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.personalInfo.fullName}
                        onChange={(e) => setFormData({
                          ...formData,
                          personalInfo: { ...formData.personalInfo, fullName: e.target.value }
                        })}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Date of Birth</label>
                      <input
                        type="date"
                        value={formData.personalInfo.dateOfBirth}
                        onChange={(e) => setFormData({
                          ...formData,
                          personalInfo: { ...formData.personalInfo, dateOfBirth: e.target.value }
                        })}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Gender</label>
                      <select
                        value={formData.personalInfo.gender}
                        onChange={(e) => setFormData({
                          ...formData,
                          personalInfo: { ...formData.personalInfo, gender: e.target.value }
                        })}
                        className="input-field"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Email *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={async (e) => {
                          const email = e.target.value;
                          setFormData({ ...formData, email });
                          // Debounce email check
                          if (email && !editingTeacher) {
                            setTimeout(() => checkEmailExists(email), 500);
                          } else {
                            setEmailError('');
                          }
                        }}
                        onBlur={() => {
                          if (formData.email && !editingTeacher) {
                            checkEmailExists(formData.email);
                          }
                        }}
                        className={`input-field ${emailError ? 'border-red-500 focus:ring-red-500' : ''}`}
                        disabled={editingTeacher}
                      />
                      {emailError && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                          <span>⚠️</span>
                          {emailError}
                        </p>
                      )}
                      {isCheckingEmail && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Checking email availability...
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Phone * 
                        {formData.role === 'accountant' && (
                          <span className="text-xs text-orange-600 dark:text-orange-400 ml-1">(Required for login)</span>
                        )}
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.contactInfo.phone}
                        onChange={(e) => setFormData({
                          ...formData,
                          contactInfo: { ...formData.contactInfo, phone: e.target.value }
                        })}
                        className="input-field"
                      />
                      {formData.role === 'accountant' && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Accountants log in with email, password, and phone number
                        </p>
                      )}
                    </div>
                    {!editingTeacher && (
                      <div>
                        <label className="block text-sm font-medium mb-1">Password</label>
                        <input
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="input-field"
                          placeholder="Leave empty for default password"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Employment Information - Only for Teachers */}
                {formData.role === 'teacher' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Employment Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Institute Type *</label>
                      <select
                        required
                        value={formData.employment.instituteType}
                        onChange={(e) => setFormData({
                          ...formData,
                          employment: { ...formData.employment, instituteType: e.target.value }
                        })}
                        className="input-field"
                      >
                        <option value="school">School</option>
                        <option value="college">College</option>
                        <option value="academy">Academy</option>
                        <option value="short_course">Short Course</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Category</label>
                      <select
                        value={formData.staffCategoryId}
                        onChange={(e) => {
                          const categoryId = e.target.value;
                          setFormData({ 
                            ...formData, 
                            staffCategoryId: categoryId
                          });
                        }}
                        disabled={!formData.employment?.instituteType}
                        className="input-field disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">
                          {!formData.employment?.instituteType 
                            ? 'Please select institute type first' 
                            : filteredCategories.length === 0 
                            ? `No categories available for ${formData.employment.instituteType.replace('_', ' ')}`
                            : 'Select a category'}
                        </option>
                        {filteredCategories.length > 0 ? (
                          filteredCategories.map((category) => (
                            <option key={category._id} value={category._id}>
                              {category.name}
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>
                            {formData.employment?.instituteType 
                              ? `No categories available for ${formData.employment.instituteType.replace('_', ' ')}. Please create categories for this institute type first.`
                              : 'No categories available'}
                          </option>
                        )}
                      </select>
                      {formData.employment?.instituteType && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Showing categories for: <span className="font-semibold capitalize">{formData.employment.instituteType.replace('_', ' ')}</span>
                          {filteredCategories.length > 0 && ` (${filteredCategories.length} available)`}
                        </p>
                      )}
                      {!formData.employment?.instituteType && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                          Please select an institute type first to see available categories
                        </p>
                      )}
                    </div>
                  </div>
                  </div>
                )}

                {/* Salary Information - Only for Teachers */}
                {formData.role === 'teacher' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Salary Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Basic Salary</label>
                        <input
                          type="number"
                          value={formData.salary.basicSalary}
                          onChange={(e) => setFormData({
                            ...formData,
                            salary: { ...formData.salary, basicSalary: parseFloat(e.target.value) || 0 }
                          })}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Allowances</label>
                        <input
                          type="number"
                          value={formData.salary.allowances}
                          onChange={(e) => setFormData({
                            ...formData,
                            salary: { ...formData.salary, allowances: parseFloat(e.target.value) || 0 }
                          })}
                          className="input-field"
                        />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold pt-4 border-t">Advance / Loan</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Total Advance Amount</label>
                        <input
                          type="number"
                          value={formData.advance?.amount || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            advance: { ...formData.advance, amount: parseFloat(e.target.value) || 0 }
                          })}
                          className="input-field"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Monthly Deduction</label>
                        <input
                          type="number"
                          value={formData.advance?.deductionPerMonth || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            advance: { ...formData.advance, deductionPerMonth: parseFloat(e.target.value) || 0 }
                          })}
                          className="input-field"
                          placeholder="Amount deducted from salary each month"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Date Taken</label>
                        <input
                          type="date"
                          value={formData.advance?.dateTaken || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            advance: { ...formData.advance, dateTaken: e.target.value }
                          })}
                          className="input-field"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Notes</label>
                        <input
                          type="text"
                          value={formData.advance?.notes || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            advance: { ...formData.advance, notes: e.target.value }
                          })}
                          className="input-field"
                          placeholder="Optional notes about the advance"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-4 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingTeacher(null);
                      resetForm();
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={teacherMutation.isLoading}
                    className="btn-primary"
                  >
                    {teacherMutation.isLoading 
                      ? 'Saving...' 
                      : editingTeacher 
                        ? `Update ${formData.role === 'accountant' ? 'Accountant' : 'Teacher'}` 
                        : `Create ${formData.role === 'accountant' ? 'Accountant' : 'Teacher'}`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Detail Modal - Salary & Advance Breakdown */}
      {selectedTeacher && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedTeacher(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                    {selectedTeacher.personalInfo?.fullName?.charAt(0)?.toUpperCase() || 'T'}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectedTeacher.personalInfo?.fullName || 'N/A'}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedTeacher.teacherId || selectedTeacher.srNo || ''} • {selectedTeacher.employment?.subjects?.join(', ') || 'No Department'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTeacher(null)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Salary Structure Breakdown */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Salary Structure
                </h3>
                <div className="space-y-3 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Basic Salary</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(selectedTeacher.salary?.basicSalary)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Allowances</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(selectedTeacher.salary?.allowances)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-600 font-semibold">
                    <span className="text-gray-900 dark:text-white">Gross Salary</span>
                    <span className="text-green-600 dark:text-green-400">{formatCurrency(selectedTeacher.salary?.totalSalary || (selectedTeacher.salary?.basicSalary || 0) + (selectedTeacher.salary?.allowances || 0))}</span>
                  </div>
                </div>
              </div>

              {/* Advance / Loan Section */}
              {selectedTeacher.advance?.amount > 0 ? (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-amber-600" />
                    Advance / Loan
                  </h3>
                  <div className="space-y-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 p-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Total Advance Taken</span>
                      <span className="font-semibold text-amber-700 dark:text-amber-400">{formatCurrency(selectedTeacher.advance?.amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Monthly Deduction</span>
                      <span className="font-semibold text-amber-700 dark:text-amber-400">- {formatCurrency(selectedTeacher.advance?.deductionPerMonth)}</span>
                    </div>
                    {selectedTeacher.advance?.balance > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Remaining Balance</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(selectedTeacher.advance?.balance)}</span>
                      </div>
                    )}
                    {selectedTeacher.advance?.dateTaken && (
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>Date Taken</span>
                        <span>{new Date(selectedTeacher.advance.dateTaken).toLocaleDateString()}</span>
                      </div>
                    )}
                    {selectedTeacher.advance?.notes && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 pt-1">{selectedTeacher.advance.notes}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mb-6 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-sm text-gray-500 dark:text-gray-400">No advance or loan recorded.</p>
                </div>
              )}

              {/* Net Pay Calculation */}
              <div className="rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 p-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Net Salary (Take-Home)</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Gross Salary</span>
                    <span>{formatCurrency(selectedTeacher.salary?.totalSalary || (selectedTeacher.salary?.basicSalary || 0) + (selectedTeacher.salary?.allowances || 0))}</span>
                  </div>
                  {selectedTeacher.advance?.deductionPerMonth > 0 && (
                    <div className="flex justify-between text-amber-600 dark:text-amber-400">
                      <span>Less: Advance Deduction</span>
                      <span>- {formatCurrency(selectedTeacher.advance.deductionPerMonth)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 font-bold text-lg text-green-700 dark:text-green-400">
                    <span>Net Pay</span>
                    <span>{formatCurrency((selectedTeacher.salary?.totalSalary || (selectedTeacher.salary?.basicSalary || 0) + (selectedTeacher.salary?.allowances || 0)) - (selectedTeacher.advance?.deductionPerMonth || 0))}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={(e) => { handleEdit(selectedTeacher, e); setSelectedTeacher(null); }}
                  className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => setSelectedTeacher(null)}
                  className="flex-1 py-2 px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium"
                >
                  Close
                </button>
              </div>
            </div>
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
    </div>
  );
};

export default Teachers;

