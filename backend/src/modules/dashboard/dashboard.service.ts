import { DashboardRepository } from './dashboard.repository';

const dashboardRepo = new DashboardRepository();

export class DashboardService {
  async getDashboardData(userId: string) {
    const user = await dashboardRepo.getUser(userId);
    if (!user) throw new Error('User not found');

    const enrollments = await dashboardRepo.getEnrollments(userId);
    const progressRecords = await dashboardRepo.getVideoProgress(userId);

    const completedDates = progressRecords
        .filter((p: any) => p.isCompleted && p.completedAt)
        .map((p: any) => new Date(p.completedAt).toISOString().split('T')[0]);

    const uniqueCompletedDates = Array.from(new Set(completedDates)).sort((a: any, b: any) => new Date(b).getTime() - new Date(a).getTime());

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const todayDate = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    let isCurrentStreakValid = true;

    for (let i = 0; i < uniqueCompletedDates.length; i++) {
        const currentDate = new Date(uniqueCompletedDates[i] as string);
        
        if (i === 0) {
            tempStreak = 1;
            if (uniqueCompletedDates[i] !== todayDate && uniqueCompletedDates[i] !== yesterdayDate) {
                isCurrentStreakValid = false;
            }
        } else {
            const previousLoopDate = new Date(uniqueCompletedDates[i - 1] as string);
            const diffTime = Math.abs(previousLoopDate.getTime() - currentDate.getTime());
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
            
            if (diffDays === 1) {
                tempStreak++;
            } else {
                if (isCurrentStreakValid && currentStreak === 0) {
                    currentStreak = tempStreak;
                }
                tempStreak = 1;
            }
        }
        
        if (tempStreak > longestStreak) longestStreak = tempStreak;
    }
    
    if (isCurrentStreakValid && currentStreak === 0) {
        currentStreak = tempStreak;
    }

    const completedProgress = progressRecords.filter((p: any) => p.isCompleted);
    const totalLessonsCompleted = completedProgress.length;
    let totalSecondsWatched = 0;
    completedProgress.forEach((p: any) => {
        totalSecondsWatched += p.video?.durationSeconds || 0;
    });

    const enrolledCourses: any[] = [];
    let totalCompletedCourses = 0;

    for (const enrollment of enrollments) {
        const subject = enrollment.subject;
        let totalVideos = 0;
        let completedVideosInSubject = 0;
        
        let lastWatchedAt: Date | null = null;
        let lastWatchedVideoId: string | null = null;
        let lastWatchedVideoTitle: string | null = null;

        const subjectVideoIds = new Set<string>();

        subject.sections.forEach((sec: any) => {
            totalVideos += sec.videos.length;
            sec.videos.forEach((vid: any) => {
                subjectVideoIds.add(vid.id);
            });
        });

        progressRecords.forEach((p: any) => {
            if (subjectVideoIds.has(p.videoId)) {
                if (p.isCompleted) completedVideosInSubject++;
                if (!lastWatchedAt || new Date(p.updatedAt) > new Date(lastWatchedAt)) {
                    lastWatchedAt = p.updatedAt as Date;
                    lastWatchedVideoId = p.videoId;
                    lastWatchedVideoTitle = p.video?.title || null;
                }
            }
        });

        const percentComplete = totalVideos > 0 ? (completedVideosInSubject / totalVideos) * 100 : 0;
        const isCompleted = totalVideos > 0 && percentComplete === 100;

        if (isCompleted) totalCompletedCourses++;

        enrolledCourses.push({
            subjectId: subject.id,
            title: subject.title,
            slug: subject.slug,
            thumbnailUrl: subject.thumbnailUrl,
            instructorName: subject.instructorName,
            category: subject.category,
            totalVideos,
            completedVideos: completedVideosInSubject,
            percentComplete,
            lastWatchedVideoId,
            lastWatchedVideoTitle,
            lastWatchedAt,
            isCompleted
        });
    }

    enrolledCourses.sort((a: any, b: any) => {
        if (!a.lastWatchedAt) return 1;
        if (!b.lastWatchedAt) return -1;
        return new Date(b.lastWatchedAt).getTime() - new Date(a.lastWatchedAt).getTime();
    });

    const recentlyWatched = progressRecords.slice(0, 5).map((p: any) => ({
        videoId: p.videoId,
        videoTitle: p.video?.title,
        subjectId: p.video?.section?.subject?.id,
        subjectTitle: p.video?.section?.subject?.title,
        thumbnailUrl: p.video?.section?.subject?.thumbnailUrl,
        lastPositionSeconds: p.lastPositionSeconds,
        isCompleted: p.isCompleted,
        watchedAt: p.updatedAt
    }));

    return {
        user: { ...user, role: 'Student' },
        stats: {
            totalEnrolledCourses: enrollments.length,
            totalCompletedCourses,
            totalLessonsCompleted,
            totalHoursWatched: parseFloat((totalSecondsWatched / 3600).toFixed(2)),
            currentStreak,
            longestStreak,
            completedDates: uniqueCompletedDates
        },
        enrolledCourses,
        recentlyWatched
    };
  }
}
