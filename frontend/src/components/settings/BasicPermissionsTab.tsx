'use client'

import { useState } from 'react'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Switch,
  Chip,
  Alert,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from '@heroui/react'
import {
  Shield,
  Save,
  AlertCircle,
  CheckCircle,
  Lock,
  Eye,
  Edit,
  Trash2,
  DollarSign,
  Users,
  Package,
  FileText,
  Settings
} from 'lucide-react'

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

export default function BasicPermissionsTab() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Define all available permissions
  const allPermissions: Permission[] = [
    // Financial Permissions
    {
      key: 'CAN_VIEW_PROFIT',
      name: 'View Profit',
      description: 'View profit reports and analytics',
      category: 'Financial',
      icon: DollarSign
    },
    {
      key: 'CAN_VIEW_EXPENSES',
      name: 'View Expenses',
      description: 'View expense reports and data',
      category: 'Financial',
      icon: DollarSign
    },
    {
      key: 'CAN_MANAGE_EXPENSES',
      name: 'Manage Expenses',
      description: 'Create, edit, and delete expenses',
      category: 'Financial',
      icon: Edit
    },
    {
      key: 'CAN_MANAGE_INVESTMENTS',
      name: 'Manage Investments',
      description: 'Create, edit, and delete investments',
      category: 'Financial',
      icon: Edit
    },

    // User Management Permissions
    {
      key: 'CAN_MANAGE_USERS',
      name: 'Manage Users',
      description: 'Create, edit, and delete user accounts',
      category: 'User Management',
      icon: Users
    },
    {
      key: 'CAN_MANAGE_PERMISSIONS',
      name: 'Manage Permissions',
      description: 'Assign and modify user permissions',
      category: 'User Management',
      icon: Shield
    },

    // Inventory Permissions
    {
      key: 'CAN_MANAGE_PRODUCTS',
      name: 'Manage Products',
      description: 'Create, edit, and delete products',
      category: 'Inventory',
      icon: Package
    },
    {
      key: 'CAN_VIEW_INVENTORY',
      name: 'View Inventory',
      description: 'View inventory levels and reports',
      category: 'Inventory',
      icon: Eye
    },

    // Invoice Permissions
    {
      key: 'CAN_CREATE_INVOICES',
      name: 'Create Invoices',
      description: 'Create new invoices and quotes',
      category: 'Invoices',
      icon: FileText
    },
    {
      key: 'CAN_EDIT_INVOICES',
      name: 'Edit Invoices',
      description: 'Modify existing invoices',
      category: 'Invoices',
      icon: Edit
    },
    {
      key: 'CAN_DELETE_INVOICES',
      name: 'Delete Invoices',
      description: 'Delete invoices (soft delete)',
      category: 'Invoices',
      icon: Trash2
    },

    // System Permissions
    {
      key: 'CAN_MANAGE_SETTINGS',
      name: 'Manage Settings',
      description: 'Access and modify system settings',
      category: 'System',
      icon: Settings
    },
    {
      key: 'CAN_VIEW_REPORTS',
      name: 'View Reports',
      description: 'Access business reports and analytics',
      category: 'System',
      icon: Eye
    }
  ]

  // Default role permissions
  const [rolePermissions, setRolePermissions] = useState<RolePermissions[]>([
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
  ])

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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setMessage({ type: 'success', text: 'Permissions updated successfully' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update permissions' })
    } finally {
      setLoading(false)
    }
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
    owner: { label: 'Owner', color: 'default' },
    manager: { label: 'Manager', color: 'secondary' },
    accountant: { label: 'Accountant', color: 'outline' }
  }

  const getRoleChipProps = (color: string): { color: any; variant: any } => {
    switch (color) {
      case 'default':
        return { color: 'primary', variant: 'flat' }
      case 'secondary':
        return { color: 'default', variant: 'flat' }
      case 'outline':
      default:
        return { color: 'default', variant: 'bordered' }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-col items-start gap-1">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Role-Based Permissions
          </h3>
        </CardHeader>
        <CardBody>
          <p className="text-muted-foreground mb-4">
            Configure what each role can access and modify in the system.
          </p>

          <div className="flex items-center gap-4">
            <Button color="primary" onPress={handleSavePermissions} isDisabled={loading} startContent={<Save className="h-4 w-4" />}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Permissions Matrix */}
      {Object.entries(groupedPermissions).map(([category, permissions]) => (
        <Card key={category}>
          <CardHeader className="flex flex-col items-start gap-1">
            <h3 className="text-lg font-semibold">{category} Permissions</h3>
          </CardHeader>
          <CardBody>
            <Table aria-label={`${category} permissions matrix`}>
              <TableHeader>
                <TableColumn className="w-1/3">Permission</TableColumn>
                <TableColumn className="text-center">{roleLabels.owner.label}</TableColumn>
                <TableColumn className="text-center">{roleLabels.manager.label}</TableColumn>
                <TableColumn className="text-center">{roleLabels.accountant.label}</TableColumn>
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
                            <Lock className="h-4 w-4 text-primary" />
                          ) : (
                            <Switch
                              isSelected={hasPermission('owner', permission.key)}
                              onValueChange={(checked: boolean) => handlePermissionToggle('owner', permission.key, hasPermission('owner', permission.key))}
                              isDisabled={permission.key === 'CAN_MANAGE_PERMISSIONS'}
                            />
                          )}
                        </div>
                      </TableCell>

                      {/* Manager Column */}
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center">
                          {permission.key === 'CAN_MANAGE_PERMISSIONS' || permission.key === 'CAN_MANAGE_USERS' ? (
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Switch
                              isSelected={hasPermission('manager', permission.key)}
                              onValueChange={(checked: boolean) => handlePermissionToggle('manager', permission.key, hasPermission('manager', permission.key))}
                            />
                          )}
                        </div>
                      </TableCell>

                      {/* Accountant Column */}
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center">
                          {['CAN_MANAGE_PERMISSIONS', 'CAN_MANAGE_USERS', 'CAN_DELETE_INVOICES', 'CAN_MANAGE_SETTINGS'].includes(permission.key) ? (
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Switch
                              isSelected={hasPermission('accountant', permission.key)}
                              onValueChange={(checked: boolean) => handlePermissionToggle('accountant', permission.key, hasPermission('accountant', permission.key))}
                            />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      ))}

      {/* Role Summary */}
      <Card>
        <CardHeader className="flex flex-col items-start gap-1">
          <h3 className="text-lg font-semibold">Role Summary</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {rolePermissions.map((rolePermission) => {
              const roleInfo = roleLabels[rolePermission.role as keyof typeof roleLabels]
              return (
                <div key={rolePermission.role} className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Chip size="sm" {...getRoleChipProps(roleInfo.color)}>{roleInfo.label}</Chip>
                    <span className="text-sm text-muted-foreground">
                      {rolePermission.permissions.length} permissions
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
                        +{rolePermission.permissions.length - 5} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardBody>
      </Card>

      {/* Messages */}
      {message && (
        <Alert
          color={message.type === 'error' ? 'danger' : 'default'}
          description={message.text}
          icon={message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
        />
      )}
    </div>
  )
}