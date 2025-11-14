#!/bin/bash

echo "Starting Bizabode Accounting Suite Locally..."
echo

echo "1. Starting Docker services..."
docker-compose up -d

echo
echo "2. Waiting for services to start..."
sleep 30

echo
echo "3. Seeding database with sample data..."
docker-compose exec backend npm run seed

echo
echo "4. Checking service status..."
docker-compose ps

echo
echo "5. Opening application..."
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:3001"
echo

echo "Login credentials:"
echo "Email: owner@jamaicatech.com"
echo "Password: password123"
echo

echo "Opening browser..."
if command -v open &> /dev/null; then
    open http://localhost:3000
elif command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3000
fi

echo
echo "Bizabode Accounting Suite is now running locally!"
echo "Press Ctrl+C to stop services..."

# Wait for user to stop
read -p "Press Enter to stop services..."

echo
echo "Stopping services..."
docker-compose down















