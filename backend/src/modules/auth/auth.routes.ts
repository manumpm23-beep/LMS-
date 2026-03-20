import { Router } from 'express';
import { register, login, refresh, logout } from './auth.controller';
import { authMiddleware } from '../../middleware/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);

// Verify current user protected route
router.get('/me', authMiddleware, (req, res) => {
    const { password_hash, ...userParams } = req.user;
    res.json({ user: userParams });
});

export const authRoutes = router;
