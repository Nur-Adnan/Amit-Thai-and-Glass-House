'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { useLanguage } from '@/contexts/LanguageContext'

interface User {
  _id: string
  name: string
  email: string
  role: 'owner' | 'manager' | 'accountant'
  isActive: boolean
  createdAt: string
  lastLogin?: string
}

export default function UsersTab() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'accountant' as 'owner' | 'manager' | 'accountant'
  })

  const { t: globalT } = useLanguage()
  
  // Local translation helper for users
  const t = (key: string, fallback: string) => {
    // For now, just return the fallback since we don't have these keys in the main translations
    return fallback
  }

  const roleOptions = [
    { value: 'owner', label: t('settings.users.roles.owner', 'Owner'), color: 'default' },
    { value: 'manager', label: t('settings.users.roles.manager', 'Manager'), color: 'secondary' },
    { value: 'accountant', label: t('settings.users.roles.accountant', 'Accountant'), color: 'outline' }
  ]

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3001/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setUsers(data.data)
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      setMessage({ type: 'error', text: t('settings.users.fillAllFields', 'Please fill all fields') })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3001/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: t('settings.users.addSuccess', 'User added successfully') })
        setNewUser({
          name: '',
          email: '',
          password: '',
          role: 'accountant'
        })
        fetchUsers()
      } else {
        setMessage({ type: 'error', text: data.message || t('settings.users.addError', 'Failed to add user') })
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('settings.users.addError', 'Failed to add user') })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return

    setLoading(true)
    setMessage(null)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3001/api/users/${editingUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editingUser.name,
          email: editingUser.email,
          role: editingUser.role
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: t('settings.users.updateSuccess', 'User updated successfully') })
        setEditingUser(null)
        fetchUsers()
      } else {
        setMessage({ type: 'error', text: data.message || t('settings.users.updateError', 'Failed to update user') })
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('settings.users.updateError', 'Failed to update user') })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    setLoading(true)
    setMessage(null)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3001/api/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !isActive })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setMessage({ 
          type: 'success', 
          text: isActive 
            ? t('settings.users.deactivateSuccess', 'User deactivated successfully')
            : t('settings.users.activateSuccess', 'User activated successfully')
        })
        fetchUsers()
      } else {
        setMessage({ type: 'error', text: data.message || t('settings.users.statusError', 'Failed to update user status') })
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('settings.users.statusError', 'Failed to update user status') })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    setLoading(true)
    setMessage(null)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3001/api/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: t('settings.users.deleteSuccess', 'User deleted successfully') })
        fetchUsers()
      } else {
        setMessage({ type: 'error', text: data.message || t('settings.users.deleteError', 'Failed to delete user') })
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('settings.users.deleteError', 'Failed to delete user') })
    } finally {
      setLoading(false)
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    const roleOption = roleOptions.find(r => r.value === role)
    return roleOption?.color as any || 'outline'
  }

  return (
    <div className="space-y-6">
      {/* Add New User */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {t('settings.users.addNew', 'Add New User')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('settings.users.name', 'Full Name')}</Label>
              <Input
                id="name"
                value={newUser.name}
                onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t('settings.users.namePlaceholder', 'Enter full name')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('settings.users.email', 'Email Address')}</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                placeholder={t('settings.users.emailPlaceholder', 'Enter email address')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">{t('settings.users.password', 'Password')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={newUser.password}
                  onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                  placeholder={t('settings.users.passwordPlaceholder', 'Enter password')}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">{t('settings.users.role', 'Role')}</Label>
              <select
                id="role"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={newUser.role}
                onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as any }))}
              >
                {roleOptions.map(role => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </div>
          </div>

          <Button onClick={handleAddUser} disabled={loading}>
            <Plus className="h-4 w-4 mr-2" />
            {loading ? t('common.adding', 'Adding...') : t('settings.users.addUser', 'Add User')}
          </Button>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('settings.users.userList', 'User Management')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('settings.users.name', 'Name')}</TableHead>
                  <TableHead>{t('settings.users.email', 'Email')}</TableHead>
                  <TableHead>{t('settings.users.role', 'Role')}</TableHead>
                  <TableHead>{t('settings.users.status', 'Status')}</TableHead>
                  <TableHead>{t('settings.users.lastLogin', 'Last Login')}</TableHead>
                  <TableHead>{t('common.actions', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell className="font-medium">
                      {editingUser?._id === user._id ? (
                        <Input
                          value={editingUser.name}
                          onChange={(e) => setEditingUser(prev => prev ? { ...prev, name: e.target.value } : null)}
                          className="w-full"
                        />
                      ) : (
                        user.name
                      )}
                    </TableCell>
                    <TableCell>
                      {editingUser?._id === user._id ? (
                        <Input
                          type="email"
                          value={editingUser.email}
                          onChange={(e) => setEditingUser(prev => prev ? { ...prev, email: e.target.value } : null)}
                          className="w-full"
                        />
                      ) : (
                        user.email
                      )}
                    </TableCell>
                    <TableCell>
                      {editingUser?._id === user._id ? (
                        <select
                          className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                          value={editingUser.role}
                          onChange={(e) => setEditingUser(prev => prev ? { ...prev, role: e.target.value as any } : null)}
                        >
                          {roleOptions.map(role => (
                            <option key={role.value} value={role.value}>{role.label}</option>
                          ))}
                        </select>
                      ) : (
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {roleOptions.find(r => r.value === user.role)?.label || user.role}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? 'default' : 'secondary'}>
                        {user.isActive ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : t('settings.users.neverLoggedIn', 'Never')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {editingUser?._id === user._id ? (
                          <>
                            <Button size="sm" onClick={handleUpdateUser} disabled={loading}>
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingUser(null)}>
                              ✕
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingUser(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleUserStatus(user._id, user.isActive)}
                            >
                              {user.isActive ? '⏸️' : '▶️'}
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>{t('settings.users.deleteConfirm', 'Delete User')}</DialogTitle>
                                  <DialogDescription>
                                    {t('settings.users.deleteWarning', 'Are you sure you want to delete this user? This action cannot be undone.')}
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <Button variant="outline">{t('common.cancel', 'Cancel')}</Button>
                                  <Button variant="destructive" onClick={() => handleDeleteUser(user._id)}>
                                    {t('common.delete', 'Delete')}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {t('settings.users.noUsers', 'No users found')}
            </div>
          )}
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