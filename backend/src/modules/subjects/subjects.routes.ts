import { Router } from 'express';
import { getPublishedSubjects, getSubjectDetails, getSubjectTree, getFirstVideo, seedDatabase } from './subjects.controller';
import { authMiddleware } from '../../middleware/authMiddleware';

const router = Router();
router.get('/setup/seed', seedDatabase);
router.get('/', getPublishedSubjects);
router.get('/:subjectId', getSubjectDetails);
router.get('/:subjectId/tree', authMiddleware, getSubjectTree);
router.get('/:subjectId/first-video', authMiddleware, getFirstVideo);

export const subjectRoutes = router;
