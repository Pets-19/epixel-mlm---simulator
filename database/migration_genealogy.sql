-- Migration for Genealogy Types and Nodes
-- This adds genealogy management functionality

-- Create genealogy_types table
CREATE TABLE IF NOT EXISTS genealogy_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    max_children_per_node INTEGER NOT NULL DEFAULT 2,
    rules JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create genealogy_nodes table with nested set model
CREATE TABLE IF NOT EXISTS genealogy_nodes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    genealogy_type_id INTEGER REFERENCES genealogy_types(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES genealogy_nodes(id) ON DELETE CASCADE,
    
    -- Nested Set Model fields for efficient tree operations
    left_bound INTEGER NOT NULL,
    right_bound INTEGER NOT NULL,
    depth INTEGER NOT NULL DEFAULT 0,
    
    -- Node position within parent
    position VARCHAR(20) NOT NULL DEFAULT 'left', -- 'left', 'right', etc.
    
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

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_genealogy_nodes_type ON genealogy_nodes(genealogy_type_id);
CREATE INDEX IF NOT EXISTS idx_genealogy_nodes_parent ON genealogy_nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_genealogy_nodes_bounds ON genealogy_nodes(left_bound, right_bound);
CREATE INDEX IF NOT EXISTS idx_genealogy_nodes_user ON genealogy_nodes(user_id);
CREATE INDEX IF NOT EXISTS idx_genealogy_nodes_simulation ON genealogy_nodes(simulation_id);
CREATE INDEX IF NOT EXISTS idx_genealogy_nodes_cycle ON genealogy_nodes(payout_cycle, cycle_position);

-- Create genealogy_simulations table to track simulation runs
CREATE TABLE IF NOT EXISTS genealogy_simulations (
    id VARCHAR(100) PRIMARY KEY,
    genealogy_type_id INTEGER REFERENCES genealogy_types(id) ON DELETE CASCADE,
    max_expected_users INTEGER NOT NULL,
    payout_cycle_type VARCHAR(20) NOT NULL, -- 'weekly', 'biweekly', 'monthly'
    number_of_cycles INTEGER NOT NULL,
    users_per_cycle INTEGER NOT NULL,
    total_nodes_generated INTEGER NOT NULL DEFAULT 0,
    simulation_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Insert default Binary Plan genealogy type
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
        "description": "Each parent node can have maximum 2 children. New nodes are placed in left position first, then right position."
    }'
) ON CONFLICT (name) DO NOTHING;

-- Create trigger to update updated_at timestamp for genealogy_types
CREATE TRIGGER update_genealogy_types_updated_at 
    BEFORE UPDATE ON genealogy_types 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to update updated_at timestamp for genealogy_nodes
CREATE TRIGGER update_genealogy_nodes_updated_at 
    BEFORE UPDATE ON genealogy_nodes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 