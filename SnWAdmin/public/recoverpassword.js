import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAuth, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

// Firebase config 
const firebaseConfig = {
  apiKey: "AIzaSyAHvQp4S5kIa-pMlts3niATdLoRggnVl6E",
  authDomain: "snwadmin-ca34c.firebaseapp.com",
  projectId: "snwadmin-ca34c",
  storageBucket: "snwadmin-ca34c.appspot.com",
  messagingSenderId: "155112691160",
  appId: "1:155112691160:web:b55a8dd14c5b3bfa8ecead"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const recoverBtn = document.getElementById("recoverBtn");
const recoverEmail = document.getElementById("recoverEmail");
const recoverMessage = document.getElementById("recoverMessage");

recoverBtn?.addEventListener("click", async () => {
  const email = recoverEmail.value.trim();
  if (!email) {
    recoverMessage.style.display = "block";
    recoverMessage.style.color = "red";
    recoverMessage.textContent = "⚠️ Please enter your email.";
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    recoverMessage.style.display = "block";
    recoverMessage.style.color = "green";
    recoverMessage.textContent = "✅ Password reset link sent! Check your email.";
  } catch (error) {
    recoverMessage.style.display = "block";
    recoverMessage.style.color = "red";
    recoverMessage.textContent = "❌ " + error.message;
  }
});
