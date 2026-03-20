import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import { authRoutes } from './modules/auth/auth.routes';
import { subjectRoutes } from './modules/subjects/subjects.routes';
import { videoRoutes } from './modules/videos/videos.routes';
import { progressRoutes } from './modules/progress/progress.routes';
import { healthRoutes } from './modules/health/health.routes';

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(requestLogger);

app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/health', healthRoutes);

app.use(errorHandler);

export default app;