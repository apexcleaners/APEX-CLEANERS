import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyDVtKBEjqxfshP4h2FRyqM-1iAAWfS9CEc",
  authDomain: "apex-cleaners-reviews.firebaseapp.com",
  projectId: "apex-cleaners-reviews",
  storageBucket: "apex-cleaners-reviews.firebasestorage.app",
  messagingSenderId: "88425004975",
  appId: "1:88425004975:web:fc600cebb3cc8032edf95a",
  measurementId: "G-300DZBRTDK"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);