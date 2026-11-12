import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDAryX05wGE69DD21nZrI0RFPZWN6h_j3Q",
    authDomain: "skillswap-43585.firebaseapp.com",
    projectId: "skillswap-43585",
    storageBucket: "skillswap-43585.firebasestorage.app",
    messagingSenderId: "727797860977",
    appId: "1:727797860977:web:0943ae47e8324e50a629d0"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);