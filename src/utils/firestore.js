import {
    getFirestore,
    collection,
    query,
    orderBy,
    doc,
    getDoc,
    getDocs,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    limit,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { app, functions } from "../";
import { VideoAlreadySavedError } from "./errors";
import { DEFAULT_SETTINGS } from "../stores/useSettings";

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

export const getVideoById = async (uid, videoId) => {
    const ref = doc(db, "users", uid, "videos", videoId);
    const snap = await getDoc(ref);
    return snap.exists() ? { videoId: snap.id, ...snap.data() } : null;
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

// Deletes the entire video subcollection in a user doc
export const deleteAllVideos = async (uid) => {
    const fn = httpsCallable(functions, "deleteAllVideoDocs");
    try {
        const { data } = await fn({ uid });
        return !!data?.ok;
    } catch {
        return false;
    }
};

// Retrieves all notes associated with a video
export const getNotesByVideoId = async (uid, videoId) => {
    const notesCol = collection(db, "users", uid, "videos", videoId, "notes");
    const q = query(notesCol, orderBy("timeSec", "asc")); // optional ordering
    const snap = await getDocs(q);
    return snap.docs.map((doc) => ({ noteId: doc.id, ...doc.data() }));
};

// Create a new note under a video
export const createNote = async (uid, videoId, content, timeSec) => {
    const notesCol = collection(db, "users", uid, "videos", videoId, "notes");

    const docRef = await addDoc(notesCol, {
        timeSec,
        content,
    });

    return docRef.id;
};

// Update an exisiting note under a video
export const updateNote = async (uid, videoId, noteId, newContent) => {
    const ref = doc(db, "users", uid, "videos", videoId, "notes", noteId);

    await updateDoc(ref, {
        content: newContent,
    });

    return noteId;
};

// Delete an existing note under a video
export const deleteNote = async (uid, videoId, noteId) => {
    const ref = doc(db, "users", uid, "videos", videoId, "notes", noteId);
    await deleteDoc(ref);
};

/**
 * Check whether a video has any notes stored under it
 * Use case: Show confirmation modal before removing video from list, if the video has notes stored under it
 */
export const hasNotes = async (uid, videoId) => {
    const notesCol = collection(db, "users", uid, "videos", videoId, "notes");
    const snap = await getDocs(query(notesCol, limit(1)));
    return !snap.empty;
};

// Get a user's settings
export const getUserSettings = async (uid) => {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);

    return snap.data().settings;
};

// Update a user's settings
export const updateUserSettings = async (uid, nextSettings) => {
    const ref = doc(db, "users", uid);
    await updateDoc(ref, {
        settings: nextSettings,
    });
    return nextSettings;
};

// Reset a user's settings to default
export const resetUserSettings = async (uid) => {
    const ref = doc(db, "users", uid);
    await updateDoc(ref, {
        settings: DEFAULT_SETTINGS,
    });
};
