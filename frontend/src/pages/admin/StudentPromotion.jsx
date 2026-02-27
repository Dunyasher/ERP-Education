import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { 
  Search, 
  ChevronRight,
  Home
} from 'lucide-react';

const StudentPromotion = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    campus: 'Mai',
    promotionFromClass: '',
    promotionFromSection: '',
    promotionToClass: '',
    promotionToSection: ''
  });
  const [showToClassDropdown, setShowToClassDropdown] = useState(false);

  // Fetch courses/classes
  // Fetch courses - automatically updates when courses are added/updated
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
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0, // Always consider data stale to ensure fresh data
    cacheTime: 0 // Don't cache to ensure immediate updates
  });

  // Fetch students for filtering
  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const response = await api.get('/students');
      return response.data;
    }
  });

  // Get unique sections from students
  const getSections = (classId) => {
    if (!classId) return [];
    const classStudents = students.filter(s => 
      s.academicInfo?.courseId?._id === classId || s.academicInfo?.courseId === classId
    );
    const sections = [...new Set(classStudents.map(s => s.academicInfo?.section).filter(Boolean))];
    return sections.sort();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Reset dependent fields
      ...(name === 'promotionFromClass' && { promotionFromSection: '' }),
      ...(name === 'promotionToClass' && { promotionToSection: '' })
    }));
  };

  const handleSearch = () => {
    // TODO: Implement search functionality
    console.log('Search with filters:', formData);
  };

  const handleManagePromotion = () => {
    // TODO: Implement manage promotion functionality
    console.log('Manage promotion:', formData);
  };

  const fromSections = getSections(formData.promotionFromClass);
  const toSections = getSections(formData.promotionToClass);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Breadcrumbs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="hover:text-gray-900 dark:hover:text-white flex items-center gap-1"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </button>
          <ChevronRight className="w-4 h-4" />
          <button
            onClick={() => navigate('/admin/students')}
            className="hover:text-gray-900 dark:hover:text-white"
          >
            Student Management
          </button>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 dark:text-white font-medium">Student Promotion</span>
        </div>
      </div>

      {/* Header Bar */}
      <div className="bg-blue-600 dark:bg-blue-700 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
            <span className="text-blue-600 font-bold text-lg">P</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Promote Students</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Filter Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            {/* Campus */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Campus
              </label>
              <select
                name="campus"
                value={formData.campus}
                onChange={handleInputChange}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="Mai">Mai</option>
                <option value="Main">Main</option>
              </select>
            </div>

            {/* Promotion From Class */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Promotion From Class
              </label>
              <select
                name="promotionFromClass"
                value={formData.promotionFromClass}
                onChange={handleInputChange}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select Class</option>
                {courses.map(course => (
                  <option key={course._id} value={course._id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>

            {/* From Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Section
              </label>
              <select
                name="promotionFromSection"
                value={formData.promotionFromSection}
                onChange={handleInputChange}
                disabled={!formData.promotionFromClass}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
              >
                <option value="">
                  {!formData.promotionFromClass ? 'Select Class First' : 'Select Section'}
                </option>
                {fromSections.map(section => (
                  <option key={section} value={section}>
                    {section}
                  </option>
                ))}
              </select>
            </div>

            {/* Promotion To Class */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Promotion To Class
              </label>
              <div className="relative">
                <select
                  name="promotionToClass"
                  value={formData.promotionToClass}
                  onChange={handleInputChange}
                  onFocus={() => setShowToClassDropdown(true)}
                  onBlur={() => setTimeout(() => setShowToClassDropdown(false), 200)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select Class</option>
                  {courses.map(course => (
                    <option key={course._id} value={course._id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* To Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Section
              </label>
              <select
                name="promotionToSection"
                value={formData.promotionToSection}
                onChange={handleInputChange}
                disabled={!formData.promotionToClass}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
              >
                <option value="">
                  {!formData.promotionToClass ? 'Select Class First' : 'Select Section'}
                </option>
                {toSections.map(section => (
                  <option key={section} value={section}>
                    {section}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleManagePromotion}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              Manage Promotion
            </button>
            <button
              onClick={handleSearch}
              className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              title="Search"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Empty State */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="relative mb-6">
              {/* Laptop Illustration */}
              <div className="w-64 h-48 bg-gray-200 dark:bg-gray-700 rounded-lg relative overflow-hidden">
                {/* Screen */}
                <div className="absolute top-4 left-4 right-4 bottom-8 bg-gray-300 dark:bg-gray-600 rounded">
                  {/* Charts on screen */}
                  <div className="p-3 h-full flex flex-col gap-2">
                    <div className="flex gap-2">
                      <div className="flex-1 bg-gray-400 dark:bg-gray-500 rounded h-8"></div>
                      <div className="flex-1 bg-gray-400 dark:bg-gray-500 rounded h-12"></div>
                      <div className="flex-1 bg-gray-400 dark:bg-gray-500 rounded h-6"></div>
                    </div>
                    <div className="flex-1 bg-gray-400 dark:bg-gray-500 rounded"></div>
                    <div className="flex gap-2">
                      <div className="w-12 h-12 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
                      <div className="flex-1 bg-gray-400 dark:bg-gray-500 rounded"></div>
                    </div>
                  </div>
                </div>
                {/* Keyboard */}
                <div className="absolute bottom-2 left-2 right-2 h-4 bg-gray-400 dark:bg-gray-500 rounded"></div>
              </div>
              {/* Magnifying Glass */}
              <div className="absolute -top-4 -right-4">
                <div className="w-20 h-20 border-4 border-gray-800 dark:border-gray-300 rounded-full relative">
                  <div className="absolute -bottom-6 -right-6 w-8 h-8 bg-orange-500 transform rotate-45"></div>
                </div>
              </div>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
              No Data Filtered..!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentPromotion;

