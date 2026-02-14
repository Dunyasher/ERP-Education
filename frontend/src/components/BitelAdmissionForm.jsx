import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { X, Save, Printer, GraduationCap, User, Phone, Calendar, DollarSign, BookOpen, Edit, MapPin, Upload, Image as ImageIcon, Clock } from 'lucide-react';

const BitelAdmissionForm = ({ onClose, onSuccess, editingStudent = null }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth(); // Get current logged-in user
  const fileInputRef = useRef(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [studentPhoto, setStudentPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [collegeName, setCollegeName] = useState('College & Academy');
  const [formData, setFormData] = useState({
    serialNo: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5), // Current time HH:mm
    name: '',
    fatherName: '',
    address: '',
    timing: '',
    teacher: '',
    contact: '',
    selectedCourse: '',
    admissionFee: '',
    scholarship: '',
    remainingFee: '',
    booksMaterials: '',
    totalFee: '',
    totalPaidFee: '',
    email: '',
    password: ''
  });

  // Fetch all courses from API for course selection
  const { data: courses = [], isLoading: coursesLoading } = useQuery('courses', async () => {
    const response = await api.get('/courses');
    return response.data;
  });

  // Fetch teachers for teacher selection
  const { data: teachers = [] } = useQuery('teachers', async () => {
    const response = await api.get('/teachers');
    return response.data;
  });

  // Fetch categories to get course options
  const { data: categories = [] } = useQuery('categories', async () => {
    const response = await api.get('/categories');
    return response.data;
  });

  // Fetch next serial number
  const { data: serialData } = useQuery('nextSerial', async () => {
    try {
      const response = await api.get('/students/next-serial');
      return response.data;
    } catch (error) {
      console.error('Error fetching next serial:', error);
      // Fallback
      return { nextSerial: 'A1', nextNumber: 1 };
    }
  });

  // Set auto-generated serial number when data is loaded
  useEffect(() => {
    if (serialData?.nextSerial) {
      const numberPart = serialData.nextSerial.replace('A', '');
      setFormData(prev => ({
        ...prev,
        serialNo: prev.serialNo || numberPart // Only set if not already set
      }));
    }
  }, [serialData]);

  // Load student data if editing
  useEffect(() => {
    if (editingStudent) {
      setIsEditMode(true);
      setFormData({
        serialNo: editingStudent.srNo?.replace('STU-', '') || '',
        date: editingStudent.academicInfo?.admissionDate ? new Date(editingStudent.academicInfo.admissionDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        time: editingStudent.academicInfo?.admissionDate ? new Date(editingStudent.academicInfo.admissionDate).toTimeString().slice(0, 5) : new Date().toTimeString().slice(0, 5),
        name: editingStudent.personalInfo?.fullName || '',
        fatherName: editingStudent.parentInfo?.fatherName || '',
        address: editingStudent.contactInfo?.address ? 
          `${editingStudent.contactInfo.address.street || ''}, ${editingStudent.contactInfo.address.city || ''}, ${editingStudent.contactInfo.address.state || ''}`.trim() : '',
        timing: '',
        teacher: '',
        contact: editingStudent.contactInfo?.phone || '',
        selectedCourse: editingStudent.academicInfo?.courseId?.name || editingStudent.academicInfo?.courseId || '',
        admissionFee: '',
        scholarship: '',
        remainingFee: editingStudent.feeInfo?.pendingFee || '',
        booksMaterials: '',
        totalFee: editingStudent.feeInfo?.totalFee || '',
        totalPaidFee: editingStudent.feeInfo?.paidFee || '',
        email: editingStudent.userId?.email || '',
        password: ''
      });
      if (editingStudent.personalInfo?.photo) {
        setPhotoPreview(editingStudent.personalInfo.photo);
      }
    }
  }, [editingStudent]);

  // Handle photo upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Photo size should be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      setStudentPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Calculate total fee and remaining fee
  useEffect(() => {
    const admissionFee = parseFloat(formData.admissionFee) || 0;
    const booksMaterials = parseFloat(formData.booksMaterials) || 0;
    const scholarship = parseFloat(formData.scholarship) || 0;
    const total = admissionFee + booksMaterials - scholarship;
    
    const paid = parseFloat(formData.totalPaidFee) || 0;
    const remaining = total - paid;
    
    setFormData(prev => ({
      ...prev,
      totalFee: total > 0 ? total.toFixed(2) : prev.totalFee,
      remainingFee: remaining > 0 ? remaining.toFixed(2) : ''
    }));
  }, [formData.admissionFee, formData.booksMaterials, formData.scholarship, formData.totalPaidFee]);

  // Create student mutation
  const createStudentMutation = useMutation(
    async (data) => {
      return api.post('/students', data);
    },
    {
      onSuccess: (response, variables) => {
        queryClient.invalidateQueries('students');
        queryClient.invalidateQueries('adminStats');
        queryClient.invalidateQueries('classes');
        queryClient.invalidateQueries('nextSerial');
        
        // Get the course ID and name from the variables (passed from handleSubmit)
        const courseId = variables._courseId || variables.academicInfo?.courseId || response.data?.academicInfo?.courseId;
        const courseName = variables._courseName || response.data?.academicInfo?.courseId?.name || 'the class';
        
        if (onSuccess) onSuccess(response.data);
        onClose();
        
        // Navigate to the class page with the course ID
        if (courseId) {
          toast.success(`Student admitted successfully! Redirecting to ${courseName} class page...`, {
            duration: 2000,
            icon: '✅'
          });
          // Use a delay to ensure the classes list is refreshed and invalidated
          setTimeout(() => {
            navigate(`/admin/classes?courseId=${courseId}`, { 
              state: { 
                courseName: courseName,
                autoSelect: true 
              } 
            });
          }, 1200);
        } else {
          toast.success('Student admitted successfully!');
          // Fallback: navigate to classes page
          navigate('/admin/classes');
        }
      },
      onError: (error) => {
        const errorMessage = error.response?.data?.message || 
                           error.response?.data?.error || 
                           error.message || 
                           'Failed to admit student';
        toast.error(errorMessage);
      }
    }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Find the selected course - try multiple matching strategies
    let selectedCourse = null;
    
    // Strategy 1: Exact match (case insensitive)
    selectedCourse = courses.find(c => 
      c.name.toLowerCase().trim() === formData.selectedCourse.toLowerCase().trim()
    );
    
    // Strategy 2: Partial match - course name contains selected course
    if (!selectedCourse) {
      selectedCourse = courses.find(c => 
        c.name.toLowerCase().includes(formData.selectedCourse.toLowerCase()) ||
        formData.selectedCourse.toLowerCase().includes(c.name.toLowerCase())
      );
    }
    
    // Strategy 3: Handle common variations and fuzzy matching
    if (!selectedCourse) {
      const courseVariations = {
        'english language': ['english', 'english language', 'english course', 'english lang', 'eng', 'english class'],
        'dit': ['dit', 'diploma in information technology', 'd.i.t', 'diploma it', 'd.i.t.'],
        'ielts': ['ielts', 'international english language testing system', 'ielts preparation', 'ielts course'],
        'computer': ['computer', 'computer course', 'computer science', 'cs', 'computers', 'it', 'computer class'],
        'coaching': ['coaching', 'tuition', 'tutoring', 'private coaching'],
        'book 1': ['book 1', 'book one', 'book i', 'book-1', 'book1', 'book 1 class'],
        'book 2': ['book 2', 'book two', 'book ii', 'book-2', 'book2', 'book 2 class'],
        'book 3': ['book 3', 'book three', 'book iii', 'book-3', 'book3', 'book 3 class'],
        'book 4': ['book 4', 'book four', 'book iv', 'book-4', 'book4', 'book 4 class']
      };
      
      const selectedLower = formData.selectedCourse.toLowerCase().trim();
      const variations = courseVariations[selectedLower] || [];
      
      // Try variations
      for (const variation of variations) {
        selectedCourse = courses.find(c => {
          const courseNameLower = c.name.toLowerCase();
          return courseNameLower === variation ||
                 courseNameLower.includes(variation) ||
                 variation.includes(courseNameLower) ||
                 courseNameLower.replace(/\s+/g, '') === variation.replace(/\s+/g, '') ||
                 courseNameLower.replace(/[-\s]/g, '') === variation.replace(/[-\s]/g, '');
        });
        if (selectedCourse) break;
      }
      
      // If still not found, try fuzzy match (remove spaces, dashes, case)
      if (!selectedCourse) {
        const normalizedSelected = selectedLower.replace(/[-\s]/g, '');
        selectedCourse = courses.find(c => {
          const normalizedCourse = c.name.toLowerCase().replace(/[-\s]/g, '');
          return normalizedCourse === normalizedSelected ||
                 normalizedCourse.includes(normalizedSelected) ||
                 normalizedSelected.includes(normalizedCourse);
        });
      }
    }

    // If still not found, show error with helpful message
    if (!selectedCourse) {
      toast.error(`Course "${formData.selectedCourse}" not found. Please create this course first in the Courses page.`);
      return;
    }

    // Find the selected teacher
    const selectedTeacher = teachers.find(t => 
      t.personalInfo?.fullName === formData.teacher
    );

    // Determine who is admitting the student
    // If a teacher is selected, use their userId; otherwise use current user
    let admittedById = user?.id; // Default to current user
    if (selectedTeacher?.userId) {
      admittedById = selectedTeacher.userId; // Use selected teacher's userId
    }

    // Prepare student data
    const studentData = {
      email: formData.email || `${formData.name.toLowerCase().replace(/\s+/g, '.')}@bitel.edu`,
      password: formData.password || 'password123',
      personalInfo: {
        fullName: formData.name,
        dateOfBirth: formData.date,
        gender: 'male' // Default, can be added to form later
      },
      contactInfo: {
        phone: formData.contact,
        address: formData.address ? {
          street: formData.address.split(',')[0]?.trim() || '',
          city: formData.address.split(',')[1]?.trim() || '',
          state: formData.address.split(',')[2]?.trim() || '',
          country: 'Pakistan'
        } : {}
      },
      personalInfo: {
        fullName: formData.name,
        dateOfBirth: formData.date,
        gender: 'male', // Default, can be added to form later
        ...(photoPreview && !studentPhoto ? {} : studentPhoto ? { photo: photoPreview } : {})
      },
      parentInfo: {
        fatherName: formData.fatherName
      },
      academicInfo: {
        instituteType: 'academy', // BITEL is an academy
        courseId: selectedCourse._id,
        session: new Date().getFullYear().toString(),
        status: 'active',
        admissionDate: new Date(`${formData.date}T${formData.time}`) // Include both date and time
      },
      feeInfo: {
        totalFee: parseFloat(formData.totalFee) || 0,
        paidFee: parseFloat(formData.totalPaidFee) || 0
      },
      admittedBy: admittedById, // Track who admitted the student
      // Store course ID for navigation
      _courseId: selectedCourse._id,
      _courseName: selectedCourse.name
    };

    createStudentMutation.mutate(studentData);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .admission-form-print,
          .admission-form-print * {
            visibility: visible;
          }
          .admission-form-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
            padding: 20px;
            box-shadow: none;
            border: none;
          }
          .no-print {
            display: none !important;
          }
          .admission-form-print .print-section {
            page-break-inside: avoid;
          }
        }
        html {
          scroll-behavior: smooth;
        }
        .admission-form-container {
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
        }
      `}</style>

      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto admission-form-container">
        <div className="bg-white rounded-2xl max-w-5xl w-full my-4 sm:my-8 shadow-2xl border border-gray-200 admission-form-print">
          {/* Beautiful Header */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-6 sm:p-8 rounded-t-2xl print:rounded-none print-section">
            <div className="text-center">
              <div className="flex items-center justify-center mb-3">
                <GraduationCap className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mr-2 sm:mr-3" />
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-wide">College & Academy</h1>
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold mb-4 opacity-95">Student Admission Form</h2>
              <div className="bg-white bg-opacity-20 backdrop-blur-sm px-4 py-2 rounded-lg inline-block">
                <p className="text-xs sm:text-sm md:text-base font-medium">Arbab Road Peshawar</p>
                <p className="text-xs sm:text-sm md:text-base font-medium">0311-9663606</p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 md:p-8">
            {/* Action Buttons - Hidden in Print */}
            <div className="flex justify-between items-center mb-4 no-print">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditMode(!isEditMode)}
                  className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/30 transition-colors flex items-center gap-2"
                  title="Edit Form"
                >
                  <Edit className="w-4 h-4" />
                  <span className="text-sm font-medium">Edit</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/30 transition-colors flex items-center gap-2"
                  title="Print Form"
                >
                  <Printer className="w-4 h-4" />
                  <span className="text-sm font-medium">Print</span>
                </button>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 print:space-y-4">
              {/* Student & Admission Details */}
              <div className="border-2 border-indigo-200 rounded-xl p-4 sm:p-6 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-sm print-section">
                <h4 className="font-bold text-gray-800 mb-4 sm:mb-6 text-lg sm:text-xl flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-600" />
                  Student & Admission Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="sm:col-span-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Serial No
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-indigo-600 font-bold text-lg">A</span>
                      <input
                        type="text"
                        name="serialNo"
                        value={formData.serialNo}
                        readOnly
                        className="flex-1 border-2 border-indigo-200 rounded-lg px-3 py-2.5 bg-white text-gray-700 font-semibold focus:outline-none print:border-gray-300"
                        placeholder={serialData?.nextSerial?.replace('A', '') || 'Auto'}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">(Auto-generated)</p>
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-indigo-600" />
                      Date *
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      required
                      disabled={!isEditMode && !!editingStudent}
                      className="w-full border-2 border-indigo-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all print:border-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      Time *
                    </label>
                    <input
                      type="time"
                      name="time"
                      value={formData.time}
                      onChange={handleInputChange}
                      required
                      disabled={!isEditMode && !!editingStudent}
                      className="w-full border-2 border-indigo-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all print:border-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                      <User className="w-4 h-4 text-indigo-600" />
                      Student Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full border-2 border-indigo-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all print:border-gray-300"
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Father's Name *
                    </label>
                    <input
                      type="text"
                      name="fatherName"
                      value={formData.fatherName}
                      onChange={handleInputChange}
                      required
                      className="w-full border-2 border-indigo-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all print:border-gray-300"
                      placeholder="Enter father's full name"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-indigo-600" />
                      Timing *
                    </label>
                    <input
                      type="text"
                      name="timing"
                      value={formData.timing}
                      onChange={handleInputChange}
                      required
                      className="w-full border-2 border-indigo-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all print:border-gray-300"
                      placeholder="e.g., 3pm to 4pm"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                      <GraduationCap className="w-4 h-4 text-indigo-600" />
                      Teacher *
                    </label>
                    <select
                      name="teacher"
                      value={formData.teacher}
                      onChange={handleInputChange}
                      required
                      className="w-full border-2 border-indigo-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all print:border-gray-300 bg-white"
                    >
                      <option value="">Select Teacher</option>
                      {teachers.map((teacher) => (
                        <option key={teacher._id} value={teacher.personalInfo?.fullName}>
                          {teacher.personalInfo?.fullName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                      <Phone className="w-4 h-4 text-indigo-600" />
                      Contact Number *
                    </label>
                    <input
                      type="tel"
                      name="contact"
                      value={formData.contact}
                      onChange={handleInputChange}
                      required
                      disabled={!isEditMode && editingStudent}
                      className="w-full border-2 border-indigo-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all print:border-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="0333.875252"
                    />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-indigo-600" />
                      Address *
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      disabled={!isEditMode && editingStudent}
                      rows="2"
                      className="w-full border-2 border-indigo-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all print:border-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
                      placeholder="Street, City, State, Country"
                    />
                  </div>
                  {/* Student Photo Upload */}
                  <div className="sm:col-span-2 lg:col-span-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                      <ImageIcon className="w-4 h-4 text-indigo-600" />
                      Student Photo
                    </label>
                    <div className="flex items-center gap-4">
                      {photoPreview && (
                        <div className="relative">
                          <img
                            src={photoPreview}
                            alt="Student"
                            className="w-24 h-24 rounded-lg object-cover border-2 border-indigo-200"
                          />
                          {isEditMode && (
                            <button
                              type="button"
                              onClick={() => {
                                setPhotoPreview(null);
                                setStudentPhoto(null);
                                if (fileInputRef.current) fileInputRef.current.value = '';
                              }}
                              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          disabled={!isEditMode && editingStudent}
                          className="hidden"
                          id="photo-upload"
                        />
                        <label
                          htmlFor="photo-upload"
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-indigo-300 cursor-pointer hover:bg-indigo-50 transition-colors ${(!isEditMode && editingStudent) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <Upload className="w-4 h-4 text-indigo-600" />
                          <span className="text-sm text-indigo-600 font-medium">
                            {photoPreview ? 'Change Photo' : 'Upload Photo'}
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Course Section - Beautiful Design */}
              <div className="border-2 border-purple-200 rounded-xl p-4 sm:p-6 bg-gradient-to-br from-purple-50 to-pink-50 shadow-sm print-section">
                <h4 className="font-bold text-gray-800 mb-4 sm:mb-6 text-lg sm:text-xl flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                  Course Selection *
                </h4>
                <select
                  name="selectedCourse"
                  value={formData.selectedCourse}
                  onChange={handleInputChange}
                  required
                  disabled={coursesLoading}
                  className="w-full border-2 border-purple-200 rounded-lg px-4 py-3 text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all print:border-gray-300 bg-white"
                >
                  <option value="">
                    {coursesLoading ? 'Loading courses...' : 'Select a course'}
                  </option>
                  {courses.map((course) => (
                    <option key={course._id} value={course.name}>
                      {course.name}
                    </option>
                  ))}
                </select>
                {courses.length === 0 && !coursesLoading && (
                  <p className="text-sm text-gray-500 mt-2">No courses available. Please create courses first.</p>
                )}
              </div>

              {/* Fee Detail Section */}
              <div className="border-2 border-green-200 rounded-xl p-4 sm:p-6 bg-gradient-to-br from-green-50 to-emerald-50 shadow-sm print-section">
                <h4 className="font-bold text-gray-800 mb-4 sm:mb-6 text-lg sm:text-xl flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Fee Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Admission Fee *
                    </label>
                    <input
                      type="number"
                      name="admissionFee"
                      value={formData.admissionFee}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full border-2 border-green-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all print:border-gray-300"
                      placeholder="4000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Scholarship
                    </label>
                    <input
                      type="number"
                      name="scholarship"
                      value={formData.scholarship}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full border-2 border-green-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all print:border-gray-300"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Books/Materials
                    </label>
                    <input
                      type="number"
                      name="booksMaterials"
                      value={formData.booksMaterials}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full border-2 border-green-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all print:border-gray-300"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Total Fee
                    </label>
                    <input
                      type="number"
                      name="totalFee"
                      value={formData.totalFee}
                      readOnly
                      className="w-full border-2 border-green-200 rounded-lg px-3 py-2.5 bg-gray-50 font-semibold text-gray-700 print:border-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Total Paid Fee *
                    </label>
                    <input
                      type="number"
                      name="totalPaidFee"
                      value={formData.totalPaidFee}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full border-2 border-green-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all print:border-gray-300"
                      placeholder="4000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Remaining Fee
                    </label>
                    <input
                      type="number"
                      name="remainingFee"
                      value={formData.remainingFee}
                      readOnly
                      className="w-full border-2 border-green-200 rounded-lg px-3 py-2.5 bg-gray-50 font-semibold text-gray-700 print:border-gray-300"
                    />
                  </div>
                </div>
              </div>

              {/* Admission Timestamp Display */}
              <div className="border-2 border-blue-200 rounded-xl p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm print-section">
                <h4 className="font-bold text-gray-800 mb-4 text-lg sm:text-xl flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Admission Date & Time
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <p className="text-xs text-gray-500 mb-1">Date</p>
                    <p className="text-lg font-semibold text-gray-800">{formData.date}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <p className="text-xs text-gray-500 mb-1">Time</p>
                    <p className="text-lg font-semibold text-gray-800">{formData.time}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-blue-200 sm:col-span-2">
                    <p className="text-xs text-gray-500 mb-1">Admitted By</p>
                    <p className="text-lg font-semibold text-gray-800">{formData.teacher || user?.email || 'Admin'}</p>
                  </div>
                </div>
              </div>

              {/* Signatures Section */}
              <div className="border-2 border-gray-200 rounded-xl p-4 sm:p-6 bg-gray-50 print:bg-white print-section">
                <h4 className="font-bold text-gray-800 mb-4 text-lg sm:text-xl">Authorized Signatures</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 mt-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Principal Signature
                    </label>
                    <div className="border-b-2 border-gray-400 h-16 print:h-20"></div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Accountant Signature
                    </label>
                    <div className="border-b-2 border-gray-400 h-16 print:h-20"></div>
                  </div>
                </div>
              </div>

              {/* Form Actions - Hidden in Print */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4 border-t border-gray-300 no-print">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-6 py-3 border-2 border-indigo-300 text-indigo-700 rounded-lg hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 font-semibold"
                >
                  <Printer className="w-5 h-5" />
                  Print Form
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createStudentMutation.isLoading || coursesLoading}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold shadow-lg hover:shadow-xl"
                >
                  <Save className="w-5 h-5" />
                  {createStudentMutation.isLoading ? 'Saving...' : 'Admit Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default BitelAdmissionForm;

