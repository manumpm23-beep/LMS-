import { Router } from 'express';
import {
    getSubjectReviews,
    createReview,
    updateReview,
    deleteReview,
    getMyReview
} from './review.controller';
import { authMiddleware } from '../../middleware/authMiddleware';
import { validateReviewInput } from './review.validator';

export const reviewRoutes = Router({ mergeParams: true });

reviewRoutes.get('/', getSubjectReviews);
reviewRoutes.get('/my-review', authMiddleware, getMyReview);
reviewRoutes.post('/', authMiddleware, validateReviewInput, createReview);
reviewRoutes.put('/', authMiddleware, validateReviewInput, updateReview);
reviewRoutes.delete('/', authMiddleware, deleteReview);
