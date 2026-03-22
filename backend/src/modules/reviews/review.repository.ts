import { prisma } from '../../config/db';

export class ReviewRepository {
    async findReviewsBySubjectId(subjectId: string, skip: number, take: number) {
        return prisma.review.findMany({
            where: { subjectId },
            skip,
            take,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                    }
                }
            }
        });
    }

    async countReviewsBySubjectId(subjectId: string) {
        return prisma.review.count({ where: { subjectId } });
    }

    async getReviewSummary(subjectId: string) {
        const reviews = await prisma.review.findMany({
            where: { subjectId },
            select: { rating: true }
        });

        const totalReviews = reviews.length;
        let sum = 0;
        const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

        reviews.forEach(r => {
            sum += r.rating;
            if (ratingBreakdown[r.rating as keyof typeof ratingBreakdown] !== undefined) {
                ratingBreakdown[r.rating as keyof typeof ratingBreakdown]++;
            }
        });

        const averageRating = totalReviews > 0 ? (sum / totalReviews) : 0;

        return {
            totalReviews,
            averageRating: Math.round(averageRating * 10) / 10,
            ratingBreakdown
        };
    }

    async findUserReviewForSubject(userId: string, subjectId: string) {
        return prisma.review.findUnique({
            where: { subjectId_userId: { subjectId, userId } },
            include: {
                user: {
                    select: { id: true, name: true }
                }
            }
        });
    }

    async createReview(data: any) {
        return prisma.review.create({
            data,
            include: {
                user: { select: { id: true, name: true } }
            }
        });
    }

    async updateReview(userId: string, subjectId: string, data: any) {
        return prisma.review.update({
            where: { subjectId_userId: { subjectId, userId } },
            data,
            include: {
                user: { select: { id: true, name: true } }
            }
        });
    }

    async deleteReview(userId: string, subjectId: string) {
        return prisma.review.delete({
            where: { subjectId_userId: { subjectId, userId } }
        });
    }

    async checkEnrollment(userId: string, subjectId: string) {
        return prisma.enrollment.findUnique({
            where: { userId_subjectId: { userId, subjectId } }
        });
    }
}

export const reviewRepository = new ReviewRepository();
