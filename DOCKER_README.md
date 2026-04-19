# 🐳 Docker Setup - One Command Installation

## Quick Start

### Windows (PowerShell)
```powershell
.\setup-docker.ps1
```

### Mac/Linux (Bash)
```bash
chmod +x setup-docker.sh
./setup-docker.sh
```

## What the Script Does

✅ Checks if Docker is installed  
✅ Generates secure random passwords  
✅ Creates `.env` configuration file  
✅ Saves credentials to `CREDENTIALS.txt`  
✅ Verifies all Docker files are present  
✅ Optionally starts the application immediately  

## After Setup

Your application will be available at:
- **Frontend**: http://localhost
- **Backend**: http://localhost:4000
- **Database**: localhost:3306

## Managing the Application

### Start
```bash
docker-compose up -d
```

### Stop
```bash
docker-compose down
```

### View Logs
```bash
docker-compose logs -f
```

### Check Status
```bash
docker-compose ps
```

### Restart
```bash
docker-compose restart
```

## Credentials

All generated credentials are saved in `CREDENTIALS.txt`

**Keep this file secure!** It contains:
- MySQL root password
- MySQL user password  
- JWT secret
- Database connection string

## Troubleshooting

### Port Already in Use
If port 80 is already in use, edit `docker-compose.yml`:
```yaml
frontend:
  ports:
    - "8080:80"  # Change to port 8080
```

### View Errors
```bash
docker-compose logs backend
docker-compose logs frontend
docker-compose logs database
```

### Full Reset
```bash
docker-compose down -v
docker-compose up -d --build
```

## Manual Setup (Alternative)

If you prefer manual setup:

1. Copy environment template:
```bash
cp .env.docker .env
```

2. Edit `.env` and update passwords

3. Start services:
```bash
docker-compose up -d
```

## Next Steps

1. Register admin account at http://localhost/register
2. Update user role in database:
```bash
docker-compose exec database mysql -u root -p
```
```sql
USE food_for_everyone;
UPDATE User SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

## Files Created by Setup Script

- `.env` - Environment variables
- `CREDENTIALS.txt` - Generated passwords
- Docker containers will be created on first run

## Requirements

- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- 4GB RAM minimum
- 2GB free disk space

## Support

See `DOCKER_GUIDE.md` for detailed documentation.

---

**© 2025 Food for Everyone**
