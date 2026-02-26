import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './store/hooks';
import { useEffect } from 'react';
import { useAppDispatch } from './store/hooks';
import { checkAuth } from './store/slices/authSlice';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/Dashboard';
import SuperAdminDashboard from './pages/superAdmin/Dashboard';
import TeacherDashboard from './pages/teacher/Dashboard';
import AccountantDashboard from './pages/accountant/Dashboard';
import StudentDashboard from './pages/student/Dashboard';
import StudentAttendance from './pages/student/Attendance';
import StudentFees from './pages/student/Fees';
import MonthlyPayments from './pages/accountant/MonthlyPayments';
import PaymentRecords from './pages/accountant/PaymentRecords';
import FeeManagement from './pages/admin/FeeManagement';
import ExpenseManagement from './pages/admin/ExpenseManagement';
import DailyExpenseReport from './pages/admin/DailyExpenseReport';
import Students from './pages/admin/Students';
import StudentFeeHistory from './pages/admin/StudentFeeHistory';
import StudentDetails from './pages/admin/StudentDetails';
import NewAdmission from './pages/admin/NewAdmission';
import StudentPromotion from './pages/admin/StudentPromotion';
import Teachers from './pages/admin/Teachers';
import StaffManagement from './pages/admin/StaffManagement';
import AccountantManagement from './pages/admin/AccountantManagement';
import Courses from './pages/admin/Courses';
import Reports from './pages/admin/Reports';
import AccountsSummaryReport from './pages/admin/AccountsSummaryReport';
import Classes from './pages/admin/Classes';
import ManualAttendance from './pages/admin/ManualAttendance';
import StaffAttendance from './pages/admin/StaffAttendance';
import AttendanceReports from './pages/admin/AttendanceReports';
import CardScanner from './pages/admin/CardScanner';
import FaceScan from './pages/admin/FaceScan';
import FingerprintScan from './pages/admin/FingerprintScan';
import OnlineClasses from './pages/admin/OnlineClasses';
import IDCardMenu from './pages/admin/IDCardMenu';
import PrintIDCards from './pages/admin/PrintIDCards';
import PrintStaffCards from './pages/admin/PrintStaffCards';
import IDCardSettings from './pages/admin/IDCardSettings';
import PublicMessages from './pages/admin/PublicMessages';
import StudentFeePayment from './pages/admin/StudentFeePayment';
import Settings from './pages/admin/Settings';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

function AppRoutes() {
  const { user, loading } = useAuth();
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to={`/${user.role}/dashboard`} />} />
      
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/super_admin/dashboard" element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/students" element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'accountant']}><Students /></ProtectedRoute>} />
        <Route path="/admin/students/new" element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'accountant']}><NewAdmission /></ProtectedRoute>} />
        <Route path="/admin/students/promotion" element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'accountant']}><StudentPromotion /></ProtectedRoute>} />
        <Route path="/admin/students/:id/details" element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'accountant']}><StudentDetails /></ProtectedRoute>} />
        <Route path="/admin/students/:id/fee-history" element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'accountant']}><StudentFeeHistory /></ProtectedRoute>} />
        <Route path="/admin/fee-payment" element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'accountant']}><StudentFeePayment /></ProtectedRoute>} />
        <Route path="/admin/teachers" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><Teachers /></ProtectedRoute>} />
        <Route path="/admin/staff" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><StaffManagement /></ProtectedRoute>} />
        <Route path="/admin/accountants" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AccountantManagement /></ProtectedRoute>} />
        <Route path="/admin/courses" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><Courses /></ProtectedRoute>} />
        <Route path="/admin/classes" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><Classes /></ProtectedRoute>} />
        <Route path="/admin/attendance/manual" element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'teacher']}><ManualAttendance /></ProtectedRoute>} />
        <Route path="/admin/attendance/staff" element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'teacher']}><StaffAttendance /></ProtectedRoute>} />
        <Route path="/admin/attendance/reports" element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'teacher']}><AttendanceReports /></ProtectedRoute>} />
        <Route path="/admin/card-scanner" element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'teacher']}><CardScanner /></ProtectedRoute>} />
        <Route path="/admin/attendance/face-scan" element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'teacher']}><FaceScan /></ProtectedRoute>} />
        <Route path="/admin/attendance/fingerprint-scan" element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'teacher']}><FingerprintScan /></ProtectedRoute>} />
        <Route path="/admin/online-classes" element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'teacher']}><OnlineClasses /></ProtectedRoute>} />
        <Route path="/admin/id-card-menu" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><IDCardMenu /></ProtectedRoute>} />
        <Route path="/admin/print-id-cards" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><PrintIDCards /></ProtectedRoute>} />
        <Route path="/admin/print-staff-cards" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><PrintStaffCards /></ProtectedRoute>} />
        <Route path="/admin/id-card-settings" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><IDCardSettings /></ProtectedRoute>} />
        <Route path="/admin/messages" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><PublicMessages /></ProtectedRoute>} />
        <Route path="/admin/fees" element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'accountant']}><FeeManagement /></ProtectedRoute>} />
        <Route path="/admin/expenses" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><ExpenseManagement /></ProtectedRoute>} />
        <Route path="/admin/expenses/report" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><DailyExpenseReport /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'accountant']}><Reports /></ProtectedRoute>} />
        <Route path="/admin/reports/accounts-summary" element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'accountant']}><AccountsSummaryReport /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><Settings /></ProtectedRoute>} />
        <Route path="/teacher/dashboard" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherDashboard /></ProtectedRoute>} />
        <Route path="/accountant/dashboard" element={<ProtectedRoute allowedRoles={['accountant']}><AccountantDashboard /></ProtectedRoute>} />
        <Route path="/accountant/students" element={<ProtectedRoute allowedRoles={['accountant']}><Students /></ProtectedRoute>} />
        <Route path="/accountant/students/new" element={<ProtectedRoute allowedRoles={['accountant']}><NewAdmission /></ProtectedRoute>} />
        <Route path="/accountant/students/:id/details" element={<ProtectedRoute allowedRoles={['accountant']}><StudentDetails /></ProtectedRoute>} />
        <Route path="/accountant/students/:id/fee-history" element={<ProtectedRoute allowedRoles={['accountant']}><StudentFeeHistory /></ProtectedRoute>} />
        <Route path="/accountant/monthly-payments" element={<ProtectedRoute allowedRoles={['accountant']}><MonthlyPayments /></ProtectedRoute>} />
        <Route path="/accountant/payment-records" element={<ProtectedRoute allowedRoles={['accountant']}><PaymentRecords /></ProtectedRoute>} />
        <Route path="/accountant/reports" element={<ProtectedRoute allowedRoles={['accountant']}><Reports /></ProtectedRoute>} />
        <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
        <Route path="/student/attendance" element={<ProtectedRoute allowedRoles={['student']}><StudentAttendance /></ProtectedRoute>} />
        <Route path="/student/fees" element={<ProtectedRoute allowedRoles={['student']}><StudentFees /></ProtectedRoute>} />
      </Route>
      
      <Route path="/" element={<Navigate to={user ? `/${user.role}/dashboard` : '/login'} />} />
    </Routes>
  );
}

function App() {
  return <AppRoutes />;
}

export default App;
