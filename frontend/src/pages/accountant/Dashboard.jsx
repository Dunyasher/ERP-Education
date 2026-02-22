import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import { Users, DollarSign, FileText, TrendingUp, GraduationCap, Calendar, Receipt, CheckCircle, Clock, AlertCircle, Eye, Download, BookOpen, ChevronRight, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AccountantDashboard = () => {
  const navigate = useNavigate();

  const [feeFilter, setFeeFilter] = useState('all'); // all, pending, paid, overdue

  // Fetch dashboard stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['accountantStats'],
    queryFn: async () => {
      const response = await api.get('/accountant/dashboard');
      return response.data;
    }
  });

  // Fetch fee invoices
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['feeInvoices'],
    queryFn: async () => {
      const response = await api.get('/fees/invoices');
      return response.data || [];
    }
  });

  // Fetch classes/courses
  const { data: classes = [], isLoading: classesLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const response = await api.get('/classes');
      return response.data || [];
    }
  });

  // Filter invoices based on status
  const filteredInvoices = invoices.filter(invoice => {
    if (feeFilter === 'all') return true;
    if (feeFilter === 'pending') return invoice.status === 'pending';
    if (feeFilter === 'paid') return invoice.status === 'paid';
    if (feeFilter === 'overdue') return invoice.status === 'overdue';
    return true;
  });

  // Calculate fee statistics
  const feeStats = {
    total: invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0),
    paid: invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0),
    pending: invoices.reduce((sum, inv) => sum + ((inv.totalAmount || 0) - (inv.paidAmount || 0)), 0),
    pendingCount: invoices.filter(inv => inv.status === 'pending' || inv.status === 'partial').length,
    paidCount: invoices.filter(inv => inv.status === 'paid').length,
    overdueCount: invoices.filter(inv => inv.status === 'overdue').length
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    // Convert 24-hour format to 12-hour format
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      paid: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: CheckCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: Clock },
      partial: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: Clock },
      overdue: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: AlertCircle }
    };
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${config.color}`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const quickActions = [
    {
      title: 'Manage Students',
      description: 'Record student data and track admissions',
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      hoverColor: 'hover:from-blue-600 hover:to-blue-700',
      onClick: () => navigate('/accountant/students')
    },
    {
      title: 'Fee Reports',
      description: 'View complete fee history and reports',
      icon: FileText,
      color: 'from-purple-500 to-purple-600',
      hoverColor: 'hover:from-purple-600 hover:to-purple-700',
      onClick: () => navigate('/accountant/reports')
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Classes
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View all classes, student enrollment, and fee collection details
          </p>
        </div>
        <button
          onClick={() => navigate('/accountant/monthly-payments')}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors duration-200 shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5" />
          Add Payment
        </button>
      </div>

      {/* Stats Cards - Simplified */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Students</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats?.students || 0}
              </p>
            </div>
            <div className="icon-container bg-blue-100 dark:bg-blue-900/20">
              <GraduationCap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="card animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Fees Collected</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                Rs. {stats?.totalFeesCollected?.toLocaleString() || 0}
              </p>
            </div>
            <div className="icon-container bg-green-100 dark:bg-green-900/20">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="card animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Fees</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                Rs. {stats?.pendingFees?.toLocaleString() || 0}
              </p>
            </div>
            <div className="icon-container bg-purple-100 dark:bg-purple-900/20">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="card animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Today's Admissions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats?.todayAdmissions || 0}
              </p>
            </div>
            <div className="icon-container bg-orange-100 dark:bg-orange-900/20">
              <Calendar className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classesLoading ? (
          <div className="col-span-full text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading classes...</p>
          </div>
        ) : classes.length === 0 ? (
          <div className="col-span-full card text-center py-12">
            <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No classes found</p>
          </div>
        ) : (
          classes.map((classItem) => (
            <div
              key={classItem._id}
              className="card animate-fade-in cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="icon-container bg-gradient-to-br from-primary-500 to-purple-600">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {classItem.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {classItem.category || 'N/A'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>

              {/* Teacher and Time Info */}
              <div className="mb-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <div className="space-y-2">
                  {/* Teacher */}
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Teacher:</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {classItem.instructor || 'Not Assigned'}
                    </span>
                  </div>
                  {/* Class Times */}
                  {classItem.schedules && classItem.schedules.length > 0 ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Class Time:</span>
                      </div>
                      <div className="flex flex-wrap gap-2 ml-6">
                        {classItem.schedules.map((schedule, index) => (
                          <span key={index} className="badge-info text-xs font-semibold">
                            {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                            {schedule.days && schedule.days.length > 0 && (
                              <span className="ml-1">({schedule.days.map(d => d.substring(0, 3)).join(', ')})</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">No schedule set</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Statistics */}
              <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">Students</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {classItem.studentCount || 0} / {classItem.capacity || 50}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-sm">Total Fee</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(classItem.totalFee || 0)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm">Paid</span>
                  </div>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(classItem.totalPaid || 0)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-sm">Pending</span>
                  </div>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    {formatCurrency(classItem.totalPending || 0)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AccountantDashboard;

