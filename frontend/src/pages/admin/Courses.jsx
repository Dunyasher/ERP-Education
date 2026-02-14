import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Search, BookOpen } from 'lucide-react';

const Courses = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
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
  const { data: courses = [], isLoading } = useQuery('courses', async () => {
    const response = await api.get('/courses');
    return response.data;
  });

  // Fetch categories
  const { data: categories = [] } = useQuery('categories', async () => {
    const response = await api.get('/categories');
    return response.data;
  });

  // Fetch teachers
  const { data: teachers = [] } = useQuery('teachers', async () => {
    const response = await api.get('/teachers');
    return response.data;
  });

  // Create/Update course mutation
  const courseMutation = useMutation(
    async (data) => {
      if (editingCourse) {
        return api.put(`/courses/${editingCourse._id}`, data);
      } else {
        return api.post('/courses', data);
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('courses');
        toast.success(editingCourse ? 'Course updated successfully!' : 'Course created successfully!');
        setShowForm(false);
        setEditingCourse(null);
        resetForm();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to save course');
      }
    }
  );

  // Delete course mutation
  const deleteMutation = useMutation(
    async (id) => api.delete(`/courses/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('courses');
        toast.success('Course deleted successfully!');
      },
      onError: () => {
        toast.error('Failed to delete course');
      }
    }
  );

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
                    <select
                      required
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="input-field"
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
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
                  <div>
                    <label className="block text-sm font-medium mb-1">Fee Amount *</label>
                    <input
                      type="number"
                      required
                      value={formData.fee.amount}
                      onChange={(e) => setFormData({
                        ...formData,
                        fee: { ...formData.fee, amount: parseFloat(e.target.value) || 0 }
                      })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="input-field"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-field"
                    rows="3"
                  />
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
    </div>
  );
};

export default Courses;

