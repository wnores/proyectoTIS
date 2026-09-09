    import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
    import { auth } from "./firebase-config.js"; 
    import {showMessage} from "./showMessage.js";

    const loginForm = document.querySelector('#loginForm');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const correo = document.querySelector('#correoInput').value;
        const password = document.querySelector('#passwordInput').value;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, correo, password);
            showMessage("Inicio de sesión exitoso: " + userCredential.user.email, "success");
            setTimeout(() => {
                window.location.href = "../index.html";
            }, 3000);
        } catch (error) {
            if(error.code === 'auth/user-not-found') {
                showMessage("El usuario no existe. Por favor, verifica tu correo.", "error");
            } else if(error.code === 'auth/wrong-password') {
                showMessage("La contraseña es incorrecta. Por favor, inténtalo de nuevo.", "error");
            } else {
                showMessage("Se produjo un error al iniciar sesión.", "error");
            }
        }
    });
       