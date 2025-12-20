#!/bin/bash

echo "Fixing genealogy type names..."

docker compose exec -T postgres psql -U postgres -d epixel_mlm_tools << 'EOF'

-- Fix genealogy type names to match what the frontend sends
UPDATE genealogy_types SET name = 'Matrix' WHERE name = 'Matrix Plan';
UPDATE genealogy_types SET name = 'Unilevel' WHERE name = 'Unilevel Plan';
UPDATE genealogy_types SET name = 'Binary' WHERE name = 'Binary Plan';

-- Verify the update
SELECT id, name, description FROM genealogy_types WHERE is_active = true;

EOF

echo ""
echo "✅ Genealogy types updated!"
echo ""
echo "Please restart the app:"
echo "docker compose restart app"
