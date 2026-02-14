import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Search, Users, Eye, Printer, X } from 'lucide-react';
import StudentAdmissionPrint from '../../components/StudentAdmissionPrint';

const Students = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [printStudent, setPrintStudent] = useState(null);
  const [emailError, setEmailError] = useState('');
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    personalInfo: {
      fullName: '',
      dateOfBirth: '',
      gender: 'male'
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
      motherPhone: ''
    },
    academicInfo: {
      instituteType: 'college',
      courseId: '',
      session: '',
      status: 'active'
    },
    feeInfo: {
      totalFee: 0,
      paidFee: 0
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
        gender: 'male'
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
        motherPhone: ''
      },
      academicInfo: {
        instituteType: 'college',
        courseId: '',
        session: '',
        status: 'active'
      },
      feeInfo: {
        totalFee: 0,
        paidFee: 0
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
      feeInfo: student.feeInfo || {}
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

  // Filter students based on search
  const filteredStudents = students.filter(student => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      student.personalInfo?.fullName?.toLowerCase().includes(searchLower) ||
      student.srNo?.toLowerCase().includes(searchLower) ||
      student.admissionNo?.toLowerCase().includes(searchLower) ||
      student.userId?.email?.toLowerCase().includes(searchLower) ||
      student.parentInfo?.fatherName?.toLowerCase().includes(searchLower) ||
      student.academicInfo?.courseId?.name?.toLowerCase().includes(searchLower)
    );
  });

  if (isLoading) {
    return <div className="text-center py-12">Loading students...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Students Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage all students in the system
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingStudent(null);
            resetForm();
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Student
        </button>
      </div>

      {/* Search Bar */}
      <div className="card animate-fade-in">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5 z-10" />
          <input
            type="text"
            placeholder="Search by name, father's name, serial number, admission number, course, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-12"
          />
        </div>
      </div>

      {/* Students Table */}
      <div className="card overflow-x-auto animate-slide-up">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                SR NO
              </th>
              <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                STUDENT NAME
              </th>
              <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                F/NAME
              </th>
              <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                COURSE
              </th>
              <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                INVOICE NO
              </th>
              <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                TOTAL FEE
              </th>
              <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                TOTAL PAID FEE
              </th>
              <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                REMAINING FEE
              </th>
              <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                STATUS
              </th>
              <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                DATE
              </th>
              <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                ADMITTED BY
              </th>
              <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan="12" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No students found</p>
                  {searchTerm && <p className="text-sm mt-2">Try adjusting your search</p>}
                </td>
              </tr>
            ) : (
              filteredStudents.map((student) => {
                const latestInvoice = getLatestInvoice(student._id);
                const totalFee = student.feeInfo?.totalFee || latestInvoice?.totalAmount || 0;
                const paidFee = student.feeInfo?.paidFee || latestInvoice?.paidAmount || 0;
                const remainingFee = student.feeInfo?.pendingFee || latestInvoice?.pendingAmount || (totalFee - paidFee);
                const admissionDate = student.academicInfo?.admissionDate || student.createdAt;
                
                return (
                  <tr key={student._id} className="table-row">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {student.srNo || 'N/A'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {student.personalInfo?.fullName || 'N/A'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {student.parentInfo?.fatherName || 'N/A'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {student.academicInfo?.courseId?.name || 'Not Assigned'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {latestInvoice?.invoiceNo || 'N/A'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">
                      {formatCurrency(totalFee)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400 font-medium">
                      {formatCurrency(paidFee)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-red-600 dark:text-red-400 font-medium">
                      {formatCurrency(remainingFee)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={
                        student.academicInfo?.status === 'active' 
                          ? 'badge-success'
                          : student.academicInfo?.status === 'inactive'
                          ? 'badge bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          : 'badge-warning'
                      }>
                        {student.academicInfo?.status || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(admissionDate)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 font-medium">
                      {student.academicInfo?.admittedByName || 'N/A'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={async () => {
                            try {
                              const fullStudent = await api.get(`/students/${student._id}`);
                              setPrintStudent(fullStudent.data);
                            } catch (error) {
                              toast.error('Failed to load student data for printing');
                              console.error('Error fetching student:', error);
                            }
                          }}
                          className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors duration-200 shadow-sm hover:shadow-md"
                          title="Print Admission Form"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(student)}
                          className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors duration-200 shadow-sm hover:shadow-md"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(student)}
                          className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors duration-200 shadow-sm hover:shadow-md"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-slide-up border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {editingStudent ? 'Edit Student' : 'Add New Student'}
                </h2>
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

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                    <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Full Name *
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
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.contactInfo.phone}
                        onChange={(e) => setFormData({
                          ...formData,
                          contactInfo: { ...formData.contactInfo, phone: e.target.value }
                        })}
                        className="input-field"
                      />
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
                        Total Fee
                      </label>
                      <input
                        type="number"
                        value={formData.feeInfo.totalFee}
                        onChange={(e) => setFormData({
                          ...formData,
                          feeInfo: { ...formData.feeInfo, totalFee: parseFloat(e.target.value) || 0 }
                        })}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Paid Fee
                      </label>
                      <input
                        type="number"
                        value={formData.feeInfo.paidFee}
                        onChange={(e) => setFormData({
                          ...formData,
                          feeInfo: { ...formData.feeInfo, paidFee: parseFloat(e.target.value) || 0 }
                        })}
                        className="input-field"
                      />
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
    </div>
  );
};

export default Students;

