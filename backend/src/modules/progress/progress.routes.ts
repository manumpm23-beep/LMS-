import { Router } from 'express';
import { getSubjectProgress, getVideoProgress, upsertVideoProgress } from './progress.controller';
import { authMiddleware } from '../../middleware/authMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/subjects/:subjectId', getSubjectProgress);
router.get('/videos/:videoId', getVideoProgress);
router.post('/videos/:videoId', upsertVideoProgress);

export const progressRoutes = router;
