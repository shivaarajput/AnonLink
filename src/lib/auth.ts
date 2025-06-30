'use client';

import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { type User } from 'firebase/auth';

// Client-side check to verify if a user is an admin.
export async function checkIsAdmin(user: User | null): Promise<boolean> {
    if (!user) return false;
    
    // For this application, an admin is defined by having their UID
    // as a document ID in the 'admins' collection in Firestore.
    try {
        const adminDocRef = doc(db, 'admins', user.uid);
        const adminDoc = await getDoc(adminDocRef);
        return adminDoc.exists();
    } catch (error) {
        console.error("Error checking admin status:", error);
        return false;
    }
}
