import { useState } from 'react';
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

  // Fetch courses
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const response = await api.get('/courses');
      return response.data;
    }
  });

  // Fetch categories (only course categories)
  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useQuery({
    queryKey: ['categories', 'course'],
    queryFn: async () => {
      try {
        const response = await api.get('/categories?categoryType=course');
        return response.data || [];
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
    retry: 1,
    refetchOnWindowFocus: false
  });

  // Fetch teachers
  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const response = await api.get('/teachers');
      return response.data;
    }
  });

  // Create/Update course mutation
  const courseMutation = useMutation({
    mutationFn: async (data) => {
      if (editingCourse) {
        return api.put(`/courses/${editingCourse._id}`, data);
      } else {
        return api.post('/courses', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success(editingCourse ? 'Course updated successfully!' : 'Course created successfully!');
      setShowForm(false);
      setEditingCourse(null);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to save course');
    }
  });

  // Delete course mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/courses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', 'course'] });
      toast.success(editingCategory ? 'Category updated successfully!' : 'Category created successfully!');
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', 'course'] });
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
                      >
                        <option value="">Select a category</option>
                        {categories.map((category) => (
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
                      onChange={(e) => setFormData({ ...formData, instituteType: e.target.value })}
                      className="input-field"
                    >
                      <option value="school">School</option>
                      <option value="college">College</option>
                      <option value="academy">Academy</option>
                      <option value="short_course">Short Course</option>
                    </select>
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
                      placeholder="e.g., Computer Science, English"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
                      Institute Type *
                    </label>
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
                      <select
                        value={selectedCategoryId}
                        onChange={(e) => setSelectedCategoryId(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="">Select a category to edit or delete</option>
                        {categories.map((category) => (
                          <option key={category._id} value={category._id}>
                            {category.name} ({category.instituteType?.replace('_', ' ')})
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedCategoryId) {
                              const category = categories.find(cat => cat._id === selectedCategoryId);
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

