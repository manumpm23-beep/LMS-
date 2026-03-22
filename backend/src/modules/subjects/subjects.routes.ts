import { Router } from 'express';
import { getSubjects, getSubjectById, getSubjectTree, seedDatabase, enrollSubject } from './subjects.controller';
import { getFirstVideoOfSubject } from '../videos/videos.controller';
import { authMiddleware } from '../../middleware/authMiddleware';

const router = Router();

router.get('/setup/seed', seedDatabase);
router.get('/', getSubjects);
router.get('/:subjectId', getSubjectById);
router.get('/:subjectId/tree', authMiddleware, getSubjectTree);
router.post('/:subjectId/enroll', authMiddleware, enrollSubject);
router.get('/:subjectId/first-video', authMiddleware, getFirstVideoOfSubject);

export const subjectRoutes = router;
