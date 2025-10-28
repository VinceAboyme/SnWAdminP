// auth.js
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";

// Same Firebase config as firebaseauth.js
const firebaseConfig = {
  apiKey: "AIzaSyAHvQp4S5kIa-pMlts3niATdLoRggnVl6E",
  authDomain: "snwadmin-ca34c.firebaseapp.com",
  projectId: "snwadmin-ca34c",
  storageBucket: "snwadmin-ca34c.appspot.com",
  messagingSenderId: "155112691160",
  appId: "1:155112691160:web:b55a8dd14c5b3bfa8ecead"
};

// Initialize Firebase (safe re-init)
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Function to disable back navigation (when logged in)
function disableBackNavigation() {
  history.pushState(null, "", location.href);
  window.onpopstate = function () {
    history.pushState(null, "", location.href);
  };
}

// Function to enable it again (when logging out)
function enableBackNavigation() {
  window.onpopstate = null;
}

// Handle auth state changes
onAuthStateChanged(auth, (user) => {
  const currentPage = window.location.pathname.split("/").pop();

  if (user) {
    // Logged in
    if (currentPage === "index.html") {
      window.location.replace("homepage.html");
    }
    disableBackNavigation();
  } else {
    // Not logged in
    const protectedPages = [
      "homepage.html",
      "product.html",
      "history.html",
      "summary.html",
      "profile.html"
    ];
    if (protectedPages.includes(currentPage)) {
      window.location.replace("index.html");
    }
    enableBackNavigation();
  }
});

// Optional: Handle logout button (if exists)
const logoutBtn = document.querySelector("#logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    localStorage.removeItem("loggedInUserId");
    enableBackNavigation();
    window.location.replace("index.html");
  });
}
