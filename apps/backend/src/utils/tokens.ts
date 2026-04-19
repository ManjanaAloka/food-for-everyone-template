import jwt from 'jsonwebtoken';
export function signAccessToken(payload: object, ttl = process.env.ACCESS_TOKEN_TTL || '15m') {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: ttl });
}