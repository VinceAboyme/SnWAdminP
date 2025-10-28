// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import { getAuth, signInAnonymously, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAHvQp4S5kIa-pMlts3niATdLoRggnVl6E",
  authDomain: "snwadmin-ca34c.firebaseapp.com",
  projectId: "snwadmin-ca34c",
  storageBucket: "snwadmin-ca34c.appspot.com",
  messagingSenderId: "155112691160",
  appId: "1:155112691160:web:b55a8dd14c5b3bfa8ecead"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Sign in anonymously
signInAnonymously(auth)
  .then(() => console.log("✅ Signed in anonymously"))
  .catch(err => console.error("❌ Auth error:", err));

onAuthStateChanged(auth, (user) => {
  if (user) console.log("👤 Authenticated as:", user.uid);
  else console.warn("⚠️ No user signed in");
});

// Export
export { db, auth };

// Logout function
export function logout() {
  signOut(auth)
    .then(() => {
      console.log("✅ Logged out");
      location.href = "index.html";
    })
    .catch(err => console.error("Logout error:", err));
}
