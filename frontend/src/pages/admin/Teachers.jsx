import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Search, GraduationCap, User, Mail, Phone, CreditCard, Award, Users, X } from 'lucide-react';

const Teachers = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
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

  // Fetch teachers
  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const response = await api.get('/teachers');
      return response.data;
    }
  });

  // Fetch courses for assignment
  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      try {
        const response = await api.get('/courses');
        return response.data;
      } catch (error) {
        console.error('Error fetching courses:', error);
        // Return empty array if endpoint doesn't exist or fails
        if (error.response?.status === 404) {
          console.warn('Courses endpoint not found. Make sure backend server is running.');
          return [];
        }
        return [];
      }
    },
    retry: 1,
    refetchOnWindowFocus: false
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
          console.warn('Staff categories endpoint not found. Please restart the backend server.');
          toast.error('Staff categories endpoint not found. Please restart the backend server to load the new route.');
          return [];
        }
        if (error.response?.status === 401) {
          console.warn('Unauthorized. Please log in again.');
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
          return api.post('/teachers', data);
        }
      }
    },
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      const roleName = variables.role === 'accountant' ? 'Accountant' : 'Teacher';
      toast.success(editingTeacher ? `${roleName} updated successfully!` : `${roleName} created successfully!`);
      setShowForm(false);
      setEditingTeacher(null);
      resetForm();
    },
    onError: (error) => {
      console.error('Teacher mutation error:', error);
      
      // Handle network errors
      if (!error.response) {
        if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error') || error.message?.includes('ERR_NETWORK')) {
          toast.error('Cannot connect to server. Please make sure the backend server is running on port 5000.');
          return;
        }
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
      toast.error(fullMessage);
      
      // Log validation errors if present
      if (error.response?.data?.errors) {
        console.error('Validation errors:', error.response.data.errors);
      }
    }
  });

  // Delete teacher mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/teachers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('Teacher deleted successfully!');
    },
    onError: () => {
      toast.error('Failed to delete teacher');
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
    
    teacherMutation.mutate(formData);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      deleteMutation.mutate(id);
    }
  };

  // Staff Category mutation
  const categoryMutation = useMutation(
    async (data) => {
      if (editingCategory) {
        return api.put(`/staff-categories/${editingCategory._id}`, data);
      } else {
        return api.post('/staff-categories', data);
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('staffCategories');
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
    }
  );

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

  const deleteCategoryMutation = useMutation(
    async (id) => api.delete(`/staff-categories/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('staffCategories');
        toast.success('Category deleted successfully!');
      },
      onError: () => {
        toast.error('Failed to delete category');
      }
    }
  );

  const handleDeleteCategory = (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      deleteCategoryMutation.mutate(id);
    }
  };

  // Filter teachers
  const filteredTeachers = teachers.filter(teacher => {
    const searchLower = searchTerm.toLowerCase();
    return (
      teacher.personalInfo?.fullName?.toLowerCase().includes(searchLower) ||
      teacher.srNo?.toLowerCase().includes(searchLower) ||
      teacher.userId?.email?.toLowerCase().includes(searchLower) ||
      teacher.userId?.uniqueId?.toLowerCase().includes(searchLower)
    );
  });

  if (isLoading) {
    return <div className="text-center py-12">Loading teachers...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Teachers Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage all teachers in the system
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setShowCategoryForm(true);
              setEditingCategory(null);
              resetCategoryForm();
            }}
            className="btn-secondary flex items-center gap-2"
          >
            <Users className="w-5 h-5" />
            Manage Categories
          </button>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingTeacher(null);
              resetForm();
            }}
            className="btn-secondary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Full Details
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, serial number, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Teachers Grid - Beautiful Card Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeachers.length === 0 ? (
          <div className="col-span-full">
            <div className="card text-center py-12">
              <GraduationCap className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">No teachers found</p>
            </div>
          </div>
        ) : (
          filteredTeachers.map((teacher) => (
            <div
              key={teacher._id}
              className="card hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-2 border-gray-200 dark:border-gray-700"
            >
              {/* Teacher Header */}
              <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                    {teacher.personalInfo?.fullName?.charAt(0)?.toUpperCase() || 'T'}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {teacher.personalInfo?.fullName || 'N/A'}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {teacher.employment?.subjects?.join(', ') || 'No Department'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(teacher)}
                    className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(teacher._id)}
                    className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Teacher Details */}
              <div className="space-y-3">
                {/* Unique ID - Prominent Display */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-3 border border-indigo-200 dark:border-indigo-700">
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Unique ID</span>
                  </div>
                  <p className="text-lg font-bold text-indigo-700 dark:text-indigo-300">
                    {teacher.userId?.uniqueId || 'N/A'}
                  </p>
                </div>

                {/* Serial Number */}
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <Award className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Serial No</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{teacher.srNo || 'N/A'}</p>
                  </div>
                </div>

                {/* Category */}
                {teacher.staffCategoryId && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                      <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Category</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {typeof teacher.staffCategoryId === 'object' 
                          ? teacher.staffCategoryId.name 
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Email */}
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                    <p className="font-medium text-gray-900 dark:text-white truncate">{teacher.userId?.email || 'N/A'}</p>
                  </div>
                </div>

                {/* Phone */}
                {teacher.contactInfo?.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                      <Phone className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                      <p className="font-medium text-gray-900 dark:text-white">{teacher.contactInfo.phone}</p>
                    </div>
                  </div>
                )}

                {/* Status Badge */}
                <div className="pt-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                    teacher.employment?.status === 'active' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : teacher.employment?.status === 'inactive'
                      ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {teacher.employment?.status || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
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
                        {staffCategories
                          .filter(cat => cat.isActive !== false)
                          .map((category) => (
                            <option key={category._id} value={category._id}>
                              {category.name}
                            </option>
                          ))}
                      </select>
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
                        className="input-field"
                      >
                        <option value="">Select a category</option>
                        {staffCategories
                          .filter(cat => cat.isActive !== false)
                          .map((category) => (
                            <option key={category._id} value={category._id}>
                              {category.name}
                            </option>
                          ))}
                      </select>
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

