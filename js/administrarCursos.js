import {
    obtenerRolActual,
    tienePermiso
} from "./roles.js";

const contenidoAdministrador =
    document.getElementById("contenidoAdministrador");

iniciarPagina();


async function iniciarPagina() {
    const rol = await obtenerRolActual();

    if (!rol) {
        alert("Debés iniciar sesión para acceder.");
        window.location.replace("ingresar.html");
        return;
    }

    if (!tienePermiso(rol, "verPanelAdmin")) {
        alert("No tenés permiso para administrar cursos.");
        window.location.replace("index.html");
        return;
    }

    contenidoAdministrador.classList.remove("d-none");
}