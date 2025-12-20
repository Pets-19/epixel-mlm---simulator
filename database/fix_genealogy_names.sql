-- Fix genealogy type names to match what the frontend sends
-- Update existing names to remove "Plan" suffix for consistency

UPDATE genealogy_types SET name = 'Matrix' WHERE name = 'Matrix Plan';
UPDATE genealogy_types SET name = 'Unilevel' WHERE name = 'Unilevel Plan';
UPDATE genealogy_types SET name = 'Binary' WHERE name = 'Binary Plan';

-- Verify the update
SELECT id, name, description FROM genealogy_types WHERE is_active = true;
