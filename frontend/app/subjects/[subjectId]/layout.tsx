'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSidebarStore } from '@/store/sidebarStore';
import AuthGuard from '@/components/Auth/AuthGuard';
import SubjectSidebar from '@/components/Sidebar/SubjectSidebar';
import { Loader2 } from 'lucide-react';

export default function SubjectLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { subjectId: string };
}) {
  const pathname = usePathname();
  const { fetchTree, loading, error } = useSidebarStore();
  
  const isVideoPage = pathname.includes('/video/');

  useEffect(() => {
    fetchTree(params.subjectId);
  }, [params.subjectId, fetchTree]);

  if (isVideoPage) {
    return <AuthGuard><div className="bg-white min-h-[100dvh] flex flex-col">{children}</div></AuthGuard>;
  }

  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden bg-white">
        <SubjectSidebar subjectId={params.subjectId} />

        <main className="flex-1 overflow-y-auto bg-gray-50 flex flex-col relative">
          {loading ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-red-500 font-medium">{error}</p>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </AuthGuard>
  );
}