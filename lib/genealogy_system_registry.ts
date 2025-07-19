/**
 * Genealogy System Registry
 * 
 * This module provides a centralized registry for genealogy plan rules and execution files,
 * making them discoverable and reusable by new features throughout the system.
 */

export interface GenealogyPlanRule {
  type: 'binary' | 'matrix' | 'unilevel';
  filling_order: 'left_to_right' | 'breadth_first' | 'depth_first';
  max_children: number;
  child_positions: string[];
  description: string;
  spillover_rules: {
    enabled: boolean;
    method?: string;
    description: string;
  };
  validation_rules: {
    max_depth?: number | null;
    max_width?: number | null;
    balanced_tree: boolean;
  };
  simulation_settings: {
    default_cycle_type: string;
    default_cycles: number;
    default_users_per_cycle: number;
    spillover_threshold?: number;
  };
}

export interface GenealogyType {
  id: number;
  name: string;
  description: string;
  max_children_per_node: number;
  rules: GenealogyPlanRule;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GenealogyExecutionFile {
  name: string;
  path: string;
  type: 'simulator' | 'handler' | 'api' | 'utility';
  description: string;
  genealogy_types: string[];
  dependencies: string[];
  functions: string[];
}

export interface GenealogySystemStatus {
  system_available: boolean;
  genealogy_types_count: number;
  active_types_count: number;
  execution_files_count: number;
  last_health_check: string;
  migration_status: 'success' | 'failed' | 'unknown';
}

/**
 * Genealogy System Registry Class
 * Provides centralized access to genealogy plan rules and execution files
 */
export class GenealogySystemRegistry {
  private static instance: GenealogySystemRegistry;
  private genealogyTypes: GenealogyType[] = [];
  private executionFiles: GenealogyExecutionFile[] = [];
  private systemStatus: GenealogySystemStatus | null = null;

  private constructor() {
    this.initializeExecutionFiles();
  }

  public static getInstance(): GenealogySystemRegistry {
    if (!GenealogySystemRegistry.instance) {
      GenealogySystemRegistry.instance = new GenealogySystemRegistry();
    }
    return GenealogySystemRegistry.instance;
  }

  /**
   * Initialize the registry with known execution files
   */
  private initializeExecutionFiles(): void {
    this.executionFiles = [
      {
        name: 'Binary Plan Simulator',
        path: 'genealogy-simulator/models.go',
        type: 'simulator',
        description: 'Implements binary tree logic with left-to-right filling',
        genealogy_types: ['Binary Plan'],
        dependencies: ['time', 'database/sql'],
        functions: ['NewBinaryPlanSimulator', 'Simulate', 'createNode', 'countChildren', 'buildTreeStructure']
      },
      {
        name: 'Matrix Plan Simulator',
        path: 'genealogy-simulator/matrix_plan.go',
        type: 'simulator',
        description: 'Implements matrix plan with strict child limits and spillover',
        genealogy_types: ['Matrix Plan'],
        dependencies: ['time'],
        functions: ['NewMatrixPlanSimulator', 'Simulate', 'createNode', 'countChildren', 'buildTreeStructure']
      },
      {
        name: 'Unilevel Plan Simulator',
        path: 'genealogy-simulator/unilevel_plan.go',
        type: 'simulator',
        description: 'Implements unilevel plan with flexible distribution',
        genealogy_types: ['Unilevel Plan'],
        dependencies: ['time'],
        functions: ['NewUnilevelPlanSimulator', 'Simulate', 'createNode', 'countChildren', 'buildTreeStructure']
      },
      {
        name: 'Genealogy Handlers',
        path: 'genealogy-simulator/genealogy_handlers.go',
        type: 'handler',
        description: 'HTTP handlers for genealogy operations',
        genealogy_types: ['Binary Plan', 'Matrix Plan', 'Unilevel Plan'],
        dependencies: ['database/sql', 'encoding/json', 'net/http', 'log'],
        functions: ['handleGenerateUsers', 'handleGetDownlineUsers', 'handleGetUplineUsers', 'handleGetGenealogyStructure', 'handleAddUserToGenealogy']
      },
      {
        name: 'Main Handlers',
        path: 'genealogy-simulator/handlers.go',
        type: 'handler',
        description: 'Main HTTP handlers and simulation logic',
        genealogy_types: ['Binary Plan', 'Matrix Plan', 'Unilevel Plan'],
        dependencies: ['database/sql', 'encoding/json', 'net/http', 'log', 'github.com/google/uuid'],
        functions: ['handleGetGenealogyTypes', 'handleSimulation', 'handleSaveSimulation', 'getGenealogyTypeByID']
      },
      {
        name: 'Genealogy API Routes',
        path: 'app/api/genealogy/',
        type: 'api',
        description: 'Next.js API routes for genealogy operations',
        genealogy_types: ['Binary Plan', 'Matrix Plan', 'Unilevel Plan'],
        dependencies: ['next/server', 'lib/db'],
        functions: ['generate-users', 'downline', 'upline', 'structure', 'add-user', 'simulate', 'types']
      },
      {
        name: 'Database Migration System',
        path: 'database/',
        type: 'utility',
        description: 'Database migrations and schema for genealogy system',
        genealogy_types: ['Binary Plan', 'Matrix Plan', 'Unilevel Plan'],
        dependencies: ['PostgreSQL'],
        functions: ['migration_system.sql', 'migration_genealogy_types_secure.sql', 'backup_genealogy_types.sql']
      }
    ];
  }

  /**
   * Load genealogy types from the database
   */
  public async loadGenealogyTypes(): Promise<void> {
    try {
      const response = await fetch('/api/genealogy/types');
      if (response.ok) {
        this.genealogyTypes = await response.json();
      } else {
        console.error('Failed to load genealogy types:', response.statusText);
      }
    } catch (error) {
      console.error('Error loading genealogy types:', error);
    }
  }

  /**
   * Get all genealogy types
   */
  public getGenealogyTypes(): GenealogyType[] {
    return this.genealogyTypes;
  }

  /**
   * Get genealogy type by name
   */
  public getGenealogyTypeByName(name: string): GenealogyType | undefined {
    return this.genealogyTypes.find(type => type.name === name);
  }

  /**
   * Get genealogy type by ID
   */
  public getGenealogyTypeById(id: number): GenealogyType | undefined {
    return this.genealogyTypes.find(type => type.id === id);
  }

  /**
   * Get genealogy type by plan type
   */
  public getGenealogyTypeByPlanType(planType: string): GenealogyType | undefined {
    return this.genealogyTypes.find(type => type.rules.type === planType);
  }

  /**
   * Get all execution files
   */
  public getExecutionFiles(): GenealogyExecutionFile[] {
    return this.executionFiles;
  }

  /**
   * Get execution files by type
   */
  public getExecutionFilesByType(type: 'simulator' | 'handler' | 'api' | 'utility'): GenealogyExecutionFile[] {
    return this.executionFiles.filter(file => file.type === type);
  }

  /**
   * Get execution files for a specific genealogy type
   */
  public getExecutionFilesForGenealogyType(genealogyTypeName: string): GenealogyExecutionFile[] {
    return this.executionFiles.filter(file => 
      file.genealogy_types.includes(genealogyTypeName)
    );
  }

  /**
   * Get execution files by function name
   */
  public getExecutionFilesByFunction(functionName: string): GenealogyExecutionFile[] {
    return this.executionFiles.filter(file => 
      file.functions.includes(functionName)
    );
  }

  /**
   * Check system health and status
   */
  public async checkSystemStatus(): Promise<GenealogySystemStatus> {
    try {
      const response = await fetch('/api/genealogy/system-status');
      if (response.ok) {
        this.systemStatus = await response.json();
      } else {
        this.systemStatus = {
          system_available: false,
          genealogy_types_count: 0,
          active_types_count: 0,
          execution_files_count: this.executionFiles.length,
          last_health_check: new Date().toISOString(),
          migration_status: 'unknown'
        };
      }
    } catch (error) {
      console.error('Error checking system status:', error);
      this.systemStatus = {
        system_available: false,
        genealogy_types_count: 0,
        active_types_count: 0,
        execution_files_count: this.executionFiles.length,
        last_health_check: new Date().toISOString(),
        migration_status: 'unknown'
      };
    }
    return this.systemStatus!;
  }

  /**
   * Get system status (cached)
   */
  public getSystemStatus(): GenealogySystemStatus | null {
    return this.systemStatus;
  }

  /**
   * Validate genealogy plan rules
   */
  public validateGenealogyPlanRules(rules: GenealogyPlanRule): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required fields
    if (!rules.type) errors.push('Missing plan type');
    if (!rules.max_children || rules.max_children <= 0) errors.push('Invalid max_children');
    if (!rules.child_positions || rules.child_positions.length === 0) errors.push('Missing child_positions');

    // Validate plan type
    if (rules.type && !['binary', 'matrix', 'unilevel'].includes(rules.type)) {
      errors.push('Invalid plan type. Must be binary, matrix, or unilevel');
    }

    // Plan-specific validations
    if (rules.type === 'binary') {
      if (rules.max_children !== 2) {
        errors.push('Binary plan must have exactly 2 max_children');
      }
      if (rules.child_positions.length !== 2) {
        errors.push('Binary plan must have exactly 2 child_positions');
      }
      if (!rules.child_positions.includes('left') || !rules.child_positions.includes('right')) {
        errors.push('Binary plan must have "left" and "right" child_positions');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get available genealogy plan types for new features
   */
  public getAvailablePlanTypes(): Array<{ id: number; name: string; type: string; description: string }> {
    return this.genealogyTypes
      .filter(type => type.is_active)
      .map(type => ({
        id: type.id,
        name: type.name,
        type: type.rules.type,
        description: type.description
      }));
  }

  /**
   * Get execution file information for integration
   */
  public getIntegrationInfo(): {
    genealogy_types: GenealogyType[];
    execution_files: GenealogyExecutionFile[];
    system_status: GenealogySystemStatus | null;
  } {
    return {
      genealogy_types: this.genealogyTypes,
      execution_files: this.executionFiles,
      system_status: this.systemStatus
    };
  }

  /**
   * Export genealogy system configuration
   */
  public exportConfiguration(): {
    version: string;
    timestamp: string;
    genealogy_types: GenealogyType[];
    execution_files: GenealogyExecutionFile[];
    system_status: GenealogySystemStatus | null;
  } {
    return {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      genealogy_types: this.genealogyTypes,
      execution_files: this.executionFiles,
      system_status: this.systemStatus
    };
  }
}

/**
 * Utility functions for genealogy system integration
 */
export class GenealogySystemUtils {
  /**
   * Check if genealogy system is available
   */
  public static async isSystemAvailable(): Promise<boolean> {
    try {
      const registry = GenealogySystemRegistry.getInstance();
      const status = await registry.checkSystemStatus();
      return status.system_available;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get genealogy type for a specific plan
   */
  public static async getGenealogyTypeForPlan(planType: string): Promise<GenealogyType | null> {
    try {
      const registry = GenealogySystemRegistry.getInstance();
      await registry.loadGenealogyTypes();
      return registry.getGenealogyTypeByPlanType(planType) || null;
    } catch (error) {
      console.error('Error getting genealogy type for plan:', error);
      return null;
    }
  }

  /**
   * Get execution files for integration
   */
  public static getExecutionFilesForIntegration(): GenealogyExecutionFile[] {
    const registry = GenealogySystemRegistry.getInstance();
    return registry.getExecutionFiles();
  }

  /**
   * Validate genealogy plan rules
   */
  public static validateRules(rules: GenealogyPlanRule): { valid: boolean; errors: string[] } {
    const registry = GenealogySystemRegistry.getInstance();
    return registry.validateGenealogyPlanRules(rules);
  }
}

// Export singleton instance
export const genealogySystemRegistry = GenealogySystemRegistry.getInstance(); 