'use client';

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image';
import Layout from '../../components/Layout';

interface ShopConfig {
  _id?: string;
  shopName: string;
  logo?: {
    url?: string;
    filename?: string;
    size?: number;
    uploadedAt?: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  phone: {
    primary: string;
    secondary?: string;
    whatsapp?: string;
  };
  email: {
    primary?: string;
    support?: string;
  };
  website?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
  };
  invoicePrefix: string;
  footerNote: string;
  termsAndConditions?: string;
  currency: {
    code: string;
    symbol: string;
    position: 'before' | 'after';
  };
  tax: {
    enabled: boolean;
    rate: number;
    label: string;
    registrationNumber?: string;
  };
  businessRegistration?: {
    registrationNumber?: string;
    licenseNumber?: string;
    establishedYear?: number;
  };
  invoiceSettings: {
    showLogo: boolean;
    showAddress: boolean;
    showPhone: boolean;
    showEmail: boolean;
    showWebsite: boolean;
    showFooterNote: boolean;
    showTerms: boolean;
    showTax: boolean;
    logoSize: 'small' | 'medium' | 'large';
  };
  theme: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
  };
}

export default function ShopConfigPage() {
  const [config, setConfig] = useState<ShopConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const fetchShopConfig = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const response = await fetch('http://localhost:3001/api/shop-config/admin', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setConfig(data.data);
          
          // If this is default config (no database record), automatically save it
          if (data.message && data.message.includes('default values')) {
            console.log('No shop configuration found, initializing with defaults...');
            await initializeShopConfig(data.data);
          }
        } else {
          console.error('Invalid response format:', data);
        }
      } else if (response.status === 401) {
        console.error('Authentication failed - please log in again');
      } else if (response.status === 403) {
        console.error('Access denied - owner permissions required');
      } else {
        console.error('Failed to fetch shop config:', response.status, response.statusText);
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Error details:', errorData);
      }
    } catch (error) {
      console.error('Network error fetching shop config:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShopConfig();
  }, [fetchShopConfig]);

  const initializeShopConfig = async (defaultConfig: ShopConfig) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/shop-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(defaultConfig)
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data.data);
        console.log('Shop configuration initialized successfully');
      } else {
        console.error('Failed to initialize shop configuration');
      }
    } catch (error) {
      console.error('Error initializing shop config:', error);
    }
  };

  const handleSave = async () => {
    if (!config) return;

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/shop-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data.data);
        alert('Shop configuration saved successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error saving shop config:', error);
      alert('Error saving configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async () => {
    if (!logoFile) return;

    setUploadingLogo(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('logo', logoFile);

      const response = await fetch('http://localhost:3001/api/shop-config/logo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(prev => prev ? { ...prev, logo: data.data.logo } : null);
        setLogoFile(null);
        setLogoPreview(null);
        alert('Logo uploaded successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Error uploading logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteLogo = async () => {
    if (!confirm('Are you sure you want to delete the logo?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/shop-config/logo', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setConfig(prev => prev ? { ...prev, logo: undefined } : null);
        alert('Logo deleted successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting logo:', error);
      alert('Error deleting logo');
    }
  };

  const updateConfig = (path: string, value: any) => {
    if (!config) return;

    const keys = path.split('.');
    const newConfig = { ...config };
    let obj: any = newConfig;
    
    for (let i = 0; i < keys.length - 1; i++) {
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    
    setConfig(newConfig);
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <div className="text-lg font-medium text-gray-900 mb-2">Loading Shop Configuration</div>
              <div className="text-gray-600">Please wait while we load your shop settings...</div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!config) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <div className="text-red-600 text-lg font-medium mb-2">Failed to load shop configuration</div>
              <p className="text-red-700 mb-4">
                Unable to connect to the server or load the shop configuration. This could be due to:
              </p>
              <ul className="text-red-700 text-sm list-disc list-inside mb-4 space-y-1">
                <li>Server connection issues</li>
                <li>Authentication problems (please try logging in again)</li>
                <li>Insufficient permissions (owner access required)</li>
                <li>Database connectivity issues</li>
              </ul>
            </div>
            <div className="space-x-4">
              <button 
                onClick={fetchShopConfig}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Retry Loading
              </button>
              <button 
                onClick={async () => {
                  // Try to initialize with default config
                  const defaultConfig = {
                    shopName: 'Amit Thai & Aluminum',
                    address: {
                      street: 'Shop Address Street',
                      city: 'Dhaka',
                      state: 'Dhaka Division',
                      zipCode: '1000',
                      country: 'Bangladesh'
                    },
                    phone: {
                      primary: '+880-XXX-XXXXXX'
                    },
                    email: {
                      primary: 'info@amitthaialuminum.com'
                    },
                    invoicePrefix: 'INV',
                    footerNote: 'Thank you for your business!',
                    currency: {
                      code: 'BDT',
                      symbol: '৳',
                      position: 'before'
                    },
                    tax: {
                      enabled: false,
                      rate: 0,
                      label: 'VAT'
                    },
                    theme: {
                      primaryColor: '#2563eb',
                      secondaryColor: '#64748b',
                      fontFamily: 'Arial'
                    },
                    invoiceSettings: {
                      showLogo: true,
                      showAddress: true,
                      showPhone: true,
                      showEmail: true,
                      showWebsite: false,
                      showFooterNote: true,
                      showTerms: false,
                      showTax: false,
                      logoSize: 'medium'
                    }
                  };
                  await initializeShopConfig(defaultConfig as ShopConfig);
                  await fetchShopConfig();
                }}
                className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                Initialize Default Config
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const tabs = [
    { id: 'basic', name: 'Basic Info', icon: '🏪' },
    { id: 'contact', name: 'Contact', icon: '📞' },
    { id: 'invoice', name: 'Invoice Settings', icon: '📄' },
    { id: 'appearance', name: 'Appearance', icon: '🎨' },
    { id: 'advanced', name: 'Advanced', icon: '⚙️' }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Shop Configuration</h1>
            <p className="text-gray-600">Manage your shop details and invoice settings</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow p-6">
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              
              {/* Logo Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Shop Logo</label>
                <div className="flex items-center space-x-4">
                  {config.logo?.url && (
                    <div className="relative">
                      <Image 
                        src={config.logo.url} 
                        alt="Shop Logo" 
                        width={80}
                        height={80}
                        className="w-20 h-20 object-contain border rounded"
                      />
                      <button
                        onClick={handleDeleteLogo}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  
                  {logoPreview && (
                    <div className="relative">
                      <Image 
                        src={logoPreview} 
                        alt="Logo Preview" 
                        width={80}
                        height={80}
                        className="w-20 h-20 object-contain border rounded"
                      />
                      <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                        New
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoFileChange}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="cursor-pointer bg-gray-100 text-gray-700 px-4 py-2 rounded border hover:bg-gray-200"
                    >
                      Choose Logo
                    </label>
                    {logoFile && (
                      <button
                        onClick={handleLogoUpload}
                        disabled={uploadingLogo}
                        className="ml-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                      >
                        {uploadingLogo ? 'Uploading...' : 'Upload'}
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-1">Recommended: 200x200px, max 5MB</p>
              </div>

              {/* Shop Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Shop Name *</label>
                <input
                  type="text"
                  value={config.shopName}
                  onChange={(e) => updateConfig('shopName', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter shop name"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <input
                      type="text"
                      value={config.address.street}
                      onChange={(e) => updateConfig('address.street', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Street Address *"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={config.address.city}
                      onChange={(e) => updateConfig('address.city', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="City *"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={config.address.state}
                      onChange={(e) => updateConfig('address.state', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="State/Division"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={config.address.zipCode}
                      onChange={(e) => updateConfig('address.zipCode', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Zip Code"
                    />
                  </div>
                </div>
              </div>

              {/* Business Registration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Registration</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <input
                      type="text"
                      value={config.businessRegistration?.registrationNumber || ''}
                      onChange={(e) => updateConfig('businessRegistration.registrationNumber', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Registration Number"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={config.businessRegistration?.licenseNumber || ''}
                      onChange={(e) => updateConfig('businessRegistration.licenseNumber', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="License Number"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      value={config.businessRegistration?.establishedYear || ''}
                      onChange={(e) => updateConfig('businessRegistration.establishedYear', parseInt(e.target.value))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Established Year"
                      min="1900"
                      max={new Date().getFullYear()}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
              
              {/* Phone Numbers */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Numbers</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <input
                      type="text"
                      value={config.phone.primary}
                      onChange={(e) => updateConfig('phone.primary', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Primary Phone *"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={config.phone.secondary || ''}
                      onChange={(e) => updateConfig('phone.secondary', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Secondary Phone"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={config.phone.whatsapp || ''}
                      onChange={(e) => updateConfig('phone.whatsapp', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="WhatsApp"
                    />
                  </div>
                </div>
              </div>

              {/* Email Addresses */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Addresses</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <input
                      type="email"
                      value={config.email.primary || ''}
                      onChange={(e) => updateConfig('email.primary', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Primary Email"
                    />
                  </div>
                  <div>
                    <input
                      type="email"
                      value={config.email.support || ''}
                      onChange={(e) => updateConfig('email.support', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Support Email"
                    />
                  </div>
                </div>
              </div>

              {/* Website */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                <input
                  type="url"
                  value={config.website || ''}
                  onChange={(e) => updateConfig('website', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://www.yourwebsite.com"
                />
              </div>

              {/* Social Media */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Social Media</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <input
                      type="url"
                      value={config.socialMedia?.facebook || ''}
                      onChange={(e) => updateConfig('socialMedia.facebook', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Facebook URL"
                    />
                  </div>
                  <div>
                    <input
                      type="url"
                      value={config.socialMedia?.instagram || ''}
                      onChange={(e) => updateConfig('socialMedia.instagram', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Instagram URL"
                    />
                  </div>
                  <div>
                    <input
                      type="url"
                      value={config.socialMedia?.linkedin || ''}
                      onChange={(e) => updateConfig('socialMedia.linkedin', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="LinkedIn URL"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'invoice' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Invoice Settings</h3>
              
              {/* Invoice Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Prefix *</label>
                  <input
                    type="text"
                    value={config.invoicePrefix}
                    onChange={(e) => updateConfig('invoicePrefix', e.target.value.toUpperCase())}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="INV"
                    maxLength={10}
                  />
                  <p className="text-sm text-gray-500 mt-1">Format: {config.invoicePrefix}-YYYYMM-XXXX</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={config.currency.code}
                      onChange={(e) => {
                        const symbol = e.target.value === 'BDT' ? '৳' : e.target.value === 'USD' ? '$' : '€';
                        updateConfig('currency.code', e.target.value);
                        updateConfig('currency.symbol', symbol);
                      }}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="BDT">BDT (৳)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                    <select
                      value={config.currency.position}
                      onChange={(e) => updateConfig('currency.position', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="before">Before Amount</option>
                      <option value="after">After Amount</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Footer Note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Footer Note</label>
                <textarea
                  value={config.footerNote}
                  onChange={(e) => updateConfig('footerNote', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Thank you for your business!"
                  maxLength={500}
                />
              </div>

              {/* Terms and Conditions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Terms and Conditions</label>
                <textarea
                  value={config.termsAndConditions || ''}
                  onChange={(e) => updateConfig('termsAndConditions', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="Enter terms and conditions..."
                  maxLength={2000}
                />
              </div>

              {/* Tax Configuration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tax Configuration</label>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.tax.enabled}
                      onChange={(e) => updateConfig('tax.enabled', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">Enable Tax</label>
                  </div>
                  
                  {config.tax.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <input
                          type="number"
                          value={config.tax.rate}
                          onChange={(e) => updateConfig('tax.rate', parseFloat(e.target.value))}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Tax Rate (%)"
                          min="0"
                          max="100"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={config.tax.label}
                          onChange={(e) => updateConfig('tax.label', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Tax Label (VAT, GST, etc.)"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={config.tax.registrationNumber || ''}
                          onChange={(e) => updateConfig('tax.registrationNumber', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Tax Registration Number"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Display Settings */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Display Settings</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { key: 'showLogo', label: 'Show Logo' },
                    { key: 'showAddress', label: 'Show Address' },
                    { key: 'showPhone', label: 'Show Phone' },
                    { key: 'showEmail', label: 'Show Email' },
                    { key: 'showWebsite', label: 'Show Website' },
                    { key: 'showFooterNote', label: 'Show Footer Note' },
                    { key: 'showTerms', label: 'Show Terms' },
                    { key: 'showTax', label: 'Show Tax' }
                  ].map((setting) => (
                    <div key={setting.key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.invoiceSettings[setting.key as keyof typeof config.invoiceSettings] as boolean}
                        onChange={(e) => updateConfig(`invoiceSettings.${setting.key}`, e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 text-sm text-gray-700">{setting.label}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Appearance Settings</h3>
              
              {/* Theme Colors */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Theme Colors</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Primary Color</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={config.theme.primaryColor}
                        onChange={(e) => updateConfig('theme.primaryColor', e.target.value)}
                        className="w-12 h-10 border border-gray-300 rounded"
                      />
                      <input
                        type="text"
                        value={config.theme.primaryColor}
                        onChange={(e) => updateConfig('theme.primaryColor', e.target.value)}
                        className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="#2563eb"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Secondary Color</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={config.theme.secondaryColor}
                        onChange={(e) => updateConfig('theme.secondaryColor', e.target.value)}
                        className="w-12 h-10 border border-gray-300 rounded"
                      />
                      <input
                        type="text"
                        value={config.theme.secondaryColor}
                        onChange={(e) => updateConfig('theme.secondaryColor', e.target.value)}
                        className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="#64748b"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Font Family */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Font Family</label>
                <select
                  value={config.theme.fontFamily}
                  onChange={(e) => updateConfig('theme.fontFamily', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Arial">Arial</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Open Sans">Open Sans</option>
                </select>
              </div>

              {/* Logo Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Logo Size on Invoice</label>
                <select
                  value={config.invoiceSettings.logoSize}
                  onChange={(e) => updateConfig('invoiceSettings.logoSize', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>

              {/* Preview */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
                <div 
                  className="border rounded-lg p-6"
                  style={{ 
                    backgroundColor: config.theme.primaryColor + '10',
                    borderColor: config.theme.primaryColor,
                    fontFamily: config.theme.fontFamily
                  }}
                >
                  <div className="text-center">
                    <h3 
                      className="text-xl font-bold mb-2"
                      style={{ color: config.theme.primaryColor }}
                    >
                      {config.shopName}
                    </h3>
                    <p style={{ color: config.theme.secondaryColor }}>
                      Sample invoice preview with your theme
                    </p>
                    <div className="mt-4 text-lg">
                      Total: {config.currency.position === 'before' ? config.currency.symbol : ''}1,500.00{config.currency.position === 'after' ? config.currency.symbol : ''}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Advanced Settings</h3>
              
              {/* Reset Configuration */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="text-lg font-medium text-yellow-800 mb-2">Reset Configuration</h4>
                <p className="text-yellow-700 mb-4">
                  This will reset all settings to default values. This action cannot be undone.
                </p>
                <button
                  onClick={async () => {
                    if (!confirm('Are you sure you want to reset all configuration to defaults? This cannot be undone.')) return;
                    
                    try {
                      const token = localStorage.getItem('token');
                      const response = await fetch('http://localhost:3001/api/shop-config/reset', {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${token}`
                        }
                      });

                      if (response.ok) {
                        const data = await response.json();
                        setConfig(data.data);
                        alert('Configuration reset successfully!');
                      } else {
                        const error = await response.json();
                        alert(`Error: ${error.message}`);
                      }
                    } catch (error) {
                      console.error('Error resetting config:', error);
                      alert('Error resetting configuration');
                    }
                  }}
                  className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
                >
                  Reset to Defaults
                </button>
              </div>

              {/* Export/Import */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-lg font-medium text-blue-800 mb-2">Export Configuration</h4>
                <p className="text-blue-700 mb-4">
                  Download your current configuration as a backup.
                </p>
                <button
                  onClick={() => {
                    const dataStr = JSON.stringify(config, null, 2);
                    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                    const exportFileDefaultName = `shop-config-${new Date().toISOString().split('T')[0]}.json`;
                    
                    const linkElement = document.createElement('a');
                    linkElement.setAttribute('href', dataUri);
                    linkElement.setAttribute('download', exportFileDefaultName);
                    linkElement.click();
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Export Configuration
                </button>
              </div>

              {/* System Information */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-lg font-medium text-gray-800 mb-2">System Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Configuration ID:</span>
                    <span className="ml-2 text-gray-600">{config._id}</span>
                  </div>
                  <div>
                    <span className="font-medium">Version:</span>
                    <span className="ml-2 text-gray-600">{(config as any).version || 1}</span>
                  </div>
                  <div>
                    <span className="font-medium">Created:</span>
                    <span className="ml-2 text-gray-600">
                      {(config as any).createdAt ? new Date((config as any).createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Last Updated:</span>
                    <span className="ml-2 text-gray-600">
                      {(config as any).updatedAt ? new Date((config as any).updatedAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}