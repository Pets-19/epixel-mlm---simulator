# Migration System Documentation for MLM Tools

## Overview

This document describes the comprehensive migration system implemented to ensure that **Genealogy Plan Rules** are never lost and are properly protected throughout the application lifecycle.

## 🛡️ Critical Data Protection

The genealogy plan rules are the core business logic for the MLM simulator. They define how Binary, Matrix, and Unilevel plans work. **These rules must never be lost** as they are essential for:

- Simulation accuracy
- Business logic consistency
- System reliability
- Compliance with MLM plan specifications

## 📋 Migration System Architecture

### 1. Migration Tracking Table

```sql
CREATE TABLE migrations (
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
```

**Purpose**: Tracks all database changes with checksums and rollback capabilities.

### 2. Genealogy Types Table with Enhanced Protection

```sql
CREATE TABLE genealogy_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    max_children_per_node INTEGER NOT NULL DEFAULT 2,
    rules JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Data integrity constraints
    CONSTRAINT chk_max_children_positive CHECK (max_children_per_node > 0),
    CONSTRAINT chk_rules_not_empty CHECK (jsonb_typeof(rules) = 'object'),
    CONSTRAINT chk_name_not_empty CHECK (length(trim(name)) > 0)
);
```

**Purpose**: Stores genealogy plan rules with validation constraints.

### 3. Audit Trail System

```sql
CREATE TABLE genealogy_types_audit (
    id SERIAL PRIMARY KEY,
    genealogy_type_id INTEGER NOT NULL,
    action VARCHAR(10) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    changed_by VARCHAR(255) DEFAULT current_user
);
```

**Purpose**: Tracks all changes to genealogy types for compliance and debugging.

## 🔧 Core Functions

### Migration Management

#### `apply_migration(migration_name, version, migration_sql, rollback_sql)`
- Applies migrations with checksum validation
- Supports rollback functionality
- Tracks execution time and status

#### `rollback_migration(migration_name)`
- Rolls back specific migrations
- Updates migration status
- Provides error handling

#### `list_migrations()`
- Shows all applied migrations
- Displays status and timing information

### Data Protection

#### `create_genealogy_types_backup()`
- Creates comprehensive backup of genealogy types
- Includes audit trail
- Returns JSONB format for easy storage/transfer

#### `restore_genealogy_types_from_backup(backup_jsonb)`
- Restores genealogy types from backup
- Handles transaction safety
- Provides detailed logging

#### `validate_genealogy_type_rules(rules_jsonb)`
- Validates rule structure and content
- Ensures plan-specific requirements
- Returns boolean success/failure

### System Health

#### `verify_genealogy_types_setup()`
- Checks migration system availability
- Verifies genealogy types table
- Validates required plan types
- Confirms audit system functionality
- Tests backup/restore functions
- Validates rule validation functions

#### `get_genealogy_system_status()`
- Provides comprehensive system status
- Includes migration history
- Shows integrity check results
- Lists genealogy types summary
- Provides recommendations

#### `emergency_genealogy_types_recovery()`
- Automatic recovery from backup
- Checks for missing critical data
- Restores if necessary
- Provides detailed logging

## 📊 Genealogy Plan Rules Structure

### Binary Plan Rules
```json
{
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
}
```

### Matrix Plan Rules
```json
{
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
}
```

### Unilevel Plan Rules
```json
{
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
}
```

## 🚀 Usage Instructions

### 1. Applying Migrations

```bash
# Run the migration script
./scripts/apply_migrations.sh
```

This script will:
- Start Docker services
- Wait for database readiness
- Apply all migrations in order
- Verify system integrity
- Create test backup
- Display comprehensive status

### 2. Manual Migration Application

```sql
-- Apply a specific migration
SELECT apply_migration(
    'migration_name',
    '1.0.0',
    'CREATE TABLE example...',
    'DROP TABLE example;'
);

-- Check migration status
SELECT * FROM list_migrations();

-- Rollback if needed
SELECT rollback_migration('migration_name');
```

### 3. Backup and Restore

```sql
-- Create backup
SELECT create_genealogy_types_backup();

-- Restore from backup
SELECT restore_genealogy_types_from_backup(backup_data);

-- Validate rules
SELECT validate_genealogy_type_rules(rules_jsonb);
```

### 4. System Health Checks

```sql
-- Comprehensive system check
SELECT * FROM verify_genealogy_types_setup();

-- Get system status
SELECT get_genealogy_system_status();

-- Emergency recovery
SELECT emergency_genealogy_types_recovery();
```

## 🔍 Monitoring and Maintenance

### Daily Health Checks

```sql
-- Check if all required genealogy types exist
SELECT COUNT(*) FROM genealogy_types 
WHERE name IN ('Binary Plan', 'Unilevel Plan', 'Matrix Plan');

-- Verify rule validation
SELECT name, validate_genealogy_type_rules(rules) as valid 
FROM genealogy_types;

-- Check audit trail
SELECT COUNT(*) FROM genealogy_types_audit 
WHERE changed_at > NOW() - INTERVAL '24 hours';
```

### Weekly Backups

```sql
-- Create scheduled backup
SELECT schedule_genealogy_types_backup();

-- Export to file (requires superuser)
SELECT export_genealogy_types_to_file('/backup/genealogy_types.json');
```

### Monthly Integrity Checks

```sql
-- Run full integrity check
SELECT * FROM validate_genealogy_types_integrity();

-- Check migration history
SELECT migration_name, applied_at, status 
FROM migrations 
ORDER BY applied_at DESC;
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. Migration Failed
```sql
-- Check migration status
SELECT * FROM migrations WHERE status = 'failed';

-- View error details
SELECT migration_name, rollback_sql FROM migrations WHERE status = 'failed';
```

#### 2. Genealogy Types Missing
```sql
-- Check what's missing
SELECT * FROM verify_genealogy_types_setup();

-- Emergency recovery
SELECT emergency_genealogy_types_recovery();
```

#### 3. Rule Validation Errors
```sql
-- Check specific rules
SELECT name, rules FROM genealogy_types WHERE NOT validate_genealogy_type_rules(rules);

-- Validate manually
SELECT validate_genealogy_type_rules('{"type": "binary", "max_children": 2, "child_positions": ["left", "right"]}');
```

### Recovery Procedures

#### 1. Complete System Recovery
```bash
# Stop services
docker compose down

# Start fresh
docker compose up -d postgres

# Apply migrations
./scripts/apply_migrations.sh
```

#### 2. Data Recovery from Backup
```sql
-- Restore from backup file
SELECT import_genealogy_types_from_file('/backup/genealogy_types.json');

-- Verify restoration
SELECT * FROM verify_genealogy_types_setup();
```

#### 3. Emergency Rollback
```sql
-- Rollback last migration
SELECT rollback_migration('migration_name');

-- Verify system state
SELECT get_genealogy_system_status();
```

## 📈 Performance Considerations

### Indexes for Performance
- `idx_genealogy_types_name`: Fast name lookups
- `idx_genealogy_types_active`: Filter active types
- `idx_genealogy_types_rules`: GIN index for JSONB queries
- `idx_migrations_name`: Fast migration lookups
- `idx_genealogy_types_audit_type_id`: Audit trail queries

### Backup Optimization
- Audit trail limited to 1000 recent records
- JSONB compression for efficient storage
- Incremental backup support planned

## 🔐 Security Considerations

### Data Protection
- All changes are audited
- Backup encryption recommended for production
- Access control through database roles
- Checksum validation prevents tampering

### Compliance
- Full audit trail for regulatory compliance
- Data retention policies can be implemented
- Change tracking for business requirements

## 📝 Best Practices

### 1. Always Test Migrations
- Test in development environment first
- Verify rollback procedures
- Check data integrity after migration

### 2. Regular Backups
- Schedule automated backups
- Test restore procedures
- Store backups in multiple locations

### 3. Monitor System Health
- Set up alerts for failed migrations
- Monitor genealogy types integrity
- Track audit trail growth

### 4. Documentation
- Document all custom migrations
- Maintain change logs
- Update this documentation

## 🎯 Success Metrics

### Migration Success Rate
- Target: 100% successful migrations
- Monitor: Failed migration count
- Action: Immediate rollback on failure

### Data Integrity
- Target: All genealogy types present and valid
- Monitor: Integrity check results
- Action: Emergency recovery if needed

### Backup Reliability
- Target: Successful backup creation
- Monitor: Backup function success rate
- Action: Manual backup if automated fails

## 🔮 Future Enhancements

### Planned Features
1. **Automated Migration Testing**: Pre-flight checks for migrations
2. **Incremental Backups**: Delta-based backup system
3. **Migration Templates**: Standardized migration patterns
4. **Performance Monitoring**: Migration execution time tracking
5. **Rollback Automation**: Automatic rollback on failure

### Integration Opportunities
1. **CI/CD Pipeline**: Automated migration testing
2. **Monitoring Systems**: Integration with Prometheus/Grafana
3. **Alert Systems**: Slack/Email notifications for issues
4. **Backup Storage**: Integration with cloud storage providers

---

## 📞 Support

For issues with the migration system:

1. **Check the logs**: `docker compose logs postgres`
2. **Run health checks**: Use the verification functions
3. **Review this documentation**: All procedures are documented
4. **Emergency recovery**: Use the emergency recovery function

**Remember**: The genealogy plan rules are critical business data. Always verify before making changes and maintain regular backups. 