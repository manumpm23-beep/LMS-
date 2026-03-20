import { Request, Response } from 'express';
import { prisma } from '../../config/db';
import { buildSubjectTree } from '../../utils/ordering';

export const seedDatabase = async (req: Request, res: Response) => {
    try {
        const count = await prisma.subject.count();
        if (count > 0) return res.status(400).json({ message: 'Database is already seeded with subjects!' });

        await prisma.subject.create({
            data: {
                title: 'Advanced React Architecture',
                slug: 'advanced-react',
                description: 'Master the core mechanics of scalable React applications, Zustand state management, and strict TypeScript integration.',
                isPublished: true,
                sections: {
                    create: [
                        {
                            title: 'State Management Basics',
                            orderIndex: 0,
                            videos: {
                                create: [
                                    { title: 'Why Zustand?', youtubeUrl: 'KCrXgy8qtjM', orderIndex: 0, description: 'An introduction to lightweight global states.' },
                                    { title: 'Building your first Store', youtubeUrl: 'KCrXgy8qtjM', orderIndex: 1, description: 'Creating and binding states natively.' },
                                ]
                            }
                        },
                        {
                            title: 'Performance & Architecture',
                            orderIndex: 1,
                            videos: {
                                create: [
                                    { title: 'Preventing Re-Renders', youtubeUrl: 'KCrXgy8qtjM', orderIndex: 0, description: 'Using strict selectors defensively.' }
                                ]
                            }
                        }
                    ]
                }
            }
        });

        await prisma.subject.create({
            data: {
                title: 'UI/UX Design Mastery',
                slug: 'ui-ux-design',
                description: 'Learn the exact spatial logic and color theories necessary to build stunning, premium visual interfaces from scratch.',
                isPublished: true,
                sections: {
                    create: [
                        {
                            title: 'The Fundamentals',
                            orderIndex: 0,
                            videos: {
                                create: [
                                    { title: 'Color Theory', youtubeUrl: 'M7lc1UVf-VE', orderIndex: 0, description: 'Understanding global gradient bounds.' },
                                    { title: 'Spatial Geometry', youtubeUrl: 'M7lc1UVf-VE', orderIndex: 1 }
                                ]
                            }
                        }
                    ]
                }
            }
        });

        res.json({ message: 'Successfully seeded the database with premium test courses!' });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
};

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
