
'use server';

import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  increment,
  writeBatch,
  QueryConstraint,
  getDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { LinkData, Visit } from './types';
import { revalidatePath } from 'next/cache';

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
                return `An internal server error occurred: ${firebaseError.message}`;
        }
    }
    return 'An unexpected error occurred.';
}

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
  anonymousToken: string
): Promise<{ shortId?: string; error?: string }> {
  try {
    if (!longUrl || !anonymousToken) {
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
      createdAt: Date.now(),
      clicks: 0,
    };

    await addDoc(collection(db, 'links'), newLink);
    revalidatePath('/dashboard');
    return { shortId };
  } catch (error) {
    console.error('Error creating short link:', error);
    return { error: getFirebaseErrorMessage(error) };
  }
}

export async function logVisit(
    shortId: string, 
    visitorFingerprint: string,
    visitorData: any
): Promise<{ success: boolean; error?: string }> {
    try {
        if(!shortId || !visitorFingerprint) return { success: false, error: 'Missing data' };
        
        const linksQuery = query(collection(db, 'links'), where('shortId', '==', shortId));
        const linkDocs = await getDocs(linksQuery);

        if (linkDocs.empty) {
            return { success: false, error: `Could not find link with shortId: ${shortId}` };
        }
        const linkDocRef = linkDocs.docs[0].ref;

        const visitData: Omit<Visit, 'id'> = {
            shortId,
            visitedAt: Date.now(),
            visitorFingerprint,
            visitorData,
        };

        const batch = writeBatch(db);
        
        const newVisitRef = doc(collection(db, 'analytics'));
        batch.set(newVisitRef, visitData);
        
        batch.update(linkDocRef, { clicks: increment(1) });
        
        await batch.commit();
        
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
        return null;
    }
}

export async function getLinksByToken(anonymousToken: string): Promise<LinkData[]> {
    if (!anonymousToken) return [];

    try {
        const linksRef = collection(db, 'links');
        const q = query(linksRef, where('anonymousToken', '==', anonymousToken));
        const querySnapshot = await getDocs(q);
        const links = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LinkData));

        links.sort((a, b) => b.createdAt - a.createdAt);

        return links;
    } catch (error) {
        console.error('Error fetching links by token:', error);
        return [];
    }
}

export async function getAllLinksAdmin(): Promise<LinkData[]> {
    try {
        const linksRef = collection(db, 'links');
        const q = query(linksRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const links = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LinkData));
        
        return links;
    } catch(error) {
        console.error('Error fetching all links for admin:', error);
        return [];
    }
}

export async function getLinkAnalytics(shortId: string, anonymousToken?: string): Promise<{ link: LinkData | null, visits: Visit[] }> {
    try {
        const linksRef = collection(db, 'links');
        const linkQuery = query(linksRef, where('shortId', '==', shortId));
        const linkSnapshot = await getDocs(linkQuery);

        if (linkSnapshot.empty) {
            return { link: null, visits: [] };
        }

        const linkDoc = linkSnapshot.docs[0];
        const linkData = { id: linkDoc.id, ...linkDoc.data() } as LinkData;

        // If an anonymous token is provided (meaning it's not an admin),
        // verify it matches the link's token for security.
        if (anonymousToken && linkData.anonymousToken !== anonymousToken) {
            console.warn(`Permission denied: token mismatch for shortId ${shortId}. Access denied.`);
            return { link: null, visits: [] };
        }
        
        // Simplified query for analytics to avoid needing a composite index.
        const visitsQuery = query(collection(db, 'analytics'), where('shortId', '==', shortId));
        const visitsSnapshot = await getDocs(visitsQuery);
        
        const visits = visitsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Visit));

        // Sort the results in code instead of in the query.
        visits.sort((a, b) => b.visitedAt - a.visitedAt);

        return { link: linkData, visits };
    } catch (error) {
        console.error(`Error fetching analytics for ${shortId}:`, error);
        return { link: null, visits: [] };
    }
}


export async function deleteLink(
  docId: string,
  shortId: string,
  isUserAdmin: boolean,
  anonymousToken?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const linkDocRef = doc(db, 'links', docId);
    const linkDoc = await getDoc(linkDocRef);

    if (!linkDoc.exists()) {
      return { success: false, error: 'Link not found.' };
    }

    const linkData = linkDoc.data();

    // Authorization check
    if (!isUserAdmin && linkData.anonymousToken !== anonymousToken) {
      return { success: false, error: 'Permission denied.' };
    }

    const batch = writeBatch(db);

    // 1. Delete associated analytics
    const analyticsQuery = query(collection(db, 'analytics'), where('shortId', '==', shortId));
    const analyticsSnapshot = await getDocs(analyticsQuery);
    analyticsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // 2. Delete the link itself
    batch.delete(linkDocRef);

    await batch.commit();

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error deleting link:', error);
    return { success: false, error: getFirebaseErrorMessage(error) };
  }
}
