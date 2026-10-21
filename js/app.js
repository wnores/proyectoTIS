import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
    configurarNavegacionUsuario();
});

function configurarNavegacionUsuario() {
    const elementosDesconectado = document.querySelectorAll(".logged-out, #grupIngresar, #grupoRegistrarse");
    const elementosConectado = document.querySelectorAll(".logged-in, #grupoUsuario, #grupoNotificaciones");
    
    const nombreUsuario = document.getElementById("nombreUsuario");
    const btnCerrarSesion = document.getElementById("btnCerrarSesion");

    const itemMisCursos = document.getElementById("menuMisCursos");
    const itemAdminCursos = document.getElementById("menuAdminCursos");
    const itemsRequierenAdmin = document.querySelectorAll('[data-requiere-permiso="verPanelAdmin"]');

    onAuthStateChanged(auth, async (user) => {
        let rolUsuario = "estudiante";

        if (user) {
            // USUARIO CONECTADO: Ocultar botones de login y mostrar menú de usuario y notificaciones
            elementosDesconectado.forEach(el => el.classList.add("d-none"));
            elementosConectado.forEach(el => el.classList.remove("d-none"));

            try {
                const userDocRef = doc(db, "usuarios", user.uid);
                const userSnap = await getDoc(userDocRef);

                if (userSnap.exists()) {
                    const datosUsuario = userSnap.data();
                    rolUsuario = (datosUsuario.tipoUsuario || datosUsuario.rol || "").toLowerCase().trim();
                    const nombreCompleto = `${datosUsuario.nombre || ""} ${datosUsuario.apellido || ""}`.trim() || user.email;

                    if (nombreUsuario) {
                        nombreUsuario.textContent = nombreCompleto;
                    }

                    const esDocenteOAdmin = rolUsuario.includes("admin") || rolUsuario.includes("docente");

                    // Control de visibilidad del menú según el rol
                    if (esDocenteOAdmin) {
                        // Ocultar "Mis cursos" para Docente/Admin
                        if (itemMisCursos) itemMisCursos.classList.add("d-none");
                        // Mostrar "Administrar cursos"
                        if (itemAdminCursos) itemAdminCursos.classList.remove("d-none");
                        itemsRequierenAdmin.forEach(el => el.classList.remove("d-none"));
                    } else {
                        // Mostrar "Mis cursos" solo para Estudiantes
                        if (itemMisCursos) itemMisCursos.classList.remove("d-none");
                        // Ocultar "Administrar cursos"
                        if (itemAdminCursos) itemAdminCursos.classList.add("d-none");
                        itemsRequierenAdmin.forEach(el => el.classList.add("d-none"));
                    }
                } else {
                    if (nombreUsuario) nombreUsuario.textContent = user.displayName || user.email;
                }
            } catch (error) {
                console.error("Error al cargar datos de navegación del usuario:", error);
                if (nombreUsuario) nombreUsuario.textContent = user.displayName || user.email;
            }
        } else {
            // USUARIO DESCONECTADO: Mostrar botones de login/registro y ocultar menú de usuario y notificaciones
            elementosDesconectado.forEach(el => el.classList.remove("d-none"));
            elementosConectado.forEach(el => el.classList.add("d-none"));
            
            if (itemMisCursos) itemMisCursos.classList.add("d-none");
            if (itemAdminCursos) itemAdminCursos.classList.add("d-none");
            itemsRequierenAdmin.forEach(el => el.classList.add("d-none"));
        }

        // Actualizar redirección de botones "Ver curso" en las tarjetas
        actualizarEnlacesTarjetasCurso(rolUsuario);
    });

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
}

/**
 * Redirige el botón "Ver curso" a contenidoCurso.html para docente/admin
 * o a descripcionDeCurso.html para estudiante / público general.
 */
function actualizarEnlacesTarjetasCurso(rol) {
    const esDocenteOAdmin = rol.includes("admin") || rol.includes("docente");
    const botonesVerCurso = document.querySelectorAll(".destacados .btn-primary, .curso-card a.btn");

    botonesVerCurso.forEach((boton) => {
        const url = new URL(boton.href, window.location.origin);
        const cursoId = url.searchParams.get("id") || url.searchParams.get("curso");

        if (cursoId) {
            if (esDocenteOAdmin) {
                boton.href = `contenidoCurso.html?id=${cursoId}`;
            } else {
                boton.href = `descripcionDeCurso.html?id=${cursoId}`;
            }
        }
    });
}