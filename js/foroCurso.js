import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { 
    collection, 
    addDoc, 
    doc, 
    getDoc, 
    getDocs,
    query, 
    where, 
    onSnapshot,
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

let usuarioActual = null;
let datosUsuarioActual = null;
let rolActual = "estudiante";
let cursoIdActual = null;
let cursoTituloActual = "";
let desuscripcionForo = null;

document.addEventListener("DOMContentLoaded", () => {
    const parametros = new URLSearchParams(window.location.search);
    cursoIdActual = parametros.get("id") || parametros.get("curso");

    if (!cursoIdActual) {
        window.location.href = "index.html";
        return;
    }

    configurarNavegacionEnlace();
    inicializarForo();
});

function configurarNavegacionEnlace() {
    const enlaceContenido = document.getElementById("enlaceContenidoCurso");
    if (enlaceContenido) {
        enlaceContenido.href = `contenidoCurso.html?id=${cursoIdActual}`;
    }
}

function esUsuarioAdminODocente(rol) {
    if (!rol) return false;
    const r = rol.toLowerCase().trim();
    return r.includes("admin") || r.includes("docente") || r.includes("profesor");
}

function inicializarForo() {
    const contenedorPrincipal = document.getElementById("contenedorPrincipalVista");
    const estadoCarga = document.getElementById("estadoCargaForo");
    const contenidoForo = document.getElementById("contenidoForo");
    const mensajeError = document.getElementById("mensajeErrorForo");

    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = "ingresar.html";
            return;
        }

        usuarioActual = user;

        try {
            const docUserRef = doc(db, "usuarios", user.uid);
            const docUserSnap = await getDoc(docUserRef);

            if (docUserSnap.exists()) {
                datosUsuarioActual = docUserSnap.data();
                rolActual = (datosUsuarioActual.tipoUsuario || datosUsuarioActual.rol || "").toLowerCase().trim();
            }

            const esDocenteOAdmin = esUsuarioAdminODocente(rolActual);

            if (esDocenteOAdmin) {
                const breadcrumbMisCursos = document.getElementById("itemMisCursosBreadcrumb");
                if (breadcrumbMisCursos) breadcrumbMisCursos.classList.add("d-none");
            }

            if (!esDocenteOAdmin) {
                const qAdquisicion = query(
                    collection(db, "adquisiciones"),
                    where("usuarioId", "==", user.uid),
                    where("cursoId", "==", cursoIdActual)
                );
                const snapAdquisicion = await getDocs(qAdquisicion);

                if (snapAdquisicion.empty) {
                    alert("Debés estar inscripto en este curso para acceder al foro.");
                    window.location.href = `descripcionDeCurso.html?id=${cursoIdActual}`;
                    return;
                }
            }

            const docCursoRef = doc(db, "cursoscc", cursoIdActual);
            const docCursoSnap = await getDoc(docCursoRef);

            if (docCursoSnap.exists()) {
                cursoTituloActual = docCursoSnap.data().titulo || "Curso sin título";
                const nombreCursoElem = document.getElementById("nombreCursoForo");
                if (nombreCursoElem) nombreCursoElem.textContent = cursoTituloActual;
            }

            if (contenedorPrincipal) contenedorPrincipal.classList.remove("d-none");
            if (estadoCarga) estadoCarga.classList.add("d-none");
            if (contenidoForo) contenidoForo.classList.remove("d-none");

            escucharPublicacionesForo();
            configurarFormularioPublicacion();

        } catch (error) {
            console.error("Error al inicializar el foro:", error);
            if (mensajeError) {
                mensajeError.textContent = "Ocurrió un error al cargar el foro.";
                mensajeError.classList.remove("d-none");
            }
            if (estadoCarga) estadoCarga.classList.add("d-none");
            if (contenedorPrincipal) contenedorPrincipal.classList.remove("d-none");
        }
    });
}

function obtenerNombreRealUsuario() {
    if (datosUsuarioActual) {
        const n = datosUsuarioActual.nombre || datosUsuarioActual.Nombre || datosUsuarioActual.perfil?.nombre || "";
        const a = datosUsuarioActual.apellido || datosUsuarioActual.Apellido || datosUsuarioActual.perfil?.apellido || "";
        const completo = `${n} ${a}`.trim();

        if (completo) return completo;

        if (datosUsuarioActual.nombreCompleto) return datosUsuarioActual.nombreCompleto.trim();
        if (datosUsuarioActual.nombreUsuario) return datosUsuarioActual.nombreUsuario.trim();
    }

    if (usuarioActual?.displayName) {
        return usuarioActual.displayName.trim();
    }

    return "";
}

function escucharPublicacionesForo() {
    const listaPublicaciones = document.getElementById("listaPublicaciones");
    const sinPublicaciones = document.getElementById("sinPublicaciones");
    const cantidadElem = document.getElementById("cantidadPublicaciones");

    if (!listaPublicaciones) return;

    if (desuscripcionForo) desuscripcionForo();

    const foroRef = collection(db, "cursoscc", cursoIdActual, "foro");

    desuscripcionForo = onSnapshot(foroRef, (snapshot) => {
        const publicaciones = [];

        snapshot.forEach((docSnap) => {
            publicaciones.push({ id: docSnap.id, ...docSnap.data() });
        });

        publicaciones.sort((a, b) => (b.fecha?.toMillis() || 0) - (a.fecha?.toMillis() || 0));

        if (cantidadElem) cantidadElem.textContent = publicaciones.length;

        listaPublicaciones.innerHTML = "";

        if (publicaciones.length === 0) {
            if (sinPublicaciones) sinPublicaciones.classList.remove("d-none");
            return;
        }

        if (sinPublicaciones) sinPublicaciones.classList.add("d-none");

        publicaciones.forEach((pub) => {
            const card = document.createElement("div");
            card.className = "card shadow-sm border-0 mb-3";

            const esDoc = pub.esDocente === true;
            const insigniaRol = esDoc 
                ? `<span class="badge bg-primary ms-2"><i class="bi bi-star-fill me-1"></i>Docente / Admin</span>` 
                : `<span class="badge bg-secondary ms-2">Estudiante</span>`;

            let fechaStr = "Reciente";
            if (pub.fecha?.toDate) {
                fechaStr = pub.fecha.toDate().toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                });
            }

            const nombreMostrar = pub.autor || pub.nombreAutor || (esDoc ? "Docente / Admin" : "Estudiante");

            card.innerHTML = `
                <div class="card-body p-4">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <div>
                            <strong class="text-dark fs-6">${nombreMostrar}</strong>
                            ${insigniaRol}
                        </div>
                        <small class="text-muted">${fechaStr}</small>
                    </div>
                    <h5 class="card-title fw-bold text-primary mb-2">${pub.titulo || "Consulta"}</h5>
                    <p class="card-text text-secondary mb-0" style="white-space: pre-wrap;">${pub.mensaje || ""}</p>
                </div>
            `;

            listaPublicaciones.appendChild(card);
        });
    }, (error) => {
        console.error("Error al escuchar publicaciones del foro:", error);
    });
}

function configurarFormularioPublicacion() {
    const form = document.getElementById("formPublicacionForo");
    if (!form) return;

    if (form.dataset.registrado === "true") return;
    form.dataset.registrado = "true";

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const inputTitulo = document.getElementById("tituloPublicacion");
        const inputMensaje = document.getElementById("mensajePublicacion");
        const contenedorMensajeForm = document.getElementById("mensajePublicacionForo");
        const btnSubmit = document.getElementById("btnPublicarMensaje");

        const titulo = inputTitulo?.value.trim();
        const mensaje = inputMensaje?.value.trim();

        if (!titulo || !mensaje) return;

        if (btnSubmit) btnSubmit.disabled = true;

        try {
            let nombreAutor = obtenerNombreRealUsuario();

            if (!nombreAutor) {
                try {
                    const uSnap = await getDoc(doc(db, "usuarios", usuarioActual.uid));
                    if (uSnap.exists()) {
                        datosUsuarioActual = uSnap.data();
                        nombreAutor = obtenerNombreRealUsuario();
                    }
                } catch (errUser) {
                    console.error("Error recuperando documento de usuario:", errUser);
                }
            }

            const esDocenteOAdmin = esUsuarioAdminODocente(rolActual);

            if (!nombreAutor) {
                nombreAutor = esDocenteOAdmin ? "Docente / Admin" : "Estudiante";
            }

            // 1. Guardar publicación en Firestore
            await addDoc(collection(db, "cursoscc", cursoIdActual, "foro"), {
                uid: usuarioActual.uid,
                autorId: usuarioActual.uid,
                autor: nombreAutor,
                titulo: titulo,
                mensaje: mensaje,
                esDocente: esDocenteOAdmin,
                fecha: serverTimestamp()
            });

            // 2. ENVIAR NOTIFICACIÓN SEGÚN EL ROL QUE ESCRIBE
            if (!esDocenteOAdmin) {
                // Si escribe un ESTUDIANTE -> Notifica al ROL de docentes/admins
                await addDoc(collection(db, "notificaciones"), {
                    tipo: "foro_consulta",
                    destinatarioRol: "docente/admin",
                    estudianteUid: usuarioActual.uid,
                    titulo: "Nueva consulta en el Foro",
                    mensaje: `${nombreAutor} hizo una publicación en "${cursoTituloActual}".`,
                    leida: false,
                    fechaCreacion: serverTimestamp(),
                    enlace: `foroCurso.html?id=${cursoIdActual}`
                });
            } else {
                // Si escribe un DOCENTE/ADMIN -> Notifica a los ESTUDIANTES inscritos en el curso
                const qInscriptos = query(
                    collection(db, "adquisiciones"),
                    where("cursoId", "==", cursoIdActual)
                );
                const snapInscriptos = await getDocs(qInscriptos);

                snapInscriptos.forEach(async (docInsc) => {
                    const datosInsc = docInsc.data();
                    if (datosInsc.usuarioId && datosInsc.usuarioId !== usuarioActual.uid) {
                        await addDoc(collection(db, "notificaciones"), {
                            tipo: "foro_respuesta",
                            destinatarioUid: datosInsc.usuarioId,
                            titulo: "Nueva publicación del docente",
                            mensaje: `El equipo docente publicó un mensaje en el foro de "${cursoTituloActual}".`,
                            leida: false,
                            fechaCreacion: serverTimestamp(),
                            enlace: `foroCurso.html?id=${cursoIdActual}`
                        });
                    }
                });
            }

            if (inputTitulo) inputTitulo.value = "";
            if (inputMensaje) inputMensaje.value = "";

            if (contenedorMensajeForm) {
                contenedorMensajeForm.className = "alert alert-success mt-3 p-2 small text-center";
                contenedorMensajeForm.textContent = "Mensaje publicado con éxito.";
                setTimeout(() => {
                    if (contenedorMensajeForm) contenedorMensajeForm.textContent = "";
                }, 3000);
            }

        } catch (error) {
            console.error("Error al publicar mensaje en el foro:", error);
            if (contenedorMensajeForm) {
                contenedorMensajeForm.className = "alert alert-danger mt-3 p-2 small text-center";
                contenedorMensajeForm.textContent = "No se pudo publicar el mensaje. Revisa tu conexión.";
            }
        } finally {
            if (btnSubmit) btnSubmit.disabled = false;
        }
    });
}