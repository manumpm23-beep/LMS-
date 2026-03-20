import { Request, Response } from 'express';
import { prisma } from '../../config/db';
import { getGlobalVideoSequence } from '../../utils/ordering';

export const getVideoById = async (req: Request, res: Response) => {
    try {
        const { videoId } = req.params;
        const userId = req.user.id;

        const video = await prisma.video.findUnique({
            where: { id: videoId },
            include: {
                section: { include: { subject: { include: { sections: { include: { videos: true } } } } } }
            }
        });

        if (!video) return res.status(404).json({ error: 'Video not found' });

        const subjectId = video.section.subjectId;
        const allSections = video.section.subject.sections;

        const progressRecords = await prisma.videoProgress.findMany({
            where: { userId, video: { section: { subjectId } } }
        });
        const progressMap: Record<string, boolean> = {};
        progressRecords.forEach((p: any) => progressMap[p.videoId] = p.isCompleted);

        const seq = getGlobalVideoSequence(allSections, progressMap);

        const currentIndex = seq.findIndex(v => v.id === videoId);
        if (currentIndex === -1) return res.status(404).json({ error: 'Video sequence anomaly' });

        const currentVideo = seq[currentIndex];

        const previousVideoId = currentIndex > 0 ? seq[currentIndex - 1].id : null;
        const nextVideoId = currentIndex < seq.length - 1 ? seq[currentIndex + 1].id : null;

        let unlockReason = null;
        if (currentVideo.locked) {
            unlockReason = 'Previous video must be completed to unlock this content.';
        }

        res.json({
            id: currentVideo.id,
            title: currentVideo.title,
            description: currentVideo.description,
            youtubeUrl: currentVideo.youtubeUrl,
            orderIndex: currentVideo.orderIndex,
            durationSeconds: currentVideo.durationSeconds,
            sectionId: video.section.id,
            sectionTitle: video.section.title,
            subjectId: video.section.subject.id,
            subjectTitle: video.section.subject.title,
            previousVideoId,
            nextVideoId,
            locked: currentVideo.locked,
            unlockReason
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getFirstVideoOfSubject = async (req: Request, res: Response) => {
    try {
        const { subjectId } = req.params;
        const userId = req.user.id;

        const sections = await prisma.section.findMany({
            where: { subjectId },
            include: { videos: true }
        });
        if (!sections.length) return res.status(404).json({ error: 'No sections found' });

        const progressRecords = await prisma.videoProgress.findMany({
            where: { userId, video: { section: { subjectId } } }
        });
        const progressMap: Record<string, boolean> = {};
        progressRecords.forEach((p: any) => progressMap[p.videoId] = p.isCompleted);

        const seq = getGlobalVideoSequence(sections, progressMap);
        if (!seq.length) return res.status(404).json({ error: 'No videos found' });

        let targetVideoId = seq[0].id;
        for (const v of seq) {
            if (!v.locked && !v.isCompleted) {
                targetVideoId = v.id;
                break;
            }
        }

        res.json({ videoId: targetVideoId });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
