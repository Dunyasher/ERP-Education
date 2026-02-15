import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { X, Save, AlertTriangle, User, DollarSign, Edit } from 'lucide-react';

const ErrorCorrection = ({ student, onClose, showOverlay = true }) => {
  const queryClient = useQueryClient();
  const modalRef = useRef(null);
  const [errorType, setErrorType] = useState('admission'); // 'admission' or 'fee'
  const [corrections, setCorrections] = useState({
    // Admission corrections
    personalInfo: {
      fullName: student?.personalInfo?.fullName || '',
      dateOfBirth: student?.personalInfo?.dateOfBirth ? new Date(student.personalInfo.dateOfBirth).toISOString().split('T')[0] : '',
      gender: student?.personalInfo?.gender || 'male'
    },
    contactInfo: {
      phone: student?.contactInfo?.phone || '',
      email: student?.contactInfo?.email || '',
      address: {
        street: student?.contactInfo?.address?.street || '',
        city: student?.contactInfo?.address?.city || '',
        state: student?.contactInfo?.address?.state || '',
        country: student?.contactInfo?.address?.country || 'Pakistan'
      }
    },
    parentInfo: {
      fatherName: student?.parentInfo?.fatherName || '',
      fatherPhone: student?.parentInfo?.fatherPhone || '',
      motherName: student?.parentInfo?.motherName || ''
    },
    academicInfo: {
      courseId: student?.academicInfo?.courseId?._id || student?.academicInfo?.courseId || '',
      session: student?.academicInfo?.session || '',
      status: student?.academicInfo?.status || 'active'
    },
    // Fee corrections
    totalFee: student?.feeInfo?.totalFee || 0,
    paidFee: student?.feeInfo?.paidFee || 0,
    feeStructureId: student?.feeInfo?.feeStructureId || ''
  });

  const correctionMutation = useMutation(
    async (data) => {
      return api.put('/accountant/correct-error', {
        type: errorType,
        studentId: student._id,
        corrections: data
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('students');
        queryClient.invalidateQueries('accountantStats');
        toast.success('Error corrected successfully!');
        onClose();
      },
      onError: (error) => {
        const errorMessage = error.response?.data?.message || 
                           error.response?.data?.error || 
                           error.message || 
                           'Failed to correct error';
        toast.error(errorMessage);
      }
    }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const correctionData = errorType === 'admission' 
      ? {
          personalInfo: corrections.personalInfo,
          contactInfo: corrections.contactInfo,
          parentInfo: corrections.parentInfo,
          academicInfo: corrections.academicInfo
        }
      : {
          totalFee: parseFloat(corrections.totalFee) || 0,
          paidFee: parseFloat(corrections.paidFee) || 0,
          feeStructureId: corrections.feeStructureId
        };

    correctionMutation.mutate(correctionData);
  };

  const handleInputChange = (e, section = null, subsection = null) => {
    const { name, value } = e.target;
    
    if (section && subsection) {
      setCorrections(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [subsection]: {
            ...prev[section][subsection],
            [name]: value
          }
        }
      }));
    } else if (section) {
      setCorrections(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [name]: value
        }
      }));
    } else {
      setCorrections(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  return (
    <>
      {showOverlay && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-1 xs:p-2 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          <div 
            ref={modalRef}
            className="bg-white dark:bg-gray-800 rounded-lg xs:rounded-xl shadow-2xl w-full max-w-xs xs:max-w-sm sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[98vh] xs:max-h-[95vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white p-3 xs:p-4 sm:p-6 rounded-t-lg xs:rounded-t-xl">
              <div className="flex justify-between items-center gap-2">
                <div className="flex items-center gap-2 xs:gap-3 flex-1 min-w-0">
                  <AlertTriangle className="w-5 h-5 xs:w-6 xs:h-6 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold truncate">Error Correction</h2>
                    <p className="text-xs xs:text-sm text-orange-100 mt-1 truncate">
                      {student?.personalInfo?.fullName} - {student?.srNo}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 xs:p-2 rounded-full hover:bg-white/20 transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4 xs:w-5 xs:h-5" />
                </button>
              </div>
            </div>

            {/* Error Type Selection */}
            <div className="p-3 xs:p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col xs:flex-row gap-2 xs:gap-4">
                <button
                  type="button"
                  onClick={() => setErrorType('admission')}
                  className={`px-3 xs:px-4 py-2 rounded-lg font-semibold text-xs xs:text-sm transition-all flex items-center justify-center gap-2 ${
                    errorType === 'admission'
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <User className="w-3 h-3 xs:w-4 xs:h-4" />
                  <span>Admission Data</span>
                </button>
                <button
                  type="button"
                  onClick={() => setErrorType('fee')}
                  className={`px-3 xs:px-4 py-2 rounded-lg font-semibold text-xs xs:text-sm transition-all flex items-center justify-center gap-2 ${
                    errorType === 'fee'
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <DollarSign className="w-3 h-3 xs:w-4 xs:h-4" />
                  <span>Fee Data</span>
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-3 xs:p-4 sm:p-6 space-y-4 xs:space-y-5 sm:space-y-6">
              {errorType === 'admission' ? (
                <>
                  {/* Personal Info */}
                  <div className="space-y-3 xs:space-y-4">
                    <h3 className="text-base xs:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <User className="w-4 h-4 xs:w-5 xs:h-5" />
                      <span>Personal Information</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xs:gap-4">
                      <div>
                        <label className="block text-xs xs:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 xs:mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          name="fullName"
                          value={corrections.personalInfo.fullName}
                          onChange={(e) => handleInputChange(e, 'personalInfo')}
                          required
                          className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-2 xs:px-3 py-1.5 xs:py-2.5 text-sm xs:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs xs:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 xs:mb-2">
                          Date of Birth *
                        </label>
                        <input
                          type="date"
                          name="dateOfBirth"
                          value={corrections.personalInfo.dateOfBirth}
                          onChange={(e) => handleInputChange(e, 'personalInfo')}
                          required
                          className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-2 xs:px-3 py-1.5 xs:py-2.5 text-sm xs:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Phone
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={corrections.contactInfo.phone}
                          onChange={(e) => handleInputChange(e, 'contactInfo')}
                          className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={corrections.contactInfo.email}
                          onChange={(e) => handleInputChange(e, 'contactInfo')}
                          className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Street
                        </label>
                        <input
                          type="text"
                          name="street"
                          value={corrections.contactInfo.address.street}
                          onChange={(e) => handleInputChange(e, 'contactInfo', 'address')}
                          className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          City
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={corrections.contactInfo.address.city}
                          onChange={(e) => handleInputChange(e, 'contactInfo', 'address')}
                          className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Parent Info */}
                  <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Parent Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Father's Name
                        </label>
                        <input
                          type="text"
                          name="fatherName"
                          value={corrections.parentInfo.fatherName}
                          onChange={(e) => handleInputChange(e, 'parentInfo')}
                          className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Father's Phone
                        </label>
                        <input
                          type="tel"
                          name="fatherPhone"
                          value={corrections.parentInfo.fatherPhone}
                          onChange={(e) => handleInputChange(e, 'parentInfo')}
                          className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Fee Corrections */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Fee Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Total Fee *
                        </label>
                        <input
                          type="number"
                          name="totalFee"
                          value={corrections.totalFee}
                          onChange={handleInputChange}
                          required
                          min="0"
                          step="0.01"
                          className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Paid Fee *
                        </label>
                        <input
                          type="number"
                          name="paidFee"
                          value={corrections.paidFee}
                          onChange={handleInputChange}
                          required
                          min="0"
                          step="0.01"
                          className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        <strong>Note:</strong> Changing fee amounts will update the student's fee records. 
                        Pending fee will be automatically recalculated.
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col xs:flex-row justify-end gap-2 xs:gap-3 pt-3 xs:pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full xs:w-auto px-4 xs:px-6 py-2 xs:py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all font-semibold text-sm xs:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={correctionMutation.isLoading}
                  className="w-full xs:w-auto px-4 xs:px-6 py-2 xs:py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold text-sm xs:text-base shadow-lg"
                >
                  <Save className="w-4 h-4 xs:w-5 xs:h-5" />
                  {correctionMutation.isLoading ? 'Correcting...' : 'Correct Error'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ErrorCorrection;

