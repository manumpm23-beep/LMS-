import { prisma } from '../../config/db';

export class CommentRepository {
  async findVideoComments(videoId: string, userId: string, skip: number, take: number) {
    return prisma.comment.findMany({
      where: { videoId, parentId: null },
      include: {
        user: { select: { id: true, name: true } },
        _count: { select: { replies: true, upvotes: true } },
        upvotes: { where: { userId } },
        replies: {
          take: 3,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true } },
            _count: { select: { upvotes: true, replies: true } },
            upvotes: { where: { userId } }
          }
        }
      },
      orderBy: [
        { isPinned: 'desc' },
        { upvotes: { _count: 'desc' } },
        { createdAt: 'desc' }
      ],
      skip,
      take
    });
  }

  async countVideoComments(videoId: string) {
    return prisma.comment.count({ where: { videoId, parentId: null } });
  }

  async findCommentById(commentId: bigint) {
    return prisma.comment.findUnique({
      where: { id: commentId },
      include: { video: { select: { sectionId: true } } }
    });
  }

  async createComment(data: { videoId: string, userId: string, content: string, parentId?: bigint }) {
    return prisma.comment.create({
      data,
      include: { user: { select: { id: true, name: true } } }
    });
  }

  async updateComment(commentId: bigint, content: string) {
    return prisma.comment.update({
      where: { id: commentId },
      data: { content, isEdited: true },
      include: { user: { select: { id: true, name: true } } }
    });
  }

  async deleteComment(commentId: bigint) {
    return prisma.comment.delete({ where: { id: commentId } });
  }

  async findUpvote(commentId: bigint, userId: string) {
    return prisma.commentUpvote.findUnique({
      where: { commentId_userId: { commentId, userId } }
    });
  }

  async addUpvote(commentId: bigint, userId: string) {
    return prisma.commentUpvote.create({
      data: { commentId, userId }
    });
  }

  async removeUpvote(commentId: bigint, userId: string) {
    return prisma.commentUpvote.delete({
      where: { commentId_userId: { commentId, userId } }
    });
  }

  async countUpvotes(commentId: bigint) {
    return prisma.commentUpvote.count({ where: { commentId } });
  }

  async unpinAllVideoComments(videoId: string) {
    return prisma.comment.updateMany({
      where: { videoId, isPinned: true },
      data: { isPinned: false }
    });
  }

  async setPinned(commentId: bigint, isPinned: boolean) {
    return prisma.comment.update({
      where: { id: commentId },
      data: { isPinned }
    });
  }

  async findReplies(commentId: bigint, userId: string, skip: number, take: number) {
    return prisma.comment.findMany({
      where: { parentId: commentId },
      include: {
        user: { select: { id: true, name: true } },
        _count: { select: { upvotes: true, replies: true } },
        upvotes: { where: { userId } }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take
    });
  }
  
  async countReplies(commentId: bigint) {
    return prisma.comment.count({ where: { parentId: commentId } });
  }
}
