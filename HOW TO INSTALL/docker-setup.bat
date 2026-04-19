@echo off
REM ============================================
REM Docker Setup Script for Food For Everyone
REM ============================================

echo.
echo ========================================
echo Food For Everyone - Docker Setup
echo ========================================
echo.

REM Check if Docker is installed and running
echo [1/5] Checking Docker installation...
docker --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Docker is not installed or not in PATH
    echo Please install Docker Desktop from https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

docker ps >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Docker daemon is not running
    echo Please start Docker Desktop and try again
    pause
    exit /b 1
)
echo Docker is installed and running!
echo.

REM Setup environment file
echo [2/5] Setting up environment configuration...
if not exist .env (
    if exist .env.docker (
        echo Copying .env.docker to .env...
        copy .env.docker .env >nul
        echo Environment file created successfully!
    ) else (
        echo WARNING: .env.docker not found. Using default values.
        echo You may need to configure environment variables manually.
    )
) else (
    echo .env file already exists, skipping...
)
echo.

REM Stop and remove existing containers (if any)
echo [3/7] Cleaning up existing containers...
docker-compose down -v 2>nul
cd infra
docker-compose down -v 2>nul
cd ..
echo Cleanup complete!
echo.

REM Start infrastructure services first
echo [4/7] Starting infrastructure services (MySQL, Redis, MailHog, MinIO)...
cd infra
docker-compose up -d
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to start infrastructure services
    cd ..
    pause
    exit /b 1
)
cd ..
echo Infrastructure services started!
echo.

REM Wait for infrastructure to be ready
echo Waiting for infrastructure services to initialize...
timeout /t 15 /nobreak >nul
echo.

REM Build and start application containers
echo [5/7] Building application Docker images (this may take several minutes)...
echo.
echo Building backend...
docker-compose build --no-cache backend
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Backend build failed
    pause
    exit /b 1
)
echo Backend built successfully!
echo.
echo Building frontend...
docker-compose build --no-cache frontend
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Frontend build failed
    pause
    exit /b 1
)
echo All builds successful!
echo.

echo [6/7] Starting application containers...
docker-compose up -d
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to start containers
    pause
    exit /b 1
)
echo.

REM Wait for services to be ready
echo [7/7] Waiting for all services to be fully ready...
timeout /t 10 /nobreak >nul
echo.

REM Show container status
echo ========================================
echo Container Status:
echo ========================================
echo.
echo Application Containers:
docker-compose ps
echo.
echo Infrastructure Containers:
cd infra
docker-compose ps
cd ..
echo.

REM Show access URLs
echo ========================================
echo Services are ready!
echo ========================================
echo.
echo APPLICATION SERVICES:
echo   Frontend:  http://localhost
echo   Backend:   http://localhost:4000
echo   WebSocket: http://localhost:4001
echo.
echo INFRASTRUCTURE SERVICES:
echo   MySQL:     localhost:3306
echo   Redis:     localhost:6379
echo   MailHog:   http://localhost:8025 (Web UI)
echo   MailHog:   localhost:1025 (SMTP)
echo   MinIO:     http://localhost:9000 (API)
echo   MinIO:     http://localhost:9001 (Console)
echo.
echo CREDENTIALS:
echo   MySQL Database:
echo     - Database: food_for_everyone / ffe
echo     - User: fooduser
echo     - Password: foodpassword
echo   MinIO:
echo     - User: minio
echo     - Password: minio123
echo.
echo ========================================
echo Useful Commands:
echo ========================================
echo APPLICATION:
echo   docker-compose logs -f          View all app logs
echo   docker-compose logs -f backend  View backend logs
echo   docker-compose logs -f frontend View frontend logs
echo   docker-compose down             Stop app containers
echo   docker-compose restart          Restart app containers
echo.
echo INFRASTRUCTURE:
echo   cd infra ^&^& docker-compose logs -f   View infrastructure logs
echo   cd infra ^&^& docker-compose down      Stop infrastructure
echo   cd infra ^&^& docker-compose restart   Restart infrastructure
echo.
echo STOP ALL:
echo   docker-compose down ^&^& cd infra ^&^& docker-compose down ^&^& cd ..
echo ========================================
echo.

pause
