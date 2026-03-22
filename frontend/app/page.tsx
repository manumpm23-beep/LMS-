'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { Search, Star, PlayCircle, Check, Filter } from 'lucide-react';
import { StarRating } from '@/components/common/StarRating';

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const initialQ = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || 'All';
  const initialSort = searchParams.get('sort') || 'Most Relevant';

  const [searchQuery, setSearchQuery] = useState(initialQ);
  const [searchInput, setSearchInput] = useState(initialQ);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState(initialSort);

  const categories = ['Development', 'Design', 'IT & Software', 'Personal Development', 'Business'];
  
  // Dummy filters for UI
  const [selectedRatings, setSelectedRatings] = useState<string[]>([]);
  const [selectedDurations, setSelectedDurations] = useState<string[]>([]);
  const [selectedCategoriesFilter, setSelectedCategoriesFilter] = useState<string[]>(
    initialCategory !== 'All' ? [initialCategory] : []
  );

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery);
    if (selectedCategory !== 'All') params.set('category', selectedCategory);
    if (sortBy !== 'Most Relevant') params.set('sort', sortBy);
    const newUrl = `/?${params.toString()}`;
    // Only push if the URL actually changes to avoid infinite loop
    if (window.location.search !== `?${params.toString()}`) {
      router.push(newUrl, { scroll: false });
    }
  }, [searchQuery, selectedCategory, sortBy, router]);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      let url = '/api/subjects?pageSize=20&page=1';
      if (searchQuery.trim() !== '') url += `&q=${encodeURIComponent(searchQuery)}`;
      if (selectedCategory !== 'All') url += `&category=${encodeURIComponent(selectedCategory)}`;
      
      // Translate UI sort to API sort if needed
      let apiSort = 'newest';
      if (sortBy === 'Highest Rated') apiSort = 'popular'; // fallback mapping
      if (sortBy === 'Newest') apiSort = 'newest';
      url += `&sort=${encodeURIComponent(apiSort)}`;

      apiClient.get(url)
        .then(res => {
          setSubjects(res.data.data || []);
          setTotalCount(res.data.totalCount || 0);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, selectedCategory, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
  };

  const udemyFont = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

  // Check if course is "New" (created in last 30 days)
  const isNew = (dateString: string) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const diffTime = Math.abs(new Date().getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays <= 30;
  };

  return (
    <div className="min-h-screen bg-white text-[#1c1d1f] pb-24" style={{ fontFamily: udemyFont }}>
      
      {/* TOP SEARCH BAR (full width, dark) */}
      <div className="bg-[#1c1d1f] py-4 px-6 md:px-8 w-full shadow-md z-50 relative flex flex-col md:flex-row items-center gap-6">
         <div className="text-white font-extrabold text-2xl tracking-tight shrink-0">
            <Link href="/">KODNEST</Link>
         </div>
         <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
            <button type="submit" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#a435f0]">
               <Search className="w-5 h-5" />
            </button>
            <input 
              type="text" 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search for anything"
              className="w-full bg-white text-[#1c1d1f] rounded-full py-3.5 pl-12 pr-6 focus:outline-none focus:ring-0 text-[15px] border border-[#1c1d1f]"
            />
         </form>
         <div className="hidden md:flex items-center gap-4 text-white text-[15px]">
            <span className="hover:text-gray-300 cursor-pointer">Udemy Business</span>
            <span className="hover:text-gray-300 cursor-pointer">Teach on Udemy</span>
            <Link href="/auth/login" className="px-4 py-2 font-bold bg-white text-[#1c1d1f] border border-white hover:bg-gray-200 transition">Log in</Link>
            <Link href="/auth/register" className="px-4 py-2 font-bold bg-[#1c1d1f] text-white border border-white hover:bg-gray-800 transition">Sign up</Link>
         </div>
      </div>

      {/* Categories nav below header */}
      <div className="hidden md:flex justify-center items-center gap-8 py-3 bg-white border-b border-[#d1d7dc] shadow-sm text-sm text-[#1c1d1f]">
         {categories.map(cat => (
           <button 
             key={cat}
             onClick={() => setSelectedCategory(cat === selectedCategory ? 'All' : cat)}
             className={`hover:text-[#5624d0] transition-colors ${selectedCategory === cat ? 'text-[#5624d0] font-bold' : ''}`}
           >
             {cat}
           </button>
         ))}
      </div>

      <main className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8 mt-8">
         <h1 className="text-3xl font-bold mb-6">
            {searchQuery ? `${totalCount} results for "${searchQuery}"` : 'All Courses'}
         </h1>

         <div className="flex flex-col lg:flex-row gap-8">
            
            {/* CATEGORY FILTER (left sidebar on desktop) */}
            <div className="w-full lg:w-[260px] shrink-0 hidden md:block space-y-8">
               
               <div className="flex items-center gap-2 mb-2 border-b border-[#d1d7dc] pb-4">
                  <Filter className="w-5 h-5" />
                  <h2 className="text-xl font-bold">Filter</h2>
               </div>

               {/* Ratings Filter */}
               <div className="border-t border-[#d1d7dc] pt-5 border-dashed">
                  <h3 className="font-bold text-lg mb-3">Ratings</h3>
                  <div className="space-y-3">
                     {[
                       { val: '4.5', label: '4.5 & up' }, 
                       { val: '4.0', label: '4.0 & up' }, 
                       { val: '3.5', label: '3.5 & up' }
                     ].map(r => (
                       <label key={r.val} className="flex items-center gap-3 cursor-pointer group">
                         <input type="radio" name="rating" className="w-4 h-4 text-[#1c1d1f] bg-white border-gray-400 focus:ring-[#1c1d1f] cursor-pointer" />
                         <div className="flex items-center gap-1 text-[#b4690e]">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-4 h-4 ${i < Math.floor(Number(r.val)) ? 'fill-current' : i === Math.floor(Number(r.val)) ? 'fill-current opacity-50' : 'opacity-20'}`} />
                            ))}
                            <span className="text-[#1c1d1f] text-sm ml-1 group-hover:text-black">{r.label}</span>
                         </div>
                       </label>
                     ))}
                  </div>
               </div>

               {/* Duration Filter */}
               <div className="border-t border-[#d1d7dc] pt-5 border-dashed">
                  <h3 className="font-bold text-lg mb-3">Video Duration</h3>
                  <div className="space-y-3 text-[15px]">
                     {['0-1 Hour', '1-3 Hours', '3-6 Hours', '6-17 Hours', '17+ Hours'].map(d => (
                       <label key={d} className="flex items-center gap-3 cursor-pointer">
                         <input type="checkbox" className="w-4 h-4 text-[#1c1d1f] bg-white border-gray-400 rounded-sm focus:ring-[#1c1d1f] cursor-pointer" />
                         <span className="hover:text-black">{d}</span>
                       </label>
                     ))}
                  </div>
               </div>

               {/* Category Filter */}
               <div className="border-t border-[#d1d7dc] pt-5 border-dashed">
                  <h3 className="font-bold text-lg mb-3">Category</h3>
                  <div className="space-y-3 text-[15px]">
                     {categories.map(c => (
                       <label key={c} className="flex items-center gap-3 cursor-pointer">
                         <input 
                           type="checkbox" 
                           checked={selectedCategoriesFilter.includes(c)}
                           onChange={(e) => {
                             if(e.target.checked) setSelectedCategoriesFilter([...selectedCategoriesFilter, c]);
                             else setSelectedCategoriesFilter(selectedCategoriesFilter.filter(x => x !== c));
                           }}
                           className="w-4 h-4 text-[#1c1d1f] bg-white border-gray-400 rounded-sm focus:ring-[#1c1d1f] cursor-pointer" 
                         />
                         <span className="hover:text-black">{c}</span>
                       </label>
                     ))}
                  </div>
               </div>

            </div>

            {/* Main Results Area */}
            <div className="flex-1">
               
               {/* RESULTS HEADER (Sort dropdown) */}
               <div className="flex justify-start mb-6 -mt-2">
                  <div className="relative border border-[#1c1d1f] inline-flex hover:bg-gray-50">
                    <span className="absolute -top-2.5 left-2 bg-white px-1 text-xs font-bold text-gray-700">Sort by</span>
                    <select 
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="appearance-none bg-transparent py-3 pl-4 pr-10 text-[15px] font-bold focus:outline-none cursor-pointer"
                    >
                      <option>Most Relevant</option>
                      <option>Most Reviewed</option>
                      <option>Highest Rated</option>
                      <option>Newest</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#1c1d1f]">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
               </div>

               {loading ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[1,2,3,4,5,6].map(i => (
                       <div key={i} className="animate-pulse bg-gray-100 h-80 rounded-sm"></div>
                    ))}
                 </div>
               ) : subjects.length === 0 ? (
                 <div className="py-20 text-center">
                    <h2 className="text-2xl font-bold mb-2">Sorry, we couldn't find any results for "{searchQuery}"</h2>
                    <p className="text-lg text-gray-600">Try adjusting your search or filter to find what you're looking for.</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-10 relative">
                    {subjects.map((sub, idx) => {
                       const isBestseller = (sub.totalReviews || 0) > 100;
                       const courseIsNew = isNew(sub.createdAt);
                       const lecturesCount = 42; // mock as required
                       const durationStr = "12.5 total hours";

                       // Positioning the hover popup card
                       // if in rightmost column of xl grid, show on left, else right
                       // if in rightmost column of md grid, show on left...
                       const popupPositionClass = "xl:left-full xl:right-auto right-auto top-0 ml-4 hidden lg:group-hover:block";
                       const popupAltPositionClass = "xl:right-full xl:left-auto right-auto top-0 mr-4 hidden lg:group-hover:block";
                       
                       const useAltPosition = (idx + 1) % 3 === 0;

                       return (
                         <div key={sub.id} className="relative group perspective-1000">
                           {/* COURSE CARD */}
                           <Link href={`/subjects/${sub.id}`} className="block h-full group-hover:-translate-y-1 transition-transform duration-200 ease-out z-10 relative bg-white">
                             
                             {/* Thumbnail Image */}
                             <div className="w-full aspect-video bg-gray-200 overflow-hidden border border-gray-100 relative">
                               {sub.thumbnailUrl ? (
                                 <img src={sub.thumbnailUrl} alt={sub.title} className="w-full h-full object-cover" />
                               ) : (
                                 <div className="w-full h-full bg-[#1c1d1f] flex items-center justify-center text-white/20"><PlayCircle className="w-12 h-12" /></div>
                               )}
                               <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors"></div>
                             </div>

                             <div className="py-2">
                               {/* Title */}
                               <h3 className="font-bold text-[15px] leading-tight mb-1 text-[#1c1d1f] line-clamp-2">
                                 {sub.title}
                               </h3>
                               
                               {/* Instructor */}
                               <p className="text-xs text-gray-600 mb-1 line-clamp-1">
                                 {sub.author?.name || 'Instructor Name'}
                               </p>

                               {/* Rating Row */}
                               <div className="flex items-center gap-1.5 mb-1.5">
                                 <span className="font-bold text-[#b4690e] text-sm">
                                   {Number(sub.averageRating || 0).toFixed(1)}
                                 </span>
                                 <div className="flex text-[#b4690e] pb-[2px]">
                                    {[...Array(5)].map((_, i) => (
                                      <Star key={i} className={`w-3.5 h-3.5 pt-[1px] ${i < Math.floor(sub.averageRating || 0) ? 'fill-current' : 'opacity-30'}`} />
                                    ))}
                                 </div>
                                 <span className="text-xs text-gray-600">
                                   ({sub.totalReviews ? sub.totalReviews.toLocaleString() : 0})
                                 </span>
                               </div>

                               {/* Duration details */}
                               <div className="text-xs text-gray-600 mb-2">
                                 {durationStr} • {lecturesCount} lectures • All Levels
                               </div>
                               
                               {/* Badges */}
                               <div className="flex flex-wrap gap-2 text-xs font-bold">
                                 {isBestseller && (
                                   <span className="bg-[#eceb98] text-[#3d3c0a] px-2 py-1">
                                     Bestseller
                                   </span>
                                 )}
                                 {courseIsNew && !isBestseller && (
                                   <span className="bg-[#b3ecc6] text-[#1f492f] px-2 py-1">
                                     New
                                   </span>
                                 )}
                               </div>
                             </div>
                           </Link>

                           {/* HOVER EXPANDED POPUP (absolute to right or left) */}
                           <div className={`absolute z-50 w-[340px] bg-white border border-gray-200 shadow-xl p-6 opacity-0 group-hover:opacity-100 transition-opacity delay-300 pointer-events-none lg:pointer-events-auto ${useAltPosition ? popupAltPositionClass : popupPositionClass}`}>
                              
                              <h2 className="font-bold text-[19px] leading-tight mb-2 text-[#1c1d1f]">
                                {sub.title}
                              </h2>
                              
                              <div className="text-xs text-gray-500 mb-2">
                                Updated <span className="font-bold text-green-700">10/2025</span>
                              </div>
                              
                              <div className="text-xs text-gray-600 mb-3">
                                {durationStr} • {lecturesCount} lectures • All Levels
                              </div>

                              <p className="text-[13px] text-gray-800 leading-relaxed mb-4 line-clamp-3">
                                {sub.description || 'Master this course entirely from scratch and build real-world comprehensive projects natively step by step.'}
                              </p>

                              <ul className="space-y-2 mb-6">
                                {[
                                  "Build 10 real-world responsive projects",
                                  "Master concepts deeply from ground up",
                                  "Learn modern industry practices easily"
                                ].map((pt, i) => (
                                  <li key={i} className="flex gap-3 text-[13px] text-gray-800">
                                     <Check className="w-4 h-4 shrink-0 text-gray-500" />
                                     <span>{pt}</span>
                                  </li>
                                ))}
                              </ul>

                              <div className="flex gap-2">
                                <Link 
                                  href={`/subjects/${sub.id}`} 
                                  className="flex-1 bg-[#a435f0] hover:bg-[#8710d8] text-white font-bold text-center py-3 text-[15px] transition-colors"
                                >
                                  Enroll Now
                                </Link>
                              </div>
                           </div>

                         </div>
                       )
                    })}
                 </div>
               )}

            </div>
         </div>
      </main>

    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <HomePageContent />
    </Suspense>
  );
}