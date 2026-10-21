import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { cargarEstadisticas } from "./estadisticas.js";

const contenidoAdministrador = document.getElementById("contenidoAdministrador");

iniciarPagina();

function iniciarPagina() {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            mostrarAccesoDenegado("Debés iniciar sesión para acceder a este panel.", "ingresar.html");
            return;
        }

        try {
            const referenciaUsuario = doc(db, "usuarios", user.uid);
            const docSnap = await getDoc(referenciaUsuario);

            if (docSnap.exists()) {
                const datosUsuario = docSnap.data();
                const rol = (datosUsuario.tipoUsuario || datosUsuario.rol || "").toLowerCase().trim();

                if (rol.includes("docente/admin")) {
                    if (contenidoAdministrador) {
                        contenidoAdministrador.classList.remove("d-none");
                    }
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
    
    // Ocultar las secciones administrativas si estuvieran visibles
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
        <style>
            @keyframes entradaSmooth {
                0% { opacity: 0; transform: translateY(20px) scale(0.95); }
                100% { opacity: 1; transform: translateY(0) scale(1); }
            }
            @keyframes pulsoAtencion {
                0% { transform: scale(1); }
                50% { transform: scale(1.08); }
                100% { transform: scale(1); }
            }
            .card-microinteraccion {
                animation: entradaSmooth 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                border-radius: 1rem;
                background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
            }
            .icono-alerta-animado {
                animation: pulsoAtencion 1.8s infinite ease-in-out;
                display: inline-block;
            }
        </style>
        <div class="row justify-content-center my-5">
            <div class="col-12 col-md-8 col-lg-6">
                <div class="card border-0 shadow-lg text-center p-4 card-microinteraccion">
                    <div class="card-body">
                        <div class="mb-3">
                            <span class="icono-alerta-animado p-3 rounded-circle bg-danger bg-opacity-10 text-danger fs-1">
                                <i class="bi bi-shield-lock-fill"></i>
                            </span>
                        </div>
                        <h2 class="h4 fw-bold text-dark mb-2">Acceso Restringido</h2>
                        <p class="text-secondary mb-4">${mensaje}</p>
                        
                        <div class="d-flex justify-content-center align-items-center gap-2 mb-3">
                            <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                            <span class="small text-muted">Redirigiendo en unos segundos...</span>
                        </div>

                        <a href="${destinoRedireccion}" class="btn btn-primary btn-sm px-4 rounded-pill">
                            <i class="bi bi-house-door-fill me-1"></i> Ir ahora
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Redireccionar automáticamente después de 3.5 segundos
    setTimeout(() => {
        window.location.href = destinoRedireccion;
    }, 3500);
}