'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { UserPlus, Users, CheckCircle } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'

interface User {
  id: number
  name: string
  email: string
  role: string
}

interface UserSelectionStepProps {
  selectedUser: User | null
  onUserSelected: (user: User) => void
}

export default function UserSelectionStep({ selectedUser, onUserSelected }: UserSelectionStepProps) {
  const { user: currentUser } = useAuth()
  const [selectionMode, setSelectionMode] = useState<'existing' | 'new'>('existing')
  const [existingUsers, setExistingUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // New user form state
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    password: '',
    whatsapp_number: '',
    organization_name: '',
    country: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [creatingUser, setCreatingUser] = useState(false)

  useEffect(() => {
    if (selectionMode === 'existing') {
      fetchBusinessUsers()
    }
  }, [selectionMode])

  const fetchBusinessUsers = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/users/business-users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const users = await response.json()
        setExistingUsers(users)
      } else {
        setError('Failed to fetch business users')
      }
    } catch (err) {
      setError('An error occurred while fetching business users')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async () => {
    setCreatingUser(true)
    setError(null)

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/auth/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newUserForm,
          role: 'business_user'
        })
      })

      const data = await response.json()

      if (response.ok) {
        const newUser: User = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role
        }
        onUserSelected(newUser)
        setSelectionMode('existing')
        setNewUserForm({
          name: '',
          email: '',
          password: '',
          whatsapp_number: '',
          organization_name: '',
          country: ''
        })
      } else {
        setError(data.error || 'Failed to create user')
      }
    } catch (err) {
      setError('An error occurred while creating the user')
    } finally {
      setCreatingUser(false)
    }
  }

  const handleExistingUserSelect = (user: User) => {
    onUserSelected(user)
  }

  const validateNewUserForm = () => {
    const errors: string[] = []
    
    if (!newUserForm.name.trim()) errors.push('Name is required')
    if (!newUserForm.email.trim()) errors.push('Email is required')
    if (!newUserForm.password) errors.push('Password is required')
    if (!newUserForm.whatsapp_number.trim()) errors.push('WhatsApp number is required')
    
    return errors
  }

  const canCreateUser = () => {
    return newUserForm.name.trim() && 
           newUserForm.email.trim() && 
           newUserForm.password && 
           newUserForm.whatsapp_number.trim()
  }

  return (
    <div className="space-y-6">
      {/* Selection Mode */}
      <div>
        <Label className="text-base font-medium">Choose User Selection Method</Label>
        <RadioGroup
          value={selectionMode}
          onValueChange={(value: 'existing' | 'new') => setSelectionMode(value)}
          className="mt-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="existing" id="existing" />
            <Label htmlFor="existing" className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Select Existing Business User
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="new" id="new" />
            <Label htmlFor="new" className="flex items-center">
              <UserPlus className="w-4 h-4 mr-2" />
              Create New Business User
            </Label>
          </div>
        </RadioGroup>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Existing Users Selection */}
      {selectionMode === 'existing' && (
        <div>
          <Label className="text-base font-medium">Select Business User</Label>
          <div className="mt-2 space-y-2">
            {loading ? (
              <div className="text-center py-4">
                <p className="text-gray-500">Loading business users...</p>
              </div>
            ) : existingUsers.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-500">No business users found</p>
                <Button 
                  variant="outline" 
                  onClick={fetchBusinessUsers}
                  className="mt-2"
                >
                  Refresh
                </Button>
              </div>
            ) : (
              existingUsers.map((user) => (
                <Card 
                  key={user.id} 
                  className={`cursor-pointer transition-colors ${
                    selectedUser?.id === user.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => handleExistingUserSelect(user)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {selectedUser?.id === user.id && (
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        )}
                        <div>
                          <h3 className="font-medium">{user.name}</h3>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{user.role}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* New User Creation */}
      {selectionMode === 'new' && (
        <div>
          <Label className="text-base font-medium">Create New Business User</Label>
          <Card className="mt-2">
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={newUserForm.name}
                    onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                    placeholder="Enter password"
                  />
                </div>
                <div>
                  <Label htmlFor="whatsapp">WhatsApp Number *</Label>
                  <Input
                    id="whatsapp"
                    value={newUserForm.whatsapp_number}
                    onChange={(e) => setNewUserForm({ ...newUserForm, whatsapp_number: e.target.value })}
                    placeholder="+1234567890"
                  />
                </div>
                <div>
                  <Label htmlFor="organization">Organization Name</Label>
                  <Input
                    id="organization"
                    value={newUserForm.organization_name}
                    onChange={(e) => setNewUserForm({ ...newUserForm, organization_name: e.target.value })}
                    placeholder="Enter organization name (optional)"
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={newUserForm.country}
                    onChange={(e) => setNewUserForm({ ...newUserForm, country: e.target.value })}
                    placeholder="Enter country (optional)"
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button
                  onClick={handleCreateUser}
                  disabled={!canCreateUser() || creatingUser}
                >
                  {creatingUser ? 'Creating...' : 'Create Business User'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Selected User Display */}
      {selectedUser && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">Selected User</p>
              <p className="text-sm text-green-600">
                {selectedUser.name} ({selectedUser.email})
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 