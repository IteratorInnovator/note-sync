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

export const deleteVideo = async (uid, videoId) => {
  try {
    // will need to remove all notes first before deleting video as firebase will not auto remove when deleting video.
    const notesColRef = collection(db, "users", uid, "videos", videoId, "notes");
    const notesSnapshot = await getDocs(notesColRef);
    const deleteNotesPromises = notesSnapshot.docs.map((noteDoc) => deleteDoc(noteDoc.ref));
    await Promise.all(deleteNotesPromises);

    // deleting the vid
    const videoRef = doc(db, "users", uid, "videos", videoId);
    await deleteDoc(videoRef);

    return videoId;
  } 
  
  catch (error) {
    throw error;
  }
};

export const getNotesByVideoId = async (uid, videoId) => {
  const notesCol = collection(db, "users", uid, "videos", videoId, "notes");
  const q = query(notesCol, orderBy("timeSec", "asc")); // optional ordering
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ noteId: doc.id, ...doc.data() }));
};

export const createNote = async (uid, videoId, content, timeSec) => {
  try {
    const notesCol = collection(db, "users", uid, "videos", videoId, "notes");

    const docRef = await addDoc(notesCol, {
      timeSec,
      content,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  } 
  
  catch (error) {
    throw error;
  }
};

export const updateNote = async (uid, videoId, noteId, newContent) => {
  try {
    const ref = doc(db, "users", uid, "videos", videoId, "notes", noteId);

    await updateDoc(ref, {
      newContent,
      updatedAt: serverTimestamp(),
    });

    return noteId;
  } 
  
  catch (error) {
    throw error;
  }
};

export const deleteNote = async (uid, videoId, noteId) => {
  try {
    const ref = doc(db, "users", uid, "videos", videoId, "notes", noteId);
    await deleteDoc(ref);
    return noteId;
  } 
  
  catch (error) {
    throw error;
  }
};