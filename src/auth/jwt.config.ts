// src/auth/jwt.config.ts
export const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret';
export const JWT_EXPIRES = process.env.JWT_EXPIRES ?? '1d';
