import { db, logout } from "./firebase.js";
import {
  collection,
  getDocs,
  getDoc,
  doc
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

const auth = getAuth();

// DOM Elements for Summary Totals
const totalSales = document.getElementById("totalSales");
const totalAR = document.getElementById("totalAR");
const totalCash = document.getElementById("totalCash");
const totalTax = document.getElementById("totalTax");
const totalEWT = document.getElementById("totalEWT");
const logoutBtn = document.getElementById("logout");

// Global array to store all product records for details view
let allProducts = []; 

// --- Utility Functions ---

/** Formats a number to Philippine Pesos (₱) with two decimal places. */
function formatCurrency(v) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? `₱${n.toFixed(2)}` : "₱0.00";
}

function getColumnTitle(key) {
  const titles = {
    date: "Date",
    customer: "Customer",
    reference: "Reference #",
    salesCredit: "Sales (Credit)",
    outputTax: "Output Tax",
    arDebit: "A/R Debit",
    arCredit: "A/R Credit",
    cashDebit: "Cash Payment",
    ewtCredit: "Total EWT",
    balance: "A/R Balance (Net)" 
  };
  return titles[key] || key;
}

// Main Logic 

// Logout
logoutBtn.addEventListener("click", logout);

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

// Check authentication and then run summary computation
onAuthStateChanged(auth, (user) => {
  if (user) {
    const loggedInUserId = localStorage.getItem("loggedInUserId");
    if (loggedInUserId) {
      loadUserName(loggedInUserId);
    }
    computeSummary().then(() => {
        // IMPORTANT: Set up listeners ONLY after data is fetched and stored in allProducts
        setupEventListeners(); 
    }).catch(err => {
        console.error("Initialization failed:", err);
    });
  } else {
    window.location.href = "index.html";
  }
});


// Fetch and compute totals
async function computeSummary() {
  try {
    const snapshot = await getDocs(collection(db, "products"));
    let sales = 0, ar = 0, cash = 0, tax = 0, ewt = 0;
    allProducts = []; 

    if (snapshot.empty) {
      console.warn("⚠️ No product records found in Firestore.");
      totalSales.textContent = "₱0.00";
      totalAR.textContent = "₱0.00";
      totalCash.textContent = "₱0.00";
      totalTax.textContent = "₱0.00";
      totalEWT.textContent = "₱0.00";
      return;
    }

    snapshot.forEach((doc) => {
      const data = doc.data();
      // Ensure all fields are treated as numbers, defaulting to 0
      const record = {
          id: doc.id,
          date: data.date || '',
          customer: data.customer || '',
          reference: data.reference || '',
          salesCredit: Number(data.salesCredit) || 0,
          outputTax: Number(data.outputTax) || 0,
          arDebit: Number(data.arDebit) || 0,
          arCredit: Number(data.arCredit) || 0,
          cashDebit: Number(data.cashDebit) || 0,
          ewtCredit: Number(data.ewtCredit) || 0,
      };
      
      allProducts.push(record);

      // Compute totals
      sales += record.salesCredit;
      tax += record.outputTax;
      ar += (record.arDebit - record.arCredit); 
      cash += record.cashDebit;
      ewt += record.ewtCredit;
    });

    totalSales.textContent = formatCurrency(sales);
    totalAR.textContent = formatCurrency(ar);
    totalCash.textContent = formatCurrency(cash);
    totalTax.textContent = formatCurrency(tax);
    totalEWT.textContent = formatCurrency(ewt);
    
  } catch (error) {
    console.error("❌ Error loading summary:", error);
    alert("Failed to load summary data. Check console for details.");
  }
}

// --- Detail View Logic ---

function setupEventListeners() {
    // Select the TR rows that are clickable
    document.querySelectorAll('.summary-row').forEach(row => {
        row.addEventListener('click', handleRowClick);
    });
}

function handleRowClick(e) {
    // e.currentTarget is the TR element with the summary-row class
    const row = e.currentTarget; 
    const dataType = row.dataset.type;
    // The details container is in the next sibling's TR, in the TD, which contains the details-section
    const detailsContainer = row.nextElementSibling.querySelector('.details-section');

    if (!detailsContainer) {
        console.error("Details container not found for row:", row);
        return;
    }

    // Close all other details sections
    document.querySelectorAll('.details-section').forEach(section => {
        if (section !== detailsContainer) {
            section.classList.remove('active');
        }
    });

    // Toggle the current section
    const isActive = detailsContainer.classList.contains('active');
    
    if (isActive) {
        detailsContainer.classList.remove('active');
    } else {
        // Generate/show details and activate the section
        showDetails(dataType, row.dataset.label, detailsContainer);
        detailsContainer.classList.add('active');
    }
}

function showDetails(dataType, title, container) {
    const contentDiv = container.querySelector('.details-content');
    let filteredRecords = [];
    let tableColumns = [];
    
    // Filter Records and Define Columns
    const baseColumns = ['date', 'customer', 'reference'];
    
    if (dataType === 'ar') {
        // A/R Balance: filter records where (arDebit - arCredit) != 0
        filteredRecords = allProducts.filter(p => (p.arDebit - p.arCredit) !== 0);
        // Display AR Debits, AR Credits, and the Net Balance column
        tableColumns = [...baseColumns, 'arDebit', 'arCredit', 'balance']; 
    } else {
        // Other Metrics: filter records where the metric field value > 0
        filteredRecords = allProducts.filter(p => p[dataType] > 0);
        // Display the specific metric column
        tableColumns = [...baseColumns, dataType]; 
    }
    
    // Generate HTML
    let html = `<h4>${title} Details (${filteredRecords.length} entries)</h4>`;

    if (filteredRecords.length === 0) {
        html += '<p>No records contribute to this total.</p>';
    } else {
        html += '<div style="overflow-x:auto;"><table class="details-table"><thead><tr>';
        
        // Table Header
        tableColumns.forEach(key => {
            html += `<th>${getColumnTitle(key)}</th>`;
        });
        html += '</tr></thead><tbody>';

        // Table Body
        filteredRecords.forEach(record => {
            html += '<tr>';
            tableColumns.forEach(key => {
                let cellContent;
                let value = record[key];

                if (key === 'balance') {
                    // Custom calculation for A/R balance
                    value = record.arDebit - record.arCredit;
                    cellContent = formatCurrency(value);
                } else if (['salesCredit', 'outputTax', 'arDebit', 'arCredit', 'cashDebit', 'ewtCredit'].includes(key)) {
                    // Format all currency fields
                    cellContent = formatCurrency(value);
                } else {
                    // Regular text fields
                    cellContent = value;
                }
                html += `<td>${cellContent}</td>`;
            });
            html += '</tr>';
        });

        html += '</tbody></table></div>';
    }

    //  Inject HTML
    contentDiv.innerHTML = html;
}