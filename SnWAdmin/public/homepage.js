// homepage.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import {
  getFirestore,
  getDoc,
  doc,
  collection,
  getDocs,
  query,
  where,
  Timestamp
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

// --- Firebase Configuration ---
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
const auth = getAuth();
const db = getFirestore(app);

// --- Prevent manual access if not logged in ---
if (!localStorage.getItem("loggedInUserId")) {
  window.location.replace("index.html");
}

// --- Disable Back Navigation while Logged In ---
function disableBackNavigation() {
  // Prevent browser history back
  history.pushState(null, "", location.href);
  window.onpopstate = function () {
    history.pushState(null, "", location.href);
  };

  // Disable ALT + ←, ALT + →, Backspace, etc.
  window.addEventListener("keydown", function (e) {
    const forbiddenCombos = [
      (e.key === "ArrowLeft" && e.altKey),
      (e.key === "ArrowRight" && e.altKey),
      (e.key === "Backspace" && !["INPUT", "TEXTAREA"].includes(e.target.tagName))
    ];
    if (forbiddenCombos.some(Boolean)) {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  // Disable browser navigation gestures (for mouse or swipe)
  window.addEventListener("popstate", (e) => {
    history.pushState(null, "", location.href);
  });

  // Disable right-click to avoid navigation via context menu
  window.addEventListener("contextmenu", (e) => e.preventDefault());
}

// --- Track Logged-in User ---
onAuthStateChanged(auth, (user) => {
  if (user) {
    disableBackNavigation(); // Disable back navigation completely when logged in

    const loggedInUserId = localStorage.getItem("loggedInUserId");
    if (loggedInUserId) {
      const docRef = doc(db, "users", loggedInUserId);
      getDoc(docRef)
        .then((docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            document.getElementById("userName").innerText =
              `${userData.firstName} ${userData.lastName}`;
          } else {
            document.getElementById("userName").innerText = "User";
          }
        })
        .catch((error) => {
          console.error("Error getting document", error);
          document.getElementById("userName").innerText = "User";
        });
    } else {
      document.getElementById("userName").innerText = "Guest";
    }

    initDashboard();
  } else {
    window.location.href = "index.html";
  }
});

// --- Logout Functionality (Instant, No Warning, Restores Back Button) ---
document.getElementById("logout").addEventListener("click", () => {
  localStorage.removeItem("loggedInUserId");
  signOut(auth)
    .then(() => {
      // Restore normal navigation on logout
      window.onpopstate = null;
      window.removeEventListener("keydown", () => {});
      window.removeEventListener("contextmenu", () => {});
      window.location.href = "index.html";
    })
    .catch((error) => {
      console.error("Error signing out:", error);
    });
});

// -------- Dashboard Stats --------
async function fetchTotalUsers() {
  try {
    const usersSnap = await getDocs(collection(db, "users"));
    document.getElementById("totalUsers").innerText = usersSnap.size;
  } catch (err) {
    console.error("Error fetching users:", err);
  }
}

async function fetchTotalProducts() {
  try {
    const productsSnap = await getDocs(collection(db, "products"));
    document.getElementById("totalProducts").innerText = productsSnap.size;
  } catch (err) {
    console.error("Error fetching total products:", err);
  }
}

async function fetchProductsInWeek() {
  try {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const q = query(
      collection(db, "products"),
      where("createdAt", ">=", Timestamp.fromDate(startOfWeek)),
      where("createdAt", "<", Timestamp.fromDate(endOfWeek))
    );

    const snap = await getDocs(q);
    document.getElementById("productsWeek").innerText = snap.size;
  } catch (err) {
    console.error("Error fetching weekly products:", err);
  }
}

async function fetchProductsInMonth() {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    const q = query(
      collection(db, "products"),
      where("createdAt", ">=", Timestamp.fromDate(startOfMonth)),
      where("createdAt", "<", Timestamp.fromDate(endOfMonth))
    );

    const snap = await getDocs(q);
    document.getElementById("productsMonth").innerText = snap.size;
  } catch (err) {
    console.error("Error fetching monthly products:", err);
  }
}

// -------- Pie Chart Logic --------
async function loadProductGraph() {
  try {
    const snap = await getDocs(collection(db, "products"));
    const monthCount = {};

    snap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.createdAt) {
        const date = data.createdAt.toDate();
        const monthLabel = date.toLocaleString("default", { month: "short", year: "numeric" });
        monthCount[monthLabel] = (monthCount[monthLabel] || 0) + 1;
      }
    });

    const labels = Object.keys(monthCount);
    const values = Object.values(monthCount);

    const ctx = document.getElementById("productChart").getContext("2d");
    new Chart(ctx, {
      type: "pie",
      data: {
        labels: labels,
        datasets: [{
          label: "Products Per Month",
          data: values,
          backgroundColor: [
            "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444",
            "#14b8a6", "#84cc16", "#f97316", "#a855f7", "#22d3ee", "#e11d48", "#6366f1"
          ],
          borderColor: "#fff",
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        devicePixelRatio: 2,
        plugins: {
          legend: {
            position: "bottom",
            labels: { color: "#1e293b", font: { size: 12 } }
          },
          title: {
            display: true,
            text: "📦 Products Distribution by Month",
            color: "#1e293b",
            font: { size: 16, weight: "bold" }
          }
        }
      }
    });
  } catch (err) {
    console.error("Error loading pie chart:", err);
  }
}

// -------- Initialize Dashboard --------
function initDashboard() {
  fetchTotalUsers();
  fetchTotalProducts();
  fetchProductsInWeek();
  fetchProductsInMonth();
  loadProductGraph();
}
