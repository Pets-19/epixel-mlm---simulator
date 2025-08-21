'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import LoadingSpinner from '@/components/loading-spinner'
import BusinessPlanForm from '@/components/business-plan-form'
import { BusinessPlanSimulation } from '@/lib/business-plan'

export default function AdminBusinessPlansPage() {
  const { user } = useAuth()
  const [businessPlans, setBusinessPlans] = useState<BusinessPlanSimulation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<BusinessPlanSimulation | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  useEffect(() => {
    if (user) {
      fetchBusinessPlans()
    }
  }, [user])

  const fetchBusinessPlans = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/business-plan/simulations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch business plans')
      }

      const data = await response.json()
      setBusinessPlans(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this business plan? This action cannot be undone.')) {
      return
    }

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/business-plan/simulations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete business plan')
      }

      // Refresh the list
      fetchBusinessPlans()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete business plan')
    }
  }

  const handleEdit = (plan: BusinessPlanSimulation) => {
    setSelectedPlan(plan)
    setIsEditDialogOpen(true)
  }

  const handleCreate = () => {
    setSelectedPlan(null)
    setIsCreateDialogOpen(true)
  }

  const handleFormSubmit = async () => {
    // Close dialogs and refresh data
    setIsEditDialogOpen(false)
    setIsCreateDialogOpen(false)
    setSelectedPlan(null)
    await fetchBusinessPlans()
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Business Plans Management</h1>
          <p className="text-gray-600 mt-2">Manage all business plans in the system</p>
        </div>
        <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
          Create New Business Plan
        </Button>
      </div>

      {error && (
        <Card className="p-4 mb-6 border-red-200 bg-red-50">
          <p className="text-red-600">{error}</p>
        </Card>
      )}

      <Card className="p-6">
        {businessPlans.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-lg">No business plans found</p>
            <p className="text-gray-400 mt-2">Create your first business plan to get started</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business Name</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {businessPlans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.business_name}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{plan.user?.name}</p>
                      <p className="text-sm text-gray-500">{plan.user?.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(plan.status || 'draft')}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {plan.products?.length || 0} products
                      {plan.products && plan.products.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          {plan.products.slice(0, 2).map(p => p.product_name).join(', ')}
                          {plan.products.length > 2 && ` +${plan.products.length - 2} more`}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatDate(plan.created_at?.toString() || '')}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(plan)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/admin/business-plans/${plan.id}`, '_blank')}
                      >
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(plan.id!)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Business Plan</DialogTitle>
          </DialogHeader>
          {selectedPlan && (
            <BusinessPlanForm
              initialData={selectedPlan}
              onSubmit={handleFormSubmit}
              mode="edit"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Business Plan</DialogTitle>
          </DialogHeader>
          <BusinessPlanForm
            onSubmit={handleFormSubmit}
            mode="create"
          />
        </DialogContent>
      </Dialog>
    </div>
  )
} 