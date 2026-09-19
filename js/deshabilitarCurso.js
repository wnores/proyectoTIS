import { db } from "./firebase-config.js";
import {
    collection,
    getDocs,
    doc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


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


async function cargarCursos() {
    try {
        estadoCarga.classList.remove("d-none");
        contenedorTabla.classList.add("d-none");
        mensajeVacio.classList.add("d-none");

        const cursosRef = collection(db, "cursos");
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

        todosLosCursos.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));

        cursosFiltrados = [...todosLosCursos];
        paginaActual = 1;

        renderizarPagina();

    } catch (error) {
        console.error("Error al cargar cursos:", error);
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
                       data-nombre="${curso.titulo || 'este curso'}" 
                       data-activo="true">
                   <i class="bi bi-eye-slash"></i> Deshabilitar
               </button>`
            : `<button class="btn btn-success btn-sm btn-accion" 
                       data-id="${curso.id}" 
                       data-nombre="${curso.titulo || 'este curso'}" 
                       data-activo="false">
                   <i class="bi bi-eye"></i> Habilitar
               </button>`;

        listadoCursos.innerHTML += `
        <tr id="curso-${curso.id}">
            <td data-label="Título" class="fw-bold">${curso.titulo || "Sin título"}</td>
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
        const cursoRef = doc(db, "cursos", cursoSeleccionado.id);
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
        console.error("Error al actualizar el curso:", error);
        alert("No se pudo actualizar el curso: " + error.message);
    }
});

cargarCursos();