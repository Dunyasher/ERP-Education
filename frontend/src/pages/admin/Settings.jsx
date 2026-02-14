import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
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
  DollarSign
} from 'lucide-react';

const Settings = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);

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
  const { data: currentUser } = useQuery('currentProfile', async () => {
    const response = await api.get('/settings/profile');
    return response.data;
  });

  // Fetch all users (Admin only)
  const { data: users = [] } = useQuery('allUsers', async () => {
    const response = await api.get('/settings/users');
    return response.data;
  }, {
    enabled: activeTab === 'users'
  });

  // Fetch system stats
  const { data: stats } = useQuery('systemStats', async () => {
    const response = await api.get('/settings/stats');
    return response.data;
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
  const updateProfileMutation = useMutation(
    async (data) => {
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
    {
      onSuccess: () => {
        queryClient.invalidateQueries('currentProfile');
        queryClient.invalidateQueries('allUsers');
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
    }
  );

  // Change password mutation
  const changePasswordMutation = useMutation(
    async (data) => {
      return api.put('/settings/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
    },
    {
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
    }
  );

  // Update user mutation (Admin)
  const updateUserMutation = useMutation(
    async ({ userId, data }) => {
      return api.put(`/settings/users/${userId}`, data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('allUsers');
        setEditingUserId(null);
        toast.success('User updated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update user');
      }
    }
  );

  // Change user password mutation (Admin)
  const changeUserPasswordMutation = useMutation(
    async ({ userId, password }) => {
      return api.put(`/settings/password/${userId}`, { newPassword: password });
    },
    {
      onSuccess: () => {
        toast.success('Password updated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update password');
      }
    }
  );

  // Delete user mutation (Admin)
  const deleteUserMutation = useMutation(
    async (userId) => {
      return api.delete(`/settings/users/${userId}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('allUsers');
        toast.success('User deleted successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete user');
      }
    }
  );

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
    if (window.confirm('Are you sure you want to change this user\'s password?')) {
      changeUserPasswordMutation.mutate({ userId, password: newPassword });
    }
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      deleteUserMutation.mutate(userId);
    }
  };

  const tabs = [
    { id: 'profile', name: 'My Profile', icon: User },
    { id: 'password', name: 'Change Password', icon: Lock },
    { id: 'users', name: 'User Management', icon: Users },
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
                      flex items-center gap-2 px-3 sm:px-4 py-3 sm:py-4 text-sm font-medium border-b-2 transition-colors
                      ${activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">{tab.name}</span>
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
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                      className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
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
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Users className="w-6 h-6" />
                  User Management
                </h2>
              </div>
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
                    {users.map((user) => (
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
                              onClick={() => {
                                const newPassword = prompt('Enter new password (min 6 characters):');
                                if (newPassword) {
                                  handleUserPasswordChange(user._id, newPassword);
                                }
                              }}
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                              title="Change Password"
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
                  </tbody>
                </table>
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

