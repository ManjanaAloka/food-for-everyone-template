# Food for Everyone - Docker Deployment Guide

## 📦 What is Docker?

Docker allows you to run the entire application (frontend, backend, and database) in isolated containers without installing Node.js, MySQL, or other dependencies on your machine.

---

## Prerequisites

### Install Docker Desktop

**Windows:**
1. Download Docker Desktop: https://www.docker.com/products/docker-desktop/
2. Run the installer
3. Restart your computer
4. Open Docker Desktop and ensure it's running

**Mac:**
1. Download Docker Desktop for Mac
2. Install and launch Docker Desktop
3. Verify Docker is running (whale icon in menu bar)

**Linux:**
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

### Verify Installation

```bash
docker --version
docker-compose --version
```

You should see version numbers if Docker is installed correctly.

---

## Quick Start with Docker

### Step 1: Clone/Extract the Project

```bash
cd /path/to/food-for-everyone-template
```

### Step 2: Configure Environment

Copy the environment template:

```bash
# Copy environment file
cp .env.docker .env

# Edit .env and update passwords
# At minimum, change:
# - MYSQL_ROOT_PASSWORD
# - MYSQL_PASSWORD
# - JWT_SECRET
```

**Example .env file:**
```env
MYSQL_ROOT_PASSWORD=MySecureRootPass123!
MYSQL_USER=fooduser
MYSQL_PASSWORD=MySecurePass123!
JWT_SECRET=my-super-secret-jwt-key-change-this
CORS_ORIGIN=http://localhost
```

### Step 3: Build and Run

```bash
# Build and start all services
docker-compose up -d

# This will:
# 1. Build the backend container
# 2. Build the frontend container
# 3. Download and start MySQL container
# 4. Run database migrations
# 5. Start all services
```

### Step 4: Verify Services

```bash
# Check running containers
docker-compose ps

# You should see:
# - food-db (MySQL)
# - food-backend (API)
# - food-frontend (Web)
```

### Step 5: Access the Application

- **Frontend**: http://localhost
- **Backend API**: http://localhost:4000
- **Database**: localhost:3306

---

## Docker Commands Reference

### Starting Services

```bash
# Start all services
docker-compose up -d

# Start with logs
docker-compose up

# Start specific service
docker-compose up -d backend
```

### Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes data!)
docker-compose down -v
```

### Viewing Logs

```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs database

# Follow logs (real-time)
docker-compose logs -f backend
```

### Rebuilding Services

```bash
# Rebuild all services
docker-compose up -d --build

# Rebuild specific service
docker-compose up -d --build backend
```

### Executing Commands in Containers

```bash
# Access backend container shell
docker-compose exec backend sh

# Access database shell
docker-compose exec database mysql -u root -p

# Run Prisma commands
docker-compose exec backend npx prisma studio
docker-compose exec backend npx prisma migrate deploy
```

---

## Initial Setup

### Create Admin Account

1. Register a new account at http://localhost/register

2. Access the database:
```bash
docker-compose exec database mysql -u root -p
```

3. Update user role:
```sql
USE food_for_everyone;
SELECT id, email, role FROM User;
UPDATE User SET role = 'ADMIN' WHERE email = 'your-email@example.com';
EXIT;
```

---

## Database Management

### Backup Database

```bash
# Create backup
docker-compose exec database mysqldump -u root -p food_for_everyone > backup.sql

# Or with docker
docker exec food-db mysqldump -u root -p food_for_everyone > backup.sql
```

### Restore Database

```bash
# Restore from backup
docker-compose exec -T database mysql -u root -p food_for_everyone < backup.sql
```

### Reset Database

```bash
# Connect to backend and reset
docker-compose exec backend npx prisma migrate reset
```

### View Database with Prisma Studio

```bash
# Open Prisma Studio in browser
docker-compose exec backend npx prisma studio
```

Access at: http://localhost:5555

---

## Troubleshooting

### Issue 1: Port Already in Use

**Error:** `Bind for 0.0.0.0:80 failed: port is already allocated`

**Solution:**
```bash
# Option 1: Change port in docker-compose.yml
# Change ports section for frontend:
ports:
  - "8080:80"  # Use port 8080 instead

# Option 2: Stop the service using the port
# Windows
netstat -ano | findstr :80
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:80 | xargs kill -9
```

### Issue 2: Database Connection Failed

**Error:** `Can't reach database server`

**Solution:**
```bash
# Check if database is running
docker-compose ps database

# Check database logs
docker-compose logs database

# Restart database
docker-compose restart database

# Wait for database to be healthy
docker-compose up -d database
```

### Issue 3: Backend Won't Start

**Error:** Various backend errors

**Solution:**
```bash
# View backend logs
docker-compose logs backend

# Rebuild backend
docker-compose up -d --build backend

# Check if migrations ran
docker-compose exec backend npx prisma migrate status
```

### Issue 4: Frontend Shows Connection Error

**Solution:**
1. Check backend is running:
   ```bash
   docker-compose ps backend
   curl http://localhost:4000/api/health
   ```

2. Verify environment variables in .env

3. Rebuild frontend:
   ```bash
   docker-compose up -d --build frontend
   ```

### Issue 5: Cannot Access Application

**Solution:**
```bash
# Check all services are running
docker-compose ps

# Restart all services
docker-compose restart

# Check Docker Desktop is running (Windows/Mac)
```

---

## Production Deployment

### Using Docker Compose in Production

1. **Update environment variables** in `.env`:
```env
NODE_ENV=production
MYSQL_ROOT_PASSWORD=strong-production-password
MYSQL_PASSWORD=strong-production-password
JWT_SECRET=strong-production-jwt-secret
CORS_ORIGIN=https://yourdomain.com
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

2. **Use production compose file**:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

3. **Set up SSL/HTTPS** with reverse proxy (nginx, traefik, or caddy)

4. **Enable automatic restarts**:
```yaml
restart: always
```

---

## Docker System Maintenance

### Clean Up

```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Clean everything (WARNING: removes all unused Docker data)
docker system prune -a
```

### Check Disk Usage

```bash
docker system df
```

### Update Images

```bash
# Pull latest MySQL image
docker pull mysql:8.0

# Rebuild with latest
docker-compose up -d --build
```

---

## Advanced Configuration

### Custom Ports

Edit `docker-compose.yml`:

```yaml
services:
  frontend:
    ports:
      - "8080:80"  # Access on port 8080
  
  backend:
    ports:
      - "4500:4000"  # Backend on port 4500
```

### Persistent Data

Volumes ensure data persists across container restarts:

```yaml
volumes:
  mysql_data:        # Database files
  backend_uploads:   # Uploaded files
```

View volumes:
```bash
docker volume ls
```

### Development Mode with Docker

For development with hot-reload, use:

```bash
# Mount source code as volumes
docker-compose -f docker-compose.dev.yml up
```

-
```

---

## Files Created

```
food-for-everyone-template/
├── docker-compose.yml              # Main orchestration file
├── .env.docker                     # Environment template
├── .env                           # Your config (create this)
├── apps/
│   ├── backend/
│   │   ├── Dockerfile             # Backend container
│   │   └── .dockerignore
│   └── web/
│       ├── Dockerfile             # Frontend container
│       ├── nginx.conf             # Nginx configuration
│       └── .dockerignore
└── DOCKER_GUIDE.md                # This file
```

---

## Common Workflows

### Full Reset

```bash
# Stop everything and remove volumes
docker-compose down -v

# Rebuild and start fresh
docker-compose up -d --build
```

### Update Application Code

```bash
# Pull latest code (if using git)
git pull

# Rebuild and restart
docker-compose up -d --build
```

### Scale Services

```bash
# Run multiple backend instances
docker-compose up -d --scale backend=3
```

---

---

## Next Steps

1. **Start the application**: `docker-compose up -d`
2. **Create admin account**: See Initial Setup section
3. **Test all features**: Browse, create listings, checkout
4. **Set up backups**: Automate database backups
5. **Monitor logs**: Use `docker-compose logs -f`

---

**Need help?** Check logs first: `docker-compose logs`

**© 2025 Food for Everyone - Docker Deployment**
