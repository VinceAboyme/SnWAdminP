// Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
  signOut
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  serverTimestamp
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

// Helper functions
function el(id) {
  return document.getElementById(id);
}

function showMessage(id, text, type = "success") {
  const d = el(id);
  if (!d) return;
  d.textContent = text;
  d.className = `message ${type}`;
  d.style.display = "block";
  setTimeout(() => (d.style.display = "none"), 3500);
}

// Log History 
async function logHistory(user, action, details) {
  if (!user) return;
  try {
    await addDoc(collection(db, "history"), {
      userId: user.uid,
      userEmail: user.email,
      action,
      details,
      date: serverTimestamp()
    });
  } catch (err) {
    console.error("Failed to log history:", err);
  }
}

// Function to load user's full name
async function loadUserName(userId) {
  try {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const userData = docSnap.data();
      const userName = `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || "User";
      document.getElementById("userName").innerText = userName;
    } else {
      document.getElementById("userName").innerText = "User";
    }
  } catch (error) {
    console.error("Error getting user document:", error);
    document.getElementById("userName").innerText = "User";
  }
}

// Load User Profile Data
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const loggedInUserId = localStorage.getItem("loggedInUserId");
  if (loggedInUserId) {
    loadUserName(loggedInUserId); // 🆕 Load and display user name
  }

  el("email").value = user.email || "";

  try {
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const data = snap.data();
      el("firstName").value = data.firstName || "";
      el("lastName").value = data.lastName || "";
    } else {
      // 🔹 Create missing user doc with admin role
      await setDoc(ref, {
        email: user.email,
        role: "admin", // 🔥 Automatically assign admin role
        createdAt: new Date().toISOString(),
        firstName: "",
        lastName: ""
      });

      await logHistory(user, "Created Admin Profile", "Admin profile auto-created in Firestore");
      console.log("Created missing admin profile document.");
    }
  } catch (err) {
    console.error("Could not load profile:", err);
    showMessage("profileMessage", "Failed to load profile", "error");
  }
});

// Update Profile
el("updateProfileBtn")?.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return;

  const firstName = el("firstName").value.trim();
  const lastName = el("lastName").value.trim();

  if (!firstName || !lastName) {
    showMessage("profileMessage", "Please fill both first and last name", "error");
    return;
  }

  try {
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      await updateDoc(ref, { firstName, lastName });
    } else {
      await setDoc(ref, {
        email: user.email,
        role: "admin",
        firstName,
        lastName,
        createdAt: new Date().toISOString()
      });
    }

    await logHistory(user, "Updated Profile", `Changed name to ${firstName} ${lastName}`);

    showMessage("profileMessage", "Profile updated successfully", "success");
    // Update the displayed name instantly
    el("userName").innerText = `${firstName} ${lastName}`;
  } catch (err) {
    console.error("Update profile error:", err);
    showMessage("profileMessage", "Error updating profile: " + (err.message || err), "error");
  }
});

// Change Password
el("changePasswordBtn")?.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return;

  const currentPassword = el("currentPassword").value;
  const newPassword = el("newPassword").value;

  if (!currentPassword || !newPassword) {
    showMessage("passwordMessage", "Please enter current and new password", "error");
    return;
  }
  if (newPassword.length < 6) {
    showMessage("passwordMessage", "New password must be at least 6 characters", "error");
    return;
  }

  try {
    const cred = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, cred);
    await updatePassword(user, newPassword);

    await logHistory(user, "Changed Password", "Admin updated their password");

    el("currentPassword").value = "";
    el("newPassword").value = "";
    showMessage("passwordMessage", "Password changed successfully", "success");
  } catch (err) {
    console.error("Change password error:", err);
    const msg =
      err.code === "auth/wrong-password"
        ? "Current password is incorrect"
        : err.message || "Failed to change password";
    showMessage("passwordMessage", msg, "error");
  }
});

// Logout
el("logout")?.addEventListener("click", async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  try {
    await logHistory(user, "Logout", "Admin logged out");
    await signOut(auth);
    window.location.href = "index.html";
  } catch (err) {
    console.error("Logout error:", err);
    alert("Could not logout");
  }
});