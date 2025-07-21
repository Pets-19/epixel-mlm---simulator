'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Play, Settings } from 'lucide-react'

interface GenealogyType {
  id: number
  name: string
  description: string
  max_children_per_node: number
}

interface SimulationConfig {
  genealogy_type_id: number
  max_expected_users: number
  payout_cycle_type: string
  number_of_cycles: number
  max_children_count: number
}

interface SimulationConfigStepProps {
  config: SimulationConfig | null
  onConfigChange: (config: SimulationConfig) => void
}

export default function SimulationConfigStep({ config, onConfigChange }: SimulationConfigStepProps) {
  const [genealogyTypes, setGenealogyTypes] = useState<GenealogyType[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localConfig, setLocalConfig] = useState<SimulationConfig>({
    genealogy_type_id: 0,
    max_expected_users: 0,
    payout_cycle_type: 'weekly',
    number_of_cycles: 0,
    max_children_count: 2
  })

  useEffect(() => {
    if (config) {
      setLocalConfig(config)
    }
    fetchGenealogyTypes()
  }, [config])

  useEffect(() => {
    if (localConfig.genealogy_type_id > 0) {
      onConfigChange(localConfig)
    }
  }, [localConfig, onConfigChange])

  const fetchGenealogyTypes = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/genealogy-types')
      if (response.ok) {
        const data = await response.json()
        setGenealogyTypes(data)
        if (data.length > 0 && !localConfig.genealogy_type_id) {
          setLocalConfig(prev => ({
            ...prev,
            genealogy_type_id: data[0].id
          }))
        }
      } else {
        setError('Failed to fetch genealogy types')
      }
    } catch (err) {
      setError('An error occurred while fetching genealogy types')
    } finally {
      setLoading(false)
    }
  }

  const updateConfig = (field: keyof SimulationConfig, value: any) => {
    setLocalConfig(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const getSelectedGenealogyType = () => {
    return genealogyTypes.find(type => type.id === localConfig.genealogy_type_id)
  }

  const validateConfig = () => {
    return localConfig.genealogy_type_id > 0 &&
           localConfig.max_expected_users > 0 &&
           localConfig.number_of_cycles > 0 &&
           localConfig.max_children_count > 0
  }

  const getMaxChildrenDescription = () => {
    const selectedType = getSelectedGenealogyType()
    if (!selectedType) return ''

    switch (selectedType.name) {
      case 'Binary Plan':
        return 'Binary Plan always uses 2 children per parent'
      case 'Matrix Plan':
        return 'Maximum number of children any parent node can have'
      case 'Unilevel Plan':
        return 'Average number of children per parent for filling/spilling logic'
      default:
        return 'Select a genealogy type to see specific requirements'
    }
  }

  const isMaxChildrenRequired = () => {
    const selectedType = getSelectedGenealogyType()
    return selectedType && (selectedType.name === 'Unilevel Plan' || selectedType.name === 'Matrix Plan')
  }

  const isMaxChildrenDisabled = () => {
    const selectedType = getSelectedGenealogyType()
    return selectedType?.name === 'Binary Plan'
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Genealogy Type Selection */}
      <div>
        <Label htmlFor="genealogy-type" className="text-base font-medium">
          Genealogy Type *
        </Label>
        <Select
          value={localConfig.genealogy_type_id > 0 ? localConfig.genealogy_type_id.toString() : undefined}
          onValueChange={(value) => {
            const typeId = parseInt(value)
            const selectedType = genealogyTypes.find(type => type.id === typeId)
            updateConfig('genealogy_type_id', typeId)
            if (selectedType?.name === 'Binary Plan') {
              updateConfig('max_children_count', 2)
            }
          }}
        >
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="Select genealogy type" />
          </SelectTrigger>
          <SelectContent>
            {loading ? (
              <SelectItem value="loading" disabled>Loading...</SelectItem>
            ) : (
              genealogyTypes.map((type) => (
                <SelectItem key={type.id} value={type.id.toString()}>
                  {type.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        
        {getSelectedGenealogyType() && (
          <div className="mt-2 p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600">
              {getSelectedGenealogyType()?.description}
            </p>
          </div>
        )}
      </div>

      {/* Simulation Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="max-users" className="text-base font-medium">
            Maximum Expected Users *
          </Label>
          <Input
            id="max-users"
            type="number"
            min="1"
            max="10000"
            value={localConfig.max_expected_users || ''}
            onChange={(e) => updateConfig('max_expected_users', parseInt(e.target.value) || 0)}
            placeholder="Enter number of users"
            className="mt-2"
          />
          <p className="text-sm text-gray-500 mt-1">
            Total number of users to simulate
          </p>
        </div>

        <div>
          <Label htmlFor="payout-cycle" className="text-base font-medium">
            Payout Cycle
          </Label>
          <Select
            value={localConfig.payout_cycle_type}
            onValueChange={(value) => updateConfig('payout_cycle_type', value)}
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="biweekly">Biweekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-500 mt-1">
            Frequency of payout cycles
          </p>
        </div>

        <div>
          <Label htmlFor="cycles" className="text-base font-medium">
            Number of Payout Cycles *
          </Label>
          <Input
            id="cycles"
            type="number"
            min="1"
            max="52"
            value={localConfig.number_of_cycles || ''}
            onChange={(e) => updateConfig('number_of_cycles', parseInt(e.target.value) || 0)}
            placeholder="Enter number of cycles"
            className="mt-2"
          />
          <p className="text-sm text-gray-500 mt-1">
            Total number of payout cycles to simulate
          </p>
        </div>

        <div>
          <Label htmlFor="max-children" className="text-base font-medium">
            Max Children Count {isMaxChildrenRequired() ? '*' : ''}
          </Label>
          <Input
            id="max-children"
            type="number"
            min="1"
            max="20"
            value={localConfig.max_children_count || ''}
            onChange={(e) => updateConfig('max_children_count', parseInt(e.target.value) || 0)}
            placeholder="Enter max children per parent"
            className="mt-2"
            disabled={isMaxChildrenDisabled()}
          />
          <p className="text-sm text-gray-500 mt-1">
            {getMaxChildrenDescription()}
          </p>
        </div>
      </div>

      {/* Configuration Summary */}
      {validateConfig() && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Settings className="w-5 h-5 text-green-600" />
              <h3 className="font-medium text-green-800">Configuration Summary</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-green-600">Genealogy Type</p>
                <p className="font-medium text-green-800">
                  {getSelectedGenealogyType()?.name}
                </p>
              </div>
              <div>
                <p className="text-green-600">Max Users</p>
                <p className="font-medium text-green-800">
                  {localConfig.max_expected_users.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-green-600">Payout Cycle</p>
                <p className="font-medium text-green-800 capitalize">
                  {localConfig.payout_cycle_type}
                </p>
              </div>
              <div>
                <p className="text-green-600">Cycles</p>
                <p className="font-medium text-green-800">
                  {localConfig.number_of_cycles}
                </p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-green-200">
              <p className="text-sm text-green-600">
                Users per cycle: {Math.ceil(localConfig.max_expected_users / localConfig.number_of_cycles)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Status */}
      {!validateConfig() && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            Please complete all required fields to proceed.
          </p>
        </div>
      )}
    </div>
  )
} 