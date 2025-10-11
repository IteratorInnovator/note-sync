import {
    getFirestore,
    collection,
    query,
    where,
    orderBy,
    getDocs,
} from "firebase/firestore";
import { app } from "../..";

const FIREBASE_DATABASE_ID = import.meta.env.VITE_APP_FIREBASE_DATABASE_ID;
const db = getFirestore(app, FIREBASE_DATABASE_ID);

export const createUser = () => {};

export const getVideosByUserId = async (uid) => {
    if (!uid) return [];

    const q = query(
        collection(db, "users", uid, "videos"),
        orderBy("addedAt", "desc")
    );
    const snap = await getDocs(q);

    const videos = snap.docs.map((doc) => ({ videoId: doc.id, ...doc.data() }));
    return videos;
};

export const addVideo = (videoId, uid) => {};

export const deleteVideo = (videoId, uid) => {};
