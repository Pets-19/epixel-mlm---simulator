'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Trash2, Plus, Package, CreditCard, Monitor } from 'lucide-react'
import { BusinessProduct } from '@/lib/business-plan'

interface BusinessProductStepProps {
  businessName: string
  products: BusinessProduct[]
  onConfigChange: (businessName: string, products: BusinessProduct[]) => void
}

export default function BusinessProductStep({ 
  businessName, 
  products, 
  onConfigChange 
}: BusinessProductStepProps) {
  const [localBusinessName, setLocalBusinessName] = useState(businessName)
  const [localProducts, setLocalProducts] = useState<BusinessProduct[]>(products)

  useEffect(() => {
    setLocalBusinessName(businessName)
    setLocalProducts(products)
  }, [businessName, products])

  useEffect(() => {
    onConfigChange(localBusinessName, localProducts)
  }, [localBusinessName, localProducts, onConfigChange])

  const addProduct = () => {
    const newProduct: BusinessProduct = {
      product_name: '',
      product_price: 0,
      business_volume: 0,
      product_sales_ratio: 0,
      product_type: 'retail'
    }
    setLocalProducts([...localProducts, newProduct])
  }

  const removeProduct = (index: number) => {
    const updatedProducts = localProducts.filter((_, i) => i !== index)
    setLocalProducts(updatedProducts)
  }

  const updateProduct = (index: number, field: keyof BusinessProduct, value: any) => {
    const updatedProducts = [...localProducts]
    updatedProducts[index] = {
      ...updatedProducts[index],
      [field]: value
    }
    setLocalProducts(updatedProducts)
  }

  const getProductTypeIcon = (type: string) => {
    switch (type) {
      case 'membership':
        return <CreditCard className="w-4 h-4" />
      case 'retail':
        return <Package className="w-4 h-4" />
      case 'digital':
        return <Monitor className="w-4 h-4" />
      default:
        return <Package className="w-4 h-4" />
    }
  }

  const getProductTypeColor = (type: string) => {
    switch (type) {
      case 'membership':
        return 'bg-blue-100 text-blue-800'
      case 'retail':
        return 'bg-green-100 text-green-800'
      case 'digital':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const validateProducts = () => {
    if (!localBusinessName.trim()) return false
    if (localProducts.length === 0) return false
    
    return localProducts.every(product => 
      product.product_name.trim() && 
      product.product_price > 0 && 
      product.business_volume >= 0 &&
      product.product_sales_ratio >= 0 && product.product_sales_ratio <= 100
    )
  }

  return (
    <div className="space-y-6">
      {/* Business Plan Name */}
      <div>
        <Label htmlFor="business-name" className="text-base font-medium">
          Business Plan Name *
        </Label>
        <Input
          id="business-name"
          value={localBusinessName}
          onChange={(e) => setLocalBusinessName(e.target.value)}
          placeholder="Enter business plan name"
          className="mt-2"
        />
      </div>

      {/* Products Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <Label className="text-base font-medium">Products Configuration</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addProduct}
            className="flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>

        {localProducts.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No products configured yet</p>
              <Button
                type="button"
                variant="outline"
                onClick={addProduct}
                className="flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Product
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {localProducts.map((product, index) => (
              <Card key={index} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Product {index + 1}</CardTitle>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProduct(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`product-name-${index}`}>Product Name *</Label>
                      <Input
                        id={`product-name-${index}`}
                        value={product.product_name}
                        onChange={(e) => updateProduct(index, 'product_name', e.target.value)}
                        placeholder="Enter product name"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`product-type-${index}`}>Product Type *</Label>
                      <Select
                        value={product.product_type}
                        onValueChange={(value) => updateProduct(index, 'product_type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="membership">
                            <div className="flex items-center">
                              <CreditCard className="w-4 h-4 mr-2" />
                              Membership
                            </div>
                          </SelectItem>
                          <SelectItem value="retail">
                            <div className="flex items-center">
                              <Package className="w-4 h-4 mr-2" />
                              Retail
                            </div>
                          </SelectItem>
                          <SelectItem value="digital">
                            <div className="flex items-center">
                              <Monitor className="w-4 h-4 mr-2" />
                              Digital
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor={`product-price-${index}`}>Product Price ($) *</Label>
                      <Input
                        id={`product-price-${index}`}
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={product.product_price || ''}
                        onChange={(e) => updateProduct(index, 'product_price', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                      />
                    </div>
                                         <div>
                       <Label htmlFor={`business-volume-${index}`}>Business Volume ($) *</Label>
                       <Input
                         id={`business-volume-${index}`}
                         type="number"
                         min="0"
                         step="0.01"
                         value={product.business_volume || ''}
                         onChange={(e) => updateProduct(index, 'business_volume', parseFloat(e.target.value) || 0)}
                         placeholder="0.00"
                       />
                     </div>
                     <div>
                       <Label htmlFor={`product-sales-ratio-${index}`}>Product Sales Ratio (%) *</Label>
                       <Input
                         id={`product-sales-ratio-${index}`}
                         type="number"
                         min="0"
                         max="100"
                         step="0.01"
                         value={product.product_sales_ratio || ''}
                         onChange={(e) => updateProduct(index, 'product_sales_ratio', parseFloat(e.target.value) || 0)}
                         placeholder="0.00"
                       />
                     </div>
                   </div>

                  {/* Product Type Description */}
                  <div className="p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center space-x-2 mb-2">
                      {getProductTypeIcon(product.product_type)}
                      <Badge className={getProductTypeColor(product.product_type)}>
                        {product.product_type.charAt(0).toUpperCase() + product.product_type.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {product.product_type === 'membership' && 
                        'Recurring subscription products with ongoing value'}
                      {product.product_type === 'retail' && 
                        'Physical or one-time purchase products'}
                      {product.product_type === 'digital' && 
                        'Digital downloads or online services'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      {localProducts.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-blue-800">Products Summary</p>
                <p className="text-sm text-blue-600">
                  {localProducts.length} product{localProducts.length !== 1 ? 's' : ''} configured
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-600">Total Value</p>
                <p className="font-medium text-blue-800">
                  ${localProducts.reduce((sum, p) => sum + (p.product_price || 0), 0).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Status */}
      {!validateProducts() && localProducts.length > 0 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            Please complete all required fields for each product to proceed.
          </p>
        </div>
      )}
    </div>
  )
} 