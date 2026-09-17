import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const missingConfig = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

export function getFirebaseServices() {
  if (missingConfig.length > 0) {
    throw new Error(
      "Firebase is not configured. Copy .env.example to .env.local and add your Firebase web app values.",
    );
  }

  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  return { auth: getAuth(app), db: getFirestore(app) };
}
