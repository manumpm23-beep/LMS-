'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { Loader2 } from 'lucide-react';

export default function SubjectPage({ params }: { params: { subjectId: string } }) {
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function fetchFirst() {
      try {
        const res = await apiClient.get(`/api/subjects/${params.subjectId}/first-video`);
        if (active && res.data.videoId) {
          router.replace(`/subjects/${params.subjectId}/video/${res.data.videoId}`);
        }
      } catch (err: any) {
        if (active) setError('Could not dynamically find a video to launch.');
      }
    }

    fetchFirst();
    return () => { active = false; };
  }, [params.subjectId, router]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-red-500 text-lg font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
        <h1 className="text-xl font-medium text-gray-700">Identifying your syllabus position...</h1>
      </div>
    </div>
  );
}