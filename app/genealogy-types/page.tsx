'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Edit, Trash2, Eye } from 'lucide-react'
import Link from 'next/link'
import Header from '@/components/header'

interface GenealogyType {
  id: number
  name: string
  description: string
  max_children_per_node: number
  rules: any
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function GenealogyTypesPage() {
  const [genealogyTypes, setGenealogyTypes] = useState<GenealogyType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGenealogyTypes()
  }, [])

  const fetchGenealogyTypes = async () => {
    try {
      const response = await fetch('/api/genealogy-types')
      if (response.ok) {
        const data = await response.json()
        setGenealogyTypes(data)
      }
    } catch (error) {
      console.error('Error fetching genealogy types:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-lg">Loading genealogy types...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Genealogy Types">
        <Link href="/genealogy-types/create">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create New Type
          </Button>
        </Link>
      </Header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <p className="text-gray-600 mt-2">
              Manage different genealogy structure types and their rules
            </p>
          </div>

      <Card>
        <CardHeader>
          <CardTitle>Genealogy Types</CardTitle>
          <CardDescription>
            Configure different genealogy structures and their node filling rules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Max Children</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {genealogyTypes.map((type) => (
                <TableRow key={type.id}>
                  <TableCell className="font-medium">{type.name}</TableCell>
                  <TableCell className="max-w-md truncate">
                    {type.description}
                  </TableCell>
                  <TableCell>{type.max_children_per_node}</TableCell>
                  <TableCell>
                    <Badge variant={type.is_active ? "default" : "secondary"}>
                      {type.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(type.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/genealogy-types/${type.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/genealogy-types/${type.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm" className="text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {genealogyTypes.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No genealogy types found.</p>
              <Link href="/genealogy-types/create">
                <Button className="mt-4">Create First Type</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
        </div>
      </main>
    </div>
  )
} 