-- Migration System for MLM Tools Database
-- This ensures all database changes are tracked and can be replayed

-- Create migration tracking table
CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) UNIQUE NOT NULL,
    version VARCHAR(50) NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    checksum VARCHAR(64) NOT NULL,
    execution_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'failed', 'rolled_back')),
    rollback_sql TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient migration lookups
CREATE INDEX IF NOT EXISTS idx_migrations_name ON migrations(migration_name);
CREATE INDEX IF NOT EXISTS idx_migrations_version ON migrations(version);
CREATE INDEX IF NOT EXISTS idx_migrations_applied_at ON migrations(applied_at);

-- Function to calculate checksum for migration content
CREATE OR REPLACE FUNCTION calculate_migration_checksum(migration_content TEXT)
RETURNS VARCHAR(64) AS $$
BEGIN
    -- Simple hash function - in production, use a proper cryptographic hash
    RETURN encode(sha256(migration_content::bytea), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function to apply migration
CREATE OR REPLACE FUNCTION apply_migration(
    p_migration_name VARCHAR(255),
    p_version VARCHAR(50),
    p_migration_sql TEXT,
    p_rollback_sql TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_checksum VARCHAR(64);
    v_start_time TIMESTAMP;
    v_execution_time_ms INTEGER;
    v_migration_id INTEGER;
BEGIN
    -- Check if migration already applied
    IF EXISTS (SELECT 1 FROM migrations WHERE migration_name = p_migration_name) THEN
        RAISE NOTICE 'Migration % already applied', p_migration_name;
        RETURN TRUE;
    END IF;

    -- Calculate checksum
    v_checksum := calculate_migration_checksum(p_migration_sql);
    v_start_time := NOW();

    -- Insert migration record with 'applying' status
    INSERT INTO migrations (migration_name, version, checksum, status, rollback_sql)
    VALUES (p_migration_name, p_version, v_checksum, 'applying', p_rollback_sql)
    RETURNING id INTO v_migration_id;

    -- Execute migration
    BEGIN
        EXECUTE p_migration_sql;
        
        -- Calculate execution time
        v_execution_time_ms := EXTRACT(EPOCH FROM (NOW() - v_start_time)) * 1000;
        
        -- Update migration status to success
        UPDATE migrations 
        SET status = 'success', execution_time_ms = v_execution_time_ms
        WHERE id = v_migration_id;
        
        RAISE NOTICE 'Migration % applied successfully in % ms', p_migration_name, v_execution_time_ms;
        RETURN TRUE;
        
    EXCEPTION WHEN OTHERS THEN
        -- Update migration status to failed
        UPDATE migrations 
        SET status = 'failed'
        WHERE id = v_migration_id;
        
        RAISE EXCEPTION 'Migration % failed: %', p_migration_name, SQLERRM;
    END;
END;
$$ LANGUAGE plpgsql;

-- Function to rollback migration
CREATE OR REPLACE FUNCTION rollback_migration(p_migration_name VARCHAR(255))
RETURNS BOOLEAN AS $$
DECLARE
    v_rollback_sql TEXT;
    v_migration_id INTEGER;
BEGIN
    -- Get migration details
    SELECT id, rollback_sql INTO v_migration_id, v_rollback_sql
    FROM migrations 
    WHERE migration_name = p_migration_name AND status = 'success';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Migration % not found or not successfully applied', p_migration_name;
    END IF;
    
    IF v_rollback_sql IS NULL THEN
        RAISE EXCEPTION 'No rollback SQL provided for migration %', p_migration_name;
    END IF;
    
    -- Execute rollback
    BEGIN
        EXECUTE v_rollback_sql;
        
        -- Update migration status to rolled_back
        UPDATE migrations 
        SET status = 'rolled_back'
        WHERE id = v_migration_id;
        
        RAISE NOTICE 'Migration % rolled back successfully', p_migration_name;
        RETURN TRUE;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Rollback of migration % failed: %', p_migration_name, SQLERRM;
    END;
END;
$$ LANGUAGE plpgsql;

-- Function to get migration status
CREATE OR REPLACE FUNCTION get_migration_status(p_migration_name VARCHAR(255))
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
    WHERE m.migration_name = p_migration_name;
END;
$$ LANGUAGE plpgsql;

-- Function to list all migrations
CREATE OR REPLACE FUNCTION list_migrations()
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

-- Create backup function for critical data
CREATE OR REPLACE FUNCTION backup_genealogy_types()
RETURNS JSONB AS $$
DECLARE
    v_backup JSONB;
BEGIN
    SELECT jsonb_agg(
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
    ) INTO v_backup
    FROM genealogy_types;
    
    RETURN v_backup;
END;
$$ LANGUAGE plpgsql;

-- Create restore function for critical data
CREATE OR REPLACE FUNCTION restore_genealogy_types(p_backup JSONB)
RETURNS BOOLEAN AS $$
DECLARE
    v_type JSONB;
BEGIN
    -- Clear existing data
    DELETE FROM genealogy_types;
    
    -- Restore from backup
    FOR v_type IN SELECT * FROM jsonb_array_elements(p_backup)
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
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to log genealogy type changes
CREATE TABLE IF NOT EXISTS genealogy_types_audit (
    id SERIAL PRIMARY KEY,
    genealogy_type_id INTEGER NOT NULL,
    action VARCHAR(10) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    changed_by VARCHAR(255) DEFAULT current_user
);

CREATE INDEX IF NOT EXISTS idx_genealogy_types_audit_type_id ON genealogy_types_audit(genealogy_type_id);
CREATE INDEX IF NOT EXISTS idx_genealogy_types_audit_changed_at ON genealogy_types_audit(changed_at);

-- Function to handle genealogy type audit
CREATE OR REPLACE FUNCTION audit_genealogy_types()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO genealogy_types_audit (genealogy_type_id, action, new_data)
        VALUES (NEW.id, 'INSERT', to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO genealogy_types_audit (genealogy_type_id, action, old_data, new_data)
        VALUES (NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO genealogy_types_audit (genealogy_type_id, action, old_data)
        VALUES (OLD.id, 'DELETE', to_jsonb(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create audit trigger
CREATE TRIGGER trigger_genealogy_types_audit
    AFTER INSERT OR UPDATE OR DELETE ON genealogy_types
    FOR EACH ROW
    EXECUTE FUNCTION audit_genealogy_types();

-- Insert initial migration system migration
INSERT INTO migrations (migration_name, version, checksum, status)
VALUES (
    '001_create_migration_system',
    '1.0.0',
    calculate_migration_checksum('Migration system creation'),
    'success'
) ON CONFLICT (migration_name) DO NOTHING; 