import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export type JWTPayload = { sub: string; role: string; name: string };

export function requireAuth(req: Request & { user?: JWTPayload }, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const token = header.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    req.user = payload;
    next();
  } catch (error: any) { 
    console.error('JWT Verification Error:', error.message);
    return res.status(401).json({ error: 'Invalid token' }); 
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request & { user?: JWTPayload }, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}