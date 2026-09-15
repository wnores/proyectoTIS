import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBe3JTJXoPn-wo5g9IVzBGI-9ghSiF259Y",
  authDomain: "bdcursoscc.firebaseapp.com",
  projectId: "bdcursoscc",
  storageBucket: "bdcursoscc.firebasestorage.app",
  messagingSenderId: "253871349135",
  appId: "1:253871349135:web:43b58595f2f9042f2c7ffa",
  measurementId: "G-N47FZGJF2M"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);