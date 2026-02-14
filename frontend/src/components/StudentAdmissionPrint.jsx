import { Printer } from 'lucide-react';

const StudentAdmissionPrint = ({ student, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  if (!student) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="print-container">
      {/* Print Button - Hidden when printing */}
      <div className="no-print mb-4 flex justify-between items-center">
        <button
          onClick={onClose}
          className="btn-secondary"
        >
          Close
        </button>
        <button
          onClick={handlePrint}
          className="btn-primary flex items-center gap-2"
        >
          <Printer className="w-5 h-5" />
          Print Admission Form
        </button>
      </div>

      {/* Print Content */}
      <div className="bg-white p-8 print-content">
        {/* Header */}
        <div className="text-center mb-8 border-b-2 border-gray-300 pb-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            STUDENT ADMISSION FORM
          </h1>
          <p className="text-gray-600">
            Education Management System
          </p>
        </div>

        {/* Admission Information */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
            Admission Information
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Serial Number:</p>
              <p className="font-semibold text-gray-900">{student.srNo || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Admission Number:</p>
              <p className="font-semibold text-gray-900">{student.admissionNo || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Admission Date:</p>
              <p className="font-semibold text-gray-900">
                {formatDate(student.academicInfo?.admissionDate)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Academic Session:</p>
              <p className="font-semibold text-gray-900">
                {student.academicInfo?.session || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
            Personal Information
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Full Name:</p>
              <p className="font-semibold text-gray-900">
                {student.personalInfo?.fullName || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Date of Birth:</p>
              <p className="font-semibold text-gray-900">
                {formatDate(student.personalInfo?.dateOfBirth)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Gender:</p>
              <p className="font-semibold text-gray-900 capitalize">
                {student.personalInfo?.gender || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Blood Group:</p>
              <p className="font-semibold text-gray-900">
                {student.personalInfo?.bloodGroup || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Nationality:</p>
              <p className="font-semibold text-gray-900">
                {student.personalInfo?.nationality || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
            Contact Information
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Email:</p>
              <p className="font-semibold text-gray-900">
                {student.userId?.email || student.contactInfo?.email || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Phone:</p>
              <p className="font-semibold text-gray-900">
                {student.contactInfo?.phone || 'N/A'}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-600">Address:</p>
              <p className="font-semibold text-gray-900">
                {student.contactInfo?.address ? (
                  `${student.contactInfo.address.street || ''}, ${student.contactInfo.address.city || ''}, ${student.contactInfo.address.state || ''}, ${student.contactInfo.address.zipCode || ''}, ${student.contactInfo.address.country || ''}`
                ) : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Parent/Guardian Information */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
            Parent/Guardian Information
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Father's Name:</p>
              <p className="font-semibold text-gray-900">
                {student.parentInfo?.fatherName || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Father's Phone:</p>
              <p className="font-semibold text-gray-900">
                {student.parentInfo?.fatherPhone || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Mother's Name:</p>
              <p className="font-semibold text-gray-900">
                {student.parentInfo?.motherName || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Mother's Phone:</p>
              <p className="font-semibold text-gray-900">
                {student.parentInfo?.motherPhone || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Guardian Name:</p>
              <p className="font-semibold text-gray-900">
                {student.parentInfo?.guardianName || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Guardian Phone:</p>
              <p className="font-semibold text-gray-900">
                {student.parentInfo?.guardianPhone || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Academic Information */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
            Academic Information
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Institute Type:</p>
              <p className="font-semibold text-gray-900 capitalize">
                {student.academicInfo?.instituteType || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Course:</p>
              <p className="font-semibold text-gray-900">
                {student.academicInfo?.courseId?.name || 'Not Assigned'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status:</p>
              <p className="font-semibold text-gray-900 capitalize">
                {student.academicInfo?.status || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Fee Information */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
            Fee Information
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Fee:</p>
              <p className="font-semibold text-gray-900">
                ${student.feeInfo?.totalFee?.toLocaleString() || '0.00'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Paid Fee:</p>
              <p className="font-semibold text-gray-900">
                ${student.feeInfo?.paidFee?.toLocaleString() || '0.00'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Fee:</p>
              <p className="font-semibold text-gray-900">
                ${student.feeInfo?.pendingFee?.toLocaleString() || '0.00'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t-2 border-gray-300">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-sm text-gray-600 mb-2">Student Signature:</p>
              <div className="border-b border-gray-400 h-12"></div>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Authorized Signature:</p>
              <div className="border-b border-gray-400 h-12"></div>
            </div>
          </div>
          <div className="mt-4 text-center text-sm text-gray-500">
            <p>Generated on: {new Date().toLocaleString()}</p>
            <p className="mt-1">This is a computer-generated document.</p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-container {
            margin: 0;
            padding: 0;
          }
          .print-content {
            page-break-inside: avoid;
          }
          body {
            margin: 0;
            padding: 0;
          }
        }
        @media screen {
          .print-content {
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
        }
      `}</style>
    </div>
  );
};

export default StudentAdmissionPrint;

