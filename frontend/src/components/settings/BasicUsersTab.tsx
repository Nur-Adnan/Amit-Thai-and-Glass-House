'use client'

import { useState } from 'react'
import {
  Button,
  Input,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Alert,
  Select,
  SelectItem,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from '@heroui/react'
import {
  Users,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  UserPlus
} from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  role: 'owner' | 'manager' | 'accountant'
  isActive: boolean
  lastLogin?: string
}

export default function BasicUsersTab() {
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      name: 'Shop Owner',
      email: 'owner@shop.com',
      role: 'owner',
      isActive: true,
      lastLogin: '2025-01-03'
    },
    {
      id: '2',
      name: 'Manager',
      email: 'manager@shop.com',
      role: 'manager',
      isActive: true,
      lastLogin: '2025-01-02'
    }
  ])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'accountant' as 'owner' | 'manager' | 'accountant'
  })

  const roleOptions = [
    { value: 'owner', label: 'Owner', color: 'default' },
    { value: 'manager', label: 'Manager', color: 'secondary' },
    { value: 'accountant', label: 'Accountant', color: 'outline' }
  ]

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      setMessage({ type: 'error', text: 'Please fill all fields' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const user: User = {
        id: Date.now().toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isActive: true
      }
      
      setUsers(prev => [...prev, user])
      setMessage({ type: 'success', text: 'User added successfully' })
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'accountant'
      })
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to add user' })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    setLoading(true)
    setMessage(null)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, isActive: !isActive } : user
      ))
      setMessage({ 
        type: 'success', 
        text: isActive ? 'User deactivated successfully' : 'User activated successfully'
      })
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update user status' })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    setLoading(true)
    setMessage(null)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      setUsers(prev => prev.filter(user => user.id !== userId))
      setMessage({ type: 'success', text: 'User deleted successfully' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete user' })
    } finally {
      setLoading(false)
    }
  }

  const getRoleChipProps = (role: string): { color: any; variant: any } => {
    const roleOption = roleOptions.find(r => r.value === role)
    switch (roleOption?.color) {
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
      {/* Add New User */}
      <Card>
        <CardHeader className="flex flex-col items-start gap-1">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add New User
          </h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Input
                id="name"
                label="Full Name"
                value={newUser.name}
                onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter full name"
              />
            </div>

            <div className="space-y-2">
              <Input
                id="email"
                type="email"
                label="Email Address"
                value={newUser.email}
                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  label="Password"
                  value={newUser.password}
                  onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter password"
                />
                <Button
                  type="button"
                  variant="light"
                  size="sm"
                  isIconOnly
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Select
                id="role"
                label="Role"
                selectedKeys={newUser.role ? [newUser.role] : []}
                onSelectionChange={(keys) => setNewUser(prev => ({ ...prev, role: Array.from(keys)[0] as any }))}
              >
                {roleOptions.map(role => (
                  <SelectItem key={role.value}>{role.label}</SelectItem>
                ))}
              </Select>
            </div>
          </div>

          <Button color="primary" onPress={handleAddUser} isDisabled={loading} startContent={<Plus className="h-4 w-4" />}>
            {loading ? 'Adding...' : 'Add User'}
          </Button>
        </CardBody>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader className="flex flex-col items-start gap-1">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </h3>
        </CardHeader>
        <CardBody>
          {users.length > 0 ? (
            <Table aria-label="User management table">
              <TableHeader>
                <TableColumn>Name</TableColumn>
                <TableColumn>Email</TableColumn>
                <TableColumn>Role</TableColumn>
                <TableColumn>Status</TableColumn>
                <TableColumn>Last Login</TableColumn>
                <TableColumn>Actions</TableColumn>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip size="sm" {...getRoleChipProps(user.role)}>
                        {roleOptions.find(r => r.value === user.role)?.label || user.role}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Chip size="sm" color={user.isActive ? 'primary' : 'default'} variant="flat">
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Chip>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="bordered" isIconOnly>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="bordered"
                          isIconOnly
                          onPress={() => handleToggleUserStatus(user.id, user.isActive)}
                        >
                          {user.isActive ? '⏸️' : '▶️'}
                        </Button>
                        <Button
                          size="sm"
                          variant="bordered"
                          isIconOnly
                          onPress={() => handleDeleteUser(user.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No users found
            </div>
          )}
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