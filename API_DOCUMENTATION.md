# MLM Tools - API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Error Handling](#error-handling)
4. [Endpoints](#endpoints)
5. [Data Models](#data-models)
6. [Examples](#examples)

## Overview

### Base URL
```
http://localhost:3000/api
```

### Content Type
All requests and responses use `application/json`

### Authentication
Most endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Authentication

### Login
**POST** `/auth/login`

Authenticate a user and receive a JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "user@example.com",
    "role": "admin"
  }
}
```

### Create User
**POST** `/auth/create-user`

Create a new user (Admin only).

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "password123",
  "role": "business_user"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 2,
    "name": "Jane Smith",
    "email": "jane@example.com",
    "role": "business_user",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### Get Current User
**GET** `/auth/me`

Get the current authenticated user's information.

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "user@example.com",
    "role": "admin",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### Change Password
**POST** `/auth/change-password`

Change the current user's password.

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Common Error Codes
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `VALIDATION_ERROR`: Invalid input data
- `NOT_FOUND`: Resource not found
- `INTERNAL_ERROR`: Server error

### HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

## Endpoints

### User Management

#### Get All Users
**GET** `/users`

Get a list of all users (Admin only).

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `role` (optional): Filter by role
- `search` (optional): Search by name or email

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "admin",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

#### Get User by ID
**GET** `/users/:id`

Get a specific user by ID (Admin only).

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "admin",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

#### Update User
**PUT** `/users/:id`

Update a user's information (Admin only).

**Request Body:**
```json
{
  "name": "John Updated",
  "email": "john.updated@example.com",
  "role": "business_user",
  "is_active": true
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "John Updated",
    "email": "john.updated@example.com",
    "role": "business_user",
    "is_active": true,
    "updated_at": "2024-01-15T11:00:00Z"
  }
}
```

#### Delete User
**DELETE** `/users/:id`

Delete a user (Admin only).

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

#### Reset User Password
**POST** `/users/:id/reset-password`

Reset a user's password (Admin only).

**Request Body:**
```json
{
  "newPassword": "newpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

#### Get Business Users
**GET** `/users/business-users`

Get a list of business users for business plan assignment.

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "id": 2,
      "name": "Jane Smith",
      "email": "jane@example.com",
      "role": "business_user"
    }
  ]
}
```

### Genealogy Types

#### Get Genealogy Types
**GET** `/genealogy-types`

Get all available genealogy types.

**Response:**
```json
{
  "success": true,
  "types": [
    {
      "id": 1,
      "name": "Matrix",
      "description": "Matrix compensation plan",
      "config_schema": {
        "width": "number",
        "depth": "number"
      },
      "is_active": true
    },
    {
      "id": 2,
      "name": "Unilevel",
      "description": "Unilevel compensation plan",
      "config_schema": {
        "levels": "number",
        "commission_rate": "number"
      },
      "is_active": true
    }
  ]
}
```

### Genealogy Simulation

#### Create Simulation
**POST** `/genealogy/simulate`

Create a new genealogy simulation.

**Request Body:**
```json
{
  "genealogy_type_id": 1,
  "config": {
    "width": 3,
    "depth": 5,
    "commission_rate": 0.1
  }
}
```

**Response:**
```json
{
  "success": true,
  "simulation": {
    "id": "sim_123456",
    "genealogy_type_id": 1,
    "config": {
      "width": 3,
      "depth": 5,
      "commission_rate": 0.1
    },
    "results": {
      "total_members": 121,
      "total_commission": 1000.00,
      "levels": [
        {
          "level": 1,
          "members": 3,
          "commission": 300.00
        }
      ]
    },
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

#### Save Simulation
**POST** `/genealogy/save-simulation`

Save a simulation to the database.

**Request Body:**
```json
{
  "simulation_id": "sim_123456",
  "genealogy_type_id": 1,
  "simulation_data": {
    "config": {
      "width": 3,
      "depth": 5
    },
    "results": {
      "total_members": 121,
      "total_commission": 1000.00
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "simulation": {
    "id": 1,
    "user_id": 1,
    "genealogy_type_id": 1,
    "simulation_data": {
      "config": {
        "width": 3,
        "depth": 5
      },
      "results": {
        "total_members": 121,
        "total_commission": 1000.00
      }
    },
    "status": "active",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### Business Plan Management

#### Get Business Plans
**GET** `/business-plan/simulations`

Get business plan simulations.

**Query Parameters:**
- `user_id` (optional): Filter by user ID
- `status` (optional): Filter by status

**Response:**
```json
{
  "success": true,
  "business_plans": [
    {
      "id": 1,
      "user_id": 2,
      "business_name": "Premium MLM Plan",
      "status": "active",
      "genealogy_simulation_id": "sim_123456",
      "created_at": "2024-01-15T10:30:00Z",
      "user": {
        "id": 2,
        "name": "Jane Smith",
        "email": "jane@example.com",
        "role": "business_user"
      },
      "products": [
        {
          "id": 1,
          "product_name": "Premium Membership",
          "product_price": 99.99,
          "business_volume": 100.00,
          "product_sales_ratio": 25.50,
          "product_type": "membership",
          "sort_order": 1
        }
      ]
    }
  ]
}
```

#### Create Business Plan
**POST** `/business-plan/simulations`

Create a new business plan simulation (Admin only).

**Request Body:**
```json
{
  "user_id": 2,
  "business_name": "Premium MLM Plan",
  "genealogy_simulation_id": "sim_123456",
  "products": [
    {
      "product_name": "Premium Membership",
      "product_price": 99.99,
      "business_volume": 100.00,
      "product_sales_ratio": 25.50,
      "product_type": "membership"
    },
    {
      "product_name": "Digital Course",
      "product_price": 49.99,
      "business_volume": 50.00,
      "product_sales_ratio": 15.25,
      "product_type": "digital"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "business_plan": {
    "id": 1,
    "user_id": 2,
    "business_name": "Premium MLM Plan",
    "status": "draft",
    "genealogy_simulation_id": "sim_123456",
    "created_at": "2024-01-15T10:30:00Z",
    "products": [
      {
        "id": 1,
        "product_name": "Premium Membership",
        "product_price": 99.99,
        "business_volume": 100.00,
        "product_sales_ratio": 25.50,
        "product_type": "membership",
        "sort_order": 1
      },
      {
        "id": 2,
        "product_name": "Digital Course",
        "product_price": 49.99,
        "business_volume": 50.00,
        "product_sales_ratio": 15.25,
        "product_type": "digital",
        "sort_order": 2
      }
    ]
  }
}
```

#### Get Business Plan by ID
**GET** `/business-plan/simulations/:id`

Get a specific business plan by ID.

**Response:**
```json
{
  "success": true,
  "business_plan": {
    "id": 1,
    "user_id": 2,
    "business_name": "Premium MLM Plan",
    "status": "active",
    "genealogy_simulation_id": "sim_123456",
    "created_at": "2024-01-15T10:30:00Z",
    "user": {
      "id": 2,
      "name": "Jane Smith",
      "email": "jane@example.com",
      "role": "business_user"
    },
    "products": [
      {
        "id": 1,
        "product_name": "Premium Membership",
        "product_price": 99.99,
        "business_volume": 100.00,
        "product_sales_ratio": 25.50,
        "product_type": "membership",
        "sort_order": 1
      }
    ]
  }
}
```

#### Update Business Plan
**PUT** `/business-plan/simulations/:id`

Update a business plan (Admin only).

**Request Body:**
```json
{
  "business_name": "Updated MLM Plan",
  "status": "active",
  "products": [
    {
      "product_name": "Updated Membership",
      "product_price": 129.99,
      "business_volume": 130.00,
      "product_sales_ratio": 30.00,
      "product_type": "membership"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "business_plan": {
    "id": 1,
    "business_name": "Updated MLM Plan",
    "status": "active",
    "updated_at": "2024-01-15T11:00:00Z",
    "products": [
      {
        "id": 3,
        "product_name": "Updated Membership",
        "product_price": 129.99,
        "business_volume": 130.00,
        "product_sales_ratio": 30.00,
        "product_type": "membership",
        "sort_order": 1
      }
    ]
  }
}
```

#### Delete Business Plan
**DELETE** `/business-plan/simulations/:id`

Delete a business plan (Admin only).

**Response:**
```json
{
  "success": true,
  "message": "Business plan deleted successfully"
}
```

## Data Models

### User
```typescript
interface User {
  id: number;
  name: string;
  email: string;
  password_hash?: string;
  role: 'admin' | 'user' | 'business_user';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

### Business Plan Simulation
```typescript
interface BusinessPlanSimulation {
  id: number;
  user_id: number;
  genealogy_simulation_id?: string;
  business_name: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  created_by?: number;
  created_at: string;
  updated_at: string;
  products?: BusinessProduct[];
  user?: User;
}
```

### Business Product
```typescript
interface BusinessProduct {
  id: number;
  business_plan_id: number;
  product_name: string;
  product_price: number;
  business_volume: number;
  product_sales_ratio: number;
  product_type: 'membership' | 'retail' | 'digital';
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

### Genealogy Type
```typescript
interface GenealogyType {
  id: number;
  name: string;
  description?: string;
  config_schema: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

### Genealogy Simulation
```typescript
interface GenealogySimulation {
  id: number;
  user_id: number;
  genealogy_type_id: number;
  simulation_data: Record<string, any>;
  status: string;
  created_at: string;
  updated_at: string;
}
```

## Examples

### Complete Business Plan Creation Flow

1. **Create User**
```bash
curl -X POST http://localhost:3000/api/auth/create-user \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "name": "Business Owner",
    "email": "owner@example.com",
    "password": "password123",
    "role": "business_user"
  }'
```

2. **Create Genealogy Simulation**
```bash
curl -X POST http://localhost:3000/api/genealogy/simulate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "genealogy_type_id": 1,
    "config": {
      "width": 3,
      "depth": 5,
      "commission_rate": 0.1
    }
  }'
```

3. **Create Business Plan**
```bash
curl -X POST http://localhost:3000/api/business-plan/simulations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "user_id": 2,
    "business_name": "Premium MLM Plan",
    "genealogy_simulation_id": "sim_123456",
    "products": [
      {
        "product_name": "Premium Membership",
        "product_price": 99.99,
        "business_volume": 100.00,
        "product_sales_ratio": 25.50,
        "product_type": "membership"
      }
    ]
  }'
```

### Error Handling Example

**Invalid Request:**
```bash
curl -X POST http://localhost:3000/api/business-plan/simulations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "user_id": 999,
    "business_name": "",
    "products": []
  }'
```

**Error Response:**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    "User not found",
    "Business name is required",
    "At least one product is required"
  ],
  "code": "VALIDATION_ERROR"
}
```

### Authentication Error Example

**Unauthorized Request:**
```bash
curl -X GET http://localhost:3000/api/users
```

**Error Response:**
```json
{
  "success": false,
  "error": "Authentication required",
  "code": "UNAUTHORIZED"
}
```

---

*This API documentation should be updated with each new endpoint or data model change.* 