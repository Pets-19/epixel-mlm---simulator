# MLM Tools - Technical Documentation

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Technology Stack](#technology-stack)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Authentication & Authorization](#authentication--authorization)
6. [Component Architecture](#component-architecture)
7. [Business Logic](#business-logic)
8. [Deployment & Infrastructure](#deployment--infrastructure)
9. [Development Guidelines](#development-guidelines)

## System Architecture

### Overview
The MLM Tools platform is a multi-service application built with:
- **Frontend**: Next.js 14 with App Router and Server Components
- **Backend**: Go services for genealogy simulation
- **Database**: PostgreSQL with strong schema design
- **Containerization**: Docker Compose for orchestration

### Architecture Diagram
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js App   │    │  Go Simulator    │    │   PostgreSQL    │
│   (Frontend)    │◄──►│   (Backend)      │◄──►│   (Database)    │
│   Port: 3000    │    │   Port: 8080     │    │   Port: 5432    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Technology Stack

### Frontend (Next.js 14)
- **Framework**: Next.js 14.2.30 with App Router
- **Language**: TypeScript
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

## Database Schema

### Core Tables

#### users
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'user', 'business_user')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### genealogy_types
```sql
CREATE TABLE genealogy_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    config_schema JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

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
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    genealogy_simulation_id VARCHAR(255),
    business_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### business_products
```sql
CREATE TABLE business_products (
    id SERIAL PRIMARY KEY,
    business_plan_id INTEGER REFERENCES business_plan_simulations(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    product_price DECIMAL(10,2) NOT NULL CHECK (product_price > 0),
    business_volume DECIMAL(10,2) NOT NULL CHECK (business_volume >= 0),
    product_sales_ratio DECIMAL(5,2) NOT NULL CHECK (product_sales_ratio >= 0 AND product_sales_ratio <= 100),
    product_type VARCHAR(50) NOT NULL CHECK (product_type IN ('membership', 'retail', 'digital')),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Indexes
```sql
-- Performance indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_genealogy_simulations_user_id ON genealogy_simulations(user_id);
CREATE INDEX idx_business_plan_simulations_user_id ON business_plan_simulations(user_id);
CREATE INDEX idx_business_products_plan_id ON business_products(business_plan_id);
```

## API Endpoints

### Authentication Endpoints
```
POST   /api/auth/login              - User login
POST   /api/auth/create-user        - Create new user
GET    /api/auth/me                 - Get current user
POST   /api/auth/change-password    - Change password
GET    /api/auth/profile            - Get user profile
```

### Genealogy Endpoints
```
GET    /api/genealogy-types         - Get genealogy types
POST   /api/genealogy/simulate      - Create simulation
POST   /api/genealogy/save-simulation - Save simulation
```

### Business Plan Endpoints
```
GET    /api/business-plan/simulations     - Get business plans
POST   /api/business-plan/simulations     - Create business plan
GET    /api/business-plan/simulations/:id - Get specific plan
PUT    /api/business-plan/simulations/:id - Update business plan
DELETE /api/business-plan/simulations/:id - Delete business plan
```

### User Management Endpoints
```
GET    /api/users                    - Get all users
GET    /api/users/:id                - Get specific user
PUT    /api/users/:id                - Update user
DELETE /api/users/:id                - Delete user
POST   /api/users/:id/reset-password - Reset user password
GET    /api/users/business-users     - Get business users
```

### Go Simulator Endpoints
```
POST   /simulate                     - Run genealogy simulation
GET    /health                       - Health check
```

## Authentication & Authorization

### User Roles
- **admin**: Full system access, can manage users and business plans
- **user**: Standard user access, can create simulations
- **business_user**: Business user access, can be assigned to business plans

### Authentication Flow
1. User submits login credentials
2. Server validates credentials against database
3. JWT token generated and returned
4. Token stored in client-side storage
5. Token included in subsequent API requests
6. Server validates token on protected routes

### Authorization Rules
- **Admin Routes**: `/admin/*`, `/users/*`, `/business-plan-wizard`
- **User Routes**: `/genealogy-simulation`, `/profile`
- **Public Routes**: `/login`, `/register`

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

## Business Logic

### Genealogy Simulation
1. **Type Selection**: User selects genealogy type (Matrix, Unilevel, etc.)
2. **Configuration**: User configures simulation parameters
3. **Processing**: Go service processes simulation
4. **Results**: Results displayed in tree view
5. **Storage**: Simulation can be saved to database

### Business Plan Creation
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

### Migration Strategy
1. **SQL Files**: Each migration in separate SQL file
2. **Versioning**: Migrations run in order by filename
3. **Rollback**: Manual rollback process
4. **Testing**: Migrations tested in development first

## Development Guidelines

### Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **Git Hooks**: Pre-commit validation

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

### Testing Strategy
- **Unit Tests**: Component and function testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Full user flow testing
- **Database Tests**: Schema and migration testing

### Security Considerations
- **Input Validation**: Validate all user inputs
- **SQL Injection**: Use parameterized queries
- **XSS Protection**: Sanitize user-generated content
- **Authentication**: Secure JWT implementation
- **Authorization**: Role-based access control

### Performance Optimization
- **Database**: Optimize queries with proper indexes
- **Frontend**: Code splitting and lazy loading
- **Caching**: Implement appropriate caching strategies
- **CDN**: Use CDN for static assets

## Monitoring & Logging

### Application Logs
- **Next.js**: Built-in logging
- **Go**: Structured logging
- **PostgreSQL**: Query logging

### Health Checks
- **Application**: `/api/health`
- **Database**: Connection pool status
- **Go Simulator**: `/health`

### Error Tracking
- **Client-side**: Error boundaries and logging
- **Server-side**: API error responses
- **Database**: Constraint violations

## Future Considerations

### Scalability
- **Horizontal Scaling**: Load balancer configuration
- **Database**: Read replicas and connection pooling
- **Caching**: Redis for session and data caching

### Features
- **Real-time Updates**: WebSocket integration
- **File Upload**: Document and image upload
- **Reporting**: Advanced analytics and reporting
- **Mobile**: Progressive Web App (PWA)

### Integration
- **Third-party APIs**: Payment gateways, email services
- **External Systems**: CRM, accounting software
- **Webhooks**: Event-driven integrations

---

*This documentation should be updated with each major feature addition or architectural change.* 