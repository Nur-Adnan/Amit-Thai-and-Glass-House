'use client';

import React, { useState, useEffect } from 'react';
import { Button, Select, SelectItem } from '@heroui/react';
import { Shield, Users, Settings, Check, X, AlertTriangle, CheckCircle } from 'lucide-react';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface RolePermission {
  name: string;
  description: string;
  category: string;
  grantedAt: string;
}

interface PermissionMatrix {
  roles: string[];
  permissions: Permission[];
  matrix: {
    [role: string]: {
      permissions: RolePermission[];
      permissionNames: string[];
    };
  };
}

interface PermissionStats {
  totalPermissions: number;
  permissionsByCategory: { [category: string]: number };
  roleStats: {
    [role: string]: {
      totalPermissions: number;
      permissionsByCategory: { [category: string]: number };
    };
  };
}

const PermissionManager: React.FC = () => {
  const [matrix, setMatrix] = useState<PermissionMatrix | null>(null);
  const [stats, setStats] = useState<PermissionStats | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('manager');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pendingChanges, setPendingChanges] = useState<{ [role: string]: string[] }>({});

  const categoryColors = {
    invoice: 'bg-blue-100 text-blue-800',
    product: 'bg-green-100 text-green-800',
    financial: 'bg-yellow-100 text-yellow-800',
    employee: 'bg-purple-100 text-purple-800',
    system: 'bg-red-100 text-red-800'
  };

  const roleLabels = {
    owner: 'Owner',
    manager: 'Manager',
    accountant: 'Accountant'
  };

  useEffect(() => {
    fetchPermissionMatrix();
    fetchPermissionStats();
  }, []);

  const fetchPermissionMatrix = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setMessage({ type: 'error', text: 'Authentication token not found. Please log in again.' });
        return;
      }

      const response = await fetch('http://localhost:3001/api/permissions/matrix', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setMatrix(data.data);
          
          // Initialize pending changes with current permissions
          const initialPendingChanges: { [role: string]: string[] } = {};
          Object.entries(data.data.matrix).forEach(([role, roleData]: [string, any]) => {
            initialPendingChanges[role] = roleData.permissionNames || [];
          });
          setPendingChanges(initialPendingChanges);
        } else {
          setMessage({ type: 'error', text: data.message || 'Invalid response format' });
        }
      } else if (response.status === 401) {
        setMessage({ type: 'error', text: 'Authentication failed. Please log in again.' });
      } else if (response.status === 403) {
        setMessage({ type: 'error', text: 'Access denied. You need owner permissions to manage permissions.' });
      } else {
        const error = await response.json().catch(() => ({ message: 'Unknown error occurred' }));
        setMessage({ type: 'error', text: error.message || 'Failed to fetch permissions' });
      }
    } catch (error) {
      console.error('Permission matrix fetch error:', error);
      setMessage({ type: 'error', text: 'Network error occurred. Please check your connection.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissionStats = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return; // Silently fail for stats, as it's not critical
      }

      const response = await fetch('http://localhost:3001/api/permissions/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setStats(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching permission stats:', error);
      // Don't show error message for stats as it's not critical
    }
  };

  const initializePermissions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setMessage({ type: 'error', text: 'Authentication token not found. Please log in again.' });
        return;
      }

      const response = await fetch('http://localhost:3001/api/permissions/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessage({ type: 'success', text: data.message || 'Permission system initialized successfully' });
        // Refresh data after initialization
        await fetchPermissionMatrix();
        await fetchPermissionStats();
      } else if (response.status === 401) {
        setMessage({ type: 'error', text: 'Authentication failed. Please log in again.' });
      } else if (response.status === 403) {
        setMessage({ type: 'error', text: 'Access denied. You need owner permissions to initialize the system.' });
      } else {
        const error = await response.json().catch(() => ({ message: 'Unknown error occurred' }));
        setMessage({ type: 'error', text: error.message || 'Failed to initialize permissions' });
      }
    } catch (error) {
      console.error('Permission initialization error:', error);
      setMessage({ type: 'error', text: 'Network error occurred. Please check your connection.' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 5000); // Show message longer for initialization
    }
  };

  const togglePermission = (role: string, permissionName: string) => {
    setPendingChanges(prev => {
      const rolePermissions = prev[role] || [];
      const hasPermission = rolePermissions.includes(permissionName);
      
      return {
        ...prev,
        [role]: hasPermission
          ? rolePermissions.filter(p => p !== permissionName)
          : [...rolePermissions, permissionName]
      };
    });
  };

  const saveRolePermissions = async (role: string) => {
    try {
      setLoading(true);
      const permissions = pendingChanges[role] || [];
      
      const response = await fetch(`http://localhost:3001/api/permissions/role/${role}/bulk`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ permissions })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: `Permissions updated for ${roleLabels[role as keyof typeof roleLabels]}` });
        fetchPermissionMatrix();
        fetchPermissionStats();
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Failed to update permissions' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const hasChanges = (role: string) => {
    if (!matrix) return false;
    const current = matrix.matrix[role]?.permissionNames || [];
    const pending = pendingChanges[role] || [];
    
    if (current.length !== pending.length) return true;
    return current.some(p => !pending.includes(p)) || pending.some(p => !current.includes(p));
  };

  const resetChanges = (role: string) => {
    if (!matrix) return;
    setPendingChanges(prev => ({
      ...prev,
      [role]: matrix.matrix[role]?.permissionNames || []
    }));
  };

  if (loading && !matrix) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Permission Manager</h1>
          <p className="text-gray-600">Manage fine-grained permissions for different roles</p>
        </div>
        <div className="bg-white rounded-lg shadow p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg font-medium text-gray-900 mb-2">Loading Permission System</p>
            <p className="text-gray-600">Please wait while we load the permission configuration...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Permission Manager</h1>
        <p className="text-gray-600">Manage fine-grained permissions for different roles</p>
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

      {/* Initialize Button */}
      {!matrix && !loading && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <div className="flex items-start">
            <AlertTriangle className="w-6 h-6 text-yellow-600 mr-3 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-medium text-yellow-800 mb-2">Permission System Not Initialized</h3>
              <p className="text-sm text-yellow-700 mb-4">
                The permission system needs to be set up before you can manage permissions. This will create:
              </p>
              <ul className="text-sm text-yellow-700 mb-4 list-disc list-inside space-y-1">
                <li>Default permissions for invoices, products, finances, employees, and system</li>
                <li>Role-based permission mappings for Owner, Manager, and Accountant</li>
                <li>Fine-grained access control for different features</li>
              </ul>
              <p className="text-xs text-yellow-600">
                Note: You need Owner permissions to initialize the system.
              </p>
            </div>
            <Button
              onPress={initializePermissions}
              isDisabled={loading}
              isLoading={loading}
              color="warning"
              className="ml-4"
            >
              {loading ? 'Initializing...' : 'Initialize'}
            </Button>
          </div>
        </div>
      )}

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Permissions</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.totalPermissions}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Categories</h3>
            <div className="space-y-1">
              {Object.entries(stats.permissionsByCategory).map(([category, count]) => (
                <div key={category} className="flex justify-between text-sm">
                  <span className="capitalize">{category}:</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Role Summary</h3>
            <div className="space-y-1">
              {Object.entries(stats.roleStats).map(([role, data]) => (
                <div key={role} className="flex justify-between text-sm">
                  <span className="capitalize">{role}:</span>
                  <span className="font-medium">{data.totalPermissions}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Permission Matrix */}
      {matrix && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Permission Matrix
              </h2>
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Role:</label>
                <Select
                  aria-label="Role"
                  selectedKeys={selectedRole ? [selectedRole] : []}
                  onSelectionChange={(keys) => setSelectedRole(Array.from(keys)[0] as string)}
                  className="w-40"
                  size="sm"
                >
                  {matrix.roles.filter(role => role !== 'owner').map(role => (
                    <SelectItem key={role}>
                      {roleLabels[role as keyof typeof roleLabels]}
                    </SelectItem>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Role Actions */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-md font-medium text-gray-900">
                {roleLabels[selectedRole as keyof typeof roleLabels]} Permissions
              </h3>
              <div className="flex space-x-2">
                {hasChanges(selectedRole) && (
                  <>
                    <Button
                      onPress={() => resetChanges(selectedRole)}
                      variant="bordered"
                      size="sm"
                    >
                      Reset
                    </Button>
                    <Button
                      onPress={() => saveRolePermissions(selectedRole)}
                      isDisabled={loading}
                      color="primary"
                      size="sm"
                    >
                      Save Changes
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Permissions by Category */}
            <div className="space-y-6">
              {Object.entries(
                matrix.permissions.reduce((acc, permission) => {
                  if (!acc[permission.category]) acc[permission.category] = [];
                  acc[permission.category].push(permission);
                  return acc;
                }, {} as { [category: string]: Permission[] })
              ).map(([category, permissions]) => (
                <div key={category} className="border border-gray-200 rounded-lg p-4">
                  <h4 className={`text-sm font-medium mb-3 px-2 py-1 rounded-md inline-block ${
                    categoryColors[category as keyof typeof categoryColors] || 'bg-gray-100 text-gray-800'
                  }`}>
                    {category.charAt(0).toUpperCase() + category.slice(1)} Permissions
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {permissions.map(permission => {
                      const hasPermission = pendingChanges[selectedRole]?.includes(permission.name) || false;
                      const isChanged = matrix.matrix[selectedRole]?.permissionNames.includes(permission.name) !== hasPermission;
                      
                      return (
                        <div
                          key={permission.id}
                          className={`flex items-center justify-between p-3 border rounded-md cursor-pointer transition-colors ${
                            hasPermission 
                              ? 'border-green-300 bg-green-50' 
                              : 'border-gray-200 bg-gray-50'
                          } ${isChanged ? 'ring-2 ring-blue-300' : ''}`}
                          onClick={() => togglePermission(selectedRole, permission.name)}
                        >
                          <div className="flex-1">
                            <div className="flex items-center">
                              <span className="text-sm font-medium text-gray-900">
                                {permission.name.replace('CAN_', '').replace(/_/g, ' ')}
                              </span>
                              {isChanged && (
                                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  Changed
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 mt-1">{permission.description}</p>
                          </div>
                          <div className="ml-3">
                            {hasPermission ? (
                              <Check className="w-5 h-5 text-green-600" />
                            ) : (
                              <X className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionManager;