import { Request, Response } from 'express';
import { prisma } from '../../config/db';

export const getSubjectProgress = async (req: Request, res: Response) => {
    try {
        const { subjectId } = req.params;
        const userId = req.user.id;

        const sections = await prisma.section.findMany({
            where: { subjectId },
            include: { videos: { select: { id: true } } }
        });

        const allVideos = sections.flatMap((s: any) => s.videos);
        const totalVideos = allVideos.length;

        const progressRecords = await prisma.videoProgress.findMany({
            where: { userId, video: { section: { subjectId } } },
            orderBy: { updatedAt: 'desc' }
        });

        const completedVideos = progressRecords.filter((p: any) => p.isCompleted).length;
        const percentComplete = totalVideos === 0 ? 0 : Math.round((completedVideos / totalVideos) * 100);

        const latestProgress = progressRecords.length > 0 ? progressRecords[0] : null;

        res.json({
            totalVideos,
            completedVideos,
            percentComplete,
            lastVideoId: latestProgress?.videoId || null,
            lastPositionSeconds: latestProgress?.lastPositionSeconds || 0
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getVideoProgress = async (req: Request, res: Response) => {
    try {
        const { videoId } = req.params;
        const userId = req.user.id;

        const progress = await prisma.videoProgress.findUnique({
            where: { userId_videoId: { userId, videoId } }
        });

        if (!progress) {
            return res.json({ lastPositionSeconds: 0, isCompleted: false });
        }

        res.json({
            lastPositionSeconds: progress.lastPositionSeconds,
            isCompleted: progress.isCompleted
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const upsertVideoProgress = async (req: Request, res: Response) => {
    try {
        const { videoId } = req.params;
        const userId = req.user.id;
        let { lastPositionSeconds, isCompleted } = req.body;

        const video = await prisma.video.findUnique({ where: { id: videoId } });
        if (!video) return res.status(404).json({ error: 'Video not found' });

        if (lastPositionSeconds !== undefined) {
            if (lastPositionSeconds < 0) lastPositionSeconds = 0;
            if (video.durationSeconds && lastPositionSeconds > video.durationSeconds) {
                lastPositionSeconds = video.durationSeconds;
            }
        }

        const currentProgress = await prisma.videoProgress.findUnique({
            where: { userId_videoId: { userId, videoId } }
        });

        const completingNow = isCompleted === true && (!currentProgress || !currentProgress.isCompleted);
        const uncompletingNow = isCompleted === false && (currentProgress && currentProgress.isCompleted);

        const completedAt = completingNow ? new Date() : (uncompletingNow ? null : currentProgress?.completedAt);

        const data = {
            ...(lastPositionSeconds !== undefined && { lastPositionSeconds }),
            ...(isCompleted !== undefined && { isCompleted }),
            ...(isCompleted !== undefined && { completedAt })
        };

        const progress = await prisma.videoProgress.upsert({
            where: { userId_videoId: { userId, videoId } },
            update: data,
            create: {
                userId,
                videoId,
                lastPositionSeconds: data.lastPositionSeconds || 0,
                isCompleted: data.isCompleted || false,
                completedAt: data.completedAt || null
            }
        });

        res.json(progress);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
