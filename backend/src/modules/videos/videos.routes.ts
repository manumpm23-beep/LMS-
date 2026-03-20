import { Router } from 'express';
import { getVideoById } from './videos.controller';
import { authMiddleware } from '../../middleware/authMiddleware';

const router = Router();

router.get('/:videoId', authMiddleware, getVideoById);

export const videoRoutes = router;
