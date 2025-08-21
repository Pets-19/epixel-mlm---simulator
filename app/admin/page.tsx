import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, Users, Settings, BarChart3 } from 'lucide-react'

export default function AdminPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to the admin area. Manage your MLM system from here.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Business Plans Management */}
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center mb-4">
            <Building2 className="h-8 w-8 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold">Business Plans</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Create, edit, and manage business plans for your MLM organization.
          </p>
          <Link href="/admin/business-plans">
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              Manage Business Plans
            </Button>
          </Link>
        </Card>

        {/* User Management */}
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center mb-4">
            <Users className="h-8 w-8 text-green-600 mr-3" />
            <h2 className="text-xl font-semibold">User Management</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Manage users, roles, and permissions across the system.
          </p>
          <Link href="/users">
            <Button className="w-full bg-green-600 hover:bg-green-700">
              Manage Users
            </Button>
          </Link>
        </Card>

        {/* Genealogy Management */}
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center mb-4">
            <BarChart3 className="h-8 w-8 text-purple-600 mr-3" />
            <h2 className="text-xl font-semibold">Genealogy</h2>
          </div>
          <p className="text-gray-600 mb-4">
            View and manage genealogy structures and simulations.
          </p>
          <Link href="/genealogy-simulation">
            <Button className="w-full bg-purple-600 hover:bg-purple-700">
              View Genealogy
            </Button>
          </Link>
        </Card>

        {/* System Settings */}
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center mb-4">
            <Settings className="h-8 w-8 text-gray-600 mr-3" />
            <h2 className="text-xl font-semibold">System Settings</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Configure system settings and preferences.
          </p>
          <Link href="/settings">
            <Button className="w-full bg-gray-600 hover:bg-gray-700">
              System Settings
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  )
} 