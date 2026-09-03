import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBe3JTJXoPn-wo5g9IVzBGI-9ghSiF259Y",
    authDomain: "bdcursoscc.firebaseapp.com",
    projectId: "bdcursoscc",
    storageBucket: "bdcursoscc.firebasestorage.app",
    messagingSenderId: "253871349135",
    appId: "1:253871349135:web:43b58595f2f9042f2c7ffa",
    measurementId: "G-N47FZGJF2M"

};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);