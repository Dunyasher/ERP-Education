import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import InstituteTypeSelect from '../../components/InstituteTypeSelect';
import { 
  Search,
  ChevronRight,
  Circle,
  User,
  FileText
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const ManualAttendance = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendanceType, setAttendanceType] = useState('manual');
  const [selectedInstituteType, setSelectedInstituteType] = useState('');
  const [selectedClassName, setSelectedClassName] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState({});
  const [showTable, setShowTable] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

  // Auto-fetch students when class is selected (section is optional)
  const shouldAutoFetch = Boolean(
    (attendanceType === 'manual' || attendanceType === 'digital') && 
    selectedClassName
  );

  // Fetch students based on filters - using React Query v5 syntax
  const { data: students = [], isLoading: isLoadingStudents, refetch } = useQuery({
    queryKey: ['students', selectedInstituteType, selectedClassName, selectedSection],
    queryFn: async () => {
      const params = {};
      if (selectedInstituteType) params.instituteType = selectedInstituteType;
      if (selectedClassName) params.className = selectedClassName;
      if (selectedSection) params.section = selectedSection;
      const response = await api.get('/students', { params });
      console.log('📋 Fetched students:', {
        params,
        count: response.data?.length || 0,
        students: response.data?.slice(0, 3) // Log first 3 for debugging
      });
      return response.data;
    },
    enabled: shouldAutoFetch // Auto-fetch when class is selected (section is optional)
  });

  // Filter students by class and section - memoized to prevent infinite loops
  const filteredStudents = useMemo(() => {
    // Since we're already filtering on the backend, we can use students directly
    // But add additional client-side filtering as a safety measure
    const filtered = students.filter(student => {
      let matches = true;
      
      // Filter by class name (exact match)
      if (selectedClassName && student.className !== selectedClassName) {
        matches = false;
      }
      
      // Filter by section (exact match, but section is optional)
      if (selectedSection && student.section !== selectedSection) {
        matches = false;
      }
      
      return matches;
    });
    
    // Debug logging
    if (selectedClassName) {
      console.log('🔍 Filtering students:', {
        totalStudents: students.length,
        selectedClassName,
        selectedSection: selectedSection || 'All',
        filteredCount: filtered.length,
        sampleStudents: students.slice(0, 3).map(s => ({
          name: s.personalInfo?.fullName,
          className: s.className,
          section: s.section,
          instituteType: s.academicInfo?.instituteType
        }))
      });
    }
    
    return filtered;
  }, [students, selectedClassName, selectedSection]);

  // Search-filtered students for table
  const searchedStudents = useMemo(() => {
    if (!studentSearch.trim()) return filteredStudents;
    const q = studentSearch.toLowerCase().trim();
    return filteredStudents.filter(s =>
      (s.personalInfo?.fullName || '').toLowerCase().includes(q) ||
      (s.admissionNo || '').toLowerCase().includes(q) ||
      (s.rollNo || '').toLowerCase().includes(q)
    );
  }, [filteredStudents, studentSearch]);

  // Attendance stats for circular chart
  const attendanceStats = useMemo(() => {
    const total = filteredStudents.length;
    const present = filteredStudents.filter(s => {
      const st = attendanceStatus[s._id] || 'present';
      return ['present', 'late', 'excused', 'leave'].includes(st);
    }).length;
    const absent = total - present;
    const percent = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, percent };
  }, [filteredStudents, attendanceStatus]);

  // Recent absences (students marked absent)
  const recentAbsences = useMemo(() =>
    filteredStudents.filter(s => {
      const st = attendanceStatus[s._id] || 'present';
      return ['absent', 'sunday', 'holiday'].includes(st);
    }).map(s => ({ name: s.personalInfo?.fullName, studentId: s._id })),
    [filteredStudents, attendanceStatus]
  );

  // Get unique classes and sections from all students
  const { data: allStudents = [] } = useQuery({
    queryKey: ['allStudents'],
    queryFn: async () => {
      const response = await api.get('/students');
      return response.data;
    }
  });

  // Fetch courses/classes from API - this is the primary source for classes
  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      try {
        const response = await api.get('/courses');
        return Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        console.error('Error fetching courses:', error);
        return [];
      }
    }
  });

  // Filter classes based on selected institute type
  const uniqueClasses = useMemo(() => {
    // Normalize the selected institute type for comparison
    const normalizedSelected = selectedInstituteType 
      ? selectedInstituteType.toLowerCase().trim().replace(/\s+/g, '_')
      : null;

    let classesFromCourses = [];
    let classesFromStudents = [];

    // First, try to get classes from courses API (more reliable)
    if (normalizedSelected) {
      classesFromCourses = courses
        .filter(course => {
          const courseInstituteType = course.instituteType 
            ? String(course.instituteType).toLowerCase().trim().replace(/\s+/g, '_')
            : null;
          return courseInstituteType === normalizedSelected;
        })
        .map(course => course.name)
        .filter(Boolean);
    } else {
      classesFromCourses = courses.map(course => course.name).filter(Boolean);
    }

    // Also get classes from students (as fallback and for students without courses)
    let filteredStudents = allStudents;
    
    if (normalizedSelected) {
      filteredStudents = allStudents.filter(s => {
        const studentInstituteType = s.academicInfo?.instituteType;
        if (!studentInstituteType) return false;
        
        const normalizedStudent = String(studentInstituteType).toLowerCase().trim().replace(/\s+/g, '_');
        return normalizedSelected === normalizedStudent;
      });
    }
    
    classesFromStudents = [...new Set(filteredStudents.map(s => s.className).filter(Boolean))];

    // Combine both sources and remove duplicates
    const allClasses = [...new Set([...classesFromCourses, ...classesFromStudents])].sort((a, b) => {
      // For school classes, sort numerically (1st, 2nd, 3rd, 6th, 7th, 8th, 9th, etc.)
      if (normalizedSelected === 'school') {
        const getClassNumber = (name) => {
          // Try to extract number from various formats: "1st", "2nd", "3rd", "6th", "Class 7", "7th class", etc.
          const match = name.match(/(\d+)(?:th|st|nd|rd)?/i) || 
                       name.match(/class\s*(\d+)/i) ||
                       name.match(/(\d+)\s*class/i);
          return match ? parseInt(match[1]) : Infinity;
        };
        const classA = getClassNumber(a);
        const classB = getClassNumber(b);
        if (classA !== Infinity && classB !== Infinity) {
          return classA - classB;
        }
        if (classA !== Infinity) return -1;
        if (classB !== Infinity) return 1;
      }
      // For college: sort by year order (First Year, Second Year, etc.)
      if (normalizedSelected === 'college') {
        const yearOrder = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth'];
        const getYearIndex = (name) => {
          const nameLower = name.toLowerCase();
          return yearOrder.findIndex(year => nameLower.includes(year));
        };
        const yearA = getYearIndex(a);
        const yearB = getYearIndex(b);
        if (yearA !== -1 && yearB !== -1) return yearA - yearB;
        if (yearA !== -1) return -1;
        if (yearB !== -1) return 1;
      }
      // For academy: sort by book number (Book 1, Book 2, etc.)
      if (normalizedSelected === 'academy') {
        const getBookNumber = (name) => {
          const match = name.match(/book\s*(\d+)/i) || name.match(/(\d+)\s*book/i);
          return match ? parseInt(match[1]) : Infinity;
        };
        const bookA = getBookNumber(a);
        const bookB = getBookNumber(b);
        if (bookA !== Infinity && bookB !== Infinity) {
          return bookA - bookB;
        }
        if (bookA !== Infinity) return -1;
        if (bookB !== Infinity) return 1;
      }
      // For other types, sort alphabetically
      return a.localeCompare(b);
    });

    // Debug logging
    if (selectedInstituteType) {
      console.log('🔍 Filtering classes by institute type:', {
        selectedInstituteType,
        normalizedSelected,
        coursesFound: classesFromCourses.length,
        studentsFound: classesFromStudents.length,
        totalClasses: allClasses.length,
        classes: allClasses.slice(0, 10)
      });
    }

    return allClasses;
  }, [allStudents, courses, selectedInstituteType]);
  
  // Filter sections based on selected class and institute type
  const uniqueSections = useMemo(() => {
    // Must have both institute type and class selected to show sections
    if (!selectedInstituteType || !selectedClassName) {
      return [];
    }

    const normalizedSelected = selectedInstituteType.toLowerCase().trim().replace(/\s+/g, '_');
    
    let filtered = allStudents.filter(s => {
      // Filter by institute type
      const studentInstituteType = s.academicInfo?.instituteType;
      if (!studentInstituteType) return false;
      
      const normalizedStudent = String(studentInstituteType).toLowerCase().trim().replace(/\s+/g, '_');
      if (normalizedSelected !== normalizedStudent) return false;
      
      // Filter by class
      if (s.className !== selectedClassName) return false;
      
      return true;
    });
    
    const sections = [...new Set(filtered.map(s => s.section).filter(Boolean))].sort();
    
    // Debug logging
    if (selectedInstituteType && selectedClassName) {
      console.log('🔍 Filtering sections:', {
        selectedInstituteType,
        selectedClassName,
        filteredStudents: filtered.length,
        sectionsFound: sections.length,
        sections: sections
      });
    }
    
    return sections;
  }, [allStudents, selectedClassName, selectedInstituteType]);

  // Initialize attendance status for all students
  useEffect(() => {
    if (filteredStudents.length === 0) return;
    
    setAttendanceStatus(prev => {
      const newStatus = { ...prev };
      let hasChanges = false;
      
      filteredStudents.forEach(student => {
        if (!newStatus[student._id]) {
          newStatus[student._id] = 'present'; // Default to present
          hasChanges = true;
        }
      });
      
      // Only return new object if there are changes
      return hasChanges ? newStatus : prev;
    });
  }, [filteredStudents]); // filteredStudents is now memoized, so this is safe

  // Automatically show table when students are loaded (for manual/digital attendance)
  useEffect(() => {
    if (shouldAutoFetch) {
      // Show table when class is selected, even if no students found yet (loading state)
      if (!showTable) {
        setShowTable(true);
      }
    } else if (!shouldAutoFetch && showTable) {
      // Hide table if class is cleared
      setShowTable(false);
    }
  }, [shouldAutoFetch, showTable]);

  // Mark attendance mutation
  const markAttendanceMutation = useMutation({
    mutationFn: async (data) => {
      return api.post('/attendance/manual', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Attendance marked successfully!');
      setAttendanceStatus({});
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to mark attendance');
    }
  });

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
    // Reset table for non-auto types
    if (type !== 'manual' && type !== 'digital') {
      setShowTable(false);
      setSelectedClassName('');
      setSelectedSection('');
    }
  };

  const handleInstituteTypeChange = (value) => {
    setSelectedInstituteType(value);
    // Clear class and section when institute type changes
    setSelectedClassName('');
    setSelectedSection('');
    setShowTable(false);
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
    // For 'digital' and 'manual', if class is selected, table should already be showing
    // Section is optional - attendance can be managed for all students in a class
    if (selectedClassName) {
      refetch();
      setShowTable(true);
    } else {
      toast.error('Please select at least a Class');
    }
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
          <li><Link to="/admin/attendance" className="hover:text-blue-600">Manage Attendance</Link></li>
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
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
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
              Institute Type
            </label>
            <InstituteTypeSelect
              value={selectedInstituteType}
              onChange={handleInstituteTypeChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="All Institute Types"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Class
            </label>
            <select
              value={selectedClassName}
              onChange={(e) => {
                setSelectedClassName(e.target.value);
                // Clear section when class changes
                setSelectedSection('');
                setShowTable(false);
              }}
              disabled={!selectedInstituteType}
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {!selectedInstituteType 
                  ? 'Select Institute Type First' 
                  : uniqueClasses.length === 0
                  ? `No classes found for ${selectedInstituteType}`
                  : 'Select Class'}
              </option>
              {uniqueClasses.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
            {selectedInstituteType && uniqueClasses.length === 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                No classes available. Create classes for this institute type in the Classes page.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Section (Optional)
            </label>
            <select
              value={selectedSection}
              onChange={(e) => {
                setSelectedSection(e.target.value);
                // Table will auto-show when class is selected (section is optional)
              }}
              disabled={!selectedInstituteType || !selectedClassName}
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {!selectedInstituteType 
                  ? 'Select Institute Type First'
                  : !selectedClassName
                  ? 'Select Class First'
                  : uniqueSections.length === 0
                  ? 'No sections (Optional - leave empty for all students)'
                  : 'All Sections (Optional)'}
              </option>
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

      {/* 3-Panel Attendance Design - when class selected */}
      {showTable && (
        <div className="space-y-4">
          {isLoadingStudents ? (
            <div className="card text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading students...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-600 dark:text-gray-400 mb-2 font-medium">No students found for the selected filters.</p>
              <p className="text-sm text-gray-500">Class: {selectedClassName} {selectedSection && `| Section: ${selectedSection}`}</p>
            </div>
          ) : (
            <>
              {/* Today's status bar */}
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Today&apos;s status: {formatDate(selectedDate)}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button onClick={() => handleMarkAll('present')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium text-sm">
                  ✓ Mark All Present
                </button>
                <button onClick={() => handleMarkAll('absent')} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-medium text-sm">
                  ✗ Mark All Absent
                </button>
                <button onClick={() => handleMarkAll('holiday')} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium text-sm">
                  Mark All Holiday
                </button>
                <button onClick={() => handleMarkAll('sunday')} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded font-medium text-sm">
                  Mark All Sunday
                </button>
              </div>

              {/* 3-panel grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Attendance Summary with circular chart */}
                <div className="lg:col-span-3 space-y-4">
                  <div className="card p-6 flex flex-col items-center">
                    <div className="relative w-40 h-40">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="rgb(229 231 235)" strokeWidth="8" className="dark:stroke-gray-600" />
                        <circle cx="50" cy="50" r="45" fill="none" stroke="rgb(34 197 94)" strokeWidth="8" strokeDasharray={`${attendanceStats.percent * 2.83} 283`} strokeLinecap="round" />
                        <circle cx="50" cy="50" r="45" fill="none" stroke="rgb(59 130 246)" strokeWidth="8" strokeDasharray={`${(100 - attendanceStats.percent) * 2.83} 283`} strokeDashoffset={`-${attendanceStats.percent * 2.83}`} strokeLinecap="round" opacity="0.6" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <User className="w-10 h-10 text-gray-400 dark:text-gray-500 mb-1" />
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">{attendanceStats.percent}%</span>
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">Present</span>
                      </div>
                    </div>
                    <div className="mt-4 w-full space-y-2">
                      <div className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-700 rounded">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Total Students</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{attendanceStats.total}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Absent Today</span>
                        <span className="font-semibold text-red-600 dark:text-red-400">{attendanceStats.absent}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Middle: Student table with search */}
                <div className="lg:col-span-6 card">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        placeholder="Search students..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                      />
                    </div>
                    <button className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                      <FileText className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Student Name</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Time In</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Time Out</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {searchedStudents.map((student) => {
                          const st = attendanceStatus[student._id] || 'present';
                          const isPresent = ['present', 'late', 'excused', 'leave'].includes(st);
                          return (
                            <tr key={student._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                {student.personalInfo?.fullName || 'N/A'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">—</td>
                              <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">—</td>
                              <td className="px-4 py-3">
                                <select
                                  value={st}
                                  onChange={(e) => handleStatusChange(student._id, e.target.value)}
                                  className={`border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 ${isPresent ? 'text-green-600 dark:text-green-400 border-green-200 dark:border-green-800' : 'text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'}`}
                                >
                                  <option value="present">Present</option>
                                  <option value="absent">Absent</option>
                                  <option value="late">Late</option>
                                  <option value="excused">Excused</option>
                                  <option value="leave">Leave</option>
                                  <option value="holiday">Holiday</option>
                                  <option value="sunday">Sunday</option>
                                </select>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right: Calendar + Recent Absences */}
                <div className="lg:col-span-3 space-y-4">
                  <div className="card p-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Calendar</h3>
                    <DatePicker
                      selected={selectedDate}
                      onChange={(date) => setSelectedDate(date)}
                      inline
                      className="w-full border-0"
                    />
                  </div>
                  <div className="card p-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Recent Absences</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {recentAbsences.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No absences for today</p>
                      ) : (
                        recentAbsences.map((a) => (
                          <div key={a.studentId} className="text-sm text-gray-700 dark:text-gray-300 flex justify-between">
                            <span>{a.name || 'N/A'}</span>
                            <span className="text-gray-500 dark:text-gray-400 text-xs">{formatDateShort(selectedDate)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Save button */}
              <div className="flex justify-end">
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
