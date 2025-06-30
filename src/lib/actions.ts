'use server';

import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  getCountFromServer,
} from 'firebase/firestore';
import { db } from './firebase';
import { LinkData, LinkWithAnalytics, Visit } from './types';
import { revalidatePath } from 'next/cache';

// Helper to get a more specific error message from a Firebase error
function getFirebaseErrorMessage(error: unknown): string {
    if (error && typeof error === 'object' && 'code' in error) {
        const firebaseError = error as { code: string; message: string };
        switch (firebaseError.code) {
            case 'permission-denied':
                return 'Database permission denied. Please check your Firestore security rules to allow writes to the "links" and "analytics" collections.';
            case 'unauthenticated':
                return 'Authentication failed. Please check your API keys.';
            case 'unavailable':
                 return 'The service is currently unavailable. This could be a temporary issue with Firestore.';
            default:
                return firebaseError.message;
        }
    }
    return 'An unexpected error occurred.';
}


// Helper to generate a random short ID
function generateShortId(length = 7) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function isShortIdUnique(shortId: string): Promise<boolean> {
  const q = query(collection(db, 'links'), where('shortId', '==', shortId));
  const snapshot = await getDocs(q);
  return snapshot.empty;
}

export async function createShortLink(
  longUrl: string,
  anonymousToken: string,
  creatorFingerprint: string,
  creatorFingerprintData: any,
): Promise<{ shortId?: string; error?: string }> {
  try {
    if (!longUrl || !anonymousToken || !creatorFingerprint) {
      return { error: 'Missing required data.' };
    }
    
    let shortId = generateShortId();
    let unique = await isShortIdUnique(shortId);
    let attempts = 0;
    while (!unique && attempts < 5) {
      shortId = generateShortId();
      unique = await isShortIdUnique(shortId);
      attempts++;
    }

    if (!unique) {
      return { error: 'Could not generate a unique link. Please try again.' };
    }

    const newLink: Omit<LinkData, 'id'> = {
      shortId,
      longUrl,
      anonymousToken,
      creatorFingerprint,
      creatorFingerprintData,
      createdAt: Date.now(),
    };

    await addDoc(collection(db, 'links'), newLink);
    revalidatePath('/dashboard');
    return { shortId };
  } catch (error) {
    console.error('Error creating short link:', error);
    return { error: getFirebaseErrorMessage(error) };
  }
}

export async function logVisit(shortId: string, visitorFingerprint: string, visitorData: any): Promise<{ success: boolean; error?: string }> {
    try {
        if(!shortId || !visitorFingerprint) return { success: false, error: 'Missing data' };
        
        const getBrowser = (userAgent: string) => {
            if (!userAgent) return 'Unknown';
            if (userAgent.includes('Firefox')) return 'Firefox';
            if (userAgent.includes('SamsungBrowser')) return 'Samsung Browser';
            if (userAgent.includes('Opera') || userAgent.includes('OPR')) return 'Opera';
            if (userAgent.includes('Edge')) return 'Edge';
            if (userAgent.includes('Edg/')) return 'Edge';
            if (userAgent.includes('Chrome')) return 'Chrome';
            if (userAgent.includes('Safari')) return 'Safari';
            return 'Other';
        }
        
        const visitData: Omit<Visit, 'id'> = {
            shortId,
            visitorFingerprint,
            visitedAt: Date.now(),
            visitorData,
            browser: getBrowser(visitorData.software?.userAgent),
            os: visitorData.software?.os || 'Unknown',
            country: visitorData.network?.public?.country || 'Unknown',
            isp: visitorData.network?.public?.isp || 'Unknown',
            gpuRenderer: visitorData.hardware?.gpu?.renderer || 'Unknown',
        };

        await addDoc(collection(db, 'analytics'), visitData);
        return { success: true };
    } catch (error) {
        console.error('Error logging visit:', error);
        return { success: false, error: getFirebaseErrorMessage(error) };
    }
}

export async function getLongUrl(shortId: string): Promise<string | null> {
    try {
        const q = query(collection(db, 'links'), where('shortId', '==', shortId));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            return null;
        }
        return snapshot.docs[0].data().longUrl as string;
    } catch (error) {
        console.error(`Error fetching long URL for ${shortId}:`, error);
        return null; // Don't crash the redirect page
    }
}

export async function getLinksByToken(anonymousToken: string): Promise<LinkWithAnalytics[]> {
    if (!anonymousToken) return [];

    try {
        const linksRef = collection(db, 'links');
        const q = query(linksRef, where('anonymousToken', '==', anonymousToken));

        const querySnapshot = await getDocs(q);
        const links: LinkWithAnalytics[] = [];

        for (const doc of querySnapshot.docs) {
            const linkData = { id: doc.id, ...doc.data() } as LinkData;
            
            const analyticsRef = collection(db, 'analytics');
            const analyticsQuery = query(analyticsRef, where('shortId', '==', linkData.shortId));
            const analyticsSnapshot = await getDocs(analyticsQuery);
            const clicks = analyticsSnapshot.size;
            const visits = analyticsSnapshot.docs.map(visitDoc => ({ id: visitDoc.id, ...visitDoc.data() }) as Visit);

            links.push({ ...linkData, clicks, visits });
        }

        return links.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
        console.error('Error fetching links by token:', error);
        return []; // Return empty array on error to prevent dashboard crash
    }
}

// NOTE: Admin validation should be handled in the page component before calling admin actions.
export async function getAllLinksAdmin(): Promise<LinkWithAnalytics[]> {
    try {
        const linksRef = collection(db, 'links');
        const querySnapshot = await getDocs(linksRef);
        const links: LinkWithAnalytics[] = [];

        for (const doc of querySnapshot.docs) {
            const linkData = { id: doc.id, ...doc.data() } as LinkData;

            const analyticsRef = collection(db, 'analytics');
            const analyticsQuery = query(analyticsRef, where('shortId', '==', linkData.shortId));
            const clicksSnapshot = await getCountFromServer(analyticsQuery);
            const clicks = clicksSnapshot.data().count;

            links.push({ ...linkData, clicks });
        }
        
        return links.sort((a, b) => b.createdAt - a.createdAt);
    } catch(error) {
        console.error('Error fetching all links for admin:', error);
        return [];
    }
}

export async function getLinkAnalyticsAdmin(shortId: string): Promise<{ link: LinkData | null, visits: Visit[] }> {
    try {
        const linkQuery = query(collection(db, 'links'), where('shortId', '==', shortId));
        const linkSnapshot = await getDocs(linkQuery);

        if (linkSnapshot.empty) {
            return { link: null, visits: [] };
        }

        const link = { id: linkSnapshot.docs[0].id, ...linkSnapshot.docs[0].data() } as LinkData;
        
        const visits: Visit[] = [];
        const visitsQuery = query(collection(db, 'analytics'), where('shortId', '==', shortId));
        const visitsSnapshot = await getDocs(visitsQuery);
        visitsSnapshot.forEach(doc => {
            visits.push({ id: doc.id, ...doc.data() } as Visit);
        });

        return { link, visits: visits.sort((a, b) => b.visitedAt - a.visitedAt) };
    } catch (error) {
        console.error(`Error fetching analytics for ${shortId}:`, error);
        return { link: null, visits: [] };
    }
}
