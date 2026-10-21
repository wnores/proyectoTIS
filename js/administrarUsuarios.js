import { db, auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import {
    collection,
    getDocs,
    doc,
    getDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const buscadorUsuarios = document.querySelector("#buscadorUsuarios");
const filtroEstadoUsuarios = document.querySelector("#filtroEstadoUsuarios");
const btnLimpiarUsuarios = document.querySelector("#btnLimpiarUsuarios");
const contadorUsuarios = document.querySelector("#contadorUsuarios");
const cargandoUsuarios = document.querySelector("#cargandoUsuarios");
const sinUsuarios = document.querySelector("#sinUsuarios");
const contenedorTablaUsuarios = document.querySelector("#contenedorTablaUsuarios");
const listadoUsuarios = document.querySelector("#listadoUsuarios");
const paginacionUsuarios = document.querySelector("#paginacionUsuarios");

const modalUsuarioEl = document.getElementById("modalUsuario");
const modalUsuario = modalUsuarioEl ? new bootstrap.Modal(modalUsuarioEl) : null;
const modalUsuarioTitulo = document.querySelector("#modalUsuarioTitulo");
const modalUsuarioMensaje = document.querySelector("#modalUsuarioMensaje");
const modalUsuarioDetalle = document.querySelector("#modalUsuarioDetalle");
const nombreUsuarioAccion = document.querySelector("#nombreUsuarioAccion");
const btnConfirmarAccionUsuario = document.querySelector("#btnConfirmarAccionUsuario");

let todosLosUsuarios = [];
let usuariosFiltrados = [];
let paginaActual = 1;
const USUARIOS_POR_PAGINA = 10;

let usuarioSeleccionado = null;
let accionSeleccionada = null; 

async function cargarUsuarios() {
    if (!contenedorTablaUsuarios) return;

    try {
        cargandoUsuarios.classList.remove("d-none");
        contenedorTablaUsuarios.classList.add("d-none");
        sinUsuarios.classList.add("d-none");

        const usuariosRef = collection(db, "usuarios");
        const snapshot = await getDocs(usuariosRef);

        todosLosUsuarios = [];
        snapshot.forEach((documento) => {
            const data = documento.data();
            todosLosUsuarios.push({
                uid: documento.id,
                nombre: data.nombre || "",
                apellido: data.apellido || "",
                email: data.email || "",
                rol: data.rol || data.tipoUsuario || "estudiante",
                activo: data.activo !== false  // Si no existe, se asume activo
            });
        });

        todosLosUsuarios.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));

        cargandoUsuarios.classList.add("d-none");

        usuariosFiltrados = [...todosLosUsuarios];
        paginaActual = 1;
        renderizarPagina();

    } catch (error) {
        console.error("Error al cargar usuarios:", error);
        cargandoUsuarios.classList.add("d-none");
        sinUsuarios.textContent = "Error al cargar los usuarios: " + error.message;
        sinUsuarios.classList.remove("d-none");
    }
}

function aplicarFiltrosUsuarios() {
    const texto = buscadorUsuarios.value.trim().toLowerCase();
    const estado = filtroEstadoUsuarios.value;

    usuariosFiltrados = todosLosUsuarios.filter((u) => {
        const coincideTexto =
            !texto ||
            u.nombre.toLowerCase().includes(texto) ||
            u.apellido.toLowerCase().includes(texto) ||
            u.email.toLowerCase().includes(texto);

        const coincideEstado =
            estado === "todos" ||
            (estado === "activos" && u.activo) ||
            (estado === "inactivos" && !u.activo);

        return coincideTexto && coincideEstado;
    });

    paginaActual = 1;
    renderizarPagina();
}

function renderizarPagina() {
    const totalPaginas = Math.ceil(usuariosFiltrados.length / USUARIOS_POR_PAGINA) || 1;
    if (paginaActual > totalPaginas) paginaActual = totalPaginas;

    const inicio = (paginaActual - 1) * USUARIOS_POR_PAGINA;
    const fin = inicio + USUARIOS_POR_PAGINA;
    const usuariosPagina = usuariosFiltrados.slice(inicio, fin);

    contadorUsuarios.textContent = usuariosFiltrados.length;

    if (usuariosFiltrados.length === 0) {
        contenedorTablaUsuarios.classList.add("d-none");
        sinUsuarios.classList.remove("d-none");
        paginacionUsuarios.innerHTML = "";
        return;
    }

    sinUsuarios.classList.add("d-none");
    contenedorTablaUsuarios.classList.remove("d-none");

    listadoUsuarios.innerHTML = "";

    usuariosPagina.forEach((u) => {
        const badgeEstado = u.activo
            ? `<span class="badge text-bg-success">Activo</span>`
            : `<span class="badge text-bg-secondary">Inactivo</span>`;

        const botonAccion = u.activo
            ? `<button class="btn btn-danger btn-sm btn-accion-usuario"
                       data-uid="${u.uid}"
                       data-nombre="${u.nombre} ${u.apellido}"
                       data-activo="true">
                   <i class="bi bi-person-x"></i> Deshabilitar
               </button>`
            : `<button class="btn btn-success btn-sm btn-accion-usuario"
                       data-uid="${u.uid}"
                       data-nombre="${u.nombre} ${u.apellido}"
                       data-activo="false">
                   <i class="bi bi-person-check"></i> Habilitar
               </button>`;

        listadoUsuarios.innerHTML += `
            <tr>
                <td data-label="Nombre" class="fw-bold">
                    ${u.nombre} ${u.apellido}
                </td>
                <td data-label="Email" class="text-secondary small">
                    ${u.email}
                </td>
                <td data-label="Rol">
                    <span class="badge text-bg-light border text-capitalize">
                        ${u.rol}
                    </span>
                </td>
                <td data-label="Estado" class="text-center">
                    ${badgeEstado}
                </td>
                <td data-label="Acciones" class="text-center">
                    ${botonAccion}
                </td>
            </tr>
        `;
    });

    conectarBotonesAccion();
    renderizarPaginacion(totalPaginas);
}

function renderizarPaginacion(totalPaginas) {
    paginacionUsuarios.innerHTML = "";
    if (totalPaginas <= 1) return;

    paginacionUsuarios.innerHTML += `
        <li class="page-item ${paginaActual === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-pagina="${paginaActual - 1}">Anterior</a>
        </li>
    `;

    for (let i = 1; i <= totalPaginas; i++) {
        paginacionUsuarios.innerHTML += `
            <li class="page-item ${i === paginaActual ? 'active' : ''}">
                <a class="page-link" href="#" data-pagina="${i}">${i}</a>
            </li>
        `;
    }

    paginacionUsuarios.innerHTML += `
        <li class="page-item ${paginaActual === totalPaginas ? 'disabled' : ''}">
            <a class="page-link" href="#" data-pagina="${paginaActual + 1}">Siguiente</a>
        </li>
    `;

    paginacionUsuarios.querySelectorAll("a.page-link").forEach((link) => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const nueva = parseInt(link.dataset.pagina, 10);
            if (!isNaN(nueva) && nueva >= 1 && nueva <= totalPaginas) {
                paginaActual = nueva;
                renderizarPagina();
                contenedorTablaUsuarios.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        });
    });
}

function conectarBotonesAccion() {
    document.querySelectorAll(".btn-accion-usuario").forEach((boton) => {
        boton.addEventListener("click", () => {
            const activo = boton.dataset.activo === "true";
            usuarioSeleccionado = {
                uid: boton.dataset.uid,
                nombre: boton.dataset.nombre,
                activo
            };
            accionSeleccionada = activo ? "deshabilitar" : "habilitar";

            nombreUsuarioAccion.textContent = usuarioSeleccionado.nombre;

            if (accionSeleccionada === "deshabilitar") {
                modalUsuarioTitulo.textContent = "Confirmar deshabilitación";
                modalUsuarioMensaje.textContent = "¿Estás seguro de que querés deshabilitar a este usuario?";
                modalUsuarioDetalle.textContent = "El usuario no podrá iniciar sesión hasta que lo vuelvas a habilitar.";
                btnConfirmarAccionUsuario.textContent = "Sí, deshabilitar";
                btnConfirmarAccionUsuario.className = "btn btn-danger";
            } else {
                modalUsuarioTitulo.textContent = "Confirmar habilitación";
                modalUsuarioMensaje.textContent = "¿Querés volver a habilitar a este usuario?";
                modalUsuarioDetalle.textContent = "El usuario podrá volver a iniciar sesión con normalidad.";
                btnConfirmarAccionUsuario.textContent = "Sí, habilitar";
                btnConfirmarAccionUsuario.className = "btn btn-success";
            }

            if (modalUsuario) modalUsuario.show();
        });
    });
}

if (btnConfirmarAccionUsuario) {
    btnConfirmarAccionUsuario.addEventListener("click", async () => {
        if (!usuarioSeleccionado || !accionSeleccionada) return;

        try {
            const usuarioRef = doc(db, "usuarios", usuarioSeleccionado.uid);
            const nuevoEstado = accionSeleccionada === "habilitar";

            await updateDoc(usuarioRef, {
                activo: nuevoEstado,
                fechaCambioEstado: new Date().toISOString()
            });

            const usuarioLocal = todosLosUsuarios.find(u => u.uid === usuarioSeleccionado.uid);
            if (usuarioLocal) usuarioLocal.activo = nuevoEstado;

            if (modalUsuario) modalUsuario.hide();

            aplicarFiltrosUsuarios();

            usuarioSeleccionado = null;
            accionSeleccionada = null;

        } catch (error) {
            console.error("Error al cambiar estado del usuario:", error);
            alert("No se pudo actualizar el usuario: " + error.message);
        }
    });
}

if (buscadorUsuarios) {
    buscadorUsuarios.addEventListener("input", aplicarFiltrosUsuarios);
}
if (filtroEstadoUsuarios) {
    filtroEstadoUsuarios.addEventListener("change", aplicarFiltrosUsuarios);
}
if (btnLimpiarUsuarios) {
    btnLimpiarUsuarios.addEventListener("click", () => {
        buscadorUsuarios.value = "";
        filtroEstadoUsuarios.value = "todos";
        aplicarFiltrosUsuarios();
    });
}

onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    try {
        const userRef = doc(db, "usuarios", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const data = userSnap.data();
            const rol = (data.rol || data.tipoUsuario || "").toLowerCase();
            if (rol.includes("docente/admin")) {
                cargarUsuarios();
            }
        }
    } catch (error) {
        console.error("Error al verificar admin:", error);
    }
});