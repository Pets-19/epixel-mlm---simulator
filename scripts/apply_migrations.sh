#!/bin/bash

# Migration Application Script for MLM Tools
# This script applies all database migrations in the correct order

set -e  # Exit on any error

echo "🚀 Starting MLM Tools Migration Process..."
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker Compose is available
if ! command -v docker compose &> /dev/null; then
    print_error "Docker Compose is not installed or not in PATH"
    exit 1
fi

# Check if we're in the correct directory
if [ ! -f "docker-compose.yml" ]; then
    print_error "docker-compose.yml not found. Please run this script from the project root directory."
    exit 1
fi

# Function to wait for database to be ready
wait_for_database() {
    print_status "Waiting for database to be ready..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker compose exec -T postgres pg_isready -U postgres -d epixel_mlm_tools > /dev/null 2>&1; then
            print_success "Database is ready!"
            return 0
        fi
        
        print_status "Attempt $attempt/$max_attempts - Database not ready yet, waiting 2 seconds..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "Database failed to become ready after $max_attempts attempts"
    return 1
}

# Function to apply migration file
apply_migration_file() {
    local file_path=$1
    local description=$2
    
    print_status "Applying $description..."
    
    if [ ! -f "$file_path" ]; then
        print_error "Migration file not found: $file_path"
        return 1
    fi
    
    # Apply the migration
    if docker compose exec -T postgres psql -U postgres -d epixel_mlm_tools -f "/docker-entrypoint-initdb.d/$(basename $file_path)" 2>&1; then
        print_success "$description applied successfully"
        return 0
    else
        print_error "Failed to apply $description"
        return 1
    fi
}

# Function to run SQL command
run_sql_command() {
    local sql_command=$1
    local description=$2
    
    print_status "Running $description..."
    
    if docker compose exec -T postgres psql -U postgres -d epixel_mlm_tools -c "$sql_command" 2>&1; then
        print_success "$description completed successfully"
        return 0
    else
        print_error "Failed to run $description"
        return 1
    fi
}

# Start services if not running
print_status "Starting Docker services..."
if ! docker compose up -d postgres; then
    print_error "Failed to start PostgreSQL service"
    exit 1
fi

# Wait for database to be ready
if ! wait_for_database; then
    print_error "Database startup failed"
    exit 1
fi

print_status "Database is ready. Starting migration process..."

# Copy migration files to database container
print_status "Copying migration files to database container..."
docker compose cp database/. postgres:/docker-entrypoint-initdb.d/

# Apply migrations in order
echo ""
echo "📋 Applying Migrations..."
echo "========================"

# 1. Apply migration system
if ! apply_migration_file "database/migration_system.sql" "Migration System"; then
    print_error "Migration system setup failed"
    exit 1
fi

# 2. Apply genealogy types secure migration
if ! apply_migration_file "database/migration_genealogy_types_secure.sql" "Genealogy Types Secure Migration"; then
    print_error "Genealogy types migration failed"
    exit 1
fi

# 3. Apply backup and restore functions
if ! apply_migration_file "database/backup_genealogy_types.sql" "Backup and Restore Functions"; then
    print_error "Backup functions setup failed"
    exit 1
fi

# 4. Run migration runner
if ! apply_migration_file "database/run_migrations.sql" "Migration Runner"; then
    print_error "Migration runner failed"
    exit 1
fi

echo ""
echo "🔍 Verifying Migration Results..."
echo "================================"

# Verify migration status
print_status "Checking migration status..."
run_sql_command "SELECT migration_name, version, status, applied_at FROM migrations ORDER BY applied_at;" "Migration Status Check"

# Verify genealogy types integrity
print_status "Verifying genealogy types integrity..."
run_sql_command "SELECT * FROM verify_genealogy_types_setup();" "Integrity Check"

# Verify genealogy types are present
print_status "Verifying genealogy types are present..."
run_sql_command "SELECT id, name, max_children_per_node, rules->>'type' as plan_type FROM genealogy_types ORDER BY id;" "Genealogy Types Check"

# Create a backup to verify backup functionality
print_status "Creating test backup..."
run_sql_command "SELECT create_genealogy_types_backup() IS NOT NULL as backup_created;" "Backup Test"

echo ""
echo "🎉 Migration Process Completed Successfully!"
echo "============================================="

# Display final system status
print_status "Final system status:"
run_sql_command "SELECT get_genealogy_system_status();" "System Status"

echo ""
print_success "All migrations have been applied successfully!"
print_success "Genealogy plan rules are now securely stored and protected."
echo ""
echo "📋 Migration Summary:"
echo "===================="
echo "✅ Migration tracking system installed"
echo "✅ Genealogy types table created with constraints"
echo "✅ All three plan types (Binary, Matrix, Unilevel) configured"
echo "✅ Comprehensive rules stored as JSONB"
echo "✅ Audit trail system active"
echo "✅ Backup and restore functions available"
echo "✅ Validation functions in place"
echo "✅ Emergency recovery procedures ready"
echo ""
echo "🛡️  Data Protection Features:"
echo "============================="
echo "• All genealogy plan rules are backed up automatically"
echo "• Audit trail tracks all changes to genealogy types"
echo "• Validation ensures rule integrity"
echo "• Emergency recovery can restore from backup"
echo "• Migration system prevents data loss"
echo ""
print_success "Your genealogy plan rules are now fully protected and will not be lost!" 