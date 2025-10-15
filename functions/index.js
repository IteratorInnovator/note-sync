// Import V2 Auth triggers as a namespace from the explicit 'v2/auth' submodule path
import * as auth from 'firebase-functions/auth'; 
// Import specific components from Firebase Admin SDK for modern ES Module usage
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK if it hasn't been already.
// This uses the explicit 'getApps()' function to check the length of initialized apps.
if (getApps().length === 0) {
  initializeApp();
}

/**
 * Handles new user signups via Firebase Authentication (V2 Trigger).
 * Creates a corresponding user document in Firestore to store profile data.
 */
// Using auth.onCreate() after importing 'auth' namespace
export const newUserSignup = auth.onCreate(async (event) => {
  const user = event.data; // Extract the user record from the event object

  if (!user) {
    console.warn("Auth trigger fired but user data was null/undefined.");
    return;
  }

  const {
    uid,
    email,
    displayName,
    photoURL,
    // Safely destructure providerData, defaulting to an empty array
    providerData = [], 
  } = user;

  const userData = {
    uid,
    email,
    displayName,
    photoURL,
    // Safely access the first provider's ID using optional chaining (?.)
    providerId: providerData[0]?.providerId || 'firebase', 
    // Use FieldValue directly from the import
    createdAtServer: FieldValue.serverTimestamp(), 
  };

  try {
    await getFirestore().collection('users').doc(uid).set(userData); 
    console.log(`User ${uid} saved to Firestore`);
  } catch (error) {
    console.error('Error saving user:', error);
  }
});

