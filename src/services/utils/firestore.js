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

export const getVideosByUserId = (uid) => {
    
}

export const createVideo = (url, uid) => {

}

export const deleteVideo = (videoId, uid) => {

}