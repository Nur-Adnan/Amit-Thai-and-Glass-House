'use client';

import React, { useState, useEffect } from 'react';
import { Button, Input, Select, SelectItem } from '@heroui/react';
import { Trash2, RotateCcw, Search, AlertTriangle, CheckCircle } from 'lucide-react';

interface DeletedItem {
  _id: string;
  name?: string;
  invoiceNo?: string;
  customerId?: string;
  employeeId?: string;
  deletedAt: string;
  deletedBy: {
    name: string;
    email: string;
  };
}

interface SoftDeleteStats {
  total: number;
  active: number;
  deleted: number;
  deletionRate: string;
}

interface ModelStats {
  product: SoftDeleteStats;
  invoice: SoftDeleteStats;
  customer: SoftDeleteStats;
  employee: SoftDeleteStats;
}

const SoftDeleteManager: React.FC = () => {
  const [stats, setStats] = useState<ModelStats | null>(null);
  const [deletedItems, setDeletedItems] = useState<{ [key: string]: DeletedItem[] }>({});
  const [selectedModel, setSelectedModel] = useState<string>('product');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const modelLabels = {
    product: 'Products',
    invoice: 'Invoices',
    customer: 'Customers',
    employee: 'Employees'
  };

  useEffect(() => {
    fetchStats();
    fetchDeletedItems();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/soft-delete/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchDeletedItems = async (modelType?: string) => {
    try {
      setLoading(true);
      const url = modelType 
        ? `http://localhost:3001/api/soft-delete/all?modelType=${modelType}`
        : 'http://localhost:3001/api/soft-delete/all';
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDeletedItems(data.data);
      }
    } catch (error) {
      console.error('Error fetching deleted items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (modelType: string, itemId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/${modelType}s/${itemId}/restore`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          reason: 'Restored from soft delete manager'
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: `${modelType} restored successfully` });
        fetchStats();
        fetchDeletedItems();
        setTimeout(() => setMessage(null), 3000);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Restore failed' });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error occurred' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleBulkRestore = async () => {
    const items = deletedItems[selectedModel]?.map(item => ({
      modelType: selectedModel,
      id: item._id
    })) || [];

    if (items.length === 0) {
      setMessage({ type: 'error', text: 'No items to restore' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/soft-delete/bulk-restore', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          items,
          reason: 'Bulk restore from soft delete manager'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessage({ 
          type: 'success', 
          text: `${data.data.restored.length} items restored successfully` 
        });
        fetchStats();
        fetchDeletedItems();
        setTimeout(() => setMessage(null), 3000);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Bulk restore failed' });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error occurred' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const getItemDisplayName = (item: DeletedItem, modelType: string) => {
    switch (modelType) {
      case 'product':
        return item.name || 'Unknown Product';
      case 'invoice':
        return item.invoiceNo || 'Unknown Invoice';
      case 'customer':
        return `${item.name || 'Unknown'} (${item.customerId || 'No ID'})`;
      case 'employee':
        return `${item.name || 'Unknown'} (${item.employeeId || 'No ID'})`;
      default:
        return 'Unknown Item';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Soft Delete Manager</h1>
        <p className="text-gray-600">Manage and restore soft deleted items</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-4 p-4 rounded-lg flex items-center ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 mr-2" />
          ) : (
            <AlertTriangle className="w-5 h-5 mr-2" />
          )}
          {message.text}
        </div>
      )}

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Object.entries(stats).map(([modelType, modelStats]) => (
            <div key={modelType} className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {modelLabels[modelType as keyof typeof modelLabels]}
              </h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-medium">{modelStats.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-600">Active:</span>
                  <span className="font-medium text-green-600">{modelStats.active}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-600">Deleted:</span>
                  <span className="font-medium text-red-600">{modelStats.deleted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Deletion Rate:</span>
                  <span className="font-medium">{modelStats.deletionRate}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div>
              <Select
                label="Model Type"
                selectedKeys={selectedModel ? [selectedModel] : []}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;
                  setSelectedModel(value);
                  fetchDeletedItems(value);
                }}
                className="w-48"
              >
                {Object.entries(modelLabels).map(([value, label]) => (
                  <SelectItem key={value}>{label}</SelectItem>
                ))}
              </Select>
            </div>

            <div>
              <Input
                type="text"
                label="Search"
                placeholder="Search deleted items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                startContent={<Search className="text-gray-400 w-4 h-4" />}
                className="w-64"
              />
            </div>
          </div>

          <Button
            onPress={handleBulkRestore}
            isDisabled={!deletedItems[selectedModel]?.length}
            color="success"
            startContent={<RotateCcw className="w-4 h-4" />}
          >
            Restore All
          </Button>
        </div>
      </div>

      {/* Deleted Items List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Deleted {modelLabels[selectedModel as keyof typeof modelLabels]}
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        ) : deletedItems[selectedModel]?.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {deletedItems[selectedModel]
              .filter(item => {
                if (!searchQuery) return true;
                const displayName = getItemDisplayName(item, selectedModel);
                return displayName.toLowerCase().includes(searchQuery.toLowerCase());
              })
              .map((item) => (
                <div key={item._id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">
                        {getItemDisplayName(item, selectedModel)}
                      </h3>
                      <div className="mt-1 text-xs text-gray-500">
                        <p>Deleted: {new Date(item.deletedAt).toLocaleString()}</p>
                        <p>By: {item.deletedBy.name} ({item.deletedBy.email})</p>
                      </div>
                    </div>
                    <Button
                      onPress={() => handleRestore(selectedModel, item._id)}
                      color="primary"
                      size="sm"
                      className="ml-4"
                      startContent={<RotateCcw className="w-3 h-3" />}
                    >
                      Restore
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <Trash2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No deleted {modelLabels[selectedModel as keyof typeof modelLabels].toLowerCase()} found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SoftDeleteManager;