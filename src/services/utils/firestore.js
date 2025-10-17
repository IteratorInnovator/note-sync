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
import { httpsCallable } from "firebase/functions";
import { app, functions } from "../..";
import { VideoAlreadySavedError } from "./errors";

const FIREBASE_DATABASE_ID = import.meta.env.VITE_APP_FIREBASE_DATABASE_ID;

const db = getFirestore(app, FIREBASE_DATABASE_ID);

/**
 * Retrieve all videos added by a specific user, ordered by timestamp (descending)
 */
export const getVideosByUserId = async (uid) => {
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
export const addVideo = async (
    uid,
    videoId,
    title,
    channelTitle,
    thumbnail
) => {
    const ref = doc(db, "users", uid, "videos", videoId);

    // optional: you could remove this check too if you always want to overwrite
    if ((await getDoc(ref)).exists()) throw new VideoAlreadySavedError();

    await setDoc(ref, {
        title,
        channelTitle,
        thumbnailUrl: thumbnail,
        progresSec: 0,
        addedAt: serverTimestamp(),
    });
};

/**
 * Delete a video document and its notes subcollection from the user's saved videos by its ID
 * Triggers the cloud function
 */
export const removeVideo = async (uid, videoId) => {
    const fn = httpsCallable(functions, "deleteVideoDocWithNotes");
    try {
        const { data } = await fn({ uid, videoId });
        return !!data?.ok;
    } catch {
        return false;
    }

};
  
export const getNotesByVideoId = async (uid, videoId) => {
  const notesCol = collection(db, "users", uid, "videos", videoId, "notes");
  const q = query(notesCol, orderBy("timeSec", "asc")); // optional ordering
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ noteId: doc.id, ...doc.data() }));
};

export const createNote = async (uid, videoId, content, timeSec) => {
    const notesCol = collection(db, "users", uid, "videos", videoId, "notes");

    const docRef = await addDoc(notesCol, {
      timeSec,
      content,
    });

    return docRef.id;
  };

export const updateNote = async (uid, videoId, noteId, newContent) => {
    const ref = doc(db, "users", uid, "videos", videoId, "notes", noteId);

    await updateDoc(ref, {
      content: newContent
    });

    return noteId;
};
  
  

export const deleteNote = async (uid, videoId, noteId) => {
    const ref = doc(db, "users", uid, "videos", videoId, "notes", noteId);
    await deleteDoc(ref);
};
  