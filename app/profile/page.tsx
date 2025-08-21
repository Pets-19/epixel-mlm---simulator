'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save, Key } from 'lucide-react'
import Link from 'next/link'


const countries = [
  'United States', 'India', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Brazil', 'Japan', 'China',
  'South Africa', 'Nigeria', 'Egypt', 'Saudi Arabia', 'United Arab Emirates', 'Turkey', 'Italy', 'Spain', 'Netherlands',
  'Sweden', 'Norway', 'Denmark', 'Finland', 'Switzerland', 'Austria', 'Belgium', 'Poland', 'Czech Republic', 'Hungary',
  'Romania', 'Bulgaria', 'Croatia', 'Slovenia', 'Slovakia', 'Lithuania', 'Latvia', 'Estonia', 'Ireland', 'Portugal',
  'Greece', 'Cyprus', 'Malta', 'Luxembourg', 'Iceland', 'Liechtenstein', 'Monaco', 'San Marino', 'Vatican City',
  'Andorra', 'Albania', 'Bosnia and Herzegovina', 'Montenegro', 'North Macedonia', 'Serbia', 'Kosovo', 'Belarus',
  'Moldova', 'Ukraine', 'Georgia', 'Armenia', 'Azerbaijan', 'Kazakhstan', 'Uzbekistan', 'Kyrgyzstan', 'Tajikistan',
  'Turkmenistan', 'Afghanistan', 'Pakistan', 'Bangladesh', 'Sri Lanka', 'Nepal', 'Bhutan', 'Maldives', 'Malaysia',
  'Singapore', 'Thailand', 'Vietnam', 'Laos', 'Cambodia', 'Myanmar', 'Philippines', 'Indonesia', 'East Timor', 'Brunei',
  'Fiji', 'Papua New Guinea', 'New Caledonia', 'Vanuatu', 'Solomon Islands', 'Tonga', 'Samoa', 'Kiribati', 'Tuvalu',
  'Nauru', 'Palau', 'Marshall Islands', 'Micronesia', 'Cook Islands', 'Niue', 'Tokelau', 'American Samoa', 'Guam',
  'Northern Mariana Islands', 'Puerto Rico', 'U.S. Virgin Islands', 'Anguilla', 'Antigua and Barbuda', 'Aruba', 'Bahamas',
  'Barbados', 'Belize', 'Bermuda', 'Bolivia', 'Chile', 'Colombia', 'Costa Rica', 'Cuba', 'Dominica', 'Dominican Republic',
  'Ecuador', 'El Salvador', 'Grenada', 'Guatemala', 'Guyana', 'Haiti', 'Honduras', 'Jamaica', 'Nicaragua', 'Panama',
  'Paraguay', 'Peru', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Suriname',
  'Trinidad and Tobago', 'Uruguay', 'Venezuela', 'Argentina'
]

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    whatsapp_number: user?.whatsapp_number || '',
    organization_name: user?.organization_name || '',
    country: user?.country || '',
  })
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

  const handleCountryChange = (value: string) => {
    setForm({ ...form, country: value })
    setFieldErrors({ ...fieldErrors, country: '' })
  }

  const validate = () => {
    const errors: { [key: string]: string } = {}
    if (!form.name.trim()) errors.name = 'Full name is required.'
    else if (form.name.trim().length < 2) errors.name = 'Full name must be at least 2 characters.'
    if (!form.email.trim()) errors.email = 'Email is required.'
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'Invalid email address.'
    if (!form.whatsapp_number.trim()) errors.whatsapp_number = 'WhatsApp number is required.'
    else if (!/^\+[1-9]\d{1,14}$/.test(form.whatsapp_number)) errors.whatsapp_number = 'WhatsApp number must be in international format (e.g., +1234567890).'
    if (form.organization_name && form.organization_name.length < 2) errors.organization_name = 'Organization name must be at least 2 characters.'
    if (form.country && form.country.length < 2) errors.country = 'Country name must be at least 2 characters.'
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
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess('Profile updated successfully!')
      } else if (data.details && Array.isArray(data.details)) {
        // API validation errors
        const apiErrors: { [key: string]: string } = {}
        data.details.forEach((msg: string) => {
          if (msg.toLowerCase().includes('name')) apiErrors.name = msg
          if (msg.toLowerCase().includes('email')) apiErrors.email = msg
          if (msg.toLowerCase().includes('whatsapp')) apiErrors.whatsapp_number = msg
          if (msg.toLowerCase().includes('organization')) apiErrors.organization_name = msg
          if (msg.toLowerCase().includes('country')) apiErrors.country = msg
        })
        setFieldErrors(apiErrors)
        setError(data.error)
      } else {
        setError(data.error || 'Failed to update profile')
      }
    } catch (err) {
      setError('An error occurred while updating profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-2xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <Link href="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Profile Information</h1>
            <p className="text-gray-600 mt-2">Update your profile information below.</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your profile information below.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" name="name" value={form.name} onChange={handleChange} required />
                  {fieldErrors.name && <div className="text-sm text-red-600">{fieldErrors.name}</div>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} required />
                  {fieldErrors.email && <div className="text-sm text-red-600">{fieldErrors.email}</div>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp_number">WhatsApp Number *</Label>
                  <Input 
                    id="whatsapp_number" 
                    name="whatsapp_number" 
                    value={form.whatsapp_number} 
                    onChange={handleChange} 
                    placeholder="+1234567890"
                    required 
                  />
                  {fieldErrors.whatsapp_number && <div className="text-sm text-red-600">{fieldErrors.whatsapp_number}</div>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organization_name">Organization Name</Label>
                  <Input 
                    id="organization_name" 
                    name="organization_name" 
                    value={form.organization_name} 
                    onChange={handleChange} 
                    placeholder="Enter organization name (optional)"
                  />
                  {fieldErrors.organization_name && <div className="text-sm text-red-600">{fieldErrors.organization_name}</div>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select value={form.country} onValueChange={handleCountryChange}>
                    <SelectTrigger id="country">
                      <SelectValue placeholder="Select country (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors.country && <div className="text-sm text-red-600">{fieldErrors.country}</div>}
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
                <div className="flex gap-4">
                  <Button type="submit" disabled={loading} className="flex-1">
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Updating...' : 'Update Profile'}
                  </Button>
                  <Link href="/change-password">
                    <Button type="button" variant="outline">
                      <Key className="h-4 w-4 mr-2" />
                      Change Password
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
} 