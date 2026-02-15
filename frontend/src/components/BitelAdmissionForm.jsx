import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { X, Save, Printer, User, Phone, MapPin, DollarSign, BookOpen } from 'lucide-react';

const BitelAdmissionForm = ({ onClose, onSuccess, editingStudent = null, showOverlay = true }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const modalRef = useRef(null);
  const [formData, setFormData] = useState({
    serialNo: '',
    name: '',
    fatherName: '',
    contact: '',
    address: '',
    selectedCourse: '',
    admissionFee: '',
    monthlyFee: '',
    totalFee: '',
    paidFee: '',
    remainingBalance: ''
  });

  // Fetch courses
  const { data: courses = [], isLoading: coursesLoading } = useQuery('courses', async () => {
    const response = await api.get('/courses');
    return response.data;
  });

  // Fetch next serial number
  const { data: serialData } = useQuery('nextSerial', async () => {
    try {
      const response = await api.get('/students/next-serial');
      return response.data;
    } catch (error) {
      console.error('Error fetching next serial:', error);
      return { nextSerial: 'A1', nextNumber: 1 };
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
      setFormData({
        serialNo: editingStudent.srNo?.replace('STU-', '') || '',
        name: editingStudent.personalInfo?.fullName || '',
        fatherName: editingStudent.parentInfo?.fatherName || '',
        contact: editingStudent.contactInfo?.phone || '',
        address: editingStudent.contactInfo?.address ? 
          `${editingStudent.contactInfo.address.street || ''}, ${editingStudent.contactInfo.address.city || ''}, ${editingStudent.contactInfo.address.state || ''}`.trim() : '',
        selectedCourse: editingStudent.academicInfo?.courseId?.name || editingStudent.academicInfo?.courseId || '',
        admissionFee: editingStudent.feeInfo?.admissionFee || '',
        monthlyFee: editingStudent.feeInfo?.monthlyFee || '',
        totalFee: editingStudent.feeInfo?.totalFee || '',
        paidFee: editingStudent.feeInfo?.paidFee || '',
        remainingBalance: (parseFloat(editingStudent.feeInfo?.totalFee || 0) - parseFloat(editingStudent.feeInfo?.paidFee || 0)).toFixed(2) || '0.00'
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
      onSuccess: (response, variables) => {
        queryClient.invalidateQueries('students');
        queryClient.invalidateQueries('adminStats');
        queryClient.invalidateQueries('classes');
        queryClient.invalidateQueries('nextSerial');
        
        const courseId = variables._courseId || variables.academicInfo?.courseId || response.data?.academicInfo?.courseId;
        const courseName = variables._courseName || response.data?.academicInfo?.courseId?.name || 'the class';
        
        if (onSuccess) onSuccess(response.data);
        onClose();
        
        if (courseId) {
          toast.success(`Student ${editingStudent ? 'updated' : 'admitted'} successfully!`, {
            duration: 2000
          });
          setTimeout(() => {
            navigate(`/admin/classes?courseId=${courseId}`, { 
              state: { 
                courseName: courseName,
                autoSelect: true 
              } 
            });
          }, 1200);
        } else {
          toast.success(`Student ${editingStudent ? 'updated' : 'admitted'} successfully!`);
          navigate('/admin/classes');
        }
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
    let selectedCourse = courses.find(c => 
      c.name.toLowerCase().trim() === formData.selectedCourse.toLowerCase().trim()
    );
    
    if (!selectedCourse) {
      selectedCourse = courses.find(c => 
        c.name.toLowerCase().includes(formData.selectedCourse.toLowerCase()) ||
        formData.selectedCourse.toLowerCase().includes(c.name.toLowerCase())
      );
    }
    
    if (!selectedCourse) {
      toast.error(`Course "${formData.selectedCourse}" not found. Please create this course first.`);
      return;
    }

    // Prepare student data
    const studentData = {
      email: editingStudent?.userId?.email || `${formData.name.toLowerCase().replace(/\s+/g, '.')}@bitel.edu`,
      password: editingStudent ? undefined : 'password123',
      personalInfo: {
        fullName: formData.name,
        dateOfBirth: new Date().toISOString().split('T')[0],
        gender: 'male'
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
      parentInfo: {
        fatherName: formData.fatherName
      },
      academicInfo: {
        instituteType: 'academy',
        courseId: selectedCourse._id,
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
      `}</style>

      {/* Conditional Overlay */}
      {showOverlay && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          {/* Modal Content - Dark Theme */}
          <div 
            ref={modalRef}
            className={`${showOverlay ? 'bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto' : 'w-full'} admission-form-print`}
            onClick={(e) => e.stopPropagation()}
          >
        {/* Header - Dark Theme */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-4 sm:p-6 rounded-t-xl border-b border-gray-700">
            <div className="flex justify-between items-center">
              <h2 className="text-xl sm:text-2xl font-bold">Student Admission Form</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            </div>

          {/* Form Content - Dark Theme */}
          <div className="p-4 sm:p-6 bg-gray-900 dark:bg-gray-800">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Student Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-400" />
                  Student Information
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Serial Number - Auto-generated */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Serial Number
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-blue-400 font-bold text-lg">A</span>
                      <input
                        type="text"
                        name="serialNo"
                        value={formData.serialNo}
                        readOnly
                        className="flex-1 border-2 border-gray-600 rounded-lg px-3 py-2.5 bg-gray-800 text-gray-200 font-semibold"
                        placeholder="Auto-generated"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">(Auto-generated)</p>
                  </div>

                  {/* Student Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Student Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full border-2 border-gray-600 rounded-lg px-3 py-2.5 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-gray-500"
                      placeholder="Enter full name"
                    />
                  </div>

                  {/* Father's Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Father's Name *
                    </label>
                    <input
                      type="text"
                      name="fatherName"
                      value={formData.fatherName}
                      onChange={handleInputChange}
                      required
                      className="w-full border-2 border-gray-600 rounded-lg px-3 py-2.5 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-gray-500"
                      placeholder="Enter father's name"
                    />
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-1">
                      <Phone className="w-4 h-4 text-blue-400" />
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="contact"
                      value={formData.contact}
                      onChange={handleInputChange}
                      required
                      className="w-full border-2 border-gray-600 rounded-lg px-3 py-2.5 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-gray-500"
                      placeholder="0333-1234567"
                    />
                  </div>

                  {/* Address - Full Width */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-blue-400" />
                      Address *
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      rows="3"
                      className="w-full border-2 border-gray-600 rounded-lg px-3 py-2.5 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none placeholder-gray-500"
                      placeholder="Street, City, State, Country"
                    />
                  </div>

                  {/* Course Selection - Full Width */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-1">
                      <BookOpen className="w-4 h-4 text-blue-400" />
                      Course *
                    </label>
                <select
                  name="selectedCourse"
                  value={formData.selectedCourse}
                  onChange={handleInputChange}
                  required
                  disabled={coursesLoading}
                      className="w-full border-2 border-gray-600 rounded-lg px-3 py-2.5 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                  </div>
                </div>
              </div>

              {/* Fee Information */}
              <div className="space-y-4 border-t border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  Fee Information
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Admission Fee */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
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
                      className="w-full border-2 border-gray-600 rounded-lg px-3 py-2.5 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-gray-500"
                      placeholder="0.00"
                    />
                  </div>

                  {/* Monthly Fee */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
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
                      className="w-full border-2 border-gray-600 rounded-lg px-3 py-2.5 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-gray-500"
                      placeholder="0.00"
                    />
                  </div>

                  {/* Total Fee - Auto-calculated */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Total Fee
                    </label>
                    <input
                      type="text"
                      name="totalFee"
                      value={formData.totalFee || '0.00'}
                      readOnly
                      className="w-full border-2 border-gray-600 rounded-lg px-3 py-2.5 bg-gray-800 font-semibold text-gray-200"
                    />
                  </div>

                  {/* Paid Fee */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
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
                      className="w-full border-2 border-gray-600 rounded-lg px-3 py-2.5 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-gray-500"
                      placeholder="0.00"
                    />
                  </div>

                  {/* Remaining Balance - Auto-calculated */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Remaining Balance
                    </label>
                    <input
                      type="text"
                      name="remainingBalance"
                      value={formData.remainingBalance || '0.00'}
                      readOnly
                      className={`w-full border-2 border-gray-600 rounded-lg px-3 py-2.5 bg-gray-800 font-semibold ${
                        parseFloat(formData.remainingBalance || 0) > 0 
                          ? 'text-orange-400' 
                          : parseFloat(formData.remainingBalance || 0) < 0
                          ? 'text-red-400'
                          : 'text-gray-200'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons - Dark Theme */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-700 no-print">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-6 py-3 border-2 border-blue-400 text-blue-400 rounded-lg hover:bg-blue-400 hover:text-white transition-all flex items-center justify-center gap-2 font-semibold"
                >
                  <Printer className="w-5 h-5" />
                  Print
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 border-2 border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-all font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createStudentMutation.isLoading || coursesLoading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold shadow-lg hover:shadow-xl"
                >
                  <Save className="w-5 h-5" />
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

export default BitelAdmissionForm;
