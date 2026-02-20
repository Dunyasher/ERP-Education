import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import { useAuth } from '../../store/hooks';
import { Calendar, BookOpen, CheckCircle, XCircle, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { useState } from 'react';

const StudentAttendance = () => {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  // Get student ID from user
  const getStudentId = async () => {
    try {
      // First, get the student record for this user
      const response = await api.get('/students');
      const students = response.data;
      const student = students.find(s => s.userId?._id === user?.id || s.userId === user?.id);
      return student?._id;
    } catch (error) {
      console.error('Error fetching student ID:', error);
      return null;
    }
  };

  // Fetch student attendance
  const { data: attendanceData, isLoading, refetch } = useQuery({
    queryKey: ['studentAttendance', user?.id, dateRange],
    queryFn: async () => {
      const studentId = await getStudentId();
      if (!studentId) {
        throw new Error('Student record not found');
      }

      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);

      const response = await api.get(`/attendance/student/${studentId}?${params.toString()}`);
      return response.data;
    },
    enabled: !!user?.id,
    retry: 1
  });

  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const applyDateFilter = () => {
    refetch();
  };

  const clearDateFilter = () => {
    setDateRange({ startDate: '', endDate: '' });
    setTimeout(() => refetch(), 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!attendanceData) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Attendance</h1>
        <div className="card">
          <p className="text-gray-600 dark:text-gray-400">No attendance records found.</p>
        </div>
      </div>
    );
  }

  const { courses, totals, studentName, studentSrNo } = attendanceData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          My Attendance
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          View your attendance records by subject and overall totals
        </p>
      </div>

      {/* Date Range Filter */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Filter by Date Range
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={applyDateFilter}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Apply Filter
            </button>
            <button
              onClick={clearDateFilter}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Overall Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-100">Total Days</p>
              <p className="text-3xl font-bold mt-2">{totals.totalDays}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-100">Present</p>
              <p className="text-3xl font-bold mt-2">{totals.present}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-100">Absent</p>
              <p className="text-3xl font-bold mt-2">{totals.absent}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-100">Overall %</p>
              <p className="text-3xl font-bold mt-2">{totals.percentage}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Attendance by Subject */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          Attendance by Subject
        </h2>
        
        {courses && courses.length > 0 ? (
          <div className="space-y-6">
            {courses.map((course, index) => (
              <div
                key={course.courseId || index}
                className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                {/* Course Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                      <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {course.courseName}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {course.categoryName}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {course.percentage}%
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {course.present} / {course.total} days
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-green-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${course.percentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Status Breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Present</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{course.present}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Absent</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{course.absent}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-yellow-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Late</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{course.late}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Excused</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{course.excused}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No attendance records found for your courses.
            </p>
          </div>
        )}
      </div>

      {/* Detailed Records (Optional - can be expanded) */}
      {courses && courses.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Recent Attendance Records
          </h2>
          <div className="space-y-2">
            {courses.slice(0, 3).map((course, courseIndex) => (
              course.records.slice(0, 5).map((record, recordIndex) => (
                <div
                  key={`${courseIndex}-${recordIndex}`}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      record.status === 'present' ? 'bg-green-100 dark:bg-green-900/30' :
                      record.status === 'absent' ? 'bg-red-100 dark:bg-red-900/30' :
                      record.status === 'late' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                      'bg-blue-100 dark:bg-blue-900/30'
                    }`}>
                      {record.status === 'present' ? <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" /> :
                       record.status === 'absent' ? <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" /> :
                       record.status === 'late' ? <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" /> :
                       <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {course.courseName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(record.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    record.status === 'present' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    record.status === 'absent' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                    record.status === 'late' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                  </span>
                </div>
              ))
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentAttendance;

