
'use client';

import { useEffect, useState } from 'react';
import { getFingerprint } from '@/lib/fingerprint';
import { logVisit } from '@/lib/actions';
import { Loader2 } from 'lucide-react';

interface RedirectorProps {
  longUrl: string;
  shortId: string;
}

export default function Redirector({ longUrl, shortId }: RedirectorProps) {
  const [message, setMessage] = useState('Please wait, we are analyzing your connection and redirecting you securely...');

  useEffect(() => {
    const performRedirect = async () => {
      try {
        const { hash, data } = await getFingerprint();
        await logVisit(shortId, hash, data);
      } catch (error) {
        console.error('Failed to log visit:', error);
        // We still redirect even if logging fails
      } finally {
        if (typeof window !== 'undefined') {
          window.location.replace(longUrl);
        }
      }
    };

    // A small delay gives the fingerprinting script time to run.
    const timer = setTimeout(performRedirect, 500); 

    return () => clearTimeout(timer);
  }, [longUrl, shortId]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <h1 className="text-2xl font-semibold">{message}</h1>
      <p className="text-muted-foreground mt-2">
        If you are not redirected automatically, please{' '}
        <a href={longUrl} className="text-primary underline">
          click here
        </a>
        .
      </p>
    </div>
  );
}
