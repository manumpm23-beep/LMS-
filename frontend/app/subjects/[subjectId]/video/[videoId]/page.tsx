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
  Trophy, Search, Star, MessageCircle, PlayCircle, 
  ChevronDown, ChevronUp, CheckCircle2, Lock, 
  Loader2, ThumbsUp, Pin, Trash2, Pencil, Users, 
  Clock, BookOpen, ChevronRight, MessageSquarePlus
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
    'bg-[#f87171]','bg-[#fbbf24]','bg-[#34d399]','bg-[#60a5fa]',
    'bg-[#a78bfa]','bg-[#f472b6]','bg-[#fb923c]','bg-[#2dd4bf]'
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
 * Q&A Tab mapping strictly preserving bindings
 */
function QATab({ videoId, currentUser }: { videoId: string, currentUser: any }) {
  const [comments, setComments] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [showAsk, setShowAsk] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);

  const loadComments = useCallback(async () => {
    try {
      const res = await apiClient.get(`/api/videos/${videoId}/comments?page=1&pageSize=50`);
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
      setShowAsk(false);
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
      <div key={c.id} className={`flex gap-4 py-5 ${isReply ? 'ml-12 border-t border-[#e5e7eb]' : 'border-b border-[#e5e7eb]'} w-full border-dashed group`}>
         <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0 ${stringToColor(c.user.name)}`}>
            {getInitials(c.user.name)}
         </div>
         <div className="flex-1 min-w-0">
            {c.isPinned && !isReply && (
              <div className="flex items-center gap-1 text-[11px] font-bold text-[#f69c08] mb-1">
                 📌 Pinned Question
              </div>
            )}
            
            <h4 className="font-bold text-[15px] mb-1 text-[#1c1d1f] flex items-center gap-2 max-w-full">
               <span className="truncate">{c.user.name.split(' ')[0]}'s question</span>
               <span className="text-[#6b7280] text-xs font-normal shrink-0">· {timeAgo(c.createdAt)}</span>
            </h4>

            <p className="text-[14px] text-[#6b7280] mb-2 truncate group-hover:whitespace-normal group-hover:text-[#1c1d1f] transition-all duration-200">
               {c.content}
            </p>
            
            <div className="flex flex-wrap items-center gap-4 text-[13px] text-[#6b7280]">
               {isAdmin && !isReply && (
                  <button onClick={() => handleTogglePin(c.id)} className="hover:text-[#2d2d2d] underline">Pin</button>
               )}
               {isOwner && (
                  <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:text-red-700 underline">Delete</button>
               )}
            </div>

            {/* Replies */}
            {!isReply && activeReplyId === c.id && (
               <div className="mt-4 flex flex-col gap-3">
                  <textarea 
                     value={replyText} onChange={e => setReplyText(e.target.value)}
                     className="w-full border border-[#e5e7eb] rounded-lg p-3 text-sm focus:outline-none focus:border-[#2d2d2d] resize-y min-h-[80px]" 
                     placeholder="Write a reply..."
                  />
                  <div className="flex gap-3">
                     <button onClick={() => handlePostReply(c.id)} className="bg-[#2d2d2d] text-white px-5 py-2 font-bold text-[13px] rounded-lg hover:bg-black transition-colors">Post Reply</button>
                     <button onClick={() => setActiveReplyId(null)} className="text-[#2d2d2d] text-[13px] font-bold border border-[#e5e7eb] rounded-lg px-5 py-2 hover:bg-gray-50 transition-colors">Cancel</button>
                  </div>
               </div>
            )}

            {!isReply && c.replies && c.replies.map((r: any) => renderComment(r, true, c.id))}
         </div>
         
         <div className="flex flex-col items-end gap-3 shrink-0 ml-2 w-16 pt-1">
            <button 
              onClick={() => handleToggleUpvote(c.id, isReply, parentId)}
              className="flex items-center gap-1.5 font-medium text-[13px] text-[#6b7280] hover:text-[#2d2d2d] transition-colors"
            >
               <ThumbsUp className={`w-4 h-4 ${c.hasUpvoted ? 'text-[#2d2d2d] fill-current' : ''}`} />
               {c.upvoteCount || 0}
            </button>
            {!isReply && (
               <button 
                 onClick={() => { setActiveReplyId(activeReplyId === c.id ? null : c.id); setReplyText(''); }}
                 className="flex items-center gap-1.5 text-[13px] font-medium text-[#6b7280] hover:text-[#2d2d2d] transition-colors"
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
    <div className="animate-in fade-in flex flex-col h-full relative" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" }}>
       
       <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          <div className="flex-1 w-full flex flex-col sm:flex-row gap-4">
             <div className="relative flex-1 max-w-md">
                <input type="text" placeholder="Search questions..." className="w-full border border-[#e5e7eb] rounded-lg p-3 pr-10 text-[14px] focus:outline-none focus:border-[#2d2d2d] placeholder-[#6b7280]" />
                <Search className="w-4 h-4 absolute right-3 top-3.5 text-[#6b7280]" />
             </div>
             <select className="border border-[#e5e7eb] rounded-lg py-3 px-4 text-[14px] bg-white focus:outline-none focus:border-[#2d2d2d] cursor-pointer text-[#1c1d1f] shrink-0 font-medium w-full sm:w-auto">
                <option>Newest</option>
                <option>Most Upvoted</option>
             </select>
          </div>
          {currentUser && (
             <button 
               onClick={() => setShowAsk(!showAsk)}
               className="bg-[#2d2d2d] text-white px-5 py-3 rounded-lg text-[14px] font-bold hover:bg-black transition-colors shrink-0 w-full md:w-auto"
             >
               Ask a Question
             </button>
          )}
       </div>

       {showAsk && currentUser && (
         <div className="mb-8 p-6 border border-[#e5e7eb] bg-white rounded-xl shadow-sm">
            <h3 className="font-bold text-[15px] text-[#1c1d1f] mb-3">Ask a new question</h3>
            <textarea 
               value={newCommentText}
               onChange={e => setNewCommentText(e.target.value)}
               placeholder="What do you need help with?"
               className="w-full border border-[#e5e7eb] rounded-lg p-4 focus:outline-none focus:border-[#2d2d2d] min-h-[120px] resize-y text-[14px] mb-4 bg-[#f9fafb]" 
            />
            <div className="flex gap-3">
               <button 
                  onClick={handlePostComment}
                  disabled={!newCommentText.trim() || submitting}
                  className="bg-[#2d2d2d] text-white font-bold py-2.5 px-6 rounded-lg hover:bg-black disabled:opacity-50 text-[14px]"
               >
                  {submitting ? 'Posting...' : 'Post Question'}
               </button>
               <button onClick={() => setShowAsk(false)} className="text-[#2d2d2d] font-bold py-2.5 px-6 border border-[#e5e7eb] rounded-lg hover:bg-gray-50 text-[14px]">
                 Cancel
               </button>
            </div>
         </div>
       )}

       <div className="mb-12 bg-white rounded-xl border border-[#e5e7eb] px-6">
         {loading ? (
            <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 text-[#2d2d2d] animate-spin" /></div>
         ) : comments.length === 0 ? (
            <div className="py-16 text-center text-[#6b7280] font-medium">No questions yet. Be the first to ask!</div>
         ) : (
            <div className="flex flex-col">
               {comments.map(c => renderComment(c))}
            </div>
         )}
       </div>
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
      if (video?.nextVideoId) {
         router.push(`/subjects/${subjectId}/video/${video.nextVideoId}`);
      }
    } catch (e) {}
  }, [videoId, video, markVideoCompleted, router, subjectId]);

  const fontFam = "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif";

  let compiled = 0; let tot = 0;
  let totalSections = 0;
  if (tree) {
    totalSections = tree.sections.length;
    tree.sections.forEach(sec => {
      sec.videos.forEach((v: any) => { tot++; if (v.isCompleted) compiled++; });
    });
  }
  const pct = tot > 0 ? Math.round((compiled / tot) * 100) : 0;

  if (loading || !video) {
    return <div className="flex h-screen items-center justify-center bg-[#f9fafb]"><Loader2 className="w-10 h-10 text-[#2d2d2d] animate-spin" /></div>;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f9fafb] text-[#1c1d1f]" style={{ fontFamily: fontFam }}>
      
      {/* TOP NAV BAR (fixed) */}
      <div className="flex items-center justify-between px-6 z-50 shrink-0 bg-[#1c1d1f] text-white h-[56px] shadow-sm">
         <div className="flex items-center gap-4 min-w-0 pr-4">
            <Link href="/" className="font-extrabold text-[16px] shrink-0 border-r border-[#3e4143] pr-4 py-1.5 hover:text-gray-300 flex items-center gap-2">
               <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                 <PlayCircle className="w-4 h-4 text-white" />
               </div>
            </Link>
            <h1 className="font-medium text-[14px] truncate max-w-lg">{video.subjectTitle || 'Course'}</h1>
         </div>
         <div className="flex items-center gap-4 shrink-0">
            <button className="flex items-center gap-2 text-[14px] font-medium text-white/90 hover:text-white">
               <Trophy className="w-4 h-4 text-[#f69c08]" />
               <span className="hidden sm:inline">Your progress</span>
               <span className="font-bold">{pct}%</span>
            </button>
         </div>
      </div>

      {/* MAIN TWO-COLUMN */}
      <div className="flex flex-1 overflow-hidden relative w-full h-full">
         
         {/* LEFT SIDE */}
         <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden relative scroll-smooth pb-16 bg-[#f9fafb] h-full custom-scrollbar-hidden">
            
            {/* Video Player */}
            {video.locked ? (
               <div className="w-full aspect-video bg-black flex flex-col items-center justify-center text-white p-0 m-0">
                  <Lock className="w-12 h-12 text-[#6b7280] mb-4" />
                  <h2 className="text-xl font-bold mb-2">Content Locked</h2>
                  {video.previousVideoId && (
                     <Link href={`/subjects/${subjectId}/video/${video.previousVideoId}`} className="bg-[#2d2d2d] px-6 py-3 font-bold mt-4 hover:bg-black rounded-lg transition-colors text-[14px]">
                        Play Previous Lesson
                     </Link>
                  )}
               </div>
            ) : (
               <div className="w-full bg-black shrink-0 relative p-0 m-0 aspect-video">
                 <VideoPlayer
                   videoId={video.id}
                   youtubeUrl={video.youtubeUrl}
                   startPositionSeconds={progress?.lastPositionSeconds || 0}
                   onProgress={handleProgress}
                   onCompleted={handleCompleted}
                   className="w-full h-full"
                 />
               </div>
            )}

            {/* Sticky Tabs */}
            <div className="sticky top-0 bg-white border-b border-[#e5e7eb] z-20 px-8 w-full flex gap-8 shadow-sm">
               {['Overview', 'Q&A', 'Reviews'].map(tab => (
                 <button 
                   key={tab} 
                   onClick={() => setActiveTab(tab)}
                   className={`py-4 text-[14px] bg-white transition border-b-[3px] focus:outline-none   
                   ${activeTab === tab ? 'border-[#2d2d2d] font-bold text-[#1c1d1f]' : 'border-transparent text-[#6b7280] font-medium hover:text-[#1c1d1f]'}`}
                 >
                   {tab}
                 </button>
               ))}
            </div>

            {/* Tab Contents */}
            <div className="p-8 max-w-5xl mx-auto w-full">
               
               {activeTab === 'Overview' && (
                 <div className="animate-in fade-in space-y-8 bg-white p-8 rounded-xl border border-[#e5e7eb]">
                    <h2 className="text-3xl font-bold tracking-tight text-[#1c1d1f]">{video.title}</h2>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-6 pb-6 border-b border-[#e5e7eb]">
                       {/* Instructor */}
                       <div className="flex items-center gap-3">
                          <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${video.subjectId}`} className="w-10 h-10 rounded-full border border-[#e5e7eb] bg-[#f9fafb]" alt="avatar" />
                          <div className="flex flex-col">
                             <span className="text-[12px] text-[#6b7280] font-medium uppercase tracking-wider">Instructor</span>
                             <span className="font-bold text-[14px] text-[#1c1d1f]">Sarah Jenkins</span>
                          </div>
                       </div>
                       <div className="hidden sm:block w-px h-10 bg-[#e5e7eb]"></div>
                       {/* Stats */}
                       <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-[14px] text-[#6b7280] font-medium">
                          <div className="flex items-center gap-1.5"><Star className="w-4 h-4 text-[#f69c08] fill-current" /> <span className="text-[#1c1d1f] font-bold">4.8</span></div>
                          <div className="flex items-center gap-1.5"><Users className="w-4 h-4" /> 12,400+ students</div>
                          <div className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> 16.5 hours</div>
                          <div className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" /> {tot} lessons</div>
                       </div>
                    </div>
                    
                    <div>
                      <h3 className="font-bold text-[16px] mb-4 text-[#1c1d1f]">About this lesson</h3>
                      <div className="text-[15px] leading-relaxed whitespace-pre-wrap text-[#6b7280]">
                        {video.description || "In this comprehensive lesson, we break down core architectural capabilities and seamlessly integrate components together to ensure robust scalable structures."}
                      </div>
                      <button className="text-[#2d2d2d] font-bold hover:bg-gray-100 px-4 py-2 mt-4 rounded-lg flex items-center gap-1 border border-[#e5e7eb] text-[13px] transition-colors">
                        Show more <ChevronDown className="w-4 h-4 mt-0.5" />
                      </button>
                    </div>
                 </div>
               )}

               {activeTab === 'Q&A' && (
                 <QATab videoId={videoId} currentUser={user} />
               )}

               {activeTab === 'Reviews' && (
                 <CourseReviews subjectId={subjectId} currentUser={user} />
               )}

            </div>
         </div>

         {/* RIGHT SIDEBAR */}
         <div className="w-[400px] shrink-0 border-l border-[#e5e7eb] bg-white flex flex-col h-full z-10 lg:flex hidden">
            <div className="p-6 border-b border-[#e5e7eb] shrink-0 bg-white sticky top-0 z-20 shadow-sm flex flex-col gap-1">
               <h2 className="font-bold text-[16px] text-[#1c1d1f]">Course Content</h2>
               <div className="text-[13px] text-[#6b7280] font-medium">{totalSections} sections • {tot} lessons</div>
            </div>
            
            <div className="flex-1 pb-10 overflow-y-auto custom-scrollbar-hidden bg-[#f9fafb]">
               {tree ? tree.sections.map((section: any, idx: number) => {
                 let sComp = 0;
                 section.videos.forEach((v: any) => { if (v.isCompleted) sComp++; });
                 const exp = !!expandedSections[section.id];
                 
                 return (
                   <div key={section.id} className="border-b border-[#e5e7eb] bg-white">
                     <button onClick={() => toggleSection(section.id)} className="w-full text-left py-4 px-6 hover:bg-gray-50 flex justify-between items-center transition-colors">
                       <div className="pr-4 flex-1">
                         <h3 className="font-bold text-[14px] leading-snug mb-1 text-[#1c1d1f] hover:text-black">
                           {`Section ${idx + 1}: ${section.title}`}
                         </h3>
                         <div className="text-[12px] text-[#6b7280] font-medium">
                           {sComp} of {section.videos.length} completed | {section.videos.length * 10}min
                         </div>
                       </div>
                       <div className="text-[#6b7280] shrink-0">
                         {exp ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                       </div>
                     </button>
                     
                     {exp && (
                       <div className="bg-white flex flex-col">
                         {section.videos.map((v: any, vIdx: number) => {
                           const active = v.id === videoId;
                           return (
                             <Link 
                               key={v.id} 
                               href={v.locked && !v.isCompleted ? '#' : `/subjects/${subjectId}/video/${v.id}`} 
                               className={`flex gap-3 px-6 py-4 hover:bg-gray-50 transition-colors
                               ${active ? 'bg-[#eff6ff] pointer-events-none' : ''} 
                               ${v.locked && !v.isCompleted ? 'opacity-50 pointer-events-none' : ''}`}
                             >
                               {/* Checkbox Icon exactly as requested */}
                               <div className="shrink-0 pt-0.5">
                                 {v.isCompleted ? (
                                   <div className="w-5 h-5 rounded-full bg-[#16a34a] text-white flex items-center justify-center">
                                      <CheckCircle2 className="w-4 h-4 text-white fill-current" />
                                   </div>
                                 ) : (
                                   <div className="w-5 h-5 rounded-full border-2 border-[#6b7280] flex items-center justify-center"></div>
                                 )}
                               </div>
                               
                               <div className="flex-1 min-w-0 pr-4">
                                  <div className={`text-[14px] leading-snug break-words ${v.isCompleted && !active ? 'text-[#6b7280]' : 'text-[#1c1d1f]'} ${active ? 'font-bold text-[#1c1d1f]' : ''}`}>
                                    {vIdx + 1}. {v.title}
                                  </div>
                               </div>

                               <div className={`flex items-start gap-1 shrink-0 text-[12px] font-medium ${v.locked && !v.isCompleted ? 'text-[#6b7280] pt-0.5' : 'text-[#6b7280] pt-0.5'}`}>
                                  {v.locked && !v.isCompleted ? (
                                     <><Lock className="w-3.5 h-3.5" /> Locked</>
                                  ) : (
                                     <><PlayCircle className="w-3.5 h-3.5" /> 10:00</>
                                  )}
                               </div>
                             </Link>
                           )
                         })}
                       </div>
                     )}
                   </div>
                 )
               }) : (
                 <div className="p-8 text-center text-sm text-[#6b7280] font-medium flex gap-2 justify-center"><Loader2 className="w-4 h-4 animate-spin"/> Loading content...</div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
}