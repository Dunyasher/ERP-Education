import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import InstituteTypeSelect from '../../components/InstituteTypeSelect';
import { 
  BookOpen, 
  Users, 
  DollarSign, 
  Clock, 
  GraduationCap, 
  ChevronRight,
  X,
  Calendar,
  User,
  TrendingUp,
  FileText,
  Plus,
  Trash2,
  Edit,
  Save,
  FolderTree,
  Search,
  Settings,
  Filter,
  XCircle,
  Eye,
  BarChart3,
  MoreVertical,
  UserX
} from 'lucide-react';

const Classes = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedClass, setSelectedClass] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [showInstructorForm, setShowInstructorForm] = useState(false);
  const [showCreateClassForm, setShowCreateClassForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showFilterForm, setShowFilterForm] = useState(false);
  const [filters, setFilters] = useState({
    instituteType: '',
    categoryId: '',
    status: ''
  });
  const [sectionFilter, setSectionFilter] = useState('');
  const [editingScheduleIndex, setEditingScheduleIndex] = useState(null);
  const [selectedInstructorId, setSelectedInstructorId] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [categoryFilterType, setCategoryFilterType] = useState('');
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    instituteType: 'college',
    categoryType: 'course',
    description: ''
  });
  const [scheduleForm, setScheduleForm] = useState({
    startTime: '',
    endTime: '',
    days: [],
    room: ''
  });
  const [editingClass, setEditingClass] = useState(null);
  const [newClassForm, setNewClassForm] = useState({
    name: '',
    instituteType: '',
    categoryId: '',
    instructorId: '',
    room: '',
    capacity: 50,
    feeAmount: 0,
    status: 'published'
  });

  // Fetch categories filtered by instituteType
  const { data: allCategories = [], isLoading: categoriesLoading, error: categoriesError } = useQuery({
    queryKey: ['categories', 'course'],
    queryFn: async () => {
      try {
        const response = await api.get('/categories?categoryType=course');
        return Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        console.error('Error fetching categories:', error);
        // Don't show error toast here - it's handled gracefully in the form
        return [];
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - data is fresh for 2 minutes
    retry: 1 // Only retry once on failure
  });

  // Filter categories based on selected instituteType
  const filteredCategories = useMemo(() => {
    if (!newClassForm.instituteType) return [];
    return allCategories.filter(category => 
      category.instituteType === newClassForm.instituteType
    );
  }, [allCategories, newClassForm.instituteType]);

  // Fetch teachers for instructor selection
  const { data: teachers = [], error: teachersError, isLoading: teachersLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      try {
        // Fetch all teachers including inactive ones
        const response = await api.get('/teachers?includeInactive=true');
        const teachersArray = Array.isArray(response.data) ? response.data : [];
        return teachersArray;
      } catch (error) {
        console.error('❌ Error fetching teachers:', error);
        console.error('❌ Error response:', error.response?.data);
        toast.error('Failed to load teachers. Please refresh the page.');
        return [];
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - data is fresh for 2 minutes
    retry: 1, // Retry once on failure
    gcTime: 5 * 60 * 1000 // Keep cache for 5 minutes
  });

  // Always show all available teachers - allow assignment regardless of institute type
  const filteredTeachers = useMemo(() => {
    // Ensure teachers is always an array
    const teachersArray = Array.isArray(teachers) ? teachers : [];
    // Always return all teachers to allow flexible assignment
    return teachersArray;
  }, [teachers]);

  // Clear category and instructor selection when institute type changes
  useEffect(() => {
    if (newClassForm.instituteType) {
      // Clear category if it doesn't match the new institute type
      if (newClassForm.categoryId && Array.isArray(allCategories)) {
        const selectedCategory = allCategories.find(cat => cat._id === newClassForm.categoryId);
        if (selectedCategory && selectedCategory.instituteType !== newClassForm.instituteType) {
          setNewClassForm(prev => ({ ...prev, categoryId: '' }));
        }
      }
      
    }
  }, [newClassForm.instituteType, teachers, newClassForm.categoryId, filteredTeachers, allCategories]);

  // Fetch all classes
  const { data: classesData = [], isLoading, error: classesError, refetch: refetchClasses } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      try {
        const response = await api.get('/classes');
        console.log('📋 Classes API Response:', response.data);
        // Ensure we always return an array
        const classesArray = Array.isArray(response.data) ? response.data : [];
        console.log('📋 Processed Classes Count:', classesArray.length);
        // Sort alphabetically A-Z by name
        return classesArray.sort((a, b) => {
          const nameA = (a.name || '').toLowerCase().trim();
          const nameB = (b.name || '').toLowerCase().trim();
          return nameA.localeCompare(nameB);
        });
      } catch (error) {
        console.error('❌ Error fetching classes:', error);
        toast.error('Failed to load classes. Please try again.');
        return []; // Return empty array on error
      }
    },
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 0,
    cacheTime: 0,
    refetchOnWindowFocus: false,
    staleTime: 30000 // Cache for 30 seconds
  });

  // Use sorted classes
  const classes = classesData;

  // Filter classes based on search term and filters
  const filteredClasses = useMemo(() => {
    let result = classes;

    // Apply filters
    if (filters.instituteType) {
      result = result.filter(classItem => 
        classItem.instituteType === filters.instituteType
      );
    }
    
    if (filters.categoryId) {
      result = result.filter(classItem => 
        classItem.categoryId === filters.categoryId || 
        classItem.categoryId?._id === filters.categoryId
      );
    }
    
    if (filters.status) {
      result = result.filter(classItem => 
        (classItem.status || 'published') === filters.status
      );
    }

    // Section filter (A, B, C, etc. - matches name containing section)
    if (sectionFilter) {
      result = result.filter(classItem => {
        const name = (classItem.name || '').toLowerCase();
        return name.includes(`- ${sectionFilter.toLowerCase()}`) || 
               name.includes(` ${sectionFilter.toLowerCase()} `) ||
               name.endsWith(` ${sectionFilter.toLowerCase()}`);
      });
    }

    // Apply search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(classItem => 
        classItem.name?.toLowerCase().includes(searchLower) ||
        classItem.category?.toLowerCase().includes(searchLower) ||
        classItem.srNo?.toLowerCase().includes(searchLower) ||
        classItem.instructor?.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }, [classes, searchTerm, filters, sectionFilter]);

  // Summary stats for sidebar
  const summaryStats = useMemo(() => {
    const total = filteredClasses.length;
    const students = filteredClasses.reduce((sum, c) => sum + (c.studentCount || 0), 0);
    const feesCollected = filteredClasses.reduce((sum, c) => sum + (c.totalPaid || c.totalFee || 0), 0);
    return { totalClasses: total, totalStudents: students, totalFees: feesCollected };
  }, [filteredClasses]);

  // Badge colors for class letter (cycle through)
  const badgeColors = ['bg-blue-500', 'bg-red-500', 'bg-orange-500', 'bg-green-500', 'bg-violet-500'];

  // Auto-select class from URL parameter or location state
  useEffect(() => {
    const courseId = searchParams.get('courseId');
    const stateCourseName = location.state?.courseName;
    
    if (courseId && classes.length > 0 && !selectedClass) {
      // Try to find by ID first (exact match)
      let classToSelect = classes.find(c => c._id === courseId);
      
      // If not found by ID, try to find by name (from state)
      if (!classToSelect && stateCourseName) {
        classToSelect = classes.find(c => {
          const courseNameLower = c.name.toLowerCase();
          const stateNameLower = stateCourseName.toLowerCase();
          return courseNameLower === stateNameLower ||
                 courseNameLower.includes(stateNameLower) ||
                 stateNameLower.includes(courseNameLower) ||
                 courseNameLower.replace(/[-\s]/g, '') === stateNameLower.replace(/[-\s]/g, '');
        });
      }
      
      if (classToSelect) {
        setSelectedClass(classToSelect);
        // Remove the query parameter after selecting
        setSearchParams({}, { replace: true });
        // Clear location state
        if (location.state) {
          window.history.replaceState({}, document.title);
        }
        toast.success(`Viewing ${classToSelect.name} class details`, {
          duration: 3000,
          icon: '✅'
        });
      }
    }
  }, [searchParams, classes, selectedClass, setSearchParams, location.state, isLoading]);

  // Fetch detailed class information
  const { data: classDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['classDetails', selectedClass?._id],
    queryFn: async () => {
      if (!selectedClass?._id) return null;
      const response = await api.get(`/classes/${selectedClass._id}`);
      return response.data;
    },
    enabled: !!selectedClass?._id
  });

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    // Convert 24-hour format to 12-hour format
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Add schedule mutation
  const addScheduleMutation = useMutation({
    mutationFn: async ({ classId, scheduleData }) => {
      return api.post(`/classes/${classId}/schedule`, scheduleData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['classDetails', selectedClass?._id] });
      setShowScheduleForm(false);
      setScheduleForm({ startTime: '', endTime: '', days: [], room: '' });
      setEditingScheduleIndex(null);
      toast.success('Schedule added successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add schedule');
    }
  });

  // Update schedule mutation
  const updateScheduleMutation = useMutation({
    mutationFn: async ({ classId, scheduleIndex, scheduleData }) => {
      return api.put(`/classes/${classId}/schedule/${scheduleIndex}`, scheduleData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['classDetails', selectedClass?._id] });
      setShowScheduleForm(false);
      setScheduleForm({ startTime: '', endTime: '', days: [], room: '' });
      setEditingScheduleIndex(null);
      toast.success('Schedule updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update schedule');
    }
  });

  // Delete schedule mutation
  const deleteScheduleMutation = useMutation({
    mutationFn: async ({ classId, scheduleIndex }) => {
      return api.delete(`/classes/${classId}/schedule/${scheduleIndex}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['classDetails', selectedClass?._id] });
      toast.success('Schedule deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete schedule');
    }
  });

  // Assign instructor mutatio
  const assignInstructorMutation = useMutation({
    mutationFn: async ({ classId, instructorId }) => {
      return api.put(`/classes/${classId}/instructor`, { instructorId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['classDetails', selectedClass?._id] });
      setShowInstructorForm(false);
      setSelectedInstructorId('');
      toast.success('Instructor assigned successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to assign instructor');
    }
  });

  // Deactivate class mutation (sets status to archived)
  const deactivateClassMutation = useMutation({
    mutationFn: async (id) => api.put(`/courses/${id}`, { status: 'archived' }),
    onSuccess: async (response, deactivatedId) => {
      queryClient.setQueryData(['classes'], (oldClasses = []) => {
        return oldClasses.map(classItem =>
          classItem._id === deactivatedId ? { ...classItem, status: 'archived' } : classItem
        );
      });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Class deactivated successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to deactivate class');
    }
  });

  const handleDeactivate = (id, className) => {
    if (window.confirm(`Are you sure you want to deactivate "${className}"? You can reactivate it later from the edit form.`)) {
      deactivateClassMutation.mutate(id);
    }
  };

  // Category mutations
  const categoryMutation = useMutation({
    mutationFn: async (data) => {
      if (editingCategory) {
        return api.put(`/categories/${editingCategory._id}`, data);
      } else {
        return api.post('/categories', data);
      }
    },
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      await queryClient.invalidateQueries({ queryKey: ['categories', 'course'] });
      await queryClient.refetchQueries({ queryKey: ['categories'] });
      await queryClient.refetchQueries({ queryKey: ['categories', 'course'] });
      
      const newCategory = response.data?.data || response.data;
      
      // If creating a new category and class form is open with matching institute type, auto-select it
      if (!editingCategory && newCategory && newCategory._id && showCreateClassForm && newClassForm.instituteType === categoryFormData.instituteType) {
        setNewClassForm(prev => ({ ...prev, categoryId: newCategory._id }));
        toast.success('Category created and automatically selected! You can now create your class.');
      } else {
        toast.success(editingCategory ? 'Category updated successfully!' : 'Category created successfully!');
      }
      
      setShowCategoryForm(false);
      setEditingCategory(null);
      setSelectedCategoryId('');
      setCategoryFormData({
        name: '',
        instituteType: 'college',
        categoryType: 'course',
        description: ''
      });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to save category');
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id) => api.delete(`/categories/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      await queryClient.invalidateQueries({ queryKey: ['categories', 'course'] });
      await queryClient.refetchQueries({ queryKey: ['categories'] });
      await queryClient.refetchQueries({ queryKey: ['categories', 'course'] });
      toast.success('Category deleted successfully!');
      setSelectedCategoryId('');
    },
    onError: () => {
      toast.error('Failed to delete category');
    }
  });

  const handleCategoryEdit = (category) => {
    setEditingCategory(category);
    setSelectedCategoryId(category._id);
    setCategoryFormData({
      name: category.name || '',
      instituteType: category.instituteType || 'college',
      categoryType: category.categoryType || 'course',
      description: category.description || ''
    });
    setShowCategoryForm(true);
  };

  const handleCategorySubmit = (e) => {
    e.preventDefault();
    categoryMutation.mutate(categoryFormData);
  };

  const handleCategoryDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      deleteCategoryMutation.mutate(id);
    }
  };

  const handleScheduleSubmit = (e) => {
    e.preventDefault();
    if (!scheduleForm.startTime || !scheduleForm.endTime) {
      toast.error('Please provide start time and end time');
      return;
    }

    const scheduleData = {
      startTime: scheduleForm.startTime,
      endTime: scheduleForm.endTime,
      days: scheduleForm.days,
      room: scheduleForm.room || ''
    };

    if (editingScheduleIndex !== null) {
      updateScheduleMutation.mutate({
        classId: selectedClass._id,
        scheduleIndex: editingScheduleIndex,
        scheduleData
      });
    } else {
      addScheduleMutation.mutate({
        classId: selectedClass._id,
        scheduleData
      });
    }
  };

  const handleEditSchedule = (schedule, index) => {
    setScheduleForm({
      startTime: schedule.startTime || '',
      endTime: schedule.endTime || '',
      days: schedule.days || [],
      room: schedule.room || ''
    });
    setEditingScheduleIndex(index);
    setShowScheduleForm(true);
  };

  const handleDeleteSchedule = (index) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      deleteScheduleMutation.mutate({
        classId: selectedClass._id,
        scheduleIndex: index
      });
    }
  };

  const handleAssignInstructor = (e) => {
    e.preventDefault();
    assignInstructorMutation.mutate({
      classId: selectedClass._id,
      instructorId: selectedInstructorId || null
    });
  };

  const toggleDay = (day) => {
    setScheduleForm(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Create new class mutation
  const createClassMutation = useMutation({
    mutationFn: async (data) => {
      // First create the course
      const courseData = {
        name: data.name,
        instituteType: data.instituteType,
        categoryId: data.categoryId || undefined,
        instructorId: data.instructorId || null,
        capacity: data.capacity || 50,
        status: data.status || 'published',
        fee: {
          amount: data.feeAmount || 0,
          currency: 'USD'
        },
        schedules: []
      };

      console.log('📤 Creating class with data:', courseData);
      const response = await api.post('/courses', courseData);
      console.log('📥 Class creation response status:', response.status);
      console.log('📥 Class creation response data:', response.data);
      
      // Explicitly check for error status codes
      if (response.status >= 400) {
        const error = new Error(response.data?.message || 'Failed to create class');
        error.response = response;
        throw error;
      }
      
      return response.data;
    },
    onSuccess: async (response) => {
      console.log('✅ Class created successfully:', response);
      console.log('📋 Created class data:', response);
      
      // Close the form first
      setShowCreateClassForm(false);
      setNewClassForm({
        name: '',
        instituteType: '',
        categoryId: '',
        instructorId: '',
        room: '',
        capacity: 50,
        feeAmount: 0,
        status: 'published'
      });
      
      // Invalidate and refetch queries
      await queryClient.invalidateQueries({ queryKey: ['classes'] });
      await queryClient.invalidateQueries({ queryKey: ['courses'] });
      
      // Force immediate refetch with a small delay to ensure backend has processed
      setTimeout(async () => {
        try {
          await queryClient.refetchQueries({ queryKey: ['classes'] });
          console.log('✅ Classes refetched after creation');
          
          // Also try to refetch using the direct refetch function if available
          if (refetchClasses) {
            await refetchClasses();
          }
        } catch (refetchError) {
          console.error('❌ Error refetching classes:', refetchError);
        }
      }, 500);
      
      toast.success('Class created successfully!');
    },
    onError: (error) => {
      console.error('❌ Create class error:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      
      // Log the full error details including the errors array
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        console.error('❌ Validation errors:', error.response.data.errors);
        error.response.data.errors.forEach((err, index) => {
          console.error(`   Error ${index + 1}:`, err);
        });
      }
      
      let errorMessage = 'Failed to create class';
      if (error.response?.data) {
        if (error.response.data.errors && Array.isArray(error.response.data.errors) && error.response.data.errors.length > 0) {
          // Show the first validation error in detail
          const firstError = error.response.data.errors[0];
          errorMessage = typeof firstError === 'string' ? firstError : firstError.message || 'Validation error';
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, { duration: 5000 });
    }
  });

  // Update class mutation
  const updateClassMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const courseData = {
        name: data.name,
        instituteType: data.instituteType,
        categoryId: data.categoryId || undefined,
        instructorId: data.instructorId || null,
        capacity: data.capacity || 50,
        status: data.status || 'published',
        fee: {
          amount: data.feeAmount || 0,
          currency: 'USD'
        }
      };
      const response = await api.put(`/courses/${id}`, courseData);
      return response.data;
    },
    onSuccess: () => {
      setShowCreateClassForm(false);
      setEditingClass(null);
      setNewClassForm({
        name: '',
        instituteType: '',
        categoryId: '',
        instructorId: '',
        room: '',
        capacity: 50,
        feeAmount: 0,
        status: 'published'
      });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Class updated successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update class');
    }
  });

  const handleEditClass = (classItem) => {
    setEditingClass(classItem);
    setNewClassForm({
      name: classItem.name || '',
      instituteType: classItem.instituteType || '',
      categoryId: classItem.categoryId?._id || classItem.categoryId || '',
      instructorId: classItem.instructorId || '',
      room: classItem.room || '',
      capacity: classItem.capacity || 50,
      feeAmount: classItem.fee?.amount ?? classItem.feeAmount ?? 0,
      status: classItem.status || 'published'
    });
    setShowCreateClassForm(true);
  };

  // Fill sample data for testing
  const fillSampleData = () => {
    const sampleData = {
      name: 'book 5',
      instituteType: 'school',
      room: 'Room 101',
      capacity: 50,
      feeAmount: 500,
      status: 'published'
    };
    
    setNewClassForm(sampleData);
    toast.success('Sample data filled! You can modify the values as needed.', {
      duration: 3000,
      icon: '✅'
    });
  };

  const handleCreateClassSubmit = (e) => {
    e.preventDefault();
    if (!newClassForm.name || !newClassForm.name.trim()) {
      toast.error('Please provide class name');
      return;
    }
    if (!newClassForm.instituteType) {
      toast.error('Please select an institute type');
      return;
    }
    if (editingClass) {
      updateClassMutation.mutate({ id: editingClass._id, data: newClassForm });
    } else {
      createClassMutation.mutate(newClassForm);
    }
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // If a class is selected, show detailed view
  if (selectedClass && classDetails) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => setSelectedClass(null)}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
              Back to Classes
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {classDetails.course.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Complete class details and student information
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
          <div className="card animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Students</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {classDetails.statistics.totalStudents}
                </p>
              </div>
              <div className="icon-container bg-blue-100 dark:bg-blue-900/20">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Class Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Class Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Instructor Information */}
            <div className="card animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-primary-600" />
                  Instructor Information
                </h3>
                <button
                  onClick={() => {
                    setSelectedInstructorId(classDetails.instructor?._id || '');
                    setShowInstructorForm(true);
                  }}
                  className="btn-primary flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  {classDetails.instructor ? 'Change Instructor' : 'Assign Instructor'}
                </button>
              </div>
              {classDetails.instructor ? (
                <>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                      {classDetails.instructor.name?.charAt(0) || 'T'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {classDetails.instructor.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {classDetails.instructor.email}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {classDetails.instructor.phone}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Fee Collected: <span className="font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(classDetails.statistics.teacherFeeCollection)}
                      </span>
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No instructor assigned</p>
              )}
            </div>

            {/* Class Schedules */}
            <div className="card animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary-600" />
                  Class Schedules
                </h3>
                <button
                  onClick={() => {
                    setScheduleForm({ startTime: '', endTime: '', days: [], room: '' });
                    setEditingScheduleIndex(null);
                    setShowScheduleForm(true);
                  }}
                  className="btn-primary flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Schedule
                </button>
              </div>
              {classDetails.course.schedules && classDetails.course.schedules.length > 0 ? (
                <div className="space-y-3">
                  {classDetails.course.schedules.map((schedule, index) => {
                    const scheduleKey = `${schedule.startTime}-${schedule.endTime}`;
                    const scheduleData = classDetails.studentsBySchedule[scheduleKey];
                    return (
                      <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {scheduleData?.count || 0} students
                            </span>
                            <button
                              onClick={() => handleEditSchedule(schedule, index)}
                              className="p-1 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                              title="Edit Schedule"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSchedule(index)}
                              className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                              title="Delete Schedule"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        {schedule.days && schedule.days.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {schedule.days.map((day, dayIndex) => (
                              <span key={dayIndex} className="badge-info text-xs">
                                {day}
                              </span>
                            ))}
                          </div>
                        )}
                        {schedule.room && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            Room: {schedule.room}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No schedules added yet</p>
              )}
            </div>

            {/* All Students List */}
            <div className="card animate-slide-up">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-600" />
                All Students ({classDetails.allStudents.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead className="table-header">
                    <tr>
                      <th>SR NO</th>
                      <th>Student Name</th>
                      <th>F/Name</th>
                      <th>Email</th>
                      <th>Total Fee</th>
                      <th>Paid</th>
                      <th>Remaining</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {classDetails.allStudents.map((studentData) => (
                      <tr key={studentData.student._id} className="table-row">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {studentData.student.srNo || 'N/A'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {studentData.student.fullName || 'N/A'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {studentData.student.fatherName || 'N/A'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {studentData.student.email || 'N/A'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(studentData.feeInfo.totalFee)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-green-600 dark:text-green-400">
                          {formatCurrency(studentData.feeInfo.paidFee)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-red-600 dark:text-red-400">
                          {formatCurrency(studentData.feeInfo.pendingFee)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={
                            studentData.feeInfo.pendingFee <= 0 
                              ? 'badge-success' 
                              : studentData.feeInfo.paidFee > 0 
                              ? 'badge-warning' 
                              : 'badge bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }>
                            {studentData.feeInfo.pendingFee <= 0 ? 'Paid' : studentData.feeInfo.paidFee > 0 ? 'Partial' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar - Summary */}
          <div className="space-y-6">
            {/* Class Summary */}
            <div className="card animate-slide-up">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-600" />
                Class Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Category:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {classDetails.course.category}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Capacity:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {classDetails.course.capacity}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Enrolled:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {classDetails.course.enrolledStudents}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Collection Rate:</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {classDetails.statistics.collectionRate}%
                  </span>
                </div>
                {classDetails.course.duration && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {classDetails.course.duration.value} {classDetails.course.duration.unit}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Fee Breakdown by Schedule */}
            {Object.keys(classDetails.studentsBySchedule).length > 1 && (
              <div className="card animate-slide-up">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Students by Schedule
                </h3>
                <div className="space-y-3">
                  {Object.entries(classDetails.studentsBySchedule).map(([key, data]) => {
                    const scheduleTotalFee = data.students.reduce((sum, s) => sum + s.feeInfo.totalFee, 0);
                    const schedulePaidFee = data.students.reduce((sum, s) => sum + s.feeInfo.paidFee, 0);
                    const schedulePendingFee = data.students.reduce((sum, s) => sum + s.feeInfo.pendingFee, 0);
                    
                    return (
                      <div key={key} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="font-semibold text-gray-900 dark:text-white mb-2">
                          {data.schedule ? `${formatTime(data.schedule.startTime)} - ${formatTime(data.schedule.endTime)}` : key}
                        </p>
                        <div className="text-sm space-y-1">
                          <p className="text-gray-600 dark:text-gray-400">
                            Students: <span className="font-semibold">{data.count}</span>
                          </p>
                          <p className="text-gray-600 dark:text-gray-400">
                            Total: <span className="font-semibold">{formatCurrency(scheduleTotalFee)}</span>
                          </p>
                          <p className="text-green-600 dark:text-green-400">
                            Paid: <span className="font-semibold">{formatCurrency(schedulePaidFee)}</span>
                          </p>
                          <p className="text-red-600 dark:text-red-400">
                            Remaining: <span className="font-semibold">{formatCurrency(schedulePendingFee)}</span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Schedule Form Modal */}
        {showScheduleForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingScheduleIndex !== null ? 'Edit Schedule' : 'Add Schedule'}
                </h3>
                <button
                  onClick={() => {
                    setShowScheduleForm(false);
                    setScheduleForm({ startTime: '', endTime: '', days: [], room: '' });
                    setEditingScheduleIndex(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleScheduleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={scheduleForm.startTime}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
                    required
                    className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    End Time *
                  </label>
                  <input
                    type="time"
                    value={scheduleForm.endTime}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, endTime: e.target.value })}
                    required
                    className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Days
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {weekDays.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          scheduleForm.days.includes(day)
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        {day.substring(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Room (Optional)
                  </label>
                  <input
                    type="text"
                    value={scheduleForm.room}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, room: e.target.value })}
                    placeholder="e.g., Room 101"
                    className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowScheduleForm(false);
                      setScheduleForm({ startTime: '', endTime: '', days: [], room: '' });
                      setEditingScheduleIndex(null);
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addScheduleMutation.isLoading || updateScheduleMutation.isLoading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {editingScheduleIndex !== null ? 'Update' : 'Add'} Schedule
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Instructor Assignment Modal */}
        {showInstructorForm && (() => {
          // Get the class's institute type from the course
          const classInstituteType = classDetails?.course?.instituteType;
          
          // Filter teachers based on class's institute type
          // If no teachers match, show all teachers to allow assignment
          const teachersArray = Array.isArray(teachers) ? teachers : [];
          const matchedTeachers = classInstituteType
            ? teachersArray.filter(teacher => 
                teacher?.employment?.instituteType === classInstituteType
              )
            : teachersArray;
          
          // If no teachers match the institute type, show all teachers
          const filteredTeachersForClass = matchedTeachers.length > 0 ? matchedTeachers : teachersArray;
          
          return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Assign Instructor
                  </h3>
                  <button
                    onClick={() => {
                      setShowInstructorForm(false);
                      setSelectedInstructorId('');
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleAssignInstructor} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Select Teacher *
                    </label>
                    <select
                      value={selectedInstructorId}
                      onChange={(e) => setSelectedInstructorId(e.target.value)}
                      required
                      className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select a teacher</option>
                      {filteredTeachersForClass.length > 0 && (
                        filteredTeachersForClass.map((teacher) => (
                          <option key={teacher._id} value={teacher._id}>
                            {teacher.personalInfo?.fullName || 'N/A'}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowInstructorForm(false);
                        setSelectedInstructorId('');
                      }}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={assignInstructorMutation.isLoading}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Assign Instructor
                    </button>
                  </div>
                </form>
              </div>
            </div>
          );
        })()}
      </div>
    );
  }

  // Main classes list view
  return (
    <div className="space-y-6">
      {/* Summary Cards - one row at top */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Classes</p>
              <p className="text-2xl font-bold mt-1">{summaryStats.totalClasses}</p>
            </div>
            <BookOpen className="w-10 h-10 text-blue-200" />
          </div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Students</p>
              <p className="text-2xl font-bold mt-1">{summaryStats.totalStudents}</p>
            </div>
            <Users className="w-10 h-10 text-green-200" />
          </div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 text-white p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Total Fees</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(summaryStats.totalFees)}</p>
            </div>
            <DollarSign className="w-10 h-10 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-nowrap gap-3 items-center overflow-x-auto">
        <div className="relative w-[250px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
          <input
            type="text"
            placeholder="Search Classes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <select
          value={filters.categoryId}
          onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
          className="w-[250px] px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Grade</option>
          {allCategories.map((cat) => (
            <option key={cat._id} value={cat._id}>{cat.name}</option>
          ))}
        </select>
        <select
          value={sectionFilter}
          onChange={(e) => setSectionFilter(e.target.value)}
          className="w-[250px] px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Section</option>
          {['A', 'B', 'C', 'D', 'E'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button
          onClick={() => { setEditingClass(null); setShowCreateClassForm(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shrink-0"
        >
          <Plus className="w-5 h-5" />
          Add Class
        </button>
      </div>

      {/* Main content: Table */}
      <div>
        {/* Classes Table */}
        <div className="card overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Class</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Students</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Enrollment</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fees Collected</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredClasses.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>{isLoading ? 'Loading classes...' : 'No classes found'}</p>
                  </td>
                </tr>
              ) : (
                filteredClasses.map((classItem, index) => {
                  const capacity = classItem.capacity || 30;
                  const enrolled = classItem.studentCount || 0;
                  const pct = Math.min(100, (enrolled / capacity) * 100);
                  const letter = (classItem.name || 'A').split(/[- ]/).pop()?.[0] || (classItem.name || 'A')[0];
                  const badgeColor = badgeColors[index % badgeColors.length];
                  const feesCollected = classItem.totalPaid ?? classItem.totalFee ?? 0;
                  return (
                    <tr
                      key={classItem._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                      onClick={() => setSelectedClass(classItem)}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full ${badgeColor} flex items-center justify-center text-white font-bold text-sm`}>
                            {letter.toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">{classItem.name || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-900 dark:text-white font-medium">{enrolled}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{enrolled}/{capacity}</div>
                          <div className="mt-1 w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                pct >= 100 ? 'bg-blue-500' : pct >= 80 ? 'bg-green-500' : 'bg-orange-500'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(feesCollected)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedClass(classItem)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEditClass(classItem); }}
                            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeactivate(classItem._id, classItem.name); }}
                            className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg"
                            title="Deactivate"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setSelectedClass(classItem)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                            title="Analytics"
                          >
                            <BarChart3 className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                            title="More options"
                          >
                            <MoreVertical className="w-4 h-4" />
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
      </div>

      {/* Create New Class Modal */}
      {showCreateClassForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full my-8 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {editingClass ? 'Edit Class' : 'Add New Class'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateClassForm(false);
                  setEditingClass(null);
                  setNewClassForm({
                    name: '',
                    instituteType: '',
                    categoryId: '',
                    instructorId: '',
                    room: '',
                    capacity: 50,
                    feeAmount: 0,
                    status: 'published'
                  });
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateClassSubmit} className="space-y-6">
              {/* Class Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Class Name *
                </label>
                <input
                  type="text"
                  value={newClassForm.name}
                  onChange={(e) => setNewClassForm({ ...newClassForm, name: e.target.value })}
                  required
                  placeholder="e.g., Class 7, Class 8, First Year, Book 1"
                  className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Institute Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Institute Type *
                </label>
                <InstituteTypeSelect
                  value={newClassForm.instituteType}
                  onChange={(value) => {
                    setNewClassForm({ 
                      ...newClassForm, 
                      instituteType: value
                    });
                  }}
                  required
                  className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Select Institute Type"
                />
                {newClassForm.instituteType && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {newClassForm.instituteType === 'school' && 'Categories: Class 1, Class 2, Class 3, etc.'}
                    {newClassForm.instituteType === 'college' && 'Categories: First Year, Second Year, Third Year, etc.'}
                    {newClassForm.instituteType === 'academy' && 'Categories: Book 1, Book 2, Book 3, etc.'}
                    {newClassForm.instituteType === 'short_course' && 'Categories: Any course category'}
                  </p>
                )}
              </div>

              {/* Category */}
              {newClassForm.instituteType && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category *
                  </label>
                  <select
                    value={newClassForm.categoryId}
                    onChange={(e) => setNewClassForm({ ...newClassForm, categoryId: e.target.value })}
                    required
                    disabled={!newClassForm.instituteType || categoriesLoading}
                    className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {!newClassForm.instituteType 
                        ? 'Select Institute Type first'
                        : categoriesLoading
                        ? 'Loading categories...'
                        : filteredCategories.length === 0
                        ? `No categories found for ${newClassForm.instituteType.replace('_', ' ')}`
                        : `Select ${newClassForm.instituteType === 'school' ? 'Class' : newClassForm.instituteType === 'college' ? 'Year' : newClassForm.instituteType === 'academy' ? 'Book' : 'Category'}`}
                    </option>
                    {filteredCategories.length > 0 && filteredCategories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {newClassForm.instituteType && filteredCategories.length === 0 && !categoriesLoading && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      No categories available for this institute type.
                    </p>
                  )}
                </div>
              )}

              {/* Teacher (Optional) */}
              {newClassForm.instituteType && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Teacher (Optional)
                  </label>
                  <select
                    value={newClassForm.instructorId}
                    onChange={(e) => setNewClassForm({ ...newClassForm, instructorId: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select a teacher (optional)</option>
                    {filteredTeachers.length > 0 ? (
                      filteredTeachers.map((teacher) => {
                        const teacherName = teacher.personalInfo?.fullName || teacher.name || 'N/A';
                        return (
                          <option key={teacher._id} value={teacher._id}>
                            {teacherName}
                          </option>
                        );
                      })
                    ) : (
                      teachersLoading ? (
                        <option value="" disabled>Loading teachers...</option>
                      ) : (
                        <option value="" disabled>No teachers available</option>
                      )
                    )}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Room (Optional)
                </label>
                <input
                  type="text"
                  value={newClassForm.room}
                  onChange={(e) => setNewClassForm({ ...newClassForm, room: e.target.value })}
                  placeholder="e.g., Room 101"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateClassForm(false);
                    setNewClassForm({
                      name: '',
                      instituteType: '',
                      categoryId: '',
                      instructorId: '',
                      room: '',
                      capacity: 50,
                      feeAmount: 0,
                      status: 'published'
                    });
                  }}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createClassMutation.isLoading || updateClassMutation.isLoading}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 flex items-center gap-2 font-semibold"
                >
                  <Save className="w-5 h-5" />
                  {editingClass
                    ? (updateClassMutation.isLoading ? 'Updating...' : 'Update Class')
                    : (createClassMutation.isLoading ? 'Creating...' : 'Create Class')}
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
              setCategoryFormData({
                name: '',
                instituteType: 'college',
                categoryType: 'course',
                description: ''
              });
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
                    setCategoryFormData({
                      name: '',
                      instituteType: 'college',
                      categoryType: 'course',
                      description: ''
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCategorySubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={categoryFormData.name}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                    className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder={
                      categoryFormData.instituteType === 'school' 
                        ? 'e.g., 7th, 8th, 9th, 10th' 
                        : categoryFormData.instituteType === 'college'
                        ? 'e.g., First Year, Second Year, Third Year'
                        : categoryFormData.instituteType === 'academy'
                        ? 'e.g., Book 1, Book 2, Book 3'
                        : 'e.g., Web Development, Graphic Design'
                    }
                  />
                  {categoryFormData.instituteType && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {categoryFormData.instituteType === 'school' && 'Examples: 7th, 8th, 9th, 10th, etc.'}
                      {categoryFormData.instituteType === 'college' && 'Examples: First Year, Second Year, Third Year, Fourth Year, etc.'}
                      {categoryFormData.instituteType === 'academy' && 'Examples: Book 1, Book 2, Book 3, Book 4, etc.'}
                      {categoryFormData.instituteType === 'short_course' && 'Examples: Web Development, Graphic Design, etc.'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Institute Type *
                  </label>
                  <InstituteTypeSelect
                    value={categoryFormData.instituteType}
                    onChange={(value) => setCategoryFormData({ ...categoryFormData, instituteType: value })}
                    required
                    className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Select Institute Type"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={categoryFormData.description}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                    className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    rows="3"
                    placeholder="Category description (optional)..."
                  />
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCategoryForm(false);
                      setEditingCategory(null);
                      setCategoryFormData({
                        name: '',
                        instituteType: 'college',
                        categoryType: 'course',
                        description: ''
                      });
                    }}
                    className="px-6 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={categoryMutation.isLoading}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50"
                  >
                    <Plus className="w-5 h-5" />
                    {categoryMutation.isLoading ? 'Adding...' : editingCategory ? 'Update' : 'Add'}
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

export default Classes;

