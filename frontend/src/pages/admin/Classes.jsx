import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useLocation } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
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
  Save
} from 'lucide-react';

const Classes = () => {
  const queryClient = useQueryClient();
  const [selectedClass, setSelectedClass] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [showInstructorForm, setShowInstructorForm] = useState(false);
  const [showCreateClassForm, setShowCreateClassForm] = useState(false);
  const [editingScheduleIndex, setEditingScheduleIndex] = useState(null);
  const [selectedInstructorId, setSelectedInstructorId] = useState('');
  const [scheduleForm, setScheduleForm] = useState({
    startTime: '',
    endTime: '',
    days: [],
    room: ''
  });
  const [newClassForm, setNewClassForm] = useState({
    name: '',
    categoryId: '',
    instructorId: '',
    startTime: '',
    endTime: '',
    days: [],
    room: '',
    capacity: 50,
    feeAmount: 0,
    status: 'published'
  });

  // Fetch teachers for instructor selection
  const { data: teachers = [] } = useQuery('teachers', async () => {
    const response = await api.get('/teachers');
    return response.data;
  });

  // Fetch categories for class creation (only course categories)
  const { data: categories = [] } = useQuery(['categories', 'course'], async () => {
    const response = await api.get('/categories?categoryType=course');
    return response.data;
  });

  // Fetch all classes
  const { data: classes = [], isLoading } = useQuery('classes', async () => {
    const response = await api.get('/classes');
    return response.data;
  }, {
    refetchOnWindowFocus: false,
    staleTime: 30000 // Cache for 30 seconds
  });

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
      } else if (courseId && classes.length > 0) {
        // Course ID provided but class not found - log for debugging
        console.warn(`Class with ID ${courseId} not found in classes list. Available classes:`, classes.map(c => ({ id: c._id, name: c.name })));
      }
    } else if (courseId && classes.length === 0 && !isLoading) {
      // If we have a courseId but no classes loaded, refetch
      console.log('Course ID provided but classes not loaded, will retry...');
    }
  }, [searchParams, classes, selectedClass, setSearchParams, location.state, isLoading]);

  // Fetch detailed class information
  const { data: classDetails, isLoading: isLoadingDetails } = useQuery(
    ['classDetails', selectedClass?._id],
    async () => {
      if (!selectedClass?._id) return null;
      const response = await api.get(`/classes/${selectedClass._id}`);
      return response.data;
    },
    {
      enabled: !!selectedClass?._id
    }
  );

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
  const addScheduleMutation = useMutation(
    async ({ classId, scheduleData }) => {
      return api.post(`/classes/${classId}/schedule`, scheduleData);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('classes');
        queryClient.invalidateQueries(['classDetails', selectedClass?._id]);
        setShowScheduleForm(false);
        setScheduleForm({ startTime: '', endTime: '', days: [], room: '' });
        setEditingScheduleIndex(null);
        toast.success('Schedule added successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to add schedule');
      }
    }
  );

  // Update schedule mutation
  const updateScheduleMutation = useMutation(
    async ({ classId, scheduleIndex, scheduleData }) => {
      return api.put(`/classes/${classId}/schedule/${scheduleIndex}`, scheduleData);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('classes');
        queryClient.invalidateQueries(['classDetails', selectedClass?._id]);
        setShowScheduleForm(false);
        setScheduleForm({ startTime: '', endTime: '', days: [], room: '' });
        setEditingScheduleIndex(null);
        toast.success('Schedule updated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update schedule');
      }
    }
  );

  // Delete schedule mutation
  const deleteScheduleMutation = useMutation(
    async ({ classId, scheduleIndex }) => {
      return api.delete(`/classes/${classId}/schedule/${scheduleIndex}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('classes');
        queryClient.invalidateQueries(['classDetails', selectedClass?._id]);
        toast.success('Schedule deleted successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete schedule');
      }
    }
  );

  // Assign instructor mutation
  const assignInstructorMutation = useMutation(
    async ({ classId, instructorId }) => {
      return api.put(`/classes/${classId}/instructor`, { instructorId });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('classes');
        queryClient.invalidateQueries(['classDetails', selectedClass?._id]);
        setShowInstructorForm(false);
        setSelectedInstructorId('');
        toast.success('Instructor assigned successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to assign instructor');
      }
    }
  );

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
  const createClassMutation = useMutation(
    async (data) => {
      // First create the course
      const courseData = {
        name: data.name,
        categoryId: data.categoryId,
        instituteType: 'academy', // Default, can be changed
        instructorId: data.instructorId || null,
        capacity: data.capacity || 50,
        status: data.status || 'published',
        fee: {
          amount: data.feeAmount || 0,
          currency: 'USD'
        },
        schedules: []
      };

      // Add schedule if provided
      if (data.startTime && data.endTime) {
        courseData.schedules = [{
          startTime: data.startTime,
          endTime: data.endTime,
          days: data.days || [],
          room: data.room || '',
          isActive: true
        }];
      }

      const response = await api.post('/courses', courseData);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('classes');
        queryClient.invalidateQueries('courses');
        setShowCreateClassForm(false);
        setNewClassForm({
          name: '',
          categoryId: '',
          instructorId: '',
          startTime: '',
          endTime: '',
          days: [],
          room: '',
          capacity: 50,
          feeAmount: 0,
          status: 'published'
        });
        toast.success('Class created successfully!');
      },
      onError: (error) => {
        const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to create class';
        toast.error(errorMessage);
        console.error('Create class error:', error);
      }
    }
  );

  // Fill sample data for testing
  const fillSampleData = () => {
    const sampleData = {
      name: 'Sample English Class',
      categoryId: categories.length > 0 ? categories[0]._id : '',
      instructorId: teachers.length > 0 ? teachers[0]._id : '',
      startTime: '09:00',
      endTime: '11:00',
      days: ['Monday', 'Wednesday', 'Friday'],
      room: 'Room 101',
      capacity: 30,
      feeAmount: 500,
      status: 'published'
    };
    setNewClassForm(sampleData);
    toast.success('Sample data filled! You can modify the values as needed.');
  };

  const handleCreateClassSubmit = (e) => {
    e.preventDefault();
    if (!newClassForm.name || !newClassForm.name.trim()) {
      toast.error('Please provide class name');
      return;
    }
    if (!newClassForm.categoryId) {
      toast.error('Please select a category');
      return;
    }
    if (!newClassForm.instructorId) {
      toast.error('Please select a teacher');
      return;
    }
    if (!newClassForm.startTime || !newClassForm.endTime) {
      toast.error('Please provide start time and end time');
      return;
    }
    if (newClassForm.days.length === 0) {
      toast.error('Please select at least one day');
      return;
    }
    if (!newClassForm.feeAmount || newClassForm.feeAmount < 0) {
      toast.error('Please provide a valid fee amount');
      return;
    }
    createClassMutation.mutate(newClassForm);
  };

  const toggleDayForNewClass = (day) => {
    setNewClassForm(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

          <div className="card animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Fee</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {formatCurrency(classDetails.statistics.totalFee)}
                </p>
              </div>
              <div className="icon-container bg-green-100 dark:bg-green-900/20">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="card animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Paid Fee</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {formatCurrency(classDetails.statistics.totalPaid)}
                </p>
              </div>
              <div className="icon-container bg-emerald-100 dark:bg-emerald-900/20">
                <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="card animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending Fee</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                  {formatCurrency(classDetails.statistics.totalPending)}
                </p>
              </div>
              <div className="icon-container bg-red-100 dark:bg-red-900/20">
                <DollarSign className="w-6 h-6 text-red-600 dark:text-red-400" />
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
                      <th>Pending</th>
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
                            Pending: <span className="font-semibold">{formatCurrency(schedulePendingFee)}</span>
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
        {showInstructorForm && (
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
                    {teachers.map((teacher) => (
                      <option key={teacher._id} value={teacher._id}>
                        {teacher.personalInfo?.fullName || 'N/A'}
                      </option>
                    ))}
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
        )}
      </div>
    );
  }

  // Main classes list view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Classes
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View all classes, student enrollment, and fee collection details
          </p>
        </div>
        <button
          onClick={() => setShowCreateClassForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors duration-200 shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5" />
          Add Class
        </button>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((classItem) => (
          <div
            key={classItem._id}
            onClick={() => setSelectedClass(classItem)}
            className="card animate-fade-in cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="icon-container bg-gradient-to-br from-primary-500 to-purple-600">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {classItem.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {classItem.category}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>

            {/* Teacher and Time Info - Prominently Displayed */}
            <div className="mb-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
              <div className="space-y-2">
                {/* Teacher */}
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Teacher:</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {classItem.instructor || 'Not Assigned'}
                  </span>
                </div>
                {/* Class Times */}
                {classItem.schedules && classItem.schedules.length > 0 ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Class Time:</span>
                    </div>
                    <div className="flex flex-wrap gap-2 ml-6">
                      {classItem.schedules.map((schedule, index) => (
                        <span key={index} className="badge-info text-xs font-semibold">
                          {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                          {schedule.days && schedule.days.length > 0 && (
                            <span className="ml-1">({schedule.days.map(d => d.substring(0, 3)).join(', ')})</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">No schedule set</span>
                  </div>
                )}
              </div>
            </div>

            {/* Statistics */}
            <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">Students</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {classItem.studentCount} / {classItem.capacity}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-sm">Total Fee</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(classItem.totalFee)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">Paid</span>
                </div>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {formatCurrency(classItem.totalPaid)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-sm">Pending</span>
                </div>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  {formatCurrency(classItem.totalPending)}
                </span>
              </div>

            </div>
          </div>
        ))}
      </div>

      {classes.length === 0 && (
        <div className="card text-center py-12">
          <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No classes found</p>
        </div>
      )}

      {/* Create New Class Modal */}
      {showCreateClassForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full my-8 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Create New Class
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={fillSampleData}
                  type="button"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors duration-200"
                  title="Fill form with sample data"
                >
                  <FileText className="w-4 h-4" />
                  Fill Sample
                </button>
                <button
                  onClick={() => {
                    setShowCreateClassForm(false);
                    setNewClassForm({
                      name: '',
                      categoryId: '',
                      instructorId: '',
                      startTime: '',
                      endTime: '',
                      days: [],
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
            </div>
            <form onSubmit={handleCreateClassSubmit} className="space-y-6">
              {/* Class Name and Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Class Name *
                  </label>
                  <input
                    type="text"
                    value={newClassForm.name}
                    onChange={(e) => setNewClassForm({ ...newClassForm, name: e.target.value })}
                    required
                    placeholder="e.g., Book 1, DIT, English Language"
                    className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Category *
                  </label>
                  <select
                    value={newClassForm.categoryId}
                    onChange={(e) => setNewClassForm({ ...newClassForm, categoryId: e.target.value })}
                    required
                    className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Teacher Assignment */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  Assign Teacher *
                </label>
                <select
                  value={newClassForm.instructorId}
                  onChange={(e) => setNewClassForm({ ...newClassForm, instructorId: e.target.value })}
                  required
                  className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select a teacher</option>
                  {teachers.length > 0 ? (
                    teachers.map((teacher) => (
                      <option key={teacher._id} value={teacher._id}>
                        {teacher.personalInfo?.fullName || 'N/A'}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No teachers available. Please add teachers first.</option>
                  )}
                </select>
                {teachers.length === 0 && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    No teachers found. Please add teachers before creating a class.
                  </p>
                )}
              </div>

              {/* Class Schedule */}
              <div className="border-2 border-indigo-200 dark:border-indigo-800 rounded-lg p-4 bg-indigo-50 dark:bg-indigo-900/20">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  Class Schedule *
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Start Time *
                    </label>
                    <input
                      type="time"
                      value={newClassForm.startTime}
                      onChange={(e) => setNewClassForm({ ...newClassForm, startTime: e.target.value })}
                      required
                      className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      End Time *
                    </label>
                    <input
                      type="time"
                      value={newClassForm.endTime}
                      onChange={(e) => setNewClassForm({ ...newClassForm, endTime: e.target.value })}
                      required
                      className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Days of the Week *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {weekDays.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDayForNewClass(day)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          newClassForm.days.includes(day)
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                  {newClassForm.days.length === 0 && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                      Please select at least one day
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Room (Optional)
                  </label>
                  <input
                    type="text"
                    value={newClassForm.room}
                    onChange={(e) => setNewClassForm({ ...newClassForm, room: e.target.value })}
                    placeholder="e.g., Room 101"
                    className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              {/* Capacity and Fee */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Class Capacity *
                  </label>
                  <input
                    type="number"
                    value={newClassForm.capacity}
                    onChange={(e) => setNewClassForm({ ...newClassForm, capacity: parseInt(e.target.value) || 50 })}
                    min="1"
                    required
                    className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Fee Amount (USD) *
                  </label>
                  <input
                    type="number"
                    value={newClassForm.feeAmount}
                    onChange={(e) => setNewClassForm({ ...newClassForm, feeAmount: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="0.01"
                    required
                    placeholder="0.00"
                    className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateClassForm(false);
                    setNewClassForm({
                      name: '',
                      categoryId: '',
                      instructorId: '',
                      startTime: '',
                      endTime: '',
                      days: [],
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
                  disabled={createClassMutation.isLoading}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 flex items-center gap-2 font-semibold"
                >
                  <Save className="w-5 h-5" />
                  {createClassMutation.isLoading ? 'Creating...' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Classes;

