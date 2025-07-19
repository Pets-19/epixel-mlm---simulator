# MLM Genealogy System Technical Documentation

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Database Schema](#database-schema)
3. [Genealogy Plan Types](#genealogy-plan-types)
4. [API Endpoints](#api-endpoints)
5. [Simulation Logic](#simulation-logic)
6. [Data Flow](#data-flow)
7. [Error Handling](#error-handling)
8. [Deployment](#deployment)
9. [Testing](#testing)

## System Architecture

### Overview
The MLM Genealogy System is a microservices-based application consisting of:

- **Go Backend Service** (`genealogy-simulator`): Handles genealogy logic, user management, and database operations
- **Next.js Frontend** (`app`): Provides API routes as proxies to the Go backend and user interface
- **PostgreSQL Database**: Stores genealogy data using the Nested Set Model for efficient tree operations
- **Docker Compose**: Orchestrates all services

### Technology Stack
- **Backend**: Go 1.21 with Gorilla Mux for HTTP routing
- **Frontend**: Next.js 14 with TypeScript
- **Database**: PostgreSQL 15 with Nested Set Model
- **Containerization**: Docker and Docker Compose
- **API**: RESTful JSON APIs

### Service Communication
```
Frontend (Next.js) → API Routes → Go Backend → PostgreSQL
```

## Database Schema

### Core Tables

#### `genealogy_types`
Stores different genealogy plan configurations:
```sql
CREATE TABLE genealogy_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    max_children_per_node INTEGER NOT NULL DEFAULT 2,
    rules JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `genealogy_nodes`
Implements the Nested Set Model for efficient tree operations:
```sql
CREATE TABLE genealogy_nodes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    genealogy_type_id INTEGER REFERENCES genealogy_types(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES genealogy_nodes(id) ON DELETE CASCADE,
    
    -- Nested Set Model fields
    left_bound INTEGER NOT NULL,
    right_bound INTEGER NOT NULL,
    depth INTEGER NOT NULL DEFAULT 0,
    
    -- Node position within parent
    position VARCHAR(20) NOT NULL DEFAULT 'left',
    
    -- Simulation and cycle tracking
    simulation_id VARCHAR(100),
    payout_cycle INTEGER NOT NULL DEFAULT 1,
    cycle_position INTEGER NOT NULL DEFAULT 1,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance
    UNIQUE(user_id, genealogy_type_id),
    UNIQUE(left_bound, right_bound, genealogy_type_id)
);
```

#### `users`
Stores user information:
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    whatsapp_number VARCHAR(20) UNIQUE,
    organization_name VARCHAR(255),
    country VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Nested Set Model
The system uses the Nested Set Model for efficient tree operations:

- **left_bound**: Left boundary value for the node
- **right_bound**: Right boundary value for the node
- **depth**: Tree depth level (0 for root)
- **Benefits**: Efficient queries for ancestors, descendants, and tree traversal

## Genealogy Plan Types

### 1. Binary Plan
- **Max Children**: 2 per parent
- **Filling Strategy**: Left to right, top to bottom
- **Positions**: "left" and "right"
- **Rules**: Each parent can have maximum 2 children

**Example Structure:**
```
       Root
      /    \
   Left   Right
   /  \   /  \
  L   R  L   R
```

### 2. Matrix Plan
- **Max Children**: Configurable (default: 3)
- **Filling Strategy**: Fill parent to capacity, then spill to next available node
- **Positions**: "child" (no specific left/right distinction)
- **Rules**: Strict limit per parent, spillover when limit reached

**Example Structure:**
```
    Root
   / | \
  C1 C2 C3 (max 3)
  |
  C4 (spilled to C1)
```

### 3. Unilevel Plan
- **Max Children**: Configurable (default: 10)
- **Filling Strategy**: Flexible filling, average-based distribution
- **Positions**: "child" (no specific left/right distinction)
- **Rules**: No strict limit, but uses max_children_count as average guideline

**Example Structure:**
```
    Root
   / | \
  C1 C2 C3 (flexible)
  |
  C4 (can add more)
```

## API Endpoints

### Base URL
- **Go Backend**: `http://localhost:8080/api`
- **Next.js Frontend**: `http://localhost:3000/api`

### Genealogy Management Endpoints

#### 1. Generate Users
```http
POST /api/genealogy/generate-users
```

**Request Body:**
```json
{
  "count": 5,
  "genealogy_type_id": 1,
  "parent_id": null,
  "position": "left",
  "simulation_id": "optional-sim-id",
  "payout_cycle": 1,
  "max_children_count": 2
}
```

**Response:**
```json
{
  "success": true,
  "message": "Generated 5 users and added to genealogy",
  "data": [
    {
      "id": 1,
      "user_id": 25,
      "genealogy_type_id": 1,
      "parent_id": 2,
      "left_bound": 4,
      "right_bound": 5,
      "depth": 1,
      "position": "left",
      "simulation_id": null,
      "payout_cycle": 1,
      "cycle_position": 1,
      "user": {
        "id": 25,
        "email": "user@example.com",
        "name": "Generated User 1",
        "role": "user",
        "whatsapp_number": "+1234567890"
      }
    }
  ]
}
```

#### 2. Get Downline Users
```http
GET /api/genealogy/downline/{parent_id}?genealogy_type_id={type_id}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "user_id": 24,
      "parent_id": 2,
      "left_bound": 2,
      "right_bound": 3,
      "depth": 1,
      "position": "left",
      "user": { ... }
    }
  ],
  "count": 1
}
```

#### 3. Get Upline Users
```http
GET /api/genealogy/upline/{node_id}?genealogy_type_id={type_id}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "user_id": 6,
      "parent_id": null,
      "left_bound": 1,
      "right_bound": 8,
      "depth": 0,
      "position": "root",
      "user": { ... }
    }
  ],
  "count": 1
}
```

#### 4. Get Genealogy Structure
```http
GET /api/genealogy/structure/{genealogy_type_id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "nodes": [...],
    "tree_structure": {
      "root": {
        "id": 2,
        "user_id": 6,
        "children": [
          {
            "id": 3,
            "user_id": 24,
            "children": []
          }
        ]
      },
      "total_nodes": 3
    }
  }
}
```

#### 5. Add User to Genealogy
```http
POST /api/genealogy/add-user
```

**Request Body:**
```json
{
  "user_id": 30,
  "genealogy_type_id": 1,
  "parent_id": 2,
  "position": "right",
  "simulation_id": "sim-123",
  "payout_cycle": 1,
  "cycle_position": 2
}
```

### Simulation Endpoints

#### 1. Run Simulation
```http
POST /api/genealogy/simulate
```

**Request Body:**
```json
{
  "genealogy_type_id": 1,
  "max_expected_users": 10,
  "payout_cycle_type": "weekly",
  "number_of_cycles": 2,
  "max_children_count": 2
}
```

**Response:**
```json
{
  "simulation_id": "8d218bc8-7a4c-4d35-8dd0-3d48d37c90f9",
  "genealogy_type_id": 1,
  "max_expected_users": 10,
  "payout_cycle_type": "weekly",
  "number_of_cycles": 2,
  "users_per_cycle": 5,
  "total_nodes_generated": 10,
  "nodes": [...],
  "cycles": [
    {
      "cycle_number": 1,
      "start_user": 1,
      "end_user": 5,
      "users_in_cycle": 5,
      "nodes_in_cycle": [...]
    }
  ],
  "tree_structure": {
    "root": { ... },
    "total_nodes": 10
  },
  "created_at": "2025-07-19T11:54:51.891991049Z"
}
```

#### 2. Get Genealogy Types
```http
GET /api/genealogy/types
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Binary Plan",
    "description": "Binary tree structure...",
    "max_children_per_node": 2,
    "rules": {
      "type": "binary",
      "max_children": 2,
      "child_positions": ["left", "right"]
    },
    "is_active": true
  }
]
```

## Simulation Logic

### Overview
The simulation system distributes users across payout cycles and generates genealogy nodes according to the selected plan type.

### Process Flow

1. **Request Validation**
   - Validate genealogy type exists
   - Check parameter constraints
   - Generate unique simulation ID

2. **Plan Selection**
   - Binary Plan: Uses `BinaryPlanSimulator`
   - Matrix Plan: Uses `MatrixPlanSimulator`
   - Unilevel Plan: Uses `UnilevelPlanSimulator`

3. **User Distribution**
   - Calculate users per cycle: `max_expected_users / number_of_cycles`
   - Distribute users across cycles
   - Handle remainder users

4. **Node Generation**
   - Create nodes for each user
   - Apply plan-specific filling rules
   - Calculate nested set bounds
   - Assign positions and depths

5. **Tree Construction**
   - Build hierarchical structure
   - Validate tree integrity
   - Generate tree visualization

### Plan-Specific Logic

#### Binary Plan Simulator
```go
type BinaryPlanSimulator struct {
    simulationID  string
    nodes         []GenealogyNode
    nextLeftBound int
}
```

**Filling Rules:**
- Each parent can have maximum 2 children
- First child: position "left"
- Second child: position "right"
- Fill from top to bottom, left to right

#### Matrix Plan Simulator
```go
type MatrixPlanSimulator struct {
    simulationID     string
    nodes            []GenealogyNode
    nextLeftBound    int
    maxChildrenCount int
}
```

**Filling Rules:**
- Strict limit per parent (maxChildrenCount)
- When parent reaches limit, spill to next available node
- All positions are "child"

#### Unilevel Plan Simulator
```go
type UnilevelPlanSimulator struct {
    simulationID     string
    nodes            []GenealogyNode
    nextLeftBound    int
    maxChildrenCount int
}
```

**Filling Rules:**
- No strict limit per parent
- Uses maxChildrenCount as average guideline
- Flexible distribution across nodes

## Data Flow

### User Generation Flow
```
1. Frontend Request → Next.js API Route
2. Next.js → Go Backend (proxy)
3. Go Backend → Database (create user)
4. Go Backend → Database (add to genealogy)
5. Go Backend → Next.js → Frontend Response
```

### Simulation Flow
```
1. Frontend Request → Next.js API Route
2. Next.js → Go Backend (proxy)
3. Go Backend → Select Simulator
4. Simulator → Generate Nodes
5. Simulator → Build Tree Structure
6. Go Backend → Next.js → Frontend Response
```

### Tree Query Flow
```
1. Frontend Request → Next.js API Route
2. Next.js → Go Backend (proxy)
3. Go Backend → Database (nested set query)
4. Go Backend → Process Results
5. Go Backend → Next.js → Frontend Response
```

## Error Handling

### HTTP Status Codes
- `200`: Success
- `400`: Bad Request (invalid parameters)
- `404`: Not Found (resource not found)
- `500`: Internal Server Error (database/processing errors)

### Error Response Format
```json
{
  "error": "Error message description"
}
```

### Common Error Scenarios
1. **Invalid Genealogy Type**: Returns 400 with "Invalid genealogy type"
2. **Database Connection**: Returns 500 with database error
3. **Invalid Parameters**: Returns 400 with parameter validation error
4. **Node Not Found**: Returns 404 for tree queries

### Logging
- Go backend logs all operations with timestamps
- Database errors are logged with details
- Simulation progress is logged
- Node insertion/deletion operations are tracked

## Deployment

### Prerequisites
- Docker and Docker Compose
- PostgreSQL 15
- Go 1.21+
- Node.js 18+

### Environment Variables
```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=epixel_mlm_tools
DB_USER=postgres
DB_PASSWORD=password

# Services
GO_API_URL=http://localhost:8080
PORT=8080
```

### Docker Compose Setup
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: epixel_mlm_tools
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  genealogy-simulator:
    build: ./genealogy-simulator
    ports:
      - "8080:8080"
    depends_on:
      - postgres
    environment:
      - DB_HOST=postgres

  app:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - genealogy-simulator
    environment:
      - GO_API_URL=http://genealogy-simulator:8080
```

### Deployment Steps
1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd mlm-tools
   ```

2. **Build and Start Services**
   ```bash
   docker compose up -d
   ```

3. **Initialize Database**
   ```bash
   docker compose exec postgres psql -U postgres -d epixel_mlm_tools -f /docker-entrypoint-initdb.d/init.sql
   ```

4. **Verify Services**
   ```bash
   docker compose ps
   curl http://localhost:8080/api/genealogy/types
   ```

## Testing

### Manual Testing
1. **Generate Users**
   ```bash
   curl -X POST http://localhost:8080/api/genealogy/generate-users \
     -H "Content-Type: application/json" \
     -d '{"count": 3, "genealogy_type_id": 1, "payout_cycle": 1}'
   ```

2. **Run Simulation**
   ```bash
   curl -X POST http://localhost:8080/api/genealogy/simulate \
     -H "Content-Type: application/json" \
     -d '{"genealogy_type_id": 1, "max_expected_users": 10, "payout_cycle_type": "weekly", "number_of_cycles": 2}'
   ```

3. **Query Tree Structure**
   ```bash
   curl -X GET "http://localhost:8080/api/genealogy/structure/1"
   ```

### Automated Testing
- Unit tests for simulators
- Integration tests for API endpoints
- Database migration tests
- Performance tests for large trees

### Performance Considerations
- Nested Set Model provides O(log n) tree queries
- Indexes on left_bound, right_bound for efficient traversal
- Connection pooling for database operations
- Caching for frequently accessed tree structures

## Conclusion

The MLM Genealogy System provides a robust, scalable solution for managing genealogy structures with support for multiple plan types. The system uses modern technologies and follows best practices for performance, maintainability, and extensibility.

Key Features:
- ✅ Binary, Matrix, and Unilevel plan support
- ✅ Efficient nested set model implementation
- ✅ RESTful API endpoints
- ✅ Comprehensive simulation capabilities
- ✅ Docker-based deployment
- ✅ Detailed logging and error handling
- ✅ Scalable architecture

The system is ready for production use and can be extended with additional plan types and features as needed. 