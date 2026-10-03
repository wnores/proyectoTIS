import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {
  const grupoIngresar = document.getElementById("grupIngresar");
  const grupoRegistrarse = document.getElementById("grupoRegistrarse");
  const grupoUsuario = document.getElementById("grupoUsuario");
  const nombreUsuario = document.getElementById("nombreUsuario");
  const menuAdminCursos = document.getElementById("menuAdminCursos");
  const menuMisCursos = document.getElementById("menuMisCursos");

  if (user) {
    if (grupoIngresar) grupoIngresar.classList.add("d-none");
    if (grupoRegistrarse) grupoRegistrarse.classList.add("d-none");
    if (grupoUsuario) grupoUsuario.classList.remove("d-none");

    try {
      const referenciaUsuario = doc(db, "usuarios", user.uid);
      const docSnap = await getDoc(referenciaUsuario);

      if (docSnap.exists()) {
        const datosUsuario = docSnap.data();

        if (nombreUsuario) {
          const nombreCompleto =
            `${datosUsuario.nombre || ""} ${datosUsuario.apellido || ""}`.trim();

          nombreUsuario.textContent =
            nombreCompleto ||
            user.displayName ||
            user.email.split("@")[0];
        }

        const rol = (
          datosUsuario.tipoUsuario ||
          datosUsuario.rol ||
          ""
        ).toLowerCase().trim();

        const esAdminODocente =
          rol.includes("docente") ||
          rol.includes("admin");

        // ADMINISTRAR CURSOS
        if (menuAdminCursos) {
          if (esAdminODocente) {
            menuAdminCursos.classList.remove("d-none");
          } else {
            menuAdminCursos.classList.add("d-none");
          }
        }

        // MIS CURSOS
        if (menuMisCursos) {
          if (esAdminODocente) {
            menuMisCursos.classList.add("d-none");
          } else {
            menuMisCursos.classList.remove("d-none");
          }
        }

      } else {
        if (nombreUsuario) {
          nombreUsuario.textContent =
            user.displayName ||
            user.email.split("@")[0];
        }

        // Si no existe el documento del usuario,
        // no mostramos opciones administrativas.
        if (menuAdminCursos) {
          menuAdminCursos.classList.add("d-none");
        }

        if (menuMisCursos) {
          menuMisCursos.classList.remove("d-none");
        }
      }

    } catch (error) {
      console.error(
        "Error al obtener datos del usuario desde Firestore:",
        error
      );

      if (nombreUsuario) {
        nombreUsuario.textContent =
          user.displayName ||
          user.email.split("@")[0];
      }

      if (menuAdminCursos) {
        menuAdminCursos.classList.add("d-none");
      }

      if (menuMisCursos) {
        menuMisCursos.classList.remove("d-none");
      }
    }

  } else {

    if (grupoIngresar) grupoIngresar.classList.remove("d-none");
    if (grupoRegistrarse) grupoRegistrarse.classList.remove("d-none");
    if (grupoUsuario) grupoUsuario.classList.add("d-none");

    if (menuAdminCursos) {
      menuAdminCursos.classList.add("d-none");
    }

    if (menuMisCursos) {
      menuMisCursos.classList.add("d-none");
    }
  }
});


document.addEventListener("DOMContentLoaded", () => {

  // CERRAR SESIÓN
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


  // BUSCADOR
  const formBuscador = document.getElementById("formBuscador");
  const inputBuscador = document.getElementById("inputBuscador");

  if (formBuscador && inputBuscador) {

    formBuscador.addEventListener("submit", (event) => {

      event.preventDefault();

      const texto = inputBuscador.value.trim();

      if (texto) {
        window.location.href =
          `resultados.html?buscar=${encodeURIComponent(texto)}`;
      }

    });

  }

});