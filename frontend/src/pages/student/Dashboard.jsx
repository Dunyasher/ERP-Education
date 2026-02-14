import { useQuery } from 'react-query';
import api from '../../utils/api';
import { BookOpen, DollarSign, Clock, CheckCircle } from 'lucide-react';

const StudentDashboard = () => {
  const { data: stats, isLoading } = useQuery('studentStats', async () => {
    const response = await api.get('/dashboard/student');
    return response.data;
  });

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Student Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome! Here's your academic overview.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                My Course
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {stats?.student?.academicInfo?.courseId?.name || 'Not Enrolled'}
              </p>
            </div>
            <div className="bg-blue-500 p-4 rounded-lg">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Pending Fee
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                ${stats?.pendingFee?.toLocaleString() || 0}
              </p>
            </div>
            <div className="bg-yellow-500 p-4 rounded-lg">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Attendance Records
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats?.myAttendance?.length || 0}
              </p>
            </div>
            <div className="bg-green-500 p-4 rounded-lg">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Recent Invoices
          </h2>
          <div className="space-y-3">
            {stats?.myInvoices?.length > 0 ? (
              stats.myInvoices.map((invoice) => (
                <div key={invoice._id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        Invoice #{invoice.invoiceNo}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(invoice.invoiceDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 dark:text-white">
                        ${invoice.totalAmount}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        invoice.status === 'paid'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {invoice.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No invoices found</p>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Recent Attendance
          </h2>
          <div className="space-y-3">
            {stats?.myAttendance?.length > 0 ? (
              stats.myAttendance.map((attendance) => (
                <div key={attendance._id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {attendance.courseId?.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(attendance.date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      attendance.status === 'present' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {attendance.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No attendance records</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;

