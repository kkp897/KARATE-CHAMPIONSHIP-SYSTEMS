// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyByvcBq4o6ksAHSj1q5KASoJs-xiETFbCQ",
  authDomain: "sma-checkin.firebaseapp.com",
  databaseURL: "https://sma-checkin-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sma-checkin",
  storageBucket: "sma-checkin.firebasestorage.app",
  messagingSenderId: "40887955046",
  appId: "1:40887955046:web:348878511622fd451647a7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firestore database
const db = getFirestore(app);

export { db };