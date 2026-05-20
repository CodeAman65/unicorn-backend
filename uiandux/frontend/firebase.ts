// firebase.ts - Isme humne aapke Firebase project ki real keys configure kar di hain

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase Console se copy kiya hua aapka real config object
const firebaseConfig = {
  apiKey: "AIzaSyA4ySDYCuzx81ABGFJYlJCMW-ObcVoWU1s",
  authDomain: "ai-resume-architect-906f5.firebaseapp.com",
  projectId: "ai-resume-architect-906f5",
  storageBucket: "ai-resume-architect-906f5.firebasestorage.app",
  messagingSenderId: "236932641357",
  appId: "1:236932641357:web:db339b8aa351f201d7e204",
  measurementId: "G-6YTEXWMF2V"
};

// Next.js (Server) par app crash na ho, isliye check karke initialize kar rahe hain
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Authentication aur Google Provider ko export kar rahe hain taaki login button par use ho sakein
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);