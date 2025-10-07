import { initializeApp } from "firebase/app";
import {
    getAuth,
    GoogleAuthProvider,
    FacebookAuthProvider,
} from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyC0XvKd14qKqDFrrgXsSraIf1biANk5geA",
    authDomain: "wad2-44a13.firebaseapp.com",
    projectId: "wad2-44a13",
    storageBucket: "wad2-44a13.firebasestorage.app",
    messagingSenderId: "216595758621",
    appId: "1:216595758621:web:b7e801ddd3f3c13ee310f4",
    measurementId: "G-M03J250RMZ",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
auth.languageCode = "en";

export const GoogleProvider = new GoogleAuthProvider();
export const FacebookProvider = new FacebookAuthProvider();
FacebookProvider.addScope("email");
