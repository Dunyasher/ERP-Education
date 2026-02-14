import { useQuery } from 'react-query';
import api from '../../utils/api';
import { BookOpen, Users, Clock } from 'lucide-react';

const TeacherDashboard = () => {
  const { data: stats, isLoading } = useQuery('teacherStats', async () => {
    const response = await api.get('/dashboard/teacher');
    return response.data;
  });

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Teacher Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome! Manage your courses and students here.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                My Courses
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats?.myCourses?.length || 0}
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
                Total Students
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats?.totalStudents || 0}
              </p>
            </div>
            <div className="bg-green-500 p-4 rounded-lg">
              <Users className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Recent Attendance
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats?.recentAttendance?.length || 0}
              </p>
            </div>
            <div className="bg-purple-500 p-4 rounded-lg">
              <Clock className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            My Courses
          </h2>
          <div className="space-y-3">
            {stats?.myCourses?.length > 0 ? (
              stats.myCourses.map((course) => (
                <div key={course._id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h3 className="font-medium text-gray-900 dark:text-white">{course.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {course.categoryId?.name} • {course.enrolledStudents} students
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No courses assigned yet</p>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Recent Attendance
          </h2>
          <div className="space-y-3">
            {stats?.recentAttendance?.length > 0 ? (
              stats.recentAttendance.map((attendance) => (
                <div key={attendance._id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {attendance.studentId?.personalInfo?.fullName}
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
              <p className="text-gray-500 dark:text-gray-400">No recent attendance records</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;

