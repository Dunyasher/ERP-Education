import { Outlet, Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth, useAppDispatch } from '../store/hooks';
import { logout } from '../store/slices/authSlice';
import api from '../utils/api';
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
  UserPlus,
  UserCheck,
  MessageSquare,
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
  const dispatch = useAppDispatch();
  
  const handleLogout = () => {
    dispatch(logout());
  };
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState({});

  // Define submenus (Settings has submenu with Institute)
  const submenus = {
    'Settings': [
      { name: 'General Settings', path: '/admin/settings', icon: Settings },
      { name: 'Institute Types', path: '/admin/institute-types', icon: School },
    ],
  };

  const adminMenu = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard, hasSubmenu: false },
    { name: 'Students', path: '/admin/students', icon: FileText, hasSubmenu: false },
    { name: 'Teachers', path: '/admin/teachers', icon: Users, hasSubmenu: false },
    { name: 'Classes', path: '/admin/classes', icon: BookOpen, hasSubmenu: false },
    { name: 'Attendance', path: '/admin/attendance', icon: Calendar, hasSubmenu: false },
    { name: 'Exams', path: '/admin/reports', icon: FileBarChart, hasSubmenu: false },
    { name: 'Accounting', path: '/admin/accountant-settings', icon: DollarSign, hasSubmenu: false },
    { name: 'Settings', path: '/admin/settings', icon: Settings, hasSubmenu: true },
    { name: 'Messages', path: '/admin/messages', icon: MessageSquare, hasSubmenu: false },
  ];

  const superAdminMenu = [
    { name: 'Dashboard', path: '/super_admin/dashboard', icon: LayoutDashboard },
    { name: 'Colleges', path: '/admin/settings', icon: School },
    { name: 'All Students', path: '/admin/students', icon: Users },
    { name: 'All Courses', path: '/admin/courses', icon: BookOpen },
    { name: 'Expenses', path: '/admin/expenses', icon: TrendingDown },
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
    { name: 'Accountant Settings', path: '/admin/accountant-settings', icon: Settings },
    { name: 'Expenses', path: '/admin/expenses', icon: TrendingDown },
    { name: 'Admissions', path: '/accountant/students', icon: Users },
    { name: 'Fees Overview', path: '/admin/fees/overview', icon: DollarSign },
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

  const { data: unreadNotif } = useQuery({
    queryKey: ['unreadNotifications'],
    queryFn: () => api.get('/notifications/unread/count').then((r) => r.data),
    refetchInterval: 60000,
    retry: false
  });
  const unreadCount = unreadNotif?.count ?? 0;

  const instituteName = (() => {
    try {
      const gs = localStorage.getItem('adminGeneralSettings');
      if (gs) {
        const parsed = JSON.parse(gs);
        if (parsed?.schoolName) return parsed.schoolName;
      }
    } catch (e) {}
    return user?.collegeId?.name || 'Education ERP';
  })();
  const roleLabel = user?.role === 'super_admin' ? 'Super Admin' : user?.role === 'admin' ? 'Admin Dashboard' : user?.role === 'teacher' ? 'Teacher Portal' : user?.role === 'accountant' ? 'Accountant Portal' : 'Student Portal';

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
        className={`fixed top-0 left-0 z-40 h-screen w-72 bg-[#1e3a5f] shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <nav className="flex-1 overflow-y-auto pt-4">
            <ul className="py-2">
              {menu.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                const isSubmenuOpen = openSubmenus[item.name];
                const submenuItems = submenus[item.name] || [];
                const hasActiveSubmenu = submenuItems.some(subItem => 
                  location.pathname === subItem.path || location.pathname.startsWith(subItem.path + '/')
                );
                const isHighlighted = isActive || hasActiveSubmenu;

                return (
                  <li key={item.path} className="border-b border-blue-800/40 last:border-b-0">
                    {item.hasSubmenu ? (
                      <>
                        <button
                          onClick={() => toggleSubmenu(item.name)}
                          className={`w-full flex items-center justify-between px-5 py-3.5 transition-colors ${
                            isHighlighted
                              ? 'bg-blue-600/80 text-white'
                              : 'text-white hover:bg-blue-800/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon size={20} className="flex-shrink-0 text-white" />
                            <span className="font-medium text-sm text-white">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {item.badge && (
                              <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center flex-shrink-0">
                                {item.badge}
                              </span>
                            )}
                            <ChevronRight size={18} className="flex-shrink-0 text-white" />
                          </div>
                        </button>
                        {isSubmenuOpen && submenuItems.length > 0 && (
                          <ul className="bg-blue-900/50 py-1">
                            {submenuItems.map((subItem) => {
                              const SubIcon = subItem.icon;
                              const isSubActive = location.pathname === subItem.path || location.pathname.startsWith(subItem.path + '/');
                              return (
                                <li key={subItem.path}>
                                  <Link
                                    to={subItem.path}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`flex items-center gap-3 px-5 py-2.5 pl-12 transition-colors ${
                                      isSubActive
                                        ? 'text-white bg-blue-700/50'
                                        : 'text-blue-100 hover:bg-blue-800/50 hover:text-white'
                                    }`}
                                  >
                                    <SubIcon size={14} className="flex-shrink-0" />
                                    <span className="text-sm font-medium">{subItem.name}</span>
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
                        className={`flex items-center justify-between px-5 py-3.5 transition-colors ${
                          isActive
                            ? 'bg-blue-600/80 text-white'
                            : 'text-white hover:bg-blue-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon size={20} className="flex-shrink-0 text-white" />
                          <span className="font-medium text-sm text-white">{item.name}</span>
                        </div>
                        {item.badge && (
                          <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center flex-shrink-0">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    )}
                  </li>
                );
              })}
              {/* Logout at bottom */}
              <li className="border-t border-blue-800/60 mt-2 pt-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-5 py-3.5 text-white hover:bg-blue-800/50 transition-colors"
                >
                  <LogOut size={20} className="flex-shrink-0 text-white" />
                  <span className="font-medium text-sm">Logout</span>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </aside>

      {/* Main content area (top header + content) */}
      <div className="lg:ml-72 flex flex-col min-h-screen pt-14 lg:pt-0">
        {/* Top header bar - desktop */}
        <header className="hidden lg:flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-700 to-blue-800 rounded-b-xl shadow-md flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <School size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">{instituteName}</h1>
              <p className="text-sm text-blue-100">{roleLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-white">
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                <UserCircle size={20} className="text-white" />
              </div>
              <span className="font-medium">Welcome, {user?.role === 'admin' || user?.role === 'super_admin' ? 'Admin' : user?.profile?.firstName || user?.role}</span>
              <ChevronDown size={16} className="opacity-80" />
            </div>
            <Link
              to="/admin/settings"
              className="relative p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Notifications"
            >
              <Bell size={22} className="text-white" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              Logout
              <ChevronDown size={14} className="opacity-80" />
            </button>
          </div>
        </header>
        <main className="flex-1 p-2 xs:p-3 sm:p-4 md:p-6 pt-4 lg:pt-6">
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

