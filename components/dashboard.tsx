'use client'

import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'
import Link from 'next/link'
import { LogOut, Users, BarChart3, UserPlus, User, Network, GitBranch } from 'lucide-react'

export default function Dashboard() {
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'system_admin':
        return 'System Administrator'
      case 'admin':
        return 'Administrator'
      case 'user':
        return 'User'
      default:
        return role
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <a href="/" className="flex-shrink-0">
                <Image
                  src="https://assets.epixelmlmsoftware.com/sites/all/themes/epixel_v13/epixel-mlm-software-new-logo.svg"
                  alt="Epixel MLM Tools"
                  width={200}
                  height={50}
                />
              </a>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                <span className="font-medium">{user?.name}</span>
                <span className="mx-2">•</span>
                <span className="text-gray-500">{getRoleDisplayName(user?.role || '')}</span>
              </div>
              <Link href="/profile">
                <Button variant="outline" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Welcome to Epixel MLM Tools. Manage your MLM business efficiently.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  +0% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Networks</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  +0% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$0</div>
                <p className="text-xs text-muted-foreground">
                  +0% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Actions</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  No pending actions
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Role-based Actions */}
          {(user?.role === 'system_admin' || user?.role === 'admin') && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link href="/create-user" className="block">
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <UserPlus className="h-5 w-5 mr-2" />
                      Create User
                    </CardTitle>
                    <CardDescription>
                      Add new users to the system with specific roles and permissions.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link href="/users" className="block">
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="h-5 w-5 mr-2" />
                      User Management
                    </CardTitle>
                    <CardDescription>
                      Manage existing users, update roles, and monitor activity.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link href="/genealogy-types" className="block">
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <GitBranch className="h-5 w-5 mr-2" />
                      Genealogy Types
                    </CardTitle>
                    <CardDescription>
                      Manage genealogy structure types and their rules.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link href="/genealogy-simulation" className="block">
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Network className="h-5 w-5 mr-2" />
                      Genealogy Simulation
                    </CardTitle>
                    <CardDescription>
                      Test and simulate node filling logic with different parameters.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>


            </div>
          )}

          {/* Coming Soon */}
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Coming Soon</CardTitle>
                <CardDescription>
                  Additional MLM tools and features will be available soon.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>• Network Visualization</div>
                  <div>• Commission Calculator</div>
                  <div>• Performance Analytics</div>
                  <div>• Automated Reports</div>
                  <div>• Member Portal</div>
                  <div>• Payment Processing</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
} 