import { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { 
  Fingerprint, 
  CheckCircle, 
  XCircle, 
  Clock, 
  History,
  Scan,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';

const FingerprintScan = () => {
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [lateThreshold, setLateThreshold] = useState('09:00');
  const [scanHistory, setScanHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [fingerprintData, setFingerprintData] = useState('');
  const inputRef = useRef(null);

  // Fetch courses for selection
  const { data: courses = [] } = useQuery('courses', async () => {
    const response = await api.get('/courses');
    return response.data;
  });

  // Start fingerprint scanner
  const startScanner = () => {
    setIsScanning(true);
    // In a real implementation, this would initialize the fingerprint scanner hardware
    // For web-based implementation, we'll use manual input or WebUSB API if available
    toast.info('Fingerprint scanner ready. Place finger on scanner or enter fingerprint ID.');
    inputRef.current?.focus();
  };

  // Stop scanner
  const stopScanner = () => {
    setIsScanning(false);
    setFingerprintData('');
  };

  // Fingerprint scan mutation
  const fingerprintScanMutation = useMutation(
    async (data) => {
      return api.post('/attendance/fingerprint-scan', data);
    },
    {
      onSuccess: (response) => {
        const { student, time, status } = response.data;
        toast.success(
          `Attendance recorded for ${student.name} at ${new Date(time).toLocaleTimeString()}`,
          {
            icon: status === 'late' ? '⏰' : '✅',
            duration: 3000
          }
        );
        setFingerprintData('');
        inputRef.current?.focus();
        refetchHistory();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to record attendance');
        setFingerprintData('');
        inputRef.current?.focus();
      }
    }
  );

  // Handle fingerprint scan
  const handleScan = async (e) => {
    e.preventDefault();
    if (!fingerprintData.trim()) {
      toast.error('Please scan fingerprint or enter fingerprint ID');
      return;
    }

    try {
      await fingerprintScanMutation.mutateAsync({
        fingerprintId: fingerprintData.trim(),
        courseId: selectedCourse || null,
        lateThreshold: lateThreshold,
        confidence: 95,
        deviceId: 'fingerprint-scanner'
      });
    } catch (error) {
      // Error handled in mutation
    }
  };

  // Fetch scan history
  const { data: historyData, refetch: refetchHistory } = useQuery(
    ['fingerprintScanHistory'],
    async () => {
      const response = await api.get('/attendance/scan/history');
      return response.data;
    },
    {
      enabled: false
    }
  );

  // Auto-fetch history when shown
  useEffect(() => {
    if (showHistory) {
      refetchHistory();
    }
  }, [showHistory, refetchHistory]);

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'absent': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'late': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
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
          <Fingerprint className="w-8 h-8 text-primary-600" />
          Fingerprint Scan Attendance
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Use fingerprint recognition to automatically record student attendance
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scanner Section */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Fingerprint className="w-6 h-6 text-primary-600" />
                Fingerprint Scanner
              </h2>
              <div className="flex gap-2">
                {!isScanning ? (
                  <button
                    onClick={startScanner}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center gap-2"
                  >
                    <Scan className="w-5 h-5" />
                    Start Scanner
                  </button>
                ) : (
                  <button
                    onClick={stopScanner}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold flex items-center gap-2"
                  >
                    <XCircle className="w-5 h-5" />
                    Stop Scanner
                  </button>
                )}
              </div>
            </div>

            {/* Scanner Display */}
            <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
              {isScanning ? (
                <div className="text-center text-white">
                  <div className="w-32 h-32 mx-auto mb-4 border-4 border-primary-500 rounded-full flex items-center justify-center animate-pulse">
                    <Fingerprint className="w-16 h-16 text-primary-400" />
                  </div>
                  <p className="text-lg font-semibold">Place Finger on Scanner</p>
                  <p className="text-sm text-gray-400 mt-2">Or enter fingerprint ID below</p>
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  <Fingerprint className="w-24 h-24 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Scanner not active</p>
                  <p className="text-sm">Click "Start Scanner" to begin</p>
                </div>
              )}
            </div>

            {/* Fingerprint Input */}
            {isScanning && (
              <form onSubmit={handleScan} className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fingerprint ID / Template
                </label>
                <div className="relative">
                  <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={fingerprintData}
                    onChange={(e) => setFingerprintData(e.target.value)}
                    placeholder="Scan fingerprint or enter fingerprint ID..."
                    className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 pl-12 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={fingerprintScanMutation.isLoading || !fingerprintData.trim()}
                  className="w-full mt-4 px-6 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Scan className="w-6 h-6" />
                  {fingerprintScanMutation.isLoading ? 'Scanning...' : 'Scan Fingerprint'}
                </button>
              </form>
            )}

            {/* Course Selection */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Course (Optional)
              </label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Courses</option>
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Late Threshold Setting */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Late Threshold (Time)
              </label>
              <input
                type="time"
                value={lateThreshold}
                onChange={(e) => setLateThreshold(e.target.value)}
                className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Students arriving after {lateThreshold} will be marked as late
              </p>
            </div>

            {/* Info Alert */}
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-300">
                  <p className="font-semibold mb-1">Note:</p>
                  <p>For hardware fingerprint scanners, connect the device and ensure drivers are installed. The system will automatically detect and use the connected scanner.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* History Section */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <History className="w-6 h-6 text-primary-600" />
              Scan History
            </h2>
            <button
              onClick={() => {
                setShowHistory(!showHistory);
                if (!showHistory) {
                  refetchHistory();
                }
              }}
              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
            >
              {showHistory ? 'Hide' : 'Show'}
            </button>
          </div>

          {showHistory && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {historyData?.records && historyData.records.length > 0 ? (
                historyData.records
                  .filter(record => record.digitalMethod === 'fingerprint')
                  .map((record) => (
                    <div
                      key={record.id}
                      className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900 dark:text-white text-sm">
                          {record.studentName}
                        </span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                          {record.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(record.time)} at {formatTime(record.time)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Course: {record.courseName || 'N/A'}
                      </div>
                    </div>
                  ))
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No fingerprint scan history yet
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FingerprintScan;

