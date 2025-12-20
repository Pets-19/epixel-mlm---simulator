#!/bin/bash

echo "🔄 Restarting the Next.js application..."

# Rebuild and restart the app service
docker compose up -d --build --force-recreate app

echo "✅ Application restarted!"
echo ""
echo "Access the application at: http://localhost:3000"
echo ""
echo "Login credentials:"
echo "Email: admin@epixelmlm.com"
echo "Password: admin123"
