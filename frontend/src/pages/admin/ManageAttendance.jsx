import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import DatePicker from 'react-datepicker';
import InstituteTypeSelect from '../../components/InstituteTypeSelect';
import 'react-datepicker/dist/react-datepicker.css';
import {
  Search,
  Filter,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Fingerprint,
  User,
  Calendar,
} from 'lucide-react';

const ManageAttendance = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [instituteTypeFilter, setInstituteTypeFilter] = useState('');

  const dateStr = selectedDate.toISOString().split('T')[0];

  // Fetch attendance records for selected date
  const { data: attendanceRecords = [], isLoading: loadingAttendance } = useQuery({
    queryKey: ['attendance', dateStr],
    queryFn: async () => {
      const res = await api.get('/attendance', { params: { date: dateStr } });
      return res.data;
    },
  });

  // Fetch students
  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const res = await api.get('/students');
      return res.data;
    },
  });

  // Fetch teachers
  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const res = await api.get('/teachers');
      return res.data;
    },
  });

  // Build combined records: attendance records (students) + teachers as staff
  const combinedRecords = useMemo(() => {
    const records = [];

    // Map attendance by studentId for quick lookup
    const attendanceByStudent = {};
    attendanceRecords.forEach((att) => {
      const sid = att.studentId?._id?.toString() || att.studentId?.toString();
      if (sid) attendanceByStudent[sid] = att;
    });

    // Add students with their attendance
    students.forEach((student) => {
      const att = attendanceByStudent[student._id.toString()];
      const status = att?.status || 'absent';
      const attDate = att?.date;
      const instType = student.academicInfo?.instituteType;
      records.push({
        id: `student-${student._id}`,
        _id: student._id,
        name: student.personalInfo?.fullName || 'N/A',
        role: 'Student',
        classDept: att?.className || student.className || '—',
        instituteType: instType ? String(instType).toLowerCase().trim().replace(/\s+/g, '_') : null,
        timeIn: attDate ? formatTime(attDate) : '—',
        timeOut: attDate ? formatTime(attDate) : '—',
        status,
        avatar: null,
        isStudent: true,
      });
    });

    // Add teachers (staff) - no backend attendance for now, show as present by default for demo
    teachers.forEach((teacher) => {
      const instType = teacher.employment?.instituteType;
      records.push({
        id: `teacher-${teacher._id}`,
        _id: teacher._id,
        name: teacher.personalInfo?.fullName || 'N/A',
        role: 'Teacher',
        classDept: teacher.staffCategoryId?.name || teacher.employment?.instituteType || '—',
        instituteType: instType ? String(instType).toLowerCase().trim().replace(/\s+/g, '_') : null,
        timeIn: '—',
        timeOut: '—',
        status: 'present',
        avatar: null,
        isStudent: false,
      });
    });

    return records;
  }, [attendanceRecords, students, teachers]);

  // Filter by search and class
  const filteredRecords = useMemo(() => {
    let list = combinedRecords;
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.role.toLowerCase().includes(q) ||
          (r.classDept && r.classDept.toLowerCase().includes(q))
      );
    }
    if (classFilter) {
      list = list.filter((r) => r.classDept === classFilter);
    }
    return list;
  }, [combinedRecords, searchQuery, classFilter]);

  // Unique classes/departments for dropdown
  const classOptions = useMemo(() => {
    const set = new Set();
    combinedRecords.forEach((r) => {
      if (r.classDept && r.classDept !== '—') set.add(r.classDept);
    });
    return ['', ...Array.from(set).sort()];
  }, [combinedRecords]);

  // Summary stats
  const summary = useMemo(() => {
    const present = filteredRecords.filter((r) =>
      ['present', 'late', 'excused', 'leave'].includes(r.status)
    ).length;
    const absent = filteredRecords.filter((r) =>
      ['absent', 'sunday', 'holiday'].includes(r.status)
    ).length;
    const late = filteredRecords.filter((r) => r.status === 'late').length;
    return { present, absent, late };
  }, [filteredRecords]);

  function formatTime(date) {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
              <Fingerprint className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Manage Attendance
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                Monitor and manage student and staff attendance records.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and filters - clean white rounded controls */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap items-stretch">
        <div className="relative w-[250px]">
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            size={16}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search students or staff..."
            className="w-full pl-8 pr-2 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white placeholder-gray-400 text-sm"
          />
        </div>
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="w-[250px] px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-gray-700 dark:text-gray-300"
        >
          <option value="">Class or Department</option>
          {classOptions.filter(Boolean).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl min-w-[180px]">
          <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <DatePicker
            selected={selectedDate}
            onChange={(date) => setSelectedDate(date)}
            className="flex-1 min-w-0 bg-transparent focus:outline-none dark:text-white text-gray-700 text-sm"
            dateFormat="MMMM d, yyyy"
          />
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-sm"
          onClick={() => {}}
        >
          <Filter size={18} />
          Filter
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors shadow-sm"
          onClick={() => navigate('/admin/attendance/manual')}
        >
          <Plus size={18} />
          Add Record
        </button>
      </div>

      {/* Main content area */}
      <div>
          {/* Attendance Records - title and summary pills on same row */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Attendance Records
            </h2>
            <div className="flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="font-semibold text-cyan-800 dark:text-cyan-200">
                  Present {summary.present}
                </span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-100/80 dark:bg-orange-900/30 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <span className="font-semibold text-orange-800 dark:text-orange-200">
                  Absent {summary.absent}
                </span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-700/50 rounded-xl">
                <Clock className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Late {summary.late}
                </span>
              </div>
            </div>
          </div>

          {/* Attendance Records Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              {loadingAttendance ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">Loading attendance...</p>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                  No attendance records found for the selected filters.
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Class / Dept.
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Time In
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Time Out
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                    {filteredRecords.map((record) => (
                      <tr
                        key={record.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                              <User
                                className="w-5 h-5 text-blue-600 dark:text-blue-400"
                                size={20}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {record.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          {record.role}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          {record.classDept}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          {record.timeIn}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          {record.timeOut}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={record.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
      </div>
    </div>
  );
};

function StatusBadge({ status }) {
  const config = {
    present: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-700 dark:text-green-300',
      icon: CheckCircle2,
    },
    late: {
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      text: 'text-orange-700 dark:text-orange-300',
      icon: Clock,
    },
    absent: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-700 dark:text-red-300',
      icon: AlertTriangle,
    },
    excused: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-700 dark:text-blue-300',
      icon: CheckCircle2,
    },
    leave: {
      bg: 'bg-gray-100 dark:bg-gray-700/50',
      text: 'text-gray-700 dark:text-gray-300',
      icon: AlertTriangle,
    },
    sunday: {
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      text: 'text-amber-700 dark:text-amber-300',
      icon: AlertTriangle,
    },
    holiday: {
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      text: 'text-amber-700 dark:text-amber-300',
      icon: AlertTriangle,
    },
  };
  const c = config[status] || config.absent;
  const Icon = c.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}
    >
      <Icon className="w-4 h-4" />
      {status?.charAt(0).toUpperCase() + (status?.slice(1) || '')}
    </span>
  );
}

export default ManageAttendance;
