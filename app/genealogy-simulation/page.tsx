'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Play, Save, RotateCcw } from 'lucide-react'
import GenealogyTreeView from '@/components/genealogy-tree-view'

interface GenealogyType {
  id: number
  name: string
  description: string
  max_children_per_node: number
}

interface SimulationResult {
  simulation_id: string
  genealogy_type_id: number
  max_expected_users: number
  payout_cycle_type: string
  number_of_cycles: number
  users_per_cycle: number
  total_nodes_generated: number
  nodes: any[]
  cycles: any[]
  tree_structure: any
  created_at: string
}

export default function GenealogySimulationPage() {
  const [genealogyTypes, setGenealogyTypes] = useState<GenealogyType[]>([])
  const [selectedType, setSelectedType] = useState<string>('')
  const [maxUsers, setMaxUsers] = useState<number>(0)
  const [payoutCycleType, setPayoutCycleType] = useState<string>('weekly')
  const [numberOfCycles, setNumberOfCycles] = useState<number>(0)
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [simulating, setSimulating] = useState(false)

  useEffect(() => {
    fetchGenealogyTypes()
  }, [])

  const fetchGenealogyTypes = async () => {
    try {
      const response = await fetch('/api/genealogy-types')
      if (response.ok) {
        const data = await response.json()
        setGenealogyTypes(data)
        if (data.length > 0) {
          setSelectedType(data[0].id.toString())
        }
      }
    } catch (error) {
      console.error('Error fetching genealogy types:', error)
    }
  }

  const runSimulation = async () => {
    if (!selectedType) {
      alert('Please select a genealogy type')
      return
    }

    if (!maxUsers || maxUsers <= 0) {
      alert('Please enter a valid number for Maximum Expected Users')
      return
    }

    if (!numberOfCycles || numberOfCycles <= 0) {
      alert('Please enter a valid number for Number of Payout Cycles')
      return
    }

    setSimulating(true)
    try {
      const response = await fetch('/api/genealogy/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          genealogy_type_id: parseInt(selectedType),
          max_expected_users: maxUsers,
          payout_cycle_type: payoutCycleType,
          number_of_cycles: numberOfCycles,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setSimulationResult(result)
      } else {
        alert('Error running simulation')
      }
    } catch (error) {
      console.error('Error running simulation:', error)
      alert('Error running simulation')
    } finally {
      setSimulating(false)
    }
  }

  const saveSimulation = async () => {
    if (!simulationResult) return

    setLoading(true)
    try {
      const response = await fetch('/api/genealogy/save-simulation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          simulation_id: simulationResult.simulation_id,
          save_to_db: true,
        }),
      })

      if (response.ok) {
        alert('Simulation saved successfully!')
      } else {
        alert('Error saving simulation')
      }
    } catch (error) {
      console.error('Error saving simulation:', error)
      alert('Error saving simulation')
    } finally {
      setLoading(false)
    }
  }

  const resetSimulation = () => {
    setSimulationResult(null)
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Genealogy Simulation</h1>
        <p className="text-gray-600 mt-2">
          Test and simulate node filling logic based on genealogy type rules
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Simulation Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Simulation Configuration</CardTitle>
            <CardDescription>
              Configure parameters for genealogy simulation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="genealogy-type">Genealogy Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select genealogy type" />
                </SelectTrigger>
                <SelectContent>
                  {genealogyTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-users">Maximum Expected Users *</Label>
              <Input
                id="max-users"
                type="number"
                value={maxUsers || ''}
                onChange={(e) => setMaxUsers(parseInt(e.target.value) || 0)}
                min="1"
                max="10000"
                placeholder="Enter number of users"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payout-cycle">Payout Cycle</Label>
              <Select value={payoutCycleType} onValueChange={setPayoutCycleType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Biweekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cycles">Number of Payout Cycles *</Label>
              <Input
                id="cycles"
                type="number"
                value={numberOfCycles || ''}
                onChange={(e) => setNumberOfCycles(parseInt(e.target.value) || 0)}
                min="1"
                max="52"
                placeholder="Enter number of cycles"
                required
              />
            </div>

            <div className="flex gap-4">
              <Button 
                onClick={runSimulation} 
                disabled={simulating}
                className="flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                {simulating ? 'Running...' : 'Run Simulation'}
              </Button>
              <Button 
                variant="outline" 
                onClick={resetSimulation}
                disabled={!simulationResult}
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Simulation Results */}
        <Card>
          <CardHeader>
            <CardTitle>Simulation Results</CardTitle>
            <CardDescription>
              Results from the genealogy simulation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {simulationResult ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Total Nodes</Label>
                    <p className="text-2xl font-bold">{simulationResult.total_nodes_generated}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Users per Cycle</Label>
                    <p className="text-2xl font-bold">{simulationResult.users_per_cycle}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Cycles Summary</Label>
                  <div className="mt-2 space-y-2">
                    {simulationResult.cycles.map((cycle, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span>Cycle {cycle.cycle_number}</span>
                        <Badge variant="outline">
                          {cycle.users_in_cycle} users
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={saveSimulation} 
                  disabled={loading}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Save to Database'}
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No simulation results yet.</p>
                <p className="text-sm mt-2">Configure parameters and run simulation to see results.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Results Table */}
      {simulationResult && (
        <>
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Detailed Node Information</CardTitle>
              <CardDescription>
                Complete list of generated nodes with their positions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Parent ID</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Depth</TableHead>
                    <TableHead>Payout Cycle</TableHead>
                    <TableHead>Cycle Position</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {simulationResult.nodes.map((node, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{node.user_id}</TableCell>
                      <TableCell>{node.parent_id || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{node.position}</Badge>
                      </TableCell>
                      <TableCell>{node.depth}</TableCell>
                      <TableCell>{node.payout_cycle}</TableCell>
                      <TableCell>{node.cycle_position}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Genealogy Tree View */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Genealogy Tree View</CardTitle>
              <CardDescription>
                Visual representation of the simulated genealogy tree
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-4 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">Debug: Tree structure available: {simulationResult.tree_structure ? 'Yes' : 'No'}</p>
                <p className="text-sm text-gray-600">Root node: {simulationResult.tree_structure?.root ? 'Available' : 'Not available'}</p>
                <p className="text-sm text-gray-600">Total nodes in tree: {simulationResult.tree_structure?.total_nodes || 0}</p>
              </div>
              <GenealogyTreeView root={simulationResult.tree_structure?.root || null} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
} 