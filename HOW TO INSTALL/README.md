# Food for Everyone (Template)

A full-stack template to connect surplus food from providers (supermarkets, bakeries, cafes) to buyers and donation centers in Sri Lanka.

- Frontend: React + Vite + Tailwind + i18n (EN/SI/TA)
- Backend: Node + Express + Prisma (MySQL) + Redis + Socket.IO
- Payments: PayHere (LK) + WebXpay stubs with webhooks
- Features: Listings, Orders, Donations, Reviews (moderation), Reports, Admin approvals, Provider dashboard
- Dev infra: Docker Compose (MySQL, Redis, MailHog, MinIO)
- Postman collection included

## Quick start

Prereqs: Node 20+, Docker, Docker Compose

1) Start services
- docker compose -f infra/docker-compose.yml up -d

2) Backend
- cd apps/backend
- cp .env.example .env
- npm install
- npx prisma generate
- npx prisma migrate dev
- Seed an admin:
  - Set ADMIN_EMAIL and ADMIN_PASSWORD in .env
  - npm run seed
- npm run dev

3) Frontend
- cd apps/web
- cp .env.example .env
- npm install
- npm run dev
- Open http://localhost:5173

4) Payments (Sandbox)
- PayHere: set PAYHERE_* in apps/backend/.env and configure PayHere portal "Notify URL" to http://localhost:4000/api/payments/webhook/payhere
- WebXpay: set WEBXPAY_*; verification scaffold included (adjust signature per your merchant docs)

5) i18n
- Switch languages in navbar: EN / à·ƒà·’à¶‚ / à®¤à®®à®¿à®´à¯

6) Postman
- Import docs/postman/Food_for_Everyone.postman_collection.json and environment
- Update baseUrl if needed

## Mark as GitHub Template
- Repo Settings â†’ Template repository â†’ Enable

## License
MIT