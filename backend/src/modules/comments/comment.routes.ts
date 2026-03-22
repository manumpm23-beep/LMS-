import { Router } from 'express';
import { 
    getVideoComments, createComment, 
    updateComment, deleteComment, 
    toggleUpvote, togglePin, 
    getCommentReplies 
} from './comment.controller';
import { authMiddleware } from '../../middleware/authMiddleware';

const router = Router();

// Routes attached under /api/videos/:videoId/comments handled dynamically here
// Actually wait! 
// Requirements:
// GET /api/videos/:videoId/comments
// POST /api/videos/:videoId/comments
// PUT /api/comments/:commentId
// DELETE /api/comments/:commentId
// POST /api/comments/:commentId/upvote
// POST /api/comments/:commentId/pin
// GET /api/comments/:commentId/replies
// We should export two routers OR mount them explicitly inside app.ts properly structured.

export const videoCommentRoutes = Router({ mergeParams: true });
videoCommentRoutes.get('/', authMiddleware, getVideoComments);
videoCommentRoutes.post('/', authMiddleware, createComment);

export const commentRoutes = Router();
commentRoutes.put('/:commentId', authMiddleware, updateComment);
commentRoutes.delete('/:commentId', authMiddleware, deleteComment);
commentRoutes.post('/:commentId/upvote', authMiddleware, toggleUpvote);
commentRoutes.post('/:commentId/pin', authMiddleware, togglePin);
commentRoutes.get('/:commentId/replies', authMiddleware, getCommentReplies);
