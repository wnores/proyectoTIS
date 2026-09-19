import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import {
    collection,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    query, 
    where
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const CLOUDINARY_CLOUD_NAME = "fd9bzuxj";
const CLOUDINARY_UPLOAD_PRESET = "ProyectoTaller";

const contenidoAdministrador = document.getElementById("contenidoAdministrador");
const selectorCurso = document.getElementById("selectorCurso");
const formModificarCurso = document.getElementById("formModificarCurso");
const mensajeCurso = document.getElementById("mensajeCurso");
const btnGuardarCambios = document.getElementById("btnGuardarCambios");
const selectCategoria = document.getElementById("categoria");

const imagenCurso = document.getElementById("imagenCurso");
const nombreImagenCurso = document.getElementById("nombreImagenCurso");
const vistaPreviaCurso = document.getElementById("vistaPreviaCurso");

let cursoSeleccionadoId = null;
let archivoImagenCurso = null;
let urlImagenActual = "";

iniciarPagina();

if (imagenCurso) {
    imagenCurso.addEventListener("change", (event) => {
        const archivo = event.target.files[0];

        if (!archivo) {
            archivoImagenCurso = null;
            if (nombreImagenCurso) nombreImagenCurso.textContent = "No se seleccionó ninguna imagen nueva.";
            return;
        }

        archivoImagenCurso = archivo;
        if (nombreImagenCurso) nombreImagenCurso.textContent = archivo.name;

        if (vistaPreviaCurso) {
            vistaPreviaCurso.src = URL.createObjectURL(archivo);
            vistaPreviaCurso.classList.remove("d-none");
        }
    });
}

function iniciarPagina() {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            alert("Debés iniciar sesión para acceder.");
            window.location.href = "ingresar.html";
            return;
        }

        try {
            const docRef = doc(db, "usuarios", user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const datos = docSnap.data();
                const rol = (datos.tipoUsuario || datos.rol || "").toLowerCase().trim();

                if (rol.includes("admin") || rol.includes("docente")) {
                    if (contenidoAdministrador) {
                        contenidoAdministrador.classList.remove("d-none");
                    }
                    await cargarListaCursos();
                } else {
                    alert("No tenés permiso para modificar cursos.");
                    window.location.href = "catalogo.html";
                }
            } else {
                window.location.href = "catalogo.html";
            }
        } catch (error) {
            console.error("Error al validar permisos de administrador:", error);
            window.location.href = "catalogo.html";
        }
    });
}

async function cargarListaCursos() {
    try {
        const q = query(
            collection(db, "cursos"), 
            where("activo", "==", true)
        );

        const snapshot = await getDocs(q);
        const categoriasSet = new Set();

        if (selectorCurso) {
            selectorCurso.innerHTML = '<option value="">Selecciona un curso para editar</option>';
        }

        snapshot.forEach((docSnap) => {
            const curso = docSnap.data();

            if (selectorCurso) {
                const opcion = document.createElement("option");
                opcion.value = docSnap.id;
                opcion.textContent = curso.titulo || docSnap.id;
                selectorCurso.appendChild(opcion);
            }

            const cat = curso.categoria || curso.categorias;
            if (cat) {
                if (Array.isArray(cat)) {
                    cat.forEach((c) => c && categoriasSet.add(c.trim()));
                } else if (typeof cat === "string") {
                    categoriasSet.add(cat.trim());
                }
            }
        });

        if (selectCategoria) {
            selectCategoria.innerHTML = '<option value="">Seleccioná una categoría</option>';
            const categoriasOrdenadas = Array.from(categoriasSet).sort();
            categoriasOrdenadas.forEach((catNombre) => {
                const opcionCat = document.createElement("option");
                opcionCat.value = catNombre;
                opcionCat.textContent = catNombre;
                selectCategoria.appendChild(opcionCat);
            });
        }

    } catch (error) {
        console.error("Error al cargar los cursos activos:", error);
        mostrarMensaje("No se pudieron cargar los cursos activos.", "danger");
    }
}

if (selectorCurso) {
    selectorCurso.addEventListener("change", async () => {
        const id = selectorCurso.value;

        archivoImagenCurso = null;
        if (imagenCurso) imagenCurso.value = "";
        if (nombreImagenCurso) nombreImagenCurso.textContent = "No se seleccionó ninguna imagen nueva.";
        if (vistaPreviaCurso) {
            vistaPreviaCurso.classList.add("d-none");
            vistaPreviaCurso.removeAttribute("src");
        }

        if (!id) {
            if (formModificarCurso) formModificarCurso.classList.add("d-none");
            cursoSeleccionadoId = null;
            urlImagenActual = "";
            return;
        }

        try {
            const snap = await getDoc(doc(db, "cursos", id));

            if (!snap.exists()) {
                mostrarMensaje("El curso seleccionado ya no existe.", "danger");
                if (formModificarCurso) formModificarCurso.classList.add("d-none");
                return;
            }

            const curso = snap.data();
            cursoSeleccionadoId = id;
            urlImagenActual = curso.URL_imagen ?? curso.imagen_url ?? "";

            document.getElementById("titulo").value = curso.titulo ?? "";
            document.getElementById("descripcion").value = curso.descripcion ?? "";
            
            if (selectCategoria) {
                selectCategoria.value = curso.categoria ?? curso.categorias ?? "";
            }
            
            document.getElementById("precio").value = curso.precio ?? "";
            document.getElementById("duracion").value = curso.duracion_horas ?? "";
            document.getElementById("cupos").value = curso.cupos_disponibles ?? "";

            if (urlImagenActual && vistaPreviaCurso) {
                vistaPreviaCurso.src = urlImagenActual;
                vistaPreviaCurso.classList.remove("d-none");
                if (nombreImagenCurso) {
                    nombreImagenCurso.textContent = "Imagen actual del curso (elegí un archivo para reemplazarla).";
                }
            }

            if (formModificarCurso) formModificarCurso.classList.remove("d-none");
            if (mensajeCurso) mensajeCurso.classList.add("d-none");
        } catch (error) {
            console.error("Error al cargar el curso:", error);
            mostrarMensaje("No se pudo cargar el curso seleccionado.", "danger");
        }
    });
}

if (formModificarCurso) {
    formModificarCurso.addEventListener("submit", async (event) => {
        event.preventDefault();

        const usuario = auth.currentUser;
        if (!usuario) {
            mostrarMensaje("Debés iniciar sesión para modificar un curso.", "danger");
            return;
        }

        if (!cursoSeleccionadoId) {
            mostrarMensaje("Seleccioná un curso para modificar.", "danger");
            return;
        }

        const titulo = document.getElementById("titulo").value.trim();
        const descripcion = document.getElementById("descripcion").value.trim();
        const categoria = selectCategoria ? selectCategoria.value : "";
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
            mostrarMensaje("Revisá los datos ingresados en el formulario.", "danger");
            return;
        }

        if (btnGuardarCambios) {
            btnGuardarCambios.disabled = true;
            btnGuardarCambios.innerHTML = `
                <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Guardando...
            `;
        }

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
            if (imagenCurso) imagenCurso.value = "";
            if (nombreImagenCurso) nombreImagenCurso.textContent = "No se seleccionó ninguna imagen nueva.";

            mostrarMensaje("El curso fue modificado correctamente. Redirigiendo a administración...", "success");

            setTimeout(() => {
                window.location.href = "administrarCursos.html";
            }, 3000);

        } catch (error) {
            console.error("Error al modificar el curso:", error);
            mostrarMensaje("No se pudo modificar el curso. Intentá nuevamente.", "danger");
            
            if (btnGuardarCambios) {
                btnGuardarCambios.disabled = false;
                btnGuardarCambios.innerHTML = `
                    <i class="bi bi-check-circle-fill me-2"></i>
                    Guardar cambios
                `;
            }
        }
    });
}

function mostrarMensaje(texto, tipo) {
    if (mensajeCurso) {
        mensajeCurso.textContent = texto;
        mensajeCurso.className = `alert alert-${tipo}`;
        mensajeCurso.classList.remove("d-none");

        mensajeCurso.style.transition = "transform 0.2s ease, opacity 0.2s ease";
        mensajeCurso.style.transform = "scale(1.03)";
        setTimeout(() => {
            mensajeCurso.style.transform = "scale(1)";
        }, 200);

        mensajeCurso.scrollIntoView({ behavior: "smooth", block: "center" });
    }
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