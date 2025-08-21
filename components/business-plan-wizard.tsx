'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Circle, ArrowLeft, ArrowRight } from 'lucide-react'
import UserSelectionStep from './user-selection-step'
import BusinessProductStep from './business-product-step'
import SimulationConfigStep from './simulation-config-step'
import CommissionStep, { CommissionConfig } from './commission-step'
import ReviewStep from './review-step'
import { BusinessProduct, BusinessPlanCreate, SimulationConfig } from '@/lib/business-plan'

interface User {
  id: number
  name: string
  email: string
  role: string
}



export default function BusinessPlanWizard() {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [businessName, setBusinessName] = useState('')
  const [products, setProducts] = useState<BusinessProduct[]>([])
  const [simulationConfig, setSimulationConfig] = useState<SimulationConfig | null>({
    genealogy_type: 'binary',
    max_expected_users: 100,
    payout_cycle: 'weekly',
    number_of_payout_cycles: 2,
    max_children_count: 2
  })
  const [commissionConfig, setCommissionConfig] = useState<CommissionConfig | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  if (!user || (user.role !== 'admin' && user.role !== 'system_admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You need admin privileges to create business plans.</p>
        </div>
      </div>
    )
  }

  const steps = [
    { id: 1, title: 'User Account', description: 'Select or create business user' },
    { id: 2, title: 'Business & Products', description: 'Configure business and products' },
    { id: 3, title: 'Simulation Setup', description: 'Configure genealogy simulation' },
    { id: 4, title: 'Create Business Plan', description: 'Configure commission structure' },
    { id: 5, title: 'Review & Create', description: 'Review and create business plan' }
  ]

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1)
      setError(null)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setError(null)
    }
  }

  const handleUserSelected = (user: User) => {
    setSelectedUser(user)
  }

  const handleBusinessConfig = (name: string, productList: BusinessProduct[]) => {
    setBusinessName(name)
    setProducts(productList)
  }

  const handleSimulationConfig = (config: SimulationConfig) => {
    setSimulationConfig(config)
  }

  const handleCommissionConfig = (config: CommissionConfig) => {
    setCommissionConfig(config)
  }

  const handleSimulationComplete = (simulationResult: any) => {
    // Store the simulation result for use in business plan creation
    setSimulationConfig(prev => ({
      ...prev!,
      simulation_result: simulationResult
    }))
  }

  const handleCreateBusinessPlan = async () => {
    if (!selectedUser || !businessName || products.length === 0 || !simulationConfig || !commissionConfig) {
      setError('Please complete all steps before creating the business plan')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const token = localStorage.getItem('auth_token')
      const businessPlanData: BusinessPlanCreate = {
        user_id: selectedUser.id,
        business_name: businessName,
        products: products,
        genealogy_simulation_id: undefined, // Will be set after simulation is created
        commission_config: commissionConfig
      }

      const response = await fetch('/api/business-plan/simulations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(businessPlanData)
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Business plan created successfully!')
        // Reset form
        setSelectedUser(null)
        setBusinessName('')
        setProducts([])
        setSimulationConfig(null)
        setCommissionConfig(null)
        setCurrentStep(1)
      } else {
        setError(data.error || 'Failed to create business plan')
        if (data.details && Array.isArray(data.details)) {
          setError(data.details.join(', '))
        }
      }
    } catch (err) {
      setError('An error occurred while creating the business plan')
    } finally {
      setLoading(false)
    }
  }

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return selectedUser !== null
      case 2:
        return businessName.trim().length > 0 && products.length > 0
      case 3:
        return simulationConfig !== null
      case 4:
        return commissionConfig !== null
      case 5:
        return true
      default:
        return false
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <UserSelectionStep
            selectedUser={selectedUser}
            onUserSelected={handleUserSelected}
          />
        )
      case 2:
        return (
          <BusinessProductStep
            businessName={businessName}
            products={products}
            onConfigChange={handleBusinessConfig}
          />
        )
              case 3:
          return (
            <SimulationConfigStep
              config={simulationConfig}
              products={products}
              onConfigChange={handleSimulationConfig}
              onSimulationComplete={handleSimulationComplete}
            />
          )
      case 4:
        return (
          <CommissionStep
            config={commissionConfig}
            onConfigChange={handleCommissionConfig}
          />
        )
      case 5:
        return (
          <ReviewStep
            selectedUser={selectedUser}
            businessName={businessName}
            products={products}
            simulationConfig={simulationConfig}
            commissionConfig={commissionConfig}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Business Plan Simulation Wizard</h1>
            <p className="mt-2 text-gray-600">
              Create a business plan simulation for a business user with products and genealogy configuration.
            </p>
          </div>

          {/* Progress Steps */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        currentStep >= step.id 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {currentStep > step.id ? (
                          <CheckCircle className="w-6 h-6" />
                        ) : (
                          <span className="text-sm font-medium">{step.id}</span>
                        )}
                      </div>
                      <div className="mt-2 text-center">
                        <p className={`text-sm font-medium ${
                          currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'
                        }`}>
                          {step.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {step.description}
                        </p>
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-4 ${
                        currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Current Step Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Badge variant="outline" className="mr-2">Step {currentStep}</Badge>
                {steps[currentStep - 1].title}
              </CardTitle>
              <CardDescription>
                {steps[currentStep - 1].description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              
              {success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-600">{success}</p>
                </div>
              )}

              {renderStep()}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                  className="flex items-center"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>

                {currentStep < 4 ? (
                  <Button
                    onClick={handleNext}
                    disabled={!canProceedToNext()}
                    className="flex items-center"
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleCreateBusinessPlan}
                    disabled={loading || !canProceedToNext()}
                    className="flex items-center"
                  >
                    {loading ? 'Creating...' : 'Create Business Plan'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 