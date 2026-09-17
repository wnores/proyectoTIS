
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

// Instancia del modal de Bootstrap
const modalEliminarEl = document.getElementById("modalEliminar");
const modalEliminar = new bootstrap.Modal(modalEliminarEl);
const nombreCursoEliminar = document.querySelector("#nombreCursoEliminar");
const btnConfirmarEliminar = document.querySelector("#btnConfirmarEliminar");

let cursoAEliminar = null; // Guardamos el id del curso seleccionado


async function cargarCursos() {
    try {
        const cursosRef = collection(db, "cursos");
        const snapshot = await getDocs(cursosRef);

        estadoCarga.classList.add("d-none");
        listadoCursos.innerHTML = "";

        // 🔥 Filtramos solo los cursos con activo === true
        const cursosActivos = [];
        snapshot.forEach((documento) => {
            const curso = documento.data();
            // Si el campo "activo" no existe, lo tratamos como activo por defecto
            const estaActivo = curso.activo !== false;
            if (estaActivo) {
                cursosActivos.push({ id: documento.id, ...curso });
            }
        });

        if (cursosActivos.length === 0) {
            mensajeVacio.classList.remove("d-none");
            contadorCursos.textContent = 0;
            return;
        }

        contenedorTabla.classList.remove("d-none");
        contadorCursos.textContent = cursosActivos.length;

        cursosActivos.forEach((curso) => {
            const fila = `
                <tr id="curso-${curso.id}">
                    <td class="fw-bold">${curso.titulo || "Sin nombre"}</td>
                    <td class="text-secondary small">${curso.descripcion || "Sin descripción"}</td>
                    <td><span class="badge text-bg-light border">${curso.categoria || "General"}</span></td>
                    <td class="text-end">$${curso.precio || 0}</td>
                    <td class="text-center">
                        <button 
                            class="btn btn-danger btn-sm btn-eliminar" 
                            data-id="${curso.id}" 
                            data-nombre="${curso.titulo || 'este curso'}">
                            <i class="bi bi-trash"></i> Eliminar
                        </button>
                    </td>
                </tr>
            `;

            listadoCursos.innerHTML += fila;
        });

        conectarBotonesEliminar();

    } catch (error) {
        console.error("Error al cargar cursos:", error);
        estadoCarga.innerHTML = `
            <div class="alert alert-danger">
                <strong>Error al cargar los cursos:</strong> ${error.message}
            </div>
        `;
    }
}


function conectarBotonesEliminar() {
    document.querySelectorAll(".btn-eliminar").forEach((boton) => {
        boton.addEventListener("click", () => {
            cursoAEliminar = boton.dataset.id;
            nombreCursoEliminar.textContent = boton.dataset.nombre;
            modalEliminar.show();
        });
    });
}


btnConfirmarEliminar.addEventListener("click", async () => {
    if (!cursoAEliminar) return;

    try {
        // 🔥 En lugar de borrar el documento, actualizamos el campo "activo"
        const cursoRef = doc(db, "cursos", cursoAEliminar);
        await updateDoc(cursoRef, {
            activo: false,
            fechaBaja: new Date().toISOString() // opcional: guardar cuándo se dio de baja
        });

        // Quitar la fila del DOM
        const fila = document.querySelector(`#curso-${cursoAEliminar}`);
        if (fila) fila.remove();

        // Actualizar contador
        const total = parseInt(contadorCursos.textContent, 10) - 1;
        contadorCursos.textContent = total;

        // Si no quedan cursos activos, mostrar mensaje vacío
        if (total === 0) {
            contenedorTabla.classList.add("d-none");
            mensajeVacio.classList.remove("d-none");
        }

        modalEliminar.hide();
        cursoAEliminar = null;

    } catch (error) {
        console.error("Error al dar de baja el curso:", error);
        alert("No se pudo dar de baja el curso: " + error.message);
    }
});


cargarCursos();