'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

export default function CreateGenealogyTypePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    max_children_per_node: 2,
    is_active: true,
    rules: {
      fill_strategy: 'left_to_right',
      spillover_enabled: false,
      max_depth: 0,
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/genealogy-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create genealogy type')
      }

      router.push('/genealogy-types')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <Link href="/genealogy-types" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Genealogy Types
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Create Genealogy Type</h1>
            <p className="text-gray-600 mt-2">
              Define a new genealogy structure type with its rules and configuration
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Enter the basic details for this genealogy type
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Binary Plan, Unilevel Plan, Matrix Plan"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe this genealogy type and how it works..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="is_active">Active</Label>
                    <p className="text-sm text-gray-500">
                      Enable this genealogy type for use in simulations
                    </p>
                  </div>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Structure Configuration</CardTitle>
                <CardDescription>
                  Configure the tree structure and node limits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="max_children">Maximum Children per Node *</Label>
                  <Input
                    id="max_children"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.max_children_per_node}
                    onChange={(e) => setFormData({ ...formData, max_children_per_node: parseInt(e.target.value) || 2 })}
                    required
                  />
                  <p className="text-sm text-gray-500">
                    The maximum number of direct children each node can have (e.g., 2 for binary, unlimited for unilevel)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_depth">Maximum Depth (0 = unlimited)</Label>
                  <Input
                    id="max_depth"
                    type="number"
                    min="0"
                    value={formData.rules.max_depth}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      rules: { ...formData.rules, max_depth: parseInt(e.target.value) || 0 }
                    })}
                  />
                  <p className="text-sm text-gray-500">
                    Maximum tree depth (levels). Set to 0 for unlimited depth.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Filling Rules</CardTitle>
                <CardDescription>
                  Configure how new nodes are placed in the tree
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fill_strategy">Fill Strategy</Label>
                  <select
                    id="fill_strategy"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.rules.fill_strategy}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      rules: { ...formData.rules, fill_strategy: e.target.value }
                    })}
                  >
                    <option value="left_to_right">Left to Right</option>
                    <option value="right_to_left">Right to Left</option>
                    <option value="balanced">Balanced (Shortest Leg First)</option>
                    <option value="sponsor_choice">Sponsor's Choice</option>
                  </select>
                  <p className="text-sm text-gray-500">
                    Determines the order in which child positions are filled
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="spillover">Spillover Enabled</Label>
                    <p className="text-sm text-gray-500">
                      Allow excess nodes to spill over to other branches
                    </p>
                  </div>
                  <Switch
                    id="spillover"
                    checked={formData.rules.spillover_enabled}
                    onCheckedChange={(checked) => setFormData({ 
                      ...formData, 
                      rules: { ...formData.rules, spillover_enabled: checked }
                    })}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Link href="/genealogy-types">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Genealogy Type
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
