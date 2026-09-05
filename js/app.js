import { auth } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
  const grupoIngresar = document.getElementById("grupIngresar");
  const grupoRegistrarse = document.getElementById("grupoRegistrarse");
  const grupoUsuario = document.getElementById("grupoUsuario");
  const nombreUsuario = document.getElementById("nombreUsuario");

  if (user) {
    // Si hay usuario autenticado:
    if (nombreUsuario) {
      nombreUsuario.textContent = user.displayName || user.email.split("@")[0];
    }

    if (grupoIngresar) grupoIngresar.classList.add("d-none");
    if (grupoRegistrarse) grupoRegistrarse.classList.add("d-none");

    if (grupoUsuario) grupoUsuario.classList.remove("d-none");

  } else {
    if (grupoIngresar) grupoIngresar.classList.remove("d-none");
    if (grupoRegistrarse) grupoRegistrarse.classList.remove("d-none");
    if (grupoUsuario) grupoUsuario.classList.add("d-none");
  }
});
document.addEventListener("DOMContentLoaded", () => {
  const btnCerrarSesion = document.getElementById("btnCerrarSesion");
  
  if (btnCerrarSesion) {
    btnCerrarSesion.addEventListener("click", async () => {
      try {
        await signOut(auth);
        window.location.href = "index.html";
      } catch (error) {
        console.error("Error al cerrar sesión:", error);
      }
    });
  }
});