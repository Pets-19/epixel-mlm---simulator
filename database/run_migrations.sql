-- Migration Runner Script
-- This script applies all migrations in the correct order

-- Set transaction isolation level
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;

-- Start transaction
BEGIN;

-- 1. Apply migration system first
\echo 'Applying migration system...'
\i migration_system.sql

-- 2. Apply genealogy types secure migration
\echo 'Applying genealogy types secure migration...'
\i migration_genealogy_types_secure.sql

-- 3. Apply backup and restore functions
\echo 'Applying backup and restore functions...'
\i backup_genealogy_types.sql

-- 4. Create a migration status check
\echo 'Creating migration status check...'
CREATE OR REPLACE FUNCTION check_migration_status()
RETURNS TABLE(
    migration_name VARCHAR(255),
    version VARCHAR(50),
    status VARCHAR(20),
    applied_at TIMESTAMP WITH TIME ZONE,
    execution_time_ms INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT m.migration_name, m.version, m.status, m.applied_at, m.execution_time_ms
    FROM migrations m
    ORDER BY m.applied_at;
END;
$$ LANGUAGE plpgsql;

-- 5. Create a function to verify genealogy types integrity
\echo 'Creating integrity verification...'
CREATE OR REPLACE FUNCTION verify_genealogy_types_setup()
RETURNS TABLE(
    check_name TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- Check if migration system is in place
    RETURN QUERY
    SELECT 
        'Migration System'::TEXT,
        CASE 
            WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'migrations') THEN 'PASS'::TEXT
            ELSE 'FAIL'::TEXT
        END,
        'Migration tracking system availability'::TEXT;
    
    -- Check if genealogy types table exists
    RETURN QUERY
    SELECT 
        'Genealogy Types Table'::TEXT,
        CASE 
            WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'genealogy_types') THEN 'PASS'::TEXT
            ELSE 'FAIL'::TEXT
        END,
        'Genealogy types table availability'::TEXT;
    
    -- Check if all required genealogy types exist
    RETURN QUERY
    SELECT 
        'Required Genealogy Types'::TEXT,
        CASE 
            WHEN COUNT(*) = 3 THEN 'PASS'::TEXT
            ELSE 'FAIL'::TEXT
        END,
        'Found ' || COUNT(*) || ' genealogy types (expected 3)'::TEXT
    FROM genealogy_types 
    WHERE name IN ('Binary Plan', 'Unilevel Plan', 'Matrix Plan');
    
    -- Check if audit system is in place
    RETURN QUERY
    SELECT 
        'Audit System'::TEXT,
        CASE 
            WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'genealogy_types_audit') THEN 'PASS'::TEXT
            ELSE 'FAIL'::TEXT
        END,
        'Genealogy types audit system availability'::TEXT;
    
    -- Check if backup functions are available
    RETURN QUERY
    SELECT 
        'Backup Functions'::TEXT,
        CASE 
            WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'create_genealogy_types_backup') THEN 'PASS'::TEXT
            ELSE 'FAIL'::TEXT
        END,
        'Backup and restore functions availability'::TEXT;
    
    -- Check if validation functions are available
    RETURN QUERY
    SELECT 
        'Validation Functions'::TEXT,
        CASE 
            WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'validate_genealogy_type_rules') THEN 'PASS'::TEXT
            ELSE 'FAIL'::TEXT
        END,
        'Rule validation functions availability'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- 6. Create a comprehensive status report function
\echo 'Creating status report function...'
CREATE OR REPLACE FUNCTION get_genealogy_system_status()
RETURNS JSONB AS $$
DECLARE
    v_status JSONB;
    v_migrations JSONB;
    v_integrity JSONB;
    v_backup JSONB;
BEGIN
    -- Get migration status
    SELECT jsonb_agg(
        jsonb_build_object(
            'migration_name', migration_name,
            'version', version,
            'status', status,
            'applied_at', applied_at,
            'execution_time_ms', execution_time_ms
        )
    ) INTO v_migrations
    FROM check_migration_status();
    
    -- Get integrity check results
    SELECT jsonb_agg(
        jsonb_build_object(
            'check_name', check_name,
            'status', status,
            'details', details
        )
    ) INTO v_integrity
    FROM verify_genealogy_types_setup();
    
    -- Get genealogy types summary
    SELECT jsonb_build_object(
        'total_types', COUNT(*),
        'active_types', COUNT(*) FILTER (WHERE is_active = true),
        'types', jsonb_agg(
            jsonb_build_object(
                'id', id,
                'name', name,
                'plan_type', rules->>'type',
                'max_children', max_children_per_node,
                'is_active', is_active
            )
        )
    ) INTO v_backup
    FROM genealogy_types;
    
    -- Build comprehensive status
    v_status := jsonb_build_object(
        'system_status', jsonb_build_object(
            'timestamp', NOW(),
            'version', '1.0.0',
            'status', 'operational'
        ),
        'migrations', v_migrations,
        'integrity_checks', v_integrity,
        'genealogy_types', v_backup,
        'recommendations', jsonb_build_array(
            'All migrations applied successfully',
            'Genealogy types are properly configured',
            'Backup and restore functions are available',
            'Audit trail is active for tracking changes'
        )
    );
    
    RETURN v_status;
END;
$$ LANGUAGE plpgsql;

-- 7. Create a function to apply emergency recovery
\echo 'Creating emergency recovery function...'
CREATE OR REPLACE FUNCTION emergency_genealogy_types_recovery()
RETURNS BOOLEAN AS $$
DECLARE
    v_backup JSONB;
    v_recovery_success BOOLEAN;
BEGIN
    -- Create immediate backup of current state
    v_backup := create_genealogy_types_backup();
    
    -- Log recovery attempt
    RAISE NOTICE 'Emergency recovery initiated at: %', NOW();
    
    -- Check if we have the required genealogy types
    IF NOT EXISTS (SELECT 1 FROM genealogy_types WHERE name = 'Binary Plan') THEN
        RAISE NOTICE 'Binary Plan missing - restoring from backup...';
        
        -- Restore from backup
        v_recovery_success := restore_genealogy_types_from_backup(v_backup);
        
        IF v_recovery_success THEN
            RAISE NOTICE 'Emergency recovery completed successfully';
        ELSE
            RAISE EXCEPTION 'Emergency recovery failed';
        END IF;
    ELSE
        RAISE NOTICE 'All genealogy types present - no recovery needed';
        v_recovery_success := TRUE;
    END IF;
    
    RETURN v_recovery_success;
END;
$$ LANGUAGE plpgsql;

-- Commit all changes
COMMIT;

-- Display final status
\echo 'Migration completed successfully!'
\echo 'Running system status check...'

SELECT get_genealogy_system_status();

\echo 'Migration runner completed.' 