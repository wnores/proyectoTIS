    import { signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
    import {
    doc,
    getDoc
    } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

    import { auth, db } from "./firebase-config.js"; 
    import {showMessage} from "./showMessage.js";

    const loginForm = document.querySelector('#loginForm');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const correo = document.querySelector('#correoInput').value;
        const password = document.querySelector('#passwordInput').value;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, correo, password);

            const user = userCredential.user;

            // Verificamos si el usuario está activo
            const userRef = doc(db, "usuarios", user.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists() && userSnap.data().activo === false) {
                // Deshabilitado: cerramos sesión y mostramos mensaje
                await signOut(auth);
                showMessage("Tu cuenta está deshabilitada. Contacta al administrador.", "error");
                return;
            }

            showMessage("Inicio de sesión exitoso: " + userCredential.user.email, "success");
            setTimeout(() => {
                window.location.href = "../index.html";
            }, 3000);

        } catch (error) {
            console.error("❌ Error completo en login:", error);
            console.error("Código:", error.code);
            console.error("Mensaje:", error.message);
            
            if(error.code === 'auth/user-not-found') {
                showMessage("El usuario no existe. Por favor, verifica tu correo.", "error");
            } else if(error.code === 'auth/wrong-password') {
                showMessage("La contraseña es incorrecta. Por favor, inténtalo de nuevo.", "error");
            } else if (error.code === 'permission-denied' || error.message?.includes("insufficient permissions")) {
                showMessage("Error de permisos. Contactá al administrador.", "error");
            } else {
                showMessage("Se produjo un error al iniciar sesión: " + error.message, "error");
            }
    }
    });
       