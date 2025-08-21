'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import LoadingSpinner from '@/components/loading-spinner'
import { BusinessPlanSimulation } from '@/lib/business-plan'

export default function BusinessPlanDetailPage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const [businessPlan, setBusinessPlan] = useState<BusinessPlanSimulation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user && params.id) {
      fetchBusinessPlan()
    }
  }, [user, params.id])

  const fetchBusinessPlan = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/business-plan/simulations/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch business plan')
      }

      const data = await response.json()
      setBusinessPlan(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusColors = {
      draft: 'bg-gray-100 text-gray-800',
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    
    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getProductTypeBadge = (type: string) => {
    const typeColors = {
      membership: 'bg-purple-100 text-purple-800',
      retail: 'bg-blue-100 text-blue-800',
      digital: 'bg-green-100 text-green-800'
    }
    
    return (
      <Badge className={typeColors[type as keyof typeof typeColors] || 'bg-gray-100 text-gray-800'}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    )
  }

  if (!user || (user.role !== 'admin' && user.role !== 'system_admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6">
          <h1 className="text-xl font-semibold text-red-600">Access Denied</h1>
          <p className="text-gray-600 mt-2">You don't have permission to access this page.</p>
        </Card>
      </div>
    )
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-6 border-red-200 bg-red-50">
          <h1 className="text-xl font-semibold text-red-600">Error</h1>
          <p className="text-red-600 mt-2">{error}</p>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </Card>
      </div>
    )
  }

  if (!businessPlan) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-6">
          <h1 className="text-xl font-semibold text-gray-600">Business Plan Not Found</h1>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{businessPlan.business_name}</h1>
          <p className="text-gray-600 mt-2">Business Plan Details</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/business-plans')}
          >
            Back to List
          </Button>
          <Button
            onClick={() => router.push(`/admin/business-plans/edit/${businessPlan.id}`)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Edit Plan
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Plan Overview */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Plan Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Business Name</label>
                <p className="text-lg font-medium">{businessPlan.business_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="mt-1">{getStatusBadge(businessPlan.status || 'draft')}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Created</label>
                <p className="text-sm">{formatDate(businessPlan.created_at?.toString() || '')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Last Updated</label>
                <p className="text-sm">{formatDate(businessPlan.updated_at?.toString() || '')}</p>
              </div>
            </div>
          </Card>

          {/* Products */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Products ({businessPlan.products?.length || 0})</h2>
            {businessPlan.products && businessPlan.products.length > 0 ? (
              <div className="space-y-4">
                {businessPlan.products.map((product, index) => (
                  <div key={product.id || index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium text-lg">{product.product_name}</h3>
                        <div className="flex gap-2 mt-1">
                          {getProductTypeBadge(product.product_type)}
                          <Badge variant="outline">Sort: {product.sort_order}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Price</label>
                        <p className="text-lg font-semibold">{formatCurrency(product.product_price)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Business Volume</label>
                        <p className="text-lg font-semibold">{formatCurrency(product.business_volume)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Sales Ratio</label>
                        <p className="text-lg font-semibold">{product.product_sales_ratio}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No products found for this business plan.</p>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Owner Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Plan Owner</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="font-medium">{businessPlan.user?.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-sm">{businessPlan.user?.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Role</label>
                <Badge variant="outline">{businessPlan.user?.role}</Badge>
              </div>
            </div>
          </Card>

          {/* Plan Statistics */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Plan Statistics</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Total Products</label>
                <p className="text-2xl font-bold">{businessPlan.products?.length || 0}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Total Value</label>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    businessPlan.products?.reduce((sum, product) => sum + product.product_price, 0) || 0
                  )}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Average Sales Ratio</label>
                <p className="text-2xl font-bold">
                  {businessPlan.products && businessPlan.products.length > 0
                    ? `${(businessPlan.products.reduce((sum, product) => sum + product.product_sales_ratio, 0) / businessPlan.products.length).toFixed(1)}%`
                    : '0%'
                  }
                </p>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Actions</h2>
            <div className="space-y-3">
              <Button
                onClick={() => router.push(`/admin/business-plans/edit/${businessPlan.id}`)}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Edit Plan
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/admin/business-plans')}
                className="w-full"
              >
                Back to List
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
} 