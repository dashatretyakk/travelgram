import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  enableIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBMVMBznFbWajQuznl5HHZ7DqeaZ5mMsrk",
  authDomain: "travelgram-b9644.firebaseapp.com",
  projectId: "travelgram-b9644",
  storageBucket: "travelgram-b9644.firebasestorage.app",
  messagingSenderId: "385119766887",
  appId: "1:385119766887:web:b7ce8b08838a8fb21047c2",
  measurementId: "G-29KQRHCRLR",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable offline persistence - must be called right after initialization
// and before any other Firestore calls
if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === "failed-precondition") {
      // Multiple tabs open, persistence can only be enabled
      // in one tab at a time.
      console.log("Persistence failed: Multiple tabs open");
    } else if (err.code === "unimplemented") {
      // The current browser does not support all of the
      // features required to enable persistence
      console.log("Persistence is not available in this browser");
    } else {
      console.error("Persistence error:", err);
    }
  });
}
