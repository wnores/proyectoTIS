import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyD5dSvrBg84nOC3C5Ko3Qfug4buNRsiYNM",
    authDomain: "myfirstproyecto-932eb.firebaseapp.com",
    databaseURL: "https://myfirstproyecto-932eb-default-rtdb.firebaseio.com",
    projectId: "myfirstproyecto-932eb",
    storageBucket: "myfirstproyecto-932eb.firebasestorage.app",
    messagingSenderId: "22026012138",
    appId: "1:22026012138:web:71319e94cf91641adc5e93"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);