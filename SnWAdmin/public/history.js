import { db, auth, logout } from "./firebase.js";
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

// Removed unused firebaseConfig object

document.getElementById("logout").addEventListener("click", logout);

const historyTableBody = document.getElementById("historyTableBody");

// Function to load and display user's full name
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

// Wait for user authentication
onAuthStateChanged(auth, (user) => {
  if (user) {
    const loggedInUserId = localStorage.getItem("loggedInUserId");
    if (loggedInUserId) {
      loadUserName(loggedInUserId);
    }
    loadAllLogs(user);
  } else {
    // If not logged in or token expired, redirect
    window.location.href = "index.html";
  }
});

// Load all logs from Firestore
async function loadAllLogs(user) {
  historyTableBody.innerHTML = `<tr><td colspan="4">Loading logs...</td></tr>`;

  try {
    // Fetch from both collections safely
    const [historyLogs, productLogs] = await Promise.all([
      getCollectionData("history", "date"),
      getCollectionData("products", "createdAt") // Note: Product logs are still generated here, not ideal but matches original logic
    ]);

    // Combine and normalize both logs
    const allLogs = [
      ...historyLogs.map((log) => ({
        date: formatDate(log.date),
        user: log.userEmail || "Unknown",
        action: log.action || "User Action",
        details: log.details || ""
      })),
      ...productLogs.map((p) => ({
        // This logic is redundant if 'products' entries are now being logged to 'history' in product.js
        // However, keeping it for compatibility with old 'products' data that wasn't logged.
        date: formatDate(p.createdAt),
        user: user.email || "Unknown",
        action: "Added Product Entry (Old)", // Label old product creation logs
        details: `Customer: ${p.customer || "N/A"}, Ref#: ${p.reference || "N/A"}, Sales: ${p.salesCredit || "N/A"}`
      }))
    ];

    // Sort newest first
    allLogs.sort((a, b) => new Date(b.date) - new Date(a.date));

    renderTable(allLogs);
  } catch (err) {
    console.error("❌ Error loading logs:", err);
    historyTableBody.innerHTML = `<tr><td colspan="4" class="no-records">Error loading logs.</td></tr>`;
  }
}

// Helper to fetch a Firestore collection safely
async function getCollectionData(collectionName, orderField) {
  const data = [];
  try {
    const colRef = collection(db, collectionName);
    const q = query(colRef, orderBy(orderField, "desc"));
    const snapshot = await getDocs(q);
    snapshot.forEach((doc) => data.push(doc.data()));
  } catch (err) {
    console.warn(`⚠️ Could not load ${collectionName}:`, err);
  }
  return data;
}

// Format Firestore timestamps
function formatDate(ts) {
  if (!ts) return "";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleString();
}

// Render logs in the table
function renderTable(logs) {
  historyTableBody.innerHTML = "";
  if (!logs || logs.length === 0) {
    historyTableBody.innerHTML = `<tr><td colspan="4" class="no-records">No records found</td></tr>`;
    return;
  }

  logs.forEach((log) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${log.date}</td>
      <td>${log.user}</td>
      <td>${log.action}</td>
      <td>${log.details}</td>
    `;
    historyTableBody.appendChild(row);
  });
}