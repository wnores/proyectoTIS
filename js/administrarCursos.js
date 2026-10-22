import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { cargarEstadisticas } from "./estadisticas.js";

const ESTILOS = `
    @keyframes entradaModalSmooth {
        0% { opacity: 0; transform: scale(0.85) translateY(20px); }
        100% { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes pulsoIcono {
        0% { transform: scale(1); }
        50% { transform: scale(1.15); }
        100% { transform: scale(1); }
    }
    .modal-microinteraccion {
        animation: entradaModalSmooth 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        border-radius: 1.5rem !important;
        overflow: hidden;
    }
    .icono-animado-alerta {
        animation: pulsoIcono 1.6s infinite ease-in-out;
        display: inline-block;
    }
    .btn-microinteractivo {
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .btn-microinteractivo:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(0,0,0,0.15);
    }
    .btn-microinteractivo:active {
        transform: translateY(0);
    }
`;

if (!document.getElementById("estilosMicrointeraccionesCSS")) {
    const estilo = document.createElement("style");
    estilo.id = "estilosMicrointeraccionesCSS";
    estilo.textContent = ESTILOS;
    document.head.appendChild(estilo);
}

const contenidoAdministrador = document.getElementById("contenidoAdministrador");

iniciarPagina();

function iniciarPagina() {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            mostrarAccesoDenegado("Debés iniciar sesión para acceder a este panel.", "ingresar.html");
            return;
        }

        try {
            const docSnap = await getDoc(doc(db, "usuarios", user.uid));

            if (docSnap.exists()) {
                const datosUsuario = docSnap.data();
                const rol = (datosUsuario.tipoUsuario || datosUsuario.rol || "").toLowerCase().trim();

                if (rol.includes("docente/admin")) {
                    if (contenidoAdministrador) contenidoAdministrador.classList.remove("d-none");
                    cargarEstadisticas();
                    document.querySelector("#btnRefrescarStats")?.addEventListener("click", cargarEstadisticas);
                } else {
                    mostrarAccesoDenegado("No tenés permisos para administrar cursos.", "index.html");
                }
            } else {
                mostrarAccesoDenegado("No se encontraron los datos de tu usuario.", "index.html");
            }
        } catch (error) {
            console.error("Error al verificar permisos:", error);
            mostrarAccesoDenegado("Ocurrió un error al verificar tus permisos.", "index.html");
        }
    });
}

function mostrarAccesoDenegado(mensaje, destinoRedireccion) {
    if (!contenidoAdministrador) return;

    contenidoAdministrador.classList.remove("d-none");
    const secciones = contenidoAdministrador.querySelectorAll("section");
    secciones.forEach(sec => sec.classList.add("d-none"));

    let contenedorMensaje = document.getElementById("mensajeSinPermiso");
    if (!contenedorMensaje) {
        contenedorMensaje = document.createElement("div");
        contenedorMensaje.id = "mensajeSinPermiso";
        contenidoAdministrador.prepend(contenedorMensaje);
    }

    contenedorMensaje.className = "container py-5";
    contenedorMensaje.innerHTML = `
        <div class="row justify-content-center my-5">
            <div class="col-12 col-md-8 col-lg-6">
                <div class="card border-0 shadow-lg text-center p-4 modal-microinteraccion">
                    <div class="card-body">
                        <span class="p-3 rounded-circle bg-danger bg-opacity-10 text-danger fs-1 d-inline-block mb-3 icono-animado-alerta">
                            <i class="bi bi-shield-lock-fill"></i>
                        </span>
                        <h2 class="h4 fw-bold text-dark mb-2">Acceso restringido</h2>
                        <p class="text-secondary mb-4" id="textoAccesoDenegado"></p>
                        <a href="${destinoRedireccion}" class="btn btn-primary btn-sm px-4 rounded-pill btn-microinteractivo">Ir ahora</a>
                    </div>
                </div>
            </div>
        </div>
    `;
    contenedorMensaje.querySelector("#textoAccesoDenegado").textContent = mensaje;

    setTimeout(() => {
        window.location.href = destinoRedireccion;
    }, 3500);
}