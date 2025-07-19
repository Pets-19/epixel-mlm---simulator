'use client'

import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'
import { LogOut, User, ArrowLeft } from 'lucide-react'

interface HeaderProps {
  title?: string
  showBackButton?: boolean
  backUrl?: string
  showUserInfo?: boolean
  showLogout?: boolean
  children?: React.ReactNode
}

export default function Header({
  title,
  showBackButton = false,
  backUrl = '/',
  showUserInfo = true,
  showLogout = true,
  children
}: HeaderProps) {
  const { user, logout } = useAuth()

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
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <Link href={backUrl}>
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
            )}
            
            <Link href="/" className="flex-shrink-0">
              <Image
                src="https://assets.epixelmlmsoftware.com/sites/all/themes/epixel_v13/epixel-mlm-software-new-logo.svg"
                alt="Epixel MLM Tools"
                width={200}
                height={50}
              />
            </Link>
            
            {title && (
              <div className="text-xl font-semibold text-gray-900">
                {title}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {children}
            
            {showUserInfo && user && (
              <div className="text-sm text-gray-700">
                <span className="font-medium">{user.name}</span>
                <span className="mx-2">•</span>
                <span className="text-gray-500">{getRoleDisplayName(user.role || '')}</span>
              </div>
            )}
            
            {showUserInfo && user && (
              <Link href="/profile">
                <Button variant="outline" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Button>
              </Link>
            )}
            
            {showLogout && (
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
} 