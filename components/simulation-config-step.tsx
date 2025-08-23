'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Loader2, Play, CheckCircle, AlertCircle, Users, TrendingUp, Calendar, GitBranch, Package, Settings, BarChart3 } from 'lucide-react'
import { SimulationConfig, BusinessProduct } from '@/lib/business-plan'
// Removed SimulationEngine import - now using Go API
import SimulationReport from './simulation-report'

interface SimulationConfigStepProps {
  config: SimulationConfig | null
  products: BusinessProduct[]
  onConfigChange: (config: SimulationConfig) => void
  onSimulationComplete?: (simulationResult: any) => void
}

export default function SimulationConfigStep({ 
  config, 
  products, 
  onConfigChange,
  onSimulationComplete 
}: SimulationConfigStepProps) {
  const [localConfig, setLocalConfig] = useState<SimulationConfig>({
    genealogy_type: 'binary',
    max_expected_users: 100,
    payout_cycle: 'weekly',
    number_of_payout_cycles: 2,
    max_children_count: 2
  })

  const [genealogyTypes, setGenealogyTypes] = useState<Array<{ id: number; name: string; description: string }>>([])
  const [loading, setLoading] = useState(false)
  const [simulating, setSimulating] = useState(false)
  const [simulationProgress, setSimulationProgress] = useState<{ current: number; total: number; percentage: number } | null>(null)
  const [simulationResult, setSimulationResult] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  useEffect(() => {
    if (config) {
      setLocalConfig(config)
    }
    fetchGenealogyTypes()
  }, [config])

  useEffect(() => {
    // Update max_children_count based on genealogy type
    if (localConfig.genealogy_type === 'binary') {
      setLocalConfig(prev => ({ ...prev, max_children_count: 2 }))
    } else if (localConfig.genealogy_type === 'unilevel') {
      setLocalConfig(prev => ({ ...prev, max_children_count: Math.max(prev.max_children_count, 1) }))
    }
  }, [localConfig.genealogy_type])

  const fetchGenealogyTypes = async () => {
    try {
      const response = await fetch('/api/genealogy-types')
      if (response.ok) {
        const data = await response.json()
        setGenealogyTypes(data)
      }
    } catch (error) {
      console.error('Error fetching genealogy types:', error)
    }
  }

  const validateConfig = (): boolean => {
    const errors: string[] = []

    if (localConfig.max_expected_users < 1) {
      errors.push('Maximum expected users must be at least 1')
    }

    if (localConfig.number_of_payout_cycles < 1) {
      errors.push('Number of payout cycles must be at least 1')
    }

    if (localConfig.max_children_count < 1) {
      errors.push('Maximum children count must be at least 1')
    }

    // Validate genealogy type constraints
    if (localConfig.genealogy_type === 'binary' && localConfig.max_children_count !== 2) {
      errors.push('Binary genealogy type requires exactly 2 children per user')
    }

    if (localConfig.genealogy_type === 'unilevel' && localConfig.max_children_count < 1) {
      errors.push('Unilevel genealogy type requires at least 1 child per user')
    }

    if (localConfig.genealogy_type === 'matrix' && localConfig.max_children_count < 1) {
      errors.push('Matrix genealogy type requires at least 1 child per user')
    }

    // Validate products
    if (!products || products.length === 0) {
      errors.push('At least one product is required for simulation')
    } else {
      // Validate sales ratios total 100%
      const totalSalesRatio = products.reduce((sum, product) => sum + product.product_sales_ratio, 0)
      if (Math.abs(totalSalesRatio - 100) > 0.01) {
        errors.push(`Product sales ratios must total 100%. Current total: ${totalSalesRatio.toFixed(1)}%`)
      }
    }

    setValidationErrors(errors)
    return errors.length === 0
  }

  const handleConfigChange = (field: keyof SimulationConfig, value: any) => {
    const newConfig = { ...localConfig, [field]: value }
    setLocalConfig(newConfig)
    onConfigChange(newConfig)
    setError(null)
    setValidationErrors([])
  }

  const runSimulation = async () => {
    if (!validateConfig()) {
      return
    }

    setSimulating(true)
    setError(null)
    setSimulationProgress({ current: 0, total: localConfig.max_expected_users, percentage: 0 })

    try {
      // Prepare request for Go API
      const simulationRequest = {
        genealogy_type: localConfig.genealogy_type,
        max_expected_users: localConfig.max_expected_users,
        payout_cycle: localConfig.payout_cycle,
        number_of_payout_cycles: localConfig.number_of_payout_cycles,
        max_children_count: localConfig.max_children_count,
        products: products.map((product, index) => ({
          id: index + 1,
          product_name: product.product_name,
          product_price: product.product_price,
          business_volume: product.business_volume,
          product_sales_ratio: product.product_sales_ratio,
          product_type: product.product_type,
          sort_order: index + 1,
          is_active: true
        }))
      }

      // Call Go API for business simulation
      const response = await fetch('http://localhost:8080/api/genealogy/business-simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(simulationRequest)
      })

      if (!response.ok) {
        throw new Error(`Simulation failed: ${response.statusText}`)
      }

      const result = await response.json()
      
      setSimulationResult(result)
      
      // Notify parent component
      if (onSimulationComplete) {
        onSimulationComplete(result)
      }
      
      setError(null)
    } catch (error) {
      console.error('Simulation error:', error)
      setError(error instanceof Error ? error.message : 'Simulation failed')
    } finally {
      setSimulating(false)
      setSimulationProgress(null)
    }
  }

  const getGenealogyTypeDescription = (type: string) => {
    switch (type) {
      case 'binary':
        return 'Two children per user, left/right leg structure'
      case 'unilevel':
        return 'Unlimited children per user, single level structure'
      case 'matrix':
        return 'Fixed matrix structure with level-based filling'
      default:
        return 'Custom genealogy structure'
    }
  }

  const getPayoutCycleDescription = (cycle: string) => {
    switch (cycle) {
      case 'weekly':
        return 'Weekly commission payouts'
      case 'biweekly':
        return 'Bi-weekly commission payouts'
      case 'monthly':
        return 'Monthly commission payouts'
      case 'quarterly':
        return 'Quarterly commission payouts'
      default:
        return 'Custom payout cycle'
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Simulation Setup</h2>
        <p className="text-gray-600 mt-2">
          Configure genealogy simulation parameters and run the simulation
        </p>
      </div>

      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Simulation Configuration
          </CardTitle>
          <CardDescription>
            Set up the genealogy structure and simulation parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Genealogy Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="genealogy-type">Genealogy Type *</Label>
              <Select
                value={localConfig.genealogy_type}
                onValueChange={(value) => handleConfigChange('genealogy_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select genealogy type" />
                </SelectTrigger>
                <SelectContent>
                  {genealogyTypes.map((type) => (
                    <SelectItem key={type.id} value={type.name.toLowerCase()}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">
                {getGenealogyTypeDescription(localConfig.genealogy_type)}
              </p>
            </div>

            <div>
              <Label htmlFor="max-children">Maximum Children Count *</Label>
              <Input
                id="max-children"
                type="number"
                min={1}
                max={localConfig.genealogy_type === 'binary' ? 2 : 10}
                value={localConfig.max_children_count}
                onChange={(e) => handleConfigChange('max_children_count', parseInt(e.target.value))}
                disabled={localConfig.genealogy_type === 'binary'}
              />
              <p className="text-sm text-gray-500 mt-1">
                {localConfig.genealogy_type === 'binary' 
                  ? 'Binary type is fixed at 2 children' 
                  : 'Maximum children per user in genealogy'
                }
              </p>
            </div>
          </div>

          {/* User Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="max-users">Maximum Expected Users *</Label>
              <Input
                id="max-users"
                type="number"
                min={1}
                max={10000}
                value={localConfig.max_expected_users}
                onChange={(e) => handleConfigChange('max_expected_users', parseInt(e.target.value))}
              />
              <p className="text-sm text-gray-500 mt-1">
                Total users to generate in the simulation
              </p>
            </div>

            <div>
              <Label htmlFor="payout-cycles">Number of Payout Cycles *</Label>
              <Input
                id="payout-cycles"
                type="number"
                min={1}
                max={52}
                value={localConfig.number_of_payout_cycles}
                onChange={(e) => handleConfigChange('number_of_payout_cycles', parseInt(e.target.value))}
              />
              <p className="text-sm text-gray-500 mt-1">
                Users will be generated gradually per cycle
              </p>
            </div>
          </div>

          {/* Payout Cycle */}
          <div>
            <Label htmlFor="payout-cycle">Payout Cycle *</Label>
            <Select
              value={localConfig.payout_cycle}
              onValueChange={(value) => handleConfigChange('payout_cycle', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payout cycle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Bi-weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500 mt-1">
              {getPayoutCycleDescription(localConfig.payout_cycle)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Product Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Product Configuration
          </CardTitle>
          <CardDescription>
            Products and their sales ratios for simulation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {products.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{product.product_name}</p>
                  <p className="text-sm text-gray-600">
                    Commissionable Volume: ${product.business_volume}
                  </p>
                </div>
                <Badge variant="outline">
                  {product.product_sales_ratio}% Sales Ratio
                </Badge>
              </div>
            ))}
            
            {/* Sales Ratio Validation */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-800">Total Sales Ratio:</span>
                <Badge variant={products.reduce((sum, p) => sum + p.product_sales_ratio, 0) === 100 ? 'default' : 'destructive'}>
                  {products.reduce((sum, p) => sum + p.product_sales_ratio, 0)}%
                </Badge>
              </div>
              {products.reduce((sum, p) => sum + p.product_sales_ratio, 0) !== 100 && (
                <p className="text-xs text-blue-600 mt-1">
                  Sales ratios must total exactly 100% for simulation
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Simulation Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Play className="w-5 h-5 mr-2" />
            Run Simulation
          </CardTitle>
          <CardDescription>
            Generate genealogy structure and simulate user behavior
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <div>
                  <p className="font-medium text-red-800">Configuration Errors:</p>
                  <ul className="text-sm text-red-700 mt-1 list-disc list-inside">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Simulation Progress */}
          {simulationProgress && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-800">Simulation Progress</span>
                <span className="text-sm text-blue-600">
                  {simulationProgress.current} / {simulationProgress.total} users
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${simulationProgress.percentage}%` }}
                />
              </div>
              <p className="text-xs text-blue-600 mt-1">
                {simulationProgress.percentage.toFixed(1)}% Complete
              </p>
            </div>
          )}

          {/* Simulation Results */}
          {simulationResult && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                <div>
                  <p className="font-medium text-green-800">Simulation Complete!</p>
                  <p className="text-sm text-green-700 mt-1">
                    Generated {simulationResult.simulation_summary?.total_users_generated || simulationResult.users?.length || 0} users with{' '}
                    ${(simulationResult.simulation_summary?.total_personal_volume || 0).toLocaleString()} total personal volume
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={runSimulation}
              disabled={simulating || validationErrors.length > 0}
              className="flex-1"
            >
              {simulating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Running Simulation...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run Simulation
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Simulation Summary */}
      {simulationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Simulation Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-800">
                  {simulationResult.simulation_summary?.total_users_generated || simulationResult.users?.length || 0}
                </p>
                <p className="text-sm text-blue-600">Total Users</p>
              </div>
              
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-800">
                  ${(simulationResult.simulation_summary?.total_personal_volume || 0).toLocaleString()}
                </p>
                <p className="text-sm text-green-600">Personal Volume</p>
              </div>
              
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <BarChart3 className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-800">
                  ${(simulationResult.simulation_summary?.total_team_volume || 0).toLocaleString()}
                </p>
                <p className="text-sm text-purple-600">Team Volume</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Simulation Report */}
      {simulationResult && (
        <SimulationReport 
          simulationResult={simulationResult} 
          genealogyType={localConfig.genealogy_type}
        />
      )}
    </div>
  )
} 