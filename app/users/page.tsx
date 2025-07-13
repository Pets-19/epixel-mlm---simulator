'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { ChevronLeft, ChevronRight, Search, Edit, Key, Plus } from 'lucide-react'
import Image from 'next/image'

interface User {
  id: number
  email: string
  name: string
  role: 'system_admin' | 'admin' | 'user'
  whatsapp_number?: string
  organization_name?: string
  country?: string
  created_at: string
  updated_at: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function UsersPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('DESC')
  
  // Edit user state
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: '',
    whatsapp_number: '',
    organization_name: '',
    country: ''
  })
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState('')
  const [editSuccess, setEditSuccess] = useState('')
  
  // Reset password state
  const [resetPasswordUserId, setResetPasswordUserId] = useState<number | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState('')
  const [resetSuccess, setResetSuccess] = useState('')

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search,
        role: roleFilter,
        sortBy,
        sortOrder
      })

      const response = await fetch(`/api/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
        setPagination(data.pagination)
      } else {
        console.error('Failed to fetch users')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'system_admin')) {
      fetchUsers()
    }
  }, [user, pagination.page, search, roleFilter, sortBy, sortOrder])

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      whatsapp_number: user.whatsapp_number || '',
      organization_name: user.organization_name || '',
      country: user.country || ''
    })
    setEditError('')
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return

    try {
      setEditLoading(true)
      setEditError('')
      setEditSuccess('')
      
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(users.map(u => u.id === editingUser.id ? data.user : u))
        setEditSuccess('User information updated successfully!')
        
        // Close dialog after 2 seconds
        setTimeout(() => {
          setEditingUser(null)
          setEditForm({
            name: '',
            email: '',
            role: '',
            whatsapp_number: '',
            organization_name: '',
            country: ''
          })
          setEditSuccess('')
        }, 2000)
      } else {
        const error = await response.json()
        if (error.details && Array.isArray(error.details)) {
          // Show the first detailed error message
          setEditError(error.details[0] || error.error || 'Failed to update user')
        } else {
          setEditError(error.error || 'Failed to update user')
        }
      }
    } catch (error) {
      setEditError('An error occurred while updating the user')
    } finally {
      setEditLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!resetPasswordUserId) return

    try {
      setResetLoading(true)
      setResetError('')
      setResetSuccess('')
      
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/users/${resetPasswordUserId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword })
      })

      if (response.ok) {
        setResetSuccess('Password reset successfully!')
        
        // Close dialog after 2 seconds
        setTimeout(() => {
          setResetPasswordUserId(null)
          setNewPassword('')
          setResetSuccess('')
        }, 2000)
      } else {
        const error = await response.json()
        setResetError(error.error || 'Failed to reset password')
      }
    } catch (error) {
      setResetError('An error occurred while resetting the password')
    } finally {
      setResetLoading(false)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'system_admin':
        return 'bg-red-100 text-red-800'
      case 'admin':
        return 'bg-blue-100 text-blue-800'
      case 'user':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Check if user has permission
  if (!user || (user.role !== 'admin' && user.role !== 'system_admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Access Denied</CardTitle>
            <CardDescription className="text-center">
              You don't have permission to access this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <a href="/" className="flex items-center space-x-2">
                <Image
                  src="https://assets.epixelmlmsoftware.com/sites/all/themes/epixel_v13/epixel-mlm-software-new-logo.svg"
                  alt="Epixel MLM Tools"
                  width={200}
                  height={50}
                />
              </a>
              <div className="text-xl font-semibold text-gray-900">User Management</div>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/dashboard">
                <Button variant="outline">Dashboard</Button>
              </a>
              <a href="/create-user">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create User
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters & Search</CardTitle>
            <CardDescription>
              Filter and search through users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  <SelectItem value="system_admin">System Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Created Date</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="role">Role</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger>
                  <SelectValue placeholder="Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DESC">Descending</SelectItem>
                  <SelectItem value="ASC">Ascending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users ({pagination.total})</CardTitle>
            <CardDescription>
              Manage all users in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading users...</div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Organization</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge className={getRoleBadgeColor(user.role)}>
                              {user.role.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>{user.organization_name || '-'}</TableCell>
                          <TableCell>{user.country || '-'}</TableCell>
                          <TableCell>{formatDate(user.created_at)}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditUser(user)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                  <DialogHeader>
                                    <DialogTitle>Edit User</DialogTitle>
                                    <DialogDescription>
                                      Update user information
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <Label htmlFor="name" className="text-right">
                                        Name
                                      </Label>
                                      <Input
                                        id="name"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                        className="col-span-3"
                                      />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <Label htmlFor="email" className="text-right">
                                        Email
                                      </Label>
                                      <Input
                                        id="email"
                                        type="email"
                                        value={editForm.email}
                                        onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                                        className="col-span-3"
                                      />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <Label htmlFor="role" className="text-right">
                                        Role
                                      </Label>
                                      <Select 
                                        value={editForm.role} 
                                        onValueChange={(value) => setEditForm({...editForm, role: value})}
                                      >
                                        <SelectTrigger className="col-span-3">
                                          <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="admin">Admin</SelectItem>
                                          <SelectItem value="user">User</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <Label htmlFor="whatsapp" className="text-right">
                                        WhatsApp *
                                      </Label>
                                      <Input
                                        id="whatsapp"
                                        value={editForm.whatsapp_number}
                                        onChange={(e) => setEditForm({...editForm, whatsapp_number: e.target.value})}
                                        className="col-span-3"
                                        placeholder="+1234567890"
                                        required
                                      />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <Label htmlFor="org" className="text-right">
                                        Organization
                                      </Label>
                                      <Input
                                        id="org"
                                        value={editForm.organization_name}
                                        onChange={(e) => setEditForm({...editForm, organization_name: e.target.value})}
                                        className="col-span-3"
                                      />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <Label htmlFor="country" className="text-right">
                                        Country
                                      </Label>
                                      <Input
                                        id="country"
                                        value={editForm.country}
                                        onChange={(e) => setEditForm({...editForm, country: e.target.value})}
                                        className="col-span-3"
                                      />
                                    </div>
                                    {editError && (
                                      <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                                        {editError}
                                      </div>
                                    )}
                                    {editSuccess && (
                                      <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
                                        {editSuccess}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex justify-end space-x-2">
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setEditingUser(null)
                                        setEditForm({
                                          name: '',
                                          email: '',
                                          role: '',
                                          whatsapp_number: '',
                                          organization_name: '',
                                          country: ''
                                        })
                                        setEditError('')
                                        setEditSuccess('')
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      onClick={handleUpdateUser}
                                      disabled={editLoading}
                                    >
                                      {editLoading ? 'Updating...' : 'Update User'}
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setResetPasswordUserId(user.id)}
                                  >
                                    <Key className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Reset Password</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Set a new password for {user.name} ({user.email})
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <Label htmlFor="newPassword" className="text-right">
                                        New Password
                                      </Label>
                                      <Input
                                        id="newPassword"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="col-span-3"
                                        placeholder="Enter new password"
                                      />
                                    </div>
                                    {resetError && (
                                      <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                                        {resetError}
                                      </div>
                                    )}
                                    {resetSuccess && (
                                      <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
                                        {resetSuccess}
                                      </div>
                                    )}
                                  </div>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => {
                                      setResetPasswordUserId(null)
                                      setNewPassword('')
                                      setResetError('')
                                      setResetSuccess('')
                                    }}>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={handleResetPassword}
                                      disabled={resetLoading || !newPassword}
                                    >
                                      {resetLoading ? 'Resetting...' : 'Reset Password'}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between space-x-2 py-4">
                  <div className="text-sm text-gray-700">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination({...pagination, page: pagination.page - 1})}
                      disabled={pagination.page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="text-sm text-gray-700">
                      Page {pagination.page} of {pagination.totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination({...pagination, page: pagination.page + 1})}
                      disabled={pagination.page >= pagination.totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 