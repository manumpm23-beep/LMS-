import { Request, Response } from 'express';
import { reviewService } from './review.service';

export const getSubjectReviews = async (req: Request, res: Response) => {
    try {
        const { subjectId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 10;

        const result = await reviewService.getSubjectReviews(subjectId, page, pageSize);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getMyReview = async (req: Request, res: Response) => {
    try {
        const { subjectId } = req.params;
        const userId = req.user.id;

        const review = await reviewService.getMyReview(userId, subjectId);
        res.json(review);
    } catch (error: any) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createReview = async (req: Request, res: Response) => {
    try {
        const { subjectId } = req.params;
        const userId = req.user.id;
        const { rating, review } = req.body;

        const newReview = await reviewService.createReview(userId, subjectId, rating, review);
        res.status(201).json(newReview);
    } catch (error: any) {
        if (error.message === 'NOT_ENROLLED') {
            return res.status(403).json({ error: 'You are not enrolled in this course' });
        }
        if (error.message === 'ALREADY_REVIEWED') {
            return res.status(400).json({ error: 'You have already reviewed this course' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateReview = async (req: Request, res: Response) => {
    try {
        const { subjectId } = req.params;
        const userId = req.user.id;
        const { rating, review } = req.body;

        const updatedReview = await reviewService.updateReview(userId, subjectId, { rating, reviewText: review });
        res.json(updatedReview);
    } catch (error: any) {
        if (error.message === 'NOT_FOUND') {
            return res.status(404).json({ error: 'Review not found' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteReview = async (req: Request, res: Response) => {
    try {
        const { subjectId } = req.params;
        const userId = req.user.id;

        await reviewService.deleteReview(userId, subjectId);
        res.json({ message: 'Review deleted successfully' });
    } catch (error: any) {
        if (error.message === 'NOT_FOUND') {
            return res.status(404).json({ error: 'Review not found' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};
