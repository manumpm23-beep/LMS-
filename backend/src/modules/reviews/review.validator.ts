import { Request, Response, NextFunction } from 'express';

export const validateReviewInput = (req: Request, res: Response, next: NextFunction) => {
    const { rating, review } = req.body;
    
    if (rating !== undefined) {
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
        }
    } else if (req.method === 'POST') {
        return res.status(400).json({ error: 'Rating is required' });
    }

    if (review !== undefined && review !== null) {
        if (typeof review !== 'string') {
            return res.status(400).json({ error: 'Review must be a string' });
        }
        if (review.length > 1000) {
            return res.status(400).json({ error: 'Review must not exceed 1000 characters' });
        }
    }

    next();
};
