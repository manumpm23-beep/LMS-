import { Section, Video } from '@prisma/client';

export type VideoNode = Video & { isCompleted: boolean; locked: boolean };
export type SectionNode = Section & { videos: VideoNode[] };

export const buildSubjectTree = (
    sections: (Section & { videos: Video[] })[],
    progressMap: Record<string, boolean>
): SectionNode[] => {
    const sortedSections = [...sections].sort((a, b) => a.orderIndex - b.orderIndex);

    const globalVideos: VideoNode[] = [];

    const tree: SectionNode[] = sortedSections.map(section => {
        const sortedVideos = [...section.videos].sort((a, b) => a.orderIndex - b.orderIndex);

        const videoNodes: VideoNode[] = sortedVideos.map(video => {
            const isCompleted = progressMap[video.id] || false;
            const node = { ...video, isCompleted, locked: false } as VideoNode;
            globalVideos.push(node);
            return node;
        });

        return { ...section, videos: videoNodes };
    });

    // Flat pass to assign strict locking sequentially 
    for (let i = 0; i < globalVideos.length; i++) {
        if (i === 0) {
            globalVideos[i].locked = false; // First video is always unlocked
        } else {
            const prevCompleted = globalVideos[i - 1].isCompleted;
            globalVideos[i].locked = !prevCompleted;
        }
    }

    return tree;
};

export const getGlobalVideoSequence = (
    sections: (Section & { videos: Video[] })[],
    progressMap: Record<string, boolean>
) => {
    const tree = buildSubjectTree(sections, progressMap);
    return tree.flatMap(section => section.videos);
};