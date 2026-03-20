import { Request, Response } from 'express';
import { prisma } from '../../config/db';
import { hashPassword, comparePassword } from '../../utils/password';
import { generateAccessToken, generateRefreshTokenString, hashRefreshToken } from '../../utils/jwt';

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, name } = req.body;
        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Email, password, and name are required' });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await hashPassword(password);
        const user = await prisma.user.create({
            data: {
                email,
                password_hash: hashedPassword,
                name,
            },
        });

        const accessToken = generateAccessToken(user.id);
        const refreshTokenRaw = generateRefreshTokenString();
        const refreshTokenHashed = hashRefreshToken(refreshTokenRaw);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); // expires in 30 days

        await prisma.refreshToken.create({
            data: {
                userId: user.id,
                tokenHash: refreshTokenHashed,
                expiresAt,
            },
        });

        res.cookie('refreshToken', refreshTokenRaw, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days in ms
        });

        res.status(201).json({ user: { id: user.id, email: user.email, name: user.name }, accessToken });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !(await comparePassword(password, user.password_hash))) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const accessToken = generateAccessToken(user.id);
        const refreshTokenRaw = generateRefreshTokenString();
        const refreshTokenHashed = hashRefreshToken(refreshTokenRaw);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        await prisma.refreshToken.create({
            data: {
                userId: user.id,
                tokenHash: refreshTokenHashed,
                expiresAt,
            },
        });

        res.cookie('refreshToken', refreshTokenRaw, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 30 * 24 * 60 * 60 * 1000
        });

        res.status(200).json({ user: { id: user.id, email: user.email, name: user.name }, accessToken });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const refresh = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.cookies;
        if (!refreshToken) {
            return res.status(401).json({ error: 'No refresh token provided in cookies' });
        }

        const tokenHash = hashRefreshToken(refreshToken);
        const storedToken = await prisma.refreshToken.findFirst({
            where: {
                tokenHash,
                revokedAt: null,
                expiresAt: { gt: new Date() }
            },
            include: { user: true }
        });

        if (!storedToken) {
            return res.status(401).json({ error: 'Invalid or expired refresh token' });
        }

        const accessToken = generateAccessToken(storedToken.userId);

        res.status(200).json({ accessToken });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const logout = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.cookies;
        if (refreshToken) {
            const tokenHash = hashRefreshToken(refreshToken);
            await prisma.refreshToken.updateMany({
                where: { tokenHash },
                data: { revokedAt: new Date() }
            });
        }

        res.clearCookie('refreshToken');
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
