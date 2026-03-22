'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/lib/apiClient';
import { BookOpen, CheckCircle, Clock, Flame, PlayCircle, History, User, ArrowRight } from 'lucide-react';

function timeAgo(dateParam: string | Date) {
  const date = typeof dateParam === 'string' ? new Date(dateParam) : dateParam;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return `Just now`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} days ago`;
}

import Header from '@/components/Layout/Header';

export default function DashboardPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated && !loading) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      apiClient.get('/api/dashboard')
        .then(res => {
          setData(res.data);
        })
        .catch(err => {
          console.error(err);
          setError('Failed to load dashboard data.');
        })
        .finally(() => setLoading(false));
    }
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center font-sans tracking-tight">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center font-sans tracking-tight">
        <p className="text-red-400 font-medium text-lg bg-red-500/10 px-6 py-3 rounded-xl border border-red-400/20">{error || 'Unable to load data'}</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-indigo-500/20 text-indigo-300 font-semibold rounded-xl border border-indigo-500/20 hover:bg-indigo-500/30 transition">
          Retry
        </button>
      </div>
    );
  }

  const { user, stats, enrolledCourses, recentlyWatched } = data;

  // Build Streak Calendar Array (last 30 days)
  const calendarDays = [];
  const today = new Date();
  const completedDatesSet = new Set(stats.completedDates || []);

  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    calendarDays.push({
      dateStr,
      active: completedDatesSet.has(dateStr)
    });
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-24 font-sans tracking-tight text-white selection:bg-purple-500/30">
      
      {/* Top Navbar */}
      <Header theme="dark" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 relative">
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-600/10 blur-[100px] rounded-full pointer-events-none" />
        
        {/* SECTION 1 - WELCOME HEADER */}
        <div className="flex items-center gap-6 mb-12 relative z-10">
          <img 
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name || 'Student')}`} 
            alt="User Avatar" 
            className="w-24 h-24 rounded-full border-4 border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)] bg-slate-900 object-cover"
          />
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Welcome back, {user.name.split(' ')[0]}! 👋
            </h1>
            <p className="text-slate-400 mt-1 text-lg font-medium">Here's your learning progress</p>
          </div>
        </div>

        {/* SECTION 2 - STATS CARDS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 relative z-10">
          
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/10 flex flex-col relative overflow-hidden group hover:bg-white/10 transition-colors">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-bl-[100px] -z-10 transition-colors group-hover:bg-blue-500/20"></div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4 border border-blue-500/20 shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-4xl font-extrabold text-white">{stats.totalEnrolledCourses}</span>
            <span className="text-slate-400 font-medium mt-1 text-sm uppercase tracking-wide">Courses Enrolled</span>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/10 flex flex-col relative overflow-hidden group hover:bg-white/10 transition-colors">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-[100px] -z-10 transition-colors group-hover:bg-emerald-500/20"></div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/20 shadow-sm">
              <CheckCircle className="w-5 h-5" />
            </div>
            <span className="text-4xl font-extrabold text-white">{stats.totalCompletedCourses}</span>
            <span className="text-slate-400 font-medium mt-1 text-sm uppercase tracking-wide">Courses Completed</span>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/10 flex flex-col relative overflow-hidden group hover:bg-white/10 transition-colors">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-bl-[100px] -z-10 transition-colors group-hover:bg-purple-500/20"></div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-4 border border-purple-500/20 shadow-sm">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-4xl font-extrabold text-white">{stats.totalHoursWatched}</span>
            <span className="text-slate-400 font-medium mt-1 text-sm uppercase tracking-wide">Hours Watched</span>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/10 flex flex-col relative overflow-hidden group hover:bg-white/10 transition-colors">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-bl-[100px] -z-10 transition-colors group-hover:bg-orange-500/20"></div>
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center mb-4 border border-orange-500/20 shadow-sm">
              <Flame className="w-5 h-5" />
            </div>
            <span className="text-4xl font-extrabold text-white flex items-center gap-2">
              {stats.currentStreak} <span className="text-2xl">{stats.currentStreak > 0 && '🔥'}</span>
            </span>
            <span className="text-slate-400 font-medium mt-1 text-sm uppercase tracking-wide">Day Streak</span>
          </div>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 relative z-10">
          
          {/* LEFT COLUMN - MY COURSES & CALENDAR */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* SECTION 5 - STREAK CALENDAR */}
            <section className="bg-white/5 backdrop-blur-xl p-8 rounded-[2rem] shadow-lg border border-white/10">
              <div className="flex items-center justify-between mb-6">
                 <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
                   <Flame className="w-6 h-6 text-orange-500" />
                   Your Learning Streak
                 </h2>
                 <span className="bg-orange-500/20 border border-orange-500/20 text-orange-400 px-4 py-1.5 rounded-full font-bold text-sm">
                    {stats.currentStreak} day streak!
                 </span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {calendarDays.map((day, idx) => (
                  <div 
                    key={idx} 
                    title={day.dateStr}
                    className={`w-6 h-6 md:w-8 md:h-8 rounded-[4px] sm:rounded-md transition-colors duration-300 ${day.active ? 'bg-emerald-500 hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-white/5 hover:bg-white/10 border border-white/5'}`}
                  ></div>
                ))}
              </div>
              <p className="text-sm font-medium text-slate-400 mt-4 flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span> Active day
                <span className="w-3 h-3 rounded-sm bg-white/5 inline-block ml-4 border border-white/10"></span> Inactive day
              </p>
            </section>

            {/* SECTION 3 - MY COURSES */}
            <section>
              <h2 className="text-2xl font-extrabold text-white mb-6 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-indigo-400" />
                My Courses
              </h2>
              
              {enrolledCourses.length === 0 ? (
                <div className="text-center py-20 bg-white/5 backdrop-blur-xl rounded-[2rem] shadow-lg border border-white/10">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                    <BookOpen className="w-8 h-8 text-slate-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white">No courses yet</h3>
                  <p className="text-slate-400 mt-2 mb-6 font-medium">You haven't enrolled in any physical courses.</p>
                  <Link href="/" className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-gray-200 transition-colors shadow-md">
                    Browse Catalog
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {enrolledCourses.map((course: any) => (
                    <div key={course.subjectId} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-lg overflow-hidden flex flex-col group hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-1">
                      
                      {/* Thumbnail Header */}
                      <div className="h-40 bg-slate-900 relative">
                        {course.thumbnailUrl && (
                          <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" />
                        )}
                        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0a0a0a] to-transparent"></div>
                        <div className="absolute bottom-4 left-4 right-4">
                          {course.category && <span className="px-2.5 py-1 bg-white/10 backdrop-blur-md rounded-md text-white text-[10px] font-bold uppercase tracking-wider mb-2 inline-block border border-white/10">{course.category}</span>}
                        </div>
                      </div>

                      {/* Content Body */}
                      <div className="p-6 flex flex-col flex-1">
                        <h3 className="font-extrabold text-lg text-white group-hover:text-indigo-400 transition-colors line-clamp-1">{course.title}</h3>
                        
                        {course.instructorName && (
                          <div className="flex items-center gap-2 mt-2">
                             <User className="w-4 h-4 text-slate-400" />
                             <p className="text-sm font-medium text-slate-400">{course.instructorName}</p>
                          </div>
                        )}

                        {/* Progress Bar */}
                        <div className="mt-8 mb-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{course.completedVideos} of {course.totalVideos} lessons</span>
                            <span className={`text-sm font-bold ${course.isCompleted ? 'text-emerald-400' : 'text-indigo-400'}`}>{Math.round(course.percentComplete)}%</span>
                          </div>
                          <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden border border-white/5">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ${course.isCompleted ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-gradient-to-r from-blue-500 to-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]'}`}
                              style={{ width: `${course.percentComplete}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center">
                           {course.isCompleted ? (
                              <div className="flex items-center justify-center w-full gap-2 text-emerald-400 font-bold bg-emerald-500/10 px-4 py-3 rounded-xl border border-emerald-500/20">
                                <CheckCircle className="w-5 h-5" />
                                Completed!
                              </div>
                           ) : (
                              <Link 
                                href={course.lastWatchedVideoId ? `/subjects/${course.slug}/video/${course.lastWatchedVideoId}` : `/subjects/${course.slug}`}
                                className="w-full bg-indigo-500/20 border border-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 font-bold text-sm uppercase flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all duration-300 shadow-lg"
                              >
                                {course.lastWatchedVideoId ? 'Resume Learning' : 'Start Course'} <ArrowRight className="w-4 h-4" />
                              </Link>
                           )}
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* RIGHT COLUMN - RECENTLY WATCHED */}
          <div className="lg:col-span-1">
            <section className="bg-white/5 backdrop-blur-xl rounded-[2rem] shadow-lg border border-white/10 p-8 sticky top-24">
              <h2 className="text-xl font-extrabold text-white mb-6 flex items-center gap-2">
                <History className="w-5 h-5 text-purple-400" />
                Recently Watched
              </h2>
              
              {recentlyWatched.length === 0 ? (
                <div className="text-center py-10 bg-white/5 rounded-2xl border border-white/10 border-dashed">
                  <PlayCircle className="w-8 h-8 text-slate-500 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-400">No watch history found.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {recentlyWatched.map((video: any, idx: number) => (
                    <div key={idx} className="flex gap-4 group cursor-pointer border-b border-white/5 pb-5 last:border-0 last:pb-0">
                      <div className="w-[70px] h-[50px] rounded-xl overflow-hidden bg-[#0a0a0a] shrink-0 relative shadow-md border border-white/10">
                         {video.thumbnailUrl && <img src={video.thumbnailUrl} alt={video.videoTitle} className="w-full h-full object-cover opacity-70 group-hover:scale-110 transition-transform duration-500" />}
                         <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/10 transition-colors">
                            <PlayCircle className="w-5 h-5 text-white/90 drop-shadow-md" />
                         </div>
                      </div>
                      <div className="flex-1 min-w-0">
                         <h4 className="font-bold text-sm text-white line-clamp-1 group-hover:text-indigo-400 transition-colors">{video.videoTitle}</h4>
                         <p className="text-xs font-semibold text-slate-400 mt-1 line-clamp-1">{video.subjectTitle}</p>
                         <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                               {timeAgo(video.watchedAt)}
                            </span>
                            {video.isCompleted && <CheckCircle className="w-3 h-3 text-emerald-500" />}
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

        </div>
      </main>
    </div>
  );
}
