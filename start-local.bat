@echo off
echo Starting Bizabode Accounting Suite Locally...
echo.

echo 1. Starting Docker services...
docker-compose up -d

echo.
echo 2. Waiting for services to start...
timeout /t 30 /nobreak

echo.
echo 3. Seeding database with sample data...
docker-compose exec backend npm run seed

echo.
echo 4. Checking service status...
docker-compose ps

echo.
echo 5. Opening application...
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:3001
echo.

echo Login credentials:
echo Email: owner@jamaicatech.com
echo Password: password123
echo.

echo Opening browser...
start http://localhost:3000

echo.
echo Bizabode Accounting Suite is now running locally!
echo Press any key to stop services...
pause

echo.
echo Stopping services...
docker-compose down


















