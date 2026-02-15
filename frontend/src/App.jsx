import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/Dashboard';
import TeacherDashboard from './pages/teacher/Dashboard';
import AccountantDashboard from './pages/accountant/Dashboard';
import MonthlyPayments from './pages/accountant/MonthlyPayments';
import FeeManagement from './pages/admin/FeeManagement';
import ExpenseManagement from './pages/admin/ExpenseManagement';
import DailyExpenseReport from './pages/admin/DailyExpenseReport';
import Students from './pages/admin/Students';
import StudentFeeHistory from './pages/admin/StudentFeeHistory';
import StudentDetails from './pages/admin/StudentDetails';
import Teachers from './pages/admin/Teachers';
import Courses from './pages/admin/Courses';
import Reports from './pages/admin/Reports';
import Classes from './pages/admin/Classes';
import Settings from './pages/admin/Settings';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to={user.role === 'student' ? '/login' : `/${user.role}/dashboard`} />} />
      
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/students" element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'accountant']}><Students /></ProtectedRoute>} />
        <Route path="/admin/students/:id/details" element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'accountant']}><StudentDetails /></ProtectedRoute>} />
        <Route path="/admin/students/:id/fee-history" element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'accountant']}><StudentFeeHistory /></ProtectedRoute>} />
        <Route path="/admin/teachers" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><Teachers /></ProtectedRoute>} />
        <Route path="/admin/courses" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><Courses /></ProtectedRoute>} />
        <Route path="/admin/classes" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><Classes /></ProtectedRoute>} />
        <Route path="/admin/fees" element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'accountant']}><FeeManagement /></ProtectedRoute>} />
        <Route path="/admin/expenses" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><ExpenseManagement /></ProtectedRoute>} />
        <Route path="/admin/expenses/report" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><DailyExpenseReport /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['admin', 'super_admin', 'accountant']}><Reports /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><Settings /></ProtectedRoute>} />
        <Route path="/teacher/dashboard" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherDashboard /></ProtectedRoute>} />
        <Route path="/accountant/dashboard" element={<ProtectedRoute allowedRoles={['accountant']}><AccountantDashboard /></ProtectedRoute>} />
        <Route path="/accountant/students" element={<ProtectedRoute allowedRoles={['accountant']}><Students /></ProtectedRoute>} />
        <Route path="/accountant/students/:id/details" element={<ProtectedRoute allowedRoles={['accountant']}><StudentDetails /></ProtectedRoute>} />
        <Route path="/accountant/students/:id/fee-history" element={<ProtectedRoute allowedRoles={['accountant']}><StudentFeeHistory /></ProtectedRoute>} />
        <Route path="/accountant/monthly-payments" element={<ProtectedRoute allowedRoles={['accountant']}><MonthlyPayments /></ProtectedRoute>} />
        <Route path="/accountant/fees" element={<ProtectedRoute allowedRoles={['accountant']}><FeeManagement /></ProtectedRoute>} />
        <Route path="/accountant/reports" element={<ProtectedRoute allowedRoles={['accountant']}><Reports /></ProtectedRoute>} />
      </Route>
      
      <Route path="/" element={<Navigate to={user ? (user.role === 'student' ? '/login' : `/${user.role}/dashboard`) : '/login'} />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
