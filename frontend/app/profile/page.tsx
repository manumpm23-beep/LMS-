'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import AuthGuard from '@/components/Auth/AuthGuard';
import { apiClient } from '@/lib/apiClient';
import Link from 'next/link';
import { Loader2, PlayCircle, LogOut } from 'lucide-react';

interface SubjectProgress {
  subjectId: string;
  title: string;
  totalVideos: number;
  completedVideos: number;
  percentComplete: number;
  lastVideoId: string | null;
}

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const [progresses, setProgresses] = useState<SubjectProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const subsRes = await apiClient.get('/api/subjects?pageSize=100');
        const subjects = subsRes.data.data;

        const progressPromises = subjects.map(async (sub: any) => {
          const pRes = await apiClient.get(`/api/progress/subjects/${sub.id}`);
          return {
            subjectId: sub.id,
            title: sub.title,
            ...pRes.data
          };
        });

        const allProgress = await Promise.all(progressPromises);

        // Filter strictly to subjects where user actually has progress metrics.
        const activeProgress = allProgress.filter(
          p => p.lastVideoId !== null || p.completedVideos > 0
        );

        if (active) setProgresses(activeProgress);
      } catch (err: any) {
        if (active) setError('Failed to load profile data.');
      } finally {
        if (active) setLoading(false);
      }
    }

    if (user) loadData();
    return () => { active = false; };
  }, [user]);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* User Profile Header */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between transition-all">
            <div className="flex items-center space-x-6 mb-6 md:mb-0">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center text-2xl font-bold uppercase shadow-inner">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">{user?.name}</h1>
                <p className="text-gray-500 font-medium">{user?.email}</p>
              </div>
            </div>

            <button
              onClick={() => logout()}
              className="flex items-center px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-medium text-sm w-fit"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </button>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Your Learning Progress</h2>

            {loading ? (
              <div className="flex items-center justify-center p-12 bg-white rounded-2xl shadow-sm border border-gray-100">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : error ? (
              <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 font-medium text-center shadow-sm">
                {error}
              </div>
            ) : progresses.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center">
                <p className="text-gray-500 font-medium text-lg">You haven't started any courses yet.</p>
                <Link
                  href="/"
                  className="inline-block mt-4 text-primary font-medium hover:underline"
                >
                  Browse our catalog →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {progresses.map(prog => (
                  <div key={prog.subjectId} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md hover:border-gray-200 group">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

                      <div className="flex-1">
                        <Link href={`/subjects/${prog.subjectId}`} className="hover:underline">
                          <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors">{prog.title}</h3>
                        </Link>
                        <p className="text-sm font-medium text-gray-500 mt-1">
                          {prog.completedVideos} of {prog.totalVideos} videos completed
                        </p>

                        {/* Progress Bar */}
                        <div className="mt-4 flex items-center space-x-3">
                          <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                              style={{ width: `${prog.percentComplete}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold text-gray-700 w-12 text-right">
                            {prog.percentComplete}%
                          </span>
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        {prog.lastVideoId ? (
                          <Link
                            href={`/subjects/${prog.subjectId}/video/${prog.lastVideoId}`}
                            className="flex items-center justify-center w-full md:w-auto px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-black transition-colors font-medium shadow-sm hover:shadow active:scale-95"
                          >
                            <PlayCircle className="w-5 h-5 mr-2" />
                            Resume
                          </Link>
                        ) : (
                          <Link
                            href={`/subjects/${prog.subjectId}`}
                            className="flex items-center justify-center w-full md:w-auto px-6 py-3 bg-primary text-white rounded-xl hover:bg-blue-600 transition-colors font-medium shadow-sm hover:shadow active:scale-95"
                          >
                            <PlayCircle className="w-5 h-5 mr-2" />
                            Start Course
                          </Link>
                        )}
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}