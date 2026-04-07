import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "ung-dung-nhat-ky.firebaseapp.com",
  projectId: "ung-dung-nhat-ky",
  storageBucket: "ung-dung-nhat-ky.firebasestorage.app",
  messagingSenderId: "1065402367385",
  appId: "1:1065402367385:web:9f6a7621dec8ffe8a7e708"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);