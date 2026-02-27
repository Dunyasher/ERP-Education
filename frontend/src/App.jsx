import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './store/hooks';
import { useEffect, useState, lazy, Suspense } from 'react';
import { useAppDispatch } from './store/hooks';
import { checkAuth } from './store/slices/authSlice';
import Login from './pages/Login';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy load all routes for faster initial load and code splitting
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const SuperAdminDashboard = lazy(() => import('./pages/superAdmin/Dashboard'));
const TeacherDashboard = lazy(() => import('./pages/teacher/Dashboard'));
const AccountantDashboard = lazy(() => import('./pages/accountant/Dashboard'));
const StudentDashboard = lazy(() => import('./pages/student/Dashboard'));
const StudentAttendance = lazy(() => import('./pages/student/Attendance'));
const StudentFees = lazy(() => import('./pages/student/Fees'));
const MonthlyPayments = lazy(() => import('./pages/accountant/MonthlyPayments'));
const PaymentRecords = lazy(() => import('./pages/accountant/PaymentRecords'));
const FeeManagement = lazy(() => import('./pages/admin/FeeManagement'));
const ExpenseManagement = lazy(() => import('./pages/admin/ExpenseManagement'));
const DailyExpenseReport = lazy(() => import('./pages/admin/DailyExpenseReport'));
const Students = lazy(() => import('./pages/admin/Students'));
const StudentFeeHistory = lazy(() => import('./pages/admin/StudentFeeHistory'));
const StudentDetails = lazy(() => import('./pages/admin/StudentDetails'));
const NewAdmission = lazy(() => import('./pages/admin/NewAdmission'));
const StudentPromotion = lazy(() => import('./pages/admin/StudentPromotion'));
const Teachers = lazy(() => import('./pages/admin/Teachers'));
const StaffManagement = lazy(() => import('./pages/admin/StaffManagement'));
const AccountantManagement = lazy(() => import('./pages/admin/AccountantManagement'));
const Courses = lazy(() => import('./pages/admin/Courses'));
const Reports = lazy(() => import('./pages/admin/Reports'));
const AccountsSummaryReport = lazy(() => import('./pages/admin/AccountsSummaryReport'));
const Classes = lazy(() => import('./pages/admin/Classes'));
const Categories = lazy(() => import('./pages/admin/Categories'));
const ManualAttendance = lazy(() => import('./pages/admin/ManualAttendance'));
const StaffAttendance = lazy(() => import('./pages/admin/StaffAttendance'));
const AttendanceReports = lazy(() => import('./pages/admin/AttendanceReports'));
const CardScanner = lazy(() => import('./pages/admin/CardScanner'));
const FaceScan = lazy(() => import('./pages/admin/FaceScan'));
const FingerprintScan = lazy(() => import('./pages/admin/FingerprintScan'));
const OnlineClasses = lazy(() => import('./pages/admin/OnlineClasses'));
const IDCardMenu = lazy(() => import('./pages/admin/IDCardMenu'));
const PrintIDCards = lazy(() => import('./pages/admin/PrintIDCards'));
const PrintStaffCards = lazy(() => import('./pages/admin/PrintStaffCards'));
const IDCardSettings = lazy(() => import('./pages/admin/IDCardSettings'));
const PublicMessages = lazy(() => import('./pages/admin/PublicMessages'));
const StudentFeePayment = lazy(() => import('./pages/admin/StudentFeePayment'));
const Settings = lazy(() => import('./pages/admin/Settings'));

// Loading component for lazy routes
const RouteLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
      <p className="text-gray-600 dark:text-gray-400">Loading...</p>
    </div>
  </div>
);

function AppRoutes() {
  const { user, loading } = useAuth();
  const dispatch = useAppDispatch();
  const [forceRender, setForceRender] = useState(false);

  useEffect(() => {
    // Only dispatch auth check once on mount
    dispatch(checkAuth());
    
    // Fallback: Force render after 500ms to prevent infinite loading
    // This ensures the app always renders, even if auth check is slow
    const timeoutId = setTimeout(() => {
      setForceRender(true);
    }, 500); // 500ms - very fast fallback

    return () => {
      clearTimeout(timeoutId);
    };
  }, [dispatch]);

  // Also force render if loading takes too long
  useEffect(() => {
    if (loading) {
      const loadingTimeout = setTimeout(() => {
        setForceRender(true);
      }, 1000); // 1 second max loading time (reduced from 2s)
      return () => clearTimeout(loadingTimeout);
    }
  }, [loading]);

  // Show loading spinner only if we have a token and haven't forced render
  // If no token, show login page immediately (no loading needed)
  // Use memoized token check to avoid repeated localStorage access
  const [hasToken] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return !!localStorage.getItem('token');
    } catch {
      return false;
    }
  });
  
  if (loading && !forceRender && hasToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to={user?.role ? `/${user.role}/dashboard` : '/login'} />} />
      
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/super_admin/dashboard" element={<ProtectedRoute allowedRoles={['super_admin']}><Suspense fallback={<RouteLoader />}><SuperAdminDashboard /></Suspense></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><Suspense fallback={<RouteLoader />}><AdminDashboard /></Suspense></ProtectedRoute>} />
        <Route path="/admin/students" element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'accountant']}><Suspense fallback={<RouteLoader />}><Students /></Suspense></ProtectedRoute>} />
        <Route path="/admin/students/new" element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'accountant']}><Suspense fallback={<RouteLoader />}><NewAdmission /></Suspense></ProtectedRoute>} />
        <Route path="/admin/students/promotion" element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'accountant']}><Suspense fallback={<RouteLoader />}><StudentPromotion /></Suspense></ProtectedRoute>} />
        <Route path="/admin/students/:id/details" element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'accountant']}><Suspense fallback={<RouteLoader />}><StudentDetails /></Suspense></ProtectedRoute>} />
        <Route path="/admin/students/:id/fee-history" element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'accountant']}><Suspense fallback={<RouteLoader />}><StudentFeeHistory /></Suspense></ProtectedRoute>} />
        <Route path="/admin/fee-payment" element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'accountant']}><Suspense fallback={<RouteLoader />}><StudentFeePayment /></Suspense></ProtectedRoute>} />
        <Route path="/admin/teachers" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><Suspense fallback={<RouteLoader />}><Teachers /></Suspense></ProtectedRoute>} />
        <Route path="/admin/staff" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><Suspense fallback={<RouteLoader />}><StaffManagement /></Suspense></ProtectedRoute>} />
        <Route path="/admin/accountants" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><Suspense fallback={<RouteLoader />}><AccountantManagement /></Suspense></ProtectedRoute>} />
        <Route path="/admin/courses" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><Suspense fallback={<RouteLoader />}><Courses /></Suspense></ProtectedRoute>} />
        <Route path="/admin/classes" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><Suspense fallback={<RouteLoader />}><Classes /></Suspense></ProtectedRoute>} />
        <Route path="/admin/categories" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><Suspense fallback={<RouteLoader />}><Categories /></Suspense></ProtectedRoute>} />
        <Route path="/admin/attendance/manual" element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'teacher']}><Suspense fallback={<RouteLoader />}><ManualAttendance /></Suspense></ProtectedRoute>} />
        <Route path="/admin/attendance/staff" element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'teacher']}><Suspense fallback={<RouteLoader />}><StaffAttendance /></Suspense></ProtectedRoute>} />
        <Route path="/admin/attendance/reports" element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'teacher']}><Suspense fallback={<RouteLoader />}><AttendanceReports /></Suspense></ProtectedRoute>} />
        <Route path="/admin/card-scanner" element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'teacher']}><Suspense fallback={<RouteLoader />}><CardScanner /></Suspense></ProtectedRoute>} />
        <Route path="/admin/attendance/face-scan" element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'teacher']}><Suspense fallback={<RouteLoader />}><FaceScan /></Suspense></ProtectedRoute>} />
        <Route path="/admin/attendance/fingerprint-scan" element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'teacher']}><Suspense fallback={<RouteLoader />}><FingerprintScan /></Suspense></ProtectedRoute>} />
        <Route path="/admin/online-classes" element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'teacher']}><Suspense fallback={<RouteLoader />}><OnlineClasses /></Suspense></ProtectedRoute>} />
        <Route path="/admin/id-card-menu" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><Suspense fallback={<RouteLoader />}><IDCardMenu /></Suspense></ProtectedRoute>} />
        <Route path="/admin/print-id-cards" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><Suspense fallback={<RouteLoader />}><PrintIDCards /></Suspense></ProtectedRoute>} />
        <Route path="/admin/print-staff-cards" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><Suspense fallback={<RouteLoader />}><PrintStaffCards /></Suspense></ProtectedRoute>} />
        <Route path="/admin/id-card-settings" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><Suspense fallback={<RouteLoader />}><IDCardSettings /></Suspense></ProtectedRoute>} />
        <Route path="/admin/messages" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><Suspense fallback={<RouteLoader />}><PublicMessages /></Suspense></ProtectedRoute>} />
        <Route path="/admin/fees" element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'accountant']}><Suspense fallback={<RouteLoader />}><FeeManagement /></Suspense></ProtectedRoute>} />
        <Route path="/admin/expenses" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><Suspense fallback={<RouteLoader />}><ExpenseManagement /></Suspense></ProtectedRoute>} />
        <Route path="/admin/expenses/report" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><Suspense fallback={<RouteLoader />}><DailyExpenseReport /></Suspense></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'accountant']}><Suspense fallback={<RouteLoader />}><Reports /></Suspense></ProtectedRoute>} />
        <Route path="/admin/reports/accounts-summary" element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'accountant']}><Suspense fallback={<RouteLoader />}><AccountsSummaryReport /></Suspense></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><Suspense fallback={<RouteLoader />}><Settings /></Suspense></ProtectedRoute>} />
        <Route path="/teacher/dashboard" element={<ProtectedRoute allowedRoles={['teacher']}><Suspense fallback={<RouteLoader />}><TeacherDashboard /></Suspense></ProtectedRoute>} />
        <Route path="/accountant/dashboard" element={<ProtectedRoute allowedRoles={['accountant']}><Suspense fallback={<RouteLoader />}><AccountantDashboard /></Suspense></ProtectedRoute>} />
        <Route path="/accountant/students" element={<ProtectedRoute allowedRoles={['accountant']}><Suspense fallback={<RouteLoader />}><Students /></Suspense></ProtectedRoute>} />
        <Route path="/accountant/students/new" element={<ProtectedRoute allowedRoles={['accountant']}><Suspense fallback={<RouteLoader />}><NewAdmission /></Suspense></ProtectedRoute>} />
        <Route path="/accountant/students/:id/details" element={<ProtectedRoute allowedRoles={['accountant']}><Suspense fallback={<RouteLoader />}><StudentDetails /></Suspense></ProtectedRoute>} />
        <Route path="/accountant/students/:id/fee-history" element={<ProtectedRoute allowedRoles={['accountant']}><Suspense fallback={<RouteLoader />}><StudentFeeHistory /></Suspense></ProtectedRoute>} />
        <Route path="/accountant/monthly-payments" element={<ProtectedRoute allowedRoles={['accountant']}><Suspense fallback={<RouteLoader />}><MonthlyPayments /></Suspense></ProtectedRoute>} />
        <Route path="/accountant/payment-records" element={<ProtectedRoute allowedRoles={['accountant']}><Suspense fallback={<RouteLoader />}><PaymentRecords /></Suspense></ProtectedRoute>} />
        <Route path="/accountant/reports" element={<ProtectedRoute allowedRoles={['accountant']}><Suspense fallback={<RouteLoader />}><Reports /></Suspense></ProtectedRoute>} />
        <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={['student']}><Suspense fallback={<RouteLoader />}><StudentDashboard /></Suspense></ProtectedRoute>} />
        <Route path="/student/attendance" element={<ProtectedRoute allowedRoles={['student']}><Suspense fallback={<RouteLoader />}><StudentAttendance /></Suspense></ProtectedRoute>} />
        <Route path="/student/fees" element={<ProtectedRoute allowedRoles={['student']}><Suspense fallback={<RouteLoader />}><StudentFees /></Suspense></ProtectedRoute>} />
      </Route>
      
      <Route path="/" element={<Navigate to={user?.role ? `/${user.role}/dashboard` : '/login'} />} />
    </Routes>
  );
}

function App() {
  return <AppRoutes />;
}

export default App;
