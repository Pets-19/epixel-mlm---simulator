'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Trash2, Plus, Settings, DollarSign, Users, TrendingUp, Star, Zap } from 'lucide-react'

export interface StandardCommission {
  id: string
  name: string
  description: string
  type: 'binary' | 'sales' | 'referral' | 'unilevel' | 'fast_start'
  is_enabled: boolean
  percentage: number
  max_level?: number
  min_volume?: number
  max_volume?: number
}

export interface CustomCommission {
  id: string
  name: string
  description: string
  is_enabled: boolean
  percentage: number
  trigger_type: 'volume' | 'level' | 'milestone'
  trigger_value: number
  max_level?: number
  max_volume?: number
}

export interface CommissionConfig {
  standard_commissions: StandardCommission[]
  custom_commissions: CustomCommission[]
}

interface CommissionStepProps {
  config: CommissionConfig | null
  onConfigChange: (config: CommissionConfig) => void
}

const DEFAULT_STANDARD_COMMISSIONS: StandardCommission[] = [
  {
    id: 'binary',
    name: 'Binary Commission',
    description: 'Commission earned from binary tree structure (left/right legs)',
    type: 'binary',
    is_enabled: true,
    percentage: 10,
    max_level: 10,
    min_volume: 0,
    max_volume: 10000
  },
  {
    id: 'sales',
    name: 'Sales Commission',
    description: 'Direct commission from personal sales and team sales',
    type: 'sales',
    is_enabled: true,
    percentage: 15,
    max_level: 5,
    min_volume: 100,
    max_volume: 50000
  },
  {
    id: 'referral',
    name: 'Referral Commission',
    description: 'Commission for referring new members to the system',
    type: 'referral',
    is_enabled: true,
    percentage: 25,
    max_level: 1,
    min_volume: 0,
    max_volume: 1000
  },
  {
    id: 'unilevel',
    name: 'Unilevel Commission',
    description: 'Commission from each level in the unilevel structure',
    type: 'unilevel',
    is_enabled: true,
    percentage: 5,
    max_level: 7,
    min_volume: 50,
    max_volume: 25000
  },
  {
    id: 'fast_start',
    name: 'Fast Start Commission',
    description: 'Bonus commission for quick team building and early success',
    type: 'fast_start',
    is_enabled: false,
    percentage: 20,
    max_level: 3,
    min_volume: 200,
    max_volume: 10000
  }
]

export default function CommissionStep({ config, onConfigChange }: CommissionStepProps) {
  const [localConfig, setLocalConfig] = useState<CommissionConfig>({
    standard_commissions: [...DEFAULT_STANDARD_COMMISSIONS],
    custom_commissions: []
  })

  useEffect(() => {
    if (config) {
      setLocalConfig(config)
    }
  }, [config])

  useEffect(() => {
    onConfigChange(localConfig)
  }, [localConfig, onConfigChange])

  const updateStandardCommission = (id: string, field: keyof StandardCommission, value: any) => {
    setLocalConfig(prev => ({
      ...prev,
      standard_commissions: prev.standard_commissions.map(comm =>
        comm.id === id ? { ...comm, [field]: value } : comm
      )
    }))
  }

  const updateCustomCommission = (id: string, field: keyof CustomCommission, value: any) => {
    setLocalConfig(prev => ({
      ...prev,
      custom_commissions: prev.custom_commissions.map(comm =>
        comm.id === id ? { ...comm, [field]: value } : comm
      )
    }))
  }

  const addCustomCommission = () => {
    const newCommission: CustomCommission = {
      id: `custom_${Date.now()}`,
      name: '',
      description: '',
      is_enabled: true,
      percentage: 10,
      trigger_type: 'volume',
      trigger_value: 1000,
      max_level: 5,
      max_volume: 10000
    }
    
    setLocalConfig(prev => ({
      ...prev,
      custom_commissions: [...prev.custom_commissions, newCommission]
    }))
  }

  const removeCustomCommission = (id: string) => {
    setLocalConfig(prev => ({
      ...prev,
      custom_commissions: prev.custom_commissions.filter(comm => comm.id !== id)
    }))
  }

  const getCommissionIcon = (type: string) => {
    switch (type) {
      case 'binary':
        return <Users className="w-4 h-4" />
      case 'sales':
        return <DollarSign className="w-4 h-4" />
      case 'referral':
        return <Star className="w-4 h-4" />
      case 'unilevel':
        return <TrendingUp className="w-4 h-4" />
      case 'fast_start':
        return <Zap className="w-4 h-4" />
      default:
        return <Settings className="w-4 h-4" />
    }
  }

  const getCommissionColor = (type: string) => {
    switch (type) {
      case 'binary':
        return 'bg-blue-100 text-blue-800'
      case 'sales':
        return 'bg-green-100 text-green-800'
      case 'referral':
        return 'bg-yellow-100 text-yellow-800'
      case 'unilevel':
        return 'bg-purple-100 text-purple-800'
      case 'fast_start':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const calculateTotalCommission = () => {
    const standardTotal = localConfig.standard_commissions
      .filter(comm => comm.is_enabled)
      .reduce((sum, comm) => sum + comm.percentage, 0)
    
    const customTotal = localConfig.custom_commissions
      .filter(comm => comm.is_enabled)
      .reduce((sum, comm) => sum + comm.percentage, 0)
    
    return standardTotal + customTotal
  }

  const validateConfig = () => {
    const hasValidStandard = localConfig.standard_commissions.some(comm => comm.is_enabled)
    const hasValidCustom = localConfig.custom_commissions.every(comm => 
      comm.is_enabled ? (comm.name.trim() && comm.description.trim()) : true
    )
    return hasValidStandard && hasValidCustom
  }

  return (
    <div className="space-y-6">
      {/* Standard Commissions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <Label className="text-base font-medium">Standard Commissions</Label>
          <Badge variant="outline" className="text-sm">
            {localConfig.standard_commissions.filter(c => c.is_enabled).length} Active
          </Badge>
        </div>
        
        <div className="space-y-4">
          {localConfig.standard_commissions.map((commission) => (
            <Card key={commission.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getCommissionIcon(commission.type)}
                    <div>
                      <CardTitle className="text-lg">{commission.name}</CardTitle>
                      <CardDescription>{commission.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={commission.is_enabled}
                        onCheckedChange={(checked) => 
                          updateStandardCommission(commission.id, 'is_enabled', checked)
                        }
                      />
                      <Label className="text-sm">Enable</Label>
                    </div>
                    <Badge className={getCommissionColor(commission.type)}>
                      {commission.type.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              {commission.is_enabled && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor={`${commission.id}-percentage`}>Commission Percentage (%)</Label>
                      <Input
                        id={`${commission.id}-percentage`}
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={commission.percentage}
                        onChange={(e) => 
                          updateStandardCommission(commission.id, 'percentage', parseFloat(e.target.value) || 0)
                        }
                        placeholder="0.0"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`${commission.id}-max-level`}>Max Level</Label>
                      <Input
                        id={`${commission.id}-max-level`}
                        type="number"
                        min="1"
                        max="20"
                        value={commission.max_level || ''}
                        onChange={(e) => 
                          updateStandardCommission(commission.id, 'max_level', parseInt(e.target.value) || 0)
                        }
                        placeholder="Unlimited"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`${commission.id}-min-volume`}>Min Volume ($)</Label>
                      <Input
                        id={`${commission.id}-min-volume`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={commission.min_volume || ''}
                        onChange={(e) => 
                          updateStandardCommission(commission.id, 'min_volume', parseFloat(e.target.value) || 0)
                        }
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  
                  {commission.max_volume && (
                    <div>
                      <Label htmlFor={`${commission.id}-max-volume`}>Max Volume ($)</Label>
                      <Input
                        id={`${commission.id}-max-volume`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={commission.max_volume}
                        onChange={(e) => 
                          updateStandardCommission(commission.id, 'max_volume', parseFloat(e.target.value) || 0)
                        }
                        placeholder="0.00"
                      />
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Custom Commissions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <Label className="text-base font-medium">Custom Commissions</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addCustomCommission}
            className="flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Custom Commission
          </Button>
        </div>
        
        {localConfig.custom_commissions.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No custom commissions configured yet</p>
              <Button
                type="button"
                variant="outline"
                onClick={addCustomCommission}
                className="flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Custom Commission
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {localConfig.custom_commissions.map((commission) => (
              <Card key={commission.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Settings className="w-4 h-4" />
                      <div>
                        <CardTitle className="text-lg">{commission.name || 'Custom Commission'}</CardTitle>
                        <CardDescription>{commission.description || 'Custom commission rule'}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={commission.is_enabled}
                          onCheckedChange={(checked) => 
                            updateCustomCommission(commission.id, 'is_enabled', checked)
                          }
                        />
                        <Label className="text-sm">Enable</Label>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCustomCommission(commission.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                {commission.is_enabled && (
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`${commission.id}-name`}>Commission Name *</Label>
                        <Input
                          id={`${commission.id}-name`}
                          value={commission.name}
                          onChange={(e) => 
                            updateCustomCommission(commission.id, 'name', e.target.value)
                          }
                          placeholder="Enter commission name"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`${commission.id}-description`}>Description</Label>
                        <Input
                          id={`${commission.id}-description`}
                          value={commission.description}
                          onChange={(e) => 
                            updateCustomCommission(commission.id, 'description', e.target.value)
                          }
                          placeholder="Enter description"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor={`${commission.id}-percentage`}>Commission Percentage (%)</Label>
                        <Input
                          id={`${commission.id}-percentage`}
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={commission.percentage}
                          onChange={(e) => 
                            updateCustomCommission(commission.id, 'percentage', parseFloat(e.target.value) || 0)
                          }
                          placeholder="0.0"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`${commission.id}-trigger-type`}>Trigger Type</Label>
                        <Select
                          value={commission.trigger_type}
                          onValueChange={(value: 'volume' | 'level' | 'milestone') => 
                            updateCustomCommission(commission.id, 'trigger_type', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="volume">Volume Based</SelectItem>
                            <SelectItem value="level">Level Based</SelectItem>
                            <SelectItem value="milestone">Milestone Based</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor={`${commission.id}-trigger-value`}>Trigger Value</Label>
                        <Input
                          id={`${commission.id}-trigger-value`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={commission.trigger_value}
                          onChange={(e) => 
                            updateCustomCommission(commission.id, 'trigger_value', parseFloat(e.target.value) || 0)
                          }
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`${commission.id}-max-level`}>Max Level</Label>
                        <Input
                          id={`${commission.id}-max-level`}
                          type="number"
                          min="1"
                          max="20"
                          value={commission.max_level || ''}
                          onChange={(e) => 
                            updateCustomCommission(commission.id, 'max_level', parseInt(e.target.value) || 0)
                          }
                          placeholder="Unlimited"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`${commission.id}-max-volume`}>Max Volume ($)</Label>
                        <Input
                          id={`${commission.id}-max-volume`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={commission.max_volume || ''}
                          onChange={(e) => 
                            updateCustomCommission(commission.id, 'max_volume', parseFloat(e.target.value) || 0)
                          }
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Commission Summary */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-blue-800">Commission Summary</p>
              <p className="text-sm text-blue-600">
                {localConfig.standard_commissions.filter(c => c.is_enabled).length} Standard + {localConfig.custom_commissions.filter(c => c.is_enabled).length} Custom
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-600">Total Commission Rate</p>
              <p className="font-medium text-blue-800">
                {calculateTotalCommission().toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Status */}
      {!validateConfig() && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            Please enable at least one standard commission and complete all custom commission fields to proceed.
          </p>
        </div>
      )}
    </div>
  )
}
