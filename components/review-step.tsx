'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { User, Building2, Package, Settings, CreditCard, Monitor, DollarSign } from 'lucide-react'
import { BusinessProduct } from '@/lib/business-plan'
import { CommissionConfig } from './commission-step'

interface User {
  id: number
  name: string
  email: string
  role: string
}

interface SimulationConfig {
  genealogy_type_id: number
  max_expected_users: number
  payout_cycle_type: string
  number_of_cycles: number
  max_children_count: number
}

interface ReviewStepProps {
  selectedUser: User | null
  businessName: string
  products: BusinessProduct[]
  simulationConfig: SimulationConfig | null
  commissionConfig: CommissionConfig | null
}

export default function ReviewStep({ 
  selectedUser, 
  businessName, 
  products, 
  simulationConfig,
  commissionConfig
}: ReviewStepProps) {
  const getProductTypeIcon = (type: string) => {
    switch (type) {
      case 'membership':
        return <CreditCard className="w-4 h-4" />
      case 'retail':
        return <Package className="w-4 h-4" />
      case 'digital':
        return <Monitor className="w-4 h-4" />
      default:
        return <Package className="w-4 h-4" />
    }
  }

  const getProductTypeColor = (type: string) => {
    switch (type) {
      case 'membership':
        return 'bg-blue-100 text-blue-800'
      case 'retail':
        return 'bg-green-100 text-green-800'
      case 'digital':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const calculateTotalValue = () => {
    return products.reduce((sum, product) => sum + (product.product_price || 0), 0)
  }

  const calculateTotalBV = () => {
    return products.reduce((sum, product) => sum + (product.business_volume || 0), 0)
  }

  if (!selectedUser || !businessName || products.length === 0 || !simulationConfig || !commissionConfig) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Please complete all previous steps to review your business plan.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* User Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="w-5 h-5 mr-2" />
            Business User
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">{selectedUser.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{selectedUser.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Role</p>
              <Badge variant="outline">{selectedUser.role}</Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500">User ID</p>
              <p className="font-medium">#{selectedUser.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="w-5 h-5 mr-2" />
            Business Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Business Name</p>
              <p className="font-medium text-lg">{businessName}</p>
            </div>
            
            <Separator />
            
            <div>
              <p className="text-sm text-gray-500 mb-2">Products ({products.length})</p>
              <div className="space-y-3">
                {products.map((product, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getProductTypeIcon(product.product_type)}
                        <h4 className="font-medium">{product.product_name}</h4>
                        <Badge className={getProductTypeColor(product.product_type)}>
                          {product.product_type.charAt(0).toUpperCase() + product.product_type.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Price</p>
                        <p className="font-medium">${product.product_price.toFixed(2)}</p>
                      </div>
                                           <div>
                       <p className="text-gray-500">Business Volume</p>
                       <p className="font-medium">${product.business_volume.toFixed(2)}</p>
                     </div>
                     <div>
                       <p className="text-gray-500">Sales Ratio</p>
                       <p className="font-medium">{product.product_sales_ratio.toFixed(2)}%</p>
                     </div>
                   </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600">Total Product Value</p>
                <p className="font-bold text-blue-800 text-lg">
                  ${calculateTotalValue().toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600">Total Business Volume</p>
                <p className="font-bold text-green-800 text-lg">
                  ${calculateTotalBV().toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Simulation Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Simulation Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500">Genealogy Type</p>
              <p className="font-medium">Type #{simulationConfig.genealogy_type_id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Maximum Expected Users</p>
              <p className="font-medium">{simulationConfig.max_expected_users.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Payout Cycle</p>
              <p className="font-medium capitalize">{simulationConfig.payout_cycle_type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Number of Cycles</p>
              <p className="font-medium">{simulationConfig.number_of_cycles}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Max Children Count</p>
              <p className="font-medium">{simulationConfig.max_children_count}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Users per Cycle</p>
              <p className="font-medium">
                {Math.ceil(simulationConfig.max_expected_users / simulationConfig.number_of_cycles)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commission Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Commission Structure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Standard Commissions */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Standard Commissions</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {commissionConfig.standard_commissions
                  .filter(comm => comm.is_enabled)
                  .map((commission) => (
                    <div key={commission.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{commission.name}</span>
                        <Badge variant="outline">{commission.percentage}%</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{commission.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        {commission.max_level && <span>Max Level: {commission.max_level}</span>}
                        {commission.min_volume && <span>Min Vol: ${commission.min_volume}</span>}
                        {commission.max_volume && <span>Max Vol: ${commission.max_volume}</span>}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Custom Commissions */}
            {commissionConfig.custom_commissions.filter(comm => comm.is_enabled).length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Custom Commissions</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {commissionConfig.custom_commissions
                    .filter(comm => comm.is_enabled)
                    .map((commission) => (
                      <div key={commission.id} className="p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-blue-900">{commission.name}</span>
                          <Badge variant="outline" className="bg-blue-100 text-blue-800">
                            {commission.percentage}%
                          </Badge>
                        </div>
                        <p className="text-sm text-blue-700">{commission.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-blue-600">
                          <span>Trigger: {commission.trigger_type} ({commission.trigger_value})</span>
                          {commission.max_level && <span>Max Level: {commission.max_level}</span>}
                          {commission.max_volume && <span>Max Vol: ${commission.max_volume}</span>}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Commission Summary */}
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-green-800">Total Commission Rate</p>
                  <p className="text-sm text-green-600">
                    {commissionConfig.standard_commissions.filter(c => c.is_enabled).length} Standard + {commissionConfig.custom_commissions.filter(c => c.is_enabled).length} Custom
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-800">
                    {(commissionConfig.standard_commissions
                      .filter(c => c.is_enabled)
                      .reduce((sum, c) => sum + c.percentage, 0) +
                      commissionConfig.custom_commissions
                        .filter(c => c.is_enabled)
                        .reduce((sum, c) => sum + c.percentage, 0)
                    ).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Business Plan Summary
            </h3>
            <p className="text-gray-600 mb-4">
              Ready to create business plan simulation for {selectedUser.name}
            </p>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Products</p>
                <p className="font-bold text-gray-900">{products.length}</p>
              </div>
              <div>
                <p className="text-gray-500">Total Value</p>
                <p className="font-bold text-gray-900">${calculateTotalValue().toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-500">Simulation Users</p>
                <p className="font-bold text-gray-900">{simulationConfig.max_expected_users.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500">Commission Rate</p>
                <p className="font-bold text-gray-900">
                  {(commissionConfig.standard_commissions
                    .filter(c => c.is_enabled)
                    .reduce((sum, c) => sum + c.percentage, 0) +
                    commissionConfig.custom_commissions
                      .filter(c => c.is_enabled)
                      .reduce((sum, c) => sum + c.percentage, 0)
                  ).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 