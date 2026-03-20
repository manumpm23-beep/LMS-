import { Router } from 'express';
import { getSubjects, getSubjectById, getSubjectTree } from './subjects.controller';
import { getFirstVideoOfSubject } from '../videos/videos.controller';
import { authMiddleware } from '../../middleware/authMiddleware';

const router = Router();

router.get('/', getSubjects);
router.get('/:subjectId', getSubjectById);
router.get('/:subjectId/tree', authMiddleware, getSubjectTree);
router.get('/:subjectId/first-video', authMiddleware, getFirstVideoOfSubject);

export const subjectRoutes = router;
