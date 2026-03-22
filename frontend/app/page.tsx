'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/lib/apiClient';
import { BookOpen, ArrowRight, UserCircle, Rocket, Sparkles, PlayCircle } from 'lucide-react';

export default function HomePage() {
  const { isAuthenticated } = useAuthStore();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      apiClient.get('/api/subjects?pageSize=100')
        .then(res => setSubjects(res.data.data || []))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden font-sans tracking-tight selection:bg-purple-500/30">
        {/* Dynamic Background Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-[500px] bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-28 md:py-40 flex flex-col items-center justify-center min-h-screen">
          <div className="flex justify-center mb-8 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 blur-xl opacity-50 animate-pulse rounded-full" />
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center transform rotate-3 shadow-[0_0_50px_rgba(168,85,247,0.4)] relative z-10">
              <Rocket className="w-12 h-12 text-white -rotate-3" />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-200">The next generation of learning</span>
          </div>

          <h1 className="text-5xl md:text-8xl font-extrabold text-white tracking-tighter mb-8 leading-[1.1]">
            Master Your Future <br className="hidden md:block" /> With <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 drop-shadow-sm">Premium Learning</span>
          </h1>
          <p className="mt-4 max-w-2xl text-xl text-slate-400 mx-auto mb-14 leading-relaxed font-medium">
            Unlock exclusive courses, interactive video tracking, and completely master your progress through our tightly engineered global syllabus.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full sm:w-auto">
            <Link
              href="/auth/register"
              className="w-full sm:w-auto px-10 py-5 bg-white text-black text-lg font-bold rounded-2xl hover:scale-105 hover:bg-slate-200 transition-all duration-300 flex items-center justify-center group shadow-[0_0_40px_rgba(255,255,255,0.2)]"
            >
              Get Started for Free
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/auth/login"
              className="w-full sm:w-auto px-10 py-5 bg-white/5 text-white text-lg font-bold rounded-2xl border border-white/10 backdrop-blur-md hover:bg-white/10 hover:-translate-y-1 transition-all duration-300"
            >
              Sign In to Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-24 font-sans selection:bg-purple-500/30">
      {/* Top Navbar */}
      <nav className="bg-[#0f0f11]/80 border-b border-white/10 sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                <Rocket className="w-5 h-5 text-white" />
              </div>
              <span className="font-extrabold text-2xl tracking-tighter text-white">LMS Platform</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/profile" className="flex items-center gap-2 text-slate-300 hover:text-white transition-all duration-300 font-bold text-sm bg-white/5 border border-white/10 hover:bg-white/10 px-6 py-3 rounded-full backdrop-blur-md">
                <UserCircle className="w-5 h-5" />
                My Profile
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Catalog View */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 relative">
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-600/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="flex items-center justify-between mb-12 relative z-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tighter">Course Catalog</h1>
            <p className="text-slate-400 mt-3 text-lg font-medium">Explore and seamlessly enroll in our available subjects.</p>
          </div>
        </div>

        <div className="relative z-10">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-80 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-xl animate-pulse" />
              ))}
            </div>
          ) : subjects.length === 0 ? (
            <div className="text-center py-32 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-xl">
              <BookOpen className="w-20 h-20 text-slate-600 mx-auto mb-6" />
              <h3 className="text-2xl font-extrabold text-white">No Subjects Available</h3>
              <p className="text-slate-400 mt-3 font-medium text-lg">Check back later when physical content is seamlessly published!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {subjects.map(sub => (
                <Link
                  key={sub.id}
                  href={`/subjects/${sub.id}`}
                  className="group flex flex-col bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-xl hover:bg-white/10 hover:border-white/20 hover:-translate-y-2 transition-all duration-500 overflow-hidden cursor-pointer shadow-lg hover:shadow-[0_0_40px_rgba(168,85,247,0.15)]"
                >
                  <div  
                    className="h-56 bg-slate-900 bg-cover bg-center flex flex-col justify-end p-8 border-b border-white/5 relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-500"
                    style={{ backgroundImage: sub.thumbnailUrl ? `url(${sub.thumbnailUrl})` : '' }}
                  >
                    <div className="absolute inset-0 bg-black/50 group-hover:bg-black/20 transition-colors duration-500 z-0" />
                    <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px] z-0" />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-500/20 to-transparent blur-2xl z-0" />

                    <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-indigo-500/50 transition-all duration-500 relative z-10 shadow-xl">
                      <PlayCircle className="w-7 h-7 text-white" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-white group-hover:text-white drop-shadow-md transition-colors line-clamp-1 relative z-10">{sub.title}</h2>
                  </div>
                  <div className="p-8 flex flex-col flex-1 relative z-10">
                    <p className="text-slate-400 text-sm line-clamp-3 leading-relaxed flex-1 font-medium">
                      {sub.description || 'A comprehensive structural overview natively diving strictly into the core architectural layouts of the syllabus.'}
                    </p>
                    <div className="mt-8 flex items-center text-indigo-400 font-bold text-sm tracking-widest uppercase group-hover:gap-3 group-hover:text-pink-400 transition-all duration-300">
                      START LEARNING
                      <ArrowRight className="w-5 h-5 ml-1" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}