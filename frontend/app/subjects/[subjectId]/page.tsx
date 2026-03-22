'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { Loader2 } from 'lucide-react';
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
  const [myReview, setMyReview] = useState<any>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [page, setPage] = useState(1);

  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    async function fetchData() {
      try {
        const [dashRes, subRes, revRes, myRevRes] = await Promise.all([
          apiClient.get('/api/dashboard').catch(() => null),
          apiClient.get(`/api/subjects/${params.subjectId}`).catch(() => null),
          apiClient.get(`/api/subjects/${params.subjectId}/reviews`).catch(() => null),
          apiClient.get(`/api/subjects/${params.subjectId}/my-review`).catch(() => null),
        ]);

        if (!active) return;

        if (subRes && subRes.data) {
           setSubject(subRes.data);
        }

        if (dashRes && dashRes.data) {
           const enrolled = dashRes.data.enrolledCourses?.some((c: any) => c.subjectId === params.subjectId);
           setIsEnrolled(enrolled || false);
        }

        if (revRes && revRes.data) {
           setReviews(revRes.data.reviews || []);
           setSummary({
               averageRating: revRes.data.averageRating || 0,
               totalReviews: revRes.data.totalReviews || 0,
               ratingBreakdown: revRes.data.ratingBreakdown || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
           });
        }

        if (myRevRes && myRevRes.data) {
           setMyReview(myRevRes.data);
           setRating(myRevRes.data.rating);
           setReviewText(myRevRes.data.review || '');
        }

        setLoading(false);
      } catch (err: any) {
        if (active) setLoading(false);
      }
    }

    fetchData();
    return () => { active = false; };
  }, [params.subjectId]);

  const handleSubmitReview = async () => {
    if (rating === 0) return alert('Please select a rating');
    setIsSubmitting(true);
    try {
       if (myReview) {
          await apiClient.put(`/api/subjects/${params.subjectId}/reviews`, { rating, review: reviewText });
       } else {
          await apiClient.post(`/api/subjects/${params.subjectId}/reviews`, { rating, review: reviewText });
       }
       
       const [revRes, myRevRes] = await Promise.all([
          apiClient.get(`/api/subjects/${params.subjectId}/reviews`),
          apiClient.get(`/api/subjects/${params.subjectId}/my-review`)
       ]);

       if (revRes.data) {
         setReviews(revRes.data.reviews || []);
         setSummary({
             averageRating: revRes.data.averageRating || 0,
             totalReviews: revRes.data.totalReviews || 0,
             ratingBreakdown: revRes.data.ratingBreakdown || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
         });
         setPage(1);
       }
       if (myRevRes.data) {
         setMyReview(myRevRes.data);
         setRating(myRevRes.data.rating);
         setReviewText(myRevRes.data.review || '');
         setIsEditing(false);
       }
    } catch (err: any) {
       alert(err.response?.data?.error || 'Failed to submit review');
    }
    setIsSubmitting(false);
  };

  const handleDeleteReview = async () => {
    if (!window.confirm('Are you sure you want to delete your review?')) return;
    setIsSubmitting(true);
    try {
       await apiClient.delete(`/api/subjects/${params.subjectId}/reviews`);
       const revRes = await apiClient.get(`/api/subjects/${params.subjectId}/reviews`);
       if (revRes.data) {
         setReviews(revRes.data.reviews || []);
         setSummary({
             averageRating: revRes.data.averageRating || 0,
             totalReviews: revRes.data.totalReviews || 0,
             ratingBreakdown: revRes.data.ratingBreakdown || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
         });
         setPage(1);
       }
       setMyReview(null);
       setRating(0);
       setReviewText('');
       setIsEditing(false);
    } catch (err: any) {
       alert('Failed to delete review');
    }
    setIsSubmitting(false);
  };

  const loadMore = async () => {
    const p = page + 1;
    try {
      const res = await apiClient.get(`/api/subjects/${params.subjectId}/reviews?page=${p}`);
      if (res.data) {
        setReviews(prev => [...prev, ...(res.data.reviews || [])]);
        setPage(p);
      }
    } catch (err) {}
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  const total = summary?.totalReviews || 0;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-12 pb-32">
       {/* Hero Section */}
       <div className="border-b border-gray-200 pb-8">
         <h1 className="text-4xl font-extrabold text-gray-900 mb-4">{subject?.title || 'Course Overview'}</h1>
         <div className="flex items-center gap-4">
           {total > 0 ? (
             <>
               <span className="text-3xl font-bold text-gray-900">{Number(summary?.averageRating || 0).toFixed(1)}</span>
               <StarRating rating={summary?.averageRating || 0} size="md" interactive={false} />
               <span className="text-lg text-gray-500 font-medium">({total} reviews)</span>
             </>
           ) : (
             <span className="text-lg text-gray-500 font-medium">No reviews yet</span>
           )}
         </div>
       </div>

       <h2 className="text-3xl font-bold text-gray-800">Ratings & Reviews</h2>
       
       <div className="flex flex-col md:flex-row gap-8 items-start bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex flex-col items-center justify-center space-y-2 w-full md:w-1/3 py-4">
             <div className="text-6xl font-extrabold text-gray-900">{Number(summary?.averageRating || 0).toFixed(1)}</div>
             <StarRating rating={summary?.averageRating || 0} size="lg" interactive={false} />
             <p className="text-gray-500 font-medium">Based on {total} review{total !== 1 && 's'}</p>
          </div>
          <div className="flex-1 w-full space-y-3 lg:pr-8 py-2">
             {[5, 4, 3, 2, 1].map(stars => {
                const count = summary?.ratingBreakdown?.[stars] || 0;
                const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={stars} className="flex items-center gap-4 text-sm font-medium text-gray-600">
                     <div className="flex items-center gap-1 w-10 shrink-0 justify-end">
                       <span>{stars}</span>
                       <span className="text-amber-400">★</span>
                     </div>
                     <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                       <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${percent}%` }}></div>
                     </div>
                     <div className="w-10 text-right shrink-0">{percent}%</div>
                  </div>
                );
             })}
          </div>
       </div>

       <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
         {!isEnrolled ? (
            <div className="text-center py-8">
               <p className="text-xl">🎓</p>
               <p className="text-gray-600 font-medium text-lg mt-2">Enroll in this course to leave a review</p>
            </div>
         ) : myReview && !isEditing ? (
            <div>
               <div className="flex justify-between items-start mb-4">
                 <h2 className="text-xl font-bold text-gray-800">Your Review</h2>
                 <div className="space-x-4">
                   <button onClick={() => setIsEditing(true)} className="text-primary text-sm font-semibold hover:underline">Edit</button>
                   <button onClick={handleDeleteReview} className="text-red-500 text-sm font-semibold hover:underline">Delete</button>
                 </div>
               </div>
               <div className="flex items-center gap-3 mb-3">
                 <div className="flex items-center gap-2">
                   <StarRating rating={myReview.rating} size="md" interactive={false} />
                   <span className="font-bold text-gray-800">{myReview.rating}</span>
                 </div>
                 <span className="text-gray-400 text-sm">•</span>
                 <span className="text-gray-500 text-sm">{timeAgo(myReview.createdAt)}</span>
                 {myReview.isEdited && <span className="text-gray-400 text-sm">(edited)</span>}
               </div>
               {myReview.review && <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{myReview.review}</p>}
            </div>
         ) : (
            <>
               <h2 className="text-xl font-bold text-gray-800">{myReview ? 'Edit your review' : 'Rate this course'}</h2>
               <div className="space-y-5 mt-2">
                  <StarRating rating={rating} onRatingChange={setRating} size="lg" maxStars={5} interactive={true} />
                  <div>
                    <textarea 
                       value={reviewText}
                       onChange={e => setReviewText(e.target.value.substring(0, 1000))}
                       placeholder="Share your experience (optional)"
                       className="w-full text-base p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y min-h-[120px]"
                    />
                    <div className="text-right text-xs text-gray-400 mt-1 font-medium">
                       {reviewText.length}/1000
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button 
                       onClick={handleSubmitReview}
                       disabled={isSubmitting || rating === 0}
                       className="px-6 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                       {isSubmitting ? 'Saving...' : (myReview ? 'Update Review' : 'Submit Review')}
                    </button>
                    {myReview && (
                      <button onClick={() => { setIsEditing(false); setRating(myReview.rating); setReviewText(myReview.review || ''); }} className="px-4 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors">
                         Cancel
                      </button>
                    )}
                  </div>
               </div>
            </>
         )}
       </div>

       <div className="space-y-6">
         <h2 className="text-2xl font-bold text-gray-800">Reviews</h2>
         {reviews.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm border-dashed">
               <div className="text-5xl mb-4">⭐</div>
               <p className="text-gray-800 font-bold text-xl">No reviews yet</p>
               <p className="text-gray-500 mt-1">Be the first to review this course!</p>
            </div>
         ) : (
            <div className="space-y-4">
               {reviews.map(r => (
                  <div key={r.id} className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm space-y-4 transition-all">
                     <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                           <img src={r.user?.avatar || `https://api.dicebear.com/9.x/notionists/svg?seed=${r.user?.name}`} alt="" className="w-10 h-10 rounded-full border border-gray-200 bg-gray-50" />
                           <div>
                              <p className="font-bold text-gray-900 leading-tight">{r.user?.name}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                 <StarRating rating={r.rating} size="sm" interactive={false} />
                                 <span className="font-semibold text-gray-700">{r.rating}</span>
                                 <span>•</span>
                                 <span>{timeAgo(r.createdAt)}</span>
                                 {r.isEdited && <span className="text-gray-400">(edited)</span>}
                              </div>
                           </div>
                        </div>
                        {myReview?.id === r.id && (
                           <div className="flex gap-3 text-sm font-semibold">
                              <button onClick={() => { setIsEditing(true); window.scrollTo({top: 250, behavior: 'smooth'}); }} className="text-primary hover:text-primary/80 transition-colors">Edit</button>
                              <button onClick={handleDeleteReview} disabled={isSubmitting} className="text-red-500 hover:text-red-700 transition-colors">Delete</button>
                           </div>
                        )}
                     </div>
                     {r.review && (
                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{r.review}</p>
                     )}
                  </div>
               ))}
               {total > reviews.length && (
                  <div className="text-center pt-6">
                     <button onClick={loadMore} className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:shadow-sm transition-all">
                        Load more reviews
                     </button>
                  </div>
               )}
            </div>
         )}
       </div>
    </div>
  );
}