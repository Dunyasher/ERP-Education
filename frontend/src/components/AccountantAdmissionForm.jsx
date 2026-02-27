import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/hooks';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { X, Save, Printer, User, Phone, MapPin, DollarSign, BookOpen, Link2, School } from 'lucide-react';

const AccountantAdmissionForm = ({ onClose, onSuccess, editingStudent = null, showOverlay = true }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const modalRef = useRef(null);
  const [formData, setFormData] = useState({
    serialNo: '',
    name: '',
    dateOfBirth: '',
    gender: 'male',
    email: '',
    contact: '',
    address: '',
    fatherName: '',
    fatherPhone: '',
    instituteType: 'academy',
    selectedCourse: '',
    admissionFee: '',
    monthlyFee: '',
    totalFee: '',
    paidFee: '',
    remainingBalance: '',
    linkFees: true
  });

  // Institute types
  const instituteTypes = [
    { value: 'academy', label: 'Academy' },
    { value: 'school', label: 'School' },
    { value: 'college', label: 'College' },
    { value: 'short_course', label: 'Institute / Short Course' }
  ];

  // Fetch courses - automatically updates when courses are added/updated
  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      try {
        const response = await api.get('/courses');
        return Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        console.error('Error fetching courses:', error);
        return [];
      }
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0, // Always consider data stale to ensure fresh data
    cacheTime: 0 // Don't cache to ensure immediate updates
  });

  // Filter courses based on selected institute type and sort them
  const filteredCourses = courses
    .filter(course => course.instituteType === formData.instituteType)
    .sort((a, b) => {
      // For school courses, sort by class number (class 5, 6, 7, 8, etc.)
      if (formData.instituteType === 'school') {
        const getClassNumber = (name) => {
          const match = name.match(/class\s*(\d+)/i) || name.match(/(\d+)(?:th|st|nd|rd)?\s*class/i);
          return match ? parseInt(match[1]) : Infinity;
        };
        const classA = getClassNumber(a.name);
        const classB = getClassNumber(b.name);
        if (classA !== Infinity && classB !== Infinity) {
          return classA - classB;
        }
        if (classA !== Infinity) return -1;
        if (classB !== Infinity) return 1;
      }
      // For other institute types, sort alphabetically
      return a.name.localeCompare(b.name);
    });

  // Fetch next serial number
  const { data: serialData } = useQuery({
    queryKey: ['nextSerial'],
    queryFn: async () => {
      try {
        const response = await api.get('/students/next-serial');
        return response.data;
      } catch (error) {
        console.error('Error fetching next serial:', error);
        return { nextSerial: 'A1', nextNumber: 1 };
      }
    }
  });

  // Set auto-generated serial number
  useEffect(() => {
    if (serialData?.nextSerial) {
      const numberPart = serialData.nextSerial.replace('A', '');
      setFormData(prev => ({
        ...prev,
        serialNo: prev.serialNo || numberPart
      }));
    }
  }, [serialData]);

  // Load student data if editing
  useEffect(() => {
    if (editingStudent) {
      const dob = editingStudent.personalInfo?.dateOfBirth 
        ? new Date(editingStudent.personalInfo.dateOfBirth).toISOString().split('T')[0]
        : '';
      setFormData({
        serialNo: editingStudent.srNo?.replace('STU-', '') || '',
        name: editingStudent.personalInfo?.fullName || '',
        dateOfBirth: dob,
        gender: editingStudent.personalInfo?.gender || 'male',
        email: editingStudent.userId?.email || '',
        contact: editingStudent.contactInfo?.phone || '',
        address: editingStudent.contactInfo?.address ? 
          `${editingStudent.contactInfo.address.street || ''}, ${editingStudent.contactInfo.address.city || ''}, ${editingStudent.contactInfo.address.state || ''}`.trim() : '',
        fatherName: editingStudent.parentInfo?.fatherName || '',
        fatherPhone: editingStudent.parentInfo?.fatherPhone || '',
        instituteType: editingStudent.academicInfo?.instituteType || 'academy',
        selectedCourse: editingStudent.academicInfo?.courseId?.name || editingStudent.academicInfo?.courseId || '',
        admissionFee: editingStudent.feeInfo?.admissionFee || '',
        monthlyFee: editingStudent.feeInfo?.monthlyFee || '',
        totalFee: editingStudent.feeInfo?.totalFee || '',
        paidFee: editingStudent.feeInfo?.paidFee || '',
        remainingBalance: (parseFloat(editingStudent.feeInfo?.totalFee || 0) - parseFloat(editingStudent.feeInfo?.paidFee || 0)).toFixed(2) || '0.00',
        linkFees: true
      });
    }
  }, [editingStudent]);

  // Calculate total fee and remaining balance
  useEffect(() => {
    const admissionFee = parseFloat(formData.admissionFee) || 0;
    const monthlyFee = parseFloat(formData.monthlyFee) || 0;
    const total = admissionFee + monthlyFee;
    const paidFee = parseFloat(formData.paidFee) || 0;
    const remaining = total - paidFee;
    
    setFormData(prev => ({
      ...prev,
      totalFee: total > 0 ? total.toFixed(2) : '',
      remainingBalance: remaining >= 0 ? remaining.toFixed(2) : '0.00'
    }));
  }, [formData.admissionFee, formData.monthlyFee, formData.paidFee]);

  // Reset course when institute type changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      selectedCourse: ''
    }));
  }, [formData.instituteType]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Create student mutation
  const createStudentMutation = useMutation(
    async (data) => {
      if (editingStudent) {
        return api.put(`/students/${editingStudent._id}`, data);
      }
      return api.post('/students', data);
    },
    {
      onSuccess: async (response, variables) => {
        const studentData = response.data?.data || response.data;
        const studentId = studentData?._id || studentData?.id;

        // Auto-link fees if enabled
        if (formData.linkFees && studentId && !editingStudent) {
          try {
            await api.post(`/accountant/admissions/${studentId}/link-fees`, {
              totalAmount: parseFloat(formData.totalFee) || 0,
              admissionFee: parseFloat(formData.admissionFee) || 0,
              monthlyFee: parseFloat(formData.monthlyFee) || 0
            });
            toast.success('Admission linked to fees successfully!');
          } catch (error) {
            console.error('Error linking fees:', error);
            toast.error('Admission created but fee linking failed. You can link it manually later.');
          }
        }

        queryClient.invalidateQueries('students');
        queryClient.invalidateQueries('accountantStats');
        queryClient.invalidateQueries('nextSerial');
        
        if (onSuccess) onSuccess(response.data);
        onClose();
        
        toast.success(`Student ${editingStudent ? 'updated' : 'admitted'} successfully!`);
      },
      onError: (error) => {
        const errorMessage = error.response?.data?.message || 
                           error.response?.data?.error || 
                           error.message || 
                           'Failed to save student';
        toast.error(errorMessage);
      }
    }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Find the selected course
    let selectedCourse = filteredCourses.find(c => 
      c.name.toLowerCase().trim() === formData.selectedCourse.toLowerCase().trim()
    );
    
    if (!selectedCourse) {
      selectedCourse = filteredCourses.find(c => 
        c.name.toLowerCase().includes(formData.selectedCourse.toLowerCase()) ||
        formData.selectedCourse.toLowerCase().includes(c.name.toLowerCase())
      );
    }
    
    if (!selectedCourse && filteredCourses.length > 0) {
      toast.error(`Course "${formData.selectedCourse}" not found for ${instituteTypes.find(t => t.value === formData.instituteType)?.label}. Please select a valid course.`);
      return;
    }

    if (filteredCourses.length === 0) {
      toast.error(`No courses available for ${instituteTypes.find(t => t.value === formData.instituteType)?.label}. Please create a course first.`);
      return;
    }

    // Prepare student data
    const studentData = {
      email: formData.email || editingStudent?.userId?.email || `${formData.name.toLowerCase().replace(/\s+/g, '.')}@bitel.edu`,
      password: editingStudent ? undefined : 'password123',
      personalInfo: {
        fullName: formData.name,
        dateOfBirth: formData.dateOfBirth || new Date().toISOString().split('T')[0],
        gender: formData.gender || 'male'
      },
      contactInfo: {
        phone: formData.contact,
        email: formData.email || editingStudent?.userId?.email,
        address: formData.address ? {
          street: formData.address.split(',')[0]?.trim() || '',
          city: formData.address.split(',')[1]?.trim() || '',
          state: formData.address.split(',')[2]?.trim() || '',
          country: 'Pakistan'
        } : {}
      },
      parentInfo: {
        fatherName: formData.fatherName,
        fatherPhone: formData.fatherPhone || ''
      },
      academicInfo: {
        instituteType: formData.instituteType,
        courseId: selectedCourse?._id,
        session: new Date().getFullYear().toString(),
        status: 'active',
        admissionDate: new Date()
      },
      feeInfo: {
        admissionFee: parseFloat(formData.admissionFee) || 0,
        monthlyFee: parseFloat(formData.monthlyFee) || 0,
        totalFee: parseFloat(formData.totalFee) || 0,
        paidFee: parseFloat(formData.paidFee) || 0,
        pendingFee: parseFloat(formData.remainingBalance) || 0
      },
      admittedBy: user?.id,
      _courseId: selectedCourse?._id,
      _courseName: selectedCourse?.name
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

  return (
    <>
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
          }
          .no-print {
            display: none !important;
          }
        }
        /* Extra small devices (smartwatches, very small phones) */
        @media (max-width: 320px) {
          .form-container {
            padding: 0.5rem;
          }
          .form-input {
            font-size: 14px;
            padding: 0.5rem;
          }
          .form-label {
            font-size: 12px;
          }
          .form-button {
            padding: 0.5rem 1rem;
            font-size: 14px;
          }
        }
        /* Small devices (phones) */
        @media (min-width: 321px) and (max-width: 640px) {
          .form-container {
            padding: 1rem;
          }
        }
        /* Medium devices (tablets) */
        @media (min-width: 641px) and (max-width: 1024px) {
          .form-container {
            padding: 1.5rem;
          }
        }
        /* Large devices (laptops, desktops) */
        @media (min-width: 1025px) {
          .form-container {
            padding: 2rem;
          }
        }
      `}</style>

      {/* Conditional Overlay */}
      {showOverlay && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-1 xs:p-2 sm:p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          {/* Modal Content - Fully Responsive */}
          <div 
            ref={modalRef}
            className="bg-white rounded-lg xs:rounded-xl shadow-2xl w-full max-w-xs xs:max-w-sm sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[98vh] xs:max-h-[95vh] overflow-y-auto admission-form-print"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - Responsive */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-2 xs:p-3 sm:p-4 md:p-6 rounded-t-lg xs:rounded-t-xl">
              <div className="flex justify-between items-center gap-2">
                <div className="flex items-center gap-1 xs:gap-2 flex-1 min-w-0">
                  <Link2 className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                  <h2 className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold truncate">Admission Form</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 xs:p-2 rounded-full hover:bg-blue-700 transition-colors flex-shrink-0"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 xs:w-5 xs:h-5" />
                </button>
              </div>
              <p className="text-xs xs:text-sm text-blue-100 mt-1 xs:mt-2">Auto-links admission to fee management</p>
            </div>

            {/* Form Content - Fully Responsive */}
            <div className="p-2 xs:p-3 sm:p-4 md:p-6 form-container">
              {/* Auto-link toggle - Responsive */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 xs:p-3 mb-4 xs:mb-6">
                <label className="flex items-center gap-2 xs:gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.linkFees}
                    onChange={(e) => setFormData(prev => ({ ...prev, linkFees: e.target.checked }))}
                    className="w-4 h-4 xs:w-5 xs:h-5 text-blue-600 rounded focus:ring-blue-500 flex-shrink-0"
                  />
                  <span className="text-xs xs:text-sm text-blue-900 font-medium">
                    Auto-link to Fee Management
                  </span>
                </label>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3 xs:space-y-4 sm:space-y-6">
                {/* Student Information Section */}
                <div className="space-y-3 xs:space-y-4">
                  <h3 className="text-base xs:text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <User className="w-4 h-4 xs:w-5 xs:h-5 text-blue-600" />
                    <span>Student Information</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xs:gap-4">
                    {/* Serial Number */}
                    <div>
                      <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1 xs:mb-2 form-label">
                        Serial Number
                      </label>
                      <div className="flex items-center gap-1 xs:gap-2">
                        <span className="text-blue-600 font-bold text-base xs:text-lg">A</span>
                        <input
                          type="text"
                          name="serialNo"
                          value={formData.serialNo}
                          readOnly
                          className="flex-1 border-2 border-gray-300 rounded-lg px-2 xs:px-3 py-1.5 xs:py-2.5 bg-gray-50 text-gray-700 font-semibold text-sm xs:text-base form-input"
                          placeholder="Auto-generated"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">(Auto-generated)</p>
                    </div>

                    {/* Student Name */}
                    <div>
                      <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1 xs:mb-2 form-label">
                        Student Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full border-2 border-gray-300 rounded-lg px-2 xs:px-3 py-1.5 xs:py-2.5 text-gray-900 text-sm xs:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all form-input"
                        placeholder="Enter full name"
                      />
                    </div>

                    {/* Date of Birth */}
                    <div>
                      <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1 xs:mb-2 form-label">
                        Date of Birth *
                      </label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        required
                        className="w-full border-2 border-gray-300 rounded-lg px-2 xs:px-3 py-1.5 xs:py-2.5 text-gray-900 text-sm xs:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all form-input"
                      />
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1 xs:mb-2 form-label">
                        Gender *
                      </label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        required
                        className="w-full border-2 border-gray-300 rounded-lg px-2 xs:px-3 py-1.5 xs:py-2.5 text-gray-900 text-sm xs:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all form-input"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1 xs:mb-2 form-label">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full border-2 border-gray-300 rounded-lg px-2 xs:px-3 py-1.5 xs:py-2.5 text-gray-900 text-sm xs:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all form-input"
                        placeholder="student@example.com"
                      />
                    </div>

                    {/* Father Name */}
                    <div>
                      <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1 xs:mb-2 form-label">
                        Father Name *
                      </label>
                      <input
                        type="text"
                        name="fatherName"
                        value={formData.fatherName}
                        onChange={handleInputChange}
                        required
                        className="w-full border-2 border-gray-300 rounded-lg px-2 xs:px-3 py-1.5 xs:py-2.5 text-gray-900 text-sm xs:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all form-input"
                        placeholder="Enter father's name"
                      />
                    </div>

                    {/* Father Phone */}
                    <div>
                      <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1 xs:mb-2 form-label">
                        Father Phone
                      </label>
                      <input
                        type="tel"
                        name="fatherPhone"
                        value={formData.fatherPhone}
                        onChange={handleInputChange}
                        className="w-full border-2 border-gray-300 rounded-lg px-2 xs:px-3 py-1.5 xs:py-2.5 text-gray-900 text-sm xs:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all form-input"
                        placeholder="0333-1234567"
                      />
                    </div>


                    {/* Phone Number */}
                    <div>
                      <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1 xs:mb-2 form-label flex items-center gap-1">
                        <Phone className="w-3 h-3 xs:w-4 xs:h-4 text-blue-600" />
                        <span>Phone Number *</span>
                      </label>
                      <input
                        type="tel"
                        name="contact"
                        value={formData.contact}
                        onChange={handleInputChange}
                        autoComplete="tel"
                        required
                        className="w-full border-2 border-gray-300 rounded-lg px-2 xs:px-3 py-1.5 xs:py-2.5 text-gray-900 text-sm xs:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all form-input"
                        placeholder="0333-1234567"
                      />
                    </div>

                    {/* Address - Full Width */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1 xs:mb-2 form-label flex items-center gap-1">
                        <MapPin className="w-3 h-3 xs:w-4 xs:h-4 text-blue-600" />
                        <span>Address *</span>
                      </label>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        autoComplete="street-address"
                        required
                        rows="2"
                        className="w-full border-2 border-gray-300 rounded-lg px-2 xs:px-3 py-1.5 xs:py-2.5 text-gray-900 text-sm xs:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none form-input"
                        placeholder="Street, City, State, Country"
                      />
                    </div>

                    {/* Institute Type - Full Width */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1 xs:mb-2 form-label flex items-center gap-1">
                        <School className="w-3 h-3 xs:w-4 xs:h-4 text-blue-600" />
                        <span>Institute Type *</span>
                      </label>
                      <select
                        name="instituteType"
                        value={formData.instituteType}
                        onChange={handleInputChange}
                        required
                        className="w-full border-2 border-gray-300 rounded-lg px-2 xs:px-3 py-1.5 xs:py-2.5 text-gray-900 text-sm xs:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white form-input"
                      >
                        {instituteTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                      {filteredCourses.length === 0 && formData.instituteType && (
                        <p className="text-xs text-orange-600 mt-1">
                          No courses available for {instituteTypes.find(t => t.value === formData.instituteType)?.label}. Please create a course first.
                        </p>
                      )}
                    </div>

                    {/* Course Selection - Full Width */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1 xs:mb-2 form-label flex items-center gap-1">
                        <BookOpen className="w-3 h-3 xs:w-4 xs:h-4 text-blue-600" />
                        <span>Course *</span>
                      </label>
                      <select
                        name="selectedCourse"
                        value={formData.selectedCourse}
                        onChange={handleInputChange}
                        required
                        disabled={coursesLoading || filteredCourses.length === 0}
                        className="w-full border-2 border-gray-300 rounded-lg px-2 xs:px-3 py-1.5 xs:py-2.5 text-gray-900 text-sm xs:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white form-input disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">
                          {coursesLoading ? 'Loading courses...' : filteredCourses.length === 0 ? 'No courses available' : 'Select a course'}
                        </option>
                        {filteredCourses.map((course) => (
                          <option key={course._id} value={course.name}>
                            {course.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Fee Information Section */}
                <div className="space-y-3 xs:space-y-4 border-t border-gray-200 pt-3 xs:pt-4 sm:pt-6">
                  <h3 className="text-base xs:text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 xs:w-5 xs:h-5 text-green-600" />
                    <span>Fee Information</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 xs:gap-4">
                    {/* Admission Fee */}
                    <div>
                      <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1 xs:mb-2 form-label">
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
                        className="w-full border-2 border-gray-300 rounded-lg px-2 xs:px-3 py-1.5 xs:py-2.5 text-gray-900 text-sm xs:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all form-input"
                        placeholder="0.00"
                      />
                    </div>

                    {/* Monthly Fee */}
                    <div>
                      <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1 xs:mb-2 form-label">
                        Monthly Fee *
                      </label>
                      <input
                        type="number"
                        name="monthlyFee"
                        value={formData.monthlyFee}
                        onChange={handleInputChange}
                        required
                        min="0"
                        step="0.01"
                        className="w-full border-2 border-gray-300 rounded-lg px-2 xs:px-3 py-1.5 xs:py-2.5 text-gray-900 text-sm xs:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all form-input"
                        placeholder="0.00"
                      />
                    </div>

                    {/* Total Fee - Auto-calculated */}
                    <div>
                      <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1 xs:mb-2 form-label">
                        Total Fee
                      </label>
                      <input
                        type="text"
                        name="totalFee"
                        value={formData.totalFee || '0.00'}
                        readOnly
                        className="w-full border-2 border-gray-300 rounded-lg px-2 xs:px-3 py-1.5 xs:py-2.5 bg-gray-50 text-gray-700 font-semibold text-sm xs:text-base form-input"
                      />
                    </div>

                    {/* Paid Fee */}
                    <div>
                      <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1 xs:mb-2 form-label">
                        Paid Fee *
                      </label>
                      <input
                        type="number"
                        name="paidFee"
                        value={formData.paidFee}
                        onChange={handleInputChange}
                        required
                        min="0"
                        step="0.01"
                        max={formData.totalFee || undefined}
                        className="w-full border-2 border-gray-300 rounded-lg px-2 xs:px-3 py-1.5 xs:py-2.5 text-gray-900 text-sm xs:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all form-input"
                        placeholder="0.00"
                      />
                    </div>

                    {/* Remaining Fee - Auto-calculated */}
                    <div className="xs:col-span-2 lg:col-span-1">
                      <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1 xs:mb-2 form-label">
                        Remaining Fee
                      </label>
                      <input
                        type="text"
                        name="remainingFee"
                        value={formData.remainingBalance || '0.00'}
                        readOnly
                        className={`w-full border-2 border-gray-300 rounded-lg px-2 xs:px-3 py-1.5 xs:py-2.5 bg-gray-50 font-semibold text-sm xs:text-base form-input ${
                          parseFloat(formData.remainingBalance || 0) > 0 
                            ? 'text-orange-600' 
                            : 'text-gray-700'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons - Fully Responsive */}
                <div className="flex flex-col xs:flex-row justify-end gap-2 xs:gap-3 pt-3 xs:pt-4 border-t border-gray-200 no-print">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full xs:w-auto px-4 xs:px-6 py-2 xs:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold text-sm xs:text-base shadow-md hover:shadow-lg form-button"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createStudentMutation.isLoading || coursesLoading}
                    className="w-full xs:w-auto px-4 xs:px-6 py-2 xs:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm xs:text-base shadow-md hover:shadow-lg flex items-center justify-center gap-2 form-button"
                  >
                    <Save className="w-4 h-4 xs:w-5 xs:h-5" />
                    {createStudentMutation.isLoading ? 'Saving...' : editingStudent ? 'Update' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AccountantAdmissionForm;
