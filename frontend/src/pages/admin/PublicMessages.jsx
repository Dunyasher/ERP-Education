import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { 
  Search, 
  FileSpreadsheet, 
  FileText, 
  Printer, 
  Eye,
  MessageSquare,
  Edit,
  ArrowUpDown,
  Building2
} from 'lucide-react';

const PublicMessages = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(20);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [showViewReplyModal, setShowViewReplyModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');

  // Fetch public messages
  const { data: messagesData, isLoading } = useQuery({
    queryKey: ['publicMessages'],
    queryFn: async () => {
      try {
        const response = await api.get('/messages/public');
        // Ensure response.data is an array
        return Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        // If endpoint doesn't exist, return mock data
        if (error.response?.status === 404 || !error.response) {
          return [
            {
              _id: '2',
              name: 'Demo Parent',
              phone: '3482258263',
              message: "Hi, my child is sick today, he can't come to school, so kindly grand him two days leave.",
              date: '2020-10-08T23:42:43',
              campus: 'Main Campus',
              hasReply: true,
              reply: 'Leave granted for two days. Please ensure your child rests well.'
            },
            {
              _id: '15',
              name: 'Demo Parent',
              phone: '00',
              message: 'test message from mobile app',
              date: '2022-08-25T11:14:35',
              campus: 'Main Campus',
              hasReply: true,
              reply: 'Thank you for your message.'
            },
            {
              _id: '19',
              name: 'Demo Parent',
              phone: '00',
              message: 'Hello, I need more information regarding school admissions',
              date: '2022-10-08T11:09:06',
              campus: 'Main Campus',
              hasReply: true,
              reply: 'Please visit our admissions office for more information.'
            },
            {
              _id: '20',
              name: 'Demo Parent',
              phone: '00',
              message: 'wjvgfjcbbuccybbi',
              date: '2022-10-24T08:42:17',
              campus: 'Main Campus',
              hasReply: true,
              reply: 'Thank you for contacting us.'
            },
            {
              _id: '21',
              name: 'Demo Parent',
              phone: '00',
              message: 'ja ja tur ja',
              date: '2022-10-24T08:42:32',
              campus: 'Main Campus',
              hasReply: false
            },
            {
              _id: '22',
              name: 'Demo Parent',
              phone: '00',
              message: 'Hy',
              date: '2022-11-19T12:35:11',
              campus: 'Main Campus',
              hasReply: false
            },
            {
              _id: '23',
              name: 'Demo Parent',
              phone: '00',
              message: 'Hello, I want to talk about the fees of the students',
              date: '2022-11-19T12:35:55',
              campus: 'Main Campus',
              hasReply: false
            }
          ];
        }
        // Return empty array on other errors
        return [];
      }
    }
  });

  // Ensure messages is always an array
  const messages = Array.isArray(messagesData) ? messagesData : [];

  // Filter messages based on search
  const filteredMessages = useMemo(() => {
    if (!searchTerm) return messages;
    const searchLower = searchTerm.toLowerCase();
    return messages.filter(msg => {
      return (
        msg.name?.toLowerCase().includes(searchLower) ||
        msg.phone?.toLowerCase().includes(searchLower) ||
        msg.message?.toLowerCase().includes(searchLower) ||
        msg.campus?.toLowerCase().includes(searchLower)
      );
    });
  }, [messages, searchTerm]);

  // Sort messages
  const sortedMessages = useMemo(() => {
    // Ensure filteredMessages is an array
    const messagesArray = Array.isArray(filteredMessages) ? filteredMessages : [];
    if (!sortConfig.key) return messagesArray;
    
    return [...messagesArray].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortConfig.key) {
        case 'id':
          aValue = parseInt(a._id) || 0;
          bValue = parseInt(b._id) || 0;
          break;
        case 'name':
          aValue = a.name || '';
          bValue = b.name || '';
          break;
        case 'date':
          aValue = new Date(a.date || 0).getTime();
          bValue = new Date(b.date || 0).getTime();
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredMessages, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(sortedMessages.length / entriesPerPage);
  const paginatedMessages = useMemo(() => {
    const startIndex = (currentPage - 1) * entriesPerPage;
    return sortedMessages.slice(startIndex, startIndex + entriesPerPage);
  }, [sortedMessages, currentPage, entriesPerPage]);

  // Handle sort
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours() % 12 || 12).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
      return `${hours}:${minutes}:${seconds} ${ampm} ${day}-${month}-${year}`;
    } catch (error) {
      return dateString;
    }
  };

  // Handle view reply
  const handleViewReply = (message) => {
    setSelectedMessage(message);
    setShowViewReplyModal(true);
  };

  // Handle click to reply
  const handleClickToReply = (message) => {
    setSelectedMessage(message);
    setReplyText('');
    setShowReplyModal(true);
  };

  // Submit reply mutation
  const replyMutation = useMutation({
    mutationFn: async ({ messageId, reply }) => {
      return api.post(`/messages/${messageId}/reply`, { reply });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publicMessages'] });
      toast.success('Reply sent successfully!');
      setShowReplyModal(false);
      setSelectedMessage(null);
      setReplyText('');
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 'Failed to send reply';
      toast.error(errorMessage);
    }
  });

  // Handle reply submit
  const handleReplySubmit = (e) => {
    e.preventDefault();
    
    if (!replyText.trim()) {
      toast.error('Please enter a reply message');
      return;
    }
    
    replyMutation.mutate({
      messageId: selectedMessage._id,
      reply: replyText
    });
  };

  // Export functions
  const exportToExcel = () => {
    const headers = ['#', 'Name', 'Phone', 'Message', 'Date', 'Campus'];
    const data = sortedMessages.map((msg, index) => [
      index + 1,
      msg.name || 'N/A',
      msg.phone || 'N/A',
      msg.message || 'N/A',
      formatDate(msg.date),
      msg.campus || 'Main Campus'
    ]);
    
    const csvContent = [headers, ...data]
      .map(row => row.map(cell => `"${String(cell)}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `public-messages-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Data exported to CSV (Excel compatible)');
  };

  const exportToCSV = () => {
    exportToExcel();
  };

  const exportToPDF = () => {
    toast.loading('Generating PDF...', { id: 'pdf-export' });
    
    const printContent = `
      <html>
        <head>
          <title>Public Messages Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #4f46e5; color: white; }
            tr:nth-child(even) { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Public Messages Report</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Message</th>
                <th>Date</th>
                <th>Campus</th>
              </tr>
            </thead>
            <tbody>
              ${sortedMessages.map((msg, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${msg.name || 'N/A'}</td>
                  <td>${msg.phone || 'N/A'}</td>
                  <td>${(msg.message || 'N/A').substring(0, 100)}${msg.message?.length > 100 ? '...' : ''}</td>
                  <td>${formatDate(msg.date)}</td>
                  <td>${msg.campus || 'Main Campus'}</td>
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

  if (isLoading) {
    return <div className="text-center py-12">Loading messages...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <Link to="/admin/dashboard" className="hover:text-blue-600 dark:hover:text-blue-400">
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-white font-medium">Public Messages</span>
      </div>

      {/* Section Title */}
      <div className="bg-blue-600 text-white p-4 rounded-lg flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <MessageSquare className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold">Public Messages</h1>
      </div>

      {/* Table Controls */}
      <div className="card flex items-center justify-between flex-wrap gap-4">
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
        
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={exportToExcel}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel
          </button>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <FileText className="w-4 h-4" />
            CSV
          </button>
          <button
            onClick={exportToPDF}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <FileText className="w-4 h-4" />
            PDF
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">Search:</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search messages..."
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Messages Table */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-blue-600 text-white">
              <th 
                className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-blue-700 transition-colors"
                onClick={() => handleSort('id')}
              >
                <div className="flex items-center gap-2">
                  #
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-blue-700 transition-colors"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-2">
                  Name
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Phone</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Message</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Campus</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedMessages.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No messages found</p>
                  {searchTerm && <p className="text-sm mt-2">Try adjusting your search</p>}
                </td>
              </tr>
            ) : (
              paginatedMessages.map((message, index) => {
                const serialNumber = (currentPage - 1) * entriesPerPage + index + 1;
                return (
                  <tr key={message._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {message._id || serialNumber}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {message.name || 'N/A'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {message.phone || 'N/A'}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-md">
                      <div className="truncate" title={message.message}>
                        {message.message || 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(message.date)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {message.hasReply ? (
                        <button
                          onClick={() => handleViewReply(message)}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          View Reply
                        </button>
                      ) : (
                        <button
                          onClick={() => handleClickToReply(message)}
                          className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                          Click To Reply
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        {message.campus || 'Main Campus'}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="card flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {paginatedMessages.length > 0 ? (currentPage - 1) * entriesPerPage + 1 : 0} to{' '}
          {Math.min(currentPage * entriesPerPage, sortedMessages.length)} of {sortedMessages.length} entries
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

      {/* View Reply Modal */}
      {showViewReplyModal && selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Message Reply
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  From
                </label>
                <p className="text-sm text-gray-900 dark:text-white">{selectedMessage.name || 'N/A'}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{selectedMessage.phone || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Message
                </label>
                <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  {selectedMessage.message || 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reply
                </label>
                <p className="text-sm text-gray-900 dark:text-white bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                  {selectedMessage.reply || 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(selectedMessage.date)}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 mt-4">
              <button
                onClick={() => {
                  setShowViewReplyModal(false);
                  setSelectedMessage(null);
                }}
                className="btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {showReplyModal && selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Reply to Message
            </h2>
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  From
                </label>
                <p className="text-sm text-gray-900 dark:text-white">{selectedMessage.name || 'N/A'}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{selectedMessage.phone || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Message
                </label>
                <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  {selectedMessage.message || 'N/A'}
                </p>
              </div>
            </div>
            <form onSubmit={handleReplySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Your Reply
                </label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="input-field min-h-[120px]"
                  placeholder="Enter your reply here..."
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowReplyModal(false);
                    setSelectedMessage(null);
                    setReplyText('');
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={replyMutation.isLoading}
                  className="btn-primary"
                >
                  {replyMutation.isLoading ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicMessages;

