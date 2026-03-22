'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Rocket, UserCircle, LogOut } from 'lucide-react';

interface HeaderProps {
    theme?: 'dark' | 'light';
}

export default function Header({ theme = 'dark' }: HeaderProps) {
    const { isAuthenticated, user, logout } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    const isDark = theme === 'dark';

    return (
        <nav className={`${isDark ? 'bg-[#0f0f11]/80 border-b border-white/10 backdrop-blur-xl text-white' : 'bg-white border-b border-gray-200 text-gray-900 shadow-sm'} sticky top-0 z-50`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20 items-center">
                    <Link href="/" className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                            <Rocket className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-extrabold text-2xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">Learning Platform</span>
                    </Link>

                    <div className="flex items-center gap-6">
                        {!isAuthenticated ? (
                            <>
                                <Link href="/auth/login" className={`font-semibold hover:opacity-80 transition`}>
                                    Login
                                </Link>
                                <Link href="/auth/register" className={`px-6 py-2.5 rounded-full font-bold transition-all ${isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'}`}>
                                    Register
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link 
                                    href="/dashboard" 
                                    className={`font-semibold transition ${pathname === '/dashboard' ? 'underline decoration-2 underline-offset-4' : 'opacity-80 hover:opacity-100'}`}
                                >
                                    Dashboard
                                </Link>
                                
                                <div className="relative" ref={dropdownRef}>
                                    <button 
                                        onClick={() => setDropdownOpen(!dropdownOpen)}
                                        className="focus:outline-none flex items-center justify-center rounded-full overflow-hidden border-2 border-transparent hover:border-indigo-500 transition-colors bg-gray-100"
                                    >
                                        <img 
                                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.name || 'Student')}`} 
                                            alt="User Avatar"
                                            className="w-10 h-10 object-cover"
                                        />
                                    </button>

                                    {dropdownOpen && (
                                        <div className={`absolute right-0 mt-3 w-48 rounded-2xl shadow-xl overflow-hidden py-2 border ${isDark ? 'bg-[#18181b] border-white/10 text-white' : 'bg-white border-gray-100 text-gray-900'} z-[100]`}>
                                            <Link 
                                                href="/dashboard" 
                                                className={`block px-5 py-3 text-sm font-semibold transition ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}
                                                onClick={() => setDropdownOpen(false)}
                                            >
                                                My Dashboard
                                            </Link>
                                            <Link 
                                                href="/profile" 
                                                className={`block px-5 py-3 text-sm font-semibold transition ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}
                                                onClick={() => setDropdownOpen(false)}
                                            >
                                                Profile
                                            </Link>
                                            <div className={`h-px w-full my-1 ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}></div>
                                            <button 
                                                onClick={() => { setDropdownOpen(false); handleLogout(); }}
                                                className={`w-full text-left px-5 py-3 text-sm font-semibold text-red-500 transition flex items-center gap-2 ${isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'}`}
                                            >
                                                <LogOut className="w-4 h-4" />
                                                Logout
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
