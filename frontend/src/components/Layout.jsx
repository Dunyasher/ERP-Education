import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth, useTheme, useAppDispatch } from '../store/hooks';
import { logout } from '../store/slices/authSlice';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  GraduationCap,
  FileText,
  DollarSign,
  BarChart3,
  Settings,
  UserCircle,
  LogOut,
  Menu,
  X,
  TrendingDown,
  FileBarChart,
  School,
  Calendar,
  Sun,
  Moon,
  UserPlus,
  UserCheck,
  CreditCard,
  MessageSquare,
  Monitor,
  Clock,
  ChevronRight,
  ChevronDown,
  Bell,
  Fingerprint,
  Camera,
  Scan,
  Circle,
  TrendingUp
} from 'lucide-react';
import { useState, useEffect } from 'react';

const Layout = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const dispatch = useAppDispatch();
  
  const handleLogout = () => {
    dispatch(logout());
  };
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState({});

  // Define submenus
  const submenus = {
    'ID Card Printing': [
      { name: 'Print Student Cards', path: '/admin/print-id-cards', icon: Users },
      { name: 'Print Staff Cards', path: '/admin/print-staff-cards', icon: GraduationCap },
      { name: 'ID Card Settings', path: '/admin/id-card-settings', icon: Settings },
    ],
    'Student Management': [
      { name: 'All Students', path: '/admin/students', icon: Users },
      { name: 'Student Promotion', path: '/admin/students/promotion', icon: TrendingUp },
      { name: 'Student Reports', path: '/admin/students/reports', icon: BarChart3 },
    ],
    'Admission Management': [
      { name: 'Admit Student', path: '/admin/students/new', icon: UserCheck },
    ],
    'Manage Attendance': [
      { name: 'Students Attendance', path: '/admin/attendance/manual', icon: Circle },
      { name: 'Staff Attendance', path: '/admin/attendance/staff', icon: Circle },
    ],
  };

  const adminMenu = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard, hasSubmenu: false },
    { name: 'Student Management', path: '/admin/students', icon: Users, hasSubmenu: true },
    { name: 'Admission Management', path: '/admin/students/new', icon: UserCheck, hasSubmenu: true },
    { name: 'Fee Payment', path: '/admin/fee-payment', icon: DollarSign, hasSubmenu: false },
    { name: 'Staff Management', path: '/admin/staff', icon: GraduationCap, hasSubmenu: false },
    { name: 'Accountant Management', path: '/admin/accountants', icon: DollarSign, hasSubmenu: false },
    { name: 'ID Card Printing', path: '/admin/id-card-menu', icon: CreditCard, hasSubmenu: true },
    { name: 'Public Messages', path: '/admin/messages', icon: MessageSquare, hasSubmenu: false, badge: 3 },
    { name: 'Classes', path: '/admin/classes', icon: BookOpen, hasSubmenu: false },
    { name: 'Institute Types', path: '/admin/institute-types', icon: School, hasSubmenu: false },
    { name: 'Manage Attendance', path: '/admin/attendance/manual', icon: BarChart3, hasSubmenu: true },
    { name: 'Online Classes', path: '/admin/online-classes', icon: Monitor, hasSubmenu: false },
    { name: 'Timetable Management', path: '/admin/timetable', icon: Clock, hasSubmenu: false },
  ];

  const superAdminMenu = [
    { name: 'Dashboard', path: '/super_admin/dashboard', icon: LayoutDashboard },
    { name: 'Colleges', path: '/admin/settings', icon: School },
    { name: 'All Students', path: '/admin/students', icon: Users },
    { name: 'All Courses', path: '/admin/courses', icon: BookOpen },
    { name: 'Reports', path: '/admin/reports', icon: BarChart3 },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const teacherMenu = [
    { name: 'Dashboard', path: '/teacher/dashboard', icon: LayoutDashboard },
    { name: 'My Courses', path: '/teacher/courses', icon: BookOpen },
    { name: 'My Students', path: '/teacher/students', icon: Users },
    { name: 'Attendance', path: '/teacher/attendance', icon: FileText },
  ];

  const studentMenu = [
    { name: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { name: 'My Courses', path: '/student/courses', icon: BookOpen },
    { name: 'My Fees', path: '/student/fees', icon: DollarSign },
    { name: 'Attendance', path: '/student/attendance', icon: FileText },
  ];

  const accountantMenu = [
    { name: 'Dashboard', path: '/accountant/dashboard', icon: LayoutDashboard },
    { name: 'Admissions', path: '/accountant/students', icon: Users },
    { name: 'Monthly Payments', path: '/accountant/monthly-payments', icon: Calendar },
    { name: 'Payment Records', path: '/accountant/payment-records', icon: FileText },
    { name: 'Reports', path: '/accountant/reports', icon: BarChart3 },
  ];

  const menu = user?.role === 'super_admin'
    ? superAdminMenu
    : user?.role === 'admin' 
    ? adminMenu 
    : user?.role === 'teacher' 
    ? teacherMenu 
    : user?.role === 'accountant'
    ? accountantMenu
    : studentMenu;

  const toggleSubmenu = (menuName) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [menuName]: !prev[menuName]
    }));
  };

  // Auto-open submenu if current path matches a submenu item
  useEffect(() => {
    const currentPath = location.pathname;
    Object.keys(submenus).forEach(menuName => {
      const hasActiveSubmenu = submenus[menuName].some(subItem => 
        currentPath === subItem.path || currentPath.startsWith(subItem.path + '/')
      );
      if (hasActiveSubmenu && !openSubmenus[menuName]) {
        setOpenSubmenus(prev => ({ ...prev, [menuName]: true }));
      }
    });
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-blue-900 shadow-md p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Education ERP</h1>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-blue-800 text-white"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-72 bg-blue-900 shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-blue-800">
            <h1 className="text-2xl font-bold text-white">Education ERP</h1>
            <p className="text-sm text-blue-200 mt-1">
              {user?.role === 'super_admin'
                ? 'Super Admin Panel'
                : user?.role === 'admin' 
                ? 'Admin Panel' 
                : user?.role === 'teacher' 
                ? 'Teacher Portal'
                : user?.role === 'accountant'
                ? 'Accountant Portal'
                : 'Student Portal'}
            </p>
          </div>

          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-0.5">
              {menu.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                const isSubmenuOpen = openSubmenus[item.name];
                const submenuItems = submenus[item.name] || [];
                const hasActiveSubmenu = submenuItems.some(subItem => 
                  location.pathname === subItem.path || location.pathname.startsWith(subItem.path + '/')
                );

                return (
                  <li key={item.path}>
                    {item.hasSubmenu ? (
                      <>
                        <button
                          onClick={() => toggleSubmenu(item.name)}
                          className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${
                            isActive || hasActiveSubmenu
                              ? 'bg-blue-800 text-white'
                              : 'text-white hover:bg-blue-800/50'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <Icon size={20} className="flex-shrink-0 text-white" />
                            <span className="font-medium text-sm text-white">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {item.badge && (
                              <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                                {item.badge}
                              </span>
                            )}
                            <ChevronRight 
                              size={16} 
                              className="flex-shrink-0 text-white" 
                            />
                          </div>
                        </button>
                        {isSubmenuOpen && submenuItems.length > 0 && (
                          <ul className="ml-4 mt-1 space-y-0.5">
                            {submenuItems.map((subItem) => {
                              const SubIcon = subItem.icon;
                              const isSubActive = location.pathname === subItem.path || location.pathname.startsWith(subItem.path + '/');
                              return (
                                <li key={subItem.path}>
                                  <Link
                                    to={subItem.path}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`flex items-center space-x-3 px-4 py-2 transition-colors ${
                                      isSubActive
                                        ? 'text-white'
                                        : 'text-white hover:bg-blue-800/50'
                                    }`}
                                  >
                                    <SubIcon size={8} className="flex-shrink-0 fill-current" />
                                    <span className={`text-sm font-medium ${isSubActive ? 'border-b-2 border-red-500 pb-0.5' : ''}`}>
                                      {subItem.name}
                                    </span>
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </>
                    ) : (
                      <Link
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center justify-between px-4 py-3 transition-colors ${
                          isActive
                            ? 'bg-blue-800 text-white'
                            : 'text-white hover:bg-blue-800/50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon size={20} className="flex-shrink-0 text-white" />
                          <span className="font-medium text-sm text-white">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.badge && (
                            <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* User Account Section - Inside Scroll Area */}
            <div className="mt-6 pt-6 border-t border-blue-800">
              {/* User Account Information */}
              <div className="mb-4 px-4 py-2">
                <p className="text-base font-bold text-white mb-1">
                  {user?.role === 'admin' ? 'Admin' : user?.role === 'super_admin' ? 'Super Admin' : user?.role === 'teacher' ? 'Teacher' : user?.role === 'accountant' ? 'Accountant' : 'Student'} {user?.profile?.firstName} {user?.profile?.lastName}
                </p>
                <p className="text-sm text-blue-200">{user?.email}</p>
              </div>
              
              {/* Dark Mode Button */}
              <button
                onClick={toggleTheme}
                className="w-full mb-2 flex items-center space-x-3 px-4 py-3 bg-blue-800 text-white hover:bg-blue-700 transition-colors"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                <Moon size={20} className="text-white" />
                <span className="font-medium">Dark Mode</span>
              </button>
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-3 text-white hover:bg-blue-800 transition-colors"
              >
                <LogOut size={20} className="text-white" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-72 pt-14 xs:pt-16 lg:pt-0">
        <main className="p-2 xs:p-3 sm:p-4 md:p-6">
          <Outlet />
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;

