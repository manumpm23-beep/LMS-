'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { Star, Loader2, ThumbsUp, ThumbsDown, MoreVertical } from 'lucide-react';

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
  return `${diffInDays} days ago`;
}

// Function to generate consistent background color based on name
function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    'bg-[#b4690e]', 'bg-[#5624d0]', 'bg-[#1c1d1f]', 'bg-[#2d9059]',
    'bg-[#b32d2e]', 'bg-[#0f4d8a]', 'bg-[#8a156e]', 'bg-[#d07b24]'
  ];
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

function getInitials(name: string) {
  if (!name) return 'U';
  const parts = name.split(' ');
  if (parts.length > 1) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export default function CourseReviews({ subjectId }: { subjectId: string }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [myReview, setMyReview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    async function fetchReviews() {
      try {
        const [revRes, myRevRes] = await Promise.all([
          apiClient.get(`/api/subjects/${subjectId}/reviews`).catch(() => null),
          apiClient.get(`/api/subjects/${subjectId}/my-review`).catch(() => null),
        ]);
        if (!active) return;
        
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
      } catch (err) {} finally {
        if (active) setLoading(false);
      }
    }
    fetchReviews();
    return () => { active = false; };
  }, [subjectId]);

  const handleSubmitReview = async () => {
    if (rating === 0) return alert('Please select a rating');
    setIsSubmitting(true);
    try {
      if (myReview) {
        await apiClient.put(`/api/subjects/${subjectId}/reviews`, { rating, review: reviewText });
      } else {
        await apiClient.post(`/api/subjects/${subjectId}/reviews`, { rating, review: reviewText });
      }
      
      const [revRes, myRevRes] = await Promise.all([
        apiClient.get(`/api/subjects/${subjectId}/reviews`),
        apiClient.get(`/api/subjects/${subjectId}/my-review`)
      ]);
      setReviews(revRes.data.reviews || []);
      setSummary({
          averageRating: revRes.data.averageRating || 0,
          totalReviews: revRes.data.totalReviews || 0,
          ratingBreakdown: revRes.data.ratingBreakdown || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      });
      setMyReview(myRevRes.data);
      setRating(myRevRes.data.rating);
      setReviewText(myRevRes.data.review || '');
      setIsEditing(false);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to submit review');
    }
    setIsSubmitting(false);
  };

  const udemyFont = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  const avgRating = summary?.averageRating || 0;
  const totalReviews = summary?.totalReviews || 0;

  if (loading) {
    return <div className="py-10 text-center"><Loader2 className="w-8 h-8 text-[#a435f0] animate-spin mx-auto" /></div>;
  }

  return (
    <div className="animate-in fade-in" style={{ fontFamily: udemyFont }}>
      <h2 className="text-2xl font-bold mb-6 text-[#1c1d1f]">Student feedback</h2>
      
      <div className="flex flex-col md:flex-row gap-8 mb-10 items-start">
         
         {/* LEFT: Large rating number */}
         <div className="flex flex-col items-center justify-center text-center mt-2">
            <div className="text-[64px] font-extrabold text-[#f69c08] tracking-tight leading-none mb-1">
              {Number(avgRating).toFixed(1)}
            </div>
            <div className="flex text-[#f69c08] mb-1">
               {[...Array(5)].map((_, i) => (
                 <Star key={i} className={`w-5 h-5 ${i < Math.floor(avgRating) ? 'fill-current' : i === Math.floor(avgRating) && avgRating % 1 > 0 ? 'fill-current opacity-50' : 'opacity-20'}`} />
               ))}
            </div>
            <div className="text-[#f69c08] font-bold text-[15px]">Course Rating</div>
         </div>

         {/* RIGHT: Rating breakdown bars */}
         <div className="flex-1 flex flex-col gap-2 w-full pt-1 max-w-[450px]">
            {[5, 4, 3, 2, 1].map(stars => {
              const count = summary?.ratingBreakdown?.[stars] || 0;
              const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
              
              return (
                <div key={stars} className="flex items-center gap-3 text-[13px]">
                   <div className="w-full bg-[#d1d7dc] h-2 relative border border-transparent">
                      <div className="absolute top-0 left-0 h-full bg-[#6a6f73]" style={{ width: `${pct}%` }}></div>
                   </div>
                   <div className="flex gap-[2px] w-[90px] shrink-0 text-[#f69c08] justify-start items-center">
                      {[...Array(5)].map((_, i) => (
                         <Star key={i} className={`w-[13px] h-[13px] ${i < stars ? 'fill-current' : 'opacity-0'}`} />
                      ))}
                   </div>
                   <div className="w-10 shrink-0 text-[#5624d0] underline font-medium cursor-pointer flex justify-end">
                     {pct}%
                   </div>
                </div>
              )
            })}
         </div>
      </div>

      {/* WRITE REVIEW FORM */}
      <div className="mb-10 p-6 bg-[#f7f9fa] border border-[#d1d7dc]">
        <h3 className="font-bold text-lg mb-4 text-[#1c1d1f]">{myReview && !isEditing ? 'Your Review' : 'Write a Review'}</h3>
        
        {myReview && !isEditing ? (
           <div>
              <div className="flex items-center gap-2 mb-3">
                 <div className="flex text-[#f69c08]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < myReview.rating ? 'fill-current' : 'opacity-30'}`} />
                    ))}
                 </div>
                 <span className="text-gray-500 text-sm">{timeAgo(myReview.createdAt)}</span>
              </div>
              <p className="text-[#1c1d1f] text-[15px] mb-4 whitespace-pre-wrap">{myReview.review}</p>
              <button onClick={() => setIsEditing(true)} className="text-[#a435f0] font-bold underline">Edit Review</button>
           </div>
        ) : (
           <div className="space-y-4">
              <div className="flex text-[#f69c08] gap-1 cursor-pointer">
                 {[1,2,3,4,5].map(star => (
                   <Star 
                     key={star} 
                     onClick={() => setRating(star)} 
                     className={`w-8 h-8 ${star <= rating ? 'fill-current' : 'opacity-30'} hover:opacity-80 transition-opacity`} 
                   />
                 ))}
              </div>
              <textarea 
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                placeholder="Share your experience with this course..."
                className="w-full bg-white border border-[#1c1d1f] p-4 text-[15px] focus:outline-none min-h-[120px]"
              />
              <div className="flex gap-4">
                 <button 
                   onClick={handleSubmitReview}
                   disabled={rating === 0 || isSubmitting}
                   className="bg-[#a435f0] hover:bg-[#8710d8] text-white font-bold py-3 px-6 transition disabled:opacity-50"
                 >
                   {isSubmitting ? 'Submitting...' : myReview ? 'Update Review' : 'Submit Review'}
                 </button>
                 {myReview && (
                   <button onClick={() => { setIsEditing(false); setRating(myReview.rating); setReviewText(myReview.review || ''); }} className="font-bold border border-[#1c1d1f] py-3 px-6 hover:bg-gray-100 transition">
                     Cancel
                   </button>
                 )}
              </div>
           </div>
        )}
      </div>

      <h3 className="text-xl font-bold mb-6 text-[#1c1d1f]">Reviews</h3>
      
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
         <div className="relative flex-1">
           <input type="text" placeholder="Search reviews" className="w-full border border-[#1c1d1f] p-3 pl-4 pr-12 text-[15px] focus:outline-none placeholder-gray-600 font-medium" />
           <button className="bg-[#1c1d1f] text-white absolute right-0 top-0 h-full w-12 flex items-center justify-center hover:bg-gray-800">
              <Search className="w-5 h-5 mx-auto" />
           </button>
         </div>
         <select className="border border-[#1c1d1f] p-3 text-[15px] font-bold bg-white focus:outline-none cursor-pointer text-[#1c1d1f] md:w-56 shrink-0">
           <option>All ratings</option>
           <option>Five stars</option>
           <option>Four stars</option>
           <option>Three stars</option>
         </select>
      </div>

      <div className="space-y-6">
         {reviews.map(r => (
           <div key={r.id} className="border-t border-[#d1d7dc] pt-6 flex gap-6">
              <div className={`w-12 h-12 text-white rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${stringToColor(r.user?.name || '')}`}>
                {getInitials(r.user?.name)}
              </div>
              <div className="flex-1">
                 <p className="font-bold text-[15px] mb-1 text-[#1c1d1f]">{r.user?.name}</p>
                 <div className="flex items-center gap-2 mb-4">
                    <div className="flex text-[#f69c08]">
                       {[1,2,3,4,5].map(x => <Star key={x} className={`w-3.5 h-3.5 ${x <= r.rating ? 'fill-current' : 'opacity-30'}`} />)}
                    </div>
                    <span className="text-[#6a6f73] text-[13px] font-bold">{timeAgo(r.createdAt)}</span>
                 </div>
                 <p className="text-[15px] text-[#1c1d1f] mb-4 whitespace-pre-wrap leading-relaxed">
                   {r.review}
                 </p>
                 <div className="flex items-center gap-4">
                    <span className="text-[#6a6f73] text-[13px]">Was this review helpful?</span>
                    <button className="p-2 border border-[#1c1d1f] rounded-full hover:bg-gray-100 flex items-center justify-center w-10 h-10 transition">
                      <ThumbsUp className="w-4 h-4 text-[#1c1d1f]" />
                    </button>
                    <button className="p-2 border border-[#1c1d1f] rounded-full hover:bg-gray-100 flex items-center justify-center w-10 h-10 transition">
                      <ThumbsDown className="w-4 h-4 text-[#1c1d1f]" />
                    </button>
                    <button className="text-[#6a6f73] underline text-[13px] font-bold ml-2 hover:text-[#1c1d1f] transition">Report</button>
                 </div>
              </div>
           </div>
         ))}
         {reviews.length === 0 && (
           <div className="text-gray-500 py-4 font-medium">No reviews yet for this course.</div>
         )}
      </div>
    </div>
  );
}

// Ensure the local Search symbol is explicitly brought in for purely frontend context.
function Search(props: any) {
  return (
    <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
      <path fillRule="evenodd" d="M10.5 4a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM2 10.5a8.5 8.5 0 1115.176 5.262l4.654 4.653a1 1 0 01-1.414 1.415l-4.654-4.654A8.5 8.5 0 012 10.5z" clipRule="evenodd" />
    </svg>
  );
}
