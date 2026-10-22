import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import {
    collection,
    getDocs,
    doc,
    getDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const contenidoDocente = document.querySelector("#contenidoDocente");
const listadoCursos = document.querySelector("#listadoCursos");
const contenedorTabla = document.querySelector("#contenedorTabla");
const estadoCarga = document.querySelector("#estadoCarga");
const mensajeVacio = document.querySelector("#mensajeVacio");
const contadorCursos = document.querySelector("#contadorCursos");
const paginacion = document.querySelector("#paginacion");

const modalEl = document.getElementById("modalEliminar");
const modal = new bootstrap.Modal(modalEl);
const modalTitulo = document.querySelector("#modalTitulo");
const modalMensaje = document.querySelector("#modalMensaje");
const modalDetalle = document.querySelector("#modalDetalle");
const nombreCursoEliminar = document.querySelector("#nombreCursoEliminar");
const btnConfirmarEliminar = document.querySelector("#btnConfirmarEliminar");

let todosLosCursos = [];                
let cursosFiltrados = [];               
let paginaActual = 1;
const CURSOS_POR_PAGINA = 5;           

let cursoSeleccionado = null;           
let accion = null;                        

iniciarVerificacion();

function iniciarVerificacion() {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            mostrarAccesoDenegado("Debés iniciar sesión para acceder a esta página.", "ingresar.html");
            return;
        }

        try {
            const referenciaUsuario = doc(db, "usuarios", user.uid);
            const docSnap = await getDoc(referenciaUsuario);

            if (docSnap.exists()) {
                const datosUsuario = docSnap.data();
                const rol = (datosUsuario.tipoUsuario || datosUsuario.rol || "").toLowerCase().trim();

                if (rol.includes("docente/admin")) {
                    if (contenidoDocente) {
                        contenidoDocente.classList.remove("d-none");
                    }
                    cargarCursos();
                } else {
                    mostrarAccesoDenegado("No tenés permisos para gestionar cursos.", "index.html");
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
    if (contenidoDocente) {
        contenidoDocente.classList.add("d-none");
    }

    const contenedorMensaje = document.getElementById("mensajeSinPermiso");
    if (!contenedorMensaje) return;

    contenedorMensaje.className = "container py-5";
    contenedorMensaje.classList.remove("d-none");
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

    setTimeout(() => {
        window.location.href = destinoRedireccion;
    }, 3500);
}

async function cargarCursos() {
    try {
        estadoCarga.classList.remove("d-none");
        contenedorTabla.classList.add("d-none");
        mensajeVacio.classList.add("d-none");

        const cursosRef = collection(db, "cursoscc");
        const snapshot = await getDocs(cursosRef);

        estadoCarga.classList.add("d-none");

        if (snapshot.empty) {
            mensajeVacio.classList.remove("d-none");
            contadorCursos.textContent = 0;
            paginacion.innerHTML = "";
            return;
        }

        todosLosCursos = [];
        snapshot.forEach((documento) => {
            const curso = documento.data();
            todosLosCursos.push({
                id: documento.id,
                ...curso,
                activo: curso.activo !== false
            });
        });

        todosLosCursos.sort((a, b) => (a.titulo || a.nombre || "").localeCompare(b.titulo || b.nombre || ""));

        cursosFiltrados = [...todosLosCursos];
        paginaActual = 1;

        renderizarPagina();

    } catch (error) {
        console.error("Error al cargar cursos de cursoscc:", error);
        estadoCarga.classList.remove("d-none");
        estadoCarga.innerHTML = `
            <div class="alert alert-danger">
                <strong>Error al cargar los cursos:</strong> ${error.message}
            </div>
        `;
    }
}

function renderizarPagina() {
    const totalPaginas = Math.ceil(cursosFiltrados.length / CURSOS_POR_PAGINA) || 1;

    if (paginaActual > totalPaginas) paginaActual = totalPaginas;
    if (paginaActual < 1) paginaActual = 1;

    const inicio = (paginaActual - 1) * CURSOS_POR_PAGINA;
    const fin = inicio + CURSOS_POR_PAGINA;
    const cursosPagina = cursosFiltrados.slice(inicio, fin);

    contadorCursos.textContent = cursosFiltrados.length;

    contenedorTabla.classList.remove("d-none");
    listadoCursos.innerHTML = "";

    cursosPagina.forEach((curso) => {
        const badgeEstado = curso.activo
            ? `<span class="badge text-bg-success">Activo</span>`
            : `<span class="badge text-bg-secondary">Inactivo</span>`;

        const botonAccion = curso.activo
            ? `<button class="btn btn-danger btn-sm btn-accion" 
                       data-id="${curso.id}" 
                       data-nombre="${curso.titulo || curso.nombre || 'este curso'}" 
                       data-activo="true">
                   <i class="bi bi-eye-slash"></i> Deshabilitar
               </button>`
            : `<button class="btn btn-success btn-sm btn-accion" 
                       data-id="${curso.id}" 
                       data-nombre="${curso.titulo || curso.nombre || 'este curso'}" 
                       data-activo="false">
                   <i class="bi bi-eye"></i> Habilitar
               </button>`;

        listadoCursos.innerHTML += `
        <tr id="curso-${curso.id}">
            <td data-label="Título" class="fw-bold">${curso.titulo || curso.nombre || "Sin título"}</td>
            <td data-label="Categoría">
                <span class="badge text-bg-light border">${curso.categoria || "General"}</span>
            </td>
            <td data-label="Estado" class="text-center">${badgeEstado}</td>
            <td data-label="Acciones" class="text-center">${botonAccion}</td>
        </tr>
    `;
    });

    conectarBotonesAccion();
    renderizarPaginacion(totalPaginas);
}

function renderizarPaginacion(totalPaginas) {
    paginacion.innerHTML = "";

    if (totalPaginas <= 1) return;

    paginacion.innerHTML += `
        <li class="page-item ${paginaActual === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-pagina="${paginaActual - 1}">Anterior</a>
        </li>
    `;

    for (let i = 1; i <= totalPaginas; i++) {
        paginacion.innerHTML += `
            <li class="page-item ${i === paginaActual ? 'active' : ''}">
                <a class="page-link" href="#" data-pagina="${i}">${i}</a>
            </li>
        `;
    }

    paginacion.innerHTML += `
        <li class="page-item ${paginaActual === totalPaginas ? 'disabled' : ''}">
            <a class="page-link" href="#" data-pagina="${paginaActual + 1}">Siguiente</a>
        </li>
    `;

    paginacion.querySelectorAll("a.page-link").forEach((link) => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const nueva = parseInt(link.dataset.pagina, 10);
            if (!isNaN(nueva) && nueva >= 1 && nueva <= totalPaginas) {
                paginaActual = nueva;
                renderizarPagina();
                contenedorTabla.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        });
    });
}

function conectarBotonesAccion() {
    document.querySelectorAll(".btn-accion").forEach((boton) => {
        boton.addEventListener("click", () => {
            const activo = boton.dataset.activo === "true";
            cursoSeleccionado = {
                id: boton.dataset.id,
                nombre: boton.dataset.nombre,
                activo: activo
            };
            accion = activo ? "deshabilitar" : "habilitar";

            nombreCursoEliminar.textContent = cursoSeleccionado.nombre;

            if (accion === "deshabilitar") {
                modalTitulo.textContent = "Confirmar deshabilitación";
                modalMensaje.textContent = "¿Está seguro de deshabilitar este curso?";
                modalDetalle.textContent = "El curso dejará de mostrarse en el catálogo público, pero seguirá guardado en la base de datos.";
                btnConfirmarEliminar.textContent = "Sí, deshabilitar";
                btnConfirmarEliminar.className = "btn btn-danger";
            } else {
                modalTitulo.textContent = "Confirmar habilitación";
                modalMensaje.textContent = "¿Está seguro de habilitar este curso?";
                modalDetalle.textContent = "El curso volverá a mostrarse en el catálogo público.";
                btnConfirmarEliminar.textContent = "Sí, habilitar";
                btnConfirmarEliminar.className = "btn btn-success";
            }

            modal.show();
        });
    });
}

btnConfirmarEliminar.addEventListener("click", async () => {
    if (!cursoSeleccionado || !accion) return;

    try {
        const cursoRef = doc(db, "cursoscc", cursoSeleccionado.id);
        const nuevoEstado = accion === "habilitar";

        await updateDoc(cursoRef, {
            activo: nuevoEstado,
            fechaCambioEstado: new Date().toISOString()
        });

        modal.hide();

        const cursoLocal = todosLosCursos.find(c => c.id === cursoSeleccionado.id);
        if (cursoLocal) cursoLocal.activo = nuevoEstado;

        renderizarPagina();

        cursoSeleccionado = null;
        accion = null;

    } catch (error) {
        console.error("Error al actualizar el curso en cursoscc:", error);
        alert("No se pudo actualizar el curso: " + error.message);
    }
});