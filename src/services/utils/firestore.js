import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from "../..";

const firebaseConfig = {
  apiKey: "AIzaSyC0XvKd14qKqDFrrgXsSraIf1biANk5geA",
  authDomain: "wad2-44a13.firebaseapp.com",
  projectId: "wad2-44a13",
  storageBucket: "wad2-44a13.firebasestorage.app",
  messagingSenderId: "216595758621",
  appId: "1:216595758621:web:b7e801ddd3f3c13ee310f4",
  measurementId: "G-M03J250RMZ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const createUser = async (user) => {
  try {
    const docRef = await addDoc(collection(db, "users"), {
      ...user,
      createdAt: serverTimestamp(), // auto timestamp
    });
    console.log("User created with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

export const getVideosByUserId = async (uid) => {
  try {
    const videosRef = collection(db, "videos");
    const q = query(
      videosRef,
      where("uid", "==", uid),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching videos:", error);
    return [];
  }
};


export const createVideo = async (videoData, uid) => {
  try {
    // videoData = { title, channelTitle, thumbnail, duration, url? }
    const videosRef = collection(db, "videos");
    const docRef = await addDoc(videosRef, {
      uid,
      title: videoData.title,
      channelTitle: videoData.channelTitle,
      thumbnail: videoData.thumbnail,
      duration: videoData.duration,
      url: videoData.url || "",
      createdAt: serverTimestamp(),
    });

    console.log("Video created:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error creating video:", error);
  }
};


export const deleteVideo = async (videoId, uid) => {
  try {
    const videoRef = doc(db, "videos", videoId);
    const snapshot = await getDoc(videoRef);

    if (!snapshot.exists()) {
      throw new Error("Video not found.");
    }

    const data = snapshot.data();
    if (data.uid !== uid) {
      throw new Error("You do not have permission to delete this video.");
    }

    await deleteDoc(videoRef);
    console.log("Video deleted:", videoId);
  } catch (error) {
    console.error("Error deleting video:", error);
  }
};
