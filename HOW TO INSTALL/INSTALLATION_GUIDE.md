# Food for Everyone - Installation Guide

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installation Steps](#installation-steps)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [Running the Application](#running-the-application)
6. [Deployment Guide](#deployment-guide)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before installing, ensure you have the following installed on your system:

### Required Software
- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **MySQL** (v8.0 or higher) - [Download here](https://dev.mysql.com/downloads/)
- **Git** (optional, for version control) - [Download here](https://git-scm.com/)
- **npm** (comes with Node.js)

### Check Installations
Open your terminal/command prompt and verify installations:

```bash
node --version    # Should show v18.x.x or higher
npm --version     # Should show 9.x.x or higher
mysql --version   # Should show 8.x.x or higher
```

---

## Installation Steps

### Step 1: Extract/Clone the Project

If you received a ZIP file:
```bash
# Extract the ZIP file to your desired location
# Example: C:\Projects\food-for-everyone
```

If using Git:
```bash
git clone <repository-url>
cd food-for-everyone-template
```

### Step 2: Install Dependencies

Navigate to the project root and install all dependencies:

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd apps/backend
npm install

# Install frontend dependencies
cd ../web
npm install

# Return to root
cd ../..
```

---

## Environment Configuration

### Step 1: Backend Environment (.env)

1. Navigate to `apps/backend/`
2. Create a `.env` file with the following content:

```env
# Server Configuration
PORT=4000
NODE_ENV=development

# Database Configuration (MySQL)
DATABASE_URL="mysql://root:yourpassword@localhost:3306/food_for_everyone"

# JWT Secret (Change this to a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Refresh Token Configuration
REFRESH_TOKEN_TTL=30d

# File Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# Stripe Payment Configuration (Optional)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_SUCCESS_URL=http://localhost:5173/checkout/success
STRIPE_CANCEL_URL=http://localhost:5173/checkout/cancel

# WebSocket Configuration
WS_PORT=4001
WS_URL=http://localhost:4001

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

### Step 2: Frontend Environment (.env)

1. Navigate to `apps/web/`
2. Create a `.env` file with the following content:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:4000/api
VITE_WS_URL=http://localhost:4001

# App Configuration
VITE_APP_NAME=Food for Everyone
VITE_APP_URL=http://localhost:5173
```

### Step 3: Update Configuration Files

**Important**: Replace the following values:
- `yourpassword` - Your MySQL root password
- `your-super-secret-jwt-key-change-this-in-production` - A random secure string
- Stripe keys (if using Stripe payments)

---

## Database Setup

### Step 1: Create MySQL Database

Open MySQL command line or MySQL Workbench:

```sql
-- Create database
CREATE DATABASE food_for_everyone;

-- Verify database creation
SHOW DATABASES;
```

### Step 2: Run Prisma Migrations

Navigate to the backend directory:

```bash
cd apps/backend

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) Seed initial data
npx prisma db seed
```

### Step 3: Verify Database Setup

```bash
# Open Prisma Studio to view your database
npx prisma studio
```

This will open a browser window at `http://localhost:5555` where you can see your database tables.

---

## Running the Application

### Option 1: Development Mode (Both servers)

From the **project root**:

```bash
# Start both backend and frontend
npm run dev
```

This will start:
- **Backend**: http://localhost:4000
- **Frontend**: http://localhost:5173

### Option 2: Run Separately

**Terminal 1 - Backend**:
```bash
cd apps/backend
npm run dev
```

**Terminal 2 - Frontend**:
```bash
cd apps/web
npm run dev
```

### Access the Application

Open your browser and navigate to:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:4000/api

---

## Initial Setup & Admin Account

### Create Admin Account

1. Go to http://localhost:5173/register
2. Register with your admin email
3. Connect to MySQL and update the user role:

```sql
USE food_for_everyone;

-- Find your user
SELECT id, email, role FROM User;

-- Update role to ADMIN
UPDATE User SET role = 'ADMIN' WHERE email = 'your-admin@email.com';
```

### Default User Roles
- `CUSTOMER` - Browse and purchase food
- `PROVIDER` - List surplus food items
- `DONATION_CENTER` - Receive food donations
- `ADMIN` - Full system access

---

## Deployment Guide

### Production Environment Setup

#### 1. Backend Deployment

Update `.env` for production:

```env
NODE_ENV=production
DATABASE_URL="mysql://username:password@production-host:3306/food_for_everyone"
JWT_SECRET=strong-production-secret
CORS_ORIGIN=https://yourdomain.com
```

Build and run:
```bash
cd apps/backend
npm run build
npm start
```

#### 2. Frontend Deployment

Update `.env` for production:

```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
VITE_WS_URL=https://api.yourdomain.com
VITE_APP_URL=https://yourdomain.com
```

Build for production:
```bash
cd apps/web
npm run build
```

The built files will be in `apps/web/dist/` - deploy these to your hosting service.

### Recommended Hosting Options

**Backend**:
- Heroku
- Railway
- DigitalOcean
- AWS EC2

**Frontend**:
- Vercel
- Netlify
- Cloudflare Pages
- AWS S3 + CloudFront

**Database**:
- PlanetScale (MySQL)
- AWS RDS
- DigitalOcean Managed MySQL
- Railway (includes database)

---

## Troubleshooting

### Common Issues

#### Issue 1: Database Connection Error
```
Error: P1001: Can't reach database server
```

**Solution**:
- Verify MySQL is running: `mysql -u root -p`
- Check DATABASE_URL in `.env`
- Ensure database exists: `SHOW DATABASES;`
- Check MySQL port (default: 3306)

#### Issue 2: Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::4000
```

**Solution**:
- Change PORT in backend `.env`
- Or kill the process using the port:
  - Windows: `netstat -ano | findstr :4000` then `taskkill /PID <PID> /F`
  - Mac/Linux: `lsof -ti:4000 | xargs kill -9`

#### Issue 3: Module Not Found
```
Error: Cannot find module 'express'
```

**Solution**:
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Issue 4: Prisma Client Error
```
Error: @prisma/client did not initialize yet
```

**Solution**:
```bash
cd apps/backend
npx prisma generate
```

#### Issue 5: CORS Error in Browser
```
Access to fetch at 'http://localhost:4000' has been blocked by CORS policy
```

**Solution**:
- Check `CORS_ORIGIN` in backend `.env`
- Ensure it matches your frontend URL
- Restart backend server after changes

---

---

## Project Structure

```
food-for-everyone-template/
├── apps/
│   ├── backend/              # Node.js/Express API
│   │   ├── src/
│   │   │   ├── routes/      # API endpoints
│   │   │   ├── services/    # Business logic
│   │   │   └── middleware/  # Auth, validation
│   │   ├── prisma/          # Database schema
│   │   └── package.json
│   │
│   └── web/                 # React Frontend
│       ├── src/
│       │   ├── pages/       # Page components
│       │   ├── components/  # Reusable components
│       │   ├── state/       # State management
│       │   └── lib/         # Utilities
│       └── package.json
│
├── package.json             # Root package.json
└── README.md
```

---



---


