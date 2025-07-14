import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronRight, User } from 'lucide-react'

export interface TreeNode {
  id: number
  user_id: number
  position: string
  cycle: number
  children: TreeNode[]
}

interface GenealogyTreeViewProps {
  root: TreeNode | null
}

function Node({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 3) // Show first 3 levels by default
  const hasChildren = node.children && node.children.length > 0

  return (
    <div className="flex flex-col items-center" style={{ marginLeft: depth === 0 ? 0 : 32 }}>
      <div className="flex items-center gap-2">
        {hasChildren && (
          <button
            className="focus:outline-none"
            onClick={() => setExpanded((e) => !e)}
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        )}
        <Card className="min-w-[120px] flex flex-col items-center p-2">
          <User className="w-5 h-5 mb-1 text-primary" />
          <div className="text-xs font-semibold">User {node.user_id}</div>
          <Badge variant="outline" className="mt-1 mb-1">{node.position}</Badge>
          <div className="text-[10px] text-muted-foreground">Cycle {node.cycle}</div>
        </Card>
      </div>
      {hasChildren && expanded && (
        <div className="flex mt-2 gap-8">
          {node.children.map((child) => (
            <div key={child.id} className="flex flex-col items-center">
              {/* Draw a vertical line from parent to child */}
              <div className="w-0.5 h-4 bg-gray-300 mx-auto" />
              <Node node={child} depth={depth + 1} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function GenealogyTreeView({ root }: GenealogyTreeViewProps) {
  if (!root) {
    return <div className="text-center text-gray-400">No tree data available.</div>
  }
  return (
    <div className="overflow-auto p-4">
      <Node node={root} />
    </div>
  )
}

export default GenealogyTreeView 