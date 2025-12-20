#!/bin/bash

# Initialize the database with default users

echo "Initializing database..."

# Create system admin user
echo "Creating system admin..."
curl -X POST http://localhost:3000/api/auth/init \
  -H "Content-Type: application/json" \
  2>/dev/null

echo ""
echo "Database initialized!"
echo ""
echo "You can now login with:"
echo "Email: admin@epixelmlm.com"
echo "Password: admin123"
echo ""
echo "Please change the password after first login!"
