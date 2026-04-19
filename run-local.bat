@echo off
setlocal

REM Food for Everyone - Local Runner (Windows)
REM Usage: double-click or run in terminal. Requires Docker Desktop and Node.js.

set "REPO_DIR=%~dp0"

echo === Food for Everyone - Local Runner ===

REM 0) Check Docker CLI
where docker >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Docker CLI not found. Install Docker Desktop and retry.
  exit /b 1
)

REM Pick docker compose command (new CLI or legacy)
docker compose version >nul 2>&1
if errorlevel 0 (
  set "COMPOSE_CMD=docker compose"
) else (
  where docker-compose >nul 2>&1
  if errorlevel 0 (
    set "COMPOSE_CMD=docker-compose"
  ) else (
    echo [ERROR] Docker Compose not found. Install Docker Desktop (includes Compose v2) and retry.
    exit /b 1
  )
)

REM 1) Start infra services (MySQL, Redis, MailHog, MinIO)
echo [1/6] Starting infra services...
pushd "%REPO_DIR%infra" >nul
%COMPOSE_CMD% -f "docker-compose.yml" up -d
if errorlevel 1 (
  popd >nul
  echo [ERROR] Failed to start infra via %COMPOSE_CMD%.
  exit /b 1
)
popd >nul

REM 2) Ensure .env files exist for backend and web
if not exist "%REPO_DIR%apps\backend\.env" (
  copy "%REPO_DIR%apps\backend\.env.example" "%REPO_DIR%apps\backend\.env" >nul
  echo [INFO] Created apps\backend\.env from .env.example
)
if not exist "%REPO_DIR%apps\web\.env" (
  copy "%REPO_DIR%apps\web\.env.example" "%REPO_DIR%apps\web\.env" >nul
  echo [INFO] Created apps\web\.env from .env.example
)

REM 3) Install dependencies using npm workspaces (installs root + apps)
echo [2/6] Installing dependencies (this may take a few minutes)...
pushd "%REPO_DIR%" >nul
npm install
if errorlevel 1 (
  popd >nul
  echo [ERROR] npm install failed at repo root.
  exit /b 1
)
popd >nul

REM 4) Prisma generate and migrate (backend)
echo [3/6] Generating Prisma client and applying migrations...
pushd "%REPO_DIR%apps\backend" >nul
npx prisma generate
if errorlevel 1 (
  popd >nul
  echo [ERROR] prisma generate failed.
  exit /b 1
)
npx prisma migrate dev --name init
if errorlevel 1 (
  popd >nul
  echo [ERROR] prisma migrate failed.
  exit /b 1
)

REM 5) Seed admin user once (skips if already seeded)
if not exist ".seeded" (
  echo [4/6] Seeding admin user...
  npm run seed
  if errorlevel 0 (
    type nul > ".seeded"
  ) else (
    echo [WARN] Seeding failed or skipped; continuing.
  )
) else (
  echo [INFO] Seed already performed previously. Skipping.
)
popd >nul

REM 6) Start backend and frontend together
echo [5/6] Starting dev servers (backend + web)...
pushd "%REPO_DIR%" >nul
echo [INFO] Open http://localhost:5173 (web) and http://localhost:4000 (backend API)
npm run dev
set "EXITCODE=%ERRORLEVEL%"
popd >nul

echo [6/6] Done. Exiting with code %EXITCODE%.
exit /b %EXITCODE%
