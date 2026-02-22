import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../store/hooks';
import { 
  ChevronRight,
  Plus,
  Search,
  FileSpreadsheet,
  FileText,
  File,
  Printer,
  Video,
  ThumbsUp,
  Trash2,
  Circle,
  X
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const OnlineClasses = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [formData, setFormData] = useState({
    topic: '',
    categoryId: '',
    startTime: '',
    password: '',
    className: '',
    section: '',
    date: new Date(),
    meetingLink: '',
    duration: 60 // in minutes
  });
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    instituteType: 'college',
    categoryType: 'course',
    description: '',
    isActive: true
  });

  // Fetch online classes
  const { data: onlineClasses = [], isLoading } = useQuery({
    queryKey: ['onlineClasses'],
    queryFn: async () => {
      try {
        const response = await api.get('/online-classes');
        return response.data;
      } catch (error) {
        // If endpoint doesn't exist, return empty array
        if (error.response?.status === 404) {
          return [];
        }
        throw error;
      }
    }
  });

  // Fetch students to get unique classes and sections
  const { data: students = [] } = useQuery({
    queryKey: ['allStudents'],
    queryFn: async () => {
      try {
        const response = await api.get('/students');
        return response.data;
      } catch (error) {
        return [];
      }
    }
  });

  const uniqueClasses = [...new Set(students.map(s => s.className).filter(Boolean))].sort();
  const uniqueSections = [...new Set(students.map(s => s.section).filter(Boolean))].sort();

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const response = await api.get('/categories?categoryType=course');
        return response.data;
      } catch (error) {
        return [];
      }
    }
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (data) => {
      // Don't send collegeId - let backend get it from req.user or req.collegeId
      // Only include it if user is super_admin and explicitly provided
      const categoryData = { ...data };
      // Remove collegeId from data - backend will get it from authenticated user
      delete categoryData.collegeId;
      return api.post('/categories', categoryData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category created successfully!');
      setShowCategoryModal(false);
      setCategoryFormData({
        name: '',
        instituteType: 'college',
        categoryType: 'course',
        description: '',
        isActive: true
      });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create category');
    }
  });

  // Create online class mutation
  const createClassMutation = useMutation(
    async (data) => {
      const classData = {
        topic: data.topic,
        categoryId: data.categoryId || '',
        startTime: data.startTime,
        password: data.password || '123',
        className: data.className || '',
        section: data.section || '',
        date: data.date,
        timing: data.startTime,
        meetingLink: data.meetingLink || '',
        duration: data.duration || 60,
        status: 'approved'
      };
      return api.post('/online-classes', classData);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['onlineClasses'] });
        toast.success('Online class created successfully!');
        setShowAddModal(false);
        setFormData({
          topic: '',
          categoryId: '',
          startTime: '',
          password: '',
          className: '',
          section: '',
          date: new Date(),
          meetingLink: '',
          duration: 60
        });
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create online class');
      }
    }
  );

  // Delete class mutation
  const deleteClassMutation = useMutation(
    async (classId) => {
      return api.delete(`/online-classes/${classId}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['onlineClasses'] });
        toast.success('Online class deleted successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete class');
      }
    }
  );

  // Approve class mutation
  const approveClassMutation = useMutation(
    async (classId) => {
      return api.put(`/online-classes/${classId}/approve`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['onlineClasses'] });
        toast.success('Class approved successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to approve class');
      }
    }
  );

  const handleDelete = (classId) => {
    if (window.confirm('Are you sure you want to delete this online class?')) {
      deleteClassMutation.mutate(classId);
    }
  };

  const handleApprove = (classId) => {
    approveClassMutation.mutate(classId);
  };

  const handleJoinClass = (classData) => {
    // Navigate to class or open meeting link
    if (classData.meetingLink) {
      window.open(classData.meetingLink, '_blank');
    } else {
      toast.error('Meeting link not available');
    }
  };

  // Filter classes based on search term
  const filteredClasses = onlineClasses.filter(cls => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      cls.topic?.toLowerCase().includes(searchLower) ||
      cls.className?.toLowerCase().includes(searchLower) ||
      cls.section?.toLowerCase().includes(searchLower) ||
      cls.createdBy?.toLowerCase().includes(searchLower)
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredClasses.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const paginatedClasses = filteredClasses.slice(startIndex, endIndex);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    // If time is already in HH:mm format, return as is
    if (timeString.match(/^\d{2}:\d{2}$/)) {
      return timeString;
    }
    // Otherwise try to parse
    return timeString;
  };

  const handleExport = (format) => {
    toast.info(`Exporting to ${format.toUpperCase()}...`);
    // Implement export functionality
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.topic || !formData.topic.trim()) {
      toast.error('Please enter class topic');
      return;
    }
    if (!formData.categoryId) {
      toast.error('Please select a category');
      return;
    }
    if (!formData.startTime) {
      toast.error('Please enter start time');
      return;
    }
    if (!formData.date) {
      toast.error('Please select date');
      return;
    }
    createClassMutation.mutate(formData);
  };

  const handleCategorySubmit = (e) => {
    e.preventDefault();
    if (!categoryFormData.name || !categoryFormData.name.trim()) {
      toast.error('Please enter category name');
      return;
    }
    // Backend will automatically get collegeId from authenticated user
    // Only send the form data without collegeId
    createCategoryMutation.mutate(categoryFormData);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        <ol className="flex items-center space-x-2">
          <li><Link to="/admin/dashboard" className="hover:text-blue-600">Dashboard</Link></li>
          <li><ChevronRight size={16} className="inline" /></li>
          <li className="text-gray-900 dark:text-white">Online Classes</li>
        </ol>
      </nav>

      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div></div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Add New Class
        </button>
      </div>

      {/* Dark Blue Header */}
      <div className="bg-blue-900 text-white px-6 py-4 rounded-lg flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
          <Circle className="w-6 h-6 text-blue-900" />
        </div>
        <h1 className="text-2xl font-bold">Online Class Management</h1>
      </div>

      {/* Table Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700 dark:text-gray-300">Show</label>
          <select
            value={entriesPerPage}
            onChange={(e) => {
              setEntriesPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
          <label className="text-sm text-gray-700 dark:text-gray-300">entries</label>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleExport('excel')}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <FileSpreadsheet size={16} />
            Excel
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <FileText size={16} />
            CSV
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <File size={16} />
            PDF
          </button>
          <button
            onClick={handlePrint}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <Printer size={16} />
            Print
          </button>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700 dark:text-gray-300">Search:</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search classes..."
              className="border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading online classes...</p>
          </div>
        ) : paginatedClasses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">No online classes found.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Class Topic
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Start Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Password
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Section
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Timing
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Created By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Options
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedClasses.map((classItem, index) => (
                    <tr key={classItem._id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {startIndex + index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {classItem.topic || classItem.classTopic || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {classItem.categoryId?.name || classItem.category || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatTime(classItem.startTime)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-mono">
                        {classItem.password || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {classItem.className || classItem.class || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {classItem.section || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(classItem.date || classItem.classDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatTime(classItem.timing || classItem.startTime)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {classItem.createdBy || classItem.teacherName || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {classItem.status === 'pending' || classItem.approved === false ? (
                          <button
                            onClick={() => handleApprove(classItem._id)}
                            disabled={approveClassMutation.isLoading}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded flex items-center gap-1 text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            <ThumbsUp size={14} />
                            Approve Class
                          </button>
                        ) : (
                          <button
                            onClick={() => handleJoinClass(classItem)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded flex items-center gap-1 text-xs font-medium transition-colors"
                          >
                            <Video size={14} />
                            Join Class
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleDelete(classItem._id)}
                          disabled={deleteClassMutation.isLoading}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded flex items-center gap-1 text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredClasses.length)} of {filteredClasses.length} entries
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add New Class Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full my-8 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Add New Online Class
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFormData({
                    topic: '',
                    startTime: '',
                    password: '',
                    className: '',
                    section: '',
                    date: new Date(),
                    meetingLink: '',
                    duration: 60
                  });
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Class Topic *
                  </label>
                  <input
                    type="text"
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    required
                    placeholder="Enter class topic"
                    className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    Category *
                    <button
                      type="button"
                      onClick={() => setShowCategoryModal(true)}
                      className="text-blue-600 hover:text-blue-700 text-xs font-normal"
                    >
                      (Add New)
                    </button>
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    required
                    className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                    className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Password
                  </label>
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter meeting password (default: 123)"
                    className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })}
                    min="15"
                    step="15"
                    className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Class
                  </label>
                  <select
                    value={formData.className}
                    onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                    className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select Class (Optional)</option>
                    {uniqueClasses.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Section
                  </label>
                  <select
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select Section (Optional)</option>
                    {uniqueSections.map((sec) => (
                      <option key={sec} value={sec}>
                        {sec}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Date *
                  </label>
                  <DatePicker
                    selected={formData.date}
                    onChange={(date) => setFormData({ ...formData, date: date })}
                    required
                    className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    dateFormat="MM/dd/yyyy"
                    minDate={new Date()}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Meeting Link
                  </label>
                  <input
                    type="url"
                    value={formData.meetingLink}
                    onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                    placeholder="https://meet.google.com/..."
                    className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({
                      topic: '',
                      categoryId: '',
                      startTime: '',
                      password: '',
                      className: '',
                      section: '',
                      date: new Date(),
                      meetingLink: '',
                      duration: 60
                    });
                  }}
                  className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createClassMutation.isLoading}
                  className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {createClassMutation.isLoading ? 'Creating...' : (
                    <>
                      <Plus size={18} />
                      Create Class
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full my-8 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Add New Category
              </h3>
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setCategoryFormData({
                    name: '',
                    instituteType: 'college',
                    categoryType: 'course',
                    description: '',
                    isActive: true
                  });
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  required
                  placeholder="Enter category name"
                  className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Institute Type
                </label>
                <select
                  value={categoryFormData.instituteType}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, instituteType: e.target.value })}
                  className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="school">School</option>
                  <option value="college">College</option>
                  <option value="academy">Academy</option>
                  <option value="short_course">Short Course</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={categoryFormData.description}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                  placeholder="Enter category description (optional)"
                  rows="3"
                  className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={categoryFormData.isActive}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
                  Active
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryModal(false);
                    setCategoryFormData({
                      name: '',
                      instituteType: 'college',
                      categoryType: 'course',
                      description: '',
                      isActive: true
                    });
                  }}
                  className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createCategoryMutation.isLoading}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {createCategoryMutation.isLoading ? 'Creating...' : (
                    <>
                      <Plus size={18} />
                      Create Category
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnlineClasses;

