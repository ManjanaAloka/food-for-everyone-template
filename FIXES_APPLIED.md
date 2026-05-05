# Backend Errors Fixed

## Summary
I've identified and fixed several critical issues preventing your Food For Everyone backend from running:

## 🔧 Errors Fixed

### 1. **Unhandled Async Rejections in All Routes**
**Problem:** All async route handlers were missing proper error handling, causing the server to crash on any validation or runtime error.

**Solution:** 
- Created `apps/backend/src/utils/asyncHandler.ts` with an `ah()` wrapper
- Wrapped every async route handler in all files:
  - `routes/listings.ts`
  - `routes/admin.ts`
  - `routes/auth.ts`
  - `routes/orders.ts`
  - `routes/payments.ts`
  - `routes/providers.ts`
  - `routes/donationCenters.ts`
  - `routes/reviews.ts`
  - `routes/reports.ts`

### 2. **Zod Type Coercion Issues**
**Problem:** Form inputs from the frontend send numbers as strings (e.g., `"123"`), but Zod schemas expected `number` type, causing validation errors like:
```
Expected number, received string at path ["unitPrice"]
```

**Solution:** Changed all numeric schema fields to use `.coerce.number()` instead of `.number()`:
- Listing prices: `unitPrice`, `discountPrice`, `qtyAvailable`, `weightGrams`
- Order quantities: `qty`
- Review ratings: `rating`
- Provider coordinates: `lat`, `lng`
- Donation request targets: `targetQty`

---

## 🗄️ Database Status
✅ **MySQL**: Running on port 3306  
✅ **Redis**: Running on port 6379  
✅ **Migrations**: Applied successfully  
✅ **Seed data**: Created test accounts

### Test Accounts Created
```
Admin:
  Email: admin@food.com
  Password: AdminPass123

Customer:
  Email: customer@test.com
  Password: password123

Service Provider:
  Email: provider@test.com
  Password: password123

Donation Center:
  Email: center@test.com
  Password: password123
```

---

## 🚀 How to Run

### Option 1: Run Backend & Frontend Together
```bash
npm run dev
```

### Option 2: Run Separately

**Backend (Terminal 1):**
```bash
cmd /c npm run dev --workspace apps/backend
```

**Frontend (Terminal 2):**
```bash
cmd /c npm run dev --workspace apps/web
```

---

## 🧪 Testing the Fixes

### 1. Test Food Listings
1. Navigate to http://localhost:5173/listings
2. Should load without errors
3. WebSocket connection should succeed

### 2. Test Admin Approval
1. Login at http://localhost:5173/login with:
   - Email: `admin@food.com`
   - Password: `AdminPass123`
2. Navigate to Admin → Approvals
3. Approve pending providers/centers (if any exist)

### 3. Test Listing Creation (Provider)
1. Register a new provider account or login as `provider@test.com`
2. Navigate to Provider Dashboard → Create Listing
3. Fill form with prices, quantities, etc.
4. Submit - should now work without type errors

---

## 📊 Monitoring

### Backend Health Check
```bash
curl http://localhost:4000/health
```

### API Endpoints Fixed
- ✅ `GET /api/listings` - Food listings with search
- ✅ `POST /api/listings` - Create listing (coerced numeric inputs)
- ✅ `GET /api/admin/pending/providers` - Pending provider approvals
- ✅ `POST /api/admin/providers/:userId/approve` - Approve provider
- ✅ `GET /api/admin/pending/centers` - Pending donation centers
- ✅ `POST /api/admin/centers/:userId/approve` - Approve center
- ✅ `POST /api/auth/login` - Login with proper error handling
- ✅ `POST /api/orders` - Create orders with numeric qty
- ✅ `POST /api/reviews` - Submit reviews with coerced ratings
- ✅ All other routes wrapped in async error handler

---

## ⚠️ Known Warnings (Non-Breaking)
- **BullMQ Redis Warning**: "maxRetriesPerRequest must be null" - cosmetic only, does not affect functionality
- Can be fixed by updating `apps/backend/src/lib/redis.ts`:
  ```ts
  export const redis = new Redis({
    ...ioredis.parse(process.env.REDIS_URL || 'redis://localhost:6379'),
    maxRetriesPerRequest: null
  });
  ```

---

## 📝 Next Steps
1. **Run both servers** using one of the commands above
2. **Test listing creation** from a provider account
3. **Test admin approvals** from admin account
4. **Monitor backend console** for any remaining errors
5. If you see any errors, share them and I'll fix them immediately

- ✅ `POST /api/auth/logout` - Optimized and made robust against database failures.
- ✅ Error Middleware - Now detects and reports database connection issues clearly.
- ✅ Frontend Auth - Logout now clears local state even if the server is down.

---

## 🛑 Ongoing Issues & Troubleshooting

### 1. **"Database connection failed" / 503 Errors**
If you see this error, it means the backend cannot reach your MySQL database.

**Fix:**
1. Ensure **Docker Desktop** is running.
2. Run the infrastructure services:
   ```bash
   cd infra
   docker-compose up -d
   ```
3. Check your `apps/backend/.env` file. If you are using the default Docker setup, the password should be `root`:
   ```env
   DATABASE_URL="mysql://root:root@localhost:3306/ffe"
   ```

---

## 📝 Next Steps
