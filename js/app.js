import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { auth } from "./firebase.js";
import { showMessage } from "./showMessage.js";

// Función que actualiza la visibilidad según el estado de sesión
function actualizarUI(user) {
    const loggedInElements = document.querySelectorAll('.logged-in');
    const loggedOutElements = document.querySelectorAll('.logged-out');

    // Si hay usuario: mostrar botón cerrar sesión, ocultar botón ingresar
    loggedInElements.forEach(el => el.classList.toggle('d-none', !user));
    // Si no hay usuario: mostrar botón ingresar, ocultar botón cerrar sesión
    loggedOutElements.forEach(el => el.classList.toggle('d-none', !!user));
}

// Escuchar cambios en el estado de autenticación
onAuthStateChanged(auth, (user) => {

    console.log("Estado de autenticación detectado:", user); // Esto imprime todo el objeto o null

    if (user) {
        console.log("Usuario logueado:", user.email);
        // Aquí tu lógica para mostrar el botón "Cerrar Sesión"
    } else {
        console.log("Sin usuario logueado");
        // Aquí tu lógica para mostrar el botón "Ingresar"
    }
    
    actualizarUI(user);
});

// Cerrar sesión al hacer clic
const btnCerrarSesion = document.querySelector('#btnCerrarSesion');
if (btnCerrarSesion) {
    btnCerrarSesion.addEventListener('click', async () => {
        try {
            await signOut(auth);
            showMessage("Sesión cerrada correctamente.", "success");
            
            window.location.href = "index.html";
        } catch (error) {
            showMessage("Error al cerrar sesión: " + error.message, "error");
        }
    });
}