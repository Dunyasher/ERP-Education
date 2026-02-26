import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { 
  BarChart3, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar,
  Download,
  Filter,
  FileText,
  PieChart,
  Receipt,
  CreditCard,
  AlertCircle,
  UserCheck,
  GraduationCap,
  Clock,
  FileBarChart,
  Search
} from 'lucide-react';
import toast from 'react-hot-toast';

const Reports = () => {
  const navigate = useNavigate();
  const [selectedReport, setSelectedReport] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // All reports from A to Z
  const allReports = [
    { id: 'accounts-summary', name: 'Accounts Summary Report', icon: FileBarChart, path: '/admin/reports/accounts-summary' },
    { id: 'admission-date', name: 'Admission Date Report', icon: Calendar, path: '/admin/reports/admission-date' },
    { id: 'attendance', name: 'Attendance Report', icon: Clock, path: '/admin/reports/attendance' },
    { id: 'balance-sheet', name: 'Balance Sheet', icon: FileBarChart, path: '/admin/reports/balance-sheet' },
    { id: 'detailed-expense', name: 'Detailed Expense Report', icon: TrendingDown, path: '/admin/reports/detailed-expense' },
    { id: 'detailed-income', name: 'Detailed Income Report', icon: TrendingUp, path: '/admin/reports/detailed-income' },
    { id: 'fee-defaulters', name: 'Fee Defaulters Report', icon: AlertCircle, path: '/admin/reports/fee-defaulters' },
    { id: 'fee-discount', name: 'Fee Discount Report', icon: CreditCard, path: '/admin/reports/fee-discount' },
    { id: 'income-expense', name: 'Income & Expense Report', icon: DollarSign, path: '/admin/reports/income-expense' },
    { id: 'staff-salary', name: 'Staff Salary Report', icon: GraduationCap, path: '/admin/reports/staff-salary' },
    { id: 'student-information', name: 'Student Information Report', icon: Users, path: '/admin/reports/student-information' },
    { id: 'unpaid-invoices', name: 'List Of Unpaid Invoices', icon: Receipt, path: '/admin/reports/unpaid-invoices' },
  ];

  // Filter reports based on search
  const filteredReports = allReports.filter(report =>
    report.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleReportClick = (report) => {
    if (report.path) {
      navigate(report.path);
    } else {
      setSelectedReport(report.id);
      toast.info(`${report.name} - Coming soon!`);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Reporting Area Sidebar */}
      <div className="w-80 bg-blue-900 text-white flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-blue-800">
          <div className="flex items-center gap-3 mb-2">
            <PieChart className="w-6 h-6" />
            <h2 className="text-xl font-bold">Reporting Area</h2>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-blue-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-300" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search reports..."
              className="w-full pl-10 pr-4 py-2 bg-blue-800 text-white placeholder-blue-300 rounded-lg border border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Reports List */}
        <div className="flex-1 overflow-y-auto">
          <ul className="space-y-1 p-4">
            {filteredReports.map((report) => {
              const Icon = report.icon;
              return (
                <li key={report.id}>
                  <button
                    onClick={() => handleReportClick(report)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 hover:bg-blue-800 ${
                      selectedReport === report.id ? 'bg-blue-800 border-l-4 border-white' : ''
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">{report.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-blue-800 text-xs text-blue-300">
          <p>Total Reports: {allReports.length}</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-8">
        {selectedReport ? (
          <div className="max-w-4xl mx-auto">
            <div className="card">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {allReports.find(r => r.id === selectedReport)?.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                This report is currently under development. Please check back soon.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => toast.info('Export feature coming soon!')}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export Report
                </button>
                <button
                  onClick={() => window.print()}
                  className="btn-primary flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Print Report
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="card text-center py-16">
              <PieChart className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome to Reporting Area
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Select a report from the sidebar to view detailed information
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
                {allReports.slice(0, 6).map((report) => {
                  const Icon = report.icon;
                  return (
                    <button
                      key={report.id}
                      onClick={() => handleReportClick(report)}
                      className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:shadow-md transition-all text-left"
                    >
                      <Icon className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-2" />
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                        {report.name}
                      </h3>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
