import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Search, BookOpen, FileText, X } from 'lucide-react';

const Courses = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [categoryFilterType, setCategoryFilterType] = useState(''); // For filtering categories in management modal
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    instituteType: 'college',
    categoryType: 'course',
    description: ''
  });
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    instituteType: 'college',
    description: '',
    instructorId: '',
    duration: {
      value: 0,
      unit: 'months'
    },
    fee: {
      amount: 0,
      currency: 'USD'
    },
    capacity: 50,
    status: 'published',
    requirements: [],
    learningOutcomes: []
  });

  // Fetch courses - optimized for performance
  const { data: courses = [], isLoading, refetch: refetchCourses } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      try {
        const response = await api.get('/courses');
        const coursesData = response.data || [];
        return Array.isArray(coursesData) ? coursesData : [];
      } catch (error) {
        console.error('❌ Error fetching courses:', error);
        toast.error('Failed to fetch courses');
        return [];
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - data is fresh for 2 minutes
    gcTime: 5 * 60 * 1000, // Keep cache for 5 minutes
    retry: 1, // Retry once on failure
    retryDelay: 500 // Faster retry delay
  });

  // Fetch categories filtered by instituteType - automatically updates when categories are added/updated
  const { data: allCategories = [], isLoading: categoriesLoading, error: categoriesError } = useQuery({
    queryKey: ['categories', 'course'],
    queryFn: async () => {
      try {
        const response = await api.get('/categories?categoryType=course');
        return Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        console.error('Error fetching categories:', error);
        if (error.response?.status === 404) {
          console.error('404 Error - Categories endpoint not found');
          console.error('Full URL:', error.config?.baseURL + error.config?.url);
          toast.error('Categories endpoint not found. Please check if the server is running.');
        }
        return [];
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - data is fresh for 2 minutes
    gcTime: 5 * 60 * 1000 // Keep cache for 5 minutes
  });

  // Filter categories based on selected instituteType
  const categories = allCategories.filter(category => {
    if (!formData.instituteType) return false; // Don't show any if no institute type selected
    return category.instituteType === formData.instituteType;
  });

  // Clear category selection when institute type changes
  useEffect(() => {
    if (formData.instituteType && formData.categoryId) {
      // Check if the selected category matches the current institute type
      const selectedCategory = allCategories.find(cat => cat._id === formData.categoryId);
      if (selectedCategory && selectedCategory.instituteType !== formData.instituteType) {
        // Clear category if it doesn't match the new institute type
        setFormData(prev => ({ ...prev, categoryId: '' }));
      }
    }
  }, [formData.instituteType, allCategories, formData.categoryId]);

  // Fetch teachers
  const { data: teachersData = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      try {
        const response = await api.get('/teachers');
        return Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        console.error('Error fetching teachers:', error);
        return [];
      }
    }
  });

  // Ensure teachers is always an array
  const teachers = Array.isArray(teachersData) ? teachersData : [];

  // Create/Update course mutation
  const courseMutation = useMutation({
    mutationFn: async (data) => {
      console.log('Creating/updating course with data:', data);
      if (editingCourse) {
        const response = await api.put(`/courses/${editingCourse._id}`, data);
        console.log('Course updated:', response.data);
        return response;
      } else {
        const response = await api.post('/courses', data);
        console.log('Course created:', response.data);
        return response;
      }
    },
    onSuccess: async (response) => {
      console.log('✅ Course mutation success:', response.data);
      const newCourse = response.data;
      console.log('📝 New course details:', {
        _id: newCourse._id,
        name: newCourse.name,
        srNo: newCourse.srNo,
        collegeId: newCourse.collegeId,
        categoryId: newCourse.categoryId,
        instituteType: newCourse.instituteType
      });
      
      // STEP 1: Optimistic update for INSTANT UI feedback
      // Add the new course to the cache immediately so it appears right away
      queryClient.setQueryData(['courses'], (oldCourses = []) => {
        const currentCourses = Array.isArray(oldCourses) ? oldCourses : [];
        if (editingCourse) {
          // Update existing course
          const updated = currentCourses.map(course => 
            course._id === editingCourse._id ? newCourse : course
          );
          console.log('🔄 Optimistically updated course in cache');
          return updated;
        } else {
          // Add new course to the beginning of the list for immediate visibility
          const updated = [newCourse, ...currentCourses];
          console.log('➕ Optimistically added new course to cache. Total courses:', updated.length);
          return updated;
        }
      });
      
      // STEP 2: Close the form immediately for better UX
      setShowForm(false);
      setEditingCourse(null);
      resetForm();
      
      // STEP 3: Show success message
      toast.success(editingCourse ? 'Course updated successfully!' : 'Course created successfully!');
      
      // STEP 4: Immediately invalidate and refetch to ensure data consistency
      // This happens in the background to sync with server
      console.log('🔄 Invalidating and refetching course queries...');
      await queryClient.invalidateQueries({ queryKey: ['courses'] });
      
      // STEP 5: Force immediate refetch from server (no delay - backend should be ready)
      try {
        console.log('🔄 Refetching courses from server immediately...');
        const refetchedData = await refetchCourses();
        console.log('🔄 Refetched courses from server:', refetchedData.data?.length);
        console.log('📋 Refetched course names:', refetchedData.data?.map(c => c.name));
        
        // Verify the new course is in the refetched data
        if (!editingCourse && refetchedData.data) {
          const courseExists = refetchedData.data.some(c => 
            c._id === newCourse._id || (c.name === newCourse.name && c.srNo === newCourse.srNo)
          );
          if (courseExists) {
            console.log('✅ New course confirmed in server response');
          } else {
            // Silently retry if course not found
            // Retry once more if course not found
            await refetchCourses();
          }
        }
      } catch (refetchError) {
        console.error('❌ Error refetching courses:', refetchError);
        // Don't show error to user - optimistic update already shows the course
        // Retry in background
        setTimeout(async () => {
          try {
            await refetchCourses();
          } catch (retryError) {
            console.error('❌ Retry refetch also failed:', retryError);
          }
        }, 500);
      }
    },
    onError: (error) => {
      console.error('Course mutation error:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Failed to save course';
      toast.error(errorMessage);
    }
  });

  // Delete course mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/courses/${id}`),
    onSuccess: async (response, deletedId) => {
      // Optimistically remove course from cache immediately
      queryClient.setQueryData(['courses'], (oldCourses = []) => {
        const filtered = oldCourses.filter(course => course._id !== deletedId);
        console.log('🗑️ Optimistically removed course from cache. Remaining:', filtered.length);
        return filtered;
      });
      
      // Invalidate and refetch courses everywhere
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      
      // Force refetch after a small delay to ensure consistency
      setTimeout(async () => {
        await refetchCourses();
      }, 300);
      
      toast.success('Course deleted successfully!');
    },
    onError: () => {
      toast.error('Failed to delete course');
    }
  });

  // Category mutations
  const categoryMutation = useMutation({
    mutationFn: async (data) => {
      if (editingCategory) {
        return api.put(`/categories/${editingCategory._id}`, data);
      } else {
        return api.post('/categories', data);
      }
    },
    onSuccess: async () => {
      // Invalidate ALL category queries (both ['categories'] and ['categories', 'course'])
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      await queryClient.invalidateQueries({ queryKey: ['categories', 'course'] });
      // Refetch all category queries to ensure immediate update
      await queryClient.refetchQueries({ queryKey: ['categories'] });
      await queryClient.refetchQueries({ queryKey: ['categories', 'course'] });
      toast.success(editingCategory ? 'Category updated successfully! All forms will refresh automatically.' : 'Category created successfully! All forms will refresh automatically.');
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
      console.error('Category mutation error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Request URL:', error.config?.baseURL + error.config?.url);
      console.error('Request method:', error.config?.method);
      
      if (error.response?.status === 404) {
        toast.error('Category endpoint not found. Please restart the backend server.');
      } else if (error.response?.status === 401) {
        toast.error('Authentication required. Please log in again.');
      } else if (error.response?.status === 403) {
        toast.error('You do not have permission to perform this action.');
      } else if (!error.response) {
        toast.error('Cannot connect to server. Please make sure the backend server is running on port 5000.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to save category');
      }
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id) => api.delete(`/categories/${id}`),
    onSuccess: async () => {
      // Invalidate ALL category queries (both ['categories'] and ['categories', 'course'])
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      await queryClient.invalidateQueries({ queryKey: ['categories', 'course'] });
      // Refetch all category queries to ensure immediate update
      await queryClient.refetchQueries({ queryKey: ['categories'] });
      await queryClient.refetchQueries({ queryKey: ['categories', 'course'] });
      toast.success('Category deleted successfully! All forms will refresh automatically.');
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

  const resetForm = () => {
    setFormData({
      name: '',
      categoryId: '',
      instituteType: 'college',
      description: '',
      instructorId: '',
      duration: {
        value: 0,
        unit: 'months'
      },
      fee: {
        amount: 0,
        currency: 'USD'
      },
      capacity: 50,
      status: 'published',
      requirements: [],
      learningOutcomes: []
    });
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      name: course.name || '',
      categoryId: course.categoryId?._id || course.categoryId || '',
      instituteType: course.instituteType || 'college',
      description: course.description || '',
      instructorId: course.instructorId?._id || course.instructorId || '',
      duration: course.duration || { value: 0, unit: 'months' },
      fee: course.fee || { amount: 0, currency: 'USD' },
      capacity: course.capacity || 50,
      status: course.status || 'published',
      requirements: course.requirements || [],
      learningOutcomes: course.learningOutcomes || []
    });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    courseMutation.mutate(formData);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      deleteMutation.mutate(id);
    }
  };

  // Filter courses
  const filteredCourses = courses.filter(course => {
    const searchLower = searchTerm.toLowerCase();
    return (
      course.name?.toLowerCase().includes(searchLower) ||
      course.categoryId?.name?.toLowerCase().includes(searchLower) ||
      course.srNo?.toLowerCase().includes(searchLower)
    );
  });

  if (isLoading) {
    return <div className="text-center py-12">Loading courses...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Courses Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage all courses in the system
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setShowCategoryForm(true);
              setEditingCategory(null);
              setSelectedCategoryId('');
              setCategoryFilterType('');
              setCategoryFormData({
                name: '',
                instituteType: 'college',
                categoryType: 'course',
                description: ''
              });
            }}
            className="btn-secondary flex items-center gap-2"
          >
            <FileText className="w-5 h-5" />
            Manage Categories
          </button>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingCourse(null);
              resetForm();
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Course
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, category, or serial number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Courses Table */}
      <div className="card overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Serial No
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Course Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Instructor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Fee
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredCourses.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No courses found</p>
                </td>
              </tr>
            ) : (
              filteredCourses.map((course) => (
                <tr key={course._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {course.srNo || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">
                    {course.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {course.categoryId?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {course.instructorId?.personalInfo?.fullName || 'Not Assigned'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    ${course.fee?.amount?.toLocaleString() || '0'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      course.status === 'published' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : course.status === 'draft'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}>
                      {course.status || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(course)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(course._id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {editingCourse ? 'Edit Course' : 'Add New Course'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingCourse(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Course Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Category *</label>
                    <div className="flex gap-2">
                      <select
                        required
                        value={formData.categoryId}
                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                        className="input-field flex-1"
                        disabled={!formData.instituteType || categoriesLoading}
                      >
                        <option value="">
                          {!formData.instituteType 
                            ? 'Select Institute Type first'
                            : categoriesLoading
                            ? 'Loading categories...'
                            : categories.length === 0
                            ? `No categories found for ${formData.instituteType.replace('_', ' ')} - Click + to add`
                            : `Select ${formData.instituteType === 'school' ? 'Class' : formData.instituteType === 'college' ? 'Year' : formData.instituteType === 'academy' ? 'Book' : 'Category'}`
                          }
                        </option>
                        {categories.length > 0 && categories.map((category) => (
                          <option key={category._id} value={category._id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                      onClick={() => {
                        setShowCategoryForm(true);
                        setEditingCategory(null);
                        setSelectedCategoryId('');
                        setCategoryFilterType('');
                        setCategoryFormData({
                          name: '',
                          instituteType: formData.instituteType || 'college',
                          categoryType: 'course',
                          description: ''
                        });
                      }}
                        className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                        title="Add Category"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Institute Type *</label>
                    <select
                      required
                      value={formData.instituteType}
                      onChange={(e) => {
                        const newInstituteType = e.target.value;
                        // Clear category selection when institute type changes
                        setFormData({ 
                          ...formData, 
                          instituteType: newInstituteType,
                          categoryId: '' // Clear category when institute type changes
                        });
                        // Show helpful message
                        const typeNames = {
                          school: 'School Classes (Class 1, Class 2, etc.)',
                          college: 'College Years (First Year, Second Year, etc.)',
                          academy: 'Academy Books (Book 1, Book 2, etc.)',
                          short_course: 'Short Course Categories'
                        };
                        if (categories.length === 0) {
                          toast.info(`Select or create categories for ${typeNames[newInstituteType] || newInstituteType}`, { duration: 3000 });
                        }
                      }}
                      className="input-field"
                    >
                      <option value="school">School</option>
                      <option value="college">College</option>
                      <option value="academy">Academy</option>
                      <option value="short_course">Short Course</option>
                    </select>
                    {formData.instituteType && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {formData.instituteType === 'school' && 'Categories: Class 1, Class 2, Class 3, etc.'}
                        {formData.instituteType === 'college' && 'Categories: First Year, Second Year, Third Year, etc.'}
                        {formData.instituteType === 'academy' && 'Categories: Book 1, Book 2, Book 3, etc.'}
                        {formData.instituteType === 'short_course' && 'Categories: Any course category'}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Instructor</label>
                    <select
                      value={formData.instructorId}
                      onChange={(e) => setFormData({ ...formData, instructorId: e.target.value })}
                      className="input-field"
                    >
                      <option value="">Select an instructor</option>
                      {teachers.map((teacher) => (
                        <option key={teacher._id} value={teacher._id}>
                          {teacher.personalInfo?.fullName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-4 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingCourse(null);
                      resetForm();
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={courseMutation.isLoading}
                    className="btn-primary"
                  >
                    {courseMutation.isLoading ? 'Saving...' : editingCourse ? 'Update Course' : 'Create Course'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Manage Categories
                </h2>
                <button
                  onClick={() => {
                    setShowCategoryForm(false);
                    setEditingCategory(null);
                    setSelectedCategoryId('');
                    setCategoryFilterType('');
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

              {/* Add/Edit Category Form */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h3>
                <form onSubmit={handleCategorySubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
                      Category Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={categoryFormData.name}
                      onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                      className="input-field"
                      placeholder={
                        categoryFormData.instituteType === 'school' 
                          ? 'e.g., Class 1, Class 2, Class 3'
                          : categoryFormData.instituteType === 'college'
                          ? 'e.g., First Year, Second Year, Third Year'
                          : categoryFormData.instituteType === 'academy'
                          ? 'e.g., Book 1, Book 2, Book 3'
                          : 'e.g., Computer Science, English'
                      }
                    />
                    {categoryFormData.instituteType && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {categoryFormData.instituteType === 'school' && 'Examples: Class 1, Class 2, Class 3, Class 4, etc.'}
                        {categoryFormData.instituteType === 'college' && 'Examples: First Year, Second Year, Third Year, Fourth Year, etc.'}
                        {categoryFormData.instituteType === 'academy' && 'Examples: Book 1, Book 2, Book 3, Book 4, etc.'}
                        {categoryFormData.instituteType === 'short_course' && 'Examples: Web Development, Graphic Design, etc.'}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
                      Institute Type *
                    </label>
                    <select
                      required
                      value={categoryFormData.instituteType}
                      onChange={(e) => {
                        const newInstituteType = e.target.value;
                        setCategoryFormData({ ...categoryFormData, instituteType: newInstituteType, name: '' });
                      }}
                      className="input-field"
                    >
                      <option value="school">School</option>
                      <option value="college">College</option>
                      <option value="academy">Academy</option>
                      <option value="short_course">Short Course</option>
                    </select>
                    {categoryFormData.instituteType && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {categoryFormData.instituteType === 'school' && 'For school classes (Class 1, Class 2, etc.)'}
                        {categoryFormData.instituteType === 'college' && 'For college years (First Year, Second Year, etc.)'}
                        {categoryFormData.instituteType === 'academy' && 'For academy books (Book 1, Book 2, etc.)'}
                        {categoryFormData.instituteType === 'short_course' && 'For short course categories'}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
                      Description
                    </label>
                    <textarea
                      value={categoryFormData.description}
                      onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                      className="input-field"
                      rows="3"
                      placeholder="Category description..."
                    />
                  </div>

                  {/* Existing Categories Section */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Existing Categories
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                          Filter by Institute Type (optional)
                        </label>
                        <select
                          value={categoryFilterType}
                          onChange={(e) => {
                            setCategoryFilterType(e.target.value);
                            // Clear selection if current selection doesn't match filter
                            if (selectedCategoryId && e.target.value) {
                              const selectedCat = allCategories.find(c => c._id === selectedCategoryId);
                              if (selectedCat && selectedCat.instituteType !== e.target.value) {
                                setSelectedCategoryId('');
                              }
                            }
                          }}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-3"
                        >
                          <option value="">All Institute Types</option>
                          <option value="school">School</option>
                          <option value="college">College</option>
                          <option value="academy">Academy</option>
                          <option value="short_course">Short Course</option>
                        </select>
                      </div>
                      <select
                        value={selectedCategoryId}
                        onChange={(e) => setSelectedCategoryId(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="">Select a category to edit or delete</option>
                        {(categoryFilterType 
                          ? allCategories.filter(cat => cat.instituteType === categoryFilterType)
                          : allCategories
                        ).map((category) => (
                          <option key={category._id} value={category._id}>
                            {category.name} ({category.instituteType?.replace('_', ' ') || 'N/A'})
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedCategoryId) {
                              const category = allCategories.find(cat => cat._id === selectedCategoryId);
                              if (category) {
                                handleCategoryEdit(category);
                              }
                            }
                          }}
                          disabled={!selectedCategoryId}
                          className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Edit className="w-4 h-4" />
                          Edit Selected
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedCategoryId) {
                              if (window.confirm('Are you sure you want to delete this category?')) {
                                handleCategoryDelete(selectedCategoryId);
                                setSelectedCategoryId('');
                              }
                            }
                          }}
                          disabled={!selectedCategoryId}
                          className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Selected
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCategoryForm(false);
                        setEditingCategory(null);
                        setSelectedCategoryId('');
                        setCategoryFilterType('');
                        setCategoryFormData({
                          name: '',
                          instituteType: 'college',
                          categoryType: 'course',
                          description: ''
                        });
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
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Courses;

