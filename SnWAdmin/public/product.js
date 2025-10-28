import { db, auth, logout } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

const saveRowBtn = document.getElementById("saveRowBtn");
const logoutBtn = document.getElementById("logout");
const savedTableBody = document.querySelector("#savedTable tbody");
const searchInput = document.getElementById("searchInput");
const searchReference = document.getElementById("searchReference");
const searchBtn = document.getElementById("searchBtn");

logoutBtn.addEventListener("click", logout);

let allRecords = [];

// History Logging Function (Copied from profile.js logic)
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

onAuthStateChanged(auth, (user) => {
  if (user) {
    const loggedInUserId = localStorage.getItem("loggedInUserId");
    if (loggedInUserId) {
      loadUserName(loggedInUserId); // Display user name
    }
    loadRecords();
  }
  else window.location.href = "index.html";
});

saveRowBtn.addEventListener("click", saveRow);

function numberOrNull(value) {
  if (value === "" || value === null || value === undefined) return null;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

async function saveRow() {
  const user = auth.currentUser; // Get current user for logging

  const date = document.getElementById("date").value;
  const customer = document.getElementById("customer").value.trim();
  const tin = document.getElementById("tin").value.trim();
  const address = document.getElementById("address").value.trim();
  const reference = document.getElementById("reference").value.trim();

  const salesCredit = numberOrNull(document.getElementById("salesCredit").value);
  const outputTax = numberOrNull(document.getElementById("outputTax").value);
  const arDebit = numberOrNull(document.getElementById("arDebit").value);
  const arCredit = numberOrNull(document.getElementById("arCredit").value) || 0;
  const cashDebit = numberOrNull(document.getElementById("cashDebit").value) || 0;
  const ewtCredit = numberOrNull(document.getElementById("ewtCredit").value) || 0;

  const missing = [];
  if (!date) missing.push("Date");
  if (!customer) missing.push("Customer");
  if (!reference) missing.push("Reference #");

  if (missing.length > 0) {
    alert("⚠️ Please fill out required fields:\n\n• " + missing.join("\n• "));
    return;
  }

  const data = {
    date,
    customer,
    tin: tin || "",
    address: address || "",
    reference,
    salesCredit: salesCredit ?? 0,
    outputTax: outputTax ?? 0,
    arDebit: arDebit ?? 0,
    arCredit,
    cashDebit,
    ewtCredit,
    createdAt: serverTimestamp()
  };

  try {
    const docRef = await addDoc(collection(db, "products"), data);
    data.id = docRef.id;
    data.createdAt = new Date().toISOString();
    allRecords.unshift(data);
    renderTable(allRecords);
    document.querySelectorAll("#productTable input").forEach(i => (i.value = ""));
    
    // 🆕 Log the product addition
    await logHistory(user, "Added Product", `Customer: ${customer}, Ref#: ${reference}, Sales: ${data.salesCredit ?? 0}`);

    alert("✅ Record saved successfully!");
  } catch (err) {
    console.error("Error:", err);
  }
}

async function loadRecords() {
  savedTableBody.innerHTML = "";
  const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  allRecords = [];
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    data.id = docSnap.id;
    if (data.createdAt?.toDate) data.createdAt = data.createdAt.toDate().toISOString();
    allRecords.push(data);
  });
  renderTable(allRecords);
}

// ... (renderTable, formatNumber, escapeHtml functions remain unchanged)
function renderTable(records) {
  savedTableBody.innerHTML = "";
  if (!records.length) {
    savedTableBody.innerHTML = `<tr class="no-records"><td colspan="12">No records found</td></tr>`;
    return;
  }

  records.forEach(data => {
    const row = document.createElement("tr");
    row.dataset.id = data.id;
    row.innerHTML = `
      <td>${data.date}</td>
      <td>${escapeHtml(data.customer)}</td>
      <td>${escapeHtml(data.tin)}</td>
      <td>${escapeHtml(data.address)}</td>
      <td>${escapeHtml(data.reference)}</td>
      <td>${formatNumber(data.salesCredit)}</td>
      <td>${formatNumber(data.outputTax)}</td>
      <td>${formatNumber(data.arDebit)}</td>
      <td>${formatNumber(data.arCredit)}</td>
      <td>${formatNumber(data.cashDebit)}</td>
      <td>${formatNumber(data.ewtCredit)}</td>
      <td>
        <button class="action-btn edit-btn">Edit</button>
        <button class="action-btn delete-btn">Delete</button>
      </td>
    `;
    savedTableBody.appendChild(row);
  });

  document.querySelectorAll(".edit-btn").forEach(btn => btn.addEventListener("click", editRecord));
  document.querySelectorAll(".delete-btn").forEach(btn => btn.addEventListener("click", deleteRecord));
}

function formatNumber(v) {
  if (v === null || v === undefined || v === "") return "0.00";
  const n = parseFloat(v);
  return Number.isFinite(n) ? n.toFixed(2) : "0.00";
}

function escapeHtml(text = "") {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
// Edit Record
function editRecord(e) {
  const row = e.target.closest("tr");
  const id = row.dataset.id;
  const data = allRecords.find(r => r.id === id);
  if (!data) return;

  row.innerHTML = `
    <td><input type="date" value="${data.date}"></td>
    <td><input type="text" value="${data.customer}"></td>
    <td><input type="text" value="${data.tin}"></td>
    <td><input type="text" value="${data.address}"></td>
    <td><input type="text" value="${data.reference}"></td>
    <td><input type="number" step="0.01" value="${data.salesCredit}"></td>
    <td><input type="number" step="0.01" value="${data.outputTax}"></td>
    <td><input type="number" step="0.01" value="${data.arDebit}"></td>
    <td><input type="number" step="0.01" value="${data.arCredit}"></td>
    <td><input type="number" step="0.01" value="${data.cashDebit}"></td>
    <td><input type="number" step="0.01" value="${data.ewtCredit}"></td>
    <td>
      <button class="action-btn edit-btn save-btn">Save</button>
      <button class="action-btn delete-btn cancel-btn">Cancel</button>
    </td>
  `;
  row.querySelector(".save-btn").addEventListener("click", () => saveEdit(row, id));
  row.querySelector(".cancel-btn").addEventListener("click", () => renderTable(allRecords));
}

// Save Edited Record
async function saveEdit(row, id) {
  const user = auth.currentUser; // Get current user for logging

  const inputs = row.querySelectorAll("input");
  const updated = {
    date: inputs[0].value,
    customer: inputs[1].value.trim(),
    tin: inputs[2].value.trim(),
    address: inputs[3].value.trim(),
    reference: inputs[4].value.trim(),
    salesCredit: parseFloat(inputs[5].value) || 0,
    outputTax: parseFloat(inputs[6].value) || 0,
    arDebit: parseFloat(inputs[7].value) || 0,
    arCredit: parseFloat(inputs[8].value) || 0,
    cashDebit: parseFloat(inputs[9].value) || 0,
    ewtCredit: parseFloat(inputs[10].value) || 0
  };

  if (!updated.date || !updated.customer || !updated.reference) {
    alert("⚠️ Please fill required fields (Date, Customer, Reference).");
    return;
  }

  try {
    await updateDoc(doc(db, "products", id), updated);
    const index = allRecords.findIndex(r => r.id === id);
    if (index !== -1) allRecords[index] = { ...allRecords[index], ...updated };
    renderTable(allRecords);
    
    // 🆕 Log the product update
    await logHistory(user, "Updated Product", `Ref#: ${updated.reference}, Customer: ${updated.customer}`);

    alert("✅ Record updated!");
  } catch (err) {
    console.error("Update failed:", err);
  }
}

// Delete Record
async function deleteRecord(e) {
  const user = auth.currentUser; // Get current user for logging
  const row = e.target.closest("tr");
  const id = row.dataset.id;
  const record = allRecords.find(r => r.id === id); // Find record before deletion

  if (!confirm("Are you sure you want to delete this record?")) return;

  try {
    await deleteDoc(doc(db, "products", id));
    allRecords = allRecords.filter(r => r.id !== id);
    renderTable(allRecords);
    
    // 🆕 Log the product deletion
    const details = record ? `Ref#: ${record.reference}, Customer: ${record.customer}` : `ID: ${id}`;
    await logHistory(user, "Deleted Product", details);

    alert("🗑️ Record deleted successfully!");
  } catch (err) {
    console.error("Delete failed:", err);
  }
}

// Search Record
searchBtn.addEventListener("click", () => {
  const nameQuery = searchInput.value.trim().toLowerCase();
  const refQuery = searchReference.value.trim().toLowerCase();

  const filtered = allRecords.filter(r =>
    (r.customer || "").toLowerCase().includes(nameQuery) &&
    (r.reference || "").toLowerCase().includes(refQuery)
  );
  renderTable(filtered);
});

[searchInput, searchReference].forEach(input => {
  input.addEventListener("keyup", (e) => {
    if (e.key === "Enter") searchBtn.click();
    if (!searchInput.value && !searchReference.value) renderTable(allRecords);
  });
});