'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LoaderOverlay() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  // Trigger loader on link clicks or router.push
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a[href]')) {
        setLoading(true);
      }
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // Hide loader when route has changed
  useEffect(() => {
    setLoading(false); // New page has rendered
  }, [pathname]);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
