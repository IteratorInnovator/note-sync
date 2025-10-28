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

const db = getFirestore(app, import.meta.env.VITE_APP_FIREBASE_DATABASE_ID);

// ---------------- Videos ----------------
export const getVideosByUserId = async (uid) => {
    const q = query(
        collection(db, "users", uid, "videos"),
        orderBy("addedAt", "desc")
    );
    const snap = await getDocs(q);

    return snap.docs.map((doc) => {
        const data = doc.data();
        return {
            videoId: doc.id,
            category: data.category || data.channelTitle || "Uncategorized",
            ...data,
        };
    });
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
    thumbnailUrl,
    progressSec = 0,
    category
) => {
    try {
        const videoRef = doc(db, "users", uid, "videos", videoId);
        await setDoc(videoRef, {
            videoId,
            title,
            channelTitle,
            thumbnailUrl,
            progressSec,
            category: (category || channelTitle || "Uncategorized").trim(),
            addedAt: serverTimestamp(),
        });
        console.log("Video added successfully");
    } catch (error) {
        console.error("Error adding video:", error);
        throw error;
    }
};

export const removeVideo = async (uid, videoId) => {
    const fn = httpsCallable(functions, "deleteVideoDocWithNotes");
    try {
        const { data } = await fn({ uid, videoId });
        return !!data?.ok;
    } catch {
        return false;
    }
};

export const deleteAllVideos = async (uid) => {
    const fn = httpsCallable(functions, "deleteAllVideoDocs");
    try {
        const { data } = await fn({ uid });
        return !!data?.ok;
    } catch {
        return false;
    }
};

/**
 * Update the saved playback position of a video.
 *
 * @param {string} uid - The user's ID.
 * @param {string} videoId - The video's ID.
 * @param {number} progressSec - Current playback time in seconds.
 */
export const updateVideoProgress = async (uid, videoId, progressSec) => {
    const ref = doc(db, "users", uid, "videos", videoId);
    await updateDoc(ref, {
        progressSec: progressSec,
    });
};

// ---------------- Notes ----------------
export const getNotesByVideoId = async (uid, videoId) => {
    const snap = await getDocs(
        query(
            collection(db, "users", uid, "videos", videoId, "notes"),
            orderBy("timeSec", "asc")
        )
    );
    return snap.docs.map((doc) => ({ noteId: doc.id, ...doc.data() }));
};

export const createNote = async (uid, videoId, content, timeSec) =>
    (
        await addDoc(collection(db, "users", uid, "videos", videoId, "notes"), {
            timeSec,
            content,
        })
    ).id;

export const updateNote = async (uid, videoId, noteId, newContent) => {
    await updateDoc(doc(db, "users", uid, "videos", videoId, "notes", noteId), {
        content: newContent,
    });
    return noteId;
};

export const deleteNote = async (uid, videoId, noteId) =>
    await deleteDoc(doc(db, "users", uid, "videos", videoId, "notes", noteId));

export const hasNotes = async (uid, videoId) =>
    !(
        await getDocs(
            query(
                collection(db, "users", uid, "videos", videoId, "notes"),
                limit(1)
            )
        )
    ).empty;

// ---------------- Settings ----------------
export const getUserSettings = async (uid) => {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.data()?.settings || DEFAULT_SETTINGS;
};

export const updateUserSettings = async (uid, nextSettings) => {
    await updateDoc(doc(db, "users", uid), { settings: nextSettings });
    return nextSettings;
};

export const resetUserSettings = async (uid) =>
    await updateDoc(doc(db, "users", uid), { settings: DEFAULT_SETTINGS });

// ---------------- Playlists ----------------

// Get all playlists for a user
export const getPlaylistsByUserId = async (uid) => {
    const snap = await getDocs(
        query(
            collection(db, "users", uid, "playlists"),
            orderBy("createdAt", "desc")
        )
    );
    return snap.docs.map((doc) => ({ playlistId: doc.id, ...doc.data() }));
};

// Create new playlist
export const createPlaylist = async (uid, title, description = "") =>
    (
        await addDoc(collection(db, "users", uid, "playlists"), {
            title,
            description,
            createdAt: serverTimestamp(),
        })
    ).id;

// Delete a playlist entirely
export const deletePlaylist = async (uid, playlistId) =>
    await deleteDoc(doc(db, "users", uid, "playlists", playlistId));

// Get a single playlist by ID
export const getPlaylistById = async (uid, playlistId) => {
    const ref = doc(db, "users", uid, "playlists", playlistId);
    const snap = await getDoc(ref);
    return snap.exists() ? { playlistId: snap.id, ...snap.data() } : null;
};


// Update an existing playlist (e.g., rename or edit description)
export const updatePlaylist = async (uid, playlistId, updates) => {
    const ref = doc(db, "users", uid, "playlists", playlistId);
    await updateDoc(ref, {
        ...updates,
        updatedAt: serverTimestamp(),
    });
    return playlistId;
};

// Add a video to a specific playlist
export const addVideoToPlaylist = async (uid, playlistId, videoData) => {
    const ref = collection(db, "users", uid, "playlists", playlistId, "videos");
    await addDoc(ref, {
        ...videoData,
        addedAt: serverTimestamp(),
    });
};

// Get all videos within a specific playlist
export const getVideosInPlaylist = async (uid, playlistId) => {
    const snap = await getDocs(
        query(
            collection(db, "users", uid, "playlists", playlistId, "videos"),
            orderBy("addedAt", "desc")
        )
    );
    return snap.docs.map((doc) => ({ videoId: doc.id, ...doc.data() }));
};

// Remove a video from a specific playlist
export const removeVideoFromPlaylist = async (uid, playlistId, videoId) => {
    const ref = doc(db, "users", uid, "playlists", playlistId, "videos", videoId);
    await deleteDoc(ref);
};