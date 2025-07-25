
'use client';

import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { type User } from 'firebase/auth';

export async function checkIsAdmin(user: User | null): Promise<boolean> {
    if (!user) return false;
    
    // For this application, an admin is defined by having their UID
    // as a document ID in the 'admins' collection in Firestore.
    // To simplify development, we are temporarily allowing ANY authenticated user to be an admin.
    return true; 
    
    /*
    // To enable secure admin checking for production:
    // 1. Uncomment the code below.
    // 2. Comment out or remove `return true;` above.
    // 3. In your Firestore database, create an `admins` collection.
    // 4. For each admin user, add a document to the `admins` collection where the Document ID is the user's Firebase Auth UID.
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
