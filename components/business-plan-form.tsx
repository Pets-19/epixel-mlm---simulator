'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BusinessPlanSimulation, BusinessProduct } from '@/lib/business-plan'

interface BusinessPlanFormProps {
  initialData?: BusinessPlanSimulation
  onSubmit: () => void
  mode: 'create' | 'edit'
}

export default function BusinessPlanForm({ initialData, onSubmit, mode }: BusinessPlanFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [businessUsers, setBusinessUsers] = useState<{ id: number; name: string; email: string; role: string }[]>([])

  // Form state
  const [formData, setFormData] = useState({
    user_id: initialData?.user_id || 0,
    business_name: initialData?.business_name || '',
    status: initialData?.status || 'draft',
    products: initialData?.products || []
  })

  useEffect(() => {
    fetchBusinessUsers()
  }, [])

  const fetchBusinessUsers = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/users/business-users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setBusinessUsers(data)
      }
    } catch (err) {
      console.error('Failed to fetch business users:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('auth_token')
      const url = mode === 'edit' 
        ? `/api/business-plan/simulations/${initialData?.id}`
        : '/api/business-plan/simulations'

      const method = mode === 'edit' ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save business plan')
      }

      onSubmit()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const addProduct = () => {
    const newProduct: BusinessProduct = {
      product_name: '',
      product_price: 0,
      business_volume: 0,
      product_sales_ratio: 0,
      product_type: 'membership'
    }

    setFormData(prev => ({
      ...prev,
      products: [...prev.products, newProduct]
    }))
  }

  const removeProduct = (index: number) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }))
  }

  const updateProduct = (index: number, field: keyof BusinessProduct, value: any) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.map((product, i) => 
        i === index ? { ...product, [field]: value } : product
      )
    }))
  }

  const validateForm = () => {
    if (!formData.user_id) return 'Please select a business user'
    if (!formData.business_name.trim()) return 'Business name is required'
    if (formData.products.length === 0) return 'At least one product is required'
    
    for (let i = 0; i < formData.products.length; i++) {
      const product = formData.products[i]
      if (!product.product_name.trim()) return `Product ${i + 1}: Name is required`
      if (product.product_price <= 0) return `Product ${i + 1}: Price must be greater than 0`
      if (product.business_volume < 0) return `Product ${i + 1}: Business volume cannot be negative`
      if (product.product_sales_ratio < 0 || product.product_sales_ratio > 100) {
        return `Product ${i + 1}: Sales ratio must be between 0 and 100`
      }
    }
    
    return null
  }

  const validationError = validateForm()

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <p className="text-red-600">{error}</p>
        </Card>
      )}

      {/* Business User Selection */}
      <div className="space-y-2">
        <Label htmlFor="user_id">Business User *</Label>
        <Select
          value={formData.user_id.toString()}
          onValueChange={(value) => setFormData(prev => ({ ...prev, user_id: parseInt(value) }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a business user" />
          </SelectTrigger>
          <SelectContent>
            {businessUsers.map((user) => (
              <SelectItem key={user.id} value={user.id.toString()}>
                {user.name} ({user.email})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Business Name */}
      <div className="space-y-2">
        <Label htmlFor="business_name">Business Plan Name *</Label>
        <Input
          id="business_name"
          value={formData.business_name}
          onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
          placeholder="Enter business plan name"
        />
      </div>

      {/* Status (only for edit mode) */}
      {mode === 'edit' && (
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Products Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label>Products *</Label>
          <Button type="button" variant="outline" size="sm" onClick={addProduct}>
            Add Product
          </Button>
        </div>

        {formData.products.length === 0 ? (
          <Card className="p-4 text-center text-gray-500">
            No products added. Click "Add Product" to get started.
          </Card>
        ) : (
          <div className="space-y-4">
            {formData.products.map((product, index) => (
              <Card key={index} className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-medium">Product {index + 1}</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeProduct(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Product Name */}
                  <div className="space-y-2">
                    <Label>Product Name *</Label>
                    <Input
                      value={product.product_name}
                      onChange={(e) => updateProduct(index, 'product_name', e.target.value)}
                      placeholder="Enter product name"
                    />
                  </div>

                  {/* Product Type */}
                  <div className="space-y-2">
                    <Label>Product Type *</Label>
                    <Select
                      value={product.product_type}
                      onValueChange={(value) => updateProduct(index, 'product_type', value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="membership">Membership</SelectItem>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="digital">Digital</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Product Price */}
                  <div className="space-y-2">
                    <Label>Product Price ($) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={product.product_price}
                      onChange={(e) => updateProduct(index, 'product_price', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>

                  {/* Business Volume */}
                  <div className="space-y-2">
                    <Label>Business Volume ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={product.business_volume}
                      onChange={(e) => updateProduct(index, 'business_volume', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>

                  {/* Sales Ratio */}
                  <div className="space-y-2">
                    <Label>Sales Ratio (%) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={product.product_sales_ratio}
                      onChange={(e) => updateProduct(index, 'product_sales_ratio', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button
          type="submit"
          disabled={loading || !!validationError}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loading ? 'Saving...' : mode === 'edit' ? 'Update Business Plan' : 'Create Business Plan'}
        </Button>
      </div>

      {validationError && (
        <p className="text-red-600 text-sm">{validationError}</p>
      )}
    </form>
  )
} 