// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAJW4TDusv2Hah_xYFUqd_groteoqdpud8",
  authDomain: "todoworkspaces.firebaseapp.com",
  projectId: "todoworkspaces",
  storageBucket: "todoworkspaces.firebasestorage.app",
  messagingSenderId: "526243492507",
  appId: "1:526243492507:web:e88874d7dd97c319a08c3e",
  measurementId: "G-PSY5DBTYM7",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app, "us-central1");

export { app, auth, analytics, db, storage, functions };
