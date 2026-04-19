Write-Host "Starting Food for Everyone Application..." -ForegroundColor Green
Write-Host ""

# Check if Docker services are running
Write-Host "Checking Docker services..." -ForegroundColor Cyan
$dockerCheck = docker ps 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if MySQL, Redis, etc. are running
if ($dockerCheck -notmatch "mysql" -or $dockerCheck -notmatch "redis") {
    Write-Host "Starting infrastructure services..." -ForegroundColor Yellow
    Push-Location infra
    docker compose up -d
    Pop-Location
    Write-Host "Waiting for services to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
}

Write-Host "Docker services are running!" -ForegroundColor Green
Write-Host ""

# Start both servers using npm
Write-Host "Starting backend and frontend servers..." -ForegroundColor Cyan
Write-Host "Backend will be available at: http://localhost:4000" -ForegroundColor Yellow
Write-Host "Frontend will be available at: http://localhost:5173" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop all servers" -ForegroundColor Yellow
Write-Host ""

npm run dev
