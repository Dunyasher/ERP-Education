import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Search, GraduationCap, User, Mail, Phone, CreditCard, Award, Users, X, UserPlus, CheckCircle, Circle, FileText, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';

const Teachers = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(10);
  const [showForm, setShowForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [editingTeacher, setEditingTeacher] = useState(null);
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
          toast.error('Cannot connect to server. From project root run: npm run dev. Ensure backend (port 5000) and MongoDB are running.');
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
      }
    });
  };

  const handleEdit = (teacher) => {
    setEditingTeacher(teacher);
    // Determine role from teacher data or default to teacher
    const userRole = teacher.userId?.role || 'teacher';
    setFormData({
      staffCategoryId: teacher.staffCategoryId?._id || teacher.staffCategoryId || '',
      role: userRole,
      email: teacher.userId?.email || '',
      password: '',
      personalInfo: teacher.personalInfo || {},
      contactInfo: teacher.contactInfo || {},
      qualification: teacher.qualification || {},
      employment: teacher.employment || {},
      salary: teacher.salary || {}
    });
    setShowForm(true);
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

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
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
    const teachersArray = Array.isArray(teachers) ? teachers : [];
    return teachersArray.filter(teacher => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm.trim() || (
        teacher.personalInfo?.fullName?.toLowerCase().includes(searchLower) ||
        teacher.srNo?.toLowerCase().includes(searchLower) ||
        teacher.userId?.email?.toLowerCase().includes(searchLower) ||
        teacher.userId?.uniqueId?.toLowerCase().includes(searchLower)
      );
      const dept = typeof teacher.staffCategoryId === 'object' ? teacher.staffCategoryId?.name : teacher.employment?.subjects?.[0] || '';
      const matchesDept = !departmentFilter || dept?.toLowerCase().includes(departmentFilter.toLowerCase());
      const status = (teacher.employment?.status || 'active').replace(/\s+/g, '_');
      const matchesStatus = !statusFilter || status === statusFilter;
      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [teachers, searchTerm, departmentFilter, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, departmentFilter, statusFilter]);

  // Stats
  const totalTeachers = teachers?.length || 0;
  const activeCount = teachers?.filter(t => (t.employment?.status || 'active') === 'active')?.length || 0;
  const onLeaveCount = teachers?.filter(t => {
    const s = (t.employment?.status || '').toLowerCase();
    return s === 'on_leave' || s === 'on leave';
  })?.length || 0;
  const inactiveCount = teachers?.filter(t => t.employment?.status === 'inactive')?.length || 0;

  // Pagination
  const totalPages = Math.ceil(filteredTeachers.length / entriesPerPage);
  const paginatedTeachers = useMemo(() => {
    const start = (currentPage - 1) * entriesPerPage;
    return filteredTeachers.slice(start, start + entriesPerPage);
  }, [filteredTeachers, currentPage, entriesPerPage]);

  // Unique departments for filter dropdown
  const departments = useMemo(() => {
    const set = new Set();
    teachers?.forEach(t => {
      const name = typeof t.staffCategoryId === 'object' ? t.staffCategoryId?.name : null;
      if (name) set.add(name);
      t.employment?.subjects?.forEach(s => set.add(s));
    });
    return Array.from(set).filter(Boolean).sort();
  }, [teachers]);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 flex items-center justify-center shrink-0">
            <GraduationCap className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Teachers Management
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
              Manage all teachers in the system
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowCategoryForm(true);
              setEditingCategory(null);
              resetCategoryForm();
            }}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm"
          >
            <Users className="w-4 h-4" />
            Manage Categories
          </button>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingTeacher(null);
              resetForm();
            }}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Teacher
          </button>
        </div>
      </div>

      {/* Filter Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search teachers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 min-w-[140px]"
          >
            <option value="">Department</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 min-w-[120px]"
          >
            <option value="">Status</option>
            <option value="active">Active</option>
            <option value="on_leave">On Leave</option>
            <option value="inactive">Inactive</option>
          </select>
          <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
            Filter
          </button>
        </div>
      </div>

      {/* Main content: Table + Sidebar */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Teachers List Card */}
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Teachers List</h2>
            <div className="flex flex-wrap gap-3 mt-3">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm font-medium">
                <UserPlus className="w-4 h-4" />
                Total Teachers {totalTeachers}
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                Active {activeCount}
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-sm font-medium">
                <Circle className="w-4 h-4" />
                On Leave {onLeaveCount}
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium">
                <User className="w-4 h-4" />
                Inactive {inactiveCount}
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                    <input type="checkbox" className="rounded" />
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Department</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedTeachers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-500 dark:text-gray-400">
                      No teachers found
                    </td>
                  </tr>
                ) : (
                  paginatedTeachers.map((teacher) => {
                    const status = (teacher.employment?.status || 'active').replace(/\s+/g, '_');
                    const statusStyles = {
                      active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
                      on_leave: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
                      inactive: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    };
                    const dept = typeof teacher.staffCategoryId === 'object' ? teacher.staffCategoryId?.name : teacher.employment?.subjects?.join(', ');
                    return (
                      <tr key={teacher._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <td className="py-3 px-4">
                          <input type="checkbox" className="rounded" />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                              {teacher.personalInfo?.fullName?.charAt(0)?.toUpperCase() || 'T'}
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {teacher.personalInfo?.fullName || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{dept || '-'}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusStyles[status] || statusStyles.active}`}>
                            {status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(teacher)}
                              className="flex items-center gap-1 px-2 py-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors text-sm"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(teacher._id)}
                              className="flex items-center gap-1 px-2 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors text-sm"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="w-full lg:w-64 shrink-0">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 space-y-2">
            <button
              onClick={() => navigate('/admin/staff')}
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="font-medium">Staff Directory</span>
            </button>
            <button
              onClick={() => navigate('/admin/attendance')}
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="font-medium">Attendance</span>
            </button>
            <button
              onClick={() => navigate('/admin/reports')}
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="font-medium">Reports</span>
            </button>
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

