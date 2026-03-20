import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';

export const generateAccessToken = (userId: string) => {
    return jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: '15m' });
};

// Returns raw token (to be sent via cookie)
export const generateRefreshTokenString = () => {
    return crypto.randomBytes(40).toString('hex');
};

// Hashes a token string for safe DB storage
export const hashRefreshToken = (token: string) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};