import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import InstituteTypeSelect from '../../components/InstituteTypeSelect';
import {
  ChevronDown,
  ChevronUp,
  Check,
  MoreVertical,
  User,
  Camera,
  Scan,
  Fingerprint,
  ClipboardList
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const TYPE_OPTIONS = [
  { value: '', label: 'All Types', icon: ClipboardList },
  { value: 'face_scan', label: 'Face Scan', icon: Camera },
  { value: 'card_scan', label: 'Card Scanner', icon: Scan },
  { value: 'fingerprint', label: 'Fingerprint Scan', icon: Fingerprint },
  { value: 'manual', label: 'Manual', icon: ClipboardList },
];

const ManageAttendance = () => {
  const [filterType, setFilterType] = useState('face_scan');
  const [selectedInstituteType, setSelectedInstituteType] = useState('');
  const [selectedClassName, setSelectedClassName] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showTable, setShowTable] = useState(true);
  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [rowMenuOpen, setRowMenuOpen] = useState(null);

  const dateStr = selectedDate.toISOString().split('T')[0];

  // Map filter type to API params
  const getApiParams = () => {
    const params = { date: dateStr };
    if (selectedClassName) params.className = selectedClassName;
    if (selectedSection) params.section = selectedSection;
    if (filterType === 'manual') params.attendanceType = 'manual';
    else if (['face_scan', 'card_scan', 'fingerprint'].includes(filterType)) {
      params.attendanceType = 'digital';
      params.digitalMethod = filterType;
    }
    return params;
  };

  // Fetch attendance records
  const { data: attendanceRecords = [], isLoading } = useQuery({
    queryKey: ['attendance', dateStr, selectedClassName, selectedSection, filterType],
    queryFn: async () => {
      const params = getApiParams();
      const res = await api.get('/attendance', { params });
      return res.data || [];
    },
    enabled: showTable,
  });

  // Fetch courses/students for class and section dropdowns
  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const res = await api.get('/courses');
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  const { data: allStudents = [] } = useQuery({
    queryKey: ['allStudents'],
    queryFn: async () => {
      const res = await api.get('/students');
      return res.data || [];
    },
  });

  const uniqueClasses = useMemo(() => {
    const normalized = selectedInstituteType
      ? selectedInstituteType.toLowerCase().trim().replace(/\s+/g, '_')
      : null;
    let fromCourses = [];
    if (normalized) {
      fromCourses = courses
        .filter((c) => {
          const ct = c.instituteType ? String(c.instituteType).toLowerCase().trim().replace(/\s+/g, '_') : null;
          return ct === normalized;
        })
        .map((c) => c.name)
        .filter(Boolean);
    } else {
      fromCourses = courses.map((c) => c.name).filter(Boolean);
    }
    let filtered = allStudents;
    if (normalized) {
      filtered = allStudents.filter((s) => {
        const st = s.academicInfo?.instituteType;
        if (!st) return false;
        return String(st).toLowerCase().trim().replace(/\s+/g, '_') === normalized;
      });
    }
    const fromStudents = [...new Set(filtered.map((s) => s.className).filter(Boolean))];
    return [...new Set([...fromCourses, ...fromStudents])].sort();
  }, [courses, allStudents, selectedInstituteType]);

  const uniqueSections = useMemo(() => {
    if (!selectedClassName) return [];
    const normalized = selectedInstituteType
      ? selectedInstituteType.toLowerCase().trim().replace(/\s+/g, '_')
      : null;
    let filtered = allStudents.filter((s) => s.className === selectedClassName);
    if (normalized) {
      filtered = filtered.filter((s) => {
        const st = s.academicInfo?.instituteType;
        if (!st) return false;
        return String(st).toLowerCase().trim().replace(/\s+/g, '_') === normalized;
      });
    }
    return [...new Set(filtered.map((s) => s.section).filter(Boolean))].sort();
  }, [allStudents, selectedClassName, selectedInstituteType]);

  const formatTime = (date) => {
    if (!date) return '—';
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatClassDisplay = (record) => {
    const cls = record.className || record.studentId?.className;
    const sec = record.section || record.studentId?.section;
    if (cls && sec) return `${cls} - ${sec}`;
    return cls || sec || '—';
  };

  const sortedRecords = useMemo(() => {
    if (!sortBy) return attendanceRecords;
    const arr = [...attendanceRecords];
    arr.sort((a, b) => {
      let va = '';
      let vb = '';
      if (sortBy === 'timeIn') {
        va = new Date(a.date || 0).getTime();
        vb = new Date(b.date || 0).getTime();
      }
      if (sortBy === 'timeOut') return 0;
      if (typeof va === 'string') {
        va = (va || '').toString().toLowerCase();
        vb = (vb || '').toString().toLowerCase();
        return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
      }
      return sortDir === 'asc' ? va - vb : vb - va;
    });
    return arr;
  }, [attendanceRecords, sortBy, sortDir]);

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(col);
      setSortDir('asc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header + Filters - dark blue section (like reference image) */}
      <div className="relative bg-[#1e3a5f] rounded-xl overflow-hidden">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_50%_50%,_white_1px,_transparent_1px)] bg-[length:20px_20px]" />
        <div className="relative px-6 pt-5 pb-6">
          {/* Top row: title + illustration */}
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-2xl font-bold text-white">Manage Student Attendance</h1>
            <div className="hidden sm:block">
              <svg width="180" height="80" viewBox="0 0 200 100" fill="none" className="opacity-90">
                <rect x="40" y="30" width="70" height="50" rx="6" fill="#2563eb" stroke="white" strokeWidth="2" />
                <text x="75" y="62" fill="white" fontSize="14" fontFamily="monospace" fontWeight="bold">08:05</text>
                <circle cx="130" cy="55" r="12" fill="#22c55e" opacity="0.9" />
                <circle cx="130" cy="55" r="6" fill="white" opacity="0.6" />
                <circle cx="165" cy="55" r="18" fill="#94a3b8" />
                <circle cx="165" cy="50" r="6" fill="#64748b" />
                <path d="M155 70 Q165 80 175 70" stroke="#64748b" strokeWidth="2" fill="none" />
              </svg>
            </div>
          </div>
          {/* Filter Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4 items-end">
            <div>
              <label className="block text-xs font-medium text-white/80 mb-1.5">Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full border-0 rounded-lg px-3 py-2.5 bg-white/95 text-gray-900 focus:ring-2 focus:ring-green-400"
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value || 'all'} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-white/80 mb-1.5">Institute Type</label>
              <InstituteTypeSelect
                value={selectedInstituteType}
                onChange={setSelectedInstituteType}
                placeholder="All Institutes"
                className="w-full border-0 rounded-lg px-3 py-2.5 bg-white/95 text-gray-900 focus:ring-2 focus:ring-green-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/80 mb-1.5">Class</label>
              <select
                value={selectedClassName}
                onChange={(e) => setSelectedClassName(e.target.value)}
                className="w-full border-0 rounded-lg px-3 py-2.5 bg-white/95 text-gray-900 focus:ring-2 focus:ring-green-400"
              >
                <option value="">Select Class</option>
                {uniqueClasses.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-white/80 mb-1.5">Section (Optional)</label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full border-0 rounded-lg px-3 py-2.5 bg-white/95 text-gray-900 focus:ring-2 focus:ring-green-400"
              >
                <option value="">Select Section</option>
                {uniqueSections.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-white/80 mb-1.5">Date</label>
              <div className="[&_.react-datepicker-wrapper]:block [&_.react-datepicker__input-container]:block">
                <DatePicker
                  selected={selectedDate}
                  onChange={(d) => setSelectedDate(d)}
                  dateFormat="MM/dd/yyyy"
                  className="w-full border-0 rounded-lg px-3 py-2.5 bg-white/95 text-gray-900 focus:ring-2 focus:ring-green-400"
                />
              </div>
            </div>
            <div>
              <button
                onClick={() => setShowTable(true)}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors shadow-md"
              >
                <Check className="w-5 h-5" />
                Manage Attendance
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      {showTable && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Student Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Class
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => toggleSort('timeIn')}
                  >
                    <span className="flex items-center gap-1">
                      Time In
                      {sortBy === 'timeIn' ? (sortDir === 'asc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />) : <ChevronDown className="w-4 h-4 opacity-50" />}
                    </span>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => toggleSort('timeOut')}
                  >
                    <span className="flex items-center gap-1">
                      Time Out
                      {sortBy === 'timeOut' ? (sortDir === 'asc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />) : <ChevronDown className="w-4 h-4 opacity-50" />}
                    </span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
                      </div>
                      <p className="mt-2">Loading attendance...</p>
                    </td>
                  </tr>
                ) : sortedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                      No attendance records found for the selected filters.
                      <p className="mt-2 text-sm">
                        <Link to="/admin/attendance/manual" className="text-blue-600 hover:underline">Mark attendance manually</Link>
                        {' or try different filters.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  sortedRecords.map((record) => {
                    const student = record.studentId;
                    const name = student?.personalInfo?.fullName || 'N/A';
                    const classDisplay = formatClassDisplay(record);
                    const isPresent = ['present', 'late', 'excused', 'leave'].includes(record.status || '');
                    const statusLabel = record.status === 'late' ? 'Late' : record.status === 'present' ? 'Present' : record.status || '—';
                    return (
                      <tr
                        key={record._id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center flex-shrink-0 overflow-hidden ring-2 ring-white dark:ring-gray-700 shadow-sm">
                              {student?.personalInfo?.photo ? (
                                <img src={student.personalInfo.photo} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white">{name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{classDisplay}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">{classDisplay}</td>
                        <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300 font-medium">{formatTime(record.date)}</td>
                        <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">—</td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium ${
                              isPresent
                                ? 'bg-green-600 text-white'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400'
                            }`}
                          >
                            {isPresent && <Check className="w-4 h-4" strokeWidth={2.5} />}
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="relative">
                            <button
                              onClick={() => setRowMenuOpen(rowMenuOpen === record._id ? null : record._id)}
                              className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 transition-colors"
                            >
                              <MoreVertical className="w-5 h-5" />
                            </button>
                            {rowMenuOpen === record._id && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setRowMenuOpen(null)}
                                />
                                <div className="absolute right-0 top-full mt-1 py-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                                  <Link
                                    to={`/admin/students/${student?._id}/details`}
                                    className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    onClick={() => setRowMenuOpen(null)}
                                  >
                                    View Details
                                  </Link>
                                  <Link
                                    to={`/admin/students/${student?._id}/fee-history`}
                                    className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    onClick={() => setRowMenuOpen(null)}
                                  >
                                    Fee History
                                  </Link>
                                </div>
                              </>
                            )}
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
      )}

      {/* Quick links to other attendance methods - shown when no records */}
      {showTable && sortedRecords.length === 0 && !isLoading && (
        <div className="flex flex-wrap gap-2 justify-center py-4 text-sm">
          <span className="text-gray-500 dark:text-gray-400">Or try:</span>
          <Link to="/admin/attendance/manual" className="text-blue-600 hover:underline">Manual</Link>
          <span className="text-gray-400">|</span>
          <Link to="/admin/attendance/face-scan" className="text-blue-600 hover:underline">Face Scan</Link>
          <span className="text-gray-400">|</span>
          <Link to="/admin/card-scanner" className="text-blue-600 hover:underline">Card Scanner</Link>
          <span className="text-gray-400">|</span>
          <Link to="/admin/attendance/fingerprint-scan" className="text-blue-600 hover:underline">Fingerprint</Link>
          <span className="text-gray-400">|</span>
          <Link to="/admin/attendance/staff" className="text-blue-600 hover:underline">Staff</Link>
          <span className="text-gray-400">|</span>
          <Link to="/admin/attendance/reports" className="text-blue-600 hover:underline">Reports</Link>
        </div>
      )}
    </div>
  );
};

export default ManageAttendance;
