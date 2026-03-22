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
import { dashboardRoutes } from './modules/dashboard/dashboard.routes';
import { videoCommentRoutes, commentRoutes } from './modules/comments/comment.routes';
import { reviewRoutes } from './modules/reviews/review.routes';

const app = express();

app.use(cors({
    origin: function (origin, callback) {
        callback(null, true);
    },
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(requestLogger);

app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/videos/:videoId/comments', videoCommentRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/subjects/:subjectId/reviews', reviewRoutes);

app.use(errorHandler);

export default app;