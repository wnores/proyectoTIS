import {auth, db } from "./firebase-config.js";

import { 
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

import {
    obtenerRolActual,
    tienePermiso
} from "./roles.js";

const contenidoAdministrador = document.getElementById("contenidoAdministrador");  
const formPublicarCurso = document.getElementById("formPublicarCurso");
const mensajeCurso= document.getElementById("mensajeCurso");
const btnPublicarCurso = document.getElementById("btnPublicarCurso");
const contenedorModulos = document.getElementById("contenedorModulos");
const btnAgregarModulo = document.getElementById("btnAgregarModulo");
const CLOUDINARY_CLOUD_NAME = "fd9bzuxj";
const CLOUDINARY_UPLOAD_PRESET = "ProyectoTaller";

const imagenCurso = document.getElementById("imagenCurso");
const nombreImagenCurso = document.getElementById("nombreImagenCurso");
const vistaPreviaCurso = document.getElementById("vistaPreviaCurso");

let archivoImagenCurso = null;

let cantidadModulos= 1;

iniciarPagina();

imagenCurso.addEventListener("change", (event) => {
    const archivo = event.target.files[0];

    if (!archivo) {
        archivoImagenCurso = null;
        nombreImagenCurso.textContent = "No se seleccionó ninguna imagen.";
        vistaPreviaCurso.classList.add("d-none");
        vistaPreviaCurso.removeAttribute("src");
        return;
    }

    archivoImagenCurso = archivo;
    nombreImagenCurso.textContent = archivo.name;

    vistaPreviaCurso.src = URL.createObjectURL(archivo);
    vistaPreviaCurso.classList.remove("d-none");
});

btnAgregarModulo.addEventListener("click", () => {
    cantidadModulos++;

    const nuevoModulo = document.createElement("div");
    nuevoModulo.className = "modulo-item mb-3";

    nuevoModulo.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <label class="form-label mb-0">
                Módulo ${cantidadModulos}
                <span class="text-danger">*</span>
            </label>

            <button
                type="button"
                class="btn btn-outline-danger btn-sm btnEliminarModulo">

                <i class="bi bi-trash3 me-1"></i>
                Eliminar
            </button>
        </div>

        <textarea
            class="form-control moduloCurso"
            rows="3"
            placeholder="Ingresá los temas del módulo"
            required></textarea>
    `;

    contenedorModulos.appendChild(nuevoModulo);
});

contenedorModulos.addEventListener("click", (event) => {
    const botonEliminar = event.target.closest(".btnEliminarModulo");

    if (!botonEliminar) {
        return;
    }

    const modulo = botonEliminar.closest(".modulo-item");
    modulo.remove();

    renumerarModulos();
});

function renumerarModulos() {
    const modulos = contenedorModulos.querySelectorAll(".modulo-item");

    modulos.forEach((modulo, indice) => {
        const etiqueta = modulo.querySelector("label");

        etiqueta.innerHTML = `
            Módulo ${indice + 1}
            <span class="text-danger">*</span>
        `;
    });

    cantidadModulos = modulos.length;
}

async function iniciarPagina() {
    const rol = await obtenerRolActual();

        if(!rol) {
            window.location.href = "ingresar.html";
            return;
        }
        if(!tienePermiso(rol, "crearCursos")) {
            alert("No tenés permiso para crear cursos.");
            window.location.href = "catalogo.html";
            return;
        }
        contenidoAdministrador.classList.remove("d-none");
        }
    
    
    formPublicarCurso.addEventListener("submit", async (event) => {
        event.preventDefault();

        const usuario = auth.currentUser;
        if(!usuario) {
            mostrarMensaje("Debés iniciar sesión para crear un curso.", "danger");
            return;
        }

        const rol = await obtenerRolActual();
            if(!tienePermiso(rol, "crearCursos")) {
            mostrarMensaje("No tenés permiso para crear cursos.", "danger");
            return;
        }
    const titulo = document.getElementById("titulo").value.trim();
    const descripcion = document.getElementById("descripcion").value.trim();
    const categoria = document.getElementById("categoria").value;
    const precio = Number(document.getElementById("precio").value);
    const duracionHoras = Number(document.getElementById("duracion").value);
    const cuposDisponibles = Number(document.getElementById("cupos").value);
        
    const camposModulos = document.querySelectorAll(".moduloCurso");
    const modulos = {};

    camposModulos.forEach((campo, indice) => {
        modulos[`modulo${indice + 1}`] = campo.value.trim();
    });

    const modulosCompletos = Object.values(modulos).every(
        (contenido) => contenido !== ""
    );

    



   
    if (
        !titulo ||
        !descripcion ||
        !categoria ||
        precio <= 0 ||
        duracionHoras <= 0 ||
        cuposDisponibles <= 0 ||
        !modulosCompletos
    ) {
        mostrarMensaje(
            "Revisá los datos ingresados en el formulario.",
            "danger"
        );
        return;
    }

    btnPublicarCurso.disabled = true;
    btnPublicarCurso.innerHTML = `
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        Creando...
    `;

    try {
        let imagenUrl="";
        if(archivoImagenCurso){
            imagenUrl= await subirImagenACloudinary(archivoImagenCurso);
        }

        await addDoc(collection(db, "cursos"), {
            titulo: titulo,
            descripcion: descripcion,
            categoria: categoria,
            precio: precio,
            duracion_horas: duracionHoras,
            cupos_disponibles: cuposDisponibles,
            URL_imagen: imagenUrl,
            modalidad: "Virtual",

            ...modulos,

            creadoPor: usuario.uid,
            creadoEn: serverTimestamp()
        });

        mostrarMensaje(
            "El curso fue creado correctamente.",
            "success"
        );

        formPublicarCurso.reset();

        archivoImagenCurso = null;
        nombreImagenCurso.textContent = "No se seleccionó ninguna imagen.";
        vistaPreviaCurso.classList.add("d-none");
        vistaPreviaCurso.removeAttribute("src");

        const modulosAgregados =
            contenedorModulos.querySelectorAll(".modulo-item:not(:first-child)");

        modulosAgregados.forEach((modulo) => modulo.remove());

        cantidadModulos = 1;

    } catch (error) {
        console.error("Error al crear el curso:", error);

        mostrarMensaje(
            "No se pudo crear el curso. Intentá nuevamente.",
            "danger"
        );

    } finally {
        btnPublicarCurso.disabled = false;
        btnPublicarCurso.innerHTML = `
            <i class="bi bi-cloud-arrow-up-fill me-2"></i>
            Crear curso
        `;
    }
});



    function mostrarMensaje(texto, tipo) {mensajeCurso.textContent = texto;
    mensajeCurso.className = `alert alert-${tipo}`;
}
async function subirImagenACloudinary(archivo) {
    const datosFormulario = new FormData();

    datosFormulario.append("file", archivo);
    datosFormulario.append(
        "upload_preset",
        CLOUDINARY_UPLOAD_PRESET
    );

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

