import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
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
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL || null,    // will extract google profile pic if deployed correctly. else will be null.. can be called by: src={user.photoURL}
        createdAt: serverTimestamp(),
      });
    } 
    
    return user.uid;
  } 
  
  catch (error) {
    throw error;
  }
};

export const getVideosByUserId = (uid) => {
    
}

export const createVideo = (url, uid) => {

}

export const deleteVideo = (videoId, uid) => {

}