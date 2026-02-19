import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Search, Users, Eye, Printer, X, Lock, EyeOff, AlertTriangle, DollarSign, FileText } from 'lucide-react';
import StudentAdmissionPrint from '../../components/StudentAdmissionPrint';
import AccountantAdmissionForm from '../../components/AccountantAdmissionForm';
import ErrorCorrection from '../../components/ErrorCorrection';
import { useAuth } from '../../contexts/AuthContext';

const Students = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Check if user is accountant
  const isAccountant = user?.role === 'accountant';
  
  // Determine base path based on current route
  const getBasePath = () => {
    if (location.pathname.includes('/accountant/')) {
      return '/accountant/students';
    }
    return '/admin/students';
  };
  
  const [showErrorCorrection, setShowErrorCorrection] = useState(false);
  const [studentForErrorCorrection, setStudentForErrorCorrection] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [printStudent, setPrintStudent] = useState(null);
  const [emailError, setEmailError] = useState('');
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    personalInfo: {
      fullName: '',
      dateOfBirth: '',
      gender: 'male',
      photo: ''
    },
    contactInfo: {
      phone: '',
      email: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      }
    },
    parentInfo: {
      fatherName: '',
      fatherPhone: '',
      motherName: '',
      motherPhone: '',
      guardianName: '',
      guardianPhone: ''
    },
    academicInfo: {
      instituteType: 'college',
      courseId: '',
      session: '',
      status: 'active'
    },
    feeInfo: {
      admissionFee: 0,
      totalFee: 0,
      paidFee: 0,
      pendingFee: 0,
      remainingFee: 0
    }
  });

  // Fetch students
  const { data: students = [], isLoading } = useQuery('students', async () => {
    const response = await api.get('/students');
    return response.data;
  });

  // Fetch invoices for all students
  const { data: invoices = [] } = useQuery('invoices', async () => {
    try {
      const response = await api.get('/fees/invoices');
      return response.data;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return [];
    }
  });

  // Helper function to get latest invoice for a student
  const getLatestInvoice = (studentId) => {
    if (!invoices || !Array.isArray(invoices)) return null;
    const studentIdStr = studentId?.toString();
    const studentInvoices = invoices.filter(inv => {
      const invStudentId = inv.studentId?._id?.toString() || inv.studentId?.toString() || inv.studentId;
      return invStudentId === studentIdStr;
    });
    if (studentInvoices.length === 0) return null;
    return studentInvoices.sort((a, b) => {
      const dateA = new Date(b.createdAt || b.invoiceDate || 0);
      const dateB = new Date(a.createdAt || a.invoiceDate || 0);
      return dateA - dateB;
    })[0];
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return '';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Fetch categories for dropdown
  const { data: categories = [] } = useQuery('categories', async () => {
    const response = await api.get('/categories');
    return response.data;
  });

  // Fetch courses for dropdown
  const { data: courses = [] } = useQuery('courses', async () => {
    const response = await api.get('/courses');
    return response.data;
  });

  // Filter courses based on selected category and institute type
  const filteredCourses = courses.filter(course => {
    // Filter by category if selected
    if (selectedCategoryId) {
      const courseCategoryId = course.categoryId?._id || course.categoryId;
      if (courseCategoryId !== selectedCategoryId) return false;
    }
    // Filter by institute type
    if (formData.academicInfo.instituteType && course.instituteType !== formData.academicInfo.instituteType) {
      return false;
    }
    return true;
  });

  // Create/Update student mutation
  const studentMutation = useMutation(
    async (data) => {
      if (editingStudent) {
        return api.put(`/students/${editingStudent._id}`, data);
      } else {
        return api.post('/students', data);
      }
    },
    {
      onSuccess: async (response) => {
        queryClient.invalidateQueries('students');
        queryClient.invalidateQueries('adminStats');
        toast.success(editingStudent ? 'Student updated successfully!' : 'Student created successfully!');
        setShowForm(false);
        
        // If new student created, show print option
        if (!editingStudent) {
          try {
            // Get student ID from response (handle both old and new response formats)
            const studentData = response.data?.data || response.data;
            const studentId = studentData?._id || studentData?.id;
            
            if (studentId) {
              // Fetch full student data with all relations
              const fullStudent = await api.get(`/students/${studentId}`);
              setPrintStudent(fullStudent.data);
            }
          } catch (error) {
            console.error('Error fetching student for print:', error);
            // Don't show error to user, just skip print option
          }
        }
        
        setEditingStudent(null);
        resetForm();
      },
      onError: (error) => {
        console.error('Student mutation error:', error);
        const errorMessage = error.response?.data?.message || 
                           error.response?.data?.error || 
                           error.message || 
                           'Failed to save student';
        
        // If it's an email duplicate error, show it in the form field too
        if (errorMessage.toLowerCase().includes('email') && errorMessage.toLowerCase().includes('already exists')) {
          setEmailError(error.response?.data?.suggestion || 'This email is already registered');
        }
        
        // Show full error message with suggestion if available
        const fullMessage = error.response?.data?.suggestion 
          ? `${errorMessage}. ${error.response.data.suggestion}`
          : errorMessage;
        toast.error(fullMessage);
        
        // Show validation errors if available
        if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
          error.response.data.errors.forEach(err => {
            toast.error(err);
          });
        }
      }
    }
  );

  // Delete student mutation
  const deleteMutation = useMutation(
    async (id) => api.delete(`/students/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('students');
        toast.success('Student deleted successfully!');
      },
      onError: () => {
        toast.error('Failed to delete student');
      }
    }
  );

  // Change student password mutation
  const changePasswordMutation = useMutation(
    async ({ userId, password }) => {
      return api.put(`/settings/password/${userId}`, { newPassword: password });
    },
    {
      onSuccess: () => {
        toast.success('Student password updated successfully!');
        setShowPasswordModal(false);
        setSelectedStudent(null);
        setPasswordForm({ newPassword: '', confirmPassword: '' });
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update password');
      }
    }
  );

  const handleOpenPasswordModal = (student) => {
    setSelectedStudent(student);
    setPasswordForm({ newPassword: '', confirmPassword: '' });
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    if (selectedStudent?.userId?._id) {
      changePasswordMutation.mutate({ 
        userId: selectedStudent.userId._id, 
        password: passwordForm.newPassword 
      });
    } else {
      toast.error('Student user ID not found');
    }
  };

  const resetForm = () => {
    setSelectedCategoryId('');
    setEmailError('');
    setIsCheckingEmail(false);
    setFormData({
      email: '',
      password: '',
      personalInfo: {
        fullName: '',
        dateOfBirth: '',
        gender: 'male',
        photo: ''
      },
      contactInfo: {
        phone: '',
        email: '',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        }
      },
      parentInfo: {
        fatherName: '',
        fatherPhone: '',
        motherName: '',
        motherPhone: '',
        guardianName: '',
        guardianPhone: ''
      },
      academicInfo: {
        instituteType: 'college',
        courseId: '',
        session: '',
        status: 'active'
      },
      feeInfo: {
        admissionFee: 0,
        totalFee: 0,
        paidFee: 0,
        pendingFee: 0,
        remainingFee: 0
      }
    });
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    
    // Set category based on student's course
    const studentCourseId = student.academicInfo?.courseId?._id || student.academicInfo?.courseId;
    const studentCourse = courses.find(c => c._id === studentCourseId);
    const categoryId = studentCourse?.categoryId?._id || studentCourse?.categoryId || '';
    setSelectedCategoryId(categoryId);
    
    setFormData({
      email: student.userId?.email || '',
      password: '',
      personalInfo: student.personalInfo || {},
      contactInfo: student.contactInfo || {},
      parentInfo: student.parentInfo || {},
      academicInfo: {
        ...student.academicInfo,
        courseId: studentCourseId || ''
      },
      feeInfo: {
        admissionFee: student.feeInfo?.admissionFee || 0,
        totalFee: student.feeInfo?.totalFee || 0,
        paidFee: student.feeInfo?.paidFee || 0,
        pendingFee: (student.feeInfo?.totalFee || 0) - (student.feeInfo?.paidFee || 0),
        remainingFee: (student.feeInfo?.totalFee || 0) + (student.feeInfo?.admissionFee || 0) - (student.feeInfo?.paidFee || 0)
      }
    });
    setShowForm(true);
  };

  // Check if email exists
  const checkEmailExists = async (email) => {
    if (!email || !email.trim()) {
      setEmailError('');
      return false;
    }
    
    // Skip check if editing (email won't change)
    if (editingStudent) {
      setEmailError('');
      return false;
    }
    
    setIsCheckingEmail(true);
    try {
      // Check if email exists in students
      const studentsResponse = await api.get('/students');
      const existingStudent = studentsResponse.data.find(
        s => s.userId?.email?.toLowerCase() === email.toLowerCase().trim()
      );
      
      if (existingStudent) {
        setEmailError('This email is already registered to a student');
        setIsCheckingEmail(false);
        return true;
      }
      
      setEmailError('');
      setIsCheckingEmail(false);
      return false;
    } catch (error) {
      // If check fails, don't block submission - let backend handle it
      setEmailError('');
      setIsCheckingEmail(false);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check email before submission (only for new students)
    if (!editingStudent && formData.email) {
      const emailExists = await checkEmailExists(formData.email);
      if (emailExists) {
        toast.error('This email is already registered. Please use a different email address.');
        return;
      }
    }
    
    studentMutation.mutate(formData);
  };

  const handleDelete = async (student) => {
    if (!student || !student._id) {
      toast.error('Invalid student data');
      return;
    }

    const reason = window.prompt(
      `Are you sure you want to delete student ${student.personalInfo?.fullName || 'N/A'} (${student.srNo || 'N/A'})?\n\nPlease provide a reason for deletion (optional):`
    );
    
    if (reason !== null) {
      // User clicked OK (even if reason is empty)
      try {
        await api.delete(`/students/${student._id}`, {
          data: { reason: reason || 'No reason provided' }
        });
        queryClient.invalidateQueries('students');
        toast.success('Student deleted successfully. Notification sent to admin and director.');
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to delete student';
        toast.error(errorMessage);
        console.error('Delete student error:', error);
      }
    }
  };

  // Filter students based on search (only by name, father name, or serial number)
  const filteredStudents = students.filter(student => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      student.personalInfo?.fullName?.toLowerCase().includes(searchLower) ||
      student.srNo?.toLowerCase().includes(searchLower) ||
      student.parentInfo?.fatherName?.toLowerCase().includes(searchLower)
    );
  });


  const handleViewDetails = (student) => {
    const path = `${getBasePath()}/${student._id}/details`;
    navigate(path);
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading students...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {isAccountant ? 'Student Admissions' : 'Students Management'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isAccountant ? 'Add new admissions and manage student records' : 'Manage all students in the system'}
          </p>
        </div>
        <button
          onClick={() => {
            if (isAccountant) {
              setShowForm(true);
              setEditingStudent(null);
            } else {
              setShowForm(true);
              setEditingStudent(null);
              resetForm();
            }
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {isAccountant ? 'Add Admission' : 'Add Student'}
        </button>
      </div>

      {/* Search Bar */}
      <div className="card animate-fade-in">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5 z-10" />
          <input
            type="text"
            placeholder="Search by name, father's name, or serial number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-12"
          />
        </div>
      </div>

      {/* Students Table - Simplified */}
      <div className="card overflow-x-auto animate-slide-up">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Serial Number
              </th>
              <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Student Name
              </th>
              <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Father's Name
              </th>
              <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No students found</p>
                  {searchTerm && <p className="text-sm mt-2">Try adjusting your search</p>}
                </td>
              </tr>
            ) : (
              filteredStudents.map((student) => {
                return (
                  <tr key={student._id} className="table-row hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {student.srNo || 'N/A'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {student.personalInfo?.fullName || 'N/A'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {student.parentInfo?.fatherName || 'N/A'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewDetails(student)}
                        className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors duration-200 flex items-center gap-2"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Accountant Admission Form Modal */}
      {showForm && isAccountant && (
        <AccountantAdmissionForm
          editingStudent={editingStudent}
          onClose={() => {
            setShowForm(false);
            setEditingStudent(null);
            resetForm();
          }}
          onSuccess={(studentData) => {
            queryClient.invalidateQueries('students');
            queryClient.invalidateQueries('accountantStats');
            setShowForm(false);
            setEditingStudent(null);
            resetForm();
          }}
        />
      )}

      {/* Admin Add/Edit Form Modal */}
      {showForm && !isAccountant && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-slide-up border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {editingStudent ? 'Edit Student' : 'Add New Student'}
                </h2>
                <div className="flex items-center gap-3">
                  {!editingStudent && (
                    <button
                      onClick={() => {
                        try {
                          // Fill sample data
                          const availableCourses = courses || [];
                          const firstCourse = availableCourses.length > 0 ? availableCourses[0] : null;
                          const courseId = firstCourse?._id || '';
                          const courseCategoryId = firstCourse?.categoryId?._id || firstCourse?.categoryId || '';
                          
                          const sampleData = {
                            email: `student${Date.now()}@example.com`,
                            password: 'password123',
                            personalInfo: {
                              fullName: 'John Doe',
                              dateOfBirth: '2010-01-15',
                              gender: 'male',
                              photo: ''
                            },
                            contactInfo: {
                              phone: '+1234567890',
                              email: `student${Date.now()}@example.com`,
                              address: {
                                street: '123 Main Street',
                                city: 'New York',
                                state: 'NY',
                                zipCode: '10001',
                                country: 'USA'
                              }
                            },
                            parentInfo: {
                              fatherName: 'Robert Doe',
                              fatherPhone: '+1234567891',
                              motherName: 'Jane Doe',
                              motherPhone: '+1234567892',
                              guardianName: '',
                              guardianPhone: ''
                            },
                            academicInfo: {
                              instituteType: 'college',
                              courseId: courseId,
                              session: new Date().getFullYear().toString(),
                              status: 'active'
                            },
                            feeInfo: {
                              admissionFee: 500,
                              totalFee: 10000,
                              paidFee: 2000,
                              pendingFee: 8000,
                              remainingFee: 8500
                            }
                          };
                          
                          setFormData(sampleData);
                          if (courseCategoryId) {
                            setSelectedCategoryId(courseCategoryId);
                          }
                          toast.success('Sample data filled! You can modify the values as needed.');
                        } catch (error) {
                          console.error('Error filling sample data:', error);
                          toast.error('Error filling sample data. Please try again.');
                        }
                      }}
                      type="button"
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors duration-200"
                      title="Fill form with sample data"
                    >
                      <FileText className="w-4 h-4" />
                      Fill Sample
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setEditingStudent(null);
                      resetForm();
                    }}
                    className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Student Serial Number - Auto-generated */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                        Student Serial Number
                      </label>
                      <input
                        type="text"
                        value={editingStudent?.srNo || 'Auto-generated on save'}
                        className="input-field bg-white dark:bg-gray-700 border-blue-300 dark:border-blue-600"
                        readOnly
                        disabled
                      />
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        {editingStudent ? 'This serial number is assigned to this student' : 'Will be automatically generated when you save'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                    <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Student Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.personalInfo.fullName}
                        onChange={(e) => setFormData({
                          ...formData,
                          personalInfo: { ...formData.personalInfo, fullName: e.target.value }
                        })}
                        className="input-field"
                        placeholder="Enter student's full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Date of Birth *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.personalInfo.dateOfBirth}
                        onChange={(e) => setFormData({
                          ...formData,
                          personalInfo: { ...formData.personalInfo, dateOfBirth: e.target.value }
                        })}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Age
                      </label>
                      <input
                        type="text"
                        value={formData.personalInfo.dateOfBirth ? calculateAge(formData.personalInfo.dateOfBirth) + ' years' : ''}
                        className="input-field bg-gray-50 dark:bg-gray-700"
                        readOnly
                        placeholder="Auto-calculated from date of birth"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Gender *
                      </label>
                      <select
                        required
                        value={formData.personalInfo.gender}
                        onChange={(e) => setFormData({
                          ...formData,
                          personalInfo: { ...formData.personalInfo, gender: e.target.value }
                        })}
                        className="input-field"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Student Photo
                      </label>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                // Check file size (max 5MB)
                                if (file.size > 5 * 1024 * 1024) {
                                  toast.error('Image size should be less than 5MB');
                                  return;
                                }
                                // Check file type
                                if (!file.type.startsWith('image/')) {
                                  toast.error('Please select a valid image file');
                                  return;
                                }
                                // Convert to base64
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setFormData({
                                    ...formData,
                                    personalInfo: { ...formData.personalInfo, photo: reader.result }
                                  });
                                };
                                reader.onerror = () => {
                                  toast.error('Error reading image file');
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="input-field"
                          />
                        </div>
                        {formData.personalInfo.photo && (
                          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-300 dark:border-gray-600 flex-shrink-0">
                            <img 
                              src={formData.personalInfo.photo} 
                              alt="Preview" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Upload a photo (JPG, PNG, max 5MB)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                    <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></div>
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={async (e) => {
                          const email = e.target.value;
                          setFormData({ ...formData, email });
                          // Debounce email check
                          if (email && !editingStudent) {
                            setTimeout(() => checkEmailExists(email), 500);
                          } else {
                            setEmailError('');
                          }
                        }}
                        onBlur={() => {
                          if (formData.email && !editingStudent) {
                            checkEmailExists(formData.email);
                          }
                        }}
                        className={`input-field ${emailError ? 'border-red-500 focus:ring-red-500' : ''}`}
                        disabled={editingStudent}
                      />
                      {emailError && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                          <span>⚠️</span>
                          {emailError}
                        </p>
                      )}
                      {isCheckingEmail && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Checking email availability...
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Student Contact *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.contactInfo.phone}
                        onChange={(e) => setFormData({
                          ...formData,
                          contactInfo: { ...formData.contactInfo, phone: e.target.value }
                        })}
                        className="input-field"
                        placeholder="Enter student's phone number"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Student Location/Address *
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          required
                          value={formData.contactInfo.address.street}
                          onChange={(e) => setFormData({
                            ...formData,
                            contactInfo: { 
                              ...formData.contactInfo, 
                              address: { ...formData.contactInfo.address, street: e.target.value }
                            }
                          })}
                          className="input-field"
                          placeholder="Street Address"
                        />
                        <input
                          type="text"
                          required
                          value={formData.contactInfo.address.city}
                          onChange={(e) => setFormData({
                            ...formData,
                            contactInfo: { 
                              ...formData.contactInfo, 
                              address: { ...formData.contactInfo.address, city: e.target.value }
                            }
                          })}
                          className="input-field"
                          placeholder="City"
                        />
                        <input
                          type="text"
                          value={formData.contactInfo.address.state}
                          onChange={(e) => setFormData({
                            ...formData,
                            contactInfo: { 
                              ...formData.contactInfo, 
                              address: { ...formData.contactInfo.address, state: e.target.value }
                            }
                          })}
                          className="input-field"
                          placeholder="State/Province"
                        />
                        <input
                          type="text"
                          value={formData.contactInfo.address.zipCode}
                          onChange={(e) => setFormData({
                            ...formData,
                            contactInfo: { 
                              ...formData.contactInfo, 
                              address: { ...formData.contactInfo.address, zipCode: e.target.value }
                            }
                          })}
                          className="input-field"
                          placeholder="Zip/Postal Code"
                        />
                      </div>
                    </div>
                    {!editingStudent && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Password
                        </label>
                        <input
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="input-field"
                          placeholder="Leave empty for default password"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Parent/Guardian Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                    <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-blue-500 rounded-full"></div>
                    Parent/Guardian Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Father's Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.parentInfo.fatherName}
                        onChange={(e) => setFormData({
                          ...formData,
                          parentInfo: { ...formData.parentInfo, fatherName: e.target.value }
                        })}
                        className="input-field"
                        placeholder="Enter father's name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Father's Contact *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.parentInfo.fatherPhone}
                        onChange={(e) => setFormData({
                          ...formData,
                          parentInfo: { ...formData.parentInfo, fatherPhone: e.target.value }
                        })}
                        className="input-field"
                        placeholder="Enter father's phone number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Mother's Name
                      </label>
                      <input
                        type="text"
                        value={formData.parentInfo.motherName}
                        onChange={(e) => setFormData({
                          ...formData,
                          parentInfo: { ...formData.parentInfo, motherName: e.target.value }
                        })}
                        className="input-field"
                        placeholder="Enter mother's name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Mother's Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.parentInfo.motherPhone}
                        onChange={(e) => setFormData({
                          ...formData,
                          parentInfo: { ...formData.parentInfo, motherPhone: e.target.value }
                        })}
                        className="input-field"
                        placeholder="Enter mother's phone"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Guardian Name
                      </label>
                      <input
                        type="text"
                        value={formData.parentInfo.guardianName}
                        onChange={(e) => setFormData({
                          ...formData,
                          parentInfo: { ...formData.parentInfo, guardianName: e.target.value }
                        })}
                        className="input-field"
                        placeholder="Enter guardian's name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Guardian Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.parentInfo.guardianPhone}
                        onChange={(e) => setFormData({
                          ...formData,
                          parentInfo: { ...formData.parentInfo, guardianPhone: e.target.value }
                        })}
                        className="input-field"
                        placeholder="Enter guardian's phone"
                      />
                    </div>
                  </div>
                </div>

                {/* Academic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                    <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
                    Academic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Institute Type *
                      </label>
                      <select
                        required
                        value={formData.academicInfo.instituteType}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            academicInfo: { 
                              ...formData.academicInfo, 
                              instituteType: e.target.value,
                              courseId: '' // Reset course when institute type changes
                            }
                          });
                          setSelectedCategoryId(''); // Reset category when institute type changes
                        }}
                        className="input-field"
                      >
                        <option value="school">School</option>
                        <option value="college">College</option>
                        <option value="academy">Academy</option>
                        <option value="short_course">Short Course</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Category *
                      </label>
                      <select
                        required
                        value={selectedCategoryId}
                        onChange={(e) => {
                          setSelectedCategoryId(e.target.value);
                          // Reset course selection when category changes
                          setFormData({
                            ...formData,
                            academicInfo: { ...formData.academicInfo, courseId: '' }
                          });
                        }}
                        className="input-field"
                      >
                        <option value="">Select a category</option>
                        {categories
                          .filter(cat => !formData.academicInfo.instituteType || cat.instituteType === formData.academicInfo.instituteType)
                          .map((category) => (
                            <option key={category._id} value={category._id}>
                              {category.name}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Course *
                      </label>
                      <select
                        required
                        value={formData.academicInfo.courseId}
                        onChange={(e) => setFormData({
                          ...formData,
                          academicInfo: { ...formData.academicInfo, courseId: e.target.value }
                        })}
                        className="input-field"
                        disabled={!selectedCategoryId}
                      >
                        <option value="">
                          {selectedCategoryId ? 'Select a course' : 'Select a category first'}
                        </option>
                        {filteredCourses.map((course) => (
                          <option key={course._id} value={course._id}>
                            {course.name}
                          </option>
                        ))}
                      </select>
                      {!selectedCategoryId && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Please select a category first
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Session
                      </label>
                      <input
                        type="text"
                        value={formData.academicInfo.session}
                        onChange={(e) => setFormData({
                          ...formData,
                          academicInfo: { ...formData.academicInfo, session: e.target.value }
                        })}
                        className="input-field"
                        placeholder="e.g., 2024-2025"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Status
                      </label>
                      <select
                        value={formData.academicInfo.status}
                        onChange={(e) => setFormData({
                          ...formData,
                          academicInfo: { ...formData.academicInfo, status: e.target.value }
                        })}
                        className="input-field"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="graduated">Graduated</option>
                        <option value="transferred">Transferred</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Fee Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                    <div className="w-1 h-6 bg-gradient-to-b from-yellow-500 to-orange-500 rounded-full"></div>
                    Fee Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Admission Fee
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.feeInfo.admissionFee}
                        onChange={(e) => {
                          const admissionFee = parseFloat(e.target.value) || 0;
                          const totalFee = formData.feeInfo.totalFee;
                          const paidFee = formData.feeInfo.paidFee;
                          const pendingFee = totalFee - paidFee;
                          const remainingFee = totalFee + admissionFee - paidFee;
                          setFormData({
                            ...formData,
                            feeInfo: { 
                              ...formData.feeInfo, 
                              admissionFee,
                              pendingFee,
                              remainingFee
                            }
                          });
                        }}
                        className="input-field"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Total Fee
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.feeInfo.totalFee}
                        onChange={(e) => {
                          const totalFee = parseFloat(e.target.value) || 0;
                          const paidFee = formData.feeInfo.paidFee;
                          const admissionFee = formData.feeInfo.admissionFee;
                          const pendingFee = totalFee - paidFee;
                          const remainingFee = totalFee + admissionFee - paidFee;
                          setFormData({
                            ...formData,
                            feeInfo: { 
                              ...formData.feeInfo, 
                              totalFee,
                              pendingFee,
                              remainingFee
                            }
                          });
                        }}
                        className="input-field"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Paid Fee
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.feeInfo.paidFee}
                        onChange={(e) => {
                          const paidFee = parseFloat(e.target.value) || 0;
                          const totalFee = formData.feeInfo.totalFee;
                          const admissionFee = formData.feeInfo.admissionFee;
                          const pendingFee = totalFee - paidFee;
                          const remainingFee = totalFee + admissionFee - paidFee;
                          setFormData({
                            ...formData,
                            feeInfo: { 
                              ...formData.feeInfo, 
                              paidFee,
                              pendingFee,
                              remainingFee
                            }
                          });
                        }}
                        className="input-field"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Pending Fee
                      </label>
                      <input
                        type="text"
                        value={`${(formData.feeInfo.pendingFee || 0).toFixed(2)}`}
                        className="input-field bg-gray-50 dark:bg-gray-700"
                        readOnly
                        placeholder="Auto-calculated"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Total Fee - Paid Fee
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Remaining Fee
                      </label>
                      <input
                        type="text"
                        value={`${(formData.feeInfo.remainingFee || 0).toFixed(2)}`}
                        className="input-field bg-gray-50 dark:bg-gray-700"
                        readOnly
                        placeholder="Auto-calculated"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Total Fee + Admission Fee - Paid Fee
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingStudent(null);
                      resetForm();
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={studentMutation.isLoading}
                    className="btn-primary"
                  >
                    {studentMutation.isLoading ? 'Saving...' : editingStudent ? 'Update Student' : 'Create Student'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Print Admission Form */}
      {printStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full my-8">
            <StudentAdmissionPrint 
              student={printStudent} 
              onClose={() => setPrintStudent(null)} 
            />
          </div>
        </div>
      )}

      {/* Error Correction Modal */}
      {showErrorCorrection && studentForErrorCorrection && (
        <ErrorCorrection
          student={studentForErrorCorrection}
          onClose={() => {
            setShowErrorCorrection(false);
            setStudentForErrorCorrection(null);
          }}
        />
      )}

      {/* Edit Password Modal */}
      {showPasswordModal && selectedStudent && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPasswordModal(false);
              setSelectedStudent(null);
              setPasswordForm({ newPassword: '', confirmPassword: '' });
            }
          }}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Lock className="w-6 h-6" />
                  Edit Student Password
                </h2>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setSelectedStudent(null);
                    setPasswordForm({ newPassword: '', confirmPassword: '' });
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Student:</strong> {selectedStudent.personalInfo?.fullName || 'N/A'}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                  Email: {selectedStudent.userId?.email || 'N/A'}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-300">
                  Serial No: {selectedStudent.srNo || 'N/A'}
                </p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      required
                      minLength={6}
                      className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Must be at least 6 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm New Password *
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    required
                    minLength={6}
                    className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Confirm new password"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setSelectedStudent(null);
                      setPasswordForm({ newPassword: '', confirmPassword: '' });
                    }}
                    className="px-6 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={changePasswordMutation.isLoading}
                    className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold"
                  >
                    <Lock className="w-4 h-4" />
                    {changePasswordMutation.isLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;

