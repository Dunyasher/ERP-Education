import { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { 
  Scan, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Calendar,
  History,
  QrCode,
  ArrowLeft
} from 'lucide-react';

const CardScanner = () => {
  const navigate = useNavigate();
  const [cardId, setCardId] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [lateThreshold, setLateThreshold] = useState(9); // 9 AM default
  const [scanHistory, setScanHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const inputRef = useRef(null);

  // Fetch courses for selection
  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const response = await api.get('/courses');
      return response.data;
    }
  });

  // Scan attendance mutation
  const scanMutation = useMutation({
    mutationFn: async (data) => {
      return api.post('/attendance/scan', data);
    },
    onSuccess: (response) => {
      const { student, time, status, isLate, isUpdate } = response.data;
      toast.success(
        isUpdate 
          ? `Attendance updated for ${student.name}`
          : `Attendance recorded for ${student.name} at ${time}`,
        {
          icon: isLate ? '⏰' : '✅',
          duration: 3000
        }
      );
      setCardId(''); // Clear input
      inputRef.current?.focus(); // Refocus for next scan
      // Refresh history
      refetchHistory();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to record attendance');
      setCardId(''); // Clear input
      inputRef.current?.focus(); // Refocus for next scan
    }
  });

  // Fetch scan history
  const { data: historyData, refetch: refetchHistory } = useQuery({
    queryKey: ['scanHistory'],
    queryFn: async () => {
      const response = await api.get('/attendance/scan/history?limit=50');
      return response.data;
    },
    enabled: showHistory
  });

  useEffect(() => {
    // Auto-focus input on mount
    inputRef.current?.focus();
  }, []);

  const handleScan = (e) => {
    e.preventDefault();
    if (!cardId.trim()) {
      toast.error('Please enter or scan a card ID');
      return;
    }
    
    // Try to parse QR code data if it's JSON
    let cardIdToUse = cardId.trim();
    try {
      const qrData = JSON.parse(cardId.trim());
      if (qrData.cardId) {
        cardIdToUse = qrData.cardId;
      } else if (qrData.studentId) {
        // If QR contains studentId, we need to get the card ID
        cardIdToUse = qrData.admissionNo || qrData.srNo || qrData.rollNo || qrData.studentId;
      }
    } catch (e) {
      // Not JSON, use as is
    }
    
    scanMutation.mutate({
      cardId: cardIdToUse,
      courseId: selectedCourse || null,
      lateThreshold: lateThreshold
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'late': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'absent': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'excused': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => navigate('/admin/attendance/manual')}
          className="mb-4 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Back to Manage Attendance</span>
        </button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <QrCode className="w-8 h-8 text-primary-600" />
          Card Scanner - Automatic Attendance
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Scan student cards to automatically record attendance with name, time, and status
        </p>
      </div>

      {/* Scanner Card */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Scan className="w-6 h-6 text-primary-600" />
            Scan Student Card
          </h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
            >
              <History className="w-5 h-5" />
              {showHistory ? 'Hide' : 'Show'} History
            </button>
          </div>
        </div>

        <form onSubmit={handleScan} className="space-y-4">
          {/* Card ID Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Card ID / Admission No / Serial No / Roll No *
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={cardId}
                onChange={(e) => setCardId(e.target.value)}
                placeholder="Scan or enter card ID..."
                className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 pr-12 text-lg font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                autoFocus
                autoComplete="off"
              />
              <QrCode className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Use barcode/QR scanner or manually enter student ID
            </p>
          </div>

          {/* Course Selection (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Course (Optional)
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Courses / General Attendance</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>

          {/* Late Threshold Setting */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Late Threshold (Hour)
              </label>
              <input
                type="number"
                min="0"
                max="23"
                value={lateThreshold}
                onChange={(e) => setLateThreshold(parseInt(e.target.value) || 9)}
                className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Students arriving after {lateThreshold}:00 AM will be marked as late
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={scanMutation.isLoading || !cardId.trim()}
            className="w-full px-6 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {scanMutation.isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Processing...
              </>
            ) : (
              <>
                <Scan className="w-6 h-6" />
                Record Attendance
              </>
            )}
          </button>
        </form>
      </div>

      {/* Scan History */}
      {showHistory && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <History className="w-6 h-6 text-primary-600" />
            Today's Scan History ({historyData?.count || 0} records)
          </h2>
          
          {historyData?.records && historyData.records.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Student Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Card ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {historyData.records.map((record) => (
                    <tr key={record._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {record.studentId?.personalInfo?.fullName || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                          {record.studentId?.admissionNo || record.studentId?.srNo || record.studentId?.rollNo || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {record.courseId?.name || 'General'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatTime(record.date)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                          {record.status === 'late' && '⏰ '}
                          {record.status === 'present' && '✅ '}
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No scan records for today</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CardScanner;

