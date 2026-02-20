import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { 
  Search,
  ChevronRight,
  Circle
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const ManualAttendance = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendanceType, setAttendanceType] = useState('manual');
  const [selectedClassName, setSelectedClassName] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState({});
  const [showTable, setShowTable] = useState(false);

  // Fetch students based on filters
  const { data: students = [], isLoading: isLoadingStudents, refetch } = useQuery(
    ['students', selectedClassName, selectedSection],
    async () => {
      const params = {};
      if (selectedClassName) params.className = selectedClassName;
      if (selectedSection) params.section = selectedSection;
      const response = await api.get('/students', { params });
      return response.data;
    },
    {
      enabled: false // Only fetch when "Manage Attendance" is clicked
    }
  );

  // Filter students by class and section
  const filteredStudents = students.filter(student => {
    let matches = true;
    if (selectedClassName && student.className !== selectedClassName) matches = false;
    if (selectedSection && student.section !== selectedSection) matches = false;
    return matches;
  });

  // Get unique classes and sections from all students
  const { data: allStudents = [] } = useQuery('allStudents', async () => {
    const response = await api.get('/students');
    return response.data;
  });

  const uniqueClasses = [...new Set(allStudents.map(s => s.className).filter(Boolean))].sort();
  const uniqueSections = [...new Set(allStudents.map(s => s.section).filter(Boolean))].sort();

  // Initialize attendance status for all students
  useEffect(() => {
    const initialStatus = {};
    filteredStudents.forEach(student => {
      if (!attendanceStatus[student._id]) {
        initialStatus[student._id] = 'present'; // Default to present
      } else {
        initialStatus[student._id] = attendanceStatus[student._id];
      }
    });
    setAttendanceStatus(prev => ({ ...prev, ...initialStatus }));
  }, [filteredStudents]);

  // Mark attendance mutation
  const markAttendanceMutation = useMutation(
    async (data) => {
      return api.post('/attendance/manual', data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('attendance');
        toast.success('Attendance marked successfully!');
        setAttendanceStatus({});
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to mark attendance');
      }
    }
  );

  const handleStatusChange = (studentId, status) => {
    setAttendanceStatus(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleMarkAll = (status) => {
    const newStatus = {};
    filteredStudents.forEach(student => {
      newStatus[student._id] = status;
    });
    setAttendanceStatus(prev => ({ ...prev, ...newStatus }));
  };

  const handleTypeChange = (type) => {
    setAttendanceType(type);
    // Don't navigate immediately - let user click "Manage Attendance" button
  };

  const handleManageAttendance = () => {
    // Navigate to different pages based on type
    if (attendanceType === 'card-scanner') {
      navigate('/admin/card-scanner');
      return;
    } else if (attendanceType === 'face-scan') {
      navigate('/admin/attendance/face-scan');
      return;
    } else if (attendanceType === 'fingerprint-scan') {
      navigate('/admin/attendance/fingerprint-scan');
      return;
    } else if (attendanceType === 'attendance-reports') {
      navigate('/admin/attendance/reports');
      return;
    }
    // For 'digital' and 'manual', fetch students and show table
    refetch();
    setShowTable(true);
  };

  const handleSaveAttendance = () => {
    if (filteredStudents.length === 0) {
      toast.error('No students found. Please adjust filters.');
      return;
    }

    const studentsData = filteredStudents.map(student => ({
      studentId: student._id,
      status: attendanceStatus[student._id] || 'present'
    }));

    markAttendanceMutation.mutate({
      students: studentsData,
      className: selectedClassName,
      section: selectedSection,
      date: selectedDate.toISOString()
    });
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const day = d.getDate();
    const month = d.toLocaleString('default', { month: 'long' });
    const year = d.getFullYear();
    return `${day} ${month} - ${year}`;
  };

  const formatDateShort = (date) => {
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        <ol className="flex items-center space-x-2">
          <li><Link to="/admin/dashboard" className="hover:text-blue-600">Dashboard</Link></li>
          <li><ChevronRight size={16} className="inline" /></li>
          <li><Link to="/admin/attendance/manual" className="hover:text-blue-600">Manage Attendance</Link></li>
          <li><ChevronRight size={16} className="inline" /></li>
          <li className="text-gray-900 dark:text-white">Student Attendance</li>
        </ol>
      </nav>

      {/* Dark Blue Header */}
      <div className="bg-blue-900 text-white px-6 py-4 rounded-lg flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
          <Circle className="w-6 h-6 text-blue-900" />
        </div>
        <h1 className="text-2xl font-bold">Manage Student Attendance</h1>
      </div>

      {/* Filter Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type
            </label>
            <select
              value={attendanceType}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="digital">Digital Attendance</option>
              <option value="manual">Manual Attendance</option>
              <option value="card-scanner">Card Scanner</option>
              <option value="face-scan">Face Scan</option>
              <option value="fingerprint-scan">Fingerprint Scan</option>
              <option value="attendance-reports">Attendance Reports</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Class
            </label>
            <select
              value={selectedClassName}
              onChange={(e) => setSelectedClassName(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select Class</option>
              {uniqueClasses.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Section
            </label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select Section</option>
              {uniqueSections.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date
            </label>
            <DatePicker
              selected={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              dateFormat="MM/dd/yyyy"
            />
          </div>

          <div>
            <button
              onClick={handleManageAttendance}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded flex items-center justify-center gap-2 font-medium transition-colors"
            >
              <Search size={18} />
              Manage Attendance
            </button>
          </div>
        </div>
      </div>

      {/* Attendance Summary Box */}
      {showTable && (
        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-6 text-center">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Attendance For Class:</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedClassName || 'All Classes'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Section:</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedSection || 'All Sections'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Campus:</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">Main Campus</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Date:</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatDate(selectedDate)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {showTable && filteredStudents.length > 0 && (
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleMarkAll('present')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded font-medium transition-colors"
          >
            ✓ Mark All Present
          </button>
          <button
            onClick={() => handleMarkAll('absent')}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded font-medium transition-colors"
          >
            ✗ Mark All Absent
          </button>
          <button
            onClick={() => handleMarkAll('holiday')}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded font-medium transition-colors"
          >
            ✗ Mark All Holiday
          </button>
          <button
            onClick={() => handleMarkAll('sunday')}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded font-medium transition-colors"
          >
            ✗ Mark All Sunday
          </button>
        </div>
      )}

      {/* Students Table */}
      {showTable && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {isLoadingStudents ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading students...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">No students found. Please adjust filters.</p>
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
                        Roll ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Parent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Class
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Attendance Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredStudents.map((student, index) => (
                      <tr key={student._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-mono">
                          {student.admissionNo || student.rollNo || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {student.personalInfo?.fullName || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {student.parentInfo?.fatherName || student.parentInfo?.motherName || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {student.className || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={attendanceStatus[student._id] || 'present'}
                            onChange={(e) => handleStatusChange(student._id, e.target.value)}
                            className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          >
                            <option value="present">Present</option>
                            <option value="absent">Absent</option>
                            <option value="late">Late</option>
                            <option value="holiday">Holiday</option>
                            <option value="sunday">Sunday</option>
                            <option value="excused">Excused</option>
                            <option value="leave">Leave</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                <button
                  onClick={handleSaveAttendance}
                  disabled={markAttendanceMutation.isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded font-medium transition-colors disabled:opacity-50"
                >
                  {markAttendanceMutation.isLoading ? 'Saving...' : 'Save Attendance'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ManualAttendance;
