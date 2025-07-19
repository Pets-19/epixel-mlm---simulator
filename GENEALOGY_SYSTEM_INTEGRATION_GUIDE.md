# Genealogy System Integration Guide

## Overview

This guide explains how new features can discover, integrate with, and reuse the existing genealogy plan rules and execution files. The system provides a centralized registry that makes all genealogy components discoverable and reusable.

## 🎯 System Awareness

The genealogy system is now fully aware of its components and provides multiple integration points:

### 1. **System Registry** (`lib/genealogy_system_registry.ts`)
- Centralized registry of all genealogy components
- Provides discovery and validation capabilities
- Singleton pattern for consistent access

### 2. **System Status API** (`/api/genealogy/system-status`)
- Real-time system health monitoring
- Component availability checking
- Integration status reporting

### 3. **Genealogy Types API** (`/api/genealogy/types`)
- Access to all genealogy plan rules
- Plan-specific configurations
- Validation and metadata

## 🔍 Discovery Methods

### 1. **Check System Availability**
```typescript
import { GenealogySystemUtils } from '@/lib/genealogy_system_registry';

// Check if genealogy system is available
const isAvailable = await GenealogySystemUtils.isSystemAvailable();
if (isAvailable) {
  console.log('Genealogy system is ready for integration');
}
```

### 2. **Get Available Plan Types**
```typescript
import { genealogySystemRegistry } from '@/lib/genealogy_system_registry';

// Load genealogy types
await genealogySystemRegistry.loadGenealogyTypes();

// Get available plan types for new features
const availablePlans = genealogySystemRegistry.getAvailablePlanTypes();
console.log('Available plans:', availablePlans);
// Output: [
//   { id: 1, name: "Binary Plan", type: "binary", description: "..." },
//   { id: 2, name: "Matrix Plan", type: "matrix", description: "..." },
//   { id: 3, name: "Unilevel Plan", type: "unilevel", description: "..." }
// ]
```

### 3. **Discover Execution Files**
```typescript
// Get all execution files
const allFiles = genealogySystemRegistry.getExecutionFiles();

// Get files by type
const simulators = genealogySystemRegistry.getExecutionFilesByType('simulator');
const handlers = genealogySystemRegistry.getExecutionFilesByType('handler');
const apis = genealogySystemRegistry.getExecutionFilesByType('api');

// Get files for specific genealogy type
const binaryPlanFiles = genealogySystemRegistry.getExecutionFilesForGenealogyType('Binary Plan');
```

## 🔧 Integration Patterns

### 1. **Using Genealogy Plan Rules**

#### Get Plan Rules for a Specific Type
```typescript
// Get binary plan rules
const binaryPlan = genealogySystemRegistry.getGenealogyTypeByPlanType('binary');
if (binaryPlan) {
  const rules = binaryPlan.rules;
  console.log('Binary plan max children:', rules.max_children); // 2
  console.log('Filling order:', rules.filling_order); // 'left_to_right'
  console.log('Child positions:', rules.child_positions); // ['left', 'right']
}
```

#### Validate Custom Rules
```typescript
// Validate genealogy plan rules
const customRules = {
  type: 'binary' as const,
  max_children: 2,
  child_positions: ['left', 'right'],
  // ... other properties
};

const validation = genealogySystemRegistry.validateGenealogyPlanRules(customRules);
if (validation.valid) {
  console.log('Rules are valid');
} else {
  console.log('Validation errors:', validation.errors);
}
```

### 2. **Using Execution Files**

#### Find Simulators
```typescript
// Get all simulators
const simulators = genealogySystemRegistry.getExecutionFilesByType('simulator');
simulators.forEach(simulator => {
  console.log(`Simulator: ${simulator.name}`);
  console.log(`Path: ${simulator.path}`);
  console.log(`Functions: ${simulator.functions.join(', ')}`);
});
```

#### Find Handlers
```typescript
// Get handlers for genealogy operations
const handlers = genealogySystemRegistry.getExecutionFilesByType('handler');
handlers.forEach(handler => {
  console.log(`Handler: ${handler.name}`);
  console.log(`Available functions: ${handler.functions.join(', ')}`);
});
```

### 3. **Using API Endpoints**

#### Check System Status
```typescript
// Check system status via API
const response = await fetch('/api/genealogy/system-status');
const status = await response.json();

if (status.system_available) {
  console.log(`System has ${status.genealogy_types_count} genealogy types`);
  console.log(`Migration status: ${status.migration_status}`);
}
```

#### Get Genealogy Types
```typescript
// Get all genealogy types
const response = await fetch('/api/genealogy/types');
const genealogyTypes = await response.json();

genealogyTypes.forEach(type => {
  console.log(`Type: ${type.name}`);
  console.log(`Plan: ${type.rules.type}`);
  console.log(`Max children: ${type.max_children_per_node}`);
});
```

## 🚀 Integration Examples

### Example 1: New Feature Using Binary Plan

```typescript
import { GenealogySystemUtils, genealogySystemRegistry } from '@/lib/genealogy_system_registry';

class BinaryPlanFeature {
  async initialize() {
    // Check if system is available
    const isAvailable = await GenealogySystemUtils.isSystemAvailable();
    if (!isAvailable) {
      throw new Error('Genealogy system not available');
    }

    // Get binary plan configuration
    const binaryPlan = await GenealogySystemUtils.getGenealogyTypeForPlan('binary');
    if (!binaryPlan) {
      throw new Error('Binary plan not found');
    }

    // Use binary plan rules
    const rules = binaryPlan.rules;
    this.maxChildren = rules.max_children; // 2
    this.fillingOrder = rules.filling_order; // 'left_to_right'
    this.childPositions = rules.child_positions; // ['left', 'right']
  }

  async createBinaryNode(parentId: number, position: 'left' | 'right') {
    // Use existing API endpoint
    const response = await fetch('/api/genealogy/add-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: this.generateUserId(),
        genealogy_type_id: 1, // Binary Plan ID
        parent_id: parentId,
        position: position
      })
    });

    return response.json();
  }
}
```

### Example 2: New Feature Using All Plan Types

```typescript
class MultiPlanFeature {
  private genealogyTypes: any[] = [];

  async initialize() {
    // Load all genealogy types
    await genealogySystemRegistry.loadGenealogyTypes();
    this.genealogyTypes = genealogySystemRegistry.getGenealogyTypes();

    // Validate all types are available
    const requiredTypes = ['Binary Plan', 'Matrix Plan', 'Unilevel Plan'];
    const availableTypes = this.genealogyTypes.map(t => t.name);
    
    const missingTypes = requiredTypes.filter(type => !availableTypes.includes(type));
    if (missingTypes.length > 0) {
      throw new Error(`Missing genealogy types: ${missingTypes.join(', ')}`);
    }
  }

  async simulateAllPlans(userCount: number) {
    const simulations = [];

    for (const type of this.genealogyTypes) {
      const simulation = await fetch('/api/genealogy/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          genealogy_type_id: type.id,
          max_expected_users: userCount,
          payout_cycle_type: 'weekly',
          number_of_cycles: 4,
          max_children_count: type.max_children_per_node
        })
      });

      simulations.push(await simulation.json());
    }

    return simulations;
  }
}
```

### Example 3: New Feature Using Execution Files

```typescript
class ExecutionFileAnalyzer {
  analyzeSystem() {
    const registry = genealogySystemRegistry;
    
    // Get all execution files
    const allFiles = registry.getExecutionFiles();
    
    // Analyze by type
    const analysis = {
      simulators: allFiles.filter(f => f.type === 'simulator'),
      handlers: allFiles.filter(f => f.type === 'handler'),
      apis: allFiles.filter(f => f.type === 'api'),
      utilities: allFiles.filter(f => f.type === 'utility')
    };

    // Check dependencies
    const dependencies = new Set<string>();
    allFiles.forEach(file => {
      file.dependencies.forEach(dep => dependencies.add(dep));
    });

    return {
      totalFiles: allFiles.length,
      analysis,
      dependencies: Array.from(dependencies)
    };
  }

  findFilesByFunction(functionName: string) {
    return genealogySystemRegistry.getExecutionFilesByFunction(functionName);
  }
}
```

## 🔍 Monitoring and Health Checks

### 1. **System Health Monitoring**
```typescript
// Regular health check
setInterval(async () => {
  const status = await genealogySystemRegistry.checkSystemStatus();
  
  if (!status.system_available) {
    console.error('Genealogy system is not available');
    // Trigger alerts or fallback behavior
  }
  
  console.log(`System health: ${status.system_available ? 'OK' : 'FAILED'}`);
}, 60000); // Check every minute
```

### 2. **Component Availability Check**
```typescript
// Check specific components
const checkComponents = async () => {
  const files = genealogySystemRegistry.getExecutionFiles();
  
  for (const file of files) {
    // Check if file exists or is accessible
    const isAvailable = await checkFileAvailability(file.path);
    console.log(`${file.name}: ${isAvailable ? 'Available' : 'Not Available'}`);
  }
};
```

## 📋 Best Practices

### 1. **Always Check System Availability**
```typescript
// Before using genealogy system
const isAvailable = await GenealogySystemUtils.isSystemAvailable();
if (!isAvailable) {
  // Implement fallback or error handling
  throw new Error('Genealogy system not available');
}
```

### 2. **Validate Rules Before Use**
```typescript
// Validate any custom rules
const validation = genealogySystemRegistry.validateGenealogyPlanRules(rules);
if (!validation.valid) {
  throw new Error(`Invalid rules: ${validation.errors.join(', ')}`);
}
```

### 3. **Use Type-Safe Interfaces**
```typescript
// Use the provided interfaces for type safety
import { GenealogyPlanRule, GenealogyType } from '@/lib/genealogy_system_registry';

function processRules(rules: GenealogyPlanRule) {
  // TypeScript will provide autocomplete and validation
  console.log(rules.type); // 'binary' | 'matrix' | 'unilevel'
  console.log(rules.max_children); // number
}
```

### 4. **Cache System Status**
```typescript
// Cache system status to avoid repeated API calls
let cachedStatus: any = null;
let lastCheck = 0;

const getSystemStatus = async () => {
  const now = Date.now();
  if (!cachedStatus || now - lastCheck > 300000) { // 5 minutes
    cachedStatus = await genealogySystemRegistry.checkSystemStatus();
    lastCheck = now;
  }
  return cachedStatus;
};
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. **System Not Available**
```typescript
// Check if services are running
const checkServices = async () => {
  try {
    const response = await fetch('/api/genealogy/system-status');
    return response.ok;
  } catch (error) {
    console.error('Services not responding:', error);
    return false;
  }
};
```

#### 2. **Missing Genealogy Types**
```typescript
// Verify genealogy types are loaded
const verifyTypes = async () => {
  await genealogySystemRegistry.loadGenealogyTypes();
  const types = genealogySystemRegistry.getGenealogyTypes();
  
  if (types.length === 0) {
    console.error('No genealogy types found');
    // Check database or migration status
  }
};
```

#### 3. **Invalid Rules**
```typescript
// Validate rules before use
const validateRules = (rules: any) => {
  const validation = genealogySystemRegistry.validateGenealogyPlanRules(rules);
  if (!validation.valid) {
    console.error('Rule validation failed:', validation.errors);
    // Provide user feedback or use default rules
  }
};
```

## 📚 Additional Resources

- **Migration System Documentation**: `MIGRATION_SYSTEM_DOCUMENTATION.md`
- **Technical Documentation**: `TECHNICAL_DOCUMENTATION.md`
- **API Reference**: Check `/api/genealogy/` endpoints
- **Database Schema**: Check `database/` migration files

## 🎯 Summary

The genealogy system now provides comprehensive awareness and integration capabilities:

✅ **System Registry**: Centralized discovery of all components  
✅ **API Endpoints**: Real-time status and data access  
✅ **Type Safety**: TypeScript interfaces for safe integration  
✅ **Validation**: Built-in rule validation  
✅ **Monitoring**: Health checks and status monitoring  
✅ **Documentation**: Comprehensive integration guide  

New features can now easily discover, validate, and reuse the genealogy plan rules and execution files with confidence that the system is aware of all components and provides proper integration points. 