'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/apiClient';
import { useSidebarStore } from '@/store/sidebarStore';
import { useAuthStore } from '@/store/authStore';
import VideoPlayer from '@/components/Video/VideoPlayer';
import CourseReviews from '@/components/Video/CourseReviews';
import { 
  Trophy, Share, Search, Star, MessageCircle, PlayCircle, 
  X, ChevronDown, ChevronUp, CheckCircle2, ChevronLeft, Lock, 
  Loader2, ThumbsUp, Pin, Trash2, Pencil, Send 
} from 'lucide-react';

function timeAgo(dateInput: string | Date | any) {
  const date = new Date(dateInput);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 365) return `${diffInDays} days ago`;
  return `${Math.floor(diffInDays / 365)} years ago`;
}

function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    'bg-[#b4690e]', 'bg-[#5624d0]', 'bg-[#1c1d1f]', 'bg-[#2d9059]',
    'bg-[#b32d2e]', 'bg-[#0f4d8a]', 'bg-[#8a156e]', 'bg-[#d07b24]'
  ];
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name: string) {
  if (!name) return 'U';
  const parts = name.split(' ');
  if (parts.length > 1) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

/** 
 * Modularized Q&A Tab mapping strictly to Udemy specific UI and preserving functions
 */
function QATab({ videoId, currentUser }: { videoId: string, currentUser: any }) {
  const [comments, setComments] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [newCommentText, setNewCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);

  const loadComments = useCallback(async () => {
    try {
      const res = await apiClient.get(`/api/videos/${videoId}/comments?page=1&pageSize=50`);
      // force pins to top
      const sorted = res.data.data.sort((a: any, b: any) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0;
      });
      setComments(sorted);
      setTotalCount(res.data.totalCount || sorted.length);
    } catch (e) {
      console.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [videoId]);

  useEffect(() => {
    if (currentUser !== undefined) {
      setLoading(true);
      loadComments();
    }
  }, [videoId, currentUser, loadComments]);

  const handlePostComment = async () => {
    if (!newCommentText.trim() || submitting) return;
    setSubmitting(true);
    try {
      await apiClient.post(`/api/videos/${videoId}/comments`, { content: newCommentText });
      setNewCommentText('');
      loadComments();
    } catch(e) {} finally { setSubmitting(false); }
  };

  const handlePostReply = async (parentId: string) => {
    if (!replyText.trim() || submitting) return;
    setSubmitting(true);
    try {
      await apiClient.post(`/api/videos/${videoId}/comments`, { content: replyText, parentId });
      setReplyText('');
      setActiveReplyId(null);
      loadComments(); 
    } catch(e) {} finally { setSubmitting(false); }
  };

  const handleToggleUpvote = async (commentId: string, isReply = false, parentId?: string) => {
    if (!currentUser) return;
    try {
      const res = await apiClient.post(`/api/comments/${commentId}/upvote`);
      const { upvoted, upvoteCount } = res.data;
      
      setComments(prev => {
        const updated = [...prev];
        for (let i = 0; i < updated.length; i++) {
          if (updated[i].id === commentId && !isReply) {
            updated[i].upvoteCount = upvoteCount;
            updated[i].hasUpvoted = upvoted;
            break;
          }
          if (isReply && updated[i].id === parentId) {
            for (let j = 0; j < (updated[i].replies || []).length; j++) {
               if (updated[i].replies[j].id === commentId) {
                  updated[i].replies[j].upvoteCount = upvoteCount;
                  updated[i].replies[j].hasUpvoted = upvoted;
                  break;
               }
            }
          }
        }
        return updated;
      });
    } catch (e) {}
  };

  const handleTogglePin = async (commentId: string) => {
    try {
      await apiClient.post(`/api/comments/${commentId}/pin`);
      loadComments();
    } catch (e) {}
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Delete comment?')) return;
    try {
      await apiClient.delete(`/api/comments/${commentId}`);
      loadComments();
    } catch (e) {}
  };

  const renderComment = (c: any, isReply = false, parentId?: string) => {
    const isOwner = currentUser?.id === c.user.id;
    const isAdmin = currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Instructor');

    return (
      <div key={c.id} className={`flex gap-4 py-4 ${isReply ? 'ml-12 border-t border-dashed border-[#d1d7dc]' : 'border-b border-[#d1d7dc]'} w-full`}>
         <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0 ${stringToColor(c.user.name)}`}>
            {getInitials(c.user.name)}
         </div>
         <div className="flex-1 min-w-0">
            {c.isPinned && !isReply && (
              <div className="flex items-center gap-1 text-[11px] font-bold text-[#f69c08] mb-1">
                 <Pin className="w-3 h-3" /> FEATURED
              </div>
            )}
            <h4 className="font-bold text-[15px] mb-1 text-[#1c1d1f] break-words line-clamp-2">
               {c.content.length > 60 ? c.content.substring(0, 60) + '...' : c.content}
            </h4>
            <p className="text-[14px] text-gray-800 mb-2 whitespace-pre-wrap break-words">{c.content}</p>
            
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
               <span className="text-[#5624d0] font-bold hover:underline cursor-pointer">{c.user.name}</span>
               <span>·</span>
               <span>{timeAgo(c.createdAt)}</span>
               {isAdmin && !isReply && (
                  <button onClick={() => handleTogglePin(c.id)} className="ml-2 hover:text-[#f69c08]">Pin</button>
               )}
               {isOwner && (
                  <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:text-red-700 ml-2">Delete</button>
               )}
            </div>

            {/* Replies expanded view natively mapped */}
            {!isReply && activeReplyId === c.id && (
               <div className="mt-3 flex gap-3">
                  <textarea 
                     value={replyText} onChange={e => setReplyText(e.target.value)}
                     className="flex-1 w-full border border-[#1c1d1f] p-2 text-sm focus:outline-none resize-none" 
                     placeholder="Write your reply..." rows={2}
                  />
                  <div className="flex flex-col gap-2 shrink-0">
                     <button onClick={() => handlePostReply(c.id)} className="bg-[#a435f0] text-white px-3 py-1 font-bold text-sm">Reply</button>
                     <button onClick={() => setActiveReplyId(null)} className="text-[#1c1d1f] text-sm font-bold border border-[#1c1d1f] px-3 py-1">Cancel</button>
                  </div>
               </div>
            )}

            {!isReply && c.replies && c.replies.map((r: any) => renderComment(r, true, c.id))}
         </div>
         
         {/* Right actions: Upvotes and Reply counts strictly positioned */}
         <div className="flex flex-col items-center gap-2 shrink-0 ml-4 pt-1 w-12">
            <button 
              onClick={() => handleToggleUpvote(c.id, isReply, parentId)}
              className="flex items-center gap-1 font-bold text-[15px] text-[#1c1d1f] hover:text-[#a435f0]"
            >
               <ChevronUp className={`w-5 h-5 ${c.hasUpvoted ? 'text-[#a435f0] stroke-[3px]' : ''}`} />
               {c.upvoteCount || 0}
            </button>
            {!isReply && (
               <button 
                 onClick={() => { setActiveReplyId(activeReplyId === c.id ? null : c.id); setReplyText(''); }}
                 className="flex items-center gap-1 text-[13px] font-bold text-gray-500 hover:text-[#1c1d1f]"
               >
                 <MessageCircle className="w-4 h-4" />
                 {c.replyCount || c.replies?.length || 0}
               </button>
            )}
         </div>
      </div>
    );
  };

  return (
    <div className="animate-in fade-in flex flex-col h-full relative">
       {/* Top Search bar inside Tab */}
       <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
             <input type="text" placeholder="Search all course questions" className="w-full border border-[#1c1d1f] p-3 pr-10 text-[15px] focus:outline-none placeholder-gray-600" />
             <Search className="w-5 h-5 absolute right-3 top-3.5 text-[#1c1d1f]" />
          </div>
          <select className="border border-[#1c1d1f] p-3 text-[15px] font-bold bg-white focus:outline-none cursor-pointer w-full sm:w-auto">
             <option>Sort by most recent</option>
             <option>Sort by most upvoted</option>
             <option>Featured questions</option>
          </select>
       </div>

       {/* List wrapper allowing padding for bottom input */}
       <div className="mb-12">
         {loading ? (
            <div className="py-8 flex justify-center"><Loader2 className="w-8 h-8 text-[#a435f0] animate-spin" /></div>
         ) : comments.length === 0 ? (
            <div className="py-12 text-center text-gray-500 font-medium">No questions in this course yet. Be the first to ask!</div>
         ) : (
            <div className="flex flex-col">
               {comments.map(c => renderComment(c))}
            </div>
         )}
       </div>

       {/* Question Input Box at Bottom fixed conceptually within the flow */}
       {currentUser && (
         <div className="mt-8 border-t border-[#d1d7dc] pt-6 flex flex-col gap-3 pb-8">
            <h3 className="font-bold text-lg text-[#1c1d1f]">Ask a new question</h3>
            <textarea 
               value={newCommentText}
               onChange={e => setNewCommentText(e.target.value)}
               placeholder="Write your question specifically regarding this lecture..."
               className="w-full border border-[#1c1d1f] p-4 focus:outline-none min-h-[100px] resize-none text-[15px]" 
            />
            <button 
               onClick={handlePostComment}
               disabled={!newCommentText.trim() || submitting}
               className="bg-[#a435f0] text-white font-bold py-3 px-6 hover:bg-[#8710d8] disabled:opacity-50 self-start"
            >
               {submitting ? 'Posting...' : 'Post Question'}
            </button>
         </div>
       )}
    </div>
  );
}


interface VideoData {
  id: string; title: string; description: string; youtubeUrl: string;
  durationSeconds: number | null; sectionId: string; sectionTitle: string;
  subjectId: string; subjectTitle: string; 
  previousVideoId: string | null; nextVideoId: string | null; 
  locked: boolean; unlockReason: string | null;
}

export default function VideoLessonPage({ params }: { params: { subjectId: string, videoId: string } }) {
  const { subjectId, videoId } = params;
  const router = useRouter();
  const { user } = useAuthStore();

  const fetchTree = useSidebarStore(s => s.fetchTree);
  const tree = useSidebarStore(s => s.tree);
  const markVideoCompleted = useSidebarStore(s => s.markVideoCompleted);

  const [video, setVideo] = useState<VideoData | null>(null);
  const [progress, setProgress] = useState<{ lastPositionSeconds: number, isCompleted: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('Overview');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        if (!tree || tree.id !== subjectId) {
          await fetchTree(subjectId);
        }
        const vidReq = await apiClient.get(`/api/videos/${videoId}`);
        if (!active) return;

        setVideo(vidReq.data);

        if (tree?.sections) {
          tree.sections.forEach(sec => {
            if (sec.videos.some(v => v.id === videoId)) {
              setExpandedSections(prev => ({ ...prev, [sec.id]: true }));
            }
          });
        }

        if (!vidReq.data.locked) {
          const progReq = await apiClient.get(`/api/progress/videos/${videoId}`);
          if (active) setProgress(progReq.data);
        }
      } catch (err) {} finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [videoId, subjectId, fetchTree]);

  const toggleSection = (id: string) => setExpandedSections(p => ({ ...p, [id]: !p[id] }));

  const handleProgress = useCallback(async (time: number) => {
    const now = Date.now();
    if (now - lastUpdateRef.current < 4000) return; 
    lastUpdateRef.current = now;
    try {
      await apiClient.post(`/api/progress/videos/${videoId}`, { lastPositionSeconds: Math.floor(time) });
    } catch (e) {}
  }, [videoId]);

  const handleCompleted = useCallback(async () => {
    try {
      await apiClient.post(`/api/progress/videos/${videoId}`, { isCompleted: true });
      markVideoCompleted(videoId);
    } catch (e) {}
  }, [videoId, markVideoCompleted]);

  const fontFam = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

  let compiled = 0; let tot = 0;
  if (tree) {
    tree.sections.forEach(sec => {
      sec.videos.forEach(v => { tot++; if (v.isCompleted) compiled++; });
    });
  }
  const pct = tot > 0 ? Math.round((compiled / tot) * 100) : 0;

  if (loading || !video) {
    return <div className="flex h-screen items-center justify-center bg-white"><Loader2 className="w-10 h-10 text-[#a435f0] animate-spin" /></div>;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white text-[#1c1d1f]" style={{ fontFamily: fontFam }}>
      
      {/* TOP NAV BAR (fixed) */}
      <div className="flex items-center justify-between px-6 z-50 shrink-0 bg-[#1c1d1f] text-white h-[56px]">
         <div className="flex items-center gap-4 min-w-0 pr-4">
            <Link href="/" className="font-extrabold text-[15px] shrink-0 border-r border-[#3e4143] pr-4 py-1 hover:text-gray-300">
               KODNEST
            </Link>
            <h1 className="font-bold text-[15px] truncate max-w-lg">{video.subjectTitle || 'Course'}</h1>
         </div>
         <div className="flex items-center gap-4 shrink-0">
            <button className="flex items-center gap-2 text-[15px] font-bold hover:text-gray-300">
               <Trophy className="w-4 h-4" />
               <span className="hidden sm:block">Your progress</span>
               <span className="hidden sm:block">{pct}%</span>
            </button>
            <button className="flex items-center gap-1.5 border border-white px-3 py-1.5 text-[15px] font-bold hover:bg-white/10 hidden sm:flex">
               Share <Share className="w-4 h-4 ml-1" />
            </button>
         </div>
      </div>

      {/* MAIN TWO-COLUMN */}
      <div className="flex flex-1 overflow-hidden relative">
         
         {/* LEFT SIDE */}
         <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden relative scroll-smooth pb-16">
            
            {/* Video Player */}
            {video.locked ? (
               <div className="w-full aspect-video bg-black flex flex-col items-center justify-center text-white">
                  <Lock className="w-12 h-12 text-gray-500 mb-4" />
                  <h2 className="text-xl font-bold mb-2">Content Locked</h2>
                  {video.previousVideoId && (
                     <Link href={`/subjects/${subjectId}/video/${video.previousVideoId}`} className="bg-[#a435f0] px-6 py-3 font-bold mt-4 hover:bg-[#8710d8]">
                        Play Previous Lesson
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

            {/* Sticky Tabs */}
            <div className="sticky top-0 bg-white border-b border-[#d1d7dc] z-20 px-4 md:px-8 w-full flex gap-2">
               {['Overview', 'Q&A', 'Notes', 'Reviews'].map(tab => (
                 <button 
                   key={tab} 
                   onClick={() => setActiveTab(tab)}
                   className={`px-3 py-4 text-[15px] bg-white transition border-b-4 hover:text-[#1c1d1f] whitespace-nowrap ${activeTab === tab ? 'border-[#1c1d1f] font-bold text-[#1c1d1f]' : 'border-transparent text-[#6a6f73] font-bold font-normal'}`}
                 >
                   {tab}
                 </button>
               ))}
            </div>

            {/* Tab Contents */}
            <div className="p-6 md:p-8 max-w-4xl mx-auto w-full">
               
               {activeTab === 'Overview' && (
                 <div className="animate-in fade-in space-y-6">
                    <h2 className="text-2xl font-bold">{video.title}</h2>
                    <div className="flex flex-wrap gap-4 text-[13px] text-gray-600">
                      <span className="font-bold text-[#b4690e] flex items-center gap-1">4.7 <Star className="w-3.5 h-3.5 fill-current" /></span>
                      <span className="hidden sm:inline">•</span>
                      <span>45,291 students</span>
                      <span className="hidden sm:inline">•</span>
                      <span>15.5 hours total</span>
                      <span className="hidden sm:inline">•</span>
                      <span>Created by <a href="#" className="font-bold text-[#5624d0] underline">John Doe</a></span>
                    </div>
                    
                    <div className="border-t border-[#d1d7dc] pt-6 mt-6">
                      <h3 className="font-bold text-lg mb-3">Description</h3>
                      <div className="text-[15px] leading-relaxed whitespace-pre-wrap mb-4">
                        {video.description || "Master this course from scratch and build robust real-world projects seamlessly."}
                      </div>
                      <button className="text-[#5624d0] font-bold hover:text-[#401b9c] underline w-full text-left flex items-center gap-1">
                        Show more <ChevronDown className="w-4 h-4 mt-1" />
                      </button>
                    </div>
                 </div>
               )}

               {activeTab === 'Q&A' && (
                 <QATab videoId={videoId} currentUser={user} />
               )}

               {activeTab === 'Notes' && (
                 <div className="py-16 text-center text-gray-500 font-medium">Capture your notes here. (Coming soon)</div>
               )}

               {activeTab === 'Reviews' && (
                 <CourseReviews subjectId={subjectId} />
               )}

            </div>
         </div>

         {/* RIGHT SIDEBAR */}
         <div className="w-[400px] shrink-0 border-l border-[#d1d7dc] bg-white flex flex-col h-full z-10 custom-scrollbar-hidden overflow-y-auto hidden lg:flex">
            <div className="p-4 border-b border-[#d1d7dc] shrink-0 bg-white sticky top-0 z-10">
               <h2 className="font-bold text-[15px]">Course content</h2>
            </div>
            
            <div className="flex-1 pb-10">
               {tree ? tree.sections.map((section: any, idx: number) => {
                 let sComp = 0;
                 section.videos.forEach((v: any) => { if (v.isCompleted) sComp++; });
                 const exp = !!expandedSections[section.id];
                 
                 return (
                   <div key={section.id}>
                     <button onClick={() => toggleSection(section.id)} className="w-full text-left p-4 bg-[#f7f9fa] border-b border-[#d1d7dc] hover:bg-gray-100 flex justify-between items-start transition-colors group">
                       <div className="pr-4">
                         <h3 className="font-bold text-[15px] leading-tight mb-1 text-[#1c1d1f] group-hover:text-black">{`Section ${idx + 1}: ${section.title}`}</h3>
                         <div className="text-xs text-[#6a6f73] font-normal">{sComp}/{section.videos.length} | {section.videos.length * 15}min</div>
                       </div>
                       <div className="text-gray-500 pt-1">
                         {exp ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                       </div>
                     </button>
                     
                     {exp && (
                       <div className="bg-white">
                         {section.videos.map((v: any, vIdx: number) => {
                           const active = v.id === videoId;
                           return (
                             <div key={v.id} className={`flex gap-3 px-4 py-3 border-b border-[#d1d7dc] border-dotted ${active ? 'bg-[#d1d7dc]/30' : 'hover:bg-gray-50'}`}>
                               <div className="pt-1">
                                 {v.isCompleted ? (
                                   <div className="w-[18px] h-[18px] flex items-center justify-center bg-gray-500 text-white rounded-sm"><CheckCircle2 className="w-3.5 h-3.5" /></div>
                                 ) : (
                                   <input type="checkbox" readOnly className="w-4 h-4 rounded-sm border-gray-400 mt-0.5 pointer-events-none" />
                                 )}
                               </div>
                               <Link href={v.locked ? '#' : `/subjects/${subjectId}/video/${v.id}`} className={`flex-1 ${v.locked ? 'opacity-50 pointer-events-none' : ''}`}>
                                  <div className={`text-[14px] leading-snug mb-1 text-[#1c1d1f] ${v.isCompleted && !active ? 'text-gray-500' : ''} ${active ? 'font-bold' : ''}`}>
                                    {`${idx + 1}.${vIdx + 1} ${v.title}`}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-xs text-[#6a6f73]">
                                     <PlayCircle className="w-3.5 h-3.5" /> 15min
                                  </div>
                               </Link>
                             </div>
                           )
                         })}
                       </div>
                     )}
                   </div>
                 )
               }) : (
                 <div className="p-8 text-center text-sm text-gray-500">Loading...</div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
}