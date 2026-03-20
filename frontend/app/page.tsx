'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/lib/apiClient';
import { BookOpen, ArrowRight, UserCircle, Rocket } from 'lucide-react';

export default function HomePage() {
  const { isAuthenticated } = useAuthStore();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      apiClient.get('/api/subjects?pageSize=100')
        .then(res => {
          setSubjects(res.data.data || []);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center font-sans tracking-tight">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center transform rotate-3 shadow-2xl shadow-blue-500/20">
              <Rocket className="w-10 h-10 text-white -rotate-3" />
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tighter mb-8 leading-tight">
            Master Your Future <br className="hidden md:block" /> With <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Premium Learning</span>
          </h1>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto mb-12 leading-relaxed">
            Unlock exclusive courses, interactive video tracking, and completely master your progress through our tightly engineered global syllabus.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <Link
              href="/auth/register"
              className="w-full sm:w-auto px-8 py-4 bg-primary text-white text-lg font-bold rounded-2xl shadow-xl shadow-blue-500/30 hover:bg-blue-600 hover:shadow-blue-500/40 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center group"
            >
              Get Started for Free
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/auth/login"
              className="w-full sm:w-auto px-8 py-4 bg-white text-gray-700 text-lg font-bold rounded-2xl shadow-sm border border-gray-200 hover:bg-gray-50 hover:text-gray-900 hover:-translate-y-1 transition-all duration-300"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                <Rocket className="w-4 h-4 text-white" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-gray-900">LMS Platform</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/profile" className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors font-bold text-sm bg-gray-100 hover:bg-gray-200 px-5 py-2.5 rounded-full">
                <UserCircle className="w-5 h-5" />
                My Profile
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Catalog View */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Course Catalog</h1>
            <p className="text-gray-500 mt-2 text-base font-medium">Explore and seamlessly enroll in our available subjects.</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-72 bg-white rounded-3xl border border-gray-100 shadow-sm animate-pulse" />
            ))}
          </div>
        ) : subjects.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <BookOpen className="w-16 h-16 text-gray-200 mx-auto mb-6" />
            <h3 className="text-xl font-extrabold text-gray-900">No Subjects Available</h3>
            <p className="text-gray-500 mt-2 font-medium">Check back later when physical content is seamlessly published!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {subjects.map(sub => (
              <Link
                key={sub.id}
                href={`/subjects/${sub.id}`}
                className="group flex flex-col bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden cursor-pointer"
              >
                <div className="h-48 bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col justify-end p-8 border-b border-gray-100/50">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-md flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">{sub.title}</h2>
                </div>
                <div className="p-8 flex flex-col flex-1">
                  <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed flex-1 font-medium">
                    {sub.description || 'A comprehensive structural overview natively diving strictly into the core architectural layouts of the syllabus.'}
                  </p>
                  <div className="mt-8 flex items-center text-blue-600 font-bold text-sm tracking-wide group-hover:gap-3 transition-all duration-300">
                    START LEARNING
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}