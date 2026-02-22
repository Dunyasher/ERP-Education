import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { 
  Home, 
  FileText, 
  User, 
  Search, 
  Printer,
  QrCode,
  Camera,
  Settings,
  File,
  Users
} from 'lucide-react';

const PrintStaffCards = () => {
  const [selectedCampus, setSelectedCampus] = useState('Main Campus');
  const [selectedType, setSelectedType] = useState('Both Sides');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [isFiltered, setIsFiltered] = useState(false);
  const [qrCodes, setQrCodes] = useState({});

  // Fetch teachers/staff
  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const response = await api.get('/teachers');
      return response.data;
    }
  });

  // Get unique departments
  const campuses = ['Main Campus', 'Branch Campus', 'Online Campus'];
  const cardTypes = ['Single Side', 'Both Sides'];
  const uniqueDepartments = [...new Set(teachers.map(t => t.employment?.department).filter(Boolean))];

  const handleFilter = () => {
    let filtered = [...teachers];

    // Filter by department
    if (selectedDepartment) {
      filtered = filtered.filter(t => t.employment?.department === selectedDepartment);
    }

    setFilteredStaff(filtered);
    setIsFiltered(true);
    
    if (filtered.length === 0) {
      toast.error('No staff found with the selected filters');
    } else {
      toast.success(`Found ${filtered.length} staff member(s)`);
    }
  };

  const handlePrint = () => {
    if (filteredStaff.length === 0) {
      toast.error('No staff selected. Please filter first.');
      return;
    }

    const printWindow = window.open('', '_blank');
    
    const cardsHTML = filteredStaff.map((staff) => {
      const qrCode = qrCodes[staff._id] || '';
      const photoHTML = staff.personalInfo?.photo 
        ? `<img src="${staff.personalInfo.photo}" style="width:100%;height:100%;object-fit:cover;" />` 
        : 'PHOTO';
      const qrHTML = qrCode 
        ? `<img src="${qrCode}" style="width:100%;height:100%;object-fit:contain;" />` 
        : 'QR CODE';
      
      return `
        <div class="id-card">
          <div class="id-card-header">
            <h3>STAFF ID CARD</h3>
          </div>
          <div class="id-card-body">
            <div class="id-card-photo">
              ${photoHTML}
            </div>
            <div class="id-card-info">
              <p><strong>Name:</strong> ${(staff.personalInfo?.fullName || 'N/A').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
              <p><strong>ID:</strong> ${(staff.teacherId || staff.srNo || 'N/A').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
              <p><strong>Department:</strong> ${(staff.employment?.department || 'N/A').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
              <p><strong>Designation:</strong> ${(staff.employment?.designation || 'N/A').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
            </div>
          </div>
          <div class="id-card-qr">
            ${qrHTML}
          </div>
          <div class="id-card-footer">
            Valid for Academic Year ${new Date().getFullYear()}
          </div>
        </div>
      `;
    }).join('');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Staff ID Cards</title>
          <style>
            @page {
              size: A4;
              margin: 10mm;
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
            }
            .id-cards-container {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 20px;
            }
            .id-card {
              width: 85mm;
              height: 54mm;
              border: 2px solid #000;
              border-radius: 8px;
              padding: 10px;
              box-sizing: border-box;
              page-break-inside: avoid;
              background: white;
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
            }
            .id-card-body {
              display: flex;
              gap: 10px;
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
            }
            .id-card-info {
              flex: 1;
              font-size: 10px;
            }
            .id-card-info p {
              margin: 3px 0;
            }
            .id-card-qr {
              width: 40px;
              height: 40px;
              border: 1px solid #000;
              background: #f0f0f0;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 8px;
              margin-top: 5px;
            }
            .id-card-footer {
              text-align: center;
              border-top: 1px solid #000;
              margin-top: 10px;
              padding-top: 5px;
              font-size: 8px;
            }
            @media print {
              .id-cards-container {
                grid-template-columns: repeat(3, 1fr);
              }
            }
          </style>
        </head>
        <body>
          <div class="id-cards-container">
            ${cardsHTML}
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleGenerateAllQR = async () => {
    if (filteredStaff.length === 0) {
      toast.error('No staff selected');
      return;
    }
    
    toast.loading('Generating QR codes...', { id: 'qr-generation' });
    
    try {
      // Generate QR codes for staff (using student endpoint as template)
      // In production, create a dedicated staff QR endpoint
      const qrPromises = filteredStaff.map(async (staff) => {
        try {
          // For now, we'll generate QR codes using the student endpoint pattern
          // This should be replaced with a dedicated staff QR endpoint
          const qrData = JSON.stringify({
            staffId: staff._id.toString(),
            teacherId: staff.teacherId || staff.srNo,
            name: staff.personalInfo?.fullName
          });
          // Placeholder - implement actual QR generation API call
          return { studentId: staff._id, qrCode: null };
        } catch (error) {
          return { studentId: staff._id, qrCode: null };
        }
      });
      
      const results = await Promise.all(qrPromises);
      const qrMap = {};
      results.forEach(({ studentId, qrCode }) => {
        qrMap[studentId] = qrCode;
      });
      
      setQrCodes(qrMap);
      toast.success(`QR codes ready for ${results.length} staff members`, { id: 'qr-generation' });
    } catch (error) {
      toast.error('Failed to generate QR codes', { id: 'qr-generation' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Breadcrumb Navigation */}
      <div className="bg-gray-100 dark:bg-gray-800 px-6 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Home className="w-4 h-4" />
          <span>Dashboard</span>
          <span>/</span>
          <FileText className="w-4 h-4" />
          <span>ID Card Printing</span>
          <span>/</span>
          <Users className="w-4 h-4" />
          <span className="text-gray-900 dark:text-white font-medium">Print Staff Cards</span>
        </div>
      </div>

      {/* Main Section Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-white">Print Staff ID Cards</h1>
        </div>
      </div>

      <div className="flex gap-6 p-6">
        {/* Main Content */}
        <div className="flex-1">
          {/* Filter Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Campus
                </label>
                <select
                  value={selectedCampus}
                  onChange={(e) => setSelectedCampus(e.target.value)}
                  className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  {campuses.map(campus => (
                    <option key={campus} value={campus}>{campus}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  {cardTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Department
                </label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Departments</option>
                  {uniqueDepartments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Actions
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={handleFilter}
                    className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                  >
                    Filter Data
                  </button>
                  <button
                    onClick={handleFilter}
                    className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    title="Quick Filter"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Staff List / No Data */}
          {isFiltered && filteredStaff.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-48 h-32 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <div className="text-4xl">📊</div>
                  </div>
                  <div className="absolute -right-8 top-4">
                    <Search className="w-16 h-16 text-orange-500" />
                  </div>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-2">No Data Filtered...!</h2>
              <p className="text-gray-600 dark:text-gray-400">Please adjust your filters and try again.</p>
            </div>
          ) : isFiltered && filteredStaff.length > 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Selected Staff ({filteredStaff.length})
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={handleGenerateAllQR}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold flex items-center gap-2"
                  >
                    <QrCode className="w-5 h-5" />
                    Generate QR Codes
                  </button>
                  <button
                    onClick={handlePrint}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center gap-2"
                  >
                    <Printer className="w-5 h-5" />
                    Print ID Cards
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStaff.map(staff => (
                  <div key={staff._id} className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                        {staff.personalInfo?.photo ? (
                          <img src={staff.personalInfo.photo} alt={staff.personalInfo.fullName} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <User className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{staff.personalInfo?.fullName || 'N/A'}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">ID: {staff.teacherId || staff.srNo || 'N/A'}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {staff.employment?.department || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-48 h-32 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <div className="text-4xl">📊</div>
                  </div>
                  <div className="absolute -right-8 top-4">
                    <Search className="w-16 h-16 text-orange-500" />
                  </div>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-2">No Data Filtered...!</h2>
              <p className="text-gray-600 dark:text-gray-400">Please use the filters above to select staff members.</p>
            </div>
          )}
        </div>

        {/* Right Sidebar Icons */}
        <div className="flex flex-col gap-4">
          <button className="w-12 h-12 bg-gray-800 dark:bg-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors" title="Video">
            <Camera className="w-6 h-6 text-white" />
          </button>
          <button className="w-12 h-12 bg-gray-800 dark:bg-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors" title="Documents">
            <File className="w-6 h-6 text-white" />
          </button>
          <button className="w-12 h-12 bg-gray-800 dark:bg-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors" title="Settings">
            <Settings className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrintStaffCards;

