'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/lib/apiClient';
import { ArrowRight, BookOpen, UserCircle, Rocket, Sparkles, PlayCircle, Search, X } from 'lucide-react';
import Header from '@/components/Layout/Header';
import { StarRating } from '@/components/common/StarRating';

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthStore();
  
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [enrolledCourseMaps, setEnrolledCourseMaps] = useState<Record<string, string | null>>({});

  const initialQ = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || 'All';
  const initialSort = searchParams.get('sort') || 'newest';

  const [searchQuery, setSearchQuery] = useState(initialQ);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState(initialSort);

  const categories = ['All', 'Frontend', 'Backend', 'Database', 'Fullstack', 'Computer Science', 'Tools', 'Design'];

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery);
    if (selectedCategory !== 'All') params.set('category', selectedCategory);
    if (sortBy !== 'newest') params.set('sort', sortBy);
    router.push(`/?${params.toString()}`, { scroll: false });
  }, [searchQuery, selectedCategory, sortBy, router]);

  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      const delayDebounceFn = setTimeout(() => {
        let url = '/api/subjects?pageSize=12&page=1';
        if (searchQuery.trim() !== '') url += `&q=${encodeURIComponent(searchQuery)}`;
        if (selectedCategory !== 'All') url += `&category=${encodeURIComponent(selectedCategory)}`;
        if (sortBy) url += `&sort=${encodeURIComponent(sortBy)}`;

        apiClient.get(url)
          .then(res => {
            setSubjects(res.data.data || []);
            setTotalCount(res.data.totalCount || 0);
          })
          .catch(console.error)
          .finally(() => setLoading(false));
      }, 500);

      apiClient.get('/api/dashboard')
          .then(res => {
              const map: Record<string, string | null> = {};
              res.data.enrolledCourses.forEach((c: any) => {
                  map[c.subjectId] = c.lastWatchedVideoId || 'enrolled_but_no_video_yet';
              });
              setEnrolledCourseMaps(map);
          })
          .catch(console.error);

      return () => clearTimeout(delayDebounceFn);
    } else {
      setLoading(true);
      const delayDebounceFn = setTimeout(() => {
        let url = '/api/subjects?pageSize=12&page=1';
        if (searchQuery.trim() !== '') url += `&q=${encodeURIComponent(searchQuery)}`;
        if (selectedCategory !== 'All') url += `&category=${encodeURIComponent(selectedCategory)}`;
        if (sortBy) url += `&sort=${encodeURIComponent(sortBy)}`;

        apiClient.get(url)
          .then(res => {
            setSubjects(res.data.data || []);
            setTotalCount(res.data.totalCount || 0);
          })
          .catch(console.error)
          .finally(() => setLoading(false));
      }, 500);

      return () => clearTimeout(delayDebounceFn);
    }
  }, [isAuthenticated, searchQuery, selectedCategory, sortBy]);

  const handleEnrollOrStart = async (courseId: string, slug: string) => {
      if (!isAuthenticated) return router.push('/auth/login');
      
      const enrolledValue = enrolledCourseMaps[courseId];
      if (enrolledValue) {
          if (enrolledValue === 'enrolled_but_no_video_yet') {
              router.push(`/subjects/${slug}`);
          } else {
              router.push(`/subjects/${slug}/video/${enrolledValue}`);
          }
      } else {
          try {
              await apiClient.post(`/api/subjects/${courseId}/enroll`);
              setEnrolledCourseMaps(prev => ({...prev, [courseId]: 'enrolled_but_no_video_yet'}));
          } catch(e) {
              console.error('Failed to enroll:', e);
          }
      }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden font-sans tracking-tight selection:bg-purple-500/30">
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
      <Header theme="dark" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 relative">
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-600/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10 space-y-8 mb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tighter">Course Catalog</h1>
                  <p className="text-slate-400 mt-3 text-lg font-medium">Explore and seamlessly enroll in our available subjects.</p>
                </div>
                
                <div className="flex items-center gap-3 flex-shrink-0">
                  <label className="text-slate-400 font-medium text-sm">Sort by:</label>
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors font-medium cursor-pointer"
                  >
                    <option value="newest" className="bg-gray-900">Newest</option>
                    <option value="popular" className="bg-gray-900">Most Popular</option>
                  </select>
                </div>
            </div>

            <div className="relative w-full shadow-lg">
               <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                 <Search className="h-5 w-5 text-gray-400" />
               </div>
               <input 
                 type="text" 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full bg-white/5 border border-white/10 text-white rounded-[2rem] py-4 pl-14 pr-14 focus:outline-none focus:border-indigo-500 focus:bg-white/10 transition-all font-medium placeholder-gray-500 backdrop-blur-md"
                 placeholder="Search courses..."
               />
               {searchQuery && (
                 <button 
                   onClick={() => setSearchQuery('')}
                   className="absolute inset-y-0 right-0 pr-5 flex items-center text-gray-400 hover:text-white transition-colors"
                 >
                   <X className="h-5 w-5" />
                 </button>
               )}
            </div>

            <div className="flex flex-wrap gap-2.5">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full px-5 py-2 text-sm font-semibold transition-all duration-300 ${
                    selectedCategory === cat 
                      ? 'bg-gray-900 text-white shadow-xl shadow-black/50 border border-gray-700/50' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            
            <div className="text-slate-400 font-medium text-sm pt-4 border-t border-white/5">
              {loading ? 'Searching courses...' : `Showing ${totalCount} courses`}
            </div>
        </div>

        <div className="relative z-10">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-[420px] bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-xl animate-pulse" />
              ))}
            </div>
          ) : subjects.length === 0 ? (
            <div className="text-center py-24 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-xl shadow-2xl">
              <Search className="w-24 h-24 text-slate-700 mx-auto mb-6" />
              <h3 className="text-3xl font-extrabold text-white tracking-tight">No courses found</h3>
              <p className="text-slate-400 mt-4 font-medium text-lg max-w-md mx-auto">Try a different search term or category to discover your next learning adventure.</p>
              <button 
                onClick={() => { 
                  setSearchQuery(''); 
                  setSelectedCategory('All'); 
                  setSortBy('newest'); 
                  router.push('/', { scroll: false });
                }}
                className="mt-8 px-8 py-3.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 font-bold rounded-full border border-indigo-500/20 transition-all duration-300"
               >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {subjects.map(sub => (
                <Link
                  key={sub.id}
                  href={`/subjects/${sub.id}`}
                  className="group flex flex-col bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-xl hover:bg-white/10 hover:border-white/20 hover:-translate-y-2 transition-all duration-500 overflow-hidden cursor-pointer shadow-lg hover:shadow-[0_0_40px_rgba(168,85,247,0.15)] h-full"
                >
                  <div  
                    className="h-56 shrink-0 bg-slate-900 bg-cover bg-center flex flex-col justify-end p-8 border-b border-white/5 relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-500"
                    style={{ backgroundImage: sub.thumbnailUrl ? `url(${sub.thumbnailUrl})` : '' }}
                  >
                    <div className="absolute inset-0 bg-black/50 group-hover:bg-black/20 transition-colors duration-500 z-0" />
                    <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px] z-0" />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-500/20 to-transparent blur-2xl z-0" />

                    <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-indigo-500/50 transition-all duration-500 relative z-10 shadow-xl">
                      <PlayCircle className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  <div className="p-8 flex flex-col flex-1 relative z-10">
                    <div className="flex flex-col items-start mb-3">
                       <h2 className="text-2xl font-extrabold text-white group-hover:text-indigo-400 transition-colors line-clamp-1 mb-1">{sub.title}</h2>
                       <div className="flex items-center gap-2">
                         {sub.totalReviews > 0 ? (
                           <>
                             <span className="text-white font-bold">{Number(sub.averageRating || 0).toFixed(1)}</span>
                             <StarRating rating={sub.averageRating || 0} size="sm" interactive={false} />
                             <span className="text-gray-400 text-sm font-medium">({sub.totalReviews} reviews)</span>
                           </>
                         ) : (
                           <span className="text-gray-400 text-sm font-medium">No reviews yet</span>
                         )}
                       </div>
                    </div>
                    {sub.category && (
                      <span className="inline-block px-3 py-1 bg-white/10 text-slate-300 text-xs font-bold rounded-lg mb-4 w-fit border border-white/5">
                        {sub.category}
                      </span>
                    )}
                    <p className="text-slate-400 text-sm line-clamp-2 leading-relaxed flex-1 font-medium">
                      {sub.description || 'A comprehensive structural overview natively diving strictly into the core architectural layouts of the syllabus.'}
                    </p>
                    <div className="mt-8 flex justify-between items-center text-sm font-bold uppercase transition-all duration-300">
                      <button 
                        onClick={(e) => { e.preventDefault(); handleEnrollOrStart(sub.id, sub.slug); }}
                        className={`flex items-center group-hover:gap-3 transition-all ${enrolledCourseMaps[sub.id] ? 'text-emerald-400 group-hover:text-emerald-300' : 'text-indigo-400 group-hover:text-pink-400'}`}
                      >
                         {enrolledCourseMaps[sub.id] ? 'Continue Learning' : 'Enroll Now'}
                         <ArrowRight className="w-5 h-5 ml-1" />
                      </button>
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

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a]" />}>
      <HomePageContent />
    </Suspense>
  );
}