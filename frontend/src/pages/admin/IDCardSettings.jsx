import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { 
  Home, 
  FileText, 
  Settings as SettingsIcon,
  Save,
  Palette,
  Type,
  Layout,
  Printer
} from 'lucide-react';

const IDCardSettings = () => {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState({
    cardSize: 'standard', // standard, custom
    cardWidth: 85, // mm
    cardHeight: 54, // mm
    orientation: 'landscape', // landscape, portrait
    layout: '3x3', // 3x3, 2x2, 4x4
    headerText: 'STUDENT ID CARD',
    footerText: `Valid for Academic Year ${new Date().getFullYear()}`,
    primaryColor: '#1976d2',
    secondaryColor: '#ffffff',
    textColor: '#000000',
    borderColor: '#000000',
    borderWidth: 2,
    includeQRCode: true,
    includePhoto: true,
    includeBarcode: false,
    logo: '',
    backgroundImage: '',
    fontFamily: 'Arial',
    fontSize: 10
  });

  const saveSettingsMutation = useMutation(
    async (data) => {
      // In a real implementation, save to backend
      return Promise.resolve(data);
    },
    {
      onSuccess: () => {
        toast.success('Settings saved successfully!');
        queryClient.invalidateQueries('idCardSettings');
      },
      onError: (error) => {
        toast.error('Failed to save settings');
      }
    }
  );

  const handleSave = () => {
    saveSettingsMutation.mutate(settings);
  };

  const handleReset = () => {
    setSettings({
      cardSize: 'standard',
      cardWidth: 85,
      cardHeight: 54,
      orientation: 'landscape',
      layout: '3x3',
      headerText: 'STUDENT ID CARD',
      footerText: `Valid for Academic Year ${new Date().getFullYear()}`,
      primaryColor: '#1976d2',
      secondaryColor: '#ffffff',
      textColor: '#000000',
      borderColor: '#000000',
      borderWidth: 2,
      includeQRCode: true,
      includePhoto: true,
      includeBarcode: false,
      logo: '',
      backgroundImage: '',
      fontFamily: 'Arial',
      fontSize: 10
    });
    toast.success('Settings reset to defaults');
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
          <SettingsIcon className="w-4 h-4" />
          <span className="text-gray-900 dark:text-white font-medium">ID Card Settings</span>
        </div>
      </div>

      {/* Main Section Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <SettingsIcon className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-white">ID Card Settings</h1>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card Dimensions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Layout className="w-5 h-5" />
                Card Dimensions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Card Size
                  </label>
                  <select
                    value={settings.cardSize}
                    onChange={(e) => setSettings({ ...settings, cardSize: e.target.value })}
                    className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="standard">Standard (85mm x 54mm)</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                {settings.cardSize === 'custom' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Width (mm)
                      </label>
                      <input
                        type="number"
                        value={settings.cardWidth}
                        onChange={(e) => setSettings({ ...settings, cardWidth: parseInt(e.target.value) })}
                        className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Height (mm)
                      </label>
                      <input
                        type="number"
                        value={settings.cardHeight}
                        onChange={(e) => setSettings({ ...settings, cardHeight: parseInt(e.target.value) })}
                        className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Orientation
                  </label>
                  <select
                    value={settings.orientation}
                    onChange={(e) => setSettings({ ...settings, orientation: e.target.value })}
                    className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="landscape">Landscape</option>
                    <option value="portrait">Portrait</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Print Layout
                  </label>
                  <select
                    value={settings.layout}
                    onChange={(e) => setSettings({ ...settings, layout: e.target.value })}
                    className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="3x3">3x3 (9 cards per page)</option>
                    <option value="2x2">2x2 (4 cards per page)</option>
                    <option value="4x4">4x4 (16 cards per page)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Colors */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Colors
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Primary Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={settings.primaryColor}
                      onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                      className="w-16 h-10 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.primaryColor}
                      onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                      className="flex-1 border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Text Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={settings.textColor}
                      onChange={(e) => setSettings({ ...settings, textColor: e.target.value })}
                      className="w-16 h-10 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.textColor}
                      onChange={(e) => setSettings({ ...settings, textColor: e.target.value })}
                      className="flex-1 border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Border Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={settings.borderColor}
                      onChange={(e) => setSettings({ ...settings, borderColor: e.target.value })}
                      className="w-16 h-10 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.borderColor}
                      onChange={(e) => setSettings({ ...settings, borderColor: e.target.value })}
                      className="flex-1 border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Border Width (px)
                  </label>
                  <input
                    type="number"
                    value={settings.borderWidth}
                    onChange={(e) => setSettings({ ...settings, borderWidth: parseInt(e.target.value) })}
                    className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Text Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Type className="w-5 h-5" />
                Text Settings
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Header Text
                  </label>
                  <input
                    type="text"
                    value={settings.headerText}
                    onChange={(e) => setSettings({ ...settings, headerText: e.target.value })}
                    className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Footer Text
                  </label>
                  <input
                    type="text"
                    value={settings.footerText}
                    onChange={(e) => setSettings({ ...settings, footerText: e.target.value })}
                    className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Font Family
                    </label>
                    <select
                      value={settings.fontFamily}
                      onChange={(e) => setSettings({ ...settings, fontFamily: e.target.value })}
                      className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="Arial">Arial</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Courier New">Courier New</option>
                      <option value="Helvetica">Helvetica</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Font Size (px)
                    </label>
                    <input
                      type="number"
                      value={settings.fontSize}
                      onChange={(e) => setSettings({ ...settings, fontSize: parseInt(e.target.value) })}
                      className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Printer className="w-5 h-5" />
                Card Features
              </h2>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.includePhoto}
                    onChange={(e) => setSettings({ ...settings, includePhoto: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Include Student Photo</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.includeQRCode}
                    onChange={(e) => setSettings({ ...settings, includeQRCode: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Include QR Code</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.includeBarcode}
                    onChange={(e) => setSettings({ ...settings, includeBarcode: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Include Barcode</span>
                </label>
              </div>
            </div>
          </div>

          {/* Preview & Actions */}
          <div className="space-y-6">
            {/* Preview */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Preview</h2>
              <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                <div 
                  className="mx-auto border-2 rounded-lg p-3 bg-white"
                  style={{
                    width: '200px',
                    height: '120px',
                    borderColor: settings.borderColor,
                    borderWidth: `${settings.borderWidth}px`
                  }}
                >
                  <div 
                    className="text-center border-b-2 pb-2 mb-2"
                    style={{ borderColor: settings.borderColor }}
                  >
                    <h3 
                      className="font-bold text-xs"
                      style={{ color: settings.textColor, fontFamily: settings.fontFamily }}
                    >
                      {settings.headerText}
                    </h3>
                  </div>
                  <div className="text-xs" style={{ color: settings.textColor, fontFamily: settings.fontFamily }}>
                    <p>Sample Student</p>
                    <p>ID: 12345</p>
                  </div>
                  <div 
                    className="text-center border-t mt-2 pt-1 text-xs"
                    style={{ borderColor: settings.borderColor, color: settings.textColor, fontFamily: settings.fontFamily }}
                  >
                    {settings.footerText}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="space-y-3">
                <button
                  onClick={handleSave}
                  disabled={saveSettingsMutation.isLoading}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  {saveSettingsMutation.isLoading ? 'Saving...' : 'Save Settings'}
                </button>
                <button
                  onClick={handleReset}
                  className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
                >
                  Reset to Defaults
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IDCardSettings;

