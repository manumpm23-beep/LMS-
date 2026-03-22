import { reviewRepository } from './review.repository';

export class ReviewService {
    async getSubjectReviews(subjectId: string, page: number, pageSize: number) {
        const skip = (page - 1) * pageSize;
        const reviews = await reviewRepository.findReviewsBySubjectId(subjectId, skip, pageSize);
        const summary = await reviewRepository.getReviewSummary(subjectId);

        const mappedReviews = reviews.map(r => ({
            id: r.id.toString(),
            rating: r.rating,
            review: r.review,
            isEdited: r.isEdited,
            createdAt: r.createdAt,
            user: {
                id: r.user.id,
                name: r.user.name,
                avatar: `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(r.user.name)}`
            }
        }));

        return {
            reviews: mappedReviews,
            ...summary,
            page,
            pageSize,
            totalPages: Math.ceil(summary.totalReviews / pageSize)
        };
    }

    async getMyReview(userId: string, subjectId: string) {
        const review = await reviewRepository.findUserReviewForSubject(userId, subjectId);
        if (!review) return null;
        
        return {
            id: review.id.toString(),
            rating: review.rating,
            review: review.review,
            isEdited: review.isEdited,
            createdAt: review.createdAt,
            user: {
                id: review.user.id,
                name: review.user.name,
                avatar: `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(review.user.name)}`
            }
        };
    }

    async createReview(userId: string, subjectId: string, rating: number, reviewText?: string) {
        const isEnrolled = await reviewRepository.checkEnrollment(userId, subjectId);
        if (!isEnrolled) {
            throw new Error('NOT_ENROLLED');
        }

        const existingReview = await reviewRepository.findUserReviewForSubject(userId, subjectId);
        if (existingReview) {
            throw new Error('ALREADY_REVIEWED');
        }

        const created = await reviewRepository.createReview({
            userId,
            subjectId,
            rating,
            review: reviewText || null
        });

        return {
            id: created.id.toString(),
            rating: created.rating,
            review: created.review,
            isEdited: created.isEdited,
            createdAt: created.createdAt,
            user: {
                id: created.user.id,
                name: created.user.name,
                avatar: `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(created.user.name)}`
            }
        };
    }

    async updateReview(userId: string, subjectId: string, data: { rating?: number, reviewText?: string }) {
        const existingReview = await reviewRepository.findUserReviewForSubject(userId, subjectId);
        if (!existingReview) {
            throw new Error('NOT_FOUND');
        }

        const updateData: any = { isEdited: true };
        if (data.rating !== undefined) updateData.rating = data.rating;
        if (data.reviewText !== undefined) updateData.review = data.reviewText;

        const updated = await reviewRepository.updateReview(userId, subjectId, updateData);

        return {
            id: updated.id.toString(),
            rating: updated.rating,
            review: updated.review,
            isEdited: updated.isEdited,
            createdAt: updated.createdAt,
            user: {
                id: updated.user.id,
                name: updated.user.name,
                avatar: `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(updated.user.name)}`
            }
        };
    }

    async deleteReview(userId: string, subjectId: string) {
        const existingReview = await reviewRepository.findUserReviewForSubject(userId, subjectId);
        if (!existingReview) {
            throw new Error('NOT_FOUND');
        }
        await reviewRepository.deleteReview(userId, subjectId);
    }
}

export const reviewService = new ReviewService();
