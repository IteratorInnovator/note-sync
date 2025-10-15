import {
  getFirestore,
  collection,
  query,
  orderBy,
  doc,
  getDoc,
  getDocs,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { app } from "../..";

const FIREBASE_DATABASE_ID = import.meta.env.VITE_APP_FIREBASE_DATABASE_ID;
const db = getFirestore(app, FIREBASE_DATABASE_ID);

/**
 * Create or overwrite a user document in Firestore.
 * Called when a user signs up (e.g. via Google).
 */
export const createUser = async (user) => {
  try {
    const userRef = doc(db, "users", user.uid);

    // Always create or update user document
    await setDoc(userRef, {
      name: user.displayName,
      email: user.email,
      photoURL: user.photoURL || null, // from Google profile if available
      createdAt: serverTimestamp(),
    });

    return user.uid;
  } catch (error) 
    throw error;
  }
};

/**
 * Retrieve all videos added by a specific user, ordered by timestamp (descending)
 */
export const getVideosByUserId = async (uid) => {
  if (!uid) return [];

  const q = query(
    collection(db, "users", uid, "videos"),
    orderBy("addedAt", "desc")
  );

  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ videoId: doc.id, ...doc.data() }));
};

/**
 * Add a video to a user's subcollection "videos"
 */
export const addVideo = async (uid, videoId, title, channelTitle, thumbnail) => {
  const ref = doc(db, "users", uid, "videos", videoId);

  // optional: you could remove this check too if you always want to overwrite
  if ((await getDoc(ref)).exists()) return;

  await setDoc(ref, {
    title,
    channelTitle,
    thumbnailUrl: thumbnail,
    progresSec: 0,
    addedAt: serverTimestamp(),
  });
};

/**
 * Delete a video document by ID
 */
export const deleteVideo = (videoId, uid) => {
  // (to be implemented if needed)
};
