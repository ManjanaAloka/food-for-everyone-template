# Food for Everyone - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Prerequisites
```bash
# Check if Node.js is installed
node --version

# Check if MySQL is installed
mysql --version
```

**Don't have them?**
- Download Node.js: https://nodejs.org/
- Download MySQL: https://dev.mysql.com/downloads/

---

### Step 2: Install Dependencies
```bash
# In project root
npm install

# Install backend dependencies
cd apps/backend
npm install

# Install frontend dependencies
cd ../web
npm install
cd ../..
```

---

### Step 3: Setup Database

**Create Database:**
```sql
CREATE DATABASE food_for_everyone;
```

**Create Backend .env file** (`apps/backend/.env`):
```env
PORT=4000
DATABASE_URL="mysql://root:YOUR_MYSQL_PASSWORD@localhost:3306/food_for_everyone"
JWT_SECRET=change-this-to-a-random-secret-string
REFRESH_TOKEN_TTL=30d
CORS_ORIGIN=http://localhost:5173
WS_URL=http://localhost:4001
```

**Create Frontend .env file** (`apps/web/.env`):
```env
VITE_API_BASE_URL=http://localhost:4000/api
VITE_WS_URL=http://localhost:4001
```

---

### Step 4: Run Migrations
```bash
cd apps/backend
npx prisma generate
npx prisma migrate dev
```

---

### Step 5: Start the Application
```bash
# From project root
npm run dev
```

**Access:**
- Frontend: http://localhost:5173
- Backend: http://localhost:4000

---

### Step 6: Create Admin Account

1. Register at: http://localhost:5173/register
2. Update role in MySQL:
```sql
USE food_for_everyone;
UPDATE User SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

---

## 🎉 You're Done!

**Next Steps:**
- Login with your admin account
- Explore the admin dashboard
- Create test listings
- Test the checkout flow

**Need Help?** See `INSTALLATION_GUIDE.md` for detailed instructions.

---

## 📞 Common Commands

```bash
# Start development servers
npm run dev

# Run backend only
cd apps/backend && npm run dev

# Run frontend only
cd apps/web && npm run dev

# View database
cd apps/backend && npx prisma studio

# Reset database
cd apps/backend && npx prisma migrate reset
```

---

## ⚡ Quick Troubleshooting

**Port in use?**
```bash
# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:4000 | xargs kill -9
```

**Database error?**
- Check MySQL is running
- Verify DATABASE_URL in .env
- Ensure database exists

**Module not found?**
```bash
rm -rf node_modules package-lock.json
npm install
```

---

**For complete documentation, see `INSTALLATION_GUIDE.md`**
