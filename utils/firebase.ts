import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBqocgMxLe3MDvoXj43IaJm15_Wk5B_DSo",
  authDomain: "travelgram-4df19.firebaseapp.com",
  projectId: "travelgram-4df19",
  storageBucket: "travelgram-4df19.firebasestorage.app",
  messagingSenderId: "953561933030",
  appId: "1:953561933030:web:163bf19e6f798425100727",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
