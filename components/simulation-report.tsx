'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ChevronDown, 
  ChevronRight, 
  Users, 
  TrendingUp, 
  DollarSign, 
  BarChart3,
  TreePine,
  Table,
  Download,
  Filter,
  Search,
  Calendar
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface SimulationUser {
  id: string
  name: string
  email: string
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
}

interface SimulationSummary {
  total_users_generated: number
  users_per_cycle: Record<string, number>
  product_distribution: Record<string, any>
  total_personal_volume: number
  total_team_volume: number
  average_team_volume: number
  leg_volume_summary: Record<string, any>
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
  simulation_summary: SimulationSummary
  volume_calculations: {
    personal_volume_breakdown: Record<string, any>
    team_volume_breakdown: Record<string, any>
    leg_volume_breakdown: Record<string, any>
    volume_by_payout_cycle: Record<string, PayoutCycleVolumeData>
    calculation_methodology: string
  }
  created_at: string
  updated_at: string
}

interface PayoutCycleVolumeData {
  cycle_number: number
  users_generated: number
  personal_volume: number
  team_volume: number
  leg_volumes: Record<string, number>
  product_distribution: Record<string, ProductCycleDistributionData>
  level_breakdown: Record<string, LevelVolumeData>
  cycle_summary: string
}

interface ProductCycleDistributionData {
  product_name: string
  users_count: number
  total_volume: number
  percentage: number
  average_volume_per_user: number
}

interface LevelVolumeData {
  level: number
  users_count: number
  total_volume: number
  average_volume: number
  max_volume: number
  min_volume: number
}

interface PersonalVolumeDetailData {
  user_id: string
  user_name: string
  product_id?: number
  product_name?: string
  product_price: number
  commissionable_volume: number
  calculation: string
}

interface TeamVolumeDetailData {
  user_id: string
  user_name: string
  direct_downline: string[]
  total_downline: number
  downline_volumes: Record<string, number>
  calculation: string
  volume_breakdown: Record<string, VolumeBreakdownData>
}

interface VolumeBreakdownData {
  level: number
  users: number
  volume: number
}

interface LegVolumeDetailData {
  user_id: string
  user_name: string
  leg_structure: Record<string, LegStructureData>
  calculation: string
}

interface LegStructureData {
  leg_key: string
  direct_children: string[]
  total_users: number
  total_volume: number
  level_breakdown: Record<string, LevelData>
}

interface LevelData {
  level: number
  users: number
  volume: number
}

interface SimulationReportProps {
  simulationResult: SimulationResult
}

interface TreeNodeProps {
  user: SimulationUser
  users: SimulationUser[]
  level: number
  genealogyType: string
  expandedNodes: Set<string>
  onToggleNode: (nodeId: string) => void
  simulationResult: SimulationResult
}

const TreeNode = ({ user, users, level, genealogyType, expandedNodes, onToggleNode, simulationResult }: TreeNodeProps) => {
  const isExpanded = expandedNodes.has(user.id)
  const hasChildren = user.children.length > 0
  const indent = level * 20

  const getLegLabel = (position: string, genealogyType: string) => {
    if (genealogyType === 'binary') {
      return position === 'left' ? 'Left Leg' : 'Right Leg'
    }
    return `Leg ${position.replace('leg-', '')}`
  }

  const getLegVolume = (legKey: string) => {
    return user.team_leg_volumes[legKey] || 0
  }

  // Get user's payout cycle volume data
  const getUserCycleData = () => {
    if (!user.payout_cycle) return null
    
    // Find the user in the volume calculations
    const personalBreakdown = simulationResult.volume_calculations?.personal_volume_breakdown?.[user.id]
    const teamBreakdown = simulationResult.volume_calculations?.team_volume_breakdown?.[user.id]
    const legBreakdown = simulationResult.volume_calculations?.leg_volume_breakdown?.[user.id]
    
    return {
      personal: personalBreakdown,
      team: teamBreakdown,
      leg: legBreakdown,
      cycle: user.payout_cycle
    }
  }

  const userCycleData = getUserCycleData()

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
              <div className="text-center">
                <div className="font-medium text-green-600">
                  ${user.personal_volume.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">Personal</div>
              </div>
              
              <div className="text-center">
                <div className="font-medium text-blue-600">
                  ${user.team_volume.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">Team</div>
              </div>
              
              {user.product_name && (
                <div className="text-center">
                  <div className="font-medium text-purple-600">
                    {user.product_name}
                  </div>
                  <div className="text-xs text-gray-500">Product</div>
                </div>
              )}
            </div>
          </div>
          
          {/* Leg Volume Details */}
          {isExpanded && Object.keys(user.team_leg_volumes).length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {Object.entries(user.team_leg_volumes).map(([legKey, volume]) => (
                  <div key={legKey} className="text-center p-2 bg-white rounded border">
                    <div className="text-xs font-medium text-gray-600">
                      {getLegLabel(legKey, genealogyType)}
                    </div>
                    <div className="text-sm font-bold text-indigo-600">
                      ${volume.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User Cycle Volume Details */}
          {isExpanded && userCycleData && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="bg-blue-50 p-3 rounded-lg">
                <h5 className="text-sm font-medium text-blue-800 mb-2">
                  Payout Cycle {userCycleData.cycle} Volume Breakdown
                </h5>
                
                {/* Personal Volume Details */}
                {userCycleData.personal && (
                  <div className="mb-3">
                    <h6 className="text-xs font-medium text-blue-700 mb-1">Personal Volume Calculation</h6>
                    <div className="text-xs text-blue-600 bg-white p-2 rounded border">
                      {userCycleData.personal.calculation}
                    </div>
                  </div>
                )}

                {/* Team Volume Details */}
                {userCycleData.team && (
                  <div className="mb-3">
                    <h6 className="text-xs font-medium text-blue-700 mb-1">Team Volume Calculation</h6>
                    <div className="text-xs text-blue-600 bg-white p-2 rounded border">
                      {userCycleData.team.calculation}
                    </div>
                    
                                         {/* Direct Downline */}
                     {userCycleData.team.direct_downline && userCycleData.team.direct_downline.length > 0 && (
                       <div className="mt-2">
                         <div className="text-xs text-blue-700 mb-1">Direct Downline ({userCycleData.team.direct_downline.length} users)</div>
                         <div className="flex flex-wrap gap-1">
                           {userCycleData.team.direct_downline.map((downlineId: string, index: number) => {
                             const downlineUser = users.find(u => u.id === downlineId)
                             return (
                               <Badge key={downlineId} variant="outline" className="text-xs">
                                 {downlineUser?.name || downlineId} (${userCycleData.team.downline_volumes?.[downlineId]?.toLocaleString() || 0})
                               </Badge>
                             )
                           })}
                         </div>
                       </div>
                     )}

                     {/* Level Breakdown */}
                     {userCycleData.team.volume_breakdown && Object.keys(userCycleData.team.volume_breakdown).length > 0 && (
                       <div className="mt-2">
                         <div className="text-xs text-blue-700 mb-1">Volume by Level</div>
                         <div className="grid grid-cols-3 gap-2">
                           {Object.entries(userCycleData.team.volume_breakdown).map(([levelKey, levelData]) => {
                             const typedLevelData = levelData as VolumeBreakdownData
                             return (
                               <div key={levelKey} className="text-center p-1 bg-white rounded border text-xs">
                                 <div className="font-medium text-blue-600">Level {typedLevelData.level}</div>
                                 <div className="text-blue-500">{typedLevelData.users} users</div>
                                 <div className="text-blue-600 font-bold">${typedLevelData.volume.toLocaleString()}</div>
                               </div>
                             )
                           })}
                         </div>
                       </div>
                     )}
                  </div>
                )}

                                 {/* Leg Volume Details */}
                 {userCycleData.leg && userCycleData.leg.leg_structure && (
                   <div>
                     <h6 className="text-xs font-medium text-blue-700 mb-1">Leg Volume Structure</h6>
                     <div className="grid grid-cols-2 gap-2">
                       {Object.entries(userCycleData.leg.leg_structure).map(([legKey, legData]) => {
                         const typedLegData = legData as LegStructureData
                         return (
                           <div key={legKey} className="bg-white p-2 rounded border">
                             <div className="text-xs font-medium text-blue-600 mb-1">
                               {getLegLabel(legKey, genealogyType)}
                             </div>
                             <div className="text-xs text-blue-500 space-y-1">
                               <div>Users: {typedLegData.total_users}</div>
                               <div>Volume: ${typedLegData.total_volume.toLocaleString()}</div>
                               {typedLegData.direct_children && typedLegData.direct_children.length > 0 && (
                                 <div>Direct: {typedLegData.direct_children.length}</div>
                               )}
                             </div>
                           </div>
                         )
                       })}
                     </div>
                   </div>
                 )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Children */}
      {isExpanded && hasChildren && (
        <div>
          {user.children.map(childId => {
            const childUser = users.find(u => u.id === childId)
            if (childUser) {
              return (
                <TreeNode
                  key={childId}
                  user={childUser}
                  users={users}
                  level={level + 1}
                  genealogyType={genealogyType}
                  expandedNodes={expandedNodes}
                  onToggleNode={onToggleNode}
                  simulationResult={simulationResult}
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

const SimulationReport = ({ simulationResult }: SimulationReportProps) => {
  const [activeTab, setActiveTab] = useState<'tree' | 'table'>('tree')
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [sortField, setSortField] = useState<keyof SimulationUser>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [selectedPayoutCycle, setSelectedPayoutCycle] = useState<string>('all')

  const users = simulationResult.users || []
  const summary = simulationResult.simulation_summary

  // Filter users by payout cycle and search term
  const filteredUsers = users.filter(user => {
    // Filter by payout cycle
    if (selectedPayoutCycle !== 'all' && user.payout_cycle.toString() !== selectedPayoutCycle) {
      return false
    }
    
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        (user.product_name && user.product_name.toLowerCase().includes(searchLower))
      )
    }
    
    return true
  })

  // Group users by payout cycle for summary
  const usersByCycle = users.reduce((acc, user) => {
    const cycle = user.payout_cycle.toString()
    if (!acc[cycle]) {
      acc[cycle] = []
    }
    acc[cycle].push(user)
    return acc
  }, {} as Record<string, SimulationUser[]>)

  // Calculate cycle summaries
  const cycleSummaries = Object.entries(usersByCycle).map(([cycle, cycleUsers]) => {
    const personalVolume = cycleUsers.reduce((sum, user) => sum + user.personal_volume, 0)
    const teamVolume = cycleUsers.reduce((sum, user) => sum + user.team_volume, 0)
    
    // Calculate leg volumes for this cycle
    const legVolumes: Record<string, number> = {}
    cycleUsers.forEach(user => {
      Object.entries(user.team_leg_volumes).forEach(([leg, volume]) => {
        if (!legVolumes[leg]) legVolumes[leg] = 0
        legVolumes[leg] += volume
      })
    })

    return {
      cycle,
      users: cycleUsers,
      userCount: cycleUsers.length,
      personalVolume,
      teamVolume,
      legVolumes
    }
  }).sort((a, b) => parseInt(a.cycle) - parseInt(b.cycle))

  // Get available payout cycles for filter
  const availablePayoutCycles = Object.keys(usersByCycle).sort((a, b) => parseInt(a) - parseInt(b))

  // Helper function to get leg label
  const getLegLabel = (position: string, genealogyType: string) => {
    if (genealogyType === 'binary') {
      return position === 'left' ? 'Left Leg' : 'Right Leg'
    }
    return `Leg ${position.replace('leg-', '')}`
  }

  // Sort users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
    }
    
    return 0
  })

  // Pagination
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedUsers = sortedUsers.slice(startIndex, endIndex)

  const toggleNode = (nodeId: string) => {
    const newExpandedNodes = new Set(expandedNodes)
    if (newExpandedNodes.has(nodeId)) {
      newExpandedNodes.delete(nodeId)
    } else {
      newExpandedNodes.add(nodeId)
    }
    setExpandedNodes(newExpandedNodes)
  }

  const expandAll = () => {
    setExpandedNodes(new Set(users.map(u => u.id)))
  }

  const collapseAll = () => {
    setExpandedNodes(new Set())
  }

  const handleSort = (field: keyof SimulationUser) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getVolumeCalculationExplanation = () => {
    const genealogyType = simulationResult.genealogy_type
    let legExplanation = ''
    
    if (genealogyType === 'binary') {
      legExplanation = 'Left Leg and Right Leg volumes are calculated separately for each user.'
    } else if (genealogyType === 'unilevel' || genealogyType === 'matrix') {
      legExplanation = 'Leg-1, Leg-2, Leg-3, etc. volumes are calculated based on the number of children per node.'
    }

    return {
      personal: 'Personal Volume = Commissionable Volume of products purchased by the user',
      team: 'Team Volume = Sum of Personal Volumes from all downline users (unlimited genealogy levels)',
      leg: legExplanation
    }
  }

  const explanation = getVolumeCalculationExplanation()

  // Helper function to get user cycle data
  const getUserCycleData = (user: SimulationUser) => {
    if (!user.payout_cycle) return null
    
    // Find the user in the volume calculations
    const personalBreakdown = simulationResult.volume_calculations?.personal_volume_breakdown?.[user.id]
    const teamBreakdown = simulationResult.volume_calculations?.team_volume_breakdown?.[user.id]
    const legBreakdown = simulationResult.volume_calculations?.leg_volume_breakdown?.[user.id]
    
    return {
      personal: personalBreakdown,
      team: teamBreakdown,
      leg: legBreakdown,
      cycle: user.payout_cycle
    }
  }

  return (
    <div className="space-y-6">
      {/* Volume Calculation Explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Volume Calculation Methodology
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border">
              <h4 className="font-semibold text-green-800 mb-2">Personal Volume</h4>
              <p className="text-sm text-green-700">{explanation.personal}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border">
              <h4 className="font-semibold text-blue-800 mb-2">Team Volume</h4>
              <p className="text-sm text-blue-700">{explanation.team}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border">
              <h4 className="font-semibold text-purple-800 mb-2">Leg Volume</h4>
              <p className="text-sm text-purple-700">{explanation.leg}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Simulation Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Simulation Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-800">{summary.total_users_generated}</div>
              <div className="text-sm text-blue-600">Total Users</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <DollarSign className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-800">
                ${summary.total_personal_volume.toLocaleString()}
              </div>
              <div className="text-sm text-green-600">Personal Volume</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <TrendingUp className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-800">
                ${summary.total_team_volume.toLocaleString()}
              </div>
              <div className="text-sm text-purple-600">Team Volume</div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <BarChart3 className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-800">
                ${summary.average_team_volume.toLocaleString()}
              </div>
              <div className="text-sm text-orange-600">Avg Team Volume</div>
            </div>
          </div>

          {/* Users per Cycle */}
          <div className="mt-6">
            <h4 className="font-semibold mb-3">Users Generated per Payout Cycle</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Object.entries(summary.users_per_cycle).map(([cycle, count]) => (
                <div key={cycle} className="text-center p-3 bg-gray-50 rounded-lg border">
                  <div className="text-lg font-bold text-gray-800">{count}</div>
                  <div className="text-sm text-gray-600">Cycle {cycle}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Product Distribution */}
          <div className="mt-6">
            <h4 className="font-semibold mb-3">Product Distribution</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(summary.product_distribution).map(([product, data]) => (
                <div key={product} className="text-center p-3 bg-indigo-50 rounded-lg border">
                  <div className="text-lg font-bold text-indigo-800">{data.count}</div>
                  <div className="text-sm text-indigo-600">{product}</div>
                  <div className="text-xs text-indigo-500">{data.percentage}%</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payout Cycle Volume Breakdown */}
      {simulationResult.volume_calculations?.volume_by_payout_cycle && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Payout Cycle Volume Breakdown
            </CardTitle>
            <CardDescription>
              Detailed volume analysis by payout cycle showing temporal distribution of business activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(simulationResult.volume_calculations.volume_by_payout_cycle)
                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                .map(([cycleNumber, cycleData]) => (
                  <div key={cycleNumber} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Payout Cycle {cycleNumber}
                      </h3>
                      <Badge variant="outline" className="text-sm">
                        {cycleData.users_generated} users
                      </Badge>
                    </div>

                    {/* Cycle Summary */}
                    <div className="mb-4 p-3 bg-white rounded border">
                      <p className="text-sm text-gray-700">{cycleData.cycle_summary}</p>
                    </div>

                    {/* Volume Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg border">
                        <div className="text-lg font-bold text-green-800">
                          ${cycleData.personal_volume.toLocaleString()}
                        </div>
                        <div className="text-sm text-green-600">Personal Volume</div>
                      </div>
                      
                      <div className="text-center p-3 bg-blue-50 rounded-lg border">
                        <div className="text-lg font-bold text-blue-800">
                          ${cycleData.team_volume.toLocaleString()}
                        </div>
                        <div className="text-sm text-blue-600">Team Volume</div>
                      </div>
                      
                      <div className="text-center p-3 bg-purple-50 rounded-lg border">
                        <div className="text-sm text-purple-600">Leg Volumes</div>
                        <div className="text-xs text-purple-500 mt-1">
                          {Object.entries(cycleData.leg_volumes || {}).map(([leg, volume]) => (
                            <div key={leg}>
                              {leg}: ${volume.toLocaleString()}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Product Distribution for this Cycle */}
                    {cycleData.product_distribution && Object.keys(cycleData.product_distribution).length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-3">Product Distribution in Cycle {cycleNumber}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {Object.entries(cycleData.product_distribution).map(([productName, productData]) => (
                            <div key={productName} className="p-3 bg-white rounded border">
                              <div className="font-medium text-gray-800 mb-2">{productName}</div>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Users:</span>
                                  <span className="font-medium">{productData.users_count}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Total Volume:</span>
                                  <span className="font-medium">${productData.total_volume.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Percentage:</span>
                                  <span className="font-medium">{productData.percentage.toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Avg/User:</span>
                                  <span className="font-medium">${productData.average_volume_per_user.toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Level Breakdown for this Cycle */}
                    {cycleData.level_breakdown && Object.keys(cycleData.level_breakdown).length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Level Breakdown in Cycle {cycleNumber}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          {Object.entries(cycleData.level_breakdown)
                            .sort(([a], [b]) => parseInt(a) - parseInt(b))
                            .map(([level, levelData]) => (
                              <div key={level} className="p-3 bg-white rounded border">
                                <div className="font-medium text-gray-800 mb-2">Level {level}</div>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Users:</span>
                                    <span className="font-medium">{levelData.users_count}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Total:</span>
                                    <span className="font-medium">${levelData.total_volume.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Average:</span>
                                    <span className="font-medium">${levelData.average_volume.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Max:</span>
                                    <span className="font-medium">${levelData.max_volume.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Min:</span>
                                    <span className="font-medium">${levelData.min_volume.toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <TreePine className="w-5 h-5 mr-2" />
              Detailed Simulation Report
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={expandAll}
              >
                Expand All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={collapseAll}
              >
                Collapse All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex items-center space-x-2">
              <Button
                variant={activeTab === 'tree' ? 'default' : 'outline'}
                onClick={() => setActiveTab('tree')}
                className="flex items-center"
              >
                <TreePine className="w-4 h-4 mr-2" />
                Tree View
              </Button>
              <Button
                variant={activeTab === 'table' ? 'default' : 'outline'}
                onClick={() => setActiveTab('table')}
                className="flex items-center"
              >
                <Table className="w-4 h-4 mr-2" />
                Table View
              </Button>
            </div>

            {/* Payout Cycle Filter */}
            <div className="flex items-center space-x-2">
              <Label htmlFor="payout-cycle-filter" className="text-sm font-medium">
                Filter by Payout Cycle:
              </Label>
              <Select value={selectedPayoutCycle} onValueChange={setSelectedPayoutCycle}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All Cycles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cycles</SelectItem>
                  {availablePayoutCycles.map(cycle => (
                    <SelectItem key={cycle} value={cycle}>
                      Cycle {cycle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Label htmlFor="items-per-page" className="text-sm font-medium">
                Items per page:
              </Label>
              <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(parseInt(value))}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tree View */}
          {activeTab === 'tree' && (
            <div className="space-y-4">
              {users
                .filter(user => !user.parent_id) // Root users only
                .map(user => (
                  <TreeNode
                    key={user.id}
                    user={user}
                    users={users}
                    level={0}
                    genealogyType={simulationResult.genealogy_type}
                    expandedNodes={expandedNodes}
                    onToggleNode={toggleNode}
                    simulationResult={simulationResult}
                  />
                ))}
            </div>
          )}

          {/* Table View */}
          {activeTab === 'table' && (
            <div>
              {/* Payout Cycle Summary Cards */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Payout Cycle Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cycleSummaries.map((cycleSummary) => (
                    <Card key={cycleSummary.cycle} className="border-2 border-blue-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center justify-between">
                          <span>Payout Cycle {cycleSummary.cycle}</span>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            {cycleSummary.userCount} users
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="text-center p-2 bg-green-50 rounded-lg">
                            <div className="text-lg font-bold text-green-800">
                              ${cycleSummary.personalVolume.toLocaleString()}
                            </div>
                            <div className="text-sm text-green-600">Personal Volume</div>
                          </div>
                          
                          <div className="text-center p-2 bg-blue-50 rounded-lg">
                            <div className="text-lg font-bold text-blue-800">
                              ${cycleSummary.teamVolume.toLocaleString()}
                            </div>
                            <div className="text-sm text-blue-600">Team Volume</div>
                          </div>
                        </div>
                        
                        {/* Leg Volumes */}
                        {Object.keys(cycleSummary.legVolumes).length > 0 && (
                          <div>
                            <div className="text-sm font-medium text-gray-700 mb-2">Leg Volumes:</div>
                            <div className="grid grid-cols-2 gap-2">
                              {Object.entries(cycleSummary.legVolumes).map(([leg, volume]) => (
                                <div key={leg} className="text-center p-2 bg-purple-50 rounded border">
                                  <div className="text-sm font-medium text-purple-800">
                                    {getLegLabel(leg, simulationResult.genealogy_type)}
                                  </div>
                                  <div className="text-lg font-bold text-purple-600">
                                    ${volume.toLocaleString()}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th 
                        className="border border-gray-200 p-3 text-left cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center">
                          Name
                          {sortField === 'name' && (
                            <span className="ml-1">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="border border-gray-200 p-3 text-left cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('level')}
                      >
                        <div className="flex items-center">
                          Level
                          {sortField === 'level' && (
                            <span className="ml-1">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="border border-gray-200 p-3 text-left cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('payout_cycle')}
                      >
                        <div className="flex items-center">
                          Payout Cycle
                          {sortField === 'payout_cycle' && (
                            <span className="ml-1">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="border border-gray-200 p-3 text-left cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('personal_volume')}
                      >
                        <div className="flex items-center">
                          Personal Volume
                          {sortField === 'personal_volume' && (
                            <span className="ml-1">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="border border-gray-200 p-3 text-left cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('team_volume')}
                      >
                        <div className="flex items-center">
                          Team Volume
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </div>
                      </th>
                      <th className="border border-gray-200 p-3 text-left">Product</th>
                      <th className="border border-gray-200 p-3 text-left">Leg Volumes</th>
                      <th className="border border-gray-200 p-3 text-left">Cycle Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map((user) => {
                      const userCycleData = getUserCycleData(user)
                      return (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="border border-gray-200 p-3">
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </td>
                          <td className="border border-gray-200 p-3">
                            <Badge variant="outline">Level {user.level}</Badge>
                          </td>
                          <td className="border border-gray-200 p-3">
                            <Badge variant="outline" className="bg-orange-100 text-orange-800">
                              Cycle {user.payout_cycle}
                            </Badge>
                          </td>
                          <td className="border border-gray-200 p-3">
                            <div className="font-medium text-green-600">
                              ${user.personal_volume.toLocaleString()}
                            </div>
                            {userCycleData?.personal && (
                              <div className="text-xs text-gray-500 mt-1">
                                {userCycleData.personal.calculation}
                              </div>
                            )}
                          </td>
                          <td className="border border-gray-200 p-3">
                            <div className="font-medium text-blue-600">
                              ${user.team_volume.toLocaleString()}
                            </div>
                            {userCycleData?.team && (
                              <div className="text-xs text-gray-500 mt-1">
                                {userCycleData.team.calculation}
                              </div>
                            )}
                          </td>
                          <td className="border border-gray-200 p-3">
                            {user.product_name ? (
                              <Badge variant="secondary">{user.product_name}</Badge>
                            ) : (
                              <span className="text-gray-400">No product</span>
                            )}
                          </td>
                          <td className="border border-gray-200 p-3">
                            <div className="space-y-1">
                              {Object.entries(user.team_leg_volumes).map(([leg, volume]) => (
                                <div key={leg} className="text-xs">
                                  <span className="font-medium">{leg}:</span> ${volume.toLocaleString()}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="border border-gray-200 p-3">
                            {userCycleData ? (
                              <div className="text-xs space-y-1">
                                <div className="font-medium text-blue-600">Cycle {userCycleData.cycle}</div>
                                {userCycleData.team?.direct_downline && (
                                  <div>Downline: {userCycleData.team.direct_downline.length} users</div>
                                )}
                                {userCycleData.team?.total_downline && (
                                  <div>Total: {userCycleData.team.total_downline} users</div>
                                )}
                                {userCycleData.leg?.leg_structure && (
                                  <div>Legs: {Object.keys(userCycleData.leg.leg_structure).length}</div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">No cycle data</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} results
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-700">
                    Page {currentPage} of {Math.ceil(filteredUsers.length / itemsPerPage)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage >= Math.ceil(filteredUsers.length / itemsPerPage)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leg Volume Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Leg Volume Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(summary.leg_volume_summary).map(([legName, legData]) => (
              <div key={legName} className="p-4 bg-gray-50 rounded-lg border">
                <h4 className="font-semibold text-gray-800 mb-3 capitalize">{legName}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Volume:</span>
                    <span className="font-medium">${legData.total_volume.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Users:</span>
                    <span className="font-medium">{legData.user_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average:</span>
                    <span className="font-medium">${legData.average_volume.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Max:</span>
                    <span className="font-medium">${legData.max_volume.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Min:</span>
                    <span className="font-medium">${legData.min_volume.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SimulationReport
