import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/hooks';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Plus, Save, X, DollarSign, Download, Trash2, UserPlus } from 'lucide-react';
import BitelAdmissionForm from '../../components/BitelAdmissionForm';

const FeeManagement = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth(); // Get current logged-in user
  const [formData, setFormData] = useState({
    courseId: '',
    studentId: '',
    admissionFee: '',
    booksMaterials: '',
    totalFee: '',
    totalPaidFee: '',
    remainingFee: '',
    discount: 0,
    notes: ''
  });
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showAdmissionForm, setShowAdmissionForm] = useState(true); // Show by default when page loads

  // Fetch students
  const { data: studentsData, error: studentsError } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      try {
        const response = await api.get('/students');
        return response.data;
      } catch (error) {
        if (error.response?.status === 401) {
          toast.error('Session expired. Please login again.');
          window.location.href = '/login';
        }
        throw error;
      }
    },
    retry: 1,
    onError: (error) => {
      if (error.response?.status !== 401) {
        toast.error('Failed to load students. Please try again.');
      }
    }
  });

  // Fetch courses
  const { data: coursesData } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      try {
        const response = await api.get('/courses');
        return response.data;
      } catch (error) {
        console.error('Error fetching courses:', error);
        return [];
      }
    }
  });

  useEffect(() => {
    if (studentsData) {
      setStudents(studentsData);
    }
  }, [studentsData]);

  useEffect(() => {
    if (coursesData) {
      setCourses(coursesData);
    }
  }, [coursesData]);

  // Filter students by selected course
  const filteredStudents = formData.courseId
    ? students.filter(student => {
        const studentCourseId = student.academicInfo?.courseId?._id || student.academicInfo?.courseId;
        return studentCourseId?.toString() === formData.courseId;
      })
    : students;

  // Get values from form
  const admissionFee = parseFloat(formData.admissionFee) || 0;
  const booksMaterials = parseFloat(formData.booksMaterials) || 0;
  const totalFee = parseFloat(formData.totalFee) || 0;
  const totalPaidFee = parseFloat(formData.totalPaidFee) || 0;
  const discount = parseFloat(formData.discount) || 0;
  const remainingFee = parseFloat(formData.remainingFee) || 0;

  // Fetch selected student details
  useEffect(() => {
    if (formData.studentId) {
      const student = filteredStudents.find(s => s._id === formData.studentId);
      setSelectedStudent(student);
      if (student) {
        setFormData(prev => ({
          ...prev,
          admissionFee: '',
          booksMaterials: '',
          totalFee: '',
          totalPaidFee: student.feeInfo?.paidFee || 0,
          remainingFee: ''
        }));
      }
    }
  }, [formData.studentId, filteredStudents]);

  // Reset student selection when course changes
  useEffect(() => {
    if (formData.courseId) {
      setFormData(prev => ({
        ...prev,
        studentId: ''
      }));
      setSelectedStudent(null);
    }
  }, [formData.courseId]);

  // Create invoice mutation
  const createInvoiceMutation = useMutation(
    async (data) => {
      const response = await api.post('/fees/invoices', data);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Fee invoice created successfully!');
        queryClient.invalidateQueries({ queryKey: ['students'] });
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
        setShowForm(false);
        setFormData({
          courseId: '',
          studentId: '',
          admissionFee: '',
          booksMaterials: '',
          totalFee: '',
          totalPaidFee: '',
          remainingFee: '',
          discount: 0,
          notes: ''
        });
      },
      onError: (error) => {
        if (error.response?.status === 401) {
          toast.error('Session expired. Please login again.');
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        } else if (error.response?.status === 403) {
          toast.error('You do not have permission to perform this action.');
        } else {
          toast.error(error.response?.data?.message || 'Failed to create invoice. Please try again.');
        }
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.courseId) {
      toast.error('Please select a course');
      return;
    }
    
    if (!formData.studentId) {
      toast.error('Please select a student');
      return;
    }

    if (!formData.admissionFee || !formData.booksMaterials || !formData.totalFee || !formData.totalPaidFee || !formData.remainingFee) {
      toast.error('Please fill all required fields');
      return;
    }

    const invoiceData = {
      studentId: formData.studentId,
      items: [
        {
          description: 'Admission Fee',
          amount: parseFloat(formData.admissionFee),
          quantity: 1
        },
        {
          description: 'Books/Materials',
          amount: parseFloat(formData.booksMaterials),
          quantity: 1
        }
      ],
      discount: discount,
      subtotal: parseFloat(formData.admissionFee) + parseFloat(formData.booksMaterials),
      totalAmount: parseFloat(formData.totalFee) - discount,
      paidAmount: totalPaidFee,
      pendingAmount: remainingFee,
      status: remainingFee <= 0 ? 'paid' : remainingFee < totalFee ? 'partial' : 'pending',
      notes: formData.notes,
      collectedBy: user?.id // Track who collected the fee (current user)
    };

    createInvoiceMutation.mutate(invoiceData);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Admission
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage student admissions, fees and generate invoices
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAdmissionForm(true)}
            className="btn-secondary flex items-center space-x-2"
          >
            <UserPlus size={20} />
            <span>Add New Student</span>
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Create Fee</span>
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-green-600 dark:text-green-400">
              Fee Details
            </h2>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Course Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Course *
              </label>
              <select
                name="courseId"
                value={formData.courseId}
                onChange={handleInputChange}
                required
                className="input-field"
              >
                <option value="">Select a course</option>
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Student Selection (filtered by course) */}
            {formData.courseId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Student *
                </label>
                <select
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                  disabled={!formData.courseId}
                >
                  <option value="">Select a student</option>
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                      <option key={student._id} value={student._id}>
                        {student.srNo} - {student.personalInfo?.fullName}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No students found in this course</option>
                  )}
                </select>
                {filteredStudents.length === 0 && formData.courseId && (
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                    No students are enrolled in this course yet.
                  </p>
                )}
              </div>
            )}

            {/* Fee Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Admission Fee */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                    className="input-field"
                    placeholder="0.00"
                  />
                </div>

                {/* Total Fee (G) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Total Fee (G) *
                  </label>
                  <input
                    type="number"
                    name="totalFee"
                    value={formData.totalFee}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="input-field"
                    placeholder="0.00"
                  />
                </div>

                {/* Total Paid Fee */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                    className="input-field"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Books/Materials */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Books/Materials *
                  </label>
                  <input
                    type="number"
                    name="booksMaterials"
                    value={formData.booksMaterials}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="input-field"
                    placeholder="0.00"
                  />
                </div>

                {/* Discount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Discount
                  </label>
                  <input
                    type="number"
                    name="discount"
                    value={formData.discount}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="input-field"
                    placeholder="0.00"
                  />
                </div>

                {/* Remaining Fee */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Remaining Fee *
                  </label>
                  <input
                    type="number"
                    name="remainingFee"
                    value={formData.remainingFee}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="input-field"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="input-field"
                placeholder="Additional notes..."
              />
            </div>

            {/* Summary Card */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center space-x-2 mb-3">
                <DollarSign className="text-blue-600 dark:text-blue-400" size={20} />
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">Fee Summary</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Admission Fee</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {admissionFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Books/Materials</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {booksMaterials.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Total Paid</p>
                  <p className="font-semibold text-green-600 dark:text-green-400">
                    {totalPaidFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Remaining</p>
                  <p className={`font-semibold ${
                    remainingFee > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                  }`}>
                    {remainingFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createInvoiceMutation.isLoading}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50"
              >
                <Save size={20} />
                <span>{createInvoiceMutation.isLoading ? 'Saving...' : 'Save Fee'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* BITEL Admission Form Modal - Dark Theme */}
      {showAdmissionForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 dark:bg-opacity-95">
          <div className="relative w-full max-w-6xl max-h-[95vh] overflow-y-auto bg-gray-900 dark:bg-gray-800 rounded-lg shadow-2xl m-4">
            <div className="sticky top-0 bg-gray-900 dark:bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-white">Add Admission Form</h2>
              <button
                onClick={() => setShowAdmissionForm(false)}
                className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-800"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <BitelAdmissionForm
                showOverlay={false}
                onClose={() => setShowAdmissionForm(false)}
                onSuccess={(studentData) => {
                  // Refresh students list
                  queryClient.invalidateQueries('students');
                  queryClient.invalidateQueries({ queryKey: ['invoices'] });
                  // Optionally show success message or navigate
                  toast.success('Student admitted successfully!');
                  setShowAdmissionForm(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Fee Invoices List Component
const FeeInvoicesList = () => {
  const queryClient = useQueryClient();

  const { data: invoices, isLoading, error } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      try {
        const response = await api.get('/fees/invoices');
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      }
      throw error;
    }
    },
    retry: 1,
    onError: (error) => {
      if (error.response?.status !== 401) {
        toast.error('Failed to load invoices. Please try again.');
      }
    }
  });

  if (isLoading) {
    return <div className="card text-center py-8">Loading invoices...</div>;
  }

  if (error && error.response?.status === 401) {
    return <div className="card text-center py-8 text-red-600">Please login to view invoices.</div>;
  }

  const handlePayInvoice = async (invoiceId) => {
    const amount = prompt('Enter payment amount:');
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      await api.put(`/fees/invoices/${invoiceId}/pay`, {
        paidAmount: parseFloat(amount),
        paymentMethod: 'cash',
        paymentDate: new Date()
      });
      toast.success('Payment recorded successfully!');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record payment');
    }
  };

  const handleDownloadInvoice = (invoiceId) => {
    toast('Invoice download feature coming soon!');
  };

  const handleDeleteInvoice = async (invoiceId) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) {
      return;
    }

    try {
      await api.delete(`/fees/invoices/${invoiceId}`);
      toast.success('Invoice deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete invoice');
    }
  };

  return (
    <div className="card">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        Fee Invoices
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                SR No
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Student Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                F/Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Course
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Invoice No
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Total Fee
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Total Paid Fee
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Remaining Fee
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {invoices && invoices.length > 0 ? (
              invoices.map((invoice, index) => (
                <tr key={invoice._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {invoice.studentId?.srNo || `#${index + 1}`}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {invoice.studentId?.personalInfo?.fullName || 'N/A'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {invoice.studentId?.parentInfo?.fatherName || 'N/A'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {invoice.studentId?.academicInfo?.courseId?.name || 'N/A'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {invoice.invoiceNo}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                    ${invoice.totalAmount?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">
                    ${invoice.paidAmount?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-red-600 dark:text-red-400">
                    ${invoice.pendingAmount?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      invoice.status === 'paid' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : invoice.status === 'partial'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {invoice.status?.toUpperCase() || 'PENDING'}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(invoice.invoiceDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-3">
                      {invoice.status !== 'paid' && (
                        <button
                          onClick={() => handlePayInvoice(invoice._id)}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                        >
                          Pay
                        </button>
                      )}
                      <button
                        onClick={() => handleDownloadInvoice(invoice._id)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Download Invoice"
                      >
                        <Download size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteInvoice(invoice._id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title="Delete Invoice"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="11" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  No invoices found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FeeManagement;

