'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/apiClient';
import { useSidebarStore } from '@/store/sidebarStore';
import { useAuthStore } from '@/store/authStore';
import VideoPlayer from '@/components/Video/VideoPlayer';
import VideoMeta from '@/components/Video/VideoMeta';
import VideoComments from '@/components/Video/VideoComments';
import { ChevronLeft, ChevronRight, CheckCircle2, Loader2, Lock } from 'lucide-react';

interface VideoData {
  id: string;
  title: string;
  description: string;
  youtubeUrl: string;
  orderIndex: number;
  durationSeconds: number | null;
  sectionId: string;
  sectionTitle: string;
  subjectId: string;
  subjectTitle: string;
  previousVideoId: string | null;
  nextVideoId: string | null;
  locked: boolean;
  unlockReason: string | null;
}

export default function VideoLessonPage({ params }: { params: { subjectId: string, videoId: string } }) {
  const { subjectId, videoId } = params;
  const router = useRouter();
  const markVideoCompleted = useSidebarStore(s => s.markVideoCompleted);
  const { user } = useAuthStore();

  const [video, setVideo] = useState<VideoData | null>(null);
  const [progress, setProgress] = useState<{ lastPositionSeconds: number, isCompleted: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [justCompleted, setJustCompleted] = useState(false);

  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setJustCompleted(false);

    async function load() {
      try {
        const vidReq = await apiClient.get(`/api/videos/${videoId}`);
        if (!active) return;

        const vData = vidReq.data;
        setVideo(vData);

        if (!vData.locked) {
          const progReq = await apiClient.get(`/api/progress/videos/${videoId}`);
          if (active) setProgress(progReq.data);
        }
      } catch (err: any) {
        if (active) setError(err.response?.data?.error || 'Failed to load video');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, [videoId]);

  const handleProgress = useCallback(async (time: number) => {
    const now = Date.now();
    if (now - lastUpdateRef.current < 4000) return; // simple 4s throttle
    lastUpdateRef.current = now;

    try {
      await apiClient.post(`/api/progress/videos/${videoId}`, {
        lastPositionSeconds: Math.floor(time)
      });
    } catch (e) {
      console.error('Failed to save progress');
    }
  }, [videoId]);

  const handleCompleted = useCallback(async () => {
    try {
      await apiClient.post(`/api/progress/videos/${videoId}`, {
        isCompleted: true
      });
      markVideoCompleted(videoId);

      setJustCompleted(true);
    } catch (e) {
      console.error('Failed to mark complete');
    }
  }, [videoId, markVideoCompleted]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !video || (!progress && !video?.locked)) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-red-500 text-lg font-medium">{error || 'Could not load resource'}</p>
      </div>
    );
  }

  if (video.locked) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8 text-center max-w-lg mx-auto">
        <div className="bg-gray-100 p-6 rounded-full mb-6">
          <Lock className="w-12 h-12 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Content Locked</h2>
        <p className="text-gray-500 mb-8">{video.unlockReason || 'Complete previous video to unlock this one.'}</p>

        {video.previousVideoId && (
          <Link
            href={`/subjects/${subjectId}/video/${video.previousVideoId}`}
            className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Go to Previous Lesson
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto w-full pb-24">
      {/* Header / Breadcrumbs */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm font-medium text-gray-500">
          <span className="opacity-70">{video.subjectTitle}</span>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{video.sectionTitle}</span>
        </div>

        {progress?.isCompleted ? (
          <div className="flex items-center text-green-600 bg-green-50 px-3 py-1.5 rounded-full text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Completed
          </div>
        ) : (
          <div className="text-sm font-medium text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">
            In Progress
          </div>
        )}
      </div>

      <VideoPlayer
        videoId={video.id}
        youtubeUrl={video.youtubeUrl}
        startPositionSeconds={progress?.lastPositionSeconds || 0}
        onProgress={handleProgress}
        onCompleted={handleCompleted}
      />

      <VideoMeta title={video.title} description={video.description} />

      {/* Navigation Footer */}
      <div className="flex items-center justify-between mt-8">
        {video.previousVideoId ? (
          <Link
            href={`/subjects/${subjectId}/video/${video.previousVideoId}`}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors font-medium border-b-4 border-b-gray-300 active:border-b active:translate-y-[3px]"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Previous</span>
          </Link>
        ) : <div />}

        {video.nextVideoId ? (
          <Link
            href={`/subjects/${subjectId}/video/${video.nextVideoId}`}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gray-900 text-white hover:bg-black transition-colors font-medium border-b-4 border-b-gray-700 active:border-b active:translate-y-[3px]"
          >
            <span>Next Lesson</span>
            <ChevronRight className="w-5 h-5" />
          </Link>
        ) : justCompleted ? (
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-green-50 text-green-700 font-bold border border-green-200">
            Course Completed!
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
        ) : <div />}
      </div>

      {/* Q&A Comments Matrix */}
      <VideoComments videoId={videoId} currentUser={user} />
    </div>
  );
}