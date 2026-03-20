import { Request, Response } from 'express';
import { prisma } from '../../config/db';
import { buildSubjectTree } from '../../utils/ordering';

export const getSubjects = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 10;
        const q = req.query.q as string || '';

        const where = {
            isPublished: true,
            ...(q ? {
                OR: [
                    { title: { contains: q } },
                    { description: { contains: q } }
                ]
            } : {})
        };

        const total = await prisma.subject.count({ where });
        const subjects = await prisma.subject.findMany({
            where,
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: { createdAt: 'desc' },
        });

        res.json({
            data: subjects,
            meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getSubjectById = async (req: Request, res: Response) => {
    try {
        const { subjectId } = req.params;
        const subject = await prisma.subject.findUnique({
            where: { id: subjectId, isPublished: true },
        });
        if (!subject) return res.status(404).json({ error: 'Subject not found' });
        res.json(subject);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getSubjectTree = async (req: Request, res: Response) => {
    try {
        const { subjectId } = req.params;
        const userId = req.user.id;

        const subject = await prisma.subject.findUnique({
            where: { id: subjectId },
            include: {
                sections: {
                    include: { videos: true }
                }
            }
        });

        if (!subject) return res.status(404).json({ error: 'Subject not found' });

        const progressRecords = await prisma.videoProgress.findMany({
            where: { userId, video: { section: { subjectId } } }
        });

        const progressMap: Record<string, boolean> = {};
        progressRecords.forEach((p: any) => {
            progressMap[p.videoId] = p.isCompleted;
        });

        const sections = buildSubjectTree(subject.sections, progressMap);

        res.json({
            id: subject.id,
            title: subject.title,
            sections: sections.map(s => ({
                id: s.id,
                title: s.title,
                orderIndex: s.orderIndex,
                videos: s.videos.map((v: any) => ({
                    id: v.id,
                    title: v.title,
                    orderIndex: v.orderIndex,
                    isCompleted: v.isCompleted,
                    locked: v.locked
                }))
            }))
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
