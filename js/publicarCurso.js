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

iniciarPagina();

async function iniciarPagina() {
    const rol = await obtenerRolActual();

        if(!rol) {
            window.location.href = "ingresar.html";
            return;
        }
        if(!tienePermiso(rol, "crearCursos")) {
            alert("No tenés permiso para publicar cursos.");
            window.location.href = "catalogo.html";
            return;
        }
        contenidoAdministrador.classList.remove("d-none");
        }
    
    
    formPublicarCurso.addEventListener("submit", async (event) => {
        event.preventDefault();

        const usuario = auth.currentUser;
        if(!usuario) {
            mostrarMensaje("Debés iniciar sesión para publicar un curso.", "danger");
            return;
        }

        const rol = await obtenerRolActual();
            if(!tienePermiso(rol, "crearCursos")) {
            mostrarMensaje("No tenés permiso para publicar cursos.", "danger");
            return;
        }
    const titulo = document.getElementById("titulo").value.trim();
    const descripcion = document.getElementById("descripcion").value.trim();
    const categoria = document.getElementById("categoria").value;
    const precio = Number(document.getElementById("precio").value);
    const duracionHoras = Number(document.getElementById("duracion").value);
    const cuposDisponibles = Number(document.getElementById("cupos").value);
    const imagenUrl = document.getElementById("imagen").value.trim();

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

    btnPublicarCurso.disabled = true;
    btnPublicarCurso.innerHTML = `
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        Publicando...
    `;

    try {
        await addDoc(collection(db, "cursos"), {
            titulo: titulo,
            descripcion: descripcion,
            categoria: categoria,
            precio: precio,
            duracion_horas: duracionHoras,
            cupos_disponibles: cuposDisponibles,
            imagen_url: imagenUrl,
            creadoPor: usuario.uid,
            creadoEn: serverTimestamp()
        });

        mostrarMensaje(
            "El curso fue publicado correctamente.",
            "success"
        );

        formPublicarCurso.reset();

    } catch (error) {
        console.error("Error al publicar el curso:", error);

        mostrarMensaje(
            "No se pudo publicar el curso. Intentá nuevamente.",
            "danger"
        );

    } finally {
        btnPublicarCurso.disabled = false;
        btnPublicarCurso.innerHTML = `
            <i class="bi bi-cloud-arrow-up-fill me-2"></i>
            Publicar curso
        `;
    }
});


function mostrarMensaje(texto, tipo) {
    mensajeCurso.textContent = texto;
    mensajeCurso.className = `alert alert-${tipo}`;
}

