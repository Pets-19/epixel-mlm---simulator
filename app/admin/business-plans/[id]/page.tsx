'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import LoadingSpinner from '@/components/loading-spinner'
import { BusinessPlanSimulation } from '@/lib/business-plan'
import { GenealogyTreeView, TreeNode } from '@/components/genealogy-tree-view'
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Network, 
  CheckCircle, 
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface SimulationData {
  id: string
  tree: TreeNode | null
  total_members: number
  total_levels: number
  genealogy_type: string
  config: any
}

export default function BusinessPlanDetailPage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const [businessPlan, setBusinessPlan] = useState<BusinessPlanSimulation | null>(null)
  const [simulationData, setSimulationData] = useState<SimulationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activating, setActivating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showTree, setShowTree] = useState(true)

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

      // Fetch simulation data if available
      if (data.genealogy_simulation_id) {
        fetchSimulationData(data.genealogy_simulation_id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const fetchSimulationData = async (simulationId: string) => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/genealogy/simulations/${simulationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSimulationData(data)
      }
    } catch (err) {
      console.error('Failed to fetch simulation data:', err)
    }
  }

  const handleActivatePlan = async () => {
    if (!businessPlan) return

    try {
      setActivating(true)
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/business-plan/simulations/${businessPlan.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'active' })
      })

      if (!response.ok) {
        throw new Error('Failed to activate plan')
      }

      // Refresh the business plan
      await fetchBusinessPlan()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate plan')
    } finally {
      setActivating(false)
    }
  }

  // Calculate revenue projections
  const revenueProjections = useMemo(() => {
    if (!businessPlan) return null

    const totalProductValue = businessPlan.products?.reduce(
      (sum, p) => sum + p.product_price, 0
    ) || 0

    const totalBV = businessPlan.products?.reduce(
      (sum, p) => sum + p.business_volume, 0
    ) || 0

    const standardCommTotal = businessPlan.commission_config?.standard_commissions
      ?.filter((c: any) => c.is_enabled)
      .reduce((sum: number, c: any) => sum + (c.percentage || 0), 0) || 0

    const customCommTotal = businessPlan.commission_config?.custom_commissions
      ?.filter((c: any) => c.is_enabled)
      .reduce((sum: number, c: any) => sum + (c.percentage || 0), 0) || 0

    const totalCommission = standardCommTotal + customCommTotal
    const networkSize = simulationData?.total_members || 10 // Default estimate
    const estimatedMonthlyMembers = networkSize * 0.3 // 30% active purchasing

    // Projections
    const monthlyRevenue = totalProductValue * estimatedMonthlyMembers
    const monthlyCommissionPayout = monthlyRevenue * (totalCommission / 100)
    const companyRetention = monthlyRevenue - monthlyCommissionPayout
    const avgCommissionPerMember = monthlyCommissionPayout / networkSize

    return {
      totalProductValue,
      totalBV,
      totalCommission,
      standardCommTotal,
      customCommTotal,
      networkSize,
      monthlyRevenue,
      monthlyCommissionPayout,
      companyRetention,
      avgCommissionPerMember,
      yearlyRevenue: monthlyRevenue * 12,
      yearlyCommissionPayout: monthlyCommissionPayout * 12
    }
  }, [businessPlan, simulationData])

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

          {/* Commission Configuration */}
          {businessPlan.commission_config && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Commission Configuration</h2>
              
              {/* Standard Commissions */}
              {businessPlan.commission_config.standard_commissions && 
               businessPlan.commission_config.standard_commissions.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-700 mb-3">Standard Commissions</h3>
                  <div className="space-y-3">
                    {businessPlan.commission_config.standard_commissions
                      .filter((comm: any) => comm.is_enabled)
                      .map((commission: any, index: number) => (
                        <div key={commission.id || index} className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{commission.name}</h4>
                              <p className="text-sm text-gray-500">{commission.description}</p>
                            </div>
                            <Badge className="bg-green-100 text-green-800 text-lg">
                              {commission.percentage}%
                            </Badge>
                          </div>
                          <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Type:</span>
                              <span className="ml-2 font-medium">{commission.type}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Max Level:</span>
                              <span className="ml-2 font-medium">{commission.max_level}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Volume Range:</span>
                              <span className="ml-2 font-medium">
                                {formatCurrency(commission.min_volume || 0)} - {formatCurrency(commission.max_volume || 0)}
                              </span>
                            </div>
                          </div>
                        </div>
                    ))}
                  </div>
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm text-gray-600">Total Standard Commission: </span>
                    <span className="font-bold text-blue-600">
                      {businessPlan.commission_config.standard_commissions
                        .filter((c: any) => c.is_enabled)
                        .reduce((sum: number, c: any) => sum + (c.percentage || 0), 0)}%
                    </span>
                  </div>
                </div>
              )}
              
              {/* Custom Commissions */}
              {businessPlan.commission_config.custom_commissions && 
               businessPlan.commission_config.custom_commissions.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-700 mb-3">Custom Commissions</h3>
                  <div className="space-y-3">
                    {businessPlan.commission_config.custom_commissions
                      .filter((comm: any) => comm.is_enabled)
                      .map((commission: any, index: number) => (
                        <div key={commission.id || index} className="border rounded-lg p-4 bg-purple-50">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{commission.name}</h4>
                              <p className="text-sm text-gray-500">{commission.description}</p>
                            </div>
                            <Badge className="bg-purple-100 text-purple-800 text-lg">
                              {commission.percentage}%
                            </Badge>
                          </div>
                          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Trigger:</span>
                              <span className="ml-2 font-medium capitalize">{commission.trigger_type}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Trigger Value:</span>
                              <span className="ml-2 font-medium">{commission.trigger_value}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Max Level:</span>
                              <span className="ml-2 font-medium">{commission.max_level}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Max Volume:</span>
                              <span className="ml-2 font-medium">{formatCurrency(commission.max_volume || 0)}</span>
                            </div>
                          </div>
                        </div>
                    ))}
                  </div>
                  <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                    <span className="text-sm text-gray-600">Total Custom Commission: </span>
                    <span className="font-bold text-purple-600">
                      {businessPlan.commission_config.custom_commissions
                        .filter((c: any) => c.is_enabled)
                        .reduce((sum: number, c: any) => sum + (c.percentage || 0), 0)}%
                    </span>
                  </div>
                </div>
              )}

              {/* Total Commission Summary */}
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-white">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium">Total Commission Payout</span>
                  <span className="text-3xl font-bold">
                    {(
                      (businessPlan.commission_config.standard_commissions || [])
                        .filter((c: any) => c.is_enabled)
                        .reduce((sum: number, c: any) => sum + (c.percentage || 0), 0) +
                      (businessPlan.commission_config.custom_commissions || [])
                        .filter((c: any) => c.is_enabled)
                        .reduce((sum: number, c: any) => sum + (c.percentage || 0), 0)
                    )}%
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Revenue Projections */}
          {revenueProjections && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Revenue Projections
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-green-600 mb-2">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-sm font-medium">Monthly Revenue</span>
                  </div>
                  <p className="text-2xl font-bold text-green-700">
                    {formatCurrency(revenueProjections.monthlyRevenue)}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Yearly: {formatCurrency(revenueProjections.yearlyRevenue)}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-600 mb-2">
                    <Users className="w-4 h-4" />
                    <span className="text-sm font-medium">Commission Payout</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">
                    {formatCurrency(revenueProjections.monthlyCommissionPayout)}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {revenueProjections.totalCommission}% of revenue
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-purple-600 mb-2">
                    <Network className="w-4 h-4" />
                    <span className="text-sm font-medium">Network Size</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-700">
                    {revenueProjections.networkSize}
                  </p>
                  <p className="text-xs text-purple-600 mt-1">
                    Estimated members
                  </p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-orange-600 mb-2">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm font-medium">Avg. Per Member</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-700">
                    {formatCurrency(revenueProjections.avgCommissionPerMember)}
                  </p>
                  <p className="text-xs text-orange-600 mt-1">
                    Monthly earnings
                  </p>
                </div>
              </div>

              {/* Detailed Projections */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-3">Projection Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Product Value:</span>
                    <span className="font-medium">{formatCurrency(revenueProjections.totalProductValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Business Volume:</span>
                    <span className="font-medium">{formatCurrency(revenueProjections.totalBV)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Standard Commission:</span>
                    <span className="font-medium">{revenueProjections.standardCommTotal}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Custom Commission:</span>
                    <span className="font-medium">{revenueProjections.customCommTotal}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Company Retention:</span>
                    <span className="font-medium text-green-600">{formatCurrency(revenueProjections.companyRetention)}/mo</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Yearly Payout:</span>
                    <span className="font-medium text-blue-600">{formatCurrency(revenueProjections.yearlyCommissionPayout)}</span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Genealogy Tree Visualization */}
          {(businessPlan.genealogy_simulation_id || simulationData) && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Network className="w-5 h-5 text-indigo-600" />
                  Network Tree Visualization
                </h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTree(!showTree)}
                  >
                    {showTree ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {showTree ? 'Hide' : 'Show'}
                  </Button>
                  {businessPlan.genealogy_simulation_id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/genealogy-simulation?id=${businessPlan.genealogy_simulation_id}`)}
                    >
                      Full View
                    </Button>
                  )}
                </div>
              </div>

              {/* Simulation Stats */}
              {simulationData && (
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-indigo-50 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-indigo-600">{simulationData.total_members}</p>
                    <p className="text-xs text-indigo-500">Total Members</p>
                  </div>
                  <div className="bg-indigo-50 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-indigo-600">{simulationData.total_levels}</p>
                    <p className="text-xs text-indigo-500">Network Depth</p>
                  </div>
                  <div className="bg-indigo-50 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-indigo-600 capitalize">{simulationData.genealogy_type}</p>
                    <p className="text-xs text-indigo-500">Plan Type</p>
                  </div>
                </div>
              )}

              {/* Tree Visualization */}
              {showTree && (
                <div className="border rounded-lg p-4 bg-gray-50 overflow-auto max-h-96">
                  {simulationData?.tree ? (
                    <GenealogyTreeView root={simulationData.tree} />
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Network className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>Tree visualization not available</p>
                      <p className="text-sm mt-1">Run a simulation to see the network structure</p>
                    </div>
                  )}
                </div>
              )}

              {!simulationData && businessPlan.genealogy_simulation_id && (
                <div className="p-4 bg-yellow-50 rounded-lg text-yellow-700 text-sm">
                  <p>Simulation ID: <span className="font-mono">{businessPlan.genealogy_simulation_id}</span></p>
                  <p className="mt-1">Loading simulation data...</p>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Plan Status & Activation */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Plan Status</h2>
            <div className="text-center mb-4">
              {getStatusBadge(businessPlan.status || 'draft')}
            </div>
            
            {businessPlan.status === 'draft' && (
              <div className="space-y-3">
                <div className="p-3 bg-yellow-50 rounded-lg text-sm text-yellow-700">
                  <AlertCircle className="w-4 h-4 inline mr-2" />
                  This plan is in draft mode. Activate it to start tracking metrics.
                </div>
                <Button
                  onClick={handleActivatePlan}
                  disabled={activating}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {activating ? (
                    <>
                      <LoadingSpinner /> Activating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Activate Plan
                    </>
                  )}
                </Button>
              </div>
            )}

            {businessPlan.status === 'active' && (
              <div className="p-3 bg-green-50 rounded-lg text-sm text-green-700">
                <CheckCircle className="w-4 h-4 inline mr-2" />
                This plan is active and being tracked in dashboard metrics.
              </div>
            )}
          </Card>

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