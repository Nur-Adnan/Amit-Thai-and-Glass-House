'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Shield,
  Save,
  AlertCircle,
  CheckCircle,
  Lock,
  Unlock,
  Eye,
  Edit,
  Trash2,
  DollarSign,
  Users,
  Package,
  FileText,
  Settings
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface Permission {
  key: string
  name: string
  description: string
  category: string
  icon: any
}

interface RolePermissions {
  role: 'owner' | 'manager' | 'accountant'
  permissions: string[]
}

export default function PermissionsTab() {
  const [rolePermissions, setRolePermissions] = useState<RolePermissions[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const { t: globalT } = useLanguage()
  
  // Local translation helper for permissions
  const t = useCallback((key: string, fallback: string) => {
    // For now, just return the fallback since we don't have these keys in the main translations
    return fallback
  }, [])

  // Define all available permissions
  const allPermissions: Permission[] = useMemo(() => [
    // Financial Permissions
    {
      key: 'CAN_VIEW_PROFIT',
      name: t('settings.permissions.canViewProfit', 'View Profit'),
      description: t('settings.permissions.canViewProfitDesc', 'View profit reports and analytics'),
      category: 'Financial',
      icon: DollarSign
    },
    {
      key: 'CAN_VIEW_EXPENSES',
      name: t('settings.permissions.canViewExpenses', 'View Expenses'),
      description: t('settings.permissions.canViewExpensesDesc', 'View expense reports and data'),
      category: 'Financial',
      icon: DollarSign
    },
    {
      key: 'CAN_MANAGE_EXPENSES',
      name: t('settings.permissions.canManageExpenses', 'Manage Expenses'),
      description: t('settings.permissions.canManageExpensesDesc', 'Create, edit, and delete expenses'),
      category: 'Financial',
      icon: Edit
    },
    {
      key: 'CAN_MANAGE_INVESTMENTS',
      name: t('settings.permissions.canManageInvestments', 'Manage Investments'),
      description: t('settings.permissions.canManageInvestmentsDesc', 'Create, edit, and delete investments'),
      category: 'Financial',
      icon: Edit
    },

    // User Management Permissions
    {
      key: 'CAN_MANAGE_USERS',
      name: t('settings.permissions.canManageUsers', 'Manage Users'),
      description: t('settings.permissions.canManageUsersDesc', 'Create, edit, and delete user accounts'),
      category: 'User Management',
      icon: Users
    },
    {
      key: 'CAN_MANAGE_PERMISSIONS',
      name: t('settings.permissions.canManagePermissions', 'Manage Permissions'),
      description: t('settings.permissions.canManagePermissionsDesc', 'Assign and modify user permissions'),
      category: 'User Management',
      icon: Shield
    },

    // Inventory Permissions
    {
      key: 'CAN_MANAGE_PRODUCTS',
      name: t('settings.permissions.canManageProducts', 'Manage Products'),
      description: t('settings.permissions.canManageProductsDesc', 'Create, edit, and delete products'),
      category: 'Inventory',
      icon: Package
    },
    {
      key: 'CAN_VIEW_INVENTORY',
      name: t('settings.permissions.canViewInventory', 'View Inventory'),
      description: t('settings.permissions.canViewInventoryDesc', 'View inventory levels and reports'),
      category: 'Inventory',
      icon: Eye
    },

    // Invoice Permissions
    {
      key: 'CAN_CREATE_INVOICES',
      name: t('settings.permissions.canCreateInvoices', 'Create Invoices'),
      description: t('settings.permissions.canCreateInvoicesDesc', 'Create new invoices and quotes'),
      category: 'Invoices',
      icon: FileText
    },
    {
      key: 'CAN_EDIT_INVOICES',
      name: t('settings.permissions.canEditInvoices', 'Edit Invoices'),
      description: t('settings.permissions.canEditInvoicesDesc', 'Modify existing invoices'),
      category: 'Invoices',
      icon: Edit
    },
    {
      key: 'CAN_DELETE_INVOICES',
      name: t('settings.permissions.canDeleteInvoices', 'Delete Invoices'),
      description: t('settings.permissions.canDeleteInvoicesDesc', 'Delete invoices (soft delete)'),
      category: 'Invoices',
      icon: Trash2
    },

    // System Permissions
    {
      key: 'CAN_MANAGE_SETTINGS',
      name: t('settings.permissions.canManageSettings', 'Manage Settings'),
      description: t('settings.permissions.canManageSettingsDesc', 'Access and modify system settings'),
      category: 'System',
      icon: Settings
    },
    {
      key: 'CAN_VIEW_REPORTS',
      name: t('settings.permissions.canViewReports', 'View Reports'),
      description: t('settings.permissions.canViewReportsDesc', 'Access business reports and analytics'),
      category: 'System',
      icon: Eye
    }
  ], [t])

  // Default role permissions
  const defaultRolePermissions: RolePermissions[] = useMemo(() => [
    {
      role: 'owner',
      permissions: allPermissions.map(p => p.key) // Owner has all permissions
    },
    {
      role: 'manager',
      permissions: [
        'CAN_VIEW_PROFIT',
        'CAN_VIEW_EXPENSES',
        'CAN_MANAGE_EXPENSES',
        'CAN_MANAGE_PRODUCTS',
        'CAN_VIEW_INVENTORY',
        'CAN_CREATE_INVOICES',
        'CAN_EDIT_INVOICES',
        'CAN_VIEW_REPORTS'
      ]
    },
    {
      role: 'accountant',
      permissions: [
        'CAN_VIEW_EXPENSES',
        'CAN_MANAGE_EXPENSES',
        'CAN_VIEW_INVENTORY',
        'CAN_CREATE_INVOICES',
        'CAN_VIEW_REPORTS'
      ]
    }
  ], [allPermissions])

  useEffect(() => {
    const fetchRolePermissions = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('http://localhost:3001/api/permissions/roles', {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setRolePermissions(data.data)
          } else {
            // Use default permissions if none exist
            setRolePermissions(defaultRolePermissions)
          }
        } else {
          // Use default permissions if API fails
          setRolePermissions(defaultRolePermissions)
        }
      } catch (error) {
        console.error('Error fetching role permissions:', error)
        // Use default permissions if error occurs
        setRolePermissions(defaultRolePermissions)
      }
    }

    fetchRolePermissions()
  }, [defaultRolePermissions])

  const handlePermissionToggle = (role: string, permissionKey: string, hasPermission: boolean) => {
    setRolePermissions(prev => prev.map(rp => {
      if (rp.role === role) {
        return {
          ...rp,
          permissions: hasPermission 
            ? rp.permissions.filter(p => p !== permissionKey)
            : [...rp.permissions, permissionKey]
        }
      }
      return rp
    }))
  }

  const handleSavePermissions = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3001/api/permissions/roles', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rolePermissions })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: t('settings.permissions.saveSuccess', 'Permissions updated successfully') })
      } else {
        setMessage({ type: 'error', text: data.message || t('settings.permissions.saveError', 'Failed to update permissions') })
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('settings.permissions.saveError', 'Failed to update permissions') })
    } finally {
      setLoading(false)
    }
  }

  const handleResetToDefaults = () => {
    setRolePermissions(defaultRolePermissions)
    setMessage({ type: 'success', text: t('settings.permissions.resetSuccess', 'Permissions reset to defaults') })
  }

  const getRolePermissions = (role: string) => {
    return rolePermissions.find(rp => rp.role === role)?.permissions || []
  }

  const hasPermission = (role: string, permissionKey: string) => {
    return getRolePermissions(role).includes(permissionKey)
  }

  const groupedPermissions = allPermissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = []
    }
    acc[permission.category].push(permission)
    return acc
  }, {} as Record<string, Permission[]>)

  const roleLabels = {
    owner: { label: t('settings.permissions.roles.owner', 'Owner'), color: 'default' },
    manager: { label: t('settings.permissions.roles.manager', 'Manager'), color: 'secondary' },
    accountant: { label: t('settings.permissions.roles.accountant', 'Accountant'), color: 'outline' }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t('settings.permissions.title', 'Role-Based Permissions')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            {t('settings.permissions.description', 'Configure what each role can access and modify in the system.')}
          </p>
          
          <div className="flex items-center gap-4">
            <Button onClick={handleSavePermissions} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? t('common.saving', 'Saving...') : t('common.save', 'Save Changes')}
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  {t('settings.permissions.resetToDefaults', 'Reset to Defaults')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('settings.permissions.resetConfirm', 'Reset Permissions')}</DialogTitle>
                  <DialogDescription>
                    {t('settings.permissions.resetWarning', 'This will reset all role permissions to their default values. Are you sure?')}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline">{t('common.cancel', 'Cancel')}</Button>
                  <Button onClick={handleResetToDefaults}>
                    {t('settings.permissions.reset', 'Reset')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Permissions Matrix */}
      {Object.entries(groupedPermissions).map(([category, permissions]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="text-lg">{category} {t('settings.permissions.permissions', 'Permissions')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/3">{t('settings.permissions.permission', 'Permission')}</TableHead>
                  <TableHead className="text-center">{roleLabels.owner.label}</TableHead>
                  <TableHead className="text-center">{roleLabels.manager.label}</TableHead>
                  <TableHead className="text-center">{roleLabels.accountant.label}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissions.map((permission) => {
                  const Icon = permission.icon
                  return (
                    <TableRow key={permission.key}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{permission.name}</div>
                            <div className="text-sm text-muted-foreground">{permission.description}</div>
                          </div>
                        </div>
                      </TableCell>
                      
                      {/* Owner Column */}
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center">
                          {permission.key === 'CAN_MANAGE_PERMISSIONS' ? (
                            <div title={t('settings.permissions.ownerOnly', 'Owner only')}>
                              <Lock className="h-4 w-4 text-primary" />
                            </div>
                          ) : (
                            <Switch
                              checked={hasPermission('owner', permission.key)}
                              onCheckedChange={(checked) => handlePermissionToggle('owner', permission.key, hasPermission('owner', permission.key))}
                              disabled={permission.key === 'CAN_MANAGE_PERMISSIONS'}
                            />
                          )}
                        </div>
                      </TableCell>
                      
                      {/* Manager Column */}
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center">
                          {permission.key === 'CAN_MANAGE_PERMISSIONS' || permission.key === 'CAN_MANAGE_USERS' ? (
                            <div title={t('settings.permissions.restricted', 'Restricted')}>
                              <Lock className="h-4 w-4 text-muted-foreground" />
                            </div>
                          ) : (
                            <Switch
                              checked={hasPermission('manager', permission.key)}
                              onCheckedChange={(checked) => handlePermissionToggle('manager', permission.key, hasPermission('manager', permission.key))}
                            />
                          )}
                        </div>
                      </TableCell>
                      
                      {/* Accountant Column */}
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center">
                          {['CAN_MANAGE_PERMISSIONS', 'CAN_MANAGE_USERS', 'CAN_DELETE_INVOICES', 'CAN_MANAGE_SETTINGS'].includes(permission.key) ? (
                            <div title={t('settings.permissions.restricted', 'Restricted')}>
                              <Lock className="h-4 w-4 text-muted-foreground" />
                            </div>
                          ) : (
                            <Switch
                              checked={hasPermission('accountant', permission.key)}
                              onCheckedChange={(checked) => handlePermissionToggle('accountant', permission.key, hasPermission('accountant', permission.key))}
                            />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      {/* Role Summary */}
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.permissions.roleSummary', 'Role Summary')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {rolePermissions.map((rolePermission) => {
              const roleInfo = roleLabels[rolePermission.role as keyof typeof roleLabels]
              return (
                <div key={rolePermission.role} className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant={roleInfo.color as any}>{roleInfo.label}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {rolePermission.permissions.length} {t('settings.permissions.permissionsCount', 'permissions')}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {rolePermission.permissions.slice(0, 5).map(permissionKey => {
                      const permission = allPermissions.find(p => p.key === permissionKey)
                      return permission ? (
                        <div key={permissionKey} className="text-sm text-muted-foreground flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          {permission.name}
                        </div>
                      ) : null
                    })}
                    {rolePermission.permissions.length > 5 && (
                      <div className="text-sm text-muted-foreground">
                        +{rolePermission.permissions.length - 5} {t('settings.permissions.more', 'more')}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}