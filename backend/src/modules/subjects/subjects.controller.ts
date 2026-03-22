import { Request, Response } from 'express';
import { prisma } from '../../config/db';
import { buildSubjectTree } from '../../utils/ordering';

export const seedDatabase = async (req: Request, res: Response) => {
    try {
        const inputSubjects = [
            {
                title: "Python Programming",
                slug: "python-programming",
                desc: "Python is one of the most beginner-friendly and powerful programming languages in the world. In this course, you'll start from absolute zero — learning variables, data types, type casting, loops, functions, and object-oriented programming. By the end, you'll be able to write real scripts, automate tasks, and build the foundation needed for backend development, data science, or AI."
            },
            {
                title: "Frontend Development",
                slug: "frontend-development",
                desc: "Frontend development is all about building what users see and interact with on the web. This course covers the full trio — HTML for structure, CSS for styling, and JavaScript for interactivity. You'll learn how to build responsive layouts, style components beautifully, handle DOM events, and create dynamic user interfaces that work across all devices and screen sizes."
            },
            {
                title: "SQL & Databases",
                slug: "sql-databases",
                desc: "Databases are the backbone of every application, and SQL is the language used to talk to them. This course takes you from basic SELECT queries all the way to complex JOINs, subqueries, indexes, and transactions. You'll learn how to design normalized schemas, write efficient queries, and manage relational data using MySQL — one of the most widely used databases in the industry."
            },
            {
                title: "React.js",
                slug: "react-js",
                desc: "React is the most popular JavaScript library for building modern, component-based user interfaces. This course covers everything from JSX and props to state management, hooks like useState and useEffect, and connecting to REST APIs. You'll build real projects that mirror what professional frontend developers ship every day at top tech companies around the world."
            },
            {
                title: "Node.js & Express",
                slug: "nodejs-express",
                desc: "Node.js brings JavaScript to the server side, and Express makes building REST APIs fast and clean. In this course you'll learn how to create API routes, handle middleware, connect to databases, manage authentication with JWT, and structure a production-ready backend. This is the exact stack powering thousands of real-world applications running at scale today."
            },
            {
                title: "CSS & Tailwind",
                slug: "css-tailwind",
                desc: "Great UI starts with great CSS. This course covers core CSS concepts — the box model, flexbox, grid, animations, and responsive design — before diving into Tailwind CSS, the utility-first framework that lets you build stunning interfaces without ever leaving your HTML. You'll go from basic styling to professional, pixel-perfect designs that look great on any screen size."
            },
            {
                title: "TypeScript",
                slug: "typescript",
                desc: "TypeScript is JavaScript with superpowers — it adds static types that catch bugs before your code even runs. This course covers type annotations, interfaces, generics, enums, and how to integrate TypeScript into both frontend and backend projects. Learning TypeScript will make you a significantly more confident and productive developer, especially on larger codebases and team projects."
            },
            {
                title: "Data Structures & Algorithms",
                slug: "dsa",
                desc: "Data Structures and Algorithms are the foundation of computer science and the key to cracking technical interviews. This course covers arrays, linked lists, stacks, queues, trees, graphs, sorting algorithms, and dynamic programming. Each concept is explained visually and practically, with real coding problems so you build both the intuition and the problem-solving skills that top companies test for."
            },
            {
                title: "Next.js",
                slug: "next-js",
                desc: "Next.js is the go-to framework for building full-stack React applications with features like server-side rendering, static generation, the App Router, and API routes built in. This course walks you through building production-grade web apps — handling routing, data fetching strategies, authentication, and deployment to Vercel. It's the framework behind some of the fastest and most scalable websites on the internet."
            },
            {
                title: "Git & GitHub",
                slug: "git-github",
                desc: "Every professional developer uses Git daily — it's the industry-standard tool for version control and collaboration. This course covers everything from your first commit to branching strategies, resolving merge conflicts, pull requests, and working in team workflows on GitHub. Whether you're building solo projects or contributing to open source, mastering Git is a non-negotiable skill in your developer toolkit."
            }
        ];

        for (const sub of inputSubjects) {
            const exists = await prisma.subject.findUnique({ where: { slug: sub.slug } });

            if (!exists) {
                await prisma.subject.create({
                    data: {
                        title: sub.title,
                        slug: sub.slug,
                        description: sub.desc,
                        isPublished: true,
                        sections: {
                            create: [
                                {
                                    title: "Introduction",
                                    orderIndex: 0,
                                    videos: {
                                        create: [
                                            {
                                                title: `Welcome to ${sub.title}`,
                                                youtubeUrl: 'M7lc1UVf-VE',
                                                orderIndex: 0,
                                                description: `An introduction to the core concepts of ${sub.title}.`,
                                                durationSeconds: 300
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                });
            }
        }

        res.json({ message: 'Successfully seeded the database with all requested explicit courses!' });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
};

export const getSubjects = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.limit as string) || 10;
        const q = req.query.q as string || '';
        const category = req.query.category as string || '';
        const sort = req.query.sort as string || 'newest';

        const where: any = { isPublished: true };
        
        if (q) {
            where.OR = [
                { title: { contains: q } },
                { description: { contains: q } }
            ];
        }
        
        if (category) {
            where.category = category;
        }

        const totalCount = await prisma.subject.count({ where });

        let orderByClause: any = { createdAt: 'desc' };
        if (sort === 'popular') {
            orderByClause = { enrollments: { _count: 'desc' } };
        }

        const subjects = await prisma.subject.findMany({
            where,
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: orderByClause,
            include: {
                _count: {
                    select: { enrollments: true }
                },
                sections: {
                    include: {
                        videos: {
                            select: { id: true, durationSeconds: true }
                        }
                    }
                }
            }
        });

        const mappedSubjects = subjects.map((sub: any) => {
            let totalDuration = 0;
            let totalVideos = 0;

            if (sub.sections) {
                sub.sections.forEach((sec: any) => {
                    totalVideos += sec.videos.length;
                    sec.videos.forEach((vid: any) => {
                        totalDuration += (vid.durationSeconds || 0);
                    });
                });
            }

            return {
                id: sub.id,
                title: sub.title,
                slug: sub.slug,
                description: sub.description,
                thumbnailUrl: sub.thumbnailUrl,
                instructorName: sub.instructorName,
                instructorPhoto: sub.instructorPhoto,
                category: sub.category,
                whatYouWillLearn: sub.whatYouWillLearn,
                enrollmentCount: sub._count?.enrollments || 0,
                totalVideos,
                totalDuration,
                createdAt: sub.createdAt
            };
        });

        res.json({
            data: mappedSubjects,
            totalCount,
            currentPage: page,
            totalPages: Math.ceil(totalCount / pageSize)
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

export const enrollSubject = async (req: Request, res: Response) => {
    try {
        const { subjectId } = req.params;
        const userId = req.user.id;

        const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
        if (!subject) return res.status(404).json({ error: 'Subject not found' });

        const existingEnrollment = await prisma.enrollment.findUnique({
            where: { userId_subjectId: { userId, subjectId } }
        });

        if (existingEnrollment) {
            return res.status(400).json({ error: 'Already enrolled' });
        }

        await prisma.enrollment.create({
            data: { userId, subjectId }
        });

        res.status(201).json({ message: 'Successfully enrolled' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
