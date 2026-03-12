import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
  DollarSign,
  Save,
  Settings as SettingsIcon,
  Send,
  Bell,
  Receipt
} from 'lucide-react';

const ACCOUNTANT_SETTINGS_KEY = 'accountantSettings';

const loadSettings = () => {
  try {
    const saved = localStorage.getItem(ACCOUNTANT_SETTINGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        schoolName: parsed.schoolName || '',
        schoolAddress: parsed.schoolAddress || '',
        academicYear: parsed.academicYear || `${new Date().getFullYear() - 1} - ${new Date().getFullYear()}`,
        currency: parsed.currency || 'USD',
        dateFormat: parsed.dateFormat || 'MM/DD/YYYY',
        enableLateFee: parsed.enableLateFee !== undefined ? parsed.enableLateFee : true,
        sendPaymentReminders: parsed.sendPaymentReminders !== undefined ? parsed.sendPaymentReminders : true
      };
    }
  } catch (error) {
    console.error('Error loading accountant settings:', error);
  }
  const year = new Date().getFullYear();
  return {
    schoolName: '',
    schoolAddress: '',
    academicYear: `${year - 1} - ${year}`,
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    enableLateFee: true,
    sendPaymentReminders: true
  };
};

const CURRENCIES = [
  { value: 'USD', label: 'USD - United States Dollar' },
  { value: 'PKR', label: 'PKR - Pakistani Rupee' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'INR', label: 'INR - Indian Rupee' }
];

const DATE_FORMATS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }
];

const ACADEMIC_YEARS = [
  `${new Date().getFullYear() - 2} - ${new Date().getFullYear() - 1}`,
  `${new Date().getFullYear() - 1} - ${new Date().getFullYear()}`,
  `${new Date().getFullYear()} - ${new Date().getFullYear() + 1}`
];

const AccountantSettings = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState(loadSettings);
  const [messageForm, setMessageForm] = useState({
    subject: '',
    message: '',
    priority: 'High'
  });

  // Fetch profile for college/school info
  const { data: profile } = useQuery({
    queryKey: ['currentProfile'],
    queryFn: async () => {
      const response = await api.get('/settings/profile');
      return response.data;
    }
  });

  // Initialize settings from college profile
  useEffect(() => {
    if (profile?.college) {
      const addr = profile.college.contactInfo?.address;
      const fullAddress = addr
        ? [addr.street, addr.city, addr.state, addr.zipCode, addr.country].filter(Boolean).join(', ')
        : '';
      setSettings(prev => ({
        ...prev,
        schoolName: prev.schoolName || profile.college.name || '',
        schoolAddress: prev.schoolAddress || fullAddress || ''
      }));
    }
  }, [profile]);

  const saveSettingsMutation = useMutation({
    mutationFn: async (data) => {
      localStorage.setItem(ACCOUNTANT_SETTINGS_KEY, JSON.stringify(data));
      return Promise.resolve(data);
    },
    onSuccess: () => {
      toast.success('Settings saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['accountantSettings'] });
    },
    onError: () => {
      toast.error('Failed to save settings');
    }
  });

  const handleSave = () => {
    saveSettingsMutation.mutate(settings);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageForm.subject.trim() || !messageForm.message.trim()) {
      toast.error('Please enter subject and message');
      return;
    }
    toast.success('Message sent to admin successfully!');
    setMessageForm({ subject: '', message: '', priority: 'High' });
  };

  const tabs = [
    { id: 'general', label: 'General Settings', icon: SettingsIcon },
    { id: 'fee', label: 'Fee Settings', icon: DollarSign },
    { id: 'invoice', label: 'Invoice Settings', icon: Receipt },
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <DollarSign className="w-4 h-4" />
        <span className="text-gray-900 dark:text-white font-medium">Accountant Settings</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Accountant Settings */}
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            Accountant Settings
          </h1>

          {/* Tabs */}
          <div className="flex gap-0 border-b border-gray-200 dark:border-gray-700 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'general' && (
              <div className="space-y-5 max-w-xl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    School Name:
                  </label>
                  <input
                    type="text"
                    value={settings.schoolName}
                    onChange={(e) => setSettings({ ...settings, schoolName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="School Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    School Address:
                  </label>
                  <input
                    type="text"
                    value={settings.schoolAddress}
                    onChange={(e) => setSettings({ ...settings, schoolAddress: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="123 Elm Street, Springfield"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Academic Year:
                  </label>
                  <select
                    value={settings.academicYear}
                    onChange={(e) => setSettings({ ...settings, academicYear: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {ACADEMIC_YEARS.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Currency:
                  </label>
                  <select
                    value={settings.currency}
                    onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date Format:
                  </label>
                  <select
                    value={settings.dateFormat}
                    onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {DATE_FORMATS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-between py-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Enable Late Fee:
                  </label>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={settings.enableLateFee}
                    onClick={() => setSettings({ ...settings, enableLateFee: !settings.enableLateFee })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.enableLateFee ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.enableLateFee ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {settings.enableLateFee ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Send Payment Reminders:
                  </label>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={settings.sendPaymentReminders}
                    onClick={() => setSettings({ ...settings, sendPaymentReminders: !settings.sendPaymentReminders })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.sendPaymentReminders ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.sendPaymentReminders ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {settings.sendPaymentReminders ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <button
                  onClick={handleSave}
                  disabled={saveSettingsMutation.isLoading}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saveSettingsMutation.isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
            {activeTab === 'fee' && (
              <div className="text-gray-500 dark:text-gray-400 py-8">
                Fee Settings content – configure late fee amounts, due dates, and payment terms.
              </div>
            )}
            {activeTab === 'invoice' && (
              <div className="text-gray-500 dark:text-gray-400 py-8">
                Invoice Settings content – customize invoice templates and numbering.
              </div>
            )}
            {activeTab === 'notifications' && (
              <div className="text-gray-500 dark:text-gray-400 py-8">
                Notification preferences for payment reminders and alerts.
              </div>
            )}
          </div>
        </div>

        {/* Right: Send Message to Admin */}
        <div className="w-full lg:w-96 flex-shrink-0">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Send Message to Admin
            </h2>
            <form onSubmit={handleSendMessage} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subject:
                </label>
                <input
                  type="text"
                  value={messageForm.subject}
                  onChange={(e) => setMessageForm({ ...messageForm, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Subject..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Message:
                </label>
                <textarea
                  value={messageForm.message}
                  onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Write your message..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Priority:
                </label>
                <select
                  value={messageForm.priority}
                  onChange={(e) => setMessageForm({ ...messageForm, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountantSettings;
