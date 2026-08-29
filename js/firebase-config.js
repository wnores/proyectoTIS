import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCizvOiA2wnpRGr8H7UylELOZ850dah9aQ",
  authDomain: "bdcursos-8549a.firebaseapp.com",
  projectId: "bdcursos-8549a",
  storageBucket: "bdcursos-8549a.firebasestorage.app",
  messagingSenderId: "125252933034",
  appId: "1:125252933034:web:369ae2ad859521a91787d3",
  measurementId: "G-0QNHFT11C1"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Exportamos auth y db para poder usarlos desde otros archivos (registro.js, login.js, etc.)
export const auth = getAuth(app);
export const db = getFirestore(app);