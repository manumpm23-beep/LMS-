'use client';

import { useSidebarStore } from '@/store/sidebarStore';
import { CheckCircle2, Circle, Lock } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';

export default function SubjectSidebar({ subjectId }: { subjectId: string }) {
    const { tree, loading } = useSidebarStore();
    const pathname = usePathname();
    const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});

    useEffect(() => {
        if (tree && !loading) {
            const fetchCounts = async () => {
                const fetchedCounts: Record<string, number> = {};
                const promises = [];
                for (const section of tree.sections) {
                    for (const video of section.videos) {
                        promises.push(
                            apiClient.get(`/api/videos/${video.id}/comments?page=1&pageSize=1`)
                                .then(res => {
                                    if (res.data.totalCount && res.data.totalCount > 0) {
                                        fetchedCounts[video.id] = res.data.totalCount;
                                    }
                                }).catch(() => {})
                        );
                    }
                }
                await Promise.allSettled(promises);
                setCommentCounts(fetchedCounts);
            };
            fetchCounts();
        }
    }, [tree, loading]);

    if (loading || !tree) {
        return (
            <aside className="w-80 bg-white border-r border-gray-100 flex-shrink-0 flex flex-col hidden md:flex">
                <div className="h-20 border-b border-gray-100 animate-pulse bg-gray-50" />
            </aside>
        );
    }

    return (
        <aside className="w-80 bg-white border-r border-gray-100 flex-shrink-0 flex flex-col hidden md:flex h-full font-sans shadow-sm z-10">
            <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 leading-tight tracking-tight">{tree.title}</h2>
                <p className="text-sm font-medium text-gray-400 mt-1">Course Content</p>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
                {tree.sections.map((section, idx) => (
                    <div key={section.id}>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">
                            Section {idx + 1}: {section.title}
                        </h3>

                        <ul className="space-y-1">
                            {section.videos.map(video => {
                                const isActive = pathname === `/subjects/${subjectId}/video/${video.id}`;
                                const Icon = video.isCompleted ? CheckCircle2 : video.locked ? Lock : Circle;

                                if (video.locked) {
                                    return (
                                        <li key={video.id} className="group">
                                            <div className="flex items-start p-2 rounded-lg text-gray-400 bg-gray-50/50 cursor-not-allowed">
                                                <Lock className="w-5 h-5 mt-0.5 flex-shrink-0 text-gray-300" />
                                                <div className="ml-3">
                                                    <p className="text-sm font-medium opacity-80">{video.title}</p>
                                                    <p className="text-[11px] mt-0.5 text-gray-400">Complete previous lesson to unlock</p>
                                                </div>
                                            </div>
                                        </li>
                                    );
                                }

                                return (
                                    <li key={video.id}>
                                        <Link
                                            href={`/subjects/${subjectId}/video/${video.id}`}
                                            className={`flex items-center p-2 rounded-lg transition-colors duration-200 ${isActive
                                                    ? 'bg-primary/10 text-primary'
                                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                                }`}
                                        >
                                            <Icon className={`w-5 h-5 flex-shrink-0 ${video.isCompleted ? 'text-green-500' : isActive ? 'text-primary' : 'text-gray-400'}`} />
                                            <div className="flex-1 flex items-center justify-between ml-3 min-w-0">
                                                <span className="text-sm font-medium truncate pr-2">{video.title}</span>
                                                {commentCounts[video.id] ? (
                                                     <span className="text-[10px] font-bold text-gray-500 bg-black/5 px-2 py-0.5 rounded-full flex items-center shrink-0">
                                                        💬 {commentCounts[video.id]}
                                                     </span>
                                                ) : null}
                                            </div>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </div>
        </aside>
    );
}
