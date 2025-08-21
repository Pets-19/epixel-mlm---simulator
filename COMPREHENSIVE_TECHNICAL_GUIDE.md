# MLM Tools - Comprehensive Technical & Implementation Guide

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [Database Schema & Migrations](#database-schema--migrations)
4. [API Reference & Patterns](#api-reference--patterns)
5. [Component Architecture](#component-architecture)
6. [Business Logic & Workflows](#business-logic--workflows)
7. [Development Standards](#development-standards)
8. [Feature Implementation Guide](#feature-implementation-guide)
9. [Testing & Quality Assurance](#testing--quality-assurance)
10. [Deployment & Infrastructure](#deployment--infrastructure)
11. [Troubleshooting & Maintenance](#troubleshooting--maintenance)

---

## System Overview

### Project Description
MLM Tools is a comprehensive Multi-Level Marketing management platform built with Next.js, Go, and PostgreSQL. The system provides genealogy simulation, business plan management, user administration, and role-based access control.

### Core Features
- **Authentication & User Management**: JWT-based auth with role-based access
- **Genealogy Simulation**: Multiple plan types (Matrix, Unilevel, Binary) with Go backend
- **Business Plan Wizard**: Multi-step wizard for creating business plans
- **Product Management**: Configurable products with pricing and sales ratios
- **User Administration**: Complete user lifecycle management

### System Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js App   │    │  Go Simulator    │    │   PostgreSQL    │
│   (Frontend)    │◄──►│   (Backend)      │◄──►│   (Database)    │
│   Port: 3000    │    │   Port: 8080     │    │   Port: 5432    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

---

## Architecture & Technology Stack

### Frontend (Next.js 14)
- **Framework**: Next.js 14.2.30 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI based)
- **State Management**: React hooks and context
- **Authentication**: Custom auth provider with JWT

### Backend (Go)
- **Language**: Go 1.21
- **Framework**: Standard library with custom handlers
- **Concurrency**: Native Go goroutines and channels
- **Error Handling**: Idiomatic Go error patterns

### Database
- **Engine**: PostgreSQL (latest stable)
- **Schema**: Strongly typed with constraints
- **Migrations**: SQL-based migration files
- **Connection Pooling**: Built-in connection management

### Infrastructure
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose
- **Networking**: Custom Docker network
- **Environment**: Alpine Linux for minimal images

---

## Database Schema & Migrations

### Core Tables

#### users
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'admin', 'system_admin', 'business_user')),
    whatsapp_number VARCHAR(20) UNIQUE,
    organization VARCHAR(255),
    country VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    organization_name VARCHAR(255)
);
```

**Current Users (Migration v4.2):**
- **System Admin** (ID: 1): admin@epixelmlm.com - Full system access
- **Business User** (ID: 2): business@epixel.com - Business plan management

#### genealogy_types
```sql
CREATE TABLE genealogy_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Current Genealogy Types (Migration v4.2):**
- **Matrix** (ID: 1): Matrix plan with fixed width and depth
- **Unilevel** (ID: 2): Unilevel plan with unlimited width and depth  
- **Binary** (ID: 3): Binary plan with two legs

#### genealogy_simulations
```sql
CREATE TABLE genealogy_simulations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    genealogy_type_id INTEGER REFERENCES genealogy_types(id),
    simulation_data JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### business_plan_simulations
```sql
CREATE TABLE business_plan_simulations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    user_id INTEGER REFERENCES users(id),
    created_by INTEGER REFERENCES users(id),
    genealogy_simulation_id INTEGER REFERENCES genealogy_simulations(id),
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### business_products
```sql
CREATE TABLE business_products (
    id SERIAL PRIMARY KEY,
    business_plan_id INTEGER REFERENCES business_plan_simulations(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    product_type VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    product_sales_ratio INTEGER DEFAULT 100 CHECK (product_sales_ratio >= 0 AND product_sales_ratio <= 100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Current Sample Products (Migration v4.2):**
- **Premium Package** (starter): $99.99 - 80% sales ratio
- **Professional Package** (premium): $199.99 - 60% sales ratio  
- **Enterprise Package** (enterprise): $499.99 - 40% sales ratio

### Performance Indexes
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_genealogy_simulations_user_id ON genealogy_simulations(user_id);
CREATE INDEX idx_business_plan_simulations_user_id ON business_plan_simulations(user_id);
CREATE INDEX idx_business_products_plan_id ON business_products(business_plan_id);
```

### Migration Strategy
1. **SQL Files**: Each migration in separate SQL file
2. **Versioning**: Migrations run in order by filename
3. **Rollback**: Manual rollback process
4. **Testing**: Migrations tested in development first

### Current Migration Status (v4.2)
✅ **Database Schema**: Fully migrated and operational
✅ **Genealogy Types**: 3 types available (Matrix, Unilevel, Binary)
✅ **User Management**: System admin and business user accounts created
✅ **Business Plans**: Sample business plan with products available
✅ **Authentication**: JWT-based auth working with proper user roles

**Migration File**: `database/complete_migration.sql`
**Last Applied**: 2025-08-19
**Status**: All tables, constraints, indexes, and sample data successfully applied

---

## API Reference & Patterns

### Base Configuration
- **Base URL**: `http://localhost:3000/api`
- **Content Type**: `application/json`
- **Authentication**: JWT token in Authorization header

### Authentication Endpoints
```
POST   /api/auth/login              - User login
POST   /api/auth/create-user        - Create new user (Admin only)
GET    /api/auth/me                 - Get current user
POST   /api/auth/change-password    - Change password
GET    /api/auth/profile            - Get user profile
```

### User Management Endpoints
```
GET    /api/users                    - Get all users (Admin only)
GET    /api/users/:id                - Get specific user
PUT    /api/users/:id                - Update user
DELETE /api/users/:id                - Delete user
POST   /api/users/:id/reset-password - Reset user password
GET    /api/users/business-users     - Get business users
```

### Genealogy Endpoints
```
GET    /api/genealogy-types         - Get genealogy types
POST   /api/genealogy/simulate      - Create simulation
POST   /api/genealogy/save-simulation - Save simulation
```

**Genealogy Types Available** (via `/api/genealogy-types`):
- **Matrix Plan**: Fixed width and depth structure
- **Unilevel Plan**: Unlimited width and depth structure  
- **Binary Plan**: Two-legged structure

**Current Status**: All 3 genealogy types are active and available for simulation

### Business Plan Endpoints
```
GET    /api/business-plan/simulations     - Get business plans
POST   /api/business-plan/simulations     - Create business plan (Admin only)
GET    /api/business-plan/simulations/:id - Get specific plan
PUT    /api/business-plan/simulations/:id - Update business plan
DELETE /api/business-plan/simulations/:id - Delete business plan
```

### Go Simulator Endpoints
```
POST   /simulate                     - Run genealogy simulation
GET    /health                       - Health check
```

### Standard Response Format
```typescript
// Success Response
{
  "success": true,
  "data": { /* response data */ }
}

// Error Response
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Error Codes
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `VALIDATION_ERROR`: Invalid input data
- `NOT_FOUND`: Resource not found
- `INTERNAL_ERROR`: Server error

---

## Component Architecture

### Core Components

#### Authentication
- `AuthProvider`: Context provider for authentication state
- `LoginPage`: User login form
- `ProtectedRoute`: Route wrapper for authentication

#### Dashboard
- `Dashboard`: Main dashboard with navigation
- `Header`: Application header with user info
- `LoadingSpinner`: Loading state component

#### Business Plan Wizard
- `BusinessPlanWizard`: Main wizard container
- `UserSelectionStep`: Step 1 - User selection/creation
- `BusinessProductStep`: Step 2 - Business & product configuration
- `SimulationConfigStep`: Step 3 - Simulation configuration
- `ReviewStep`: Step 4 - Review and confirmation

#### Genealogy
- `GenealogyTreeView`: Tree visualization component
- `GenealogySimulation`: Simulation interface

### UI Components (shadcn/ui)
- `Button`: Standard button component
- `Input`: Form input component
- `Select`: Dropdown selection component
- `Card`: Content container component
- `Dialog`: Modal dialog component
- `Table`: Data table component
- `Badge`: Status indicator component
- `RadioGroup`: Radio button group component
- `Separator`: Visual separator component

### Component Patterns

#### Form Component Pattern
```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface FormComponentProps {
  onSubmit: (data: any) => void
  loading?: boolean
  initialData?: any
}

export default function FormComponent({ onSubmit, loading, initialData }: FormComponentProps) {
  const [data, setData] = useState(initialData || {})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit}>
      <Input
        placeholder="Field name"
        value={data.field || ''}
        onChange={(e) => setData({ ...data, field: e.target.value })}
        required
      />
      <Button type="submit" disabled={loading}>
        {loading ? 'Processing...' : 'Submit'}
      </Button>
    </form>
  )
}
```

#### API Integration Pattern
```typescript
const handleSubmit = async (data: any) => {
  try {
    const response = await fetch('/api/endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      throw new Error('API request failed')
    }
    
    const result = await response.json()
    if (result.success) {
      // Handle success
    } else {
      // Handle error
    }
  } catch (error) {
    // Handle exception
  }
}
```

---

## Business Logic & Workflows

### Authentication Flow
1. User submits login credentials
2. Server validates credentials against database
3. JWT token generated and returned
4. Token stored in client-side storage
5. Token included in subsequent API requests
6. Server validates token on protected routes

### User Roles & Permissions
- **admin**: Full system access, can manage users and business plans
- **user**: Standard user access, can create simulations
- **business_user**: Business user access, can be assigned to business plans

### Genealogy Simulation Workflow
1. **Type Selection**: User selects genealogy type (Matrix, Unilevel, etc.)
2. **Configuration**: User configures simulation parameters
3. **Processing**: Go service processes simulation
4. **Results**: Results displayed in tree view
5. **Storage**: Simulation can be saved to database

### Business Plan Creation Workflow
1. **User Selection**: Admin selects or creates business user
2. **Business Configuration**: Define business plan name and products
3. **Product Setup**: Configure products with pricing, volume, and sales ratio
4. **Simulation Link**: Link to genealogy simulation
5. **Review & Create**: Review all inputs and create plan

### Product Management
- **Product Types**: membership, retail, digital
- **Pricing**: Product price and business volume
- **Sales Ratio**: Product purchase rate (0-100%)
- **Validation**: Client and server-side validation

---

## Development Standards

### Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **Git Hooks**: Pre-commit validation

### Naming Conventions
- **Files**: kebab-case (e.g., `business-plan.ts`)
- **Components**: PascalCase (e.g., `BusinessPlanWizard`)
- **Functions**: camelCase (e.g., `createBusinessPlan`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_ATTEMPTS`)
- **Database**: snake_case (e.g., `business_plan_simulations`)

### Component Guidelines
- **Functional Components**: Use functional components with hooks
- **TypeScript**: Full type safety for all components
- **Props Interface**: Define interfaces for all component props
- **Error Boundaries**: Implement error boundaries for critical components

### API Guidelines
- **RESTful**: Follow REST conventions
- **Validation**: Input validation on all endpoints
- **Error Handling**: Consistent error response format
- **Authentication**: JWT token validation

### Database Guidelines
- **Constraints**: Use database constraints for data integrity
- **Indexes**: Create indexes for performance
- **Migrations**: Version control all schema changes
- **Backup**: Regular database backups

### Security Considerations
- **Input Validation**: Validate all user inputs
- **SQL Injection**: Use parameterized queries
- **XSS Protection**: Sanitize user-generated content
- **Authentication**: Secure JWT implementation
- **Authorization**: Role-based access control

---

## Feature Implementation Guide

### Step-by-Step Feature Development

#### 1. Planning Phase
1. **Define Requirements**: Create detailed user stories
2. **Technical Design**: Plan database schema, API endpoints, UI components
3. **Review**: Get approval from team lead
4. **Estimation**: Estimate development time

#### 2. Database Changes
1. **Create Migration File**:
```sql
-- database/migration_add_feature.sql
CREATE TABLE new_feature (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_new_feature_name ON new_feature(name);
```

2. **Apply Migration**:
```bash
docker compose exec postgres psql -U postgres -d epixel_mlm_tools -f /docker-entrypoint-initdb.d/migration_add_feature.sql
```

#### 3. API Development
1. **Create API Route**:
```typescript
// app/api/feature/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { validateRequest } from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const validation = validateRequest(data)
    
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.errors },
        { status: 400 }
      )
    }
    
    const result = await processFeature(data)
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

2. **Add TypeScript Interface**:
```typescript
// lib/feature.ts
export interface FeatureRequest {
  name: string
  description?: string
  config: Record<string, any>
}

export interface FeatureResponse {
  id: number
  name: string
  created_at: string
}
```

#### 4. Frontend Development
1. **Create Component**:
```typescript
// components/feature-component.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface FeatureComponentProps {
  onSubmit: (data: any) => void
  loading?: boolean
}

export default function FeatureComponent({ onSubmit, loading }: FeatureComponentProps) {
  const [data, setData] = useState({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit}>
      <Input
        placeholder="Feature name"
        onChange={(e) => setData({ ...data, name: e.target.value })}
      />
      <Button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Feature'}
      </Button>
    </form>
  )
}
```

2. **Add to Page**:
```typescript
// app/feature/page.tsx
import FeatureComponent from '@/components/feature-component'

export default function FeaturePage() {
  const handleSubmit = async (data: any) => {
    const response = await fetch('/api/feature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    
    if (response.ok) {
      // Handle success
    }
  }

  return (
    <div>
      <h1>Feature Management</h1>
      <FeatureComponent onSubmit={handleSubmit} />
    </div>
  )
}
```

#### 5. Integration & Testing
1. **Connect Frontend to API**
2. **Test Complete User Flows**
3. **Verify Error Scenarios**
4. **Performance Testing**
5. **Security Review**

### Feature Development Checklist

#### Database Changes
- [ ] Create migration file
- [ ] Add proper constraints
- [ ] Create indexes for performance
- [ ] Test migration rollback
- [ ] Update schema documentation

#### API Development
- [ ] Define TypeScript interfaces
- [ ] Implement endpoint with validation
- [ ] Add proper error handling
- [ ] Write unit tests
- [ ] Update API documentation

#### Frontend Development
- [ ] Create React components
- [ ] Implement form validation
- [ ] Add error handling
- [ ] Write component tests
- [ ] Update UI documentation

#### Integration
- [ ] Connect frontend to API
- [ ] Test complete user flows
- [ ] Verify error scenarios
- [ ] Performance testing
- [ ] Security review

---

## Testing & Quality Assurance

### Testing Strategy
- **Unit Tests**: Component and function testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Full user flow testing
- **Database Tests**: Schema and migration testing

### Unit Testing
```typescript
// Example component test
import { render, screen } from '@testing-library/react'
import BusinessPlanWizard from '@/components/business-plan-wizard'

describe('BusinessPlanWizard', () => {
  it('should render all steps', () => {
    render(<BusinessPlanWizard />)
    expect(screen.getByText('User Selection')).toBeInTheDocument()
    expect(screen.getByText('Business & Products')).toBeInTheDocument()
  })
})
```

### API Testing
```typescript
// Example API test
describe('POST /api/business-plan/simulations', () => {
  it('should create business plan with valid data', async () => {
    const response = await request(app)
      .post('/api/business-plan/simulations')
      .send({
        user_id: 1,
        business_name: 'Test Plan',
        products: []
      })
    
    expect(response.status).toBe(201)
    expect(response.body.success).toBe(true)
  })
})
```

### Testing Best Practices
- Write tests before implementation (TDD)
- Test both success and failure scenarios
- Mock external dependencies
- Use descriptive test names
- Maintain test data fixtures

---

## Deployment & Infrastructure

### Docker Configuration
```yaml
# docker-compose.yml
services:
  app:
    build: .
    ports: ["3000:3000"]
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/epixel_mlm_tools
    depends_on: [postgres]
  
  genealogy-simulator:
    build: ./genealogy-simulator
    ports: ["8080:8080"]
  
  postgres:
    image: postgres:latest
    environment:
      - POSTGRES_DB=epixel_mlm_tools
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - ./database:/docker-entrypoint-initdb.d
```

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/epixel_mlm_tools

# JWT
JWT_SECRET=your-secret-key

# Go Simulator
SIMULATOR_URL=http://localhost:8080
```

### Deployment Commands
```bash
# Development
docker compose up -d

# Production
docker compose -f docker-compose.prod.yml up -d

# Apply migrations
docker compose exec postgres psql -U postgres -d epixel_mlm_tools -f /docker-entrypoint-initdb.d/migration.sql
```

### Performance Optimization
- **Database**: Optimize queries with proper indexes
- **Frontend**: Code splitting and lazy loading
- **Caching**: Implement appropriate caching strategies
- **CDN**: Use CDN for static assets

---

## Troubleshooting & Maintenance

### Current System Status (v4.2)
✅ **Frontend**: Next.js app running on port 3000
✅ **Backend**: Go genealogy simulator running on port 8080
✅ **Database**: PostgreSQL running on port 5432 with full schema
✅ **Authentication**: JWT-based auth working with admin login
✅ **Genealogy Types**: 3 types available and accessible
✅ **Business Plans**: CRUD operations functional
✅ **User Management**: Role-based access control working

**Default Login Credentials**:
- **System Admin**: admin@epixelmlm.com / admin123
- **Business User**: business@epixel.com / password123

### Common Issues

#### Database Connection Issues
```bash
# Check database status
docker compose ps postgres

# Check database logs
docker compose logs postgres

# Test connection
docker compose exec postgres psql -U postgres -d epixel_mlm_tools -c "SELECT 1"
```

#### Frontend Build Issues
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
docker compose build --no-cache app
```

#### API Endpoint Issues
```bash
# Check API logs
docker compose logs app

# Test endpoint directly
curl -X POST http://localhost:3000/api/endpoint \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### Performance Monitoring
```sql
-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Debugging
```typescript
// Frontend debugging
console.log('Debug data:', data)

// Use React DevTools
// Install React Developer Tools browser extension
```

```go
// Backend debugging
log.Printf("Debug: %+v", data)

// Check Go logs
docker compose logs genealogy-simulator
```

### Maintenance Tasks
- **Database Backups**: Regular automated backups
- **Log Rotation**: Implement log rotation for all services
- **Security Updates**: Keep dependencies updated
- **Performance Monitoring**: Monitor application performance
- **Error Tracking**: Implement error tracking and alerting

---

## Reusable Patterns & Templates

### API Route Template
```typescript
// app/api/[feature]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { validateRequest } from '@/lib/validation'
import { authenticateUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Authentication
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Authorization
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Business logic
    const data = await getFeatureData()
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Validation
    const data = await request.json()
    const validation = validateRequest(data)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.errors },
        { status: 400 }
      )
    }

    // Business logic
    const result = await createFeature(data, user.id)
    
    return NextResponse.json({ success: true, data: result }, { status: 201 })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Component Template
```typescript
// components/[feature]-component.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/loading-spinner'

interface FeatureComponentProps {
  onSubmit: (data: any) => void
  loading?: boolean
  initialData?: any
  mode?: 'create' | 'edit' | 'view'
}

export default function FeatureComponent({ 
  onSubmit, 
  loading = false, 
  initialData, 
  mode = 'create' 
}: FeatureComponentProps) {
  const [data, setData] = useState(initialData || {})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    const validationErrors = validateData(data)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    
    setErrors({})
    onSubmit(data)
  }

  const validateData = (formData: any) => {
    const errors: Record<string, string> = {}
    
    if (!formData.name?.trim()) {
      errors.name = 'Name is required'
    }
    
    return errors
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Name
          </label>
          <Input
            id="name"
            value={data.name || ''}
            onChange={(e) => setData({ ...data, name: e.target.value })}
            error={errors.name}
            disabled={mode === 'view'}
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button type="submit" disabled={loading || mode === 'view'}>
            {loading ? 'Processing...' : mode === 'edit' ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
```

### Database Migration Template
```sql
-- database/migration_[feature_name].sql
-- Migration: [Brief description]
-- Date: YYYY-MM-DD
-- Description: [Detailed description]

-- Create new table
CREATE TABLE [table_name] (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_[table_name]_name ON [table_name](name);
CREATE INDEX idx_[table_name]_active ON [table_name](is_active);

-- Add constraints
ALTER TABLE [table_name] ADD CONSTRAINT [table_name]_name_not_empty CHECK (name != '');

-- Add comments for documentation
COMMENT ON TABLE [table_name] IS '[Table description]';
COMMENT ON COLUMN [table_name].name IS '[Column description]';

-- Insert initial data if needed
INSERT INTO [table_name] (name, description) VALUES 
    ('Default Item', 'Default description');
```

---

## Version Control & Release Management

### Git Workflow
1. **Feature Branch**: Create feature branch from main
2. **Development**: Implement feature with tests
3. **Code Review**: Submit pull request for review
4. **Testing**: Run all tests and verify functionality
5. **Merge**: Merge to main after approval
6. **Tag**: Create version tag for releases

### Release Process
1. **Version Bump**: Update version in package.json
2. **Changelog**: Update CHANGELOG.md
3. **Tag Release**: Create git tag
4. **Deploy**: Deploy to production
5. **Documentation**: Update documentation

### Version Naming
- **Major**: Breaking changes (v4.0.0)
- **Minor**: New features (v4.1.0)
- **Patch**: Bug fixes (v4.1.1)

---

## Security Guidelines

### Authentication Security
- Use strong JWT secrets
- Implement token expiration
- Validate tokens on every request
- Use HTTPS in production

### Data Security
- Validate all inputs
- Use parameterized queries
- Implement rate limiting
- Encrypt sensitive data

### Authorization Security
- Implement role-based access control
- Validate permissions on every request
- Log security events
- Regular security audits

---

## Performance Guidelines

### Frontend Performance
- Use React.memo for expensive components
- Implement code splitting
- Optimize bundle size
- Use proper caching strategies

### Backend Performance
- Optimize database queries
- Use proper indexing
- Implement connection pooling
- Monitor response times

### Database Performance
- Use appropriate indexes
- Optimize query patterns
- Monitor slow queries
- Regular maintenance

---

## Monitoring & Observability

### Application Monitoring
- **Health Checks**: Implement health check endpoints
- **Error Tracking**: Track and alert on errors
- **Performance Monitoring**: Monitor response times
- **Resource Usage**: Monitor CPU, memory, disk usage

### Database Monitoring
- **Query Performance**: Monitor slow queries
- **Connection Pool**: Monitor connection usage
- **Storage**: Monitor disk usage
- **Backup Status**: Monitor backup success

### Logging Strategy
- **Structured Logging**: Use structured log format
- **Log Levels**: Use appropriate log levels
- **Log Rotation**: Implement log rotation
- **Centralized Logging**: Centralize logs for analysis

---

*This comprehensive guide should be updated with each major feature addition or architectural change. It serves as the single source of truth for implementing new features while maintaining system stability and consistency.* 