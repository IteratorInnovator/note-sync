import { initializeApp } from "firebase/app";
import {
    getAuth,
    GoogleAuthProvider,
    GithubAuthProvider,
    setPersistence,
    browserLocalPersistence
} from "firebase/auth";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

const firebaseConfig = {
    apiKey: "AIzaSyC0XvKd14qKqDFrrgXsSraIf1biANk5geA",
    authDomain: "wad2-44a13.firebaseapp.com",
    projectId: "wad2-44a13",
    storageBucket: "wad2-44a13.firebasestorage.app",
    messagingSenderId: "216595758621",
    appId: "1:216595758621:web:b7e801ddd3f3c13ee310f4",
    measurementId: "G-M03J250RMZ",
};

const FIREBASE_CLOUD_FUNCTIONS_REGION = import.meta.env.VITE_APP_FIREBASE_CLOUD_FUNCTIONS_REGION;

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
auth.languageCode = "en";
await setPersistence(auth, browserLocalPersistence);

export const GoogleProvider = new GoogleAuthProvider();
export const GithubProvider = new GithubAuthProvider();
GoogleProvider.addScope('email');
GithubProvider.addScope("read:user");
GithubProvider.addScope("user:email");

export const functions = getFunctions(app, FIREBASE_CLOUD_FUNCTIONS_REGION);

if (import.meta.env.DEV) {
  connectFunctionsEmulator(functions, "localhost", 5001);
}

export const APP_BASE_URL = import.meta.env.VITE_APP_BASE_URL;


