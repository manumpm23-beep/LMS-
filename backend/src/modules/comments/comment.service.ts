import { CommentRepository } from './comment.repository';

const commentRepo = new CommentRepository();

const formatComment = (comment: any) => ({
    id: comment.id.toString(),
    content: comment.content,
    isPinned: comment.isPinned,
    isEdited: comment.isEdited,
    createdAt: comment.createdAt,
    user: {
        id: comment.user.id,
        name: comment.user.name,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(comment.user.name)}`
    },
    upvoteCount: comment._count?.upvotes || 0,
    hasUpvoted: comment.upvotes?.length > 0,
    replyCount: comment._count?.replies || 0,
    replies: comment.replies ? comment.replies.map((reply: any) => formatComment(reply)) : []
});

export class CommentService {
    async getVideoComments(videoId: string, userId: string, page: number, pageSize: number) {
        const skip = (page - 1) * pageSize;
        const totalCount = await commentRepo.countVideoComments(videoId);
        const comments = await commentRepo.findVideoComments(videoId, userId, skip, pageSize);
        
        return {
            data: comments.map(formatComment),
            totalCount,
            currentPage: page,
            totalPages: Math.ceil(totalCount / pageSize)
        };
    }

    async createComment(videoId: string, userId: string, content: string, parentIdRaw?: string | number) {
        let parentId: bigint | undefined = undefined;
        if (parentIdRaw) {
            parentId = BigInt(parentIdRaw);
            const parent = await commentRepo.findCommentById(parentId);
            if (!parent) throw new Error('Parent comment not found');
            if (parent.videoId !== videoId) throw new Error('Parent comment belongs to a different video');
        }

        const comment = await commentRepo.createComment({ videoId, userId, content, parentId });
        return {
            id: comment.id.toString(),
            content: comment.content,
            isPinned: comment.isPinned,
            isEdited: comment.isEdited,
            createdAt: comment.createdAt,
            user: {
                id: comment.user.id,
                name: comment.user.name,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(comment.user.name)}`
            },
            upvoteCount: 0,
            hasUpvoted: false,
            replyCount: 0,
            replies: []
        };
    }

    async updateComment(commentIdRaw: string, userId: string, content: string) {
        const commentId = BigInt(commentIdRaw);
        const comment = await commentRepo.findCommentById(commentId);
        
        if (!comment) throw new Error('Comment not found');
        if (comment.userId !== userId) throw new Error('Unauthorized: You do not own this comment');

        const updated = await commentRepo.updateComment(commentId, content);
        return {
            id: updated.id.toString(),
            content: updated.content,
            isEdited: updated.isEdited
        };
    }

    async deleteComment(commentIdRaw: string, userId: string, userRole?: string) {
        const commentId = BigInt(commentIdRaw);
        const comment = await commentRepo.findCommentById(commentId);
        
        if (!comment) throw new Error('Comment not found');
        
        const isOwner = comment.userId === userId;
        const isAdmin = userRole === 'Admin'; 

        if (!isOwner && !isAdmin) {
            throw new Error('Unauthorized: You cannot delete this comment');
        }

        await commentRepo.deleteComment(commentId);
        return { message: 'Comment deleted successfully' };
    }

    async toggleUpvote(commentIdRaw: string, userId: string) {
        const commentId = BigInt(commentIdRaw);
        const comment = await commentRepo.findCommentById(commentId);
        if (!comment) throw new Error('Comment not found');

        const existingUpvote = await commentRepo.findUpvote(commentId, userId);
        let upvoted = false;

        if (existingUpvote) {
            await commentRepo.removeUpvote(commentId, userId);
            upvoted = false;
        } else {
            await commentRepo.addUpvote(commentId, userId);
            upvoted = true;
        }

        const upvoteCount = await commentRepo.countUpvotes(commentId);
        return { upvoted, upvoteCount };
    }

    async togglePin(commentIdRaw: string, userRole?: string) {
        if (userRole !== 'Admin' && userRole !== 'Instructor') {
            throw new Error('Unauthorized to pin comments');
        }

        const commentId = BigInt(commentIdRaw);
        const comment = await commentRepo.findCommentById(commentId);
        
        if (!comment) throw new Error('Comment not found');

        const isPinned = !comment.isPinned;

        if (isPinned) {
            await commentRepo.unpinAllVideoComments(comment.videoId);
        }

        await commentRepo.setPinned(commentId, isPinned);
        return { isPinned };
    }

    async getCommentReplies(commentIdRaw: string, userId: string, page: number, pageSize: number) {
        const commentId = BigInt(commentIdRaw);
        const skip = (page - 1) * pageSize;
        const totalCount = await commentRepo.countReplies(commentId);
        const replies = await commentRepo.findReplies(commentId, userId, skip, pageSize);
        
        return {
            data: replies.map(formatComment),
            totalCount,
            currentPage: page,
            totalPages: Math.ceil(totalCount / pageSize)
        };
    }
}
