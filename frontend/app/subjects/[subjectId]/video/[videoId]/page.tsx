'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/apiClient';
import { useSidebarStore } from '@/store/sidebarStore';
import { useAuthStore } from '@/store/authStore';
import VideoPlayer from '@/components/Video/VideoPlayer';
import { Trophy, Share, MoreVertical, Search, Star, ThumbsUp, ThumbsDown, MessageCircle, PlayCircle, X, ChevronDown, ChevronUp, Clock, CheckCircle2, ChevronLeft, Lock, Loader2 } from 'lucide-react';

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

export default function UdemyStyleLearningPage({ params }: { params: { subjectId: string, videoId: string } }) {
  const { subjectId, videoId } = params;
  const router = useRouter();
  const { user } = useAuthStore();

  const fetchTree = useSidebarStore(s => s.fetchTree);
  const tree = useSidebarStore(s => s.tree);
  const markVideoCompleted = useSidebarStore(s => s.markVideoCompleted);

  const [video, setVideo] = useState<VideoData | null>(null);
  const [progress, setProgress] = useState<{ lastPositionSeconds: number, isCompleted: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState('Overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    let active = true;
    setLoading(true);

    async function load() {
      try {
        if (!tree || tree.id !== subjectId) {
          await fetchTree(subjectId);
        }
        
        const vidReq = await apiClient.get(`/api/videos/${videoId}`);
        if (!active) return;

        const vData = vidReq.data;
        setVideo(vData);

        if (tree) {
          // Initialize first section to open
          if (tree.sections && tree.sections.length > 0) {
            setExpandedSections(prev => ({ ...prev, [tree.sections[0].id]: true }));
            // Also open the section containing current video
            tree.sections.forEach(sec => {
              if (sec.videos.some(v => v.id === videoId)) {
                setExpandedSections(prev => ({ ...prev, [sec.id]: true }));
              }
            });
          }
        }

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
  }, [videoId, subjectId, fetchTree]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const handleProgress = useCallback(async (time: number) => {
    const now = Date.now();
    if (now - lastUpdateRef.current < 4000) return; 
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
    } catch (e) {
      console.error('Failed to mark complete');
    }
  }, [videoId, markVideoCompleted]);

  // Calculate overall progress based on tree
  let completedCount = 0;
  let totalCount = 0;

  if (tree) {
    tree.sections.forEach(sec => {
      sec.videos.forEach(v => {
        totalCount++;
        if (v.isCompleted) completedCount++;
      });
    });
  }
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (loading) {
    return <div className="flex h-screen items-center justify-center p-8 bg-white"><Loader2 className="w-10 h-10 text-[#a435f0] animate-spin" /></div>;
  }

  if (error || !video || (!progress && !video?.locked)) {
    return <div className="flex h-screen items-center justify-center p-8 bg-white"><p className="text-red-500 font-medium">{error || 'Could not load resource'}</p></div>;
  }

  // Common Udemy Colors
  const darkNav = '#1c1d1f';
  const udemyPurple = '#a435f0';
  const udemyGold = '#f69c08';
  const fontFam = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

  return (
    <div className="flex flex-col h-screen overflow-hidden text-[#1c1d1f]" style={{ fontFamily: fontFam }}>
      {/* TOP NAVIGATION BAR */}
      <div 
        className="flex items-center justify-between shrink-0 px-4 z-50 fixed top-0 w-full"
        style={{ height: '56px', backgroundColor: darkNav, color: 'white' }}
      >
        <div className="flex items-center gap-4 min-w-0">
          <Link href={`/subjects/${subjectId}`} className="font-extrabold text-white text-lg hover:text-gray-300 transition-colors">
            KODNEST
          </Link>
          <div className="border-l border-gray-600 h-6 mx-1"></div>
          <h1 className="text-[15px] font-bold truncate max-w-[600px] text-gray-100">
            {video.subjectTitle || 'Course Title'}
          </h1>
        </div>
        
        <div className="flex items-center gap-4 shrink-0">
          <button className="flex items-center gap-2 text-sm font-bold text-gray-200 hover:text-white transition-colors">
            <Trophy className="w-4 h-4" />
            <span>Your Progress: {progressPercent}%</span>
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold border border-gray-500 rounded hover:bg-white/10 transition">
             <span>Share</span>
             <Share className="w-4 h-4" />
          </button>
          <button className="p-1.5 hover:bg-white/10 rounded transition">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="flex flex-1 overflow-hidden mt-[56px] relative bg-white">
        
        {/* LEFT SIDE */}
        <div className="flex-1 overflow-y-auto flex flex-col relative w-full h-full">
          {video.locked ? (
            <div className="w-full aspect-video bg-black flex flex-col items-center justify-center text-white p-8">
               <Lock className="w-16 h-16 text-gray-400 mb-4" />
               <h2 className="text-2xl font-bold mb-2">Content Locked</h2>
               <p className="text-gray-400 mb-6">{video.unlockReason || 'Complete previous video to unlock.'}</p>
               {video.previousVideoId && (
                 <Link href={`/subjects/${subjectId}/video/${video.previousVideoId}`} className="flex items-center gap-2 bg-[#a435f0] px-6 py-3 font-bold hover:bg-[#8710d8] transition">
                    <ChevronLeft className="w-5 h-5" /> Previous Lesson
                 </Link>
               )}
            </div>
          ) : (
            <div className="w-full bg-black shrink-0 relative">
              <VideoPlayer
                videoId={video.id}
                youtubeUrl={video.youtubeUrl}
                startPositionSeconds={progress?.lastPositionSeconds || 0}
                onProgress={handleProgress}
                onCompleted={handleCompleted}
                className="w-full aspect-video bg-black"
              />
            </div>
          )}

          {/* TAB NAVIGATION */}
          <div className="sticky top-0 bg-white border-b border-[#d1d7dc] z-10 w-full">
            <div className="flex items-center px-4 overflow-x-auto no-scrollbar">
              {['Overview', 'Q&A', 'Notes', 'Announcements', 'Reviews', 'Learning tools'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-4 text-[15px] font-bold whitespace-nowrap border-b-4 transition-colors ${
                    activeTab === tab 
                      ? 'border-[#1c1d1f] text-[#1c1d1f]' 
                      : 'border-transparent text-gray-600 hover:text-[#1c1d1f]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* TAB CONTENT AREA */}
          <div className="p-6 md:p-8 max-w-4xl w-full pb-24">
            
            {activeTab === 'Overview' && (
              <div className="space-y-8 animate-in fade-in">
                <div>
                  <h2 className="text-2xl font-bold mb-4">Master {video.subjectTitle} by building projects</h2>
                  
                  <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-sm mb-4">
                    <div className="flex items-center gap-1 font-bold text-[#b4690e]">
                      <span>4.7</span>
                      <Star className="w-4 h-4 fill-current text-[#b4690e]" />
                    </div>
                    <a href="#" className="text-[#5624d0] underline font-medium">12,483 ratings</a>
                    <span className="text-[#1c1d1f]">45,291 Students</span>
                    <span className="text-[#1c1d1f]">48.5 hours Total</span>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-gray-600 mb-6">
                    <span>Last updated 10/2025</span>
                    <span className="flex items-center gap-1"><span className="border border-gray-400 rounded-sm px-1 font-medium text-xs">CC</span> English</span>
                  </div>
                </div>

                <div className="border border-[#d1d7dc] p-4 flex items-start gap-4 shadow-sm relative pr-10">
                  <Clock className="w-8 h-8 text-[#1c1d1f] shrink-0" />
                  <div>
                    <h3 className="font-bold mb-1">Schedule learning time</h3>
                    <p className="text-sm text-gray-600">Learning a little each day adds up. Research shows that students who make learning a habit are more likely to reach their goals.</p>
                  </div>
                  <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-800"><X className="w-5 h-5"/></button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-[#d1d7dc] pt-8">
                   <div>
                      <p className="text-sm text-gray-600 mb-2">By the numbers</p>
                      <ul className="text-sm space-y-2">
                        <li>Skill level: <strong>All Levels</strong></li>
                        <li>Students: <strong>45,291</strong></li>
                        <li>Languages: <strong>English</strong></li>
                        <li>Captions: <strong>Yes</strong></li>
                      </ul>
                   </div>
                   <div>
                      <p className="text-sm text-gray-600 mb-2">Features</p>
                      <ul className="text-sm space-y-2">
                        <li>Lectures: <strong>{totalCount}</strong></li>
                        <li>Video: <strong>48.5 total hours</strong></li>
                      </ul>
                   </div>
                </div>

                <div className="border-t border-[#d1d7dc] pt-8">
                  <h3 className="font-bold text-lg mb-4">Description</h3>
                  <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {video.description || "In this lesson, we will cover the core fundamentals and explore advanced topics to ensure you have a complete grasp of the subject. You will build projects, write clean code, and follow best practices used in the industry."}
                  </div>
                  <button className="mt-4 text-[#5624d0] font-bold text-sm flex items-center gap-1 hover:text-[#401b9c]">
                    Show more <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'Q&A' && (
              <div className="animate-in fade-in">
                <div className="bg-[#a435f0] text-white p-4 font-bold flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                   <div>
                     <h3 className="text-lg mb-1">Get an instant answer</h3>
                     <p className="text-sm font-normal">Our AI assistant can answer most questions instantly.</p>
                   </div>
                   <button className="bg-white text-[#a435f0] px-4 py-2 font-bold whitespace-nowrap hover:bg-gray-100 border border-transparent border-b-4 border-b-gray-300 active:border-b-0 active:translate-y-[4px]">
                     Ask AI Assistant
                   </button>
                </div>

                <div className="flex gap-4 mb-8 flex-col sm:flex-row">
                  <div className="relative flex-1">
                    <input type="text" placeholder="Search all course questions" className="w-full border border-[#1c1d1f] p-3 pr-10 text-sm focus:outline-none" />
                    <Search className="w-5 h-5 absolute right-3 top-3.5 text-black" />
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <select className="border border-[#1c1d1f] p-3 text-sm font-bold bg-white focus:outline-none cursor-pointer">
                      <option>All lectures</option>
                      <option>Current lecture</option>
                    </select>
                    <select className="border border-[#1c1d1f] p-3 text-sm font-bold bg-white focus:outline-none cursor-pointer">
                      <option>Sort by most recent</option>
                      <option>Sort by most upvoted</option>
                    </select>
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="font-bold text-lg mb-4">Featured questions</h3>
                  {[1].map(i => (
                    <div key={i} className="flex gap-4 p-4 border border-[#d1d7dc] bg-[#f7f9fa] mb-4 hover:bg-[#f3f4f6] cursor-pointer">
                      <div className="w-12 h-12 bg-[#1c1d1f] text-white rounded-full flex items-center justify-center font-bold text-lg shrink-0">JD</div>
                      <div className="flex-1 min-w-0">
                         <h4 className="font-bold text-[15px] mb-1 truncate">How to fix the strict mode error in React 18?</h4>
                         <p className="text-sm text-gray-600 truncate mb-2">When I run the project, I get a double rendering log, why is this happening exactly?</p>
                         <div className="flex items-center gap-2 text-xs text-gray-500 font-bold">
                            <span className="text-[#5624d0]">John Doe</span>
                            <span>· Lecture 12</span>
                            <span>· 1 year ago</span>
                         </div>
                      </div>
                      <div className="flex flex-col items-center justify-center gap-3 shrink-0 ml-4">
                         <div className="flex items-center gap-1 text-gray-500 font-bold text-sm"><span className="text-lg px-2"><ChevronUp className="w-5 h-5" /></span> 42</div>
                         <div className="flex items-center gap-1 text-gray-500 font-bold text-sm"><MessageCircle className="w-4 h-4" /> 5</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <h3 className="font-bold text-lg mb-4">All questions <span className="text-gray-500 font-normal">(1,204)</span></h3>
                  {[2, 3, 4].map(i => (
                    <div key={i} className="flex gap-4 py-4 border-b border-[#d1d7dc] hover:bg-[#f7f9fa] cursor-pointer transition px-2">
                       <div className={`w-12 h-12 text-white rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${['bg-[#b4690e]', 'bg-[#5624d0]', 'bg-[#1c1d1f]'][i-2]}`}>
                         {['AM', 'SK', 'RJ'][i-2]}
                       </div>
                       <div className="flex-1 min-w-0">
                         <h4 className="font-bold text-[15px] mb-1">Question regarding state updates</h4>
                         <p className="text-sm text-gray-600 truncate mb-2">I completely understood the lecture but have one minor doubt about asynchronous state...</p>
                         <div className="flex items-center gap-2 text-xs text-gray-500 font-bold">
                            <span className="text-[#5624d0]">Student {i}</span>
                            <span>· Lecture {i*5}</span>
                            <span>· {i} months ago</span>
                         </div>
                      </div>
                      <div className="flex flex-col items-center justify-start gap-3 shrink-0 ml-4 pt-1">
                         <div className="flex items-center gap-1 text-gray-500 font-bold text-sm"><span className="px-1"><ChevronUp className="w-5 h-5" /></span> {i*7}</div>
                         <div className="flex items-center gap-1 text-gray-500 font-bold text-sm"><MessageCircle className="w-4 h-4" /> {i}</div>
                      </div>
                    </div>
                  ))}
                  <button className="w-full text-center border border-[#1c1d1f] py-3 mt-6 font-bold hover:bg-gray-50">
                    See more
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'Reviews' && (
              <div className="animate-in fade-in">
                 <h2 className="text-2xl font-bold mb-6">Student feedback</h2>
                 
                 <div className="flex flex-col md:flex-row gap-8 mb-8">
                    <div className="flex flex-col items-center justify-center text-center">
                       <div className="text-6xl font-extrabold text-[#b4690e] tracking-tight mb-2">4.7</div>
                       <div className="flex text-[#b4690e] mb-1">
                          {[1,2,3,4].map(x=><Star key={x} className="w-5 h-5 fill-current" />)}
                          <Star className="w-5 h-5 fill-current opacity-50" />
                       </div>
                       <div className="text-[#b4690e] font-bold text-sm">Course Rating</div>
                    </div>

                    <div className="flex-1 flex flex-col gap-2 justify-center max-w-sm">
                       {[
                         { pct: 60, stars: 5 },
                         { pct: 25, stars: 4 },
                         { pct: 10, stars: 3 },
                         { pct: 3,  stars: 2 },
                         { pct: 2,  stars: 1 },
                       ].map(row => (
                         <div key={row.stars} className="flex items-center gap-4 text-sm">
                            <div className="w-full bg-[#d1d7dc] h-2 relative">
                               <div className="absolute top-0 left-0 h-full bg-[#6a6f73]" style={{ width: `${row.pct}%` }}></div>
                            </div>
                            <div className="flex text-[#b4690e] w-24 shrink-0 px-2 justify-end">
                               {[...Array(5)].map((_, i) => (
                                 <Star key={i} className={`w-3.5 h-3.5 fill-current ${i < row.stars ? '' : 'opacity-0'}`} />
                               ))}
                            </div>
                            <a href="#" className="w-8 shrink-0 text-[#5624d0] underline font-medium">{row.pct}%</a>
                         </div>
                       ))}
                    </div>
                 </div>

                 <h3 className="text-xl font-bold mb-6">Reviews</h3>
                 
                 <div className="flex gap-4 mb-8">
                    <div className="relative flex-1 max-w-md">
                      <input type="text" placeholder="Search reviews" className="w-full border border-[#1c1d1f] p-3 pr-10 text-sm focus:outline-none" />
                      <button className="bg-[#1c1d1f] text-white p-3 absolute right-0 top-0 h-full w-12 flex items-center justify-center hover:bg-gray-800">
                         <Search className="w-5 h-5" />
                      </button>
                    </div>
                    <select className="border border-[#1c1d1f] p-3 text-sm font-bold bg-white focus:outline-none cursor-pointer">
                      <option>All ratings</option>
                      <option>Five stars</option>
                    </select>
                 </div>

                 <div className="space-y-6">
                    {[1,2,3].map(i => (
                      <div key={i} className="border-t border-[#d1d7dc] pt-6 flex gap-6">
                         <div className={`w-12 h-12 text-white rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${['bg-green-700', 'bg-blue-700', 'bg-red-700'][i-1]}`}>
                           {['TK', 'JS', 'ML'][i-1]}
                         </div>
                         <div className="flex-1">
                            <p className="font-bold text-[15px] mb-1">{['Tom K.', 'Jane S.', 'Mike L.'][i-1]}</p>
                            <div className="flex items-center gap-2 mb-4">
                               <div className="flex text-[#b4690e]">
                                  {[1,2,3,4,5].map(x=><Star key={x} className="w-3.5 h-3.5 fill-current" />)}
                               </div>
                               <span className="text-gray-500 text-sm font-bold">{i} months ago</span>
                            </div>
                            <p className="text-[15px] text-[#1c1d1f] mb-4">
                              Absolutely fantastic course. The pacing is perfect and the projects are exactly what I needed to grasp these complex topics. Highly recommended for anyone looking to upskill quickly and efficiently.
                            </p>
                            <div className="flex items-center gap-4 text-xs">
                               <span className="text-gray-500 font-bold">Was this review helpful?</span>
                               <button className="p-2 border border-[#1c1d1f] rounded-full hover:bg-gray-100 flex items-center justify-center w-9 h-9">
                                 <ThumbsUp className="w-4 h-4" />
                               </button>
                               <button className="p-2 border border-[#1c1d1f] rounded-full hover:bg-gray-100 flex items-center justify-center w-9 h-9">
                                 <ThumbsDown className="w-4 h-4" />
                               </button>
                               <a href="#" className="text-gray-500 underline font-medium ml-2">Report</a>
                            </div>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
            )}

            {['Notes', 'Announcements', 'Learning tools'].includes(activeTab) && (
              <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in">
                 <h2 className="text-2xl font-bold mb-2">No {activeTab.toLowerCase()} yet</h2>
                 <p className="text-gray-600">This section will be available soon.</p>
              </div>
            )}

          </div>
        </div>

        {/* RIGHT SIDEBAR - fixed 400px fixed conceptually via layout */}
        {sidebarOpen && (
          <div className="w-[400px] shrink-0 border-l border-[#d1d7dc] bg-white flex flex-col h-full bg-white relative z-0">
             
            <div className="flex items-center justify-between p-4 border-b border-[#d1d7dc] shrink-0">
               <div className="flex items-center gap-4">
                 <h2 className="font-bold text-[15px]">Course content</h2>
                 <Link href="#" className="text-[#5624d0] font-bold text-sm">AI Assistant</Link>
               </div>
               <button onClick={() => setSidebarOpen(false)} className="text-gray-600 hover:text-black">
                 <X className="w-5 h-5" />
               </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
               {tree ? tree.sections.map((section, idx) => {
                 let secCompleted = 0;
                 section.videos.forEach(v => { if (v.isCompleted) secCompleted++; });
                 const isExpanded = !!expandedSections[section.id];
                 
                 return (
                   <div key={section.id} className="border-b border-[#d1d7dc]">
                     <button 
                       onClick={() => toggleSection(section.id)}
                       className="w-full text-left p-4 pr-12 relative hover:bg-gray-50 transition-colors bg-[#f7f9fa] border-b border-[#d1d7dc]"
                     >
                       <h3 className="font-bold text-[15px] mb-1 leading-tight">{`Section ${idx + 1}: ${section.title}`}</h3>
                       <div className="text-xs text-gray-500 font-normal">
                         {secCompleted} / {section.videos.length} | {section.videos.length * 15}min
                       </div>
                       <div className="absolute top-1/2 -translate-y-1/2 right-4 text-gray-600">
                         {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                       </div>
                     </button>

                     {isExpanded && (
                       <div className="flex flex-col bg-white">
                         {section.videos.map((v, vIdx) => {
                           const isPlaying = v.id === videoId;
                           return (
                             <div 
                               key={v.id} 
                               className={`px-4 py-3 border-b border-[#d1d7dc] border-dotted last:border-b-0 flex gap-3 ${isPlaying ? 'bg-[#d1d7dc]/30' : 'hover:bg-gray-50'} transition-colors`}
                             >
                               <div className="shrink-0 pt-1">
                                 {v.isCompleted ? (
                                    <div className="w-4 h-4 rounded-[2px] border-2 border-transparent bg-gray-600 text-white flex items-center justify-center p-[1px]">
                                      <CheckCircle2 className="w-full h-full" />
                                    </div>
                                 ) : (
                                    <input type="checkbox" readOnly checked={false} className="w-4 h-4 border-gray-400 rounded-sm mt-[2px] cursor-pointer" />
                                 )}
                               </div>
                               <Link 
                                 href={v.locked ? '#' : `/subjects/${subjectId}/video/${v.id}`}
                                 className={`flex-1 min-w-0 ${v.isCompleted ? 'text-gray-500' : 'text-[#1c1d1f]'} ${v.locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                               >
                                  <div className={`text-sm ${isPlaying ? 'font-bold' : 'font-normal'} leading-snug mb-1`}>
                                    {`${idx + 1}.${vIdx + 1} ${v.title}`}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                     <PlayCircle className="w-3.5 h-3.5" />
                                     <span>15min</span>
                                  </div>
                               </Link>
                             </div>
                           )
                         })}
                       </div>
                     )}
                   </div>
                 );
               }) : (
                 <div className="p-8 text-center text-sm text-gray-500">Loading curriculum...</div>
               )}
            </div>

          </div>
        )}
      </div>
      
    </div>
  );
}