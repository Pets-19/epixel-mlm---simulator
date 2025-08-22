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
  Search
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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
  created_at: string
  updated_at: string
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
}

const TreeNode = ({ user, users, level, genealogyType, expandedNodes, onToggleNode }: TreeNodeProps) => {
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

  const users = simulationResult.users || []
  const summary = simulationResult.simulation_summary

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.product_name && user.product_name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

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
          <div className="flex space-x-1 mb-4">
            <Button
              variant={activeTab === 'tree' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('tree')}
              className="flex items-center"
            >
              <TreePine className="w-4 h-4 mr-2" />
              Tree View
            </Button>
            <Button
              variant={activeTab === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('table')}
              className="flex items-center"
            >
              <Table className="w-4 h-4 mr-2" />
              Table View
            </Button>
          </div>

          {/* Search and Filter */}
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search users, products, or emails..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="25">25 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
                <SelectItem value="100">100 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tree View */}
          {activeTab === 'tree' && (
            <div className="space-y-2">
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
                  />
                ))}
            </div>
          )}

          {/* Table View */}
          {activeTab === 'table' && (
            <div>
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
                          {sortField === 'team_volume' && (
                            <span className="ml-1">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th className="border border-gray-200 p-3 text-left">Product</th>
                      <th className="border border-gray-200 p-3 text-left">Leg Volumes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map((user) => (
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
                          <div className="font-medium text-green-600">
                            ${user.personal_volume.toLocaleString()}
                          </div>
                        </td>
                        <td className="border border-gray-200 p-3">
                          <div className="font-medium text-blue-600">
                            ${user.team_volume.toLocaleString()}
                          </div>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-700">
                  Showing {startIndex + 1} to {Math.min(endIndex, sortedUsers.length)} of {sortedUsers.length} results
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
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
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
