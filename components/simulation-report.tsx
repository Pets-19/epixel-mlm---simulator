import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ChevronDown, ChevronRight, Users, Search, Filter } from 'lucide-react'

interface VolumeWithCycleAttribution {
  total_volume: number
  cycle_breakdown: Record<string, number>
  personal_volume_per_cycle: Record<string, number>
  leg_volume_per_cycle: Record<string, Record<string, number>>
  team_volume_per_cycle: Record<string, number>
  calculation: string
}

interface VolumeGeneration {
  personal_volume: number
  leg_volumes: Record<string, number>
  team_volume: number
  source: string
}

interface SimulationUser {
  id: string
  name: string
  level: number
  parent_id?: string
  children: string[]
  genealogy_position: string
  product_id?: number
  product_name?: string
  personal_volume: number
  team_volume: number
  team_leg_volumes: Record<string, number>
  commissionable_volume: number
  payout_cycle: number
  created_at: string
  genealogy_node?: any
  // Enhanced cycle-specific volume tracking
  personal_volume_per_cycle: Record<string, number>
  leg_volume_per_cycle: Record<string, Record<string, number>>
  team_volume_per_cycle: Record<string, number>
  volume_generation_per_cycle: Record<string, VolumeGeneration>
}

interface SimulationResult {
  id: string
  genealogy_type: string
  max_expected_users: number
  payout_cycle: string
  number_of_payout_cycles: number
  max_children_count: number
  products: any[]
  users: SimulationUser[]
  genealogy_structure: Record<string, string[]>
  simulation_summary: any
  volume_calculations: {
    personal_volume_breakdown: Record<string, any>
    team_volume_breakdown: Record<string, any>
    leg_volume_breakdown: Record<string, any>
    volume_by_payout_cycle: Record<string, any>
    calculation_methodology: string
  }
  created_at: string
  updated_at: string
}

interface SimulationReportProps {
  simulationResult: SimulationResult
  genealogyType: string
}

export default function SimulationReport({ simulationResult, genealogyType }: SimulationReportProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPayoutCycle, setSelectedPayoutCycle] = useState('all')
  const [viewMode, setViewMode] = useState<'tree' | 'table'>('tree')

  // Toggle node expansion
  const onToggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId)
    } else {
      newExpanded.add(nodeId)
    }
    setExpandedNodes(newExpanded)
  }

  // Filter users based on search term
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return simulationResult.users
    
    const searchLower = searchTerm.toLowerCase()
    return simulationResult.users.filter(user => 
      user.name.toLowerCase().includes(searchLower) ||
      (user.product_name && user.product_name.toLowerCase().includes(searchLower))
    )
  }, [simulationResult.users, searchTerm])

  // Get available payout cycles for filter
  const availablePayoutCycles = useMemo(() => {
    const cycles = new Set<number>()
    simulationResult.users.forEach(user => {
      if (user.payout_cycle > 0) {
        cycles.add(user.payout_cycle)
      }
    })
    return Array.from(cycles).sort((a, b) => a - b)
  }, [simulationResult.users])

  // Get leg label based on genealogy type
  const getLegLabel = (position: string, type: string) => {
    if (type === 'binary') {
      return position === 'left' ? 'Left' : 'Right'
    } else if (type === 'unilevel' || type === 'matrix') {
      return position
    }
    return position
  }

  // Calculate cumulative totals for tree view
  const getCumulativeVolumes = (user: SimulationUser) => {
    const totalPersonalVolume = user.personal_volume
    const totalTeamVolume = user.team_volume
    
    // Calculate cumulative leg volumes from all cycles
    const cumulativeLegVolumes: Record<string, number> = {}
    if (user.leg_volume_per_cycle) {
      Object.entries(user.leg_volume_per_cycle).forEach(([legKey, cycleVolumes]) => {
        cumulativeLegVolumes[legKey] = Object.values(cycleVolumes).reduce((sum, vol) => sum + vol, 0)
      })
    }
    
    return {
      totalPersonalVolume,
      totalTeamVolume,
      cumulativeLegVolumes
    }
  }

  // Generate cycle-based table data
  const generateCycleTableData = () => {
    const tableData: Array<{
      userId: string
      userName: string
      level: number
      cycle: number
      personalVolume: number
      teamVolume: number
      leftLegVolume: number
      rightLegVolume: number
    }> = []

    simulationResult.users.forEach(user => {
      // Get all cycles where this user has activity
      const userCycles = new Set<number>()
      
      // Add user's own payout cycle
      if (user.payout_cycle > 0) {
        userCycles.add(user.payout_cycle)
      }
      
      // Add cycles from team volume per cycle
      if (user.team_volume_per_cycle) {
        Object.keys(user.team_volume_per_cycle).forEach(cycle => {
          userCycles.add(parseInt(cycle))
        })
      }
      
      // Add cycles from leg volume per cycle
      if (user.leg_volume_per_cycle) {
        Object.values(user.leg_volume_per_cycle).forEach(cycleVolumes => {
          Object.keys(cycleVolumes).forEach(cycle => {
            userCycles.add(parseInt(cycle))
          })
        })
      }

      // Create a row for each cycle
      userCycles.forEach(cycle => {
        const personalVolume = user.personal_volume_per_cycle?.[cycle] || 0
        const teamVolume = user.team_volume_per_cycle?.[cycle] || 0
        const leftLegVolume = user.leg_volume_per_cycle?.left?.[cycle] || 0
        const rightLegVolume = user.leg_volume_per_cycle?.right?.[cycle] || 0

        tableData.push({
          userId: user.id,
          userName: user.name,
          level: user.level,
          cycle,
          personalVolume,
          teamVolume,
          leftLegVolume,
          rightLegVolume
        })
      })
    })

    return tableData.sort((a, b) => {
      // Sort by user name first, then by cycle
      if (a.userName !== b.userName) {
        return a.userName.localeCompare(b.userName)
      }
      return a.cycle - b.cycle
    })
  }

  const cycleTableData = generateCycleTableData()

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Simulation Report</h2>
          <p className="text-gray-600">Genealogy Type: {genealogyType}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* View Mode Toggle */}
          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === 'tree' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('tree')}
              className="rounded-r-none"
            >
              Tree View
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="rounded-l-none"
            >
              Table View
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-48"
            />
          </div>

          {/* Cycle Filter */}
          <Select value={selectedPayoutCycle} onValueChange={setSelectedPayoutCycle}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Cycles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cycles</SelectItem>
              {availablePayoutCycles.map(cycle => (
                <SelectItem key={cycle} value={cycle.toString()}>
                  Cycle {cycle}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tree View */}
      {viewMode === 'tree' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Genealogy Tree View
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredUsers
                .filter(user => !user.parent_id) // Only root users
                .map(user => (
                  <TreeNode
                    key={user.id}
                    user={user}
                    users={filteredUsers}
                    genealogyType={genealogyType}
                    expandedNodes={expandedNodes}
                    onToggleNode={onToggleNode}
                    indent={0}
                  />
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Detailed Cycle-Based Table View
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 p-3 text-left">User Name</th>
                    <th className="border border-gray-200 p-3 text-left">Level</th>
                    <th className="border border-gray-200 p-3 text-left">Cycle</th>
                    <th className="border border-gray-200 p-3 text-left">Personal Volume</th>
                    <th className="border border-gray-200 p-3 text-left">Team Volume</th>
                    <th className="border border-gray-200 p-3 text-left">Left Leg Volume</th>
                    <th className="border border-gray-200 p-3 text-left">Right Leg Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {cycleTableData
                    .filter(row => selectedPayoutCycle === 'all' || row.cycle.toString() === selectedPayoutCycle)
                    .map((row, index) => (
                      <tr key={`${row.userId}-${row.cycle}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-200 p-3">
                          <div className="font-medium text-gray-900">{row.userName}</div>
                        </td>
                        <td className="border border-gray-200 p-3">
                          <Badge variant="outline">Level {row.level}</Badge>
                        </td>
                        <td className="border border-gray-200 p-3">
                          <Badge variant="outline" className="bg-orange-100 text-orange-800">
                            Cycle {row.cycle}
                          </Badge>
                        </td>
                        <td className="border border-gray-200 p-3">
                          <div className="font-medium text-green-600">
                            ${row.personalVolume.toLocaleString()}
                          </div>
                        </td>
                        <td className="border border-gray-200 p-3">
                          <div className="font-medium text-blue-600">
                            ${row.teamVolume.toLocaleString()}
                          </div>
                        </td>
                        <td className="border border-gray-200 p-3">
                          <div className="font-medium text-indigo-600">
                            ${row.leftLegVolume.toLocaleString()}
                          </div>
                        </td>
                        <td className="border border-gray-200 p-3">
                          <div className="font-medium text-purple-600">
                            ${row.rightLegVolume.toLocaleString()}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Simplified TreeNode component for tree view
interface TreeNodeProps {
  user: SimulationUser
  users: SimulationUser[]
  genealogyType: string
  expandedNodes: Set<string>
  onToggleNode: (nodeId: string) => void
  indent: number
}

function TreeNode({ user, users, genealogyType, expandedNodes, onToggleNode, indent }: TreeNodeProps) {
  const hasChildren = user.children && user.children.length > 0
  const isExpanded = expandedNodes.has(user.id)
  
  // Get cumulative volumes for display
  const getCumulativeVolumes = (user: SimulationUser) => {
    const totalPersonalVolume = user.personal_volume
    const totalTeamVolume = user.team_volume
    
    // Calculate cumulative leg volumes from all cycles
    const cumulativeLegVolumes: Record<string, number> = {}
    if (user.leg_volume_per_cycle) {
      Object.entries(user.leg_volume_per_cycle).forEach(([legKey, cycleVolumes]) => {
        cumulativeLegVolumes[legKey] = Object.values(cycleVolumes).reduce((sum, vol) => sum + vol, 0)
      })
    }
    
    return {
      totalPersonalVolume,
      totalTeamVolume,
      cumulativeLegVolumes
    }
  }

  const volumes = getCumulativeVolumes(user)

  return (
    <div className="mb-2">
      <div 
        className="flex items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border cursor-pointer transition-colors"
        style={{ marginLeft: `${indent}px` }}
        onClick={() => onToggleNode(user.id)}
      >
        {hasChildren && (
          <div className="mr-2">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            )}
          </div>
        )}
        
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-500" />
                <span className="font-medium text-gray-900">{user.name}</span>
                <Badge variant="outline" className="text-xs">
                  Level {user.level}
                </Badge>
                {user.genealogy_position && (
                  <Badge variant="secondary" className="text-xs">
                    {getLegLabel(user.genealogy_position, genealogyType)}
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800">
                  Cycle {user.payout_cycle}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-sm">
              {/* Total Personal Volume */}
              <div className="text-center">
                <div className="font-medium text-green-600">
                  ${volumes.totalPersonalVolume.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">Total Personal</div>
              </div>
              
              {/* Total Team Volume */}
              <div className="text-center">
                <div className="font-medium text-blue-600">
                  ${volumes.totalTeamVolume.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">Total Team</div>
              </div>
              
              {/* Total Leg Volumes */}
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">Total Legs:</div>
                <div className="space-y-1">
                  {Object.entries(volumes.cumulativeLegVolumes).map(([legKey, volume]) => (
                    <div key={legKey} className="text-xs">
                      <span className="font-medium text-indigo-600">{legKey}:</span> ${volume.toLocaleString()}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Render children if expanded */}
      {isExpanded && hasChildren && (
        <div className="mt-2">
          {user.children.map(childId => {
            const childUser = users.find(u => u.id === childId)
            if (childUser) {
              return (
                <TreeNode
                  key={childUser.id}
                  user={childUser}
                  users={users}
                  genealogyType={genealogyType}
                  expandedNodes={expandedNodes}
                  onToggleNode={onToggleNode}
                  indent={indent + 20}
                />
              )
            }
            return null
          })}
        </div>
      )}
    </div>
  )
}

// Helper function to get leg label
function getLegLabel(position: string, type: string) {
  if (type === 'binary') {
    return position === 'left' ? 'Left' : 'Right'
  } else if (type === 'unilevel' || type === 'matrix') {
    return position
  }
  return position
}
