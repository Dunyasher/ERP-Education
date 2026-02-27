import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
  Settings as SettingsIcon,
  User,
  Lock,
  Users,
  BarChart3,
  Mail,
  Phone,
  Save,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  GraduationCap,
  BookOpen,
  FileText,
  School,
  DollarSign,
  X,
  Search,
  Bell,
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle,
  Shield,
  KeyRound,
  Building2,
  XCircle
} from 'lucide-react';
import { useAuth } from '../../store/hooks';

const Settings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [showEditPasswordModal, setShowEditPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editPasswordForm, setEditPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [passwordResetForm, setPasswordResetForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [createAdminForm, setCreateAdminForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    collegeId: ''
  });

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: ''
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // User management form state
  const [userForm, setUserForm] = useState({
    email: '',
    password: '',
    role: 'student',
    firstName: '',
    lastName: '',
    phone: ''
  });

  // Fetch current user profile
  const { data: currentUser } = useQuery({
    queryKey: ['currentProfile'],
    queryFn: async () => {
      const response = await api.get('/settings/profile');
      return response.data;
    }
  });

  // Fetch all users (Admin only)
  const { data: users = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: async () => {
      const response = await api.get('/settings/users');
      return response.data;
    },
    enabled: activeTab === 'users'
  });

  // Fetch all college admins (Super Admin only)
  const { data: allAdminsData, refetch: refetchAdmins } = useQuery({
    queryKey: ['allCollegeAdmins'],
    queryFn: async () => {
      const response = await api.get('/colleges/all-admins');
      return response.data;
    },
    enabled: user?.role === 'super_admin' && activeTab === 'college-admins'
  });

  // Reset admin password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ adminId, newPassword }) => {
      return api.put(`/colleges/admins/${adminId}/reset-password`, { newPassword });
    },
    onSuccess: () => {
      refetchAdmins();
      toast.success('Password reset successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    }
  });

  // Create new admin mutation
  const createAdminMutation = useMutation({
    mutationFn: async (formData) => {
      const { email, password, firstName, lastName, phone, collegeId } = formData;
      return api.post(`/colleges/${collegeId}/assign-admin`, {
        email,
        password,
        profile: {
          firstName,
          lastName,
          phone
        }
      });
    },
    onSuccess: () => {
      refetchAdmins();
      setShowCreateAdminModal(false);
      setCreateAdminForm({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        collegeId: ''
      });
      toast.success('Admin created successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create admin');
    }
  });

  const handleCreateAdmin = (e) => {
    e.preventDefault();
    if (!createAdminForm.collegeId) {
      toast.error('Please select a college');
      return;
    }
    if (createAdminForm.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    createAdminMutation.mutate(createAdminForm);
  };

  // Fetch all colleges for admin creation (Super Admin only)
  const { data: collegesData } = useQuery({
    queryKey: ['allColleges'],
    queryFn: async () => {
      const response = await api.get('/super-admin/institutes');
      return response.data;
    },
    enabled: user?.role === 'super_admin' && showCreateAdminModal
  });

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!userSearchQuery) return users;
    const query = userSearchQuery.toLowerCase();
    return users.filter(user => 
      user.email.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query) ||
      (user.isActive ? 'active' : 'inactive').includes(query)
    );
  }, [users, userSearchQuery]);

  // Fetch system stats
  const { data: stats } = useQuery({
    queryKey: ['systemStats'],
    queryFn: async () => {
      const response = await api.get('/settings/stats');
      return response.data;
    }
  });

  // Update profile form when user data loads
  useEffect(() => {
    if (currentUser) {
      setProfileForm({
        email: currentUser.email || '',
        firstName: currentUser.profile?.firstName || '',
        lastName: currentUser.profile?.lastName || '',
        phone: currentUser.profile?.phone || ''
      });
    }
  }, [currentUser]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        email: data.email || undefined,
        profile: {}
      };
      
      // Only include profile fields that have values
      if (data.firstName !== undefined && data.firstName !== null) {
        payload.profile.firstName = data.firstName;
      }
      if (data.lastName !== undefined && data.lastName !== null) {
        payload.profile.lastName = data.lastName;
      }
      if (data.phone !== undefined && data.phone !== null) {
        payload.profile.phone = data.phone;
      }
      
      return api.put('/settings/profile', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentProfile'] });
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      console.error('Profile update error:', error);
      const errorMessage = error.response?.data?.message || 
                         error.response?.data?.error || 
                         'Failed to update profile';
      toast.error(errorMessage);
      
      // Show validation errors if available
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        error.response.data.errors.forEach(err => {
          if (err.msg) {
            toast.error(err.msg);
          }
        });
      }
    }
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data) => {
      return api.put('/settings/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
    },
    onSuccess: () => {
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed successfully');
    },
    onError: (error) => {
      console.error('Password change error:', error);
      const errorMessage = error.response?.data?.message || 
                         error.response?.data?.error || 
                         'Failed to change password';
      toast.error(errorMessage);
      
      // Show validation errors if available
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        error.response.data.errors.forEach(err => {
          if (err.msg) {
            toast.error(err.msg);
          }
        });
      }
    }
  });

  // Update user mutation (Admin)
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data }) => {
      return api.put(`/settings/users/${userId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      setEditingUserId(null);
      toast.success('User updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update user');
    }
  });

  // Change user password mutation (Admin)
  const changeUserPasswordMutation = useMutation({
    mutationFn: async ({ userId, password }) => {
      return api.put(`/settings/password/${userId}`, { newPassword: password });
    },
    onSuccess: () => {
      toast.success('Password updated successfully');
      setShowEditPasswordModal(false);
      setSelectedUser(null);
      setEditPasswordForm({ newPassword: '', confirmPassword: '' });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update password');
    }
  });

  // Delete user mutation (Admin)
  const deleteUserMutation = useMutation({
    mutationFn: async (userId) => {
      return api.delete(`/settings/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      toast.success('User deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  });

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileForm);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    });
  };

  const handleUserPasswordChange = (userId, newPassword) => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    changeUserPasswordMutation.mutate({ userId, password: newPassword });
  };

  const handleOpenEditPassword = (user) => {
    setSelectedUser(user);
    setEditPasswordForm({ newPassword: '', confirmPassword: '' });
    setShowEditPasswordModal(true);
  };

  const handleEditPasswordSubmit = (e) => {
    e.preventDefault();
    
    if (editPasswordForm.newPassword !== editPasswordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (editPasswordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    if (selectedUser) {
      handleUserPasswordChange(selectedUser._id, editPasswordForm.newPassword);
      setShowEditPasswordModal(false);
      setEditPasswordForm({ newPassword: '', confirmPassword: '' });
      setSelectedUser(null);
    }
  };

  // Handle admin password reset (Super Admin only)
  const handleAdminPasswordReset = async (e) => {
    e.preventDefault();
    
    if (passwordResetForm.newPassword !== passwordResetForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordResetForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    resetPasswordMutation.mutate({
      adminId: selectedUser.id,
      newPassword: passwordResetForm.newPassword
    }, {
      onSuccess: (data) => {
        setShowPasswordResetModal(false);
        setSelectedUser(null);
        setPasswordResetForm({ newPassword: '', confirmPassword: '' });
        toast.success(`Password reset! New password: ${data.data.admin.newPassword}`);
      }
    });
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      deleteUserMutation.mutate(userId);
    }
  };

  // Fetch notifications
  const { data: notifications = [], refetch: refetchNotifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get('/notifications?limit=100');
      return response.data;
    },
    enabled: activeTab === 'notifications',
    refetchInterval: activeTab === 'notifications' ? 30000 : false // Refetch every 30 seconds when on notifications tab
  });

  const { data: unreadCount = { count: 0 } } = useQuery({
    queryKey: ['unreadNotifications'],
    queryFn: async () => {
      const response = await api.get('/notifications/unread/count');
      return response.data;
    },
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId) => {
      return api.put(`/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
    }
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return api.put('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
      toast.success('All notifications marked as read');
    }
  });

  const tabs = [
    { id: 'profile', name: 'My Profile', icon: User },
    { id: 'password', name: 'Change Password', icon: Lock },
    { id: 'users', name: 'User Management', icon: Users },
    ...(user?.role === 'super_admin' ? [{ id: 'college-admins', name: 'College Admins', icon: Shield }] : []),
    { id: 'notifications', name: 'Notifications', icon: Bell, badge: unreadCount.count > 0 ? unreadCount.count : null },
    { id: 'system', name: 'System Overview', icon: BarChart3 }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-600" />
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your account, users, and system settings
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex flex-wrap -mb-px px-4 sm:px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      relative flex items-center gap-2 px-3 sm:px-4 py-3 sm:py-4 text-sm font-medium border-b-2 transition-colors
                      ${activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">{tab.name}</span>
                    {tab.badge && tab.badge > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {tab.badge > 99 ? '99+' : tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 lg:p-8">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <User className="w-6 h-6" />
                My Profile
              </h2>

              {/* Admin Details Section (Read-Only) */}
              {currentUser && user?.role === 'admin' && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    Admin Account Details
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Phone Number */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Phone Number
                      </label>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {currentUser.profile?.phone || currentUser.college?.contactInfo?.phone || 'Not set'}
                      </p>
                    </div>

                    {/* College Name */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        {currentUser.college?.instituteType === 'school' ? 'School Name' : 
                         currentUser.college?.instituteType === 'academy' ? 'Academy Name' : 
                         currentUser.college?.instituteType === 'short_course' ? 'Institute Name' : 
                         'College Name'}
                      </label>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {currentUser.college?.name || 'Not assigned'}
                      </p>
                      {currentUser.college?.instituteType && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">
                          Type: {currentUser.college.instituteType.replace('_', ' ')}
                        </p>
                      )}
                    </div>

                    {/* Address */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 md:col-span-2">
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Address
                      </label>
                      {currentUser.college?.contactInfo?.address ? (
                        <div className="text-gray-900 dark:text-white">
                          {currentUser.college.contactInfo.address.street && (
                            <p className="font-medium">{currentUser.college.contactInfo.address.street}</p>
                          )}
                          <p className="text-sm">
                            {[
                              currentUser.college.contactInfo.address.city,
                              currentUser.college.contactInfo.address.state,
                              currentUser.college.contactInfo.address.zipCode,
                              currentUser.college.contactInfo.address.country
                            ].filter(Boolean).join(', ') || 'No address details'}
                          </p>
                        </div>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400">No address set</p>
                      )}
                    </div>

                    {/* Password Field with Show/Hide */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 md:col-span-2">
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={currentUser.password || 'Not set'}
                          readOnly
                          className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 pr-12 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Your account password (visible to you and super admin)
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Editable Profile Form */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Edit Profile Information
                </h3>
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        required
                        className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        autoComplete="tel"
                        className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={profileForm.firstName}
                        onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                        autoComplete="given-name"
                        className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={profileForm.lastName}
                        onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                        autoComplete="family-name"
                        className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={updateProfileMutation.isLoading}
                      className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center gap-2 font-semibold"
                    >
                      <Save className="w-5 h-5" />
                      {updateProfileMutation.isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Lock className="w-6 h-6" />
                Change Password
              </h2>
              <form onSubmit={handlePasswordSubmit} className="space-y-6 max-w-2xl">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Current Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      required
                      className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      required
                      minLength={6}
                      className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Confirm New Password *
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    required
                    minLength={6}
                    className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={changePasswordMutation.isLoading}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center gap-2 font-semibold"
                  >
                    <Lock className="w-5 h-5" />
                    {changePasswordMutation.isLoading ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Users Management Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Users className="w-6 h-6" />
                  User Management
                </h2>
              </div>
              
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by email, role, or status..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Filtered Users Count */}
              {userSearchQuery && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {filteredUsers.length} of {users.length} users
                </p>
              )}

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredUsers.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {user.email}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'super_admin' || user.role === 'admin'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                              : user.role === 'teacher'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            user.isActive
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenEditPassword(user)}
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                              title="Edit Password"
                            >
                              <Lock className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user._id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan="4" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                          {userSearchQuery ? 'No users found matching your search.' : 'No users found.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Bell className="w-6 h-6" />
                  Notifications
                  {unreadCount.count > 0 && (
                    <span className="bg-red-500 text-white text-sm font-bold rounded-full px-3 py-1">
                      {unreadCount.count} unread
                    </span>
                  )}
                </h2>
                {notifications.length > 0 && unreadCount.count > 0 && (
                  <button
                    onClick={() => markAllAsReadMutation.mutate()}
                    disabled={markAllAsReadMutation.isLoading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm font-semibold"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark All as Read
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 text-lg">No notifications yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => {
                    const getPriorityIcon = () => {
                      switch (notification.priority) {
                        case 'critical':
                          return <AlertTriangle className="w-5 h-5 text-red-500" />;
                        case 'high':
                          return <AlertCircle className="w-5 h-5 text-orange-500" />;
                        case 'medium':
                          return <Info className="w-5 h-5 text-blue-500" />;
                        default:
                          return <Info className="w-5 h-5 text-gray-500" />;
                      }
                    };

                    const getPriorityColor = () => {
                      switch (notification.priority) {
                        case 'critical':
                          return 'border-red-500 bg-red-50 dark:bg-red-900/20';
                        case 'high':
                          return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20';
                        case 'medium':
                          return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
                        default:
                          return 'border-gray-300 bg-white dark:bg-gray-800';
                      }
                    };

                    return (
                      <div
                        key={notification._id}
                        className={`border-l-4 rounded-lg p-4 shadow-sm transition-all ${
                          notification.isRead 
                            ? 'opacity-75 ' + getPriorityColor()
                            : getPriorityColor() + ' font-semibold'
                        }`}
                        onClick={() => {
                          if (!notification.isRead) {
                            markAsReadMutation.mutate(notification._id);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="mt-1">
                              {getPriorityIcon()}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className={`font-semibold ${notification.isRead ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'}`}>
                                  {notification.title}
                                </h3>
                                {!notification.isRead && (
                                  <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">New</span>
                                )}
                              </div>
                              <p className={`text-sm ${notification.isRead ? 'text-gray-600 dark:text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                {notification.message}
                              </p>
                              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                <span>
                                  {new Date(notification.createdAt).toLocaleString()}
                                </span>
                                {notification.metadata?.updatedBy && (
                                  <span>By: {notification.metadata.updatedBy}</span>
                                )}
                                {notification.metadata?.amount && (
                                  <span className="font-semibold text-green-600 dark:text-green-400">
                                    Amount: {notification.metadata.amount.toLocaleString()}
                                  </span>
                                )}
                                {notification.metadata?.category && (
                                  <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">
                                    {notification.metadata.category}
                                  </span>
                                )}
                              </div>
                              {notification.metadata?.oldValues && notification.metadata?.newValues && (
                                <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <p className="font-semibold mb-1">Old Values:</p>
                                      <pre className="text-gray-600 dark:text-gray-300 text-xs">
                                        {JSON.stringify(notification.metadata.oldValues, null, 2)}
                                      </pre>
                                    </div>
                                    <div>
                                      <p className="font-semibold mb-1">New Values:</p>
                                      <pre className="text-gray-600 dark:text-gray-300 text-xs">
                                        {JSON.stringify(notification.metadata.newValues, null, 2)}
                                      </pre>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          {!notification.isRead && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsReadMutation.mutate(notification._id);
                              }}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              title="Mark as read"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Edit Password Modal */}
          {showEditPasswordModal && selectedUser && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowEditPasswordModal(false);
                  setSelectedUser(null);
                  setEditPasswordForm({ newPassword: '', confirmPassword: '' });
                }
              }}
            >
              <div 
                className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Lock className="w-6 h-6" />
                      Edit Password
                    </h2>
                    <button
                      onClick={() => {
                        setShowEditPasswordModal(false);
                        setSelectedUser(null);
                        setEditPasswordForm({ newPassword: '', confirmPassword: '' });
                      }}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>User:</strong> {selectedUser.email}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                      Role: {selectedUser.role}
                    </p>
                  </div>

                  <form onSubmit={handleEditPasswordSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        New Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={editPasswordForm.newPassword}
                          onChange={(e) => setEditPasswordForm({ ...editPasswordForm, newPassword: e.target.value })}
                          required
                          minLength={6}
                          className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                          {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Must be at least 6 characters</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Confirm New Password *
                      </label>
                      <input
                        type="password"
                        value={editPasswordForm.confirmPassword}
                        onChange={(e) => setEditPasswordForm({ ...editPasswordForm, confirmPassword: e.target.value })}
                        required
                        minLength={6}
                        className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Confirm new password"
                      />
                    </div>

                    <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        <strong>Default Password:</strong> <code className="font-mono bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded">password123</code>
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setEditPasswordForm({ 
                            newPassword: 'password123', 
                            confirmPassword: 'password123' 
                          });
                        }}
                        className="mt-2 text-xs text-yellow-700 dark:text-yellow-300 hover:text-yellow-900 dark:hover:text-yellow-100 underline"
                      >
                        Click to reset to default password
                      </button>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        type="button"
                        onClick={() => {
                          setShowEditPasswordModal(false);
                          setSelectedUser(null);
                          setEditPasswordForm({ newPassword: '', confirmPassword: '' });
                        }}
                        className="px-6 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={changeUserPasswordMutation.isLoading}
                        className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold"
                      >
                        <Lock className="w-4 h-4" />
                        {changeUserPasswordMutation.isLoading ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* College Admins Tab (Super Admin Only) */}
          {activeTab === 'college-admins' && user?.role === 'super_admin' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Shield className="w-6 h-6" />
                    College Admins Management
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    View and manage all college admins across all institutes
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateAdminModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center gap-2 font-semibold"
                >
                  <Users className="w-5 h-5" />
                  Create New Admin
                </button>
              </div>

              {allAdminsData && (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-100">Total Admins</p>
                          <p className="text-3xl font-bold mt-2">{allAdminsData.summary.totalAdmins}</p>
                        </div>
                        <Users className="w-8 h-8 text-blue-200" />
                      </div>
                    </div>

                    <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-100">Active Admins</p>
                          <p className="text-3xl font-bold mt-2">{allAdminsData.summary.activeAdmins}</p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-green-200" />
                      </div>
                    </div>

                    <div className="card bg-gradient-to-br from-gray-500 to-gray-600 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-100">Inactive Admins</p>
                          <p className="text-3xl font-bold mt-2">{allAdminsData.summary.inactiveAdmins}</p>
                        </div>
                        <XCircle className="w-8 h-8 text-gray-200" />
                      </div>
                    </div>
                  </div>

                  {/* Admins Table */}
                  <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      All College Admins
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Name</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Email</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Phone</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">College</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Password</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Status</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allAdminsData.admins.map((admin, index) => (
                            <tr
                              key={admin.id}
                              className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                            >
                              <td className="py-3 px-4">
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {admin.name}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="text-gray-700 dark:text-gray-300">{admin.email}</div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                  <Phone className="w-4 h-4" />
                                  {admin.phone}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {admin.college.name}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {admin.college.instituteType}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <KeyRound className="w-4 h-4 text-gray-500" />
                                  <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">
                                    {admin.password}
                                  </code>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  admin.isActive
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                }`}>
                                  {admin.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <button
                                  onClick={() => {
                                    setSelectedUser(admin);
                                    setPasswordResetForm({ newPassword: '', confirmPassword: '' });
                                    setShowPasswordResetModal(true);
                                  }}
                                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                                >
                                  Reset Password
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {allAdminsData.admins.length === 0 && (
                      <div className="text-center py-8">
                        <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">
                          No college admins found. Create colleges and assign admins to them.
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Create New Admin Modal */}
          {showCreateAdminModal && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowCreateAdminModal(false);
                  setCreateAdminForm({
                    email: '',
                    password: '',
                    firstName: '',
                    lastName: '',
                    phone: '',
                    collegeId: ''
                  });
                }
              }}
            >
              <div
                className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full shadow-xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Users className="w-6 h-6" />
                      Create New Admin
                    </h2>
                    <button
                      onClick={() => {
                        setShowCreateAdminModal(false);
                        setCreateAdminForm({
                          email: '',
                          password: '',
                          firstName: '',
                          lastName: '',
                          phone: '',
                          collegeId: ''
                        });
                      }}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateAdmin} className="space-y-4">
                    {/* College Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        College/Institute *
                      </label>
                      <select
                        value={createAdminForm.collegeId}
                        onChange={(e) => setCreateAdminForm({ ...createAdminForm, collegeId: e.target.value })}
                        required
                        className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">Select a college...</option>
                        {collegesData?.institutes?.map((college) => (
                          <option key={college.id} value={college.id}>
                            {college.name} ({college.instituteType})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={createAdminForm.email}
                        onChange={(e) => setCreateAdminForm({ ...createAdminForm, email: e.target.value })}
                        required
                        className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                        placeholder="admin@example.com"
                      />
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={createAdminForm.password}
                          onChange={(e) => setCreateAdminForm({ ...createAdminForm, password: e.target.value })}
                          required
                          minLength={6}
                          className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                          placeholder="Enter password (min 6 characters)"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                          {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Must be at least 6 characters</p>
                    </div>

                    {/* First Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={createAdminForm.firstName}
                        onChange={(e) => setCreateAdminForm({ ...createAdminForm, firstName: e.target.value })}
                        className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                        placeholder="First name"
                      />
                    </div>

                    {/* Last Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={createAdminForm.lastName}
                        onChange={(e) => setCreateAdminForm({ ...createAdminForm, lastName: e.target.value })}
                        className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Last name"
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={createAdminForm.phone}
                        onChange={(e) => setCreateAdminForm({ ...createAdminForm, phone: e.target.value })}
                        className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Phone number"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreateAdminModal(false);
                          setCreateAdminForm({
                            email: '',
                            password: '',
                            firstName: '',
                            lastName: '',
                            phone: '',
                            collegeId: ''
                          });
                        }}
                        className="px-6 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={createAdminMutation.isLoading}
                        className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold flex items-center gap-2 disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        {createAdminMutation.isLoading ? 'Creating...' : 'Create Admin'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Admin Password Reset Modal */}
          {showPasswordResetModal && selectedUser && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => {
                setShowPasswordResetModal(false);
                setSelectedUser(null);
                setPasswordResetForm({ newPassword: '', confirmPassword: '' });
              }}
            >
              <div
                className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <KeyRound className="w-6 h-6" />
                      Reset Admin Password
                    </h2>
                    <button
                      onClick={() => {
                        setShowPasswordResetModal(false);
                        setSelectedUser(null);
                        setPasswordResetForm({ newPassword: '', confirmPassword: '' });
                      }}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Admin:</strong> {selectedUser.name}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                      Email: {selectedUser.email} | College: {selectedUser.college?.name || 'N/A'}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                      Current Password: <code className="font-mono bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">{selectedUser.password}</code>
                    </p>
                  </div>

                  <form onSubmit={handleAdminPasswordReset} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        New Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={passwordResetForm.newPassword}
                          onChange={(e) => setPasswordResetForm({ ...passwordResetForm, newPassword: e.target.value })}
                          required
                          minLength={6}
                          className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                          {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Must be at least 6 characters</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Confirm New Password *
                      </label>
                      <input
                        type="password"
                        value={passwordResetForm.confirmPassword}
                        onChange={(e) => setPasswordResetForm({ ...passwordResetForm, confirmPassword: e.target.value })}
                        required
                        minLength={6}
                        className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Confirm new password"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        type="button"
                        onClick={() => {
                          setShowPasswordResetModal(false);
                          setSelectedUser(null);
                          setPasswordResetForm({ newPassword: '', confirmPassword: '' });
                        }}
                        className="px-6 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={resetPasswordMutation.isLoading}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-semibold flex items-center gap-2 disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        {resetPasswordMutation.isLoading ? 'Resetting...' : 'Reset Password'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* System Overview Tab */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-6 h-6" />
                System Overview
              </h2>
              {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 p-6 rounded-lg shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-600 dark:text-blue-300">Total Students</p>
                        <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-2">{stats.students}</p>
                      </div>
                      <GraduationCap className="w-12 h-12 text-blue-600 dark:text-blue-300" />
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 p-6 rounded-lg shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-600 dark:text-purple-300">Total Teachers</p>
                        <p className="text-3xl font-bold text-purple-900 dark:text-purple-100 mt-2">{stats.teachers}</p>
                      </div>
                      <Users className="w-12 h-12 text-purple-600 dark:text-purple-300" />
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 p-6 rounded-lg shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-600 dark:text-green-300">Total Courses</p>
                        <p className="text-3xl font-bold text-green-900 dark:text-green-100 mt-2">{stats.courses}</p>
                      </div>
                      <BookOpen className="w-12 h-12 text-green-600 dark:text-green-300" />
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900 dark:to-indigo-800 p-6 rounded-lg shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-300">Total Categories</p>
                        <p className="text-3xl font-bold text-indigo-900 dark:text-indigo-100 mt-2">{stats.categories}</p>
                      </div>
                      <FileText className="w-12 h-12 text-indigo-600 dark:text-indigo-300" />
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900 dark:to-pink-800 p-6 rounded-lg shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-pink-600 dark:text-pink-300">Total Users</p>
                        <p className="text-3xl font-bold text-pink-900 dark:text-pink-100 mt-2">{stats.users}</p>
                      </div>
                      <Users className="w-12 h-12 text-pink-600 dark:text-pink-300" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;

