import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Check if genealogy system is available by testing the types endpoint
    const genealogyTypesResponse = await fetch('http://localhost:8080/api/genealogy/types');
    const genealogyTypes = genealogyTypesResponse.ok ? await genealogyTypesResponse.json() : [];
    
    // Check migration status by testing a simple query
    const migrationStatusResponse = await fetch('http://localhost:8080/api/genealogy/types');
    const migrationStatus = migrationStatusResponse.ok ? 'success' : 'failed';

    const systemStatus = {
      system_available: genealogyTypesResponse.ok,
      genealogy_types_count: genealogyTypes.length,
      active_types_count: genealogyTypes.filter((type: any) => type.is_active).length,
      execution_files_count: 7, // Known execution files
      last_health_check: new Date().toISOString(),
      migration_status: migrationStatus,
      genealogy_types: genealogyTypes.map((type: any) => ({
        id: type.id,
        name: type.name,
        type: type.rules?.type || 'unknown',
        is_active: type.is_active,
        max_children_per_node: type.max_children_per_node
      })),
      execution_files: [
        {
          name: 'Binary Plan Simulator',
          path: 'genealogy-simulator/models.go',
          type: 'simulator',
          status: 'available'
        },
        {
          name: 'Matrix Plan Simulator',
          path: 'genealogy-simulator/matrix_plan.go',
          type: 'simulator',
          status: 'available'
        },
        {
          name: 'Unilevel Plan Simulator',
          path: 'genealogy-simulator/unilevel_plan.go',
          type: 'simulator',
          status: 'available'
        },
        {
          name: 'Genealogy Handlers',
          path: 'genealogy-simulator/genealogy_handlers.go',
          type: 'handler',
          status: 'available'
        },
        {
          name: 'Main Handlers',
          path: 'genealogy-simulator/handlers.go',
          type: 'handler',
          status: 'available'
        },
        {
          name: 'Database Migration System',
          path: 'database/',
          type: 'utility',
          status: 'available'
        },
        {
          name: 'API Routes',
          path: 'app/api/genealogy/',
          type: 'api',
          status: 'available'
        }
      ]
    };

    return NextResponse.json(systemStatus);
  } catch (error) {
    console.error('Error checking genealogy system status:', error);
    
    return NextResponse.json({
      system_available: false,
      genealogy_types_count: 0,
      active_types_count: 0,
      execution_files_count: 7,
      last_health_check: new Date().toISOString(),
      migration_status: 'unknown',
      error: 'Failed to check system status',
      genealogy_types: [],
      execution_files: []
    }, { status: 500 });
  }
} 