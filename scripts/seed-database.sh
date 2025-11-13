#!/bin/bash

# Database Seeding Script
# This script seeds the database with initial data

echo "🌱 Starting database seeding..."

# Check if MongoDB URI is set
if [ -z "$MONGODB_URI" ]; then
    echo "❌ Error: MONGODB_URI environment variable is not set"
    exit 1
fi

# Navigate to backend directory
cd backend || exit 1

# Run seed script
echo "📦 Running seed script..."
node src/scripts/seed.js

if [ $? -eq 0 ]; then
    echo "✅ Database seeding completed successfully!"
    echo ""
    echo "Default login credentials:"
    echo "  Owner: owner@jamaicatech.com / password123"
    echo "  Accountant: accountant@jamaicatech.com / password123"
    echo "  Staff: staff@jamaicatech.com / password123"
    echo ""
    echo "⚠️  IMPORTANT: Change these passwords immediately after first login!"
else
    echo "❌ Database seeding failed!"
    exit 1
fi

