'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import Header from '@/components/header'

export default function ChangePasswordPage() {
  const { user, logout } = useAuth()
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({})

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You need to be logged in to view this page.</p>
          <Link href="/">
            <Button>Go to Login</Button>
          </Link>
        </div>
      </div>
    )
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setFieldErrors({ ...fieldErrors, [e.target.name]: '' })
  }

  const validate = () => {
    const errors: { [key: string]: string } = {}
    if (!form.currentPassword) errors.currentPassword = 'Current password is required.'
    if (!form.newPassword) errors.newPassword = 'New password is required.'
    else if (form.newPassword.length < 6) errors.newPassword = 'New password must be at least 6 characters.'
    if (!form.confirmPassword) errors.confirmPassword = 'Please confirm your new password.'
    else if (form.newPassword !== form.confirmPassword) errors.confirmPassword = 'Passwords do not match.'
    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)
    const errors = validate()
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      setLoading(false)
      return
    }
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        })
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess('Password changed successfully!')
        setForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
      } else {
        setError(data.error || 'Failed to change password')
      }
    } catch (err) {
      setError('An error occurred while changing password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Change Password" showBackButton backUrl="/profile" />

      <main className="max-w-2xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input 
                      id="currentPassword" 
                      name="currentPassword" 
                      type={showCurrentPassword ? 'text' : 'password'} 
                      value={form.currentPassword} 
                      onChange={handleChange} 
                      required 
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" 
                      onClick={() => setShowCurrentPassword(v => !v)}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {fieldErrors.currentPassword && <div className="text-sm text-red-600">{fieldErrors.currentPassword}</div>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input 
                      id="newPassword" 
                      name="newPassword" 
                      type={showNewPassword ? 'text' : 'password'} 
                      value={form.newPassword} 
                      onChange={handleChange} 
                      required 
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" 
                      onClick={() => setShowNewPassword(v => !v)}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {fieldErrors.newPassword && <div className="text-sm text-red-600">{fieldErrors.newPassword}</div>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input 
                      id="confirmPassword" 
                      name="confirmPassword" 
                      type={showConfirmPassword ? 'text' : 'password'} 
                      value={form.confirmPassword} 
                      onChange={handleChange} 
                      required 
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" 
                      onClick={() => setShowConfirmPassword(v => !v)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {fieldErrors.confirmPassword && <div className="text-sm text-red-600">{fieldErrors.confirmPassword}</div>}
                </div>
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
                {success && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-600">{success}</p>
                  </div>
                )}
                <Button type="submit" disabled={loading} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Changing...' : 'Change Password'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
} 