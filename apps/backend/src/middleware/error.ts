import { ZodError } from 'zod';
import type { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  status: number;
  constructor(message: string, status = 400) { super(message); this.status = status; }
}
export function errorMiddleware(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) return res.status(400).json({ error: 'Validation failed', details: err.flatten() });
  if (err?.status) return res.status(err.status).json({ error: err.message });
  
  // Detect Prisma/Database connection errors
  if (err.code === 'P1001' || err.message?.includes('Can\'t reach database server')) {
    console.error('❌ Database Connection Error:', err.message);
    return res.status(503).json({ 
      error: 'Database connection failed. Please ensure your MySQL database is running.',
      details: 'Check if Docker is running or if the MySQL service is started.' 
    });
  }

  // Handle Prisma Unique Constraint Errors
  if (err.code === 'P2002') {
    const field = err.meta?.target || 'field';
    return res.status(400).json({ 
      error: `A user with this ${field} already exists.`
    });
  }

  console.error('Unhandled Error:', err);
  return res.status(500).json({ error: 'Internal Server Error' });
}