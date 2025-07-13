'use client'

import { useAuth } from '@/components/auth-provider'
import LoginPage from '@/components/login-page'
import Dashboard from '@/components/dashboard'
import LoadingSpinner from '@/components/loading-spinner'

export default function HomePage() {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return <LoginPage />
  }

  return <Dashboard />
} 