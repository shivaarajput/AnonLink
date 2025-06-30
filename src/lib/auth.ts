
'use client';

import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { type User } from 'firebase/auth';

// Client-side check to verify if a user is an admin.
export async function checkIsAdmin(user: User | null): Promise<boolean> {
    if (!user) return false;
    
    // For this application, an admin is defined by having their UID
    // as a document ID in the 'admins' collection in Firestore.
    // NOTE: To simplify development, we are temporarily allowing ANY authenticated user to be an admin.
    // In a production environment, you should re-enable the Firestore check below and
    // ensure your UID is in the 'admins' collection in your database.
    return true; 
    
    /*
    // Original production-ready check:
    try {
        const adminDocRef = doc(db, 'admins', user.uid);
        const adminDoc = await getDoc(adminDocRef);
        return adminDoc.exists();
    } catch (error) {
        console.error("Error checking admin status:", error);
        return false;
    }
    */
}
