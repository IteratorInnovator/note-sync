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
    arrayRemove,
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
        const ok = !!data?.ok;
        if (ok) {
            try {
                await removeVideoFromAllPlaylists(uid, videoId);
            } catch (cleanupError) {
                console.error(
                    "Failed to remove video from playlists:",
                    cleanupError
                );
            }
        }
        return ok;
    } catch {
        return false;
    }
};

export async function removeVideoFromAllPlaylists(uid, videoId) {
    const playlistsSnap = await getDocs(
        collection(db, "users", uid, "playlists")
    );

    if (playlistsSnap.empty) return;

    const updates = [];

    playlistsSnap.forEach((playlistDoc) => {
        const videos = playlistDoc.data()?.videos;
        if (!Array.isArray(videos) || !videos.includes(videoId)) return;
        updates.push(
            updateDoc(playlistDoc.ref, { videos: arrayRemove(videoId) })
        );
    });

    if (updates.length) {
        await Promise.all(updates);
    }
}

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
            timeSec: timeSec,
            content: content,
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

export const createPlaylist = async (uid, name) =>
    (
        await addDoc(collection(db, "users", uid, "playlists"), {
            name,
            videos: [],
            createdAt: serverTimestamp(),
        })
    ).id;

export const renamePlaylist = async (uid, playlistId, nextName) => {
    const playlistRef = doc(db, "users", uid, "playlists", playlistId);
    await updateDoc(playlistRef, { name: nextName });
};

export const deletePlaylist = async (uid, playlistId) =>
    await deleteDoc(doc(db, "users", uid, "playlists", playlistId));

/**
 * Append one or more videos to an existing playlist, preserving existing entries.
 *
 * @param {string} uid - The owner's user id.
 * @param {string} playlistId - Playlist document id.
 * @param {string[]} videoIds - Array of video ids to merge into the playlist.
 */
export const addVideosToPlaylist = async (uid, playlistId, videoIds) => {
    if (!Array.isArray(videoIds) || videoIds.length === 0) return;

    const playlistRef = doc(db, "users", uid, "playlists", playlistId);
    const playlistSnap = await getDoc(playlistRef);
    if (!playlistSnap.exists()) return;

    const currentVideos = Array.isArray(playlistSnap.data()?.videos)
        ? playlistSnap.data().videos
        : [];
    const nextVideos = Array.from(
        new Set([...currentVideos, ...videoIds.filter(Boolean)])
    );

    if (nextVideos.length === currentVideos.length) return;

    await updateDoc(playlistRef, { videos: nextVideos });
};

export const removeVideoIdsFromPlaylist = async (
    uid,
    playlistId,
    videoIds
) => {
    const ids = Array.isArray(videoIds)
        ? videoIds.map((id) => id).filter(Boolean)
        : [];

    if (ids.length === 0) return;

    const playlistRef = doc(db, "users", uid, "playlists", playlistId);
    await updateDoc(playlistRef, { videos: arrayRemove(...ids) });
};

export const getUserVideosAndPlaylists = async (uid) => {
    const [videos, playlistsSnap] = await Promise.all([
        getVideosByUserId(uid),
        getDocs(
            query(collection(db, "users", uid, "playlists"), orderBy("name"))
        ),
    ]);

    const videoMap = new Map(videos.map((video) => [video.videoId, video]));

    const playlists = playlistsSnap.docs.map((playlistDoc) => {
        const data = playlistDoc.data() ?? {};
        const videoIds = Array.isArray(data.videos) ? data.videos : [];
        const resolvedVideos = videoIds
            .map((id) => videoMap.get(id))
            .filter(Boolean);
        const missingVideoIds = videoIds.filter((id) => !videoMap.has(id));

        return {
            playlistId: playlistDoc.id,
            ...data,
            videoIds,
            videos: resolvedVideos,
            missingVideoIds,
        };
    });

    return { videos, playlists };
};
