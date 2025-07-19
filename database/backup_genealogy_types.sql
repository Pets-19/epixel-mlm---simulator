-- Backup and Restore Script for Genealogy Types
-- This ensures genealogy plan rules are never lost

-- Function to create a comprehensive backup of genealogy types
CREATE OR REPLACE FUNCTION create_genealogy_types_backup()
RETURNS JSONB AS $$
DECLARE
    v_backup JSONB;
    v_backup_info JSONB;
BEGIN
    -- Create backup with metadata
    SELECT jsonb_build_object(
        'backup_metadata', jsonb_build_object(
            'created_at', NOW(),
            'backup_type', 'genealogy_types',
            'version', '1.0.0',
            'description', 'Complete backup of genealogy plan types and rules'
        ),
        'genealogy_types', jsonb_agg(
            jsonb_build_object(
                'id', id,
                'name', name,
                'description', description,
                'max_children_per_node', max_children_per_node,
                'rules', rules,
                'is_active', is_active,
                'created_at', created_at,
                'updated_at', updated_at
            )
        ),
        'audit_trail', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'genealogy_type_id', genealogy_type_id,
                    'action', action,
                    'old_data', old_data,
                    'new_data', new_data,
                    'changed_at', changed_at,
                    'changed_by', changed_by
                )
            )
            FROM (
                SELECT id, genealogy_type_id, action, old_data, new_data, changed_at, changed_by
                FROM genealogy_types_audit
                ORDER BY changed_at DESC
                LIMIT 1000
            ) recent_audit
        )
    ) INTO v_backup
    FROM genealogy_types;
    
    RETURN v_backup;
END;
$$ LANGUAGE plpgsql;

-- Function to restore genealogy types from backup
CREATE OR REPLACE FUNCTION restore_genealogy_types_from_backup(p_backup JSONB)
RETURNS BOOLEAN AS $$
DECLARE
    v_type JSONB;
    v_audit_record JSONB;
    v_backup_metadata JSONB;
BEGIN
    -- Extract backup metadata
    v_backup_metadata := p_backup->'backup_metadata';
    
    -- Log backup restoration
    RAISE NOTICE 'Restoring genealogy types from backup created at: %', v_backup_metadata->>'created_at';
    
    -- Start transaction
    BEGIN
        -- Clear existing audit trail (optional - comment out if you want to preserve)
        -- DELETE FROM genealogy_types_audit;
        
        -- Clear existing genealogy types
        DELETE FROM genealogy_types;
        
        -- Restore genealogy types
        FOR v_type IN SELECT * FROM jsonb_array_elements(p_backup->'genealogy_types')
        LOOP
            INSERT INTO genealogy_types (
                id, name, description, max_children_per_node, 
                rules, is_active, created_at, updated_at
            ) VALUES (
                (v_type->>'id')::INTEGER,
                v_type->>'name',
                v_type->>'description',
                (v_type->>'max_children_per_node')::INTEGER,
                v_type->'rules',
                (v_type->>'is_active')::BOOLEAN,
                (v_type->>'created_at')::TIMESTAMP WITH TIME ZONE,
                (v_type->>'updated_at')::TIMESTAMP WITH TIME ZONE
            );
            
            RAISE NOTICE 'Restored genealogy type: %', v_type->>'name';
        END LOOP;
        
        -- Restore audit trail (optional - comment out if you want to preserve existing)
        -- FOR v_audit_record IN SELECT * FROM jsonb_array_elements(p_backup->'audit_trail')
        -- LOOP
        --     INSERT INTO genealogy_types_audit (
        --         genealogy_type_id, action, old_data, new_data, changed_at, changed_by
        --     ) VALUES (
        --         (v_audit_record->>'genealogy_type_id')::INTEGER,
        --         v_audit_record->>'action',
        --         v_audit_record->'old_data',
        --         v_audit_record->'new_data',
        --         (v_audit_record->>'changed_at')::TIMESTAMP WITH TIME ZONE,
        --         v_audit_record->>'changed_by'
        --     );
        -- END LOOP;
        
        RAISE NOTICE 'Successfully restored % genealogy types', jsonb_array_length(p_backup->'genealogy_types');
        RETURN TRUE;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to restore genealogy types: %', SQLERRM;
    END;
END;
$$ LANGUAGE plpgsql;

-- Function to export genealogy types to file (for external backup)
CREATE OR REPLACE FUNCTION export_genealogy_types_to_file(p_file_path TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_backup JSONB;
BEGIN
    -- Create backup
    v_backup := create_genealogy_types_backup();
    
    -- Write to file (requires superuser privileges)
    PERFORM pg_write_file(p_file_path, v_backup::text);
    
    RAISE NOTICE 'Genealogy types exported to: %', p_file_path;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to import genealogy types from file
CREATE OR REPLACE FUNCTION import_genealogy_types_from_file(p_file_path TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_backup JSONB;
    v_file_content TEXT;
BEGIN
    -- Read from file (requires superuser privileges)
    v_file_content := pg_read_file(p_file_path);
    v_backup := v_file_content::jsonb;
    
    -- Restore from backup
    RETURN restore_genealogy_types_from_backup(v_backup);
END;
$$ LANGUAGE plpgsql;

-- Function to validate genealogy types integrity
CREATE OR REPLACE FUNCTION validate_genealogy_types_integrity()
RETURNS TABLE(
    check_name TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- Check if all required genealogy types exist
    RETURN QUERY
    SELECT 
        'Required Types Check'::TEXT,
        CASE 
            WHEN COUNT(*) = 3 THEN 'PASS'::TEXT
            ELSE 'FAIL'::TEXT
        END,
        'Found ' || COUNT(*) || ' genealogy types (expected 3)'::TEXT
    FROM genealogy_types 
    WHERE name IN ('Binary Plan', 'Unilevel Plan', 'Matrix Plan');
    
    -- Check if all types have valid rules
    RETURN QUERY
    SELECT 
        'Rules Validation'::TEXT,
        CASE 
            WHEN COUNT(*) = 0 THEN 'PASS'::TEXT
            ELSE 'FAIL'::TEXT
        END,
        'Found ' || COUNT(*) || ' types with invalid rules'::TEXT
    FROM genealogy_types 
    WHERE NOT validate_genealogy_type_rules(rules);
    
    -- Check if all types are active
    RETURN QUERY
    SELECT 
        'Active Status Check'::TEXT,
        CASE 
            WHEN COUNT(*) = 3 THEN 'PASS'::TEXT
            ELSE 'FAIL'::TEXT
        END,
        'Found ' || COUNT(*) || ' active types (expected 3)'::TEXT
    FROM genealogy_types 
    WHERE is_active = true AND name IN ('Binary Plan', 'Unilevel Plan', 'Matrix Plan');
    
    -- Check for duplicate names
    RETURN QUERY
    SELECT 
        'Duplicate Names Check'::TEXT,
        CASE 
            WHEN COUNT(*) = 0 THEN 'PASS'::TEXT
            ELSE 'FAIL'::TEXT
        END,
        'Found ' || COUNT(*) || ' duplicate names'::TEXT
    FROM (
        SELECT name, COUNT(*) 
        FROM genealogy_types 
        GROUP BY name 
        HAVING COUNT(*) > 1
    ) duplicates;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled backup function (can be called by cron or application)
CREATE OR REPLACE FUNCTION schedule_genealogy_types_backup()
RETURNS JSONB AS $$
DECLARE
    v_backup JSONB;
    v_backup_id VARCHAR(50);
BEGIN
    -- Generate backup ID
    v_backup_id := 'backup_' || to_char(NOW(), 'YYYYMMDD_HH24MISS');
    
    -- Create backup
    v_backup := create_genealogy_types_backup();
    
    -- Store backup in a backup table (optional)
    -- INSERT INTO genealogy_types_backups (backup_id, backup_data, created_at)
    -- VALUES (v_backup_id, v_backup, NOW());
    
    RAISE NOTICE 'Scheduled backup created with ID: %', v_backup_id;
    
    RETURN jsonb_build_object(
        'backup_id', v_backup_id,
        'backup_data', v_backup,
        'created_at', NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- Example usage functions
-- SELECT create_genealogy_types_backup(); -- Create backup
-- SELECT validate_genealogy_types_integrity(); -- Validate integrity
-- SELECT schedule_genealogy_types_backup(); -- Schedule backup 