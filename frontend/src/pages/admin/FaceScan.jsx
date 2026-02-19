import { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { 
  Camera, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  History,
  Video,
  Scan,
  ArrowLeft
} from 'lucide-react';

const FaceScan = () => {
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [lateThreshold, setLateThreshold] = useState('09:00');
  const [scanHistory, setScanHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Fetch courses for selection
  const { data: courses = [] } = useQuery('courses', async () => {
    const response = await api.get('/courses');
    return response.data;
  });

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsScanning(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Unable to access camera. Please check permissions.');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  // Capture face and scan
  const captureAndScan = async () => {
    if (!videoRef.current || !canvasRef.current) {
      toast.error('Camera not ready');
      return;
    }

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);

      // Convert canvas to base64
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      
      // In a real implementation, you would send this to a face recognition API
      // For now, we'll simulate by extracting face features or using a face ID
      // This is a placeholder - integrate with your face recognition service
      const faceId = `face_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Simulate face recognition (replace with actual API call)
      toast.loading('Scanning face...', { id: 'face-scan' });
      
      // Call the attendance API
      const response = await faceScanMutation.mutateAsync({
        faceId: faceId,
        faceTemplate: imageData, // In production, this would be processed face template
        courseId: selectedCourse || null,
        lateThreshold: lateThreshold,
        confidence: 95,
        deviceId: 'web-camera'
      });

      toast.success('Face scanned successfully!', { id: 'face-scan' });
      refetchHistory();
    } catch (error) {
      toast.error('Face scan failed. Please try again.', { id: 'face-scan' });
      console.error('Face scan error:', error);
    }
  };

  // Face scan mutation
  const faceScanMutation = useMutation(
    async (data) => {
      return api.post('/attendance/face-scan', data);
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
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to record attendance');
      }
    }
  );

  // Fetch scan history
  const { data: historyData, refetch: refetchHistory } = useQuery(
    ['faceScanHistory'],
    async () => {
      const response = await api.get('/attendance/scan/history');
      return response.data;
    },
    {
      enabled: false
    }
  );

  useEffect(() => {
    if (showHistory) {
      refetchHistory();
    }
  }, [showHistory, refetchHistory]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

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
          <Camera className="w-8 h-8 text-primary-600" />
          Face Scan Attendance
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Use face recognition to automatically record student attendance
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera Section */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Video className="w-6 h-6 text-primary-600" />
                Camera View
              </h2>
              <div className="flex gap-2">
                {!isScanning ? (
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center gap-2"
                  >
                    <Camera className="w-5 h-5" />
                    Start Camera
                  </button>
                ) : (
                  <button
                    onClick={stopCamera}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold flex items-center gap-2"
                  >
                    <XCircle className="w-5 h-5" />
                    Stop Camera
                  </button>
                )}
              </div>
            </div>

            {/* Video Preview */}
            <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ display: isScanning ? 'block' : 'none' }}
              />
              {!isScanning && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Camera not active</p>
                    <p className="text-sm">Click "Start Camera" to begin</p>
                  </div>
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Scan Button */}
            {isScanning && (
              <button
                onClick={captureAndScan}
                disabled={faceScanMutation.isLoading}
                className="w-full mt-4 px-6 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Scan className="w-6 h-6" />
                {faceScanMutation.isLoading ? 'Scanning...' : 'Scan Face'}
              </button>
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
              onClick={() => setShowHistory(!showHistory)}
              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
            >
              {showHistory ? 'Hide' : 'Show'}
            </button>
          </div>

          {showHistory && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {historyData?.records && historyData.records.length > 0 ? (
                historyData.records
                  .filter(record => record.digitalMethod === 'face_scan')
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
                  No face scan history yet
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FaceScan;

