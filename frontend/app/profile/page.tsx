'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/lib/apiClient';
import Link from 'next/link';
import { BookOpen, LogOut, PlayCircle, CheckCircle, ArrowRight, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const [progressData, setProgressData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    apiClient.get('/api/subjects?pageSize=100')
      .then(async (res) => {
        const subjects = res.data.data;
        const promises = subjects.map((sub: any) =>
          apiClient.get(`/api/progress/subjects/${sub.id}`)
            .then(pRes => ({ subject: sub, progress: pRes.data }))
            .catch(() => ({ subject: sub, progress: null }))
        );
        const results = await Promise.all(promises);
        const activeCourses = results.filter(r => r.progress && r.progress.totalVideos > 0);
        setProgressData(activeCourses);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] font-sans selection:bg-purple-500/30">

      {/* Dynamic Background Glows */}
      <div className="fixed top-0 left-0 w-full max-w-lg h-[500px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-pink-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Navbar Minimal */}
      <nav className="bg-[#0f0f11]/80 border-b border-white/10 sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors group">
            <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/10 transition-colors">
              <Home className="w-5 h-5" />
            </div>
            <span className="font-bold tracking-tight">Home</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors font-bold text-sm bg-red-400/10 hover:bg-red-400/20 px-6 py-3 rounded-full border border-red-400/20"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16 relative z-10">

        {/* User Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-10 flex items-center gap-8 shadow-2xl relative overflow-hidden mb-12">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 pointer-events-none" />
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center text-4xl font-extrabold text-white shadow-[0_0_40px_rgba(168,85,247,0.4)]">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-white tracking-tighter">{user?.name}</h1>
            <p className="text-slate-400 mt-2 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {user?.email}
            </p>
          </div>
        </div>

        <h2 className="text-2xl font-extrabold text-white mb-8 tracking-tight">Your Learning Dashboard</h2>

        {loading ? (
          <div className="space-y-6 animate-pulse">
            {[1, 2].map(i => (
              <div key={i} className="h-40 bg-white/5 border border-white/10 rounded-[2rem] backdrop-blur-md" />
            ))}
          </div>
        ) : progressData.length === 0 ? (
          <div className="text-center py-20 bg-white/5 border border-white/10 rounded-[2rem] backdrop-blur-md">
            <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-6" />
            <p className="text-white text-xl font-bold mb-4 tracking-tight">You haven't stared any courses yet.</p>
            <Link href="/" className="inline-flex flex-row items-center justify-center px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-slate-200 transition-colors shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:scale-105">
              Browse our catalog
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {progressData.map((item) => {
              const { subject, progress } = item;
              const isFinished = progress.percentage === 100;
              return (
                <div key={subject.id} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 hover:bg-white/10 transition-all duration-300 overflow-hidden relative group shadow-lg">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] group-hover:bg-purple-500/20 transition-all duration-500" />

                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 relative z-10">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="w-12 h-12 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                          {isFinished ? <CheckCircle className="w-6 h-6 text-emerald-400" /> : <PlayCircle className="w-6 h-6 text-indigo-400" />}
                        </div>
                        <h3 className="text-2xl font-extrabold text-white tracking-tight leading-tight">{subject.title}</h3>
                      </div>

                      <div className="mt-6 flex items-center justify-between text-sm font-bold text-slate-400 mb-3 px-1">
                        <span>{progress.completedVideos} of {progress.totalVideos} Videos Completed</span>
                        <span className="text-white bg-white/10 px-3 py-1 rounded-full">{Math.round(progress.percentage)}%</span>
                      </div>
                      <div className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-3 rounded-full transition-all duration-1000 ${isFinished ? 'bg-gradient-to-r from-emerald-400 to-teal-400' : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 relative'}`}
                          style={{ width: `${progress.percentage}%` }}
                        >
                          {!isFinished && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
                        </div>
                      </div>
                    </div>

                    <div className="md:ml-8 flex-shrink-0 pt-4 md:pt-0">
                      <Link
                        href={progress.lastWatchedVideoId ? `/subjects/${subject.id}/video/${progress.lastWatchedVideoId}` : `/subjects/${subject.id}`}
                        className={`inline-flex items-center justify-center px-8 py-4 rounded-xl font-bold transition-all duration-300 shadow-xl ${isFinished
                            ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                            : 'bg-white text-black hover:bg-slate-200 hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.15)]'
                          }`}
                      >
                        {isFinished ? 'Review Videos' : 'Resume Learning'}
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}