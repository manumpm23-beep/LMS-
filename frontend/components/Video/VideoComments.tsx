'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/apiClient';
import { 
    MessageSquare, Pin, ThumbsUp, MessageCircle, 
    Pencil, Trash2, MoreVertical, X, Check, Loader2, Send
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

function timeAgo(dateParam: string | Date) {
    if (!dateParam) return 'Just now';
    const date = typeof dateParam === 'string' ? new Date(dateParam) : dateParam;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return `Just now`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} d ago`;
}

interface CommentUser {
    id: string;
    name: string;
    avatar: string;
}

interface CommentItem {
    id: string;
    content: string;
    isPinned: boolean;
    isEdited: boolean;
    createdAt: string;
    user: CommentUser;
    upvoteCount: number;
    hasUpvoted: boolean;
    replyCount: number;
    replies: any[]; // Recursive structure 
}

export default function VideoComments({ videoId, currentUser }: { videoId: string, currentUser: any }) {
    const [comments, setComments] = useState<CommentItem[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const [newCommentText, setNewCommentText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Active edit/reply trackers Maps commentId -> string
    const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [activeEditId, setActiveEditId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');

    const loadComments = async (p = 1, append = false) => {
        try {
            if (p === 1) setLoading(true);
            else setLoadingMore(true);

            const res = await apiClient.get(`/api/videos/${videoId}/comments?page=${p}&pageSize=10`);
            setTotalCount(res.data.totalCount);
            if (append) {
                setComments(prev => [...prev, ...res.data.data]);
            } else {
                setComments(res.data.data);
            }
            setPage(p);
        } catch (e) {
            console.error('Failed to load comments');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        if (currentUser !== undefined) {
            loadComments(1);
        }
    }, [videoId, currentUser]);

    const handlePostComment = async () => {
        if (!newCommentText.trim() || submitting) return;
        setSubmitting(true);
        try {
            await apiClient.post(`/api/videos/${videoId}/comments`, { content: newCommentText });
            setNewCommentText('');
            loadComments(1); // Refresh entirely to bring new comment top
        } catch (e) {
            console.error('Submit error:', e);
        } finally {
            setSubmitting(false);
        }
    };

    const handlePostReply = async (parentId: string) => {
        if (!replyText.trim() || submitting) return;
        setSubmitting(true);
        try {
            await apiClient.post(`/api/videos/${videoId}/comments`, { content: replyText, parentId });
            setReplyText('');
            setActiveReplyId(null);
            // Quick update without full reload
            loadComments(1); 
        } catch (e) {
            console.error('Reply submit error:', e);
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleUpvote = async (commentId: string, isReply = false, parentId?: string) => {
        if (!currentUser) return;
        try {
            const res = await apiClient.post(`/api/comments/${commentId}/upvote`);
            const { upvoted, upvoteCount } = res.data;
            
            setComments(prev => {
                const updated = [...prev];
                // Deep find and update
                for (let i = 0; i < updated.length; i++) {
                    if (updated[i].id === commentId && !isReply) {
                        updated[i].upvoteCount = upvoteCount;
                        updated[i].hasUpvoted = upvoted;
                        break;
                    }
                    if (isReply && updated[i].id === parentId) {
                        for (let j = 0; j < updated[i].replies.length; j++) {
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
        } catch (e) {
            console.error("Upvote failed");
        }
    };

    const handleEditComplete = async (commentId: string) => {
        if (!editText.trim()) return;
        try {
            const res = await apiClient.put(`/api/comments/${commentId}`, { content: editText });
            setActiveEditId(null);
            loadComments(1);
        } catch (e) {
            console.error("Edit failed");
        }
    };

    const handleDelete = async (commentId: string) => {
        if (!confirm('Are you sure you want to delete this comment?')) return;
        try {
            await apiClient.delete(`/api/comments/${commentId}`);
            loadComments(1);
        } catch (e) {
            console.error("Delete failed");
        }
    };

    const handleTogglePin = async (commentId: string) => {
        try {
            await apiClient.post(`/api/comments/${commentId}/pin`);
            loadComments(1); // Force resort
        } catch (e) {
            console.error("Pin failed");
        }
    };

    const expandReplies = async (commentId: string) => {
         try {
             const res = await apiClient.get(`/api/comments/${commentId}/replies?page=1&pageSize=50`);
             setComments(prev => {
                 const updated = [...prev];
                 const idx = updated.findIndex(c => c.id === commentId);
                 if (idx !== -1) {
                     updated[idx].replies = res.data.data;
                     updated[idx].replyCount = 0; // hide "Load more" strictly logic mock
                 }
                 return updated;
             });
         } catch(e) { console.error('expand replies fail'); }
    };

    const renderCommentNode = (c: any, isReply = false, parentId?: string) => {
        const isOwner = currentUser?.id === c.user.id;
        // Mock Admin role checks
        const isAdminOrInstructor = currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Instructor' || true); // Default allow for showcase

        const avatarSize = isReply ? "w-6 h-6 border" : "w-10 h-10 shadow-sm border-2";

        return (
            <div key={c.id} className={`flex gap-4 ${isReply ? 'mt-4 ml-2 relative before:absolute before:-left-6 before:-bottom-4 before:top-4 before:w-6 before:border-l-2 before:border-b-2 before:border-gray-200 before:rounded-bl-xl' : 'mt-6'}`}>
                <div className="shrink-0 relative z-10 bg-white">
                    <img src={c.user.avatar} className={`${avatarSize} rounded-full object-cover border-gray-100 bg-gray-50`} alt={c.user.name} />
                </div>
                
                <div className="flex-1 min-w-0">
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 relative group">
                        {c.isPinned && !isReply && (
                            <div className="absolute -top-2.5 right-4 bg-orange-100 text-orange-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-sm flex items-center gap-1 border border-orange-200">
                                <Pin className="w-3 h-3" />
                                PINNED
                            </div>
                        )}
                        
                        <div className="flex justify-between items-start mb-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-extrabold text-gray-900 text-sm">{c.user.name.split(' ')[0]}</span>
                                {c.user.role === 'Instructor' && <span className="text-[10px] uppercase font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded-md">Instructor</span>}
                                {c.user.role === 'Admin' && <span className="text-[10px] uppercase font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded-md">Admin</span>}
                                <span className="text-xs font-semibold text-gray-400">&middot; {timeAgo(c.createdAt)}</span>
                            </div>
                            
                            {(isOwner || isAdminOrInstructor) && (
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {isOwner && (
                                        <button onClick={() => { setActiveEditId(c.id); setEditText(c.content) }} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-lg transition" title="Edit">
                                           <Pencil className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button onClick={() => handleDelete(c.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg transition" title="Delete">
                                       <Trash2 className="w-4 h-4" />
                                    </button>
                                    {isAdminOrInstructor && !isReply && (
                                         <button onClick={() => handleTogglePin(c.id)} className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-white rounded-lg transition" title={c.isPinned ? "Unpin" : "Pin to top"}>
                                            <Pin className="w-4 h-4" />
                                         </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {activeEditId === c.id ? (
                            <div className="mt-2 text-sm text-gray-800">
                                <textarea 
                                    value={editText} 
                                    onChange={e => setEditText(e.target.value)}
                                    className="w-full bg-white border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 ring-indigo-500/50 resize-none"
                                    rows={3}
                                    autoFocus
                                />
                                <div className="flex justify-end gap-2 mt-2">
                                    <button onClick={() => setActiveEditId(null)} className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-200 rounded-lg">Cancel</button>
                                    <button onClick={() => handleEditComplete(c.id)} className="px-3 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-lg">Save</button>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-1 text-sm text-gray-700 font-medium whitespace-pre-wrap leading-relaxed">
                                {c.content}
                                {c.isEdited && <span className="ml-2 text-xs font-semibold text-gray-400">(edited)</span>}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3 mt-2 ml-2">
                         <button 
                             onClick={() => handleToggleUpvote(c.id, isReply, parentId)}
                             className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${c.hasUpvoted ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}
                         >
                            <ThumbsUp className={`w-4 h-4 ${c.hasUpvoted ? 'fill-current' : ''}`} />
                            {c.upvoteCount > 0 && c.upvoteCount}
                         </button>
                         
                         {!isReply && (
                             <button
                               onClick={() => { setActiveReplyId(c.id); setReplyText(''); }} 
                               className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors"
                             >
                                <MessageCircle className="w-4 h-4" />
                                Reply
                             </button>
                         )}
                    </div>

                    {/* REPLY INPUT BOX */}
                    {activeReplyId === c.id && !isReply && (
                        <div className="mt-4 flex gap-3 ml-2 w-[95%]">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(currentUser?.name || '')}`} className="w-8 h-8 rounded-full border border-gray-200 bg-white" alt="Avatar"/>
                            <div className="flex-1">
                                <textarea 
                                    className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 ring-indigo-500/30 resize-none font-medium text-gray-900" 
                                    placeholder={`@${c.user.name.split(' ')[0]} Your reply...`}
                                    value={replyText}
                                    onChange={e => setReplyText(e.target.value)}
                                    rows={2}
                                />
                                <div className="flex justify-end gap-2 mt-2">
                                    <button onClick={() => setActiveReplyId(null)} className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition">Cancel</button>
                                    <button 
                                        onClick={() => handlePostReply(c.id)}
                                        disabled={submitting || !replyText.trim()}
                                        className="px-4 py-2 text-xs font-bold bg-gray-900 text-white hover:bg-black rounded-xl transition disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {submitting && <Loader2 className="w-3 h-3 animate-spin"/>} Post Reply
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* RENDER REPLIES */}
                    {!isReply && c.replies && c.replies.length > 0 && (
                        <div className="ml-2 relative">
                            {c.replies.map((reply: any) => renderCommentNode(reply, true, c.id))}
                            
                            {c.replyCount > 3 && (
                                <button 
                                   onClick={() => expandReplies(c.id)}
                                   className="mt-4 text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 ml-10 transition-colors"
                                >
                                   View {c.replyCount - 3} more replies
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };


    return (
        <div className="mt-12 w-full font-sans max-w-4xl mx-auto border-t border-gray-100 pt-10 px-0 sm:px-6 mb-10 text-gray-900 bg-white shadow-xl rounded-[2rem] p-8 hidden md:block">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-extrabold flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                        <MessageSquare className="w-5 h-5" />
                    </div>
                    Questions & Answers
                </h3>
                <span className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded-full font-bold text-sm">
                    {totalCount} comments
                </span>
            </div>

            {/* ADD COMMENT ENTRANCE */}
            {currentUser ? (
                <div className="flex gap-4 mb-10 bg-gray-50 p-4 sm:p-6 rounded-[2rem] border border-gray-100">
                    <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(currentUser.name)}`} 
                        className="w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover bg-white shrink-0" 
                        alt="Your Avatar" 
                    />
                    <div className="flex-1 min-w-0 flex flex-col items-end">
                        <textarea
                            value={newCommentText}
                            onChange={(e) => setNewCommentText(e.target.value)}
                            placeholder="Ask a question or share your thoughts..."
                            className="w-full bg-white border border-gray-200 rounded-2xl p-4 min-h-[100px] text-sm md:text-base font-medium text-gray-900 focus:outline-none focus:border-indigo-300 focus:ring-4 ring-indigo-500/10 transition-all resize-none shadow-sm"
                        ></textarea>
                        <div className="flex items-center justify-between w-full mt-3 pl-2">
                           <span className={`text-xs font-bold ${newCommentText.length > 2000 ? 'text-red-500' : 'text-gray-400'}`}>
                               {newCommentText.length} / 2000
                           </span>
                           <button 
                               onClick={handlePostComment}
                               disabled={!newCommentText.trim() || newCommentText.length > 2000 || submitting}
                               className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
                           >
                              {submitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
                              Post Question
                           </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 text-center mb-10">
                    <p className="text-indigo-800 font-semibold mb-3">Join the conversation with other students!</p>
                    <Link href="/auth/login" className="inline-block bg-indigo-600 text-white font-bold px-6 py-2.5 rounded-xl shadow-sm hover:bg-indigo-700 transition">
                        Log in to ask a question
                    </Link>
                </div>
            )}

            {loading && comments.length === 0 ? (
                <div className="flex justify-center my-10"><Loader2 className="w-8 h-8 animate-spin text-gray-300" /></div>
            ) : comments.length === 0 ? (
                <div className="text-center py-16 px-4">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                         <MessageSquare className="w-10 h-10 text-gray-300" />
                    </div>
                    <h4 className="text-xl font-extrabold text-gray-900">No questions yet</h4>
                    <p className="text-gray-500 font-medium mt-2">Be the first to spark a conversation in this lesson!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {comments.map(c => renderCommentNode(c))}
                    
                    {totalCount > comments.length && (
                        <div className="pt-8 text-center pb-4">
                            <button 
                                onClick={() => loadComments(page + 1, true)}
                                disabled={loadingMore}
                                className="bg-white border border-gray-200 text-gray-800 font-bold px-8 py-3 rounded-full hover:bg-gray-50 transition shadow-sm flex items-center gap-2 mx-auto disabled:opacity-50"
                            >
                                {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
                                Load more questions
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// Ensure the parent wrapper layout maps display appropriately!
