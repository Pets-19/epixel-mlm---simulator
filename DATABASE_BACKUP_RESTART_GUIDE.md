# Database Backup and Project Restart Guide

## 📋 Overview

This guide provides instructions for backing up the MLM Tools database and restarting the project with a fresh database setup.

## 🗄️ Database Backup

### Current Backup Files

The following backup files are available in the `database/` directory:

1. **`backup_20250729_152058.sql`** - Complete database backup (32KB)
   - Contains all tables, data, indexes, and constraints
   - Includes sample users and business plans
   - Created: July 29, 2025

2. **`backup_genealogy_types.sql`** - Genealogy types backup (8KB)
   - Contains only genealogy types data
   - Created: July 19, 2025

3. **`complete_migration.sql`** - Complete migration script
   - Fresh database setup with all current data
   - Ready for project restart

### Creating a New Backup

To create a new backup of the current database:

```bash
# Create timestamped backup
docker compose exec postgres pg_dump -U postgres -d epixel_mlm_tools --clean --if-exists --create --verbose > database/backup_$(date +%Y%m%d_%H%M%S).sql

# Create simple backup (without drop/create)
docker compose exec postgres pg_dump -U postgres -d epixel_mlm_tools > database/simple_backup_$(date +%Y%m%d_%H%M%S).sql
```

## 🚀 Project Restart

### Quick Restart Script

Use the automated restart script for easy project restoration:

```bash
# Make script executable (first time only)
chmod +x scripts/restart_project.sh

# Run restart script
./scripts/restart_project.sh
```

### Manual Restart Process

If you prefer to restart manually:

```bash
# 1. Stop all containers
docker compose down

# 2. Clean Docker system
docker system prune -f

# 3. Rebuild containers
docker compose build --no-cache

# 4. Start services
docker compose up -d

# 5. Wait for PostgreSQL to be ready
sleep 15

# 6. Apply complete migration
docker compose exec -T postgres psql -U postgres -d postgres < database/complete_migration.sql
```

## 📊 Database Schema

### Current Tables

1. **`users`** - User management and authentication
2. **`genealogy_types`** - Available simulation types
3. **`genealogy_simulations`** - Simulation data and results
4. **`genealogy_nodes`** - Genealogy structure nodes
5. **`business_plan_templates`** - Business plan templates
6. **`business_plan_simulations`** - Business plan management
7. **`business_products`** - Product configuration within plans

### Sample Data

The complete migration includes:

- **Default Genealogy Types**: Matrix, Unilevel, Binary
- **Sample Users**:
  - System Admin: `admin@epixel.com` / `password123`
  - Business User: `business@epixel.com` / `password123`
- **Sample Business Plan**: "Sample Business Plan" with 3 products
- **Sample Products**: Premium, Professional, Enterprise packages

## 🔧 Migration Features

### Key Features

- **Complete Schema**: All tables, indexes, constraints, and triggers
- **Sample Data**: Ready-to-use test data
- **Sequence Management**: Proper sequence values for auto-increment
- **Data Integrity**: Foreign key constraints and check constraints
- **Performance**: Optimized indexes for common queries

### Constraints and Indexes

- **Primary Keys**: All tables have proper primary keys
- **Foreign Keys**: Referential integrity between related tables
- **Unique Constraints**: Email, WhatsApp number, genealogy type names
- **Check Constraints**: Role validation, product sales ratio limits
- **Indexes**: Performance optimization for common queries

## 🛠️ Troubleshooting

### Common Issues

1. **Database Connection Error**
   ```bash
   # Check if PostgreSQL is running
   docker compose ps
   
   # Check PostgreSQL logs
   docker compose logs postgres
   ```

2. **Migration Fails**
   ```bash
   # Check migration file syntax
   docker compose exec postgres psql -U postgres -d postgres -f database/complete_migration.sql
   ```

3. **Permission Denied**
   ```bash
   # Make restart script executable
   chmod +x scripts/restart_project.sh
   ```

### Recovery Options

1. **Restore from Backup**
   ```bash
   docker compose exec -T postgres psql -U postgres -d postgres < database/backup_20250729_152058.sql
   ```

2. **Fresh Start**
   ```bash
   ./scripts/restart_project.sh
   ```

3. **Manual Database Reset**
   ```bash
   docker compose exec postgres psql -U postgres -d postgres -c "DROP DATABASE IF EXISTS epixel_mlm_tools;"
   docker compose exec -T postgres psql -U postgres -d postgres < database/complete_migration.sql
   ```

## 📝 Notes

- All backups are stored in the `database/` directory
- The complete migration script is self-contained and includes all necessary setup
- Sample data is included for immediate testing
- Default passwords should be changed in production
- Regular backups are recommended before major changes

## 🔄 Version History

- **v4.2** (2025-07-29): Complete migration with business plan features
- **v4.1** (2025-07-19): Initial genealogy types backup
- **v4.0**: Base schema setup

---

**Last Updated**: July 29, 2025  
**Version**: 4.2  
**Status**: Production Ready 