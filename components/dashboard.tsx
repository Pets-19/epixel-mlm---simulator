'use client'

import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { LogOut, Users, BarChart3, UserPlus, User, Network, GitBranch, Settings } from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuth()

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
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
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
            <Link href="/admin/business-plans" className="block">
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Manage Business Plans
                  </CardTitle>
                  <CardDescription>
                    Access the comprehensive admin dashboard for system management.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

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

            <Link href="/business-plan-wizard" className="block">
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <GitBranch className="h-5 w-5 mr-2" />
                    Business Plan Wizard
                  </CardTitle>
                  <CardDescription>
                    Create business plan simulations for business users with products and genealogy configuration.
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
    </div>
  )
} 