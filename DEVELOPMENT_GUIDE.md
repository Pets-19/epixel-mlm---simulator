# MLM Tools - Development Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Development Environment](#development-environment)
3. [Code Standards](#code-standards)
4. [Feature Development Process](#feature-development-process)
5. [Testing Guidelines](#testing-guidelines)
6. [Deployment Process](#deployment-process)
7. [Troubleshooting](#troubleshooting)

## Getting Started

### Prerequisites
- Node.js 18+ (LTS)
- Go 1.21+
- Docker & Docker Compose
- PostgreSQL 15+
- Git

### Initial Setup
```bash
# Clone the repository
git clone <repository-url>
cd mlm-tools

# Install dependencies
npm install

# Start development environment
docker compose up -d

# Apply database migrations
docker compose exec postgres psql -U postgres -d epixel_mlm_tools -f /docker-entrypoint-initdb.d/01-schema.sql
```

### Development URLs
- **Frontend**: http://localhost:3000
- **Go Simulator**: http://localhost:8080
- **PostgreSQL**: localhost:5432

## Development Environment

### Project Structure
```
mlm-tools/
├── app/                    # Next.js application
│   ├── api/               # API routes
│   ├── components/        # React components
│   └── pages/            # Next.js pages
├── components/            # Shared components
│   └── ui/               # shadcn/ui components
├── lib/                   # Utility libraries
├── database/              # Database migrations
├── genealogy-simulator/   # Go backend service
└── docker-compose.yml     # Development environment
```

### Key Technologies
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Go 1.21, PostgreSQL
- **Containerization**: Docker, Docker Compose
- **Authentication**: JWT tokens
- **Database**: PostgreSQL with migrations

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/epixel_mlm_tools

# JWT
JWT_SECRET=your-secret-key

# Go Simulator
SIMULATOR_URL=http://localhost:8080
```

## Code Standards

### TypeScript Standards
- Use strict TypeScript configuration
- Define interfaces for all data structures
- Use type guards for runtime type checking
- Avoid `any` type - use proper typing

### React Standards
- Use functional components with hooks
- Implement proper error boundaries
- Use React.memo for performance optimization
- Follow React best practices

### Go Standards
- Follow Go idioms and conventions
- Use proper error handling
- Implement proper logging
- Use context for request-scoped data

### Database Standards
- Use parameterized queries
- Implement proper constraints
- Create indexes for performance
- Use transactions for data integrity

### Naming Conventions
- **Files**: kebab-case (e.g., `business-plan.ts`)
- **Components**: PascalCase (e.g., `BusinessPlanWizard`)
- **Functions**: camelCase (e.g., `createBusinessPlan`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_ATTEMPTS`)
- **Database**: snake_case (e.g., `business_plan_simulations`)

## Feature Development Process

### 1. Planning Phase
1. **Define Requirements**: Create detailed user stories
2. **Technical Design**: Plan database schema, API endpoints, UI components
3. **Review**: Get approval from team lead
4. **Estimation**: Estimate development time

### 2. Development Phase
1. **Database Changes**: Create migration files
2. **Backend Development**: Implement API endpoints
3. **Frontend Development**: Create UI components
4. **Integration**: Connect frontend and backend
5. **Testing**: Unit and integration tests

### 3. Testing Phase
1. **Unit Tests**: Test individual components
2. **Integration Tests**: Test API endpoints
3. **End-to-End Tests**: Test complete user flows
4. **Performance Tests**: Test under load

### 4. Review Phase
1. **Code Review**: Peer review of changes
2. **Testing Review**: Verify all tests pass
3. **Documentation**: Update relevant documentation
4. **Deployment**: Deploy to staging/production

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

## Testing Guidelines

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

### Database Testing
```sql
-- Example migration test
BEGIN;
-- Apply migration
\i migration_test.sql
-- Verify changes
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'business_products' 
AND column_name = 'new_column';
-- Rollback
ROLLBACK;
```

### Testing Best Practices
- Write tests before implementation (TDD)
- Test both success and failure scenarios
- Mock external dependencies
- Use descriptive test names
- Maintain test data fixtures

## Deployment Process

### Development Deployment
```bash
# Build and start development environment
docker compose up -d --build

# Apply migrations
docker compose exec postgres psql -U postgres -d epixel_mlm_tools -f /docker-entrypoint-initdb.d/migration.sql

# Check logs
docker compose logs -f app
```

### Staging Deployment
```bash
# Build production images
docker compose -f docker-compose.staging.yml build

# Deploy to staging
docker compose -f docker-compose.staging.yml up -d

# Run health checks
curl http://staging.example.com/health
```

### Production Deployment
```bash
# Build production images
docker compose -f docker-compose.prod.yml build

# Deploy with zero downtime
docker compose -f docker-compose.prod.yml up -d

# Verify deployment
curl http://production.example.com/health
```

### Migration Process
```bash
# Create migration file
touch database/migration_feature_name.sql

# Apply migration
docker compose exec postgres psql -U postgres -d epixel_mlm_tools -f /docker-entrypoint-initdb.d/migration_feature_name.sql

# Verify migration
docker compose exec postgres psql -U postgres -d epixel_mlm_tools -c "\d table_name"
```

## Common Development Tasks

### Adding a New API Endpoint

1. **Create API Route**
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
    
    // Process request
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

2. **Add TypeScript Interface**
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

3. **Create Database Migration**
```sql
-- database/migration_add_feature.sql
CREATE TABLE features (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    config JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_features_name ON features(name);
```

### Adding a New React Component

1. **Create Component**
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

2. **Add to Page**
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

### Adding Database Migration

1. **Create Migration File**
```sql
-- database/migration_add_new_table.sql
-- Migration: Add new feature table
-- Date: 2024-01-15
-- Description: Add table for new feature

CREATE TABLE new_feature (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_new_feature_name ON new_feature(name);
CREATE INDEX idx_new_feature_active ON new_feature(is_active);

-- Add constraints
ALTER TABLE new_feature ADD CONSTRAINT new_feature_name_not_empty CHECK (name != '');

-- Add comments for documentation
COMMENT ON TABLE new_feature IS 'Table for storing new feature data';
COMMENT ON COLUMN new_feature.name IS 'Feature name (required)';
```

2. **Update Docker Compose**
```yaml
# docker-compose.yml
services:
  postgres:
    volumes:
      - ./database/migration_add_new_table.sql:/docker-entrypoint-initdb.d/08-migration_add_new_table.sql
```

3. **Apply Migration**
```bash
docker compose exec postgres psql -U postgres -d epixel_mlm_tools -f /docker-entrypoint-initdb.d/08-migration_add_new_table.sql
```

## Troubleshooting

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

#### Migration Issues
```bash
# Check migration status
docker compose exec postgres psql -U postgres -d epixel_mlm_tools -c "\dt"

# Rollback migration
docker compose exec postgres psql -U postgres -d epixel_mlm_tools -c "DROP TABLE table_name;"
```

### Performance Issues

#### Database Performance
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

#### Frontend Performance
```bash
# Build analysis
npm run build

# Check bundle size
npm run analyze

# Performance monitoring
npm run lighthouse
```

### Debugging

#### Frontend Debugging
```typescript
// Add debugging logs
console.log('Debug data:', data)

// Use React DevTools
// Install React Developer Tools browser extension

// Use Next.js debugging
NODE_OPTIONS='--inspect' npm run dev
```

#### Backend Debugging
```go
// Add logging
log.Printf("Debug: %+v", data)

// Use Go debugging
dlv debug main.go

// Check Go logs
docker compose logs genealogy-simulator
```

#### Database Debugging
```sql
-- Enable query logging
ALTER SYSTEM SET log_statement = 'all';
SELECT pg_reload_conf();

-- Check active connections
SELECT * FROM pg_stat_activity;

-- Check locks
SELECT * FROM pg_locks;
```

## Best Practices

### Code Quality
- Use ESLint and Prettier for code formatting
- Write self-documenting code
- Add comments for complex logic
- Follow DRY (Don't Repeat Yourself) principle

### Security
- Validate all user inputs
- Use parameterized queries
- Implement proper authentication
- Follow OWASP security guidelines

### Performance
- Optimize database queries
- Use proper indexing
- Implement caching where appropriate
- Monitor application performance

### Testing
- Write comprehensive tests
- Use test-driven development
- Maintain test coverage above 80%
- Test edge cases and error scenarios

### Documentation
- Keep documentation up to date
- Document API changes
- Update README files
- Maintain changelog

---

*This development guide should be updated as the project evolves and new patterns emerge.* 