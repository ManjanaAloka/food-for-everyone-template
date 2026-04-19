import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { Server as SocketIOServer } from 'socket.io';

import { prisma } from './lib/prisma.js';
import { logger } from './lib/logger.js';
import { errorMiddleware } from './middleware/error.js';

import { router as authRouter } from './routes/auth.js';
import { router as adminRouter } from './routes/admin.js';
import { router as listingsRouter } from './routes/listings.js';
import { router as ordersRouter } from './routes/orders.js';
import { router as paymentsRouter } from './routes/payments.js';
import { router as donationCentersRouter } from './routes/donationCenters.js';
import { router as reviewsRouter } from './routes/reviews.js';
import { router as reportsRouter } from './routes/reports.js';
import { router as providersRouter } from './routes/providers.js';

import { initQueues } from './queues/index.js';
import { registerSockets } from './sockets/index.js';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: process.env.CORS_ORIGIN || '*', credentials: true }
});
registerSockets(io);

app.set('io', io);
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 60_000, max: 200 }));

// Log all requests with auth status
app.use((req, _res, next) => {
  logger.debug({ method: req.method, path: req.path, hasAuth: !!req.headers.authorization }, 'Incoming request');
  next();
});

app.get('/health', async (_req, res) => {
  try { await prisma.$queryRaw`SELECT 1`; res.json({ ok: true }); }
  catch { res.status(500).json({ ok: false }); }
});

// API
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/listings', listingsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/donation-centers', donationCentersRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/providers', providersRouter);

// Errors
app.use(errorMiddleware);

const PORT = Number(process.env.PORT || 4000);
server.listen(PORT, () => {
  logger.info(`API on http://localhost:${PORT}`);
  initQueues(io).catch((e) => logger.error(e));
});
