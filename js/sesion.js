import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const grupoIngresar = document.getElementById("grupoIngresar");
const grupoRegistrarse = document.getElementById("grupoRegistrarse");
const grupoUsuario = document.getElementById("grupoUsuario");
const nombreUsuarioSpan = document.getElementById("nombreUsuario");
const btnCerrarSesion = document.getElementById("btnCerrarSesion");

onAuthStateChanged(auth, async (usuario) => {
  if (usuario) {
    // Hay sesión: mostrar el nombre del usuario y ocultar los botones de ingresar/registrarse
    if (grupoIngresar) grupoIngresar.classList.add("d-none");
    if (grupoRegistrarse) grupoRegistrarse.classList.add("d-none");
    if (grupoUsuario) grupoUsuario.classList.remove("d-none");

    try {
      const perfilSnap = await getDoc(doc(db, "usuarios", usuario.uid));
      if (perfilSnap.exists() && nombreUsuarioSpan) {
        nombreUsuarioSpan.textContent = perfilSnap.data().nombre;
      }
    } catch (error) {
      console.error("No se pudo obtener el perfil del usuario:", error);
    }

  } else {
    // No hay sesión: mostrar los botones normales
    if (grupoIngresar) grupoIngresar.classList.remove("d-none");
    if (grupoRegistrarse) grupoRegistrarse.classList.remove("d-none");
    if (grupoUsuario) grupoUsuario.classList.add("d-none");
  }
});

if (btnCerrarSesion) {
  btnCerrarSesion.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "index.html";
  });
}