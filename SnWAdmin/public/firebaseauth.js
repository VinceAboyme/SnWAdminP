// Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import {
  getFirestore,
  setDoc,
  doc
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

// Firebase config
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
const auth = getAuth(app);
const db = getFirestore(app);

// Helper to show messages
function showMessage(message, divId, color = "black") {
  const div = document.getElementById(divId);
  if (!div) return;
  div.style.display = "block";
  div.style.color = color;
  div.textContent = message;
  setTimeout(() => {
    div.style.display = "none";
  }, 5000);
}

// SIGN UP
const signUpBtn = document.getElementById("submitSignUp");
if (signUpBtn) {
  signUpBtn.addEventListener("click", async (event) => {
    event.preventDefault();
    const email = document.getElementById("rEmail").value.trim();
    const password = document.getElementById("rPassword").value.trim();
    const firstName = document.getElementById("fName").value.trim();
    const lastName = document.getElementById("lName").value.trim();

    if (!email || !password || !firstName || !lastName) {
      showMessage("⚠️ Please fill out all fields", "signUpMessage", "red");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        email,
        firstName,
        lastName,
        createdAt: new Date().toISOString()
      });

      showMessage("✅ Account Created Successfully", "signUpMessage", "green");

      setTimeout(() => {
        window.location.href = "homepage.html";
      }, 1500);
    } catch (error) {
      console.error("Error creating user:", error);
      if (error.code === "auth/email-already-in-use") {
        showMessage("❌ Email already exists", "signUpMessage", "red");
      } else {
        showMessage("❌ Unable to create user: " + error.message, "signUpMessage", "red");
      }
    }
  });
}

// SIGN IN
const signInBtn = document.getElementById("submitSignIn");
if (signInBtn) {
  signInBtn.addEventListener("click", async (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
      showMessage("⚠️ Please enter email and password", "signInMessage", "red");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      localStorage.setItem("loggedInUserId", user.uid);
      showMessage("✅ Login successful", "signInMessage", "green");

      setTimeout(() => {
        window.location.href = "homepage.html";
      }, 1000);
    } catch (error) {
      console.error("Login error:", error);
      if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password") {
        showMessage("❌ Incorrect Email or Password", "signInMessage", "red");
      } else if (error.code === "auth/user-not-found") {
        showMessage("❌ Account does not exist", "signInMessage", "red");
      } else {
        showMessage("❌ Error: " + error.message, "signInMessage", "red");
      }
    }
  });
}

// PASSWORD RECOVERY
const recoverBtn = document.getElementById("recoverBtn");
if (recoverBtn) {
  recoverBtn.addEventListener("click", async () => {
    const email = document.getElementById("recoverEmail").value.trim();
    if (!email) {
      showMessage("⚠️ Please enter your email", "recoverMessage", "red");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      showMessage("📩 Password reset link sent! Check your email.", "recoverMessage", "green");
    } catch (error) {
      console.error("Password reset error:", error);
      if (error.code === "auth/user-not-found") {
        showMessage("❌ No account found with that email", "recoverMessage", "red");
      } else {
        showMessage("❌ Error: " + error.message, "recoverMessage", "red");
      }
    }
  });
}

// LOGOUT
export async function logoutUser() {
  try {
    await signOut(auth);
    localStorage.removeItem("loggedInUserId");
    window.location.href = "index.html";
  } catch (error) {
    console.error("Logout error:", error);
    alert("❌ Failed to logout");
  }
}
