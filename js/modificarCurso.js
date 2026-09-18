import { auth, db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    doc,
    getDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

import {
    obtenerRolActual,
    tienePermiso
} from "./roles.js";

const CLOUDINARY_CLOUD_NAME = "fd9bzuxj";
const CLOUDINARY_UPLOAD_PRESET = "ProyectoTaller";

const contenidoAdministrador = document.getElementById("contenidoAdministrador");
const selectorCurso = document.getElementById("selectorCurso");
const formModificarCurso = document.getElementById("formModificarCurso");
const mensajeCurso = document.getElementById("mensajeCurso");
const btnGuardarCambios = document.getElementById("btnGuardarCambios");

const imagenCurso = document.getElementById("imagenCurso");
const nombreImagenCurso = document.getElementById("nombreImagenCurso");
const vistaPreviaCurso = document.getElementById("vistaPreviaCurso");

let cursoSeleccionadoId = null;
let archivoImagenCurso = null;
let urlImagenActual = "";

iniciarPagina();

imagenCurso.addEventListener("change", (event) => {
    const archivo = event.target.files[0];

    if (!archivo) {
        archivoImagenCurso = null;
        nombreImagenCurso.textContent = "No se seleccionó ninguna imagen nueva.";
        return;
    }

    archivoImagenCurso = archivo;
    nombreImagenCurso.textContent = archivo.name;

    vistaPreviaCurso.src = URL.createObjectURL(archivo);
    vistaPreviaCurso.classList.remove("d-none");
});

async function iniciarPagina() {
    const rol = await obtenerRolActual();

    if (!rol) {
        window.location.href = "ingresar.html";
        return;
    }
    if (!tienePermiso(rol, "editarCursos")) {
        alert("No tenés permiso para modificar cursos.");
        window.location.href = "catalogo.html";
        return;
    }

    contenidoAdministrador.classList.remove("d-none");
    await cargarListaCursos();
}

async function cargarListaCursos() {
    try {
        const snapshot = await getDocs(collection(db, "cursos"));

        snapshot.forEach((docSnap) => {
            const curso = docSnap.data();
            const opcion = document.createElement("option");
            opcion.value = docSnap.id;
            opcion.textContent = curso.titulo;
            selectorCurso.appendChild(opcion);
        });
    } catch (error) {
        console.error("Error al cargar los cursos:", error);
        mostrarMensaje("No se pudieron cargar los cursos.", "danger");
    }
}

selectorCurso.addEventListener("change", async () => {
    const id = selectorCurso.value;

    // Reiniciar el estado de la imagen cada vez que se cambia de curso
    archivoImagenCurso = null;
    imagenCurso.value = "";
    nombreImagenCurso.textContent = "No se seleccionó ninguna imagen nueva.";
    vistaPreviaCurso.classList.add("d-none");
    vistaPreviaCurso.removeAttribute("src");

    if (!id) {
        formModificarCurso.classList.add("d-none");
        cursoSeleccionadoId = null;
        urlImagenActual = "";
        return;
    }

    try {
        const snap = await getDoc(doc(db, "cursos", id));

        if (!snap.exists()) {
            mostrarMensaje("El curso seleccionado ya no existe.", "danger");
            formModificarCurso.classList.add("d-none");
            return;
        }

        const curso = snap.data();
        cursoSeleccionadoId = id;
        urlImagenActual = curso.URL_imagen ?? curso.imagen_url ?? "";

        document.getElementById("titulo").value = curso.titulo ?? "";
        document.getElementById("descripcion").value = curso.descripcion ?? "";
        document.getElementById("categoria").value = curso.categoria ?? "";
        document.getElementById("precio").value = curso.precio ?? "";
        document.getElementById("duracion").value = curso.duracion_horas ?? "";
        document.getElementById("cupos").value = curso.cupos_disponibles ?? "";

        if (urlImagenActual) {
            vistaPreviaCurso.src = urlImagenActual;
            vistaPreviaCurso.classList.remove("d-none");
            nombreImagenCurso.textContent = "Imagen actual del curso (elegí un archivo para reemplazarla).";
        }

        formModificarCurso.classList.remove("d-none");
        mensajeCurso.classList.add("d-none");
    } catch (error) {
        console.error("Error al cargar el curso:", error);
        mostrarMensaje("No se pudo cargar el curso seleccionado.", "danger");
    }
});

formModificarCurso.addEventListener("submit", async (event) => {
    event.preventDefault();

    const usuario = auth.currentUser;
    if (!usuario) {
        mostrarMensaje("Debés iniciar sesión para modificar un curso.", "danger");
        return;
    }

    const rol = await obtenerRolActual();
    if (!tienePermiso(rol, "editarCursos")) {
        mostrarMensaje("No tenés permiso para modificar cursos.", "danger");
        return;
    }

    if (!cursoSeleccionadoId) {
        mostrarMensaje("Seleccioná un curso para modificar.", "danger");
        return;
    }

    const titulo = document.getElementById("titulo").value.trim();
    const descripcion = document.getElementById("descripcion").value.trim();
    const categoria = document.getElementById("categoria").value;
    const precio = Number(document.getElementById("precio").value);
    const duracionHoras = Number(document.getElementById("duracion").value);
    const cuposDisponibles = Number(document.getElementById("cupos").value);

    if (
        !titulo ||
        !descripcion ||
        !categoria ||
        precio < 0 ||
        duracionHoras <= 0 ||
        cuposDisponibles <= 0
    ) {
        mostrarMensaje(
            "Revisá los datos ingresados en el formulario.",
            "danger"
        );
        return;
    }

    btnGuardarCambios.disabled = true;
    btnGuardarCambios.innerHTML = `
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        Guardando...
    `;

    try {
        let urlImagenFinal = urlImagenActual;

        if (archivoImagenCurso) {
            urlImagenFinal = await subirImagenACloudinary(archivoImagenCurso);
        }

        await updateDoc(doc(db, "cursos", cursoSeleccionadoId), {
            titulo: titulo,
            descripcion: descripcion,
            categoria: categoria,
            precio: precio,
            duracion_horas: duracionHoras,
            cupos_disponibles: cuposDisponibles,
            URL_imagen: urlImagenFinal
        });

        urlImagenActual = urlImagenFinal;
        archivoImagenCurso = null;
        imagenCurso.value = "";
        nombreImagenCurso.textContent = "No se seleccionó ninguna imagen nueva.";

        mostrarMensaje(
            "El curso fue modificado correctamente.",
            "success"
        );

    } catch (error) {
        console.error("Error al modificar el curso:", error);

        mostrarMensaje(
            "No se pudo modificar el curso. Intentá nuevamente.",
            "danger"
        );

    } finally {
        btnGuardarCambios.disabled = false;
        btnGuardarCambios.innerHTML = `
            <i class="bi bi-check-circle-fill me-2"></i>
            Guardar cambios
        `;
    }
});

function mostrarMensaje(texto, tipo) {
    mensajeCurso.textContent = texto;
    mensajeCurso.className = `alert alert-${tipo}`;
}

async function subirImagenACloudinary(archivo) {
    const datosFormulario = new FormData();

    datosFormulario.append("file", archivo);
    datosFormulario.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const respuesta = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
            method: "POST",
            body: datosFormulario
        }
    );

    if (!respuesta.ok) {
        throw new Error("No se pudo subir la imagen.");
    }

    const datos = await respuesta.json();

    return datos.secure_url;
}