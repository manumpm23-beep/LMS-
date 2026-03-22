'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { Loader2 } from 'lucide-react';

export default function SubjectPage({ params }: { params: { subjectId: string } }) {
  const router = useRouter();

  useEffect(() => {
    let active = true;

    async function checkEnrollmentAndRedirect() {
      try {
        const dashRes = await apiClient.get('/api/dashboard');
        if (!active) return;
        
        const enrolled = dashRes.data.enrolledCourses?.some((c: any) => c.subjectId === params.subjectId);

        if (!enrolled) {
          router.replace('/');
          return;
        }

        // enrolled, try to get progress for last watched video
        try {
          const progRes = await apiClient.get(`/api/progress/subjects/${params.subjectId}`);
          if (progRes.data && progRes.data.lastWatchedVideoId) {
            router.replace(`/subjects/${params.subjectId}/video/${progRes.data.lastWatchedVideoId}`);
            return;
          }
        } catch (e) {
          // Fallback to first video if progress fetch fails or no lastWatchedVideoId
        }

        if (!active) return;

        // Fetch first video
        const firstRes = await apiClient.get(`/api/subjects/${params.subjectId}/first-video`);
        const firstVideoId = firstRes.data?.id || firstRes.data?.videoId;
        if (firstVideoId) {
          router.replace(`/subjects/${params.subjectId}/video/${firstVideoId}`);
        } else {
          router.replace('/');
        }

      } catch (err) {
        if (active) router.replace('/');
      }
    }

    checkEnrollmentAndRedirect();
    return () => { active = false; };
  }, [params.subjectId, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f9fafb]">
      <Loader2 className="w-10 h-10 text-[#2d2d2d] animate-spin mb-4" />
      <p className="text-[#6b7280] font-medium text-lg">Loading...</p>
    </div>
  );
}