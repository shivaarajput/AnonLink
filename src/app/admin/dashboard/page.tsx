
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * This page is now a redirector. 
 * All dashboard functionality has been merged into /dashboard.
 */
export default function AdminDashboardRedirector() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/dashboard');
    }, [router]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Redirecting to dashboard...</p>
        </div>
    );
}
