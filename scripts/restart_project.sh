#!/bin/bash

# MLM Tools Project Restart Script
# This script restarts the project with a fresh database setup

echo "🚀 Starting MLM Tools Project Restart..."

# Stop all containers
echo "📦 Stopping all containers..."
docker compose down

# Clean up Docker system
echo "🧹 Cleaning Docker system..."
docker system prune -f

# Rebuild containers
echo "🔨 Rebuilding containers..."
docker compose build --no-cache

# Start services
echo "▶️  Starting services..."
docker compose up -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 15

# Apply complete migration
echo "🗄️  Applying database migration..."
docker compose exec -T postgres psql -U postgres -d postgres < database/complete_migration.sql

echo "✅ Project restart completed!"
echo "🌐 Application available at: http://localhost:3000"
echo "📊 Database restored with sample data"
echo ""
echo "Default login credentials:"
echo "  Admin: admin@epixel.com / password123"
echo "  Business User: business@epixel.com / password123" 