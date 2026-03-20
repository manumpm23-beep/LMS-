'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Loader2 } from 'lucide-react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/auth/login');
        } else {
            setIsChecking(false);
        }
    }, [isAuthenticated, router]);

    if (isChecking) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        );
    }

    return <>{children}</>;
}
