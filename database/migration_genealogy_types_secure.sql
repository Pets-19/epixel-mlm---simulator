-- Secure Migration for Genealogy Types with Rollback Support
-- This migration ensures genealogy plan rules are never lost

-- Migration: 002_create_genealogy_types_secure
-- Version: 1.0.0
-- Description: Creates genealogy types table with comprehensive rules and audit trail

-- Apply migration using the migration system
SELECT apply_migration(
    '002_create_genealogy_types_secure',
    '1.0.0',
    $MIGRATION_SQL$
    
    -- Create genealogy_types table with enhanced structure
    CREATE TABLE IF NOT EXISTS genealogy_types (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        max_children_per_node INTEGER NOT NULL DEFAULT 2,
        rules JSONB NOT NULL DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        -- Add constraints for data integrity
        CONSTRAINT chk_max_children_positive CHECK (max_children_per_node > 0),
        CONSTRAINT chk_rules_not_empty CHECK (jsonb_typeof(rules) = 'object'),
        CONSTRAINT chk_name_not_empty CHECK (length(trim(name)) > 0)
    );

    -- Create indexes for performance
    CREATE INDEX IF NOT EXISTS idx_genealogy_types_name ON genealogy_types(name);
    CREATE INDEX IF NOT EXISTS idx_genealogy_types_active ON genealogy_types(is_active);
    CREATE INDEX IF NOT EXISTS idx_genealogy_types_rules ON genealogy_types USING GIN (rules);

    -- Create trigger to update updated_at timestamp
    CREATE TRIGGER update_genealogy_types_updated_at 
        BEFORE UPDATE ON genealogy_types 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();

    -- Insert Binary Plan with comprehensive rules
    INSERT INTO genealogy_types (name, description, max_children_per_node, rules) 
    VALUES (
        'Binary Plan',
        'Binary tree structure where each node can have maximum 2 child nodes. Nodes are filled from top to bottom, left to right.',
        2,
        '{
            "type": "binary",
            "filling_order": "left_to_right",
            "max_children": 2,
            "child_positions": ["left", "right"],
            "description": "Each parent node can have maximum 2 children. New nodes are placed in left position first, then right position.",
            "spillover_rules": {
                "enabled": false,
                "description": "Binary plan does not use spillover - strict 2 children per parent"
            },
            "validation_rules": {
                "max_depth": null,
                "max_width": null,
                "balanced_tree": true
            },
            "simulation_settings": {
                "default_cycle_type": "weekly",
                "default_cycles": 12,
                "default_users_per_cycle": 100
            }
        }'
    ) ON CONFLICT (name) DO UPDATE SET
        description = EXCLUDED.description,
        max_children_per_node = EXCLUDED.max_children_per_node,
        rules = EXCLUDED.rules,
        updated_at = NOW();

    -- Insert Unilevel Plan with comprehensive rules
    INSERT INTO genealogy_types (name, description, max_children_per_node, rules) 
    VALUES (
        'Unilevel Plan',
        'Unilevel plan allows unlimited children per parent node, but Max Children Count is used as an average for filling and spilling. If a parent reaches Max Children Count, new children spill to the next available downline node.',
        10,
        '{
            "type": "unilevel",
            "filling_order": "depth_first",
            "max_children": 10,
            "child_positions": ["child"],
            "description": "No strict limit per parent, but Max Children Count is used as an average for filling/spilling.",
            "spillover_rules": {
                "enabled": true,
                "method": "next_available_downline",
                "description": "When parent reaches max children, new children spill to next available downline node"
            },
            "validation_rules": {
                "max_depth": null,
                "max_width": null,
                "balanced_tree": false
            },
            "simulation_settings": {
                "default_cycle_type": "weekly",
                "default_cycles": 12,
                "default_users_per_cycle": 100,
                "spillover_threshold": 0.8
            }
        }'
    ) ON CONFLICT (name) DO UPDATE SET
        description = EXCLUDED.description,
        max_children_per_node = EXCLUDED.max_children_per_node,
        rules = EXCLUDED.rules,
        updated_at = NOW();

    -- Insert Matrix Plan with comprehensive rules
    INSERT INTO genealogy_types (name, description, max_children_per_node, rules) 
    VALUES (
        'Matrix Plan',
        'Matrix plan restricts the number of children per parent node to Max Children Count. If a parent reaches this limit, new children spill to the next available downline node.',
        3,
        '{
            "type": "matrix",
            "filling_order": "breadth_first",
            "max_children": 3,
            "child_positions": ["child"],
            "description": "Strict limit per parent, Max Children Count controls filling/spilling.",
            "spillover_rules": {
                "enabled": true,
                "method": "next_available_downline",
                "description": "When parent reaches max children, new children spill to next available downline node"
            },
            "validation_rules": {
                "max_depth": null,
                "max_width": 3,
                "balanced_tree": true
            },
            "simulation_settings": {
                "default_cycle_type": "weekly",
                "default_cycles": 12,
                "default_users_per_cycle": 100,
                "spillover_threshold": 1.0
            }
        }'
    ) ON CONFLICT (name) DO UPDATE SET
        description = EXCLUDED.description,
        max_children_per_node = EXCLUDED.max_children_per_node,
        rules = EXCLUDED.rules,
        updated_at = NOW();

    -- Create view for easy access to genealogy type rules
    CREATE OR REPLACE VIEW genealogy_types_rules_view AS
    SELECT 
        id,
        name,
        description,
        max_children_per_node,
        rules->>'type' as plan_type,
        rules->>'filling_order' as filling_order,
        (rules->>'max_children')::int as max_children,
        rules->'child_positions' as child_positions,
        rules->'spillover_rules' as spillover_rules,
        rules->'validation_rules' as validation_rules,
        rules->'simulation_settings' as simulation_settings,
        is_active,
        created_at,
        updated_at
    FROM genealogy_types
    WHERE is_active = true;

    -- Create function to validate genealogy type rules
    CREATE OR REPLACE FUNCTION validate_genealogy_type_rules(p_rules JSONB)
    RETURNS BOOLEAN AS $$
    DECLARE
        v_plan_type VARCHAR(50);
        v_max_children INTEGER;
        v_child_positions JSONB;
    BEGIN
        -- Check required fields
        IF NOT (p_rules ? 'type' AND p_rules ? 'max_children' AND p_rules ? 'child_positions') THEN
            RAISE EXCEPTION 'Missing required fields: type, max_children, child_positions';
        END IF;

        -- Get values
        v_plan_type := p_rules->>'type';
        v_max_children := (p_rules->>'max_children')::INTEGER;
        v_child_positions := p_rules->'child_positions';

        -- Validate plan type
        IF v_plan_type NOT IN ('binary', 'unilevel', 'matrix') THEN
            RAISE EXCEPTION 'Invalid plan type: %. Must be one of: binary, unilevel, matrix', v_plan_type;
        END IF;

        -- Validate max children
        IF v_max_children <= 0 THEN
            RAISE EXCEPTION 'Max children must be greater than 0';
        END IF;

        -- Validate child positions
        IF jsonb_typeof(v_child_positions) != 'array' THEN
            RAISE EXCEPTION 'Child positions must be an array';
        END IF;

        -- Plan-specific validations
        IF v_plan_type = 'binary' AND v_max_children != 2 THEN
            RAISE EXCEPTION 'Binary plan must have exactly 2 max children';
        END IF;

        IF v_plan_type = 'binary' AND jsonb_array_length(v_child_positions) != 2 THEN
            RAISE EXCEPTION 'Binary plan must have exactly 2 child positions';
        END IF;

        RETURN TRUE;
    END;
    $$ LANGUAGE plpgsql;

    -- Create trigger to validate rules before insert/update
    CREATE OR REPLACE FUNCTION validate_genealogy_type_rules_trigger()
    RETURNS TRIGGER AS $$
    BEGIN
        IF NOT validate_genealogy_type_rules(NEW.rules) THEN
            RAISE EXCEPTION 'Invalid genealogy type rules';
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER trigger_validate_genealogy_type_rules
        BEFORE INSERT OR UPDATE ON genealogy_types
        FOR EACH ROW
        EXECUTE FUNCTION validate_genealogy_type_rules_trigger();

    $MIGRATION_SQL$,
    $ROLLBACK_SQL$
    
    -- Rollback SQL for genealogy types migration
    DROP TRIGGER IF EXISTS trigger_validate_genealogy_type_rules ON genealogy_types;
    DROP FUNCTION IF EXISTS validate_genealogy_type_rules_trigger();
    DROP FUNCTION IF EXISTS validate_genealogy_type_rules(JSONB);
    DROP VIEW IF EXISTS genealogy_types_rules_view;
    DELETE FROM genealogy_types WHERE name IN ('Binary Plan', 'Unilevel Plan', 'Matrix Plan');
    DROP TABLE IF EXISTS genealogy_types CASCADE;
    
    $ROLLBACK_SQL$
); 