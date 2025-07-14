-- Insert Unilevel Plan
INSERT INTO genealogy_types (name, description, max_children_per_node, rules) VALUES (
  'Unilevel Plan',
  'Unilevel plan allows unlimited children per parent node, but Max Children Count is used as an average for filling and spilling. If a parent reaches Max Children Count, new children spill to the next available downline node.',
  10,
  '{"type": "unilevel", "description": "No strict limit per parent, but Max Children Count is used as an average for filling/spilling."}'
) ON CONFLICT (name) DO NOTHING;

-- Insert Matrix Plan
INSERT INTO genealogy_types (name, description, max_children_per_node, rules) VALUES (
  'Matrix Plan',
  'Matrix plan restricts the number of children per parent node to Max Children Count. If a parent reaches this limit, new children spill to the next available downline node.',
  3,
  '{"type": "matrix", "description": "Strict limit per parent, Max Children Count controls filling/spilling."}'
) ON CONFLICT (name) DO NOTHING; 