import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDhlvtkLk8v_VODC-oBUwg6wUnX4NL5su4",
  authDomain: "web2apk-35dd4.firebaseapp.com",
  projectId: "web2apk-35dd4",
  storageBucket: "web2apk-35dd4.firebasestorage.app",
  messagingSenderId: "557775986441",
  appId: "1:557775986441:web:bcb7339c90a969342f7dd8",
  measurementId: "G-EEYPPBWDKP"
};

const app = initializeApp(firebaseConfig);
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, analytics, auth, googleProvider };
