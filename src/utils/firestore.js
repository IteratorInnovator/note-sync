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
    const videoRef = doc(db, "users", uid, "videos", videoId);

    const snap = await getDoc(videoRef);
    if (snap.exists()) {
        throw new VideoAlreadySavedError();
    }

    await setDoc(videoRef, {
        videoId,
        title,
        channelTitle,
        thumbnailUrl,
        progressSec,
        category: (category || channelTitle || "Uncategorized").trim(),
        addedAt: serverTimestamp(),
    });
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
export const getPlaylistsByUserId = async (uid) => {
    const snap = await getDocs(
        query(
            collection(db, "users", uid, "playlists"),
            orderBy("createdAt", "desc")
        )
    );
    return snap.docs.map((doc) => ({ playlistId: doc.id, ...doc.data() }));
};

export const createPlaylist = async (uid, title, description = "") =>
    (
        await addDoc(collection(db, "users", uid, "playlists"), {
            title,
            description,
            createdAt: serverTimestamp(),
        })
    ).id;

export const deletePlaylist = async (uid, playlistId) =>
    await deleteDoc(doc(db, "users", uid, "playlists", playlistId));

export const addVideoToPlaylist = async (uid, playlistId, videoId) => {
    const playlistRef = doc(db, "users", uid, "playlists", playlistId);
    const playlistSnap = await getDoc(playlistRef);

    if (!playlistSnap.exists()) throw new Error("Playlist not found");

    const playlistData = playlistSnap.data();
    const videos = playlistData.videos || [];
    if (!videos.includes(videoId)) videos.push(videoId);

    await updateDoc(playlistRef, { videos });
};

// Removes a specific video from a given playlist.
export const removeVideoFromPlaylist = async (uid, playlistId, videoId) => {
    const playlistRef = doc(db, "users", uid, "playlists", playlistId);
    const playlistSnap = await getDoc(playlistRef);

    if (!playlistSnap.exists()) throw new Error("Playlist not found");

    const playlistData = playlistSnap.data();
    const videos = playlistData.videos || [];

    // Filter out the video to be removed
    const updatedVideos = videos.filter((v) => v !== videoId);

    await updateDoc(playlistRef, { videos: updatedVideos });
};
