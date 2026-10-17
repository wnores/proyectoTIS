import {
    auth,
    db
} from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
    doc,
    getDoc,
    collection,
    getDocs,
    addDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const estadoCargaForo =
    document.getElementById("estadoCargaForo");

const mensajeErrorForo =
    document.getElementById("mensajeErrorForo");

const contenidoForo =
    document.getElementById("contenidoForo");

const nombreCursoForo =
    document.getElementById("nombreCursoForo");

const enlaceContenidoCurso =
    document.getElementById("enlaceContenidoCurso");

const formPublicacionForo =
    document.getElementById("formPublicacionForo");

const tituloPublicacion =
    document.getElementById("tituloPublicacion");

const mensajePublicacion =
    document.getElementById("mensajePublicacion");

const moduloPublicacion =
    document.getElementById("moduloPublicacion");

const btnPublicarMensaje =
    document.getElementById("btnPublicarMensaje");

const mensajePublicacionForo =
    document.getElementById("mensajePublicacionForo");

const listaPublicaciones =
    document.getElementById("listaPublicaciones");

const cantidadPublicaciones =
    document.getElementById("cantidadPublicaciones");

const sinPublicaciones =
    document.getElementById("sinPublicaciones");

const parametros =
    new URLSearchParams(window.location.search);

const cursoId =
    parametros.get("curso");

let usuarioActual = null;
let datosUsuarioActual = null;
let cancelarEscuchaPublicaciones = null;
let cancelarEscuchasRespuestas = [];

iniciarPagina();

function iniciarPagina() {

    if (!cursoId) {
        mostrarError(
            "No se indicó a qué curso pertenece el foro."
        );

        return;
    }

    enlaceContenidoCurso.href =
        `contenidoCurso.html?curso=${encodeURIComponent(cursoId)}`;

    onAuthStateChanged(auth, async (usuario) => {

        if (!usuario) {
            window.location.href = "ingresar.html";
            return;
        }
        usuarioActual = usuario;

        try {
            const referenciaUsuario =
                doc(db, "usuarios", usuario.uid);

            const referenciaCurso =
                doc(db, "cursoscc", cursoId);

            const [
                resultadoUsuario,
                resultadoCurso
            ] = await Promise.all([
                getDoc(referenciaUsuario),
                getDoc(referenciaCurso)
            ]);

            if (!resultadoUsuario.exists()) {
                mostrarError(
                    "No se encontraron los datos del usuario."
                );

                return;
            }

            if (!resultadoCurso.exists()) {
                mostrarError(
                    "El curso solicitado no existe."
                );

                return;
            }

            datosUsuarioActual =
                resultadoUsuario.data();

            const curso = {
                id: resultadoCurso.id,
                ...resultadoCurso.data()
            };

            const tieneAcceso =
                await comprobarAcceso(
                    datosUsuarioActual,
                    curso,
                    usuario.uid
                );

            if (!tieneAcceso) {
                mostrarError(
                    "No tenés acceso al foro de este curso."
                );

                return;
            }


            nombreCursoForo.textContent =
                curso.titulo || "Curso";

            await cargarModulos(curso.id);

            escucharPublicaciones();

            estadoCargaForo.classList.add("d-none");
            mensajeErrorForo.classList.add("d-none");
            contenidoForo.classList.remove("d-none");

        } catch (error) {

            console.error(
                "Error al iniciar el foro:",
                error
            );

            mostrarError(
                "No fue posible cargar el foro del curso."
            );
        }
    });
}

async function comprobarAcceso(
    datosUsuario,
    curso,
    uid
) {
    const rol =
        (
            datosUsuario.tipoUsuario ||
            datosUsuario.rol ||
            ""
        )
            .toString()
            .trim()
            .toLowerCase();

    if (
        rol.includes("admin") ||
        rol.includes("docente")
    ) {
        return true;
    }

    if (rol !== "estudiante") {
        return false;
    }

    const referenciaAdquisiciones =
        collection(db, "adquisiciones");


    const consultaAdquisiciones =
        query(
            referenciaAdquisiciones,
            where("usuarioId", "==", uid)
        );

    const resultadoAdquisiciones =
        await getDocs(consultaAdquisiciones);

    const adquisicionAprobada =
        resultadoAdquisiciones.docs.some(
            (documento) => {

                const adquisicion =
                    documento.data();

                return (
                    adquisicion.cursoId === curso.id &&
                    adquisicion.estado === "aprobada"
                );
            }
        );

    return adquisicionAprobada;
}

async function cargarModulos(idCurso) {

    const referenciaModulos =
        collection(
            db,
            "cursoscc",
            idCurso,
            "modulos"
        );

    const resultadoModulos =
        await getDocs(referenciaModulos);

    const modulos =
        resultadoModulos.docs.map(
            (documento, indice) => {

                const datos =
                    documento.data();

                return {
                    id: documento.id,

                    numero:
                        datos.numero ||
                        indice + 1,

                    nombre:
                        datos.nombre ||
                        datos.titulo ||
                        datos.modulo ||
                        "Módulo"
                };
            }
        );

    modulos.sort(
        (a, b) =>
            Number(a.numero) -
            Number(b.numero)
    );

    modulos.forEach((modulo) => {

        const opcion =
            document.createElement("option");

        opcion.value =
            modulo.id;

        opcion.textContent =
            `Módulo ${modulo.numero}: ${modulo.nombre}`;

        moduloPublicacion.appendChild(opcion);
    });
}

formPublicacionForo.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        if (!usuarioActual) {
            mostrarMensajeFormulario(
                "Debés iniciar sesión para publicar.",
                "danger"
            );

            return;
        }

        const titulo =
            tituloPublicacion.value.trim();

        const mensaje =
            mensajePublicacion.value.trim();

        const moduloSeleccionado =
            moduloPublicacion.value;

        const textoModulo =
            moduloPublicacion.selectedOptions[0]
                ?.textContent || "Foro general";

        if (
            titulo.length < 3 ||
            mensaje.length < 3
        ) {
            mostrarMensajeFormulario(
                "Escribí un título y un mensaje válidos.",
                "danger"
            );

            return;
        }

        btnPublicarMensaje.disabled = true;

        btnPublicarMensaje.innerHTML = `
            <span
                class="spinner-border spinner-border-sm me-2"
                aria-hidden="true"
            ></span>
            Publicando...
        `;

        try {

            const rol =
                (
                    datosUsuarioActual.tipoUsuario ||
                    datosUsuarioActual.rol ||
                    "estudiante"
                )
                    .toString()
                    .trim()
                    .toLowerCase();

            const nombreAutor =
                obtenerNombreUsuario(
                    datosUsuarioActual,
                    usuarioActual
                );

            const referenciaForo =
                collection(
                    db,
                    "cursoscc",
                    cursoId,
                    "foro"
                );

const publicacionCreada =
    await addDoc(
        referenciaForo,
        {
            autorId:
                usuarioActual.uid,

            autorNombre:
                nombreAutor,

            autorRol:
                rol,

            titulo:
                titulo,

            mensaje:
                mensaje,

            moduloId:
                moduloSeleccionado,

            moduloNombre:
                moduloSeleccionado
                    ? textoModulo
                    : "Foro general",

            fechaCreacion:
                serverTimestamp(),

            activo:
                true
        }
    );

if (rol === "estudiante") {
    try {
        await addDoc(
            collection(db, "notificaciones"),
            {
                destinatarioRol:
                    "docente/admin",

                tipo:
                    "nueva_publicacion_foro",

                cursoId:
                    cursoId,

                cursoTitulo:
                    nombreCursoForo.textContent ||
                    "Curso",

                publicacionId:
                    publicacionCreada.id,

                titulo:
                    titulo,

                autorId:
                    usuarioActual.uid,

                autorNombre:
                    nombreAutor,

                enlace:
                    `foroCurso.html?curso=${encodeURIComponent(cursoId)}`,

                leida:
                    false,

                fechaCreacion:
                    serverTimestamp()
            }
        );

    } catch (errorNotificacion) {

        console.error(
            "La publicación fue creada, pero no se pudo crear la notificación:",
            errorNotificacion
        );
    }
}
            
            formPublicacionForo.reset();

            mostrarMensajeFormulario(
                "El mensaje fue publicado correctamente.",
                "success"
            );

        } catch (error) {

            console.error(
                "Error al publicar en el foro:",
                error
            );

            mostrarMensajeFormulario(
                "No se pudo publicar el mensaje. Intentá nuevamente.",
                "danger"
            );

        } finally {

            btnPublicarMensaje.disabled = false;

            btnPublicarMensaje.innerHTML = `
                <i class="bi bi-send-fill me-2"></i>
                Publicar mensaje
            `;
        }
    }
);

function escucharPublicaciones() {

    const referenciaForo =
        collection(
            db,
            "cursoscc",
            cursoId,
            "foro"
        );

    const consultaForo =
        query(
            referenciaForo,
            orderBy("fechaCreacion", "desc")
        );

    cancelarEscuchaPublicaciones =
        onSnapshot(
            consultaForo,

            (resultado) => {

                const publicaciones =
                    resultado.docs
                        .map((documento) => ({
                            id: documento.id,
                            ...documento.data()
                        }))
                        .filter(
                            (publicacion) =>
                                publicacion.activo !== false
                        );

                mostrarPublicaciones(
                    publicaciones
                );
            },
            (error) => {
                console.error(
                    "Error al escuchar el foro:",
                    error
                );
                mostrarMensajeFormulario(
                    "No fue posible actualizar las publicaciones.",
                    "danger"
                );
            }
        );
}

function mostrarPublicaciones(publicaciones) {

    cancelarEscuchasRespuestas.forEach(
    (cancelar) => cancelar()
);

    cancelarEscuchasRespuestas = [];

    listaPublicaciones.replaceChildren();

    cantidadPublicaciones.textContent =
        publicaciones.length;

    if (publicaciones.length === 0) {
        sinPublicaciones.classList.remove("d-none");
        return;
    }

    sinPublicaciones.classList.add("d-none");

    publicaciones.forEach((publicacion) => {

        const tarjeta =
            crearTarjetaPublicacion(publicacion);

        listaPublicaciones.appendChild(tarjeta);
    });
}

function crearTarjetaPublicacion(publicacion) {

    const articulo =
        document.createElement("article");

    articulo.className =
        "card shadow-sm border-0";

    const cuerpo =
        document.createElement("div");

    cuerpo.className =
        "card-body p-4";

    const encabezado =
        document.createElement("div");

    encabezado.className =
        "d-flex justify-content-between align-items-start gap-3 mb-3";

    const datosAutor =
        document.createElement("div");

    const autor =
        document.createElement("p");

    autor.className =
        "fw-bold mb-1";

    autor.textContent =
        publicacion.autorNombre ||
        "Usuario";

    const informacion =
        document.createElement("p");

    informacion.className =
        "small text-muted mb-0";

    const rol =
        (publicacion.autorRol || "")
            .toLowerCase();

    const nombreRol =
        rol.includes("docente")
            ? "Docente"
            : rol.includes("admin")
                ? "Administrador"
                : "Estudiante";

    informacion.textContent =
        `${nombreRol} · ${formatearFecha(publicacion.fechaCreacion)}`;

    datosAutor.appendChild(autor);
    datosAutor.appendChild(informacion);

    const insignia =
        document.createElement("span");

    if (
        rol.includes("docente") ||
        rol.includes("admin")
    ) {
        insignia.className =
            "badge bg-primary";

        insignia.textContent =
            rol.includes("docente")
                ? "Docente"
                : "Administrador";

    } else {
        insignia.className =
            "badge bg-secondary";

        insignia.textContent =
            "Estudiante";
    }

    encabezado.appendChild(datosAutor);
    encabezado.appendChild(insignia);

    const titulo =
        document.createElement("h2");

    titulo.className =
        "h5 mb-2";

    titulo.textContent =
        publicacion.titulo ||
        "Publicación";

    const modulo =
        document.createElement("p");

    modulo.className =
        "small text-primary mb-3";

    modulo.textContent =
        publicacion.moduloNombre ||
        "Foro general";

    const mensaje =
        document.createElement("p");

    mensaje.className =
        "mb-0";

    mensaje.textContent =
        publicacion.mensaje || "";

    cuerpo.appendChild(encabezado);
    cuerpo.appendChild(titulo);
    cuerpo.appendChild(modulo);
    cuerpo.appendChild(mensaje);

    const separador =
        document.createElement("hr");
    separador.className =
        "my-4";

    cuerpo.appendChild(separador);

    const tituloRespuestas =
    document.createElement("h3");

tituloRespuestas.className =
    "h6 fw-bold mb-3";

tituloRespuestas.innerHTML = `
    <i class="bi bi-reply-fill me-2"></i>
    Respuestas
`;

cuerpo.appendChild(tituloRespuestas);

const contenedorRespuestas =
    document.createElement("div");

contenedorRespuestas.className =
    "d-flex flex-column gap-2 mb-3";

cuerpo.appendChild(contenedorRespuestas);

const formularioRespuesta =
    document.createElement("form");

formularioRespuesta.className =
    "mt-3";

const grupoRespuesta =
    document.createElement("div");

grupoRespuesta.className =
    "input-group";

const campoRespuesta =
    document.createElement("textarea");

campoRespuesta.className =
    "form-control";

campoRespuesta.rows = 2;

campoRespuesta.maxLength = 500;

campoRespuesta.placeholder =
    "Escribí una respuesta...";

campoRespuesta.required = true;

campoRespuesta.setAttribute(
    "aria-label",
    "Escribir una respuesta"
);

const botonResponder =
    document.createElement("button");

botonResponder.type =
    "submit";

botonResponder.className =
    "btn btn-primary";

botonResponder.innerHTML = `
    <i class="bi bi-send-fill me-1"></i>
    Responder
`;

grupoRespuesta.appendChild(
    campoRespuesta
);

grupoRespuesta.appendChild(
    botonResponder
);

formularioRespuesta.appendChild(
    grupoRespuesta
);

cuerpo.appendChild(
    formularioRespuesta
);

formularioRespuesta.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        const textoRespuesta =
            campoRespuesta.value.trim();


        if (textoRespuesta.length < 2) {
            return;
        }

        botonResponder.disabled =
            true;

        botonResponder.innerHTML = `
            <span
                class="spinner-border spinner-border-sm"
                aria-hidden="true"
            ></span>
        `;

        try {

            await guardarRespuesta(
                publicacion,
                textoRespuesta
            );

            campoRespuesta.value = "";

        } catch (error) {

            console.error(
                "Error al guardar la respuesta:",
                error
            );

            alert(
                "No se pudo publicar la respuesta."
            );

        } finally {

            botonResponder.disabled =
                false;

            botonResponder.innerHTML = `
                <i class="bi bi-send-fill me-1"></i>
                Responder
            `;
        }
    }
);

articulo.appendChild(cuerpo);

escucharRespuestas(
    publicacion.id,
    contenedorRespuestas
);

return articulo;
}

async function guardarRespuesta(
    publicacion,
    textoRespuesta
) {

    if (
        !usuarioActual ||
        !datosUsuarioActual
    ) {
        throw new Error(
            "USUARIO_NO_AUTENTICADO"
        );
    }

    const rol =
        (
            datosUsuarioActual.tipoUsuario ||
            datosUsuarioActual.rol ||
            "estudiante"
        )
            .toString()
            .trim()
            .toLowerCase();

    const nombreAutor =
        obtenerNombreUsuario(
            datosUsuarioActual,
            usuarioActual
        );

    const referenciaRespuestas =
        collection(
            db,
            "cursoscc",
            cursoId,
            "foro",
            publicacion.id,
            "respuestas"
        );

    await addDoc(
        referenciaRespuestas,
        {
            autorId:
                usuarioActual.uid,

            autorNombre:
                nombreAutor,

            autorRol:
                rol,

            mensaje:
                textoRespuesta,

            fechaCreacion:
                serverTimestamp(),

            activo:
                true
        }
    );
}

function escucharRespuestas(
    publicacionId,
    contenedor
) {

    const referenciaRespuestas =
        collection(
            db,
            "cursoscc",
            cursoId,
            "foro",
            publicacionId,
            "respuestas"
        );

    const consultaRespuestas =
        query(
            referenciaRespuestas,
            orderBy(
                "fechaCreacion",
                "asc"
            )
        );

    const cancelar =
        onSnapshot(
            consultaRespuestas,

            (resultado) => {

                const respuestas =
                    resultado.docs
                        .map(
                            (documento) => ({
                                id:
                                    documento.id,

                                ...documento.data()
                            })
                        )
                        .filter(
                            (respuesta) =>
                                respuesta.activo !==
                                false
                        );

                mostrarRespuestas(
                    respuestas,
                    contenedor
                );
            },

            (error) => {

                console.error(
                    "Error al cargar respuestas:",
                    error
                );

                contenedor.innerHTML = `
                    <p class="small text-danger mb-0">
                        No se pudieron cargar las respuestas.
                    </p>
                `;
            }
        );

    cancelarEscuchasRespuestas.push(
        cancelar
    );
}

function mostrarRespuestas(
    respuestas,
    contenedor
) {

    contenedor.replaceChildren();

    if (respuestas.length === 0) {

        const mensaje =
            document.createElement("p");

        mensaje.className =
            "small text-muted mb-0";

        mensaje.textContent =
            "Todavía no hay respuestas.";

        contenedor.appendChild(mensaje);

        return;
    }

    respuestas.forEach(
        (respuesta) => {

            const caja =
                document.createElement("div");

            caja.className =
                "border rounded p-3 bg-light";

            const encabezado =
                document.createElement("div");

            encabezado.className =
                "d-flex justify-content-between align-items-center gap-2 mb-2";


            const autor =
                document.createElement("strong");

            autor.className =
                "small";

            autor.textContent =
                respuesta.autorNombre ||
                "Usuario";

            const rol =
                (
                    respuesta.autorRol ||
                    "estudiante"
                ).toLowerCase();

            const etiqueta =
                document.createElement("span");

            etiqueta.className =
                rol.includes("docente") ||
                rol.includes("admin")
                    ? "badge bg-primary"
                    : "badge bg-secondary";

            etiqueta.textContent =
                rol.includes("docente")
                    ? "Docente"
                    : rol.includes("admin")
                        ? "Administrador"
                        : "Estudiante";

            const mensaje =
                document.createElement("p");

            mensaje.className =
                "mb-1";

            mensaje.textContent =
                respuesta.mensaje || "";

            const fecha =
                document.createElement("small");

            fecha.className =
                "text-muted";

            fecha.textContent =
                formatearFecha(
                    respuesta.fechaCreacion
                );

            encabezado.appendChild(autor);
            encabezado.appendChild(etiqueta);

            caja.appendChild(encabezado);
            caja.appendChild(mensaje);
            caja.appendChild(fecha);

            contenedor.appendChild(caja);
        }
    );
}

function obtenerNombreUsuario(
    datosUsuario,
    usuario
) {

    const nombreCompleto =
        [
            datosUsuario.nombre,
            datosUsuario.apellido
        ]
            .filter(Boolean)
            .join(" ")
            .trim();

    return (
        nombreCompleto ||
        datosUsuario.nombreCompleto ||
        usuario.displayName ||
        usuario.email ||
        "Usuario"
    );
}

function formatearFecha(fecha) {

    if (!fecha) {
        return "Publicando...";
    }

    let fechaJavaScript;

    if (
        typeof fecha.toDate === "function"
    ) {
        fechaJavaScript =
            fecha.toDate();

    } else {
        fechaJavaScript =
            new Date(fecha);
    }

    return fechaJavaScript.toLocaleString(
        "es-UY",
        {
            dateStyle: "short",
            timeStyle: "short"
        }
    );
}

function mostrarMensajeFormulario(
    texto,
    tipo
) {

    mensajePublicacionForo.textContent =
        texto;

    mensajePublicacionForo.className =
        `alert alert-${tipo} mt-3`;
}

function mostrarError(mensaje) {

    estadoCargaForo.classList.add("d-none");
    contenidoForo.classList.add("d-none");

    mensajeErrorForo.textContent =
        mensaje;

    mensajeErrorForo.classList.remove("d-none");
}

window.addEventListener(
    "beforeunload",
    () => {

        if (cancelarEscuchaPublicaciones) {
            cancelarEscuchaPublicaciones();
        }
        cancelarEscuchasRespuestas.forEach(
            (cancelar) => cancelar()
        );      
        cancelarEscuchasRespuestas = [];
    }
);