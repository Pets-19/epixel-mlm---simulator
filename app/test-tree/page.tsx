'use client'

import GenealogyTreeView, { TreeNode } from '@/components/genealogy-tree-view'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestTreePage() {
  // Sample tree data for testing
  const sampleTree: TreeNode = {
    id: 1,
    user_id: 1,
    position: "left",
    cycle: 1,
    children: [
      {
        id: 2,
        user_id: 2,
        position: "left",
        cycle: 1,
        children: [
          {
            id: 4,
            user_id: 4,
            position: "left",
            cycle: 1,
            children: [
              {
                id: 8,
                user_id: 8,
                position: "left",
                cycle: 2,
                children: []
              },
              {
                id: 9,
                user_id: 9,
                position: "right",
                cycle: 2,
                children: []
              }
            ]
          },
          {
            id: 5,
            user_id: 5,
            position: "right",
            cycle: 1,
            children: [
              {
                id: 10,
                user_id: 10,
                position: "left",
                cycle: 2,
                children: []
              }
            ]
          }
        ]
      },
      {
        id: 3,
        user_id: 3,
        position: "right",
        cycle: 1,
        children: [
          {
            id: 6,
            user_id: 6,
            position: "left",
            cycle: 2,
            children: []
          },
          {
            id: 7,
            user_id: 7,
            position: "right",
            cycle: 2,
            children: []
          }
        ]
      }
    ]
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Test Tree View</h1>
        <p className="text-gray-600 mt-2">
          Testing the GenealogyTreeView component with sample data
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sample Genealogy Tree</CardTitle>
          <CardDescription>
            This is a test tree with 10 nodes showing the first 3 levels expanded
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GenealogyTreeView root={sampleTree} />
        </CardContent>
      </Card>
    </div>
  )
} 