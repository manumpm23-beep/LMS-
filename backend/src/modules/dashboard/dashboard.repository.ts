import { prisma } from '../../config/db';

export class DashboardRepository {
  async getUser(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, createdAt: true }
    });
  }

  async getEnrollments(userId: string) {
    return prisma.enrollment.findMany({
      where: { userId },
      include: {
        subject: {
          include: {
            sections: {
              include: {
                videos: {
                  select: { id: true, durationSeconds: true }
                }
              }
            }
          }
        }
      }
    });
  }

  async getVideoProgress(userId: string) {
    return prisma.videoProgress.findMany({
      where: { userId },
      include: {
        video: {
          include: {
            section: {
              include: {
                subject: {
                  select: { id: true, title: true, slug: true, thumbnailUrl: true, instructorName: true, category: true }
                }
              }
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
  }
}
