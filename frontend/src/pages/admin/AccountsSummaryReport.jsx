import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { 
  FileBarChart, 
  Search, 
  FileSpreadsheet, 
  FileText, 
  Printer,
  Filter,
  ArrowUpDown,
  ChevronDown
} from 'lucide-react';

const AccountsSummaryReport = () => {
  const [campus, setCampus] = useState('main-campus');
  const [reportType, setReportType] = useState('month-by-month');
  const [month, setMonth] = useState('current-month');
  const [year, setYear] = useState('2022');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Fetch accounts summary data
  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['accountsSummary', campus, reportType, month, year],
    queryFn: async () => {
      try {
        // Calculate date range based on filters
        const currentYear = parseInt(year) || new Date().getFullYear();
        let startDate, endDate;
        
        if (month === 'current-month') {
          const now = new Date();
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        } else if (month === 'all-months') {
          startDate = new Date(currentYear, 0, 1);
          endDate = new Date(currentYear, 11, 31);
        } else {
          const monthIndex = parseInt(month);
          startDate = new Date(currentYear, monthIndex, 1);
          endDate = new Date(currentYear, monthIndex + 1, 0);
        }

        // Fetch income and expense data
        const [incomeResponse, expenseResponse] = await Promise.all([
          api.get('/reports/financial', {
            params: {
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString()
            }
          }).catch(() => ({ data: { summary: { totalIncome: 0 } } })),
          api.get('/expenses/reports/daily', {
            params: {
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString()
            }
          }).catch(() => ({ data: { totalAmount: 0 } }))
        ]);

        // Generate monthly breakdown
        const months = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];

        const monthlyData = months.map((monthName, index) => {
          const monthStart = new Date(currentYear, index, 1);
          const monthEnd = new Date(currentYear, index + 1, 0);
          
          // For now, return mock data structure - replace with actual API calls per month
          return {
            month: monthName,
            totalIncome: 0,
            totalExpense: 0,
            profitLoss: 0,
            year: currentYear,
            campus: 'Main Campus'
          };
        });

        return {
          monthlyData,
          summary: {
            totalIncome: incomeResponse.data?.summary?.totalIncome || 0,
            totalExpense: expenseResponse.data?.totalAmount || 0,
            profitLoss: (incomeResponse.data?.summary?.totalIncome || 0) - (expenseResponse.data?.totalAmount || 0)
          }
        };
      } catch (error) {
        console.error('Error fetching accounts summary:', error);
        // Return mock data structure
        const months = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return {
          monthlyData: months.map((monthName) => ({
            month: monthName,
            totalIncome: 0,
            totalExpense: 0,
            profitLoss: 0,
            year: parseInt(year) || new Date().getFullYear(),
            campus: 'Main Campus'
          })),
          summary: { totalIncome: 0, totalExpense: 0, profitLoss: 0 }
        };
      }
    },
    enabled: true
  });

  const handleFilter = () => {
    refetch();
    toast.success('Data filtered successfully');
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedData = useMemo(() => {
    if (!reportData?.monthlyData) return [];
    
    let sorted = [...reportData.monthlyData];
    
    if (sortConfig.key) {
      sorted.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }
        
        if (sortConfig.direction === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    }
    
    return sorted;
  }, [reportData, sortConfig]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return sortedData;
    
    const searchLower = searchTerm.toLowerCase();
    return sortedData.filter(row => 
      row.month?.toLowerCase().includes(searchLower) ||
      row.campus?.toLowerCase().includes(searchLower) ||
      row.year?.toString().includes(searchLower)
    );
  }, [sortedData, searchTerm]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const handleExportExcel = () => {
    toast.info('Excel export feature coming soon');
  };

  const handleExportCSV = () => {
    const csvRows = [
      ['#', 'Campus', 'Month', 'Total Income', 'Total Expense', 'Profit/Loss', 'Year'],
      ...filteredData.map((row, index) => [
        index + 1,
        row.campus,
        row.month,
        row.totalIncome,
        row.totalExpense,
        row.profitLoss,
        row.year
      ])
    ];
    
    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accounts-summary-${year}.csv`;
    a.click();
    toast.success('CSV exported successfully');
  };

  const handleExportPDF = () => {
    toast.info('PDF export feature coming soon');
  };

  const handlePrint = () => {
    window.print();
  };

  const monthOptions = [
    { value: 'current-month', label: 'Current Month' },
    { value: 'all-months', label: 'All Months' },
    { value: '0', label: 'January' },
    { value: '1', label: 'February' },
    { value: '2', label: 'March' },
    { value: '3', label: 'April' },
    { value: '4', label: 'May' },
    { value: '5', label: 'June' },
    { value: '6', label: 'July' },
    { value: '7', label: 'August' },
    { value: '8', label: 'September' },
    { value: '9', label: 'October' },
    { value: '10', label: 'November' },
    { value: '11', label: 'December' }
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <Link to="/admin/dashboard" className="hover:text-blue-600 dark:hover:text-blue-400">
          Dashboard
        </Link>
        <span>/</span>
        <Link to="/admin/reports" className="hover:text-blue-600 dark:hover:text-blue-400">
          Reporting Area
        </Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-white font-medium">Accounts Summary Report</span>
      </div>

      {/* Header */}
      <div className="bg-blue-600 text-white p-4 rounded-lg flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <FileBarChart className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold">Accounts Summary Report</h1>
      </div>

      {/* Filter Section */}
      <div className="card">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
              Campus:
            </label>
            <select
              value={campus}
              onChange={(e) => setCampus(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="main-campus">Main Campus</option>
              <option value="branch-campus">Branch Campus</option>
              <option value="online-campus">Online Campus</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
              Type:
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="month-by-month">Month By Month</option>
              <option value="yearly">Yearly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
              Month:
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {monthOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
              Year:
            </label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-24"
              min="2020"
              max="2100"
            />
          </div>

          <button
            onClick={handleFilter}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filter Data
          </button>
        </div>
      </div>

      {/* Table Controls and Export Buttons */}
      <div className="card flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">Show</label>
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(parseInt(e.target.value));
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
          <span className="text-sm text-gray-600 dark:text-gray-400">entries</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <FileText className="w-4 h-4" />
            CSV
          </button>
          <button
            onClick={handleExportPDF}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <FileText className="w-4 h-4" />
            PDF
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">Search:</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="card overflow-x-auto">
        {isLoading ? (
          <div className="text-center py-12">Loading report data...</div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleSort('#')}
                  >
                    <div className="flex items-center gap-2">
                      #
                      <ArrowUpDown className="w-4 h-4" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleSort('campus')}
                  >
                    <div className="flex items-center gap-2">
                      campus
                      <ArrowUpDown className="w-4 h-4" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Month
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total Income
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total Expense
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Profit/Loss
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Year
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      No data available
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row, index) => {
                    const rowNumber = (currentPage - 1) * rowsPerPage + index + 1;
                    return (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {rowNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {row.campus}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {row.month}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatCurrency(row.totalIncome)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatCurrency(row.totalExpense)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                          row.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(row.profitLoss)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {row.year}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {paginatedData.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0} to{' '}
                  {Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length} entries
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
                    Page {currentPage} of {totalPages}
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
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AccountsSummaryReport;

