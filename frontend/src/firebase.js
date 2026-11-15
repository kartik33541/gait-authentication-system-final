import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD-HP2996jqKifjVjatRH7781-2M6OOanw",
  authDomain: "vocalnav.firebaseapp.com",
  projectId: "vocalnav",
  storageBucket: "vocalnav.firebasestorage.app",
  messagingSenderId: "710232766048",
  appId: "1:710232766048:web:eac8a04fc3a8a5477ef505"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
