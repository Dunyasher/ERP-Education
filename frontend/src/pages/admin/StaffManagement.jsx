import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import InstituteTypeSelect from '../../components/InstituteTypeSelect';
import { 
  Plus, 
  Search, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Printer, 
  CreditCard, 
  Key, 
  MoreVertical,
  ChevronDown,
  ArrowUpDown,
  User,
  Mail,
  Phone,
  Building2,
  Edit,
  Trash2,
  FolderTree,
  X,
  Users,
  Camera,
  Fingerprint,
  Scan,
  CheckCircle,
  History,
  DollarSign,
  Calendar,
  Clock
} from 'lucide-react';

const StaffManagement = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(20);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showMoreOptions, setShowMoreOptions] = useState(null);
  const [salaryViewMode, setSalaryViewMode] = useState('monthly'); // 'today' | 'monthly' | 'yearly'
  const dropdownRef = useRef(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    instituteType: 'college',
    description: '',
    isActive: true
  });
  const [showAddStaffForm, setShowAddStaffForm] = useState(false);
  const [staffFormData, setStaffFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    basicSalary: '',
    cnic: '',
    photo: null,
    photoPreview: null,
    instituteType: 'college',
    staffCategoryId: '',
    courses: [],
    faceTemplate: '',      // Base64 for face recognition
    fingerprintId: ''      // Fingerprint ID for attendance
  });
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isRegisteringFingerprint, setIsRegisteringFingerprint] = useState(false);
  const [showSalaryDoneModal, setShowSalaryDoneModal] = useState(false);
  const [staffForSalaryDone, setStaffForSalaryDone] = useState(null);
  const [salaryDoneMonth, setSalaryDoneMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [salaryViewMonth, setSalaryViewMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [showTeacherHistory, setShowTeacherHistory] = useState(false);
  const [staffForHistory, setStaffForHistory] = useState(null);

  // Salary Done mutation - record as expense
  const salaryDoneMutation = useMutation({
    mutationFn: async ({ staff, monthYear }) => {
      const [year, month] = monthYear.split('-').map(Number);
      const amount = staff.salary?.totalSalary ?? staff.salary?.basicSalary ?? 0;
      if (!amount || amount <= 0) throw new Error('No salary amount set for this staff');
      const paymentDate = new Date(year, month - 1, new Date().getDate());
      const response = await api.post('/expenses', {
        category: 'salary',
        description: `Salary - ${staff.personalInfo?.fullName || 'Staff'}`,
        amount,
        date: paymentDate.toISOString(),
        notes: `Staff: ${staff.personalInfo?.fullName}`,
        teacherId: staff._id
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Salary marked as paid');
      setShowSalaryDoneModal(false);
      setStaffForSalaryDone(null);
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      queryClient.invalidateQueries({ queryKey: ['salaryPaidStaff'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to record salary');
    }
  });

  const handleSalaryDone = (member) => {
    const amount = member.salary?.totalSalary ?? member.salary?.basicSalary ?? 0;
    if (!amount || amount <= 0) {
      toast.error('No salary set for this staff. Set salary in Edit first.');
      return;
    }
    setStaffForSalaryDone(member);
    const d = new Date();
    setSalaryDoneMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    setShowSalaryDoneModal(true);
  };

  // Register fingerprint using laptop's built-in reader (WebAuthn)
  const registerLaptopFingerprint = async () => {
    if (!window.PublicKeyCredential) {
      toast.error('WebAuthn not supported. Use Chrome, Edge, or Safari on a device with fingerprint.');
      return;
    }
    setIsRegisteringFingerprint(true);
    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const userId = new TextEncoder().encode(staffFormData.email || staffFormData.fullName || `staff-${Date.now()}`);
      const options = {
        challenge,
        rp: { name: 'Education ERP' },
        user: {
          id: userId,
          name: staffFormData.email || 'staff@erp.local',
          displayName: staffFormData.fullName || 'Staff Member'
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },
          { alg: -257, type: 'public-key' }
        ],
        authenticatorSelection: {
          userVerification: 'required',
          authenticatorAttachment: 'platform',
          residentKey: 'preferred'
        },
        timeout: 60000
      };
      const credential = await navigator.credentials.create({ publicKey: options });
      if (credential?.rawId) {
        const credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
        setStaffFormData(prev => ({ ...prev, fingerprintId: `webauthn:${credentialId}` }));
        toast.success('Laptop fingerprint registered successfully');
      }
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        toast.error('Fingerprint registration was cancelled or timed out');
      } else {
        console.error('WebAuthn error:', err);
        toast.error('Fingerprint registration failed. Use hardware scanner or enter ID instead.');
      }
    } finally {
      setIsRegisteringFingerprint(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Safety check: ensure ref and target exist
      if (dropdownRef.current && event.target && dropdownRef.current.contains(event.target)) {
        return; // Click was inside dropdown
      }
      if (showMoreOptions) {
        setShowMoreOptions(null);
      }
    };

    if (showMoreOptions && dropdownRef.current) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMoreOptions]);

  // Fetch staff (teachers)
  const { data: staff = [], isLoading, refetch: refetchStaff, error: staffError } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      try {
        const response = await api.get('/teachers?includeInactive=true');
        console.log('📋 Staff API Response:', response.data);
        console.log('📋 Staff Count:', Array.isArray(response.data) ? response.data.length : 'Not an array');
        
        // Handle both array and object with data property
        let staffData = [];
        if (Array.isArray(response.data)) {
          staffData = response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
          staffData = response.data.data;
        } else if (response.data && response.data.total !== undefined) {
          staffData = response.data.data || [];
        }
        
        console.log('📋 Processed Staff Data:', staffData.length, 'staff members');
        if (staffData.length > 0) {
          console.log('📋 First Staff Member:', staffData[0]);
        }
        
        return staffData;
      } catch (error) {
        console.error('❌ Error fetching staff:', error);
        console.error('❌ Error status:', error.response?.status);
        console.error('❌ Error response:', error.response?.data);
        console.error('❌ Error message:', error.message);
        
        // Only show toast for non-401 errors (401 is expected when not logged in)
        if (error.response?.status !== 401) {
          const errorMsg = error.response?.data?.message || error.message || 'Failed to load staff members';
          toast.error(errorMsg);
        }
        return [];
      }
    },
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 0,
    retry: 2
  });

  // Fetch staff categories
  const { data: staffCategories = [] } = useQuery({
    queryKey: ['staffCategories'],
    queryFn: async () => {
      try {
        const response = await api.get('/staff-categories');
        return response.data;
      } catch (error) {
        console.error('Error fetching staff categories:', error);
        return [];
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000
  });

  // Fetch salary expenses to show which staff have been paid this month
  const { data: salaryExpenses = [] } = useQuery({
    queryKey: ['salaryPaidStaff', salaryViewMonth],
    queryFn: async () => {
      const [year, month] = salaryViewMonth.split('-').map(Number);
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      const res = await api.get('/expenses', {
        params: { category: 'salary', startDate: start.toISOString(), endDate: end.toISOString() }
      });
      return res.data || [];
    }
  });
  // Fetch teacher financial history (expenses with teacherId)
  const { data: teacherHistoryExpenses = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['teacherHistory', staffForHistory?._id],
    queryFn: async () => {
      const res = await api.get('/expenses', { params: { teacherId: staffForHistory._id } });
      return res.data || [];
    },
    enabled: !!staffForHistory?._id
  });

  const paidTeacherInfo = useMemo(() => {
    const map = new Map();
    (salaryExpenses || []).forEach(exp => {
      if (exp.teacherId) {
        const id = exp.teacherId.toString();
        const date = exp.date ? new Date(exp.date) : null;
        if (!map.has(id) || (date && (!map.get(id).date || date > map.get(id).date))) {
          map.set(id, { date });
        }
      }
    });
    return map;
  }, [salaryExpenses]);

  const formatPaymentDate = (d) => {
    if (!d) return '';
    const date = new Date(d);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatMonthLabel = (monthStr) => {
    if (!monthStr) return '—';
    const [y, m] = monthStr.split('-').map(Number);
    const d = new Date(y, m - 1, 1);
    return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  };

  const totalStaffCount = staff.length;
  const totalPaidThisMonth = (salaryExpenses || []).reduce((sum, e) => sum + (e.amount || 0), 0);
  const pendingPayThisMonth = staff
    .filter(m => (m.salary?.totalSalary > 0 || m.salary?.basicSalary > 0) && !paidTeacherInfo.has(m._id.toString()))
    .reduce((sum, m) => sum + (m.salary?.totalSalary ?? m.salary?.basicSalary ?? 0), 0);

  // Fetch courses for Teacher Of field
  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      try {
        const response = await api.get('/courses');
        return Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        console.error('Error fetching courses:', error);
        return [];
      }
    },
    staleTime: 2 * 60 * 1000
  });

  // Filter courses by institute type
  const filteredCourses = useMemo(() => {
    if (!staffFormData.instituteType) return [];
    return courses.filter(course => 
      course.instituteType === staffFormData.instituteType
    );
  }, [courses, staffFormData.instituteType]);

  // Filter staff categories by institute type
  const filteredStaffCategories = useMemo(() => {
    if (!staffFormData.instituteType) return [];
    return staffCategories.filter(category => 
      category.instituteType === staffFormData.instituteType && 
      category.isActive !== false
    );
  }, [staffCategories, staffFormData.instituteType]);

  // Filter staff based on search
  const filteredStaff = useMemo(() => {
    if (!searchTerm) return staff;
    const searchLower = searchTerm.toLowerCase();
    return staff.filter(member => {
      return (
        member.personalInfo?.fullName?.toLowerCase().includes(searchLower) ||
        member.userId?.email?.toLowerCase().includes(searchLower) ||
        member.contactInfo?.phone?.toLowerCase().includes(searchLower) ||
        member.userId?.uniqueId?.toLowerCase().includes(searchLower) ||
        member.srNo?.toLowerCase().includes(searchLower)
      );
    });
  }, [staff, searchTerm]);

  // Sort staff
  const sortedStaff = useMemo(() => {
    if (!sortConfig.key) return filteredStaff;
    
    return [...filteredStaff].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortConfig.key) {
        case 'empId':
          aValue = a.userId?.uniqueId || a.srNo || '';
          bValue = b.userId?.uniqueId || b.srNo || '';
          break;
        case 'name':
          aValue = a.personalInfo?.fullName || '';
          bValue = b.personalInfo?.fullName || '';
          break;
        case 'email':
          aValue = a.userId?.email || '';
          bValue = b.userId?.email || '';
          break;
        case 'phone':
          aValue = a.contactInfo?.phone || '';
          bValue = b.contactInfo?.phone || '';
          break;
        case 'instituteType':
          aValue = a.employment?.instituteType || '';
          bValue = b.employment?.instituteType || '';
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredStaff, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(sortedStaff.length / entriesPerPage);
  const paginatedStaff = useMemo(() => {
    const startIndex = (currentPage - 1) * entriesPerPage;
    return sortedStaff.slice(startIndex, startIndex + entriesPerPage);
  }, [sortedStaff, currentPage, entriesPerPage]);

  // Handle sort
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }) => {
      return api.put(`/settings/password/${userId}`, { newPassword });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('Password reset successfully!');
      setShowPasswordModal(false);
      setSelectedStaff(null);
      setPasswordForm({ newPassword: '', confirmPassword: '' });
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 'Failed to reset password';
      toast.error(errorMessage);
    }
  });

  // Handle password reset
  const handleResetPassword = (member) => {
    setSelectedStaff(member);
    setShowPasswordModal(true);
    setPasswordForm({ newPassword: '', confirmPassword: '' });
  };

  // Submit password reset
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    resetPasswordMutation.mutate({
      userId: selectedStaff.userId?._id || selectedStaff.userId,
      newPassword: passwordForm.newPassword
    });
  };

  // Generate ID Card - Automatically generate and print staff card
  const handleGenerateID = (member) => {
    try {
      toast.loading('Generating staff ID card...', { id: 'generate-id' });
      
      // Create print window
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Please allow popups to print the ID card', { id: 'generate-id' });
        return;
      }
      
      // Load ID card settings from localStorage
      let idCardSettings = null;
      try {
        const saved = localStorage.getItem('idCardSettings');
        if (saved) {
          idCardSettings = JSON.parse(saved);
        }
      } catch (error) {
        console.error('Error loading ID card settings:', error);
      }
      
      const photoHTML = member.personalInfo?.photo 
        ? `<img src="${member.personalInfo.photo}" style="width:100%;height:100%;object-fit:cover;" />` 
        : '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:10px;color:#999;">PHOTO</div>';
      
      const staffId = member.userId?.uniqueId || member.srNo || member._id?.toString().slice(-8) || 'N/A';
      const staffName = member.personalInfo?.fullName || 'N/A';
      const staffEmail = member.userId?.email || member.contactInfo?.email || 'N/A';
      const staffPhone = member.contactInfo?.phone || 'N/A';
      const instituteType = member.employment?.instituteType || '';
      const category = member.staffCategoryId?.name || '';
      
      // Check if imported design should be used
      const useImportedDesign = idCardSettings?.useImportedDesign && idCardSettings?.importedDesign;
      const importedDesign = idCardSettings?.importedDesign;
      
      // If using imported design, use it as the card background
      const cardHTML = useImportedDesign ? `
        <div class="id-card" style="background-image: url('${importedDesign}'); background-size: cover; background-position: center; position: relative;">
          <div style="position: relative; z-index: 1; width: 100%; height: 100%;">
            <!-- Your imported design will appear exactly as imported -->
          </div>
        </div>
      ` : `
        <div class="id-card">
          <div class="id-card-header">
            <h3>STAFF ID CARD</h3>
          </div>
          <div class="id-card-body">
            <div class="id-card-photo">
              ${photoHTML}
            </div>
            <div class="id-card-info">
              <p><strong>Name:</strong> ${staffName.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
              <p><strong>ID:</strong> ${staffId.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
              <p><strong>Email:</strong> ${staffEmail.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
              <p><strong>Phone:</strong> ${staffPhone.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
              ${instituteType ? `<p><strong>Institute:</strong> ${instituteType.charAt(0).toUpperCase() + instituteType.slice(1).replace(/_/g, ' ').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>` : ''}
              ${category ? `<p><strong>Category:</strong> ${category.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>` : ''}
            </div>
          </div>
          <div class="id-card-qr">
            <div style="font-size:7px;text-align:center;padding:2px;">ID: ${staffId}</div>
          </div>
          <div class="id-card-footer">
            Valid for Academic Year ${new Date().getFullYear()}
          </div>
        </div>
      `;
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Staff ID Card - ${staffName}</title>
            <style>
              @page {
                size: A4;
                margin: 20mm;
              }
              body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background: #f5f5f5;
              }
              .id-card {
                width: 85mm;
                height: 54mm;
                border: 2px solid #000;
                border-radius: 8px;
                padding: 10px;
                box-sizing: border-box;
                background: white;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                position: relative;
              }
              .id-card[style*="background-image"] {
                padding: 0;
                border: none;
                background-size: cover;
                background-position: center;
                background-repeat: no-repeat;
              }
              .id-card-header {
                text-align: center;
                border-bottom: 2px solid #000;
                padding-bottom: 5px;
                margin-bottom: 10px;
              }
              .id-card-header h3 {
                margin: 0;
                font-size: 14px;
                font-weight: bold;
                color: #1e40af;
              }
              .id-card-body {
                display: flex;
                gap: 10px;
                margin-bottom: 5px;
              }
              .id-card-photo {
                width: 50px;
                height: 50px;
                border: 1px solid #000;
                background: #f0f0f0;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                flex-shrink: 0;
                overflow: hidden;
              }
              .id-card-info {
                flex: 1;
                font-size: 10px;
                line-height: 1.4;
              }
              .id-card-info p {
                margin: 2px 0;
                word-break: break-word;
              }
              .id-card-qr {
                width: 40px;
                height: 40px;
                border: 1px solid #000;
                background: #f0f0f0;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 7px;
                margin: 5px auto 0;
                text-align: center;
              }
              .id-card-footer {
                text-align: center;
                border-top: 1px solid #000;
                margin-top: 5px;
                padding-top: 5px;
                font-size: 8px;
                color: #666;
              }
              @media print {
                body {
                  margin: 0;
                  padding: 0;
                  background: white;
                }
                .id-card {
                  box-shadow: none;
                  margin: 0 auto;
                }
              }
            </style>
          </head>
          <body>
            ${cardHTML}
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      
      toast.success('Staff ID card generated! Print dialog will open shortly.', { id: 'generate-id' });
    } catch (error) {
      console.error('Error generating ID card:', error);
      toast.error('Failed to generate ID card. Please try again.', { id: 'generate-id' });
    }
  };

  // Export functions
  const exportToExcel = () => {
    const headers = ['Emp. ID', 'Name', 'Email', 'Phone', 'Institute Type'];
    const data = sortedStaff.map(member => [
      member.userId?.uniqueId || member.srNo || 'N/A',
      member.personalInfo?.fullName || 'N/A',
      member.userId?.email || 'N/A',
      member.contactInfo?.phone || 'N/A',
      member.employment?.instituteType ? member.employment.instituteType.charAt(0).toUpperCase() + member.employment.instituteType.slice(1).replace(/_/g, ' ') : 'N/A'
    ]);
    
    const csvContent = [headers, ...data]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `staff-management-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Data exported to CSV (Excel compatible)');
  };

  const exportToCSV = () => {
    const headers = ['Emp. ID', 'Name', 'Email', 'Phone', 'Institute Type'];
    const data = sortedStaff.map(member => [
      member.userId?.uniqueId || member.srNo || 'N/A',
      member.personalInfo?.fullName || 'N/A',
      member.userId?.email || 'N/A',
      member.contactInfo?.phone || 'N/A',
      member.employment?.instituteType ? member.employment.instituteType.charAt(0).toUpperCase() + member.employment.instituteType.slice(1).replace(/_/g, ' ') : 'N/A'
    ]);
    
    const csvContent = [headers, ...data]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `staff-management-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Data exported to CSV');
  };

  const exportToPDF = () => {
    toast.loading('Generating PDF...', { id: 'pdf-export' });
    
    // Create a print-friendly HTML content
    const printContent = `
      <html>
        <head>
          <title>Staff Management Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #4f46e5; color: white; }
            tr:nth-child(even) { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Staff Management Report</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                <th>Emp. ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Institute Type</th>
              </tr>
            </thead>
            <tbody>
              ${sortedStaff.map(member => `
                <tr>
                  <td>${member.userId?.uniqueId || member.srNo || 'N/A'}</td>
                  <td>${member.personalInfo?.fullName || 'N/A'}</td>
                  <td>${member.userId?.email || 'N/A'}</td>
                  <td>${member.contactInfo?.phone || 'N/A'}</td>
                  <td>${member.employment?.instituteType ? member.employment.instituteType.charAt(0).toUpperCase() + member.employment.instituteType.slice(1).replace(/_/g, ' ') : 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
    
    toast.dismiss('pdf-export');
    toast.success('PDF ready for printing');
  };

  const handlePrint = () => {
    window.print();
  };

  // Delete staff mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return api.delete(`/teachers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('Staff member deleted successfully!');
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 'Failed to delete staff member';
      toast.error(errorMessage);
    }
  });

  const handleDelete = (member) => {
    if (window.confirm(`Are you sure you want to delete ${member.personalInfo?.fullName || 'this staff member'}?`)) {
      deleteMutation.mutate(member._id);
    }
  };

  // Staff Category mutation
  const categoryMutation = useMutation({
    mutationFn: async (data) => {
      if (editingCategory) {
        return api.put(`/staff-categories/${editingCategory._id}`, data);
      } else {
        return api.post('/staff-categories', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffCategories'] });
      toast.success(editingCategory ? 'Category updated successfully!' : 'Category created successfully!');
      setShowCategoryForm(false);
      setEditingCategory(null);
      setCategoryFormData({
        name: '',
        instituteType: 'college',
        description: '',
        isActive: true
      });
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 'Failed to save category';
      toast.error(errorMessage);
    }
  });

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!categoryFormData.name || !categoryFormData.instituteType) {
      toast.error('Please fill in all required fields');
      return;
    }
    categoryMutation.mutate(categoryFormData);
  };

  const resetCategoryForm = () => {
    setCategoryFormData({
      name: '',
      instituteType: 'college',
      description: '',
      isActive: true
    });
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name || '',
      instituteType: category.instituteType || 'college',
      description: category.description || '',
      isActive: category.isActive !== undefined ? category.isActive : true
    });
    setShowCategoryForm(true);
  };

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id) => api.delete(`/staff-categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffCategories'] });
      toast.success('Category deleted successfully!');
    },
    onError: () => {
      toast.error('Failed to delete category');
    }
  });

  const handleDeleteCategory = (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      deleteCategoryMutation.mutate(id);
    }
  };

  // Add Staff mutation
  const addStaffMutation = useMutation({
    mutationFn: async (data) => {
      // Convert photo to base64 if provided
      let photoBase64 = null;
      if (data.photo) {
        try {
          photoBase64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(data.photo);
          });
        } catch (error) {
          console.error('Error converting photo to base64:', error);
        }
      }

      // Prepare teacher data structure matching backend expectations
      const teacherData = {
        email: data.email,
        password: data.password,
        personalInfo: {
          fullName: data.fullName,
          ...(data.cnic && { cnic: data.cnic }),
          ...(photoBase64 && { photo: photoBase64 })
        },
        contactInfo: {
          phone: data.phone,
          email: data.email
        },
        salary: {
          basicSalary: data.basicSalary ? parseFloat(data.basicSalary) : 0,
          allowances: 0
        },
        employment: {
          instituteType: data.instituteType || 'college',
          status: 'active',
          courses: data.courses || []
        },
        ...(data.staffCategoryId && { staffCategoryId: data.staffCategoryId }),
        ...((data.faceTemplate || data.fingerprintId) && {
          biometric: {
            ...(data.faceTemplate && { faceTemplate: data.faceTemplate }),
            ...(data.fingerprintId && { fingerprintId: data.fingerprintId.trim() })
          }
        })
      };

      const response = await api.post('/teachers', teacherData);
      
      // Check if response indicates an error (status >= 400)
      if (response.status >= 400) {
        const error = new Error(response.data?.message || 'Failed to add staff member');
        error.response = response;
        throw error;
      }
      
      return response;
    },
    onSuccess: async (response) => {
      // Double-check response status
      if (response.status >= 400) {
        console.error('❌ Response has error status:', response.status);
        const errorMessage = response.data?.message || 'Failed to add staff member';
        toast.error(errorMessage);
        return;
      }
      
      console.log('✅ Staff added successfully:', response.data);
      toast.success('Staff member added successfully!');
      setShowAddStaffForm(false);
      resetStaffForm();
      
      // Force refetch with a small delay to ensure backend has processed
      setTimeout(async () => {
        console.log('🔄 Refetching staff list...');
        await queryClient.invalidateQueries({ queryKey: ['teachers'] });
        const result = await refetchStaff();
        console.log('✅ Staff list refetched. Count:', result.data?.length || 0);
        if (result.data && result.data.length > 0) {
          console.log('📋 Staff members:', result.data.map(s => s.personalInfo?.fullName || 'N/A'));
        }
      }, 500);
    },
    onError: (error) => {
      console.error('❌ Add staff error:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      
      let errorMessage = 'Failed to add staff member';
      if (error.response?.data) {
        if (error.response.data.errors && Array.isArray(error.response.data.errors) && error.response.data.errors.length > 0) {
          // Show all validation errors
          errorMessage = error.response.data.errors.join(', ');
          console.error('❌ Validation errors:', error.response.data.errors);
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, { duration: 6000 });
    }
  });

  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    
    if (!staffFormData.fullName || !staffFormData.email || !staffFormData.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!staffFormData.password || staffFormData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    addStaffMutation.mutate({
      ...staffFormData,
      faceTemplate: staffFormData.faceTemplate || undefined,
      fingerprintId: staffFormData.fingerprintId?.trim() || undefined
    });
  };

  const resetStaffForm = () => {
    // Stop camera if running
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCameraOn(false);
    setStaffFormData({
      fullName: '',
      email: '',
      phone: '',
      password: '',
      basicSalary: '',
      cnic: '',
      photo: null,
      photoPreview: null,
      instituteType: 'college',
      staffCategoryId: '',
      courses: [],
      faceTemplate: '',
      fingerprintId: ''
    });
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraOn(true);
      }
    } catch (err) {
      console.error('Camera error:', err);
      toast.error('Unable to access camera. Check permissions and try again.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCameraOn(false);
  };

  const captureFace = () => {
    if (!videoRef.current || !canvasRef.current) {
      toast.error('Camera not ready');
      return;
    }
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setStaffFormData(prev => ({ ...prev, faceTemplate: dataUrl }));
    stopCamera();
    toast.success('Face captured');
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setStaffFormData({
        ...staffFormData,
        photo: file,
        photoPreview: URL.createObjectURL(file)
      });
    }
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading staff members...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb and Add Button */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Link to="/admin/dashboard" className="hover:text-blue-600 dark:hover:text-blue-400">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white font-medium">Staff Management</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setShowCategoryForm(true);
              setEditingCategory(null);
              resetCategoryForm();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            <FolderTree className="w-5 h-5" />
            Category
          </button>
          <button
            onClick={() => {
              setShowAddStaffForm(true);
              resetStaffForm();
            }}
            className="btn-primary flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-5 h-5" />
            Add Staff
          </button>
        </div>
      </div>

      {/* Section Title */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Employee Salary</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Staff</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalStaffCount}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <div className="card p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Paid</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">Rs {totalPaidThisMonth.toLocaleString()}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <div className="card p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Remaining Pay</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">Rs {pendingPayThisMonth.toLocaleString()}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
        </div>
        <div className="card p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">This Month</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{formatMonthLabel(salaryViewMonth)}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>
      </div>

      {/* Export, Salary Month & View */}
      <div className="card flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={exportToExcel} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 text-sm font-medium">
            <FileSpreadsheet className="w-4 h-4" /> Excel
          </button>
          <button onClick={exportToCSV} className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg flex items-center gap-2 text-sm font-medium">
            <FileText className="w-4 h-4" /> CSV
          </button>
          <button onClick={exportToPDF} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 text-sm font-medium">
            <FileText className="w-4 h-4" /> PDF
          </button>
          <button onClick={handlePrint} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center gap-2 text-sm font-medium">
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">Salary Month:</label>
            <input
              type="month"
              value={salaryViewMonth}
              onChange={(e) => setSalaryViewMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">{formatMonthLabel(salaryViewMonth)}</span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Search staff..."
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">Show</label>
          <select
            value={entriesPerPage}
            onChange={(e) => {
              setEntriesPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-sm text-gray-600 dark:text-gray-400">entries</span>
        </div>
        <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
          {['today', 'monthly', 'yearly'].map((mode) => (
            <button
              key={mode}
              onClick={() => setSalaryViewMode(mode)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                salaryViewMode === mode
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              {mode === 'today' ? 'Today' : mode === 'monthly' ? 'Monthly' : 'Yearly'}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Table */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-blue-600 text-white">
              <th className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-blue-700 transition-colors" onClick={() => handleSort('empId')}>
                <div className="flex items-center gap-2">ID <ArrowUpDown className="w-4 h-4" /></div>
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Photo</th>
              <th className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-blue-700 transition-colors" onClick={() => handleSort('name')}>
                <div className="flex items-center gap-2">Name <ArrowUpDown className="w-4 h-4" /></div>
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-blue-700 transition-colors" onClick={() => handleSort('phone')}>
                <div className="flex items-center gap-2">Contact <ArrowUpDown className="w-4 h-4" /></div>
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-blue-700 transition-colors" onClick={() => handleSort('instituteType')}>
                <div className="flex items-center gap-2">Institute <ArrowUpDown className="w-4 h-4" /></div>
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Salary</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedStaff.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  <User className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No staff members found</p>
                  {searchTerm && <p className="text-sm mt-2">Try adjusting your search</p>}
                </td>
              </tr>
            ) : (
              paginatedStaff.map((member) => (
                <tr key={member._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {member.userId?.uniqueId || member.srNo || 'N/A'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      {member.personalInfo?.photo ? (
                        <img 
                          src={member.personalInfo.photo} 
                          alt={member.personalInfo?.fullName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {member.personalInfo?.fullName || 'N/A'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      {member.contactInfo?.phone || member.userId?.email || 'N/A'}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      {member.employment?.instituteType 
                        ? member.employment.instituteType.charAt(0).toUpperCase() + member.employment.instituteType.slice(1).replace(/_/g, ' ')
                        : 'N/A'}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => { setStaffForHistory(member); setShowTeacherHistory(true); }}
                        className="text-left text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        {member.salary?.totalSalary != null
                          ? `Rs ${Number(member.salary.totalSalary).toLocaleString()}`
                          : member.salary?.basicSalary != null
                            ? `Rs ${Number(member.salary.basicSalary).toLocaleString()}`
                            : '—'}
                      </button>
                      {(member.salary?.totalSalary > 0 || member.salary?.basicSalary > 0) && (
                        paidTeacherInfo.has(member._id.toString()) ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatPaymentDate(paidTeacherInfo.get(member._id.toString())?.date)}
                            </span>
                            <button
                              onClick={() => { setStaffForHistory(member); setShowTeacherHistory(true); }}
                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline w-fit text-left"
                            >
                              View History
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleSalaryDone(member)}
                            className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium flex items-center gap-1 transition-colors"
                          >
                            <CheckCircle className="w-3 h-3" />
                            Mark Done
                          </button>
                        )
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {(member.salary?.totalSalary > 0 || member.salary?.basicSalary > 0) && (
                      paidTeacherInfo.has(member._id.toString()) ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs font-medium w-fit">
                          <CheckCircle className="w-3.5 h-3.5" /> Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded text-xs font-medium w-fit">
                          Pending
                        </span>
                      )
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap relative" ref={dropdownRef}>
                    <button
                      onClick={() => setShowMoreOptions(showMoreOptions === member._id ? null : member._id)}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                    >
                      Action
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    {showMoreOptions === member._id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                        {(member.salary?.totalSalary > 0 || member.salary?.basicSalary > 0) && !paidTeacherInfo.has(member._id.toString()) && (
                          <button
                            onClick={() => { handleSalaryDone(member); setShowMoreOptions(null); }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                          >
                            <DollarSign className="w-4 h-4" />
                            Pay Salary
                          </button>
                        )}
                        <button
                          onClick={() => { setStaffForHistory(member); setShowTeacherHistory(true); setShowMoreOptions(null); }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                          <History className="w-4 h-4" />
                          View History
                        </button>
                        <Link
                          to={`/admin/teachers`}
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Edit Staff
                        </Link>
                        <button
                          onClick={() => { handleGenerateID(member); setShowMoreOptions(null); }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          Generate Slip
                        </button>
                        <button
                          onClick={() => { handleResetPassword(member); setShowMoreOptions(null); }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                          <Key className="w-4 h-4" />
                          Reset Password
                        </button>
                        <button
                          onClick={() => { handleDelete(member); setShowMoreOptions(null); }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="card flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {paginatedStaff.length > 0 ? (currentPage - 1) * entriesPerPage + 1 : 0} to{' '}
          {Math.min(currentPage * entriesPerPage, sortedStaff.length)} of {sortedStaff.length} entries
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
            Page {currentPage} of {totalPages || 1}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage >= totalPages}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>

      {/* Password Reset Modal */}
      {showPasswordModal && selectedStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Reset Password
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Reset password for <strong>{selectedStaff.personalInfo?.fullName || 'Staff Member'}</strong>
            </p>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">New Password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="input-field"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="input-field"
                  required
                  minLength={6}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setSelectedStaff(null);
                    setPasswordForm({ newPassword: '', confirmPassword: '' });
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetPasswordMutation.isLoading}
                  className="btn-primary"
                >
                  {resetPasswordMutation.isLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Salary Done Modal */}
      {showSalaryDoneModal && staffForSalaryDone && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-500" />
              Mark Salary Done
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Record salary payment for <strong>{staffForSalaryDone.personalInfo?.fullName || 'Staff'}</strong>
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              Amount: <strong>Rs {(staffForSalaryDone.salary?.totalSalary ?? staffForSalaryDone.salary?.basicSalary ?? 0).toLocaleString()}</strong>
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Payment month (when salary was received)
              </label>
              <input
                type="month"
                value={salaryDoneMonth}
                onChange={(e) => setSalaryDoneMonth(e.target.value)}
                className="input-field w-full"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowSalaryDoneModal(false);
                  setStaffForSalaryDone(null);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => salaryDoneMutation.mutate({ staff: staffForSalaryDone, monthYear: salaryDoneMonth })}
                disabled={salaryDoneMutation.isLoading}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
              >
                {salaryDoneMutation.isLoading ? 'Recording...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Teacher History Modal - Salary History Table */}
      {showTeacherHistory && staffForHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <History className="w-6 h-6 text-blue-500" />
                Salary History — {staffForHistory.personalInfo?.fullName || 'Staff'}
              </h2>
              <button
                onClick={() => { setShowTeacherHistory(false); setStaffForHistory(null); }}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {isLoadingHistory ? (
                <div className="text-center py-8 text-gray-500">Loading salary history...</div>
              ) : teacherHistoryExpenses.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No salary records yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Salary History</h3>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-blue-600 text-white">
                        <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Salary</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Deductions</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Bonuses</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Net Pay</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...teacherHistoryExpenses]
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .map((exp) => {
                          const deductions = exp.deductions ?? 0;
                          const bonuses = exp.bonuses ?? 0;
                          const salary = exp.grossSalary ?? (exp.amount ?? 0) + deductions - bonuses;
                          const netPay = exp.netPay ?? exp.amount ?? salary - deductions + bonuses;
                          return (
                            <tr key={exp._id} className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                                {formatPaymentDate(exp.date)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                Rs {salary.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-sm text-orange-600 dark:text-orange-400">
                                Rs {deductions.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-sm text-green-600 dark:text-green-400">
                                Rs {bonuses.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                                Rs {netPay.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Category Form Modal */}
      {showCategoryForm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCategoryForm(false);
              setEditingCategory(null);
              resetCategoryForm();
            }
          }}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full shadow-xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 overflow-y-auto flex-1">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h2>
                <button
                  onClick={() => {
                    setShowCategoryForm(false);
                    setEditingCategory(null);
                    resetCategoryForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCategorySubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Type of Employee *</label>
                  <input
                    type="text"
                    required
                    value={categoryFormData.name}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                    className="input-field"
                    placeholder="e.g., Teacher, Madam, Sir, Principal"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Institute Type *</label>
                  <select
                    required
                    value={categoryFormData.instituteType}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, instituteType: e.target.value })}
                    className="input-field"
                  >
                    <option value="school">School</option>
                    <option value="college">College</option>
                    <option value="academy">Academy</option>
                    <option value="short_course">Short Course</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={categoryFormData.description}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                    className="input-field"
                    rows="3"
                    placeholder="Category description..."
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={categoryFormData.isActive}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, isActive: e.target.checked })}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm font-medium">
                    Active
                  </label>
                </div>
                <div className="flex justify-end gap-4 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCategoryForm(false);
                      setEditingCategory(null);
                      resetCategoryForm();
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={categoryMutation.isLoading}
                    className="btn-primary"
                  >
                    {categoryMutation.isLoading ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
                  </button>
                </div>
              </form>

              {/* Existing Categories List */}
              <div className="mt-8 pt-6 border-t">
                <h3 className="text-lg font-semibold mb-4">Existing Categories</h3>
                {staffCategories.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No categories created yet. Add your first category above.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <select
                      className="input-field w-full"
                      value={selectedCategoryId}
                      onChange={(e) => setSelectedCategoryId(e.target.value)}
                    >
                      <option value="">Select a category to edit or delete</option>
                      {staffCategories.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name} ({category.instituteType})
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => {
                          if (selectedCategoryId) {
                            const selectedCategory = staffCategories.find(cat => cat._id === selectedCategoryId);
                            if (selectedCategory) {
                              handleEditCategory(selectedCategory);
                              setSelectedCategoryId('');
                            }
                          }
                        }}
                        className="btn-secondary flex items-center gap-2"
                        disabled={!selectedCategoryId}
                      >
                        <Edit className="w-4 h-4" />
                        Edit Selected
                      </button>
                      <button
                        onClick={() => {
                          if (selectedCategoryId) {
                            handleDeleteCategory(selectedCategoryId);
                            setSelectedCategoryId('');
                          }
                        }}
                        className="btn-secondary flex items-center gap-2 text-red-600 hover:text-red-700"
                        disabled={!selectedCategoryId}
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Selected
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Form Modal */}
      {showAddStaffForm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddStaffForm(false);
              resetStaffForm();
            }
          }}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full shadow-xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 overflow-y-auto flex-1">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Add New Staff
                </h2>
                <button
                  onClick={() => {
                    setShowAddStaffForm(false);
                    resetStaffForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleStaffSubmit} className="space-y-6">
                {/* Photo Upload */}
                <div>
                  <label className="block text-sm font-medium mb-2">Photo</label>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                      {staffFormData.photoPreview ? (
                        <img 
                          src={staffFormData.photoPreview} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-12 h-12 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="block w-full text-sm text-gray-500 dark:text-gray-400
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-lg file:border-0
                          file:text-sm file:font-semibold
                          file:bg-blue-50 file:text-blue-700
                          hover:file:bg-blue-100
                          dark:file:bg-blue-900 dark:file:text-blue-300"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        JPG, PNG or GIF (Max. 5MB)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Teacher Name */}
                <div>
                  <label className="block text-sm font-medium mb-1">Teacher Name *</label>
                  <input
                    type="text"
                    required
                    value={staffFormData.fullName}
                    onChange={(e) => setStaffFormData({ ...staffFormData, fullName: e.target.value })}
                    className="input-field"
                    placeholder="Enter full name"
                  />
                </div>

                {/* Auto Employee ID - Display only */}
                <div>
                  <label className="block text-sm font-medium mb-1">Employee ID</label>
                  <input
                    type="text"
                    disabled
                    value="Auto-generated"
                    className="input-field bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Employee ID will be automatically generated
                  </p>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={staffFormData.email}
                    onChange={(e) => setStaffFormData({ ...staffFormData, email: e.target.value })}
                    className="input-field"
                    placeholder="example@email.com"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium mb-1">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={staffFormData.phone}
                    onChange={(e) => setStaffFormData({ ...staffFormData, phone: e.target.value })}
                    className="input-field"
                    placeholder="0300-1234567"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    value={staffFormData.password}
                    onChange={(e) => setStaffFormData({ ...staffFormData, password: e.target.value })}
                    className="input-field"
                    placeholder="Enter password (min. 6 characters)"
                    minLength={6}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Password must be at least 6 characters long
                  </p>
                </div>

                {/* CNIC Number */}
                <div>
                  <label className="block text-sm font-medium mb-1">CNIC Number</label>
                  <input
                    type="text"
                    value={staffFormData.cnic}
                    onChange={(e) => setStaffFormData({ ...staffFormData, cnic: e.target.value })}
                    className="input-field"
                    placeholder="12345-1234567-1"
                    maxLength={15}
                  />
                </div>

                {/* Basic Salary */}
                <div>
                  <label className="block text-sm font-medium mb-1">Basic Salary</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={staffFormData.basicSalary}
                    onChange={(e) => setStaffFormData({ ...staffFormData, basicSalary: e.target.value })}
                    className="input-field"
                    placeholder="0.00"
                  />
                </div>

                {/* Institute Type */}
                <div>
                  <label className="block text-sm font-medium mb-1">Institute Type *</label>
                  <InstituteTypeSelect
                    value={staffFormData.instituteType}
                    onChange={(value) => {
                      setStaffFormData({ 
                        ...staffFormData, 
                        instituteType: value,
                        courses: [], // Clear courses when institute type changes
                        staffCategoryId: '' // Clear category when institute type changes
                      });
                    }}
                    required
                    className="input-field"
                    placeholder="Select Institute Type"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    value={staffFormData.staffCategoryId}
                    onChange={(e) => setStaffFormData({ ...staffFormData, staffCategoryId: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Select Category (e.g., Principal, Teacher, etc.)</option>
                    {filteredStaffCategories.map(category => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {filteredStaffCategories.length === 0 && staffFormData.instituteType && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      No categories available for {staffFormData.instituteType}. Create one using the Category button.
                    </p>
                  )}
                </div>

                {/* Teacher Of (Courses) */}
                <div>
                  <label className="block text-sm font-medium mb-1">Teacher Of</label>
                  <select
                    multiple
                    value={staffFormData.courses}
                    onChange={(e) => {
                      const selectedCourses = Array.from(e.target.selectedOptions, option => option.value);
                      setStaffFormData({ ...staffFormData, courses: selectedCourses });
                    }}
                    className="input-field min-h-[100px]"
                    size="4"
                  >
                    {filteredCourses.length === 0 ? (
                      <option disabled>No courses available for {staffFormData.instituteType}</option>
                    ) : (
                      filteredCourses.map(course => (
                        <option key={course._id} value={course._id}>
                          {course.name} ({course.category?.name || 'No Category'})
                        </option>
                      ))
                    )}
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Hold Ctrl (Windows) or Cmd (Mac) to select multiple courses
                  </p>
                  {staffFormData.courses.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {staffFormData.courses.map(courseId => {
                        const course = filteredCourses.find(c => c._id === courseId);
                        return course ? (
                          <span
                            key={courseId}
                            className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs flex items-center gap-1"
                          >
                            {course.name}
                            <button
                              type="button"
                              onClick={() => {
                                setStaffFormData({
                                  ...staffFormData,
                                  courses: staffFormData.courses.filter(id => id !== courseId)
                                });
                              }}
                              className="ml-1 hover:text-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>

                {/* Face Scanner & Fingerprint - for attendance */}
                <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Scan className="w-5 h-5 text-indigo-500" />
                    Face Scanner & Fingerprint
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Register biometrics for staff attendance.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Face Scanner */}
                    <div className="rounded-xl border-2 border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20 p-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <Camera className="w-4 h-4 text-indigo-600" />
                        Face Scanner
                      </label>
                      {staffFormData.faceTemplate ? (
                        <div className="relative inline-block">
                          <img src={staffFormData.faceTemplate} alt="Face scan" className="w-40 h-40 object-cover rounded-xl border-2 border-indigo-300 dark:border-indigo-700 ring-4 ring-indigo-100 dark:ring-indigo-900/50" />
                          <button type="button" onClick={() => setStaffFormData(prev => ({ ...prev, faceTemplate: '' }))} className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg">
                            <X className="w-4 h-4" />
                          </button>
                          <p className="text-xs text-green-600 dark:text-green-400 mt-2 font-medium">✓ Face registered</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="relative aspect-square max-w-[200px] mx-auto bg-gray-900 rounded-xl overflow-hidden">
                            <video
                              ref={videoRef}
                              autoPlay
                              muted
                              playsInline
                              className="w-full h-full object-cover"
                              style={{ display: isCameraOn ? 'block' : 'none' }}
                            />
                            {!isCameraOn && (
                              <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-xl">
                                <div className="text-center text-gray-400">
                                  <Camera className="w-12 h-12 mx-auto mb-2 opacity-60" />
                                  <p className="text-xs">Camera off</p>
                                </div>
                              </div>
                            )}
                            {isCameraOn && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-24 h-32 rounded-full border-2 border-indigo-400/80 border-dashed" title="Position face here" />
                              </div>
                            )}
                            <canvas ref={canvasRef} className="hidden" />
                          </div>
                          <div className="flex gap-2">
                            {!isCameraOn ? (
                              <button type="button" onClick={startCamera} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
                                <Scan className="w-4 h-4" /> Start Face Scan
                              </button>
                            ) : (
                              <>
                                <button type="button" onClick={captureFace} className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
                                  <Camera className="w-4 h-4" /> Capture
                                </button>
                                <button type="button" onClick={stopCamera} className="px-4 py-2.5 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg">
                                  Cancel
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Fingerprint Scanner */}
                    <div className="rounded-xl border-2 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <Fingerprint className="w-4 h-4 text-amber-600" />
                        Fingerprint Scanner
                      </label>
                      {staffFormData.fingerprintId ? (
                        <div className="flex flex-col items-center justify-center min-h-[160px] rounded-xl border-2 border-green-300 dark:border-green-700 bg-white dark:bg-gray-800/50 p-4">
                          <Fingerprint className="w-16 h-16 mb-2 text-green-600 dark:text-green-400" />
                          <p className="text-sm text-green-600 dark:text-green-400 font-medium">✓ Fingerprint registered</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {staffFormData.fingerprintId.startsWith('webauthn:') ? 'Laptop fingerprint' : 'Hardware scanner ID'}
                          </p>
                          <button
                            type="button"
                            onClick={() => setStaffFormData(prev => ({ ...prev, fingerprintId: '' }))}
                            className="mt-3 text-xs text-red-600 dark:text-red-400 hover:underline"
                          >
                            Clear & re-register
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <button
                            type="button"
                            onClick={registerLaptopFingerprint}
                            disabled={isRegisteringFingerprint}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white text-sm font-medium rounded-lg transition-colors"
                          >
                            <Fingerprint className="w-5 h-5" />
                            {isRegisteringFingerprint ? 'Place finger on sensor...' : 'Use laptop fingerprint'}
                          </button>
                          <div
                            onClick={() => document.getElementById('fingerprint-input')?.focus()}
                            className="flex flex-col items-center justify-center py-4 rounded-xl border-2 border-dashed border-amber-300 dark:border-amber-700 bg-white dark:bg-gray-800/50 cursor-text hover:border-amber-500 dark:hover:border-amber-500 transition-colors"
                          >
                            <input
                              id="fingerprint-input"
                              type="text"
                              value={staffFormData.fingerprintId}
                              onChange={(e) => setStaffFormData(prev => ({ ...prev, fingerprintId: e.target.value }))}
                              placeholder="Or enter ID from hardware scanner..."
                              className="w-full max-w-[200px] text-center text-sm bg-transparent border-none focus:outline-none focus:ring-0 placeholder-gray-400 dark:placeholder-gray-500"
                              autoComplete="off"
                            />
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">USB scanner or manual ID</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddStaffForm(false);
                      resetStaffForm();
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addStaffMutation.isLoading}
                    className="btn-primary"
                  >
                    {addStaffMutation.isLoading ? 'Adding...' : 'Add Staff'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;

