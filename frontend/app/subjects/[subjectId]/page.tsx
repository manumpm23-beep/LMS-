'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { Loader2, Check, PlayCircle, Star, Tv, Award, MonitorPlay, ChevronDown, ChevronUp, Clock, Search, ThumbsUp, ThumbsDown, MoreVertical } from 'lucide-react';
import { StarRating } from '@/components/common/StarRating';

function timeAgo(dateInput: string | Date) {
  const date = new Date(dateInput);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
}

export default function SubjectPage({ params }: { params: { subjectId: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [tree, setTree] = useState<any>(null);
  
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [showAllSections, setShowAllSections] = useState(false);

  useEffect(() => {
    let active = true;

    async function fetchData() {
      try {
        const [subRes, treeRes, revRes] = await Promise.all([
          apiClient.get(`/api/subjects/${params.subjectId}`).catch(() => null),
          apiClient.get(`/api/subjects/${params.subjectId}/tree`).catch(() => null),
          apiClient.get(`/api/subjects/${params.subjectId}/reviews`).catch(() => null)
        ]);

        if (!active) return;

        if (subRes && subRes.data) {
           setSubject(subRes.data);
        }

        if (treeRes && treeRes.data) {
           setTree(treeRes.data);
           // expand first 2
           if (treeRes.data.sections) {
              const expands: Record<string, boolean> = {};
              treeRes.data.sections.forEach((sec: any, idx: number) => {
                 if (idx < 2) expands[sec.id] = true;
              });
              setExpandedSections(expands);
           }
        }

        if (revRes && revRes.data) {
           setReviews(revRes.data.reviews || []);
           setSummary({
               averageRating: revRes.data.averageRating || 0,
               totalReviews: revRes.data.totalReviews || 0,
               ratingBreakdown: revRes.data.ratingBreakdown || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
           });
        }

        setLoading(false);
      } catch (err: any) {
        if (active) setLoading(false);
      }
    }

    fetchData();
    return () => { active = false; };
  }, [params.subjectId]);

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const enrollUser = async () => {
     try {
       await apiClient.post(`/api/dashboard/enroll/${params.subjectId}`);
       // Optionally fetch first video to navigate to it
       let firstVideoId = null;
       if (tree && tree.sections && tree.sections[0] && tree.sections[0].videos && tree.sections[0].videos[0]) {
           firstVideoId = tree.sections[0].videos[0].id;
       }
       if (firstVideoId) {
           router.push(`/subjects/${params.subjectId}/video/${firstVideoId}`);
       } else {
           router.push(`/profile`);
       }
     } catch (e: any) {
        alert(e.response?.data?.error || 'Failed to enroll');
     }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 text-[#a435f0] animate-spin" />
      </div>
    );
  }

  const fontFam = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  const avgRating = summary?.averageRating || 0;
  const totalReviews = summary?.totalReviews || 0;

  // Calculate stats from tree
  let totalLectures = 0;
  if (tree && tree.sections) {
      tree.sections.forEach((s: any) => {
          totalLectures += s.videos?.length || 0;
      });
  }
  const totalHours = Math.round((totalLectures * 15) / 60) || 12; // dummy hour calc

  const userCountStr = "45,291";
  
  return (
    <div className="bg-white min-h-screen text-[#1c1d1f]" style={{ fontFamily: fontFam }}>
      
      {/* TOP HERO SECTION */}
      <div className="bg-[#1c1d1f] text-white pt-8 pb-12 relative">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-8 relative flex flex-col md:flex-row">
          
          {/* Left Side */}
          <div className="w-full md:w-[65%] pr-0 md:pr-10 lg:pr-16 z-10 space-y-4">
             <div className="text-sm text-[#c0c4fc] font-bold flex items-center gap-2 mb-2">
                <a href="#" className="hover:text-white transition">Development</a>
                <span>&gt;</span>
                <a href="#" className="hover:text-white transition">Web Development</a>
             </div>
             
             <h1 className="text-4xl md:text-[32px] lg:text-[40px] font-bold leading-tight mb-2">
               {subject?.title || 'Course Title'}
             </h1>
             <p className="text-lg md:text-xl text-gray-100 font-normal mb-4 leading-relaxed">
               {subject?.description || 'Build modern applications from scratch. Master the fundamentals and advanced topics required to become a top-tier developer in this comprehensive, project-based course.'}
             </p>
             
             <div className="flex flex-wrap items-center gap-3 text-sm mb-2">
                <div className="flex items-center gap-1 font-bold text-[#f69c08] text-[15px]">
                  <span>{Number(avgRating).toFixed(1)}</span>
                  <Star className="w-4 h-4 fill-current pt-px" />
                </div>
                <a href="#reviews" className="text-[#c0c4fc] underline hover:text-white transition">({totalReviews.toLocaleString()} ratings)</a>
                <span className="text-gray-100">{userCountStr} students</span>
             </div>

             <div className="text-sm text-gray-100 mb-4">
                Created by <a href="#instructor" className="text-[#c0c4fc] underline hover:text-white transition">{subject?.author?.name || 'Instructor'}</a>
             </div>

             <div className="flex items-center gap-4 text-sm text-gray-100">
                <div className="flex items-center gap-1.5"><MonitorPlay className="w-4 h-4" /> Last updated 10/2025</div>
                <div className="flex items-center gap-1.5"><Tv className="w-4 h-4" /> English</div>
             </div>
          </div>

          {/* Right Side Card (Desktop Sticky) */}
          {/* Only shown absolutely positioned on md+ screens */}
          <div className="hidden md:block absolute right-6 top-8 w-[340px] bg-white shadow-xl border border-gray-200 z-50">
             <div className="relative cursor-pointer group bg-[#1c1d1f]">
               <img src={subject?.thumbnailUrl || "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800"} alt="Course Thumbnail" className="w-full h-[190px] object-cover opacity-90 group-hover:opacity-100 transition" />
               <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 group-hover:bg-black/20 transition-all">
                  <PlayCircle className="w-16 h-16 text-white bg-black/50 rounded-full" />
                  <span className="text-white font-bold mt-2 text-sm shadow-sm">Preview this course</span>
               </div>
             </div>

             <div className="p-6">
                <div className="text-3xl font-bold mb-4">{subject?.price ? `$${subject.price}` : 'Free'}</div>
                <button 
                  onClick={enrollUser}
                  className="w-full bg-[#a435f0] text-white font-bold py-3.5 hover:bg-[#8710d8] transition-colors mb-2 text-[15px]"
                >
                  Enroll Now
                </button>
                <div className="text-xs text-center text-gray-500 mb-6">30-Day Money-Back Guarantee</div>

                <div className="space-y-3 mb-6">
                   <h4 className="font-bold text-[15px]">This course includes:</h4>
                   <ul className="text-sm space-y-2.5 text-gray-600">
                      <li className="flex items-center gap-3"><MonitorPlay className="w-4 h-4 text-gray-900" /> {totalHours} hours on-demand video</li>
                      <li className="flex items-center gap-3"><Tv className="w-4 h-4 text-gray-900" /> Access on mobile and TV</li>
                      <li className="flex items-center gap-3"><Award className="w-4 h-4 text-gray-900" /> Certificate of completion</li>
                   </ul>
                </div>

                <div className="flex justify-between items-center text-sm font-bold border-t border-gray-200 pt-4 px-2">
                   <button className="underline hover:text-gray-600 transition">Share</button>
                   <button className="underline hover:text-gray-600 transition">Gift this course</button>
                   <button className="hover:text-gray-600 transition">Apply Coupon</button>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Main Content constraints */}
      <div className="max-w-[1180px] mx-auto px-6 lg:px-8 py-8 md:py-10 relative flex flex-col md:flex-row">
        
        {/* Left column content area */}
        <div className="w-full md:w-[65%] pr-0 md:pr-10 lg:pr-16 space-y-12 pb-24">
           
           {/* Mobile Card shown only on sm */}
           <div className="block md:hidden border border-gray-200 shadow-sm mb-8 bg-white">
             {/* Same card content minimized */}
             <div className="relative">
               <img src={subject?.thumbnailUrl || "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=600"} alt="Course Thumbnail" className="w-full h-auto max-h-48 object-cover" />
               <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                  <PlayCircle className="w-16 h-16 text-white bg-black/50 rounded-full" />
               </div>
             </div>
             <div className="p-6">
                <div className="text-3xl font-bold mb-4">{subject?.price ? `$${subject.price}` : 'Free'}</div>
                <button onClick={enrollUser} className="w-full bg-[#a435f0] text-white font-bold py-3.5 hover:bg-[#8710d8] transition-colors mb-4 text-[15px]">
                  Enroll Now
                </button>
                <ul className="text-sm space-y-2 text-gray-600">
                  <li className="flex items-center gap-3"><MonitorPlay className="w-4 h-4 text-gray-900" /> {totalHours} hours on-demand video</li>
                  <li className="flex items-center gap-3"><Award className="w-4 h-4 text-gray-900" /> Certificate of completion</li>
                </ul>
             </div>
           </div>

           {/* WHAT YOU'LL LEARN */}
           <div className="border border-gray-300 p-6">
              <h2 className="text-2xl font-bold mb-4">What you'll learn</h2>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-[#1c1d1f]">
                 {[
                   "Build fullstack web applications from scratch",
                   "Master complex state management and modern APIs",
                   "Implement secure authentication & authorization",
                   "Deploy your projects to production effortlessly",
                   "Learn industry best practices and design patterns",
                   "Build a professional portfolio of real-world apps"
                 ].map((pt, i) => (
                   <li key={i} className="flex gap-4">
                     <Check className="w-4 h-4 shrink-0 mt-[2px]" />
                     <span>{pt}</span>
                   </li>
                 ))}
              </ul>
           </div>

           {/* COURSE CONTENT */}
           <div className="mt-8">
              <h2 className="text-2xl font-bold mb-6">Course content</h2>
              <div className="flex flex-wrap items-center justify-between text-sm mb-2">
                 <span>{tree?.sections?.length || 0} sections • {totalLectures} lectures • {totalHours}h 30m total length</span>
                 <button 
                   onClick={() => {
                      const mode = !showAllSections;
                      setShowAllSections(mode);
                      if (tree?.sections) {
                         const nExpanded: Record<string, boolean> = {};
                         tree.sections.forEach((s: any) => nExpanded[s.id] = mode);
                         setExpandedSections(nExpanded);
                      }
                   }} 
                   className="text-[#5624d0] font-bold hover:text-[#401b9c]"
                 >
                   {showAllSections ? "Collapse all sections" : "Expand all sections"}
                 </button>
              </div>

              <div className="border border-[#d1d7dc] border-b-0">
                 {tree?.sections?.map((section: any, idx: number) => {
                    const expanded = !!expandedSections[section.id];
                    return (
                       <div key={section.id} className="border-b border-[#d1d7dc]">
                          <button 
                            onClick={() => toggleSection(section.id)}
                            className="w-full flex items-center justify-between p-4 bg-[#f7f9fa] hover:bg-[#f3f4f6] transition-colors"
                          >
                             <div className="flex items-center gap-4 text-left">
                                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                <span className="font-bold text-[15px]">{section.title}</span>
                             </div>
                             <div className="text-sm text-gray-500 whitespace-nowrap">
                                {section.videos?.length || 0} lectures
                             </div>
                          </button>
                          
                          {expanded && (
                             <div className="bg-white">
                                {section.videos?.map((v: any) => (
                                   <div key={v.id} className="p-4 pl-12 flex justify-between group hover:bg-gray-50 border-t border-gray-100 first:border-t-0">
                                      <div className="flex gap-4 items-start text-sm">
                                         <PlayCircle className="w-4 h-4 mt-[2px] text-gray-400 group-hover:text-[#5624d0]" />
                                         <a href="#" className="text-[#5624d0] underline hover:text-[#401b9c] line-clamp-2 md:line-clamp-1">
                                            {v.title}
                                         </a>
                                      </div>
                                      <span className="text-sm text-gray-500 whitespace-nowrap ml-4">15:00</span>
                                   </div>
                                ))}
                             </div>
                          )}
                       </div>
                    );
                 })}
                 {(!tree || !tree.sections || tree.sections.length === 0) && (
                   <div className="p-4 text-center border-b border-[#d1d7dc] text-gray-500">Curriculum contents will appear here.</div>
                 )}
              </div>
           </div>

           {/* REQUIREMENTS */}
           <div>
              <h2 className="text-2xl font-bold mb-4">Requirements</h2>
              <ul className="list-disc list-inside text-sm space-y-2 text-gray-800 ml-1">
                 <li>No prior programming experience needed. We start from the very basics.</li>
                 <li>A modern web browser (Google Chrome recommended).</li>
                 <li>A desire to learn and practice regularly!</li>
              </ul>
           </div>

           {/* INSTRUCTOR SECTION */}
           <div id="instructor">
              <h2 className="text-2xl font-bold mb-6">Instructor</h2>
              <div className="mb-4">
                 <h3 className="text-xl font-bold text-[#5624d0] hover:text-[#401b9c] cursor-pointer underline underline-offset-2 mb-1">
                   {subject?.author?.name || 'Jane Doe'}
                 </h3>
                 <p className="text-gray-500 text-[15px]">{subject?.author?.role || 'Senior Software Engineer & Lead Instructor'}</p>
              </div>

              <div className="flex items-center gap-4 mb-4">
                 <img src={subject?.author?.avatar || `https://api.dicebear.com/9.x/notionists/svg?seed=${subject?.author?.name || 'Jane'}`} alt="Instructor Avatar" className="w-[80px] h-[80px] rounded-full object-cover shadow-sm bg-gray-100" />
                 <ul className="text-sm space-y-1.5 text-[#1c1d1f]">
                    <li className="flex items-center gap-3"><Star className="w-4 h-4 fill-current text-[#b4690e] shrink-0" /> 4.7 Instructor Rating</li>
                    <li className="flex items-center gap-3"><Award className="w-4 h-4 shrink-0" /> 154,291 Reviews</li>
                    <li className="flex items-center gap-3"><MonitorPlay className="w-4 h-4 shrink-0" /> 458,901 Students</li>
                    <li className="flex items-center gap-3"><Tv className="w-4 h-4 shrink-0" /> 16 Courses</li>
                 </ul>
              </div>

              <div className="text-sm text-gray-800 leading-relaxed mb-4">
                 Hello! I'm a passionate developer and educator with over a decade of industry experience. I've worked on high-scale systems at top tech companies and I love breaking down complex topics into simple, digestible concepts. My goal is to make learning to code a great experience for everyone.
              </div>
           </div>

           {/* STUDENT FEEDBACK SECTION */}
           <div id="reviews" className="animate-in fade-in">
                 <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Star className="w-6 h-6 fill-current text-[#b4690e]" />
                    {Number(avgRating).toFixed(1)} course rating • {totalReviews.toLocaleString()} ratings
                 </h2>
                 
                 <div className="flex flex-col gap-6 justify-center max-w-lg mb-10">
                    {[5, 4, 3, 2, 1].map(stars => {
                       const count = summary?.ratingBreakdown?.[stars] || 0;
                       const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
                       
                       return (
                         <div key={stars} className="flex items-center gap-4 text-[15px]">
                            <div className="flex gap-1 w-20 shrink-0 text-[#b4690e] justify-start pt-1">
                               <span className="underline cursor-pointer">{stars} stars</span>
                            </div>
                            <div className="w-full bg-[#d1d7dc] h-2 relative border border-transparent">
                               <div className="absolute top-0 left-0 h-full bg-[#6a6f73]" style={{ width: `${pct}%` }}></div>
                            </div>
                            <div className="w-12 shrink-0 text-[#b4690e] underline cursor-pointer">{pct}%</div>
                         </div>
                       )
                    })}
                 </div>

                 <div className="space-y-6">
                    {reviews.slice(0, 4).map(r => (
                      <div key={r.id} className="border-t border-[#d1d7dc] pt-6">
                         <div className="flex items-start gap-4 mb-3">
                           <div className={`w-12 h-12 text-white bg-black rounded-full flex items-center justify-center font-bold text-lg shrink-0`}>
                             {r.user?.name ? r.user.name.substring(0, 2).toUpperCase() : 'U'}
                           </div>
                           <div className="flex-1">
                              <p className="font-bold text-[15px] mb-1">{r.user?.name}</p>
                              <div className="flex items-center gap-2">
                                 <div className="flex text-[#b4690e]">
                                    {[1,2,3,4,5].map(x=><Star key={x} className={`w-3.5 h-3.5 ${x <= r.rating ? 'fill-current' : 'opacity-30'}`} />)}
                                 </div>
                                 <span className="text-gray-500 text-xs font-bold">{timeAgo(r.createdAt)}</span>
                              </div>
                           </div>
                           <MoreVertical className="w-5 h-5 text-gray-400 cursor-pointer" />
                         </div>
                         <p className="text-[15px] text-[#1c1d1f] mb-4">
                            {r.review || "Amazing course, really helped me learn the concepts properly!"}
                         </p>
                         <div className="flex items-center gap-4 text-xs">
                             <span className="text-gray-500">Was this review helpful?</span>
                             <button className="p-2 border border-[#1c1d1f] rounded-full hover:bg-gray-100 flex items-center justify-center w-9 h-9">
                               <ThumbsUp className="w-4 h-4" />
                             </button>
                             <button className="p-2 border border-[#1c1d1f] rounded-full hover:bg-gray-100 flex items-center justify-center w-9 h-9">
                               <ThumbsDown className="w-4 h-4" />
                             </button>
                             <a href="#" className="text-gray-500 underline ml-2">Report</a>
                          </div>
                      </div>
                    ))}
                    {reviews.length === 0 && (
                      <div className="text-gray-500 py-4">No reviews yet for this course.</div>
                    )}
                 </div>
           </div>

        </div>
      </div>
    </div>
  );
}