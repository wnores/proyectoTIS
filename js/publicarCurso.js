import {
    obtenerRolActual,
    tienePermiso
} from "./roles.js";

document.addEventListener("DOMContentLoaded", async () => {
    const contenidoAdministrador =
        document.getElementById("contenidoAdministrador");

    try {
        const rol = await obtenerRolActual();

        // No tiene una sesión iniciada
        if (rol === null) {
            alert("Debés iniciar sesión para acceder a esta página.");
            window.location.replace("ingresar.html");
            return;
        }

        // Tiene sesión, pero no tiene permiso de administrador
        if (!tienePermiso(rol, "crearCursos")) {
            alert("No tenés permiso para publicar cursos.");
            window.location.replace("index.html");
            return;
        }

        // Es docente/admin: mostrar el formulario
        contenidoAdministrador.classList.remove("d-none");

    } catch (error) {
        console.error("Error al comprobar el rol:", error);

        alert("No se pudo verificar el acceso a esta página.");
        window.location.replace("index.html");
    }
});