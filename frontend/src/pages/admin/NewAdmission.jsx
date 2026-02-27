import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../store/hooks';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, User, Phone, Mail, MapPin, Calendar, GraduationCap, 
  DollarSign, Save, FileText, School, Users, CreditCard 
} from 'lucide-react';

const NewAdmission = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    // Personal Information
    fullName: '',
    dateOfBirth: '',
    gender: 'male',
    email: '',
    password: 'password123',
    
    // Contact Information
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Pakistan'
    },
    
    // Parent/Guardian Information
    fatherName: '',
    fatherPhone: '',
    
    // Academic Information
    instituteType: 'college',
    courseId: '',
    session: new Date().getFullYear().toString(),
    status: 'active',
    
    // Fee Information
    admissionFee: '',
    monthlyFee: '',
    totalFee: '',
    paidFee: '',
    pendingFee: '',
    remainingFee: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Fetch next serial number
  const { data: serialData } = useQuery({
    queryKey: ['nextSerial'],
    queryFn: async () => {
      try {
        const response = await api.get('/students/next-serial');
        return response.data;
      } catch (error) {
        console.error('Error fetching next serial:', error);
        return { nextSerial: 'STU-0001', nextNumber: 1 };
      }
    }
  });

  // Filter courses by institute type
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

  // Calculate fees - Total Fee = Admission Fee + Monthly Fee
  useEffect(() => {
    const admissionFee = parseFloat(formData.admissionFee) || 0;
    const monthlyFee = parseFloat(formData.monthlyFee) || 0;
    const totalFee = admissionFee + monthlyFee;
    const paidFee = parseFloat(formData.paidFee) || 0;
    const pendingFee = totalFee - paidFee;
    const remainingFee = totalFee - paidFee;

    setFormData(prev => ({
      ...prev,
      totalFee: totalFee > 0 ? totalFee.toFixed(2) : '',
      pendingFee: pendingFee >= 0 ? pendingFee.toFixed(2) : '0.00',
      remainingFee: remainingFee >= 0 ? remainingFee.toFixed(2) : '0.00'
    }));
  }, [formData.admissionFee, formData.monthlyFee, formData.paidFee]);

  // Reset course when institute type changes
  useEffect(() => {
    setFormData(prev => ({ 
      ...prev, 
      courseId: '' // Clear course selection when institute type changes
    }));
  }, [formData.instituteType]);

  // Create student mutation
  const createStudentMutation = useMutation({
    mutationFn: async (data) => {
      return api.post('/students', data);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      queryClient.invalidateQueries({ queryKey: ['nextSerial'] });
      
      // Extract student data from response (handle different response structures)
      const studentData = response.data?.data || response.data?.student || response.data;
      
      // Log successful response and verify all data was saved
      console.log('✅ Student created successfully!');
      console.log('📋 Response Data:', {
        studentId: studentData?._id,
        fullName: studentData?.personalInfo?.fullName,
        email: studentData?.contactInfo?.email || studentData?.userId?.email,
        phone: studentData?.contactInfo?.phone,
        fatherName: studentData?.parentInfo?.fatherName,
        courseId: studentData?.academicInfo?.courseId,
        savedFields: response.data?.savedFields
      });
      
      // Verify critical fields were saved
      if (studentData) {
        const verification = {
          personalInfo: !!studentData.personalInfo?.fullName,
          contactInfo: !!studentData.contactInfo?.phone,
          academicInfo: !!studentData.academicInfo?.courseId,
          feeInfo: !!studentData.feeInfo
        };
        
        const missingFields = Object.entries(verification)
          .filter(([_, saved]) => !saved)
          .map(([field, _]) => field);
        
        // Fields verified - no logging needed
      }
      
      toast.success('Student admitted successfully!');
      
      // Navigate to students list or student details
      const studentId = studentData?._id;
      if (studentId) {
        setTimeout(() => {
          navigate(`/admin/students/${studentId}/details`);
        }, 1500);
      } else {
        // No student ID - navigate to list
        navigate('/admin/students');
      }
    },
    onError: (error) => {
      console.error('❌ Student creation failed:', error);
      console.error('   Response:', error.response?.data);
      console.error('   Status:', error.response?.status);
      
      // Extract detailed error information
      let errorMessage = 'Failed to admit student';
      const errorData = error.response?.data;
      
      if (errorData) {
        if (errorData.errors && Array.isArray(errorData.errors)) {
          // Validation errors
          errorMessage = `Validation errors: ${errorData.errors.join(', ')}`;
        } else if (errorData.message) {
          errorMessage = errorData.message;
          if (errorData.details) {
            console.error('   Details:', errorData.details);
          }
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      setIsSubmitting(false);
    }
  });

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation with proper trimming
    if (!formData.fullName || !formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    if (!formData.email || !formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.phone || !formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    if (!formData.courseId) {
      newErrors.courseId = 'Course selection is required';
    }
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fill in all required fields correctly');
      return;
    }

    setIsSubmitting(true);

    // Ensure all data is properly captured and sanitized
    const studentData = {
      email: (formData.email || '').trim(),
      password: formData.password || 'password123',
      personalInfo: {
        fullName: (formData.fullName || '').trim(),
        dateOfBirth: formData.dateOfBirth || new Date().toISOString().split('T')[0],
        gender: formData.gender || 'male',
        photo: ''
      },
      contactInfo: {
        phone: (formData.phone || '').trim(),
        email: (formData.email || '').trim(),
        address: {
          street: (formData.address?.street || '').trim(),
          city: (formData.address?.city || '').trim(),
          state: (formData.address?.state || '').trim(),
          zipCode: (formData.address?.zipCode || '').trim(),
          country: (formData.address?.country || 'Pakistan').trim()
        }
      },
      parentInfo: {
        fatherName: (formData.fatherName || '').trim(),
        fatherPhone: (formData.fatherPhone || '').trim()
      },
      academicInfo: {
        instituteType: formData.instituteType || 'college',
        courseId: formData.courseId || null,
        session: (formData.session || new Date().getFullYear().toString()).trim(),
        status: formData.status || 'active',
        admissionDate: new Date()
      },
      feeInfo: {
        admissionFee: parseFloat(formData.admissionFee) || 0,
        monthlyFee: parseFloat(formData.monthlyFee) || 0,
        totalFee: parseFloat(formData.totalFee) || 0,
        paidFee: parseFloat(formData.paidFee) || 0,
        pendingFee: parseFloat(formData.pendingFee) || (parseFloat(formData.totalFee) || 0) - (parseFloat(formData.paidFee) || 0),
        remainingFee: parseFloat(formData.remainingFee) || (parseFloat(formData.totalFee) || 0) - (parseFloat(formData.paidFee) || 0)
      }
    };

    // Comprehensive field verification before submission
    const missingFields = [];
    const emptyFields = [];
    
    // Check required fields
    if (!studentData.personalInfo.fullName || !studentData.personalInfo.fullName.trim()) {
      missingFields.push('Full Name');
    }
    if (!studentData.email || !studentData.email.trim()) {
      missingFields.push('Email');
    }
    if (!studentData.contactInfo.phone || !studentData.contactInfo.phone.trim()) {
      missingFields.push('Phone Number');
    }
    if (!studentData.academicInfo.courseId) {
      missingFields.push('Course Selection');
    }
    if (!studentData.personalInfo.dateOfBirth) {
      missingFields.push('Date of Birth');
    }
    
    // Check for empty but important fields (warnings, not errors)
    if (!studentData.parentInfo.fatherName || !studentData.parentInfo.fatherName.trim()) {
      emptyFields.push('Father\'s Name');
    }
    if (!studentData.parentInfo.fatherPhone || !studentData.parentInfo.fatherPhone.trim()) {
      emptyFields.push('Father\'s Phone');
    }
    
    // If critical fields are missing, show error and stop
    if (missingFields.length > 0) {
      toast.error(`Please fill in required fields: ${missingFields.join(', ')}`);
      setIsSubmitting(false);
      return;
    }
    
    // Log comprehensive data verification
    console.log('📋 Form Data Verification:');
    console.log('✅ Required Fields:', {
      fullName: studentData.personalInfo.fullName,
      email: studentData.email,
      phone: studentData.contactInfo.phone,
      courseId: studentData.academicInfo.courseId,
      dateOfBirth: studentData.personalInfo.dateOfBirth
    });
    console.log('📝 Optional Fields:', {
      fatherName: studentData.parentInfo.fatherName || '(empty)',
      fatherPhone: studentData.parentInfo.fatherPhone || '(empty)',
      address: studentData.contactInfo.address
    });
    if (emptyFields.length > 0) {
      // Optional fields empty - this is fine, no warning needed
    }
    
    // Log complete data being sent for debugging
    console.log('📤 Submitting Complete Student Data:', {
      personalInfo: studentData.personalInfo,
      contactInfo: studentData.contactInfo,
      parentInfo: studentData.parentInfo,
      academicInfo: studentData.academicInfo,
      feeInfo: studentData.feeInfo
    });

    createStudentMutation.mutate(studentData);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const instituteTypes = [
    { value: 'academy', label: 'Academy' },
    { value: 'school', label: 'School' },
    { value: 'college', label: 'College' },
    { value: 'short_course', label: 'Institute / Short Course' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/students')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Students</span>
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                New Student Admission
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Fill in all the required information to admit a new student
              </p>
            </div>
            {serialData?.nextSerial && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-2">
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                  Serial Number: <span className="font-bold">{serialData.nextSerial}</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
              <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Personal Information
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  autoComplete="name"
                  className={`input-field ${errors.fullName ? 'border-red-500' : ''}`}
                  placeholder="Enter full name"
                  required
                />
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className={`input-field ${errors.dateOfBirth ? 'border-red-500' : ''}`}
                  required
                />
                {errors.dateOfBirth && (
                  <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  autoComplete="email"
                  className={`input-field ${errors.email ? 'border-red-500' : ''}`}
                  placeholder="student@example.com"
                  required
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
              <Phone className="w-6 h-6 text-green-600 dark:text-green-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Contact Information
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  autoComplete="tel"
                  className={`input-field ${errors.phone ? 'border-red-500' : ''}`}
                  placeholder="+92 300 1234567"
                  required
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Street Address
                </label>
                <input
                  type="text"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleInputChange}
                  autoComplete="street-address"
                  className="input-field"
                  placeholder="House/Street number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  City
                </label>
                <input
                  type="text"
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleInputChange}
                  autoComplete="address-level2"
                  className="input-field"
                  placeholder="City"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  State/Province
                </label>
                <input
                  type="text"
                  name="address.state"
                  value={formData.address.state}
                  onChange={handleInputChange}
                  autoComplete="address-level1"
                  className="input-field"
                  placeholder="State/Province"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ZIP/Postal Code
                </label>
                <input
                  type="text"
                  name="address.zipCode"
                  value={formData.address.zipCode}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="ZIP/Postal Code"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Country
                </label>
                <input
                  type="text"
                  name="address.country"
                  value={formData.address.country}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Country"
                />
              </div>
            </div>
          </div>

          {/* Parent Information Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Parent Information
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Father's Name
                </label>
                <input
                  type="text"
                  name="fatherName"
                  value={formData.fatherName}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Father's full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Father's Phone
                </label>
                <input
                  type="tel"
                  name="fatherPhone"
                  value={formData.fatherPhone}
                  onChange={handleInputChange}
                  autoComplete="tel"
                  className="input-field"
                  placeholder="+92 300 1234567"
                />
              </div>
            </div>
          </div>

          {/* Academic Information Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
              <GraduationCap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Academic Information
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Institute Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="instituteType"
                  value={formData.instituteType}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                >
                  {instituteTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Course <span className="text-red-500">*</span>
                </label>
                <select
                  name="courseId"
                  value={formData.courseId}
                  onChange={handleInputChange}
                  className={`input-field ${errors.courseId ? 'border-red-500' : ''}`}
                  required
                  disabled={coursesLoading}
                >
                  <option value="">Select a course</option>
                  {filteredCourses.map(course => (
                    <option key={course._id} value={course._id}>
                      {course.name}
                    </option>
                  ))}
                </select>
                {errors.courseId && (
                  <p className="mt-1 text-sm text-red-600">{errors.courseId}</p>
                )}
                {filteredCourses.length === 0 && !coursesLoading && (
                  <p className="mt-1 text-sm text-yellow-600">
                    No courses available for {instituteTypes.find(t => t.value === formData.instituteType)?.label}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Session/Year
                </label>
                <input
                  type="text"
                  name="session"
                  value={formData.session}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="e.g., 2024"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="input-field"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="graduated">Graduated</option>
                </select>
              </div>
            </div>
          </div>

          {/* Fee Information Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Fee Information
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Admission Fee
                </label>
                <input
                  type="number"
                  name="admissionFee"
                  value={formData.admissionFee}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Monthly Fee
                </label>
                <input
                  type="number"
                  name="monthlyFee"
                  value={formData.monthlyFee}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Total Fee
                </label>
                <input
                  type="text"
                  name="totalFee"
                  value={formData.totalFee || '0.00'}
                  className="input-field bg-gray-50 dark:bg-gray-700 font-semibold"
                  readOnly
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  (Admission Fee + Monthly Fee)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Paid Fee
                </label>
                <input
                  type="number"
                  name="paidFee"
                  value={formData.paidFee}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Remaining Fee
                </label>
                <input
                  type="text"
                  value={formData.remainingFee || '0.00'}
                  className="input-field bg-gray-50 dark:bg-gray-700 font-semibold"
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate('/admin/students')}
                className="btn-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || createStudentMutation.isLoading}
                className="btn-primary flex items-center gap-2"
              >
                {isSubmitting || createStudentMutation.isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Submit Admission</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewAdmission;

