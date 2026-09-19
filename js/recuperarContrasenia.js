import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { auth } from "./firebase-config.js";

const recoverForm = document.querySelector("#recoverForm");
const emailInput = document.querySelector("#email");
const messageBox = document.querySelector("#messageBox");
const btnSubmit = document.querySelector("#btnSubmit");

recoverForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const correo = emailInput.value.trim();

    btnSubmit.disabled = true;
    btnSubmit.textContent = "Enviando...";

    try {
        await sendPasswordResetEmail(auth, correo);

        messageBox.textContent = "Se envió un correo para cambiar la contraseña a la dirección proporcionada. Volverá a la página de iniciar sesión en unos segundos...";
        messageBox.className = "alert alert-success mt-3";
        
        recoverForm.reset();

        setTimeout(() => {
            window.location.href = "ingresar.html";
        }, 5000);

    } catch (error) {
        btnSubmit.disabled = false;
        btnSubmit.textContent = "Enviar";

        messageBox.className = "alert alert-danger mt-3";

        if (error.code === "auth/invalid-email") {
            messageBox.textContent = "El correo electrónico ingresado no es válido.";
        } else if (error.code === "auth/user-not-found") {
            messageBox.textContent = "No existe un usuario registrado con ese correo.";
        } else if (error.code === "auth/missing-email") {
            messageBox.textContent = "Ingresá una dirección de correo electrónico.";
        } else {
            messageBox.textContent = "No se pudo enviar el correo de recuperación. Intentá nuevamente.";
        }

        console.error("Error al recuperar la contraseña:", error.code);
    }
});