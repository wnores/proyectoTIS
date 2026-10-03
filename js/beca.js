import { auth, db } from './firebase-config.js';

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
    collection,
    addDoc,
    getDocs,
    doc,
    getDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


// ============================================================
// OBTENER CURSO DESDE LA URL
// ============================================================

function obtenerCursoDesdeURL() {

    const parametros =
        new URLSearchParams(window.location.search);

    return parametros.get("curso");
}


// ============================================================
// NOTIFICACIÓN DE ÉXITO
// ============================================================

function mostrarNotificacionExito() {

    const notificacion = document.createElement("div");

    notificacion.className =
        "alert alert-success position-fixed top-0 start-50 translate-middle-x mt-3 shadow";

    notificacion.style.zIndex = "9999";

    notificacion.innerHTML = `
        <strong>Solicitud enviada correctamente.</strong>
        <br>
        Tu solicitud de beca fue registrada y será evaluada por el equipo docente.
    `;

    document.body.appendChild(notificacion);

    setTimeout(() => {
        notificacion.remove();
    }, 5000);
}


// ============================================================
// CONTROLAR ACCESO AL BOTÓN "SOLICITAR BECA"
// ============================================================

function controlarAccesoBoton(usuario) {

    const botonSolicitar =
        document.getElementById("btnSolicitarBeca");

    if (!botonSolicitar) {
        return;
    }

    botonSolicitar.disabled = !usuario;
}


// ============================================================
// CARGAR CURSOS EN EL SELECT
// ============================================================

async function cargarCursosEnSelect(cursoSeleccionado = null) {

    const selectCurso =
        document.getElementById("curso");

    if (!selectCurso) {

        console.error(
            "No se encontró el elemento #curso."
        );

        return;
    }

    try {

        const cursosRef =
            collection(db, "cursoscc");

        const resultado =
            await getDocs(cursosRef);

        selectCurso.innerHTML = `
            <option value="">
                Seleccioná un curso
            </option>
        `;


        resultado.forEach((documento) => {

            const curso =
                documento.data();

            if (curso.activo !== false) {

                const opcion =
                    document.createElement("option");

                opcion.value =
                    documento.id;

                opcion.textContent =
                    curso.titulo || "Curso sin título";

                // --------------------------------------------
                // PRESELECCIONAR CURSO
                // --------------------------------------------

                if (
                    cursoSeleccionado &&
                    documento.id === cursoSeleccionado
                ) {

                    opcion.selected = true;

                }

                selectCurso.appendChild(opcion);
            }

        });


        // ----------------------------------------------------
        // VERIFICAR SI EL CURSO EXISTE
        // ----------------------------------------------------

        if (cursoSeleccionado) {

            const cursoExiste =
                Array.from(selectCurso.options)
                    .some(
                        opcion =>
                            opcion.value === cursoSeleccionado
                    );

            if (!cursoExiste) {

                console.warn(
                    "El curso indicado en la URL no existe o no está activo:",
                    cursoSeleccionado
                );

            }

        }

    } catch (error) {

        console.error(
            "Error al cargar los cursos:",
            error
        );

        selectCurso.innerHTML = `
            <option value="">
                No se pudieron cargar los cursos
            </option>
        `;
    }
}


// ============================================================
// OBTENER DATOS DEL USUARIO
// ============================================================

async function obtenerDatosUsuario(uid) {

    try {

        const referenciaUsuario =
            doc(db, "usuarios", uid);

        const documentoUsuario =
            await getDoc(referenciaUsuario);

        if (documentoUsuario.exists()) {

            return documentoUsuario.data();

        }

        return null;

    } catch (error) {

        console.error(
            "Error al obtener el usuario:",
            error
        );

        return null;
    }
}


// ============================================================
// INICIALIZAR FORMULARIO
// ============================================================

function inicializarFormularioBeca(usuario) {

    const formulario =
        document.getElementById("formularioBeca");

    if (!formulario) {

        console.error(
            "No se encontró el formulario #formularioBeca."
        );

        return;
    }


    const campoNombre =
        document.getElementById("nombre");

    const campoCorreo =
        document.getElementById("correo");

    const botonEnviar =
        formulario.querySelector(
            'button[type="submit"]'
        );


    // --------------------------------------------------------
    // DATOS DEL USUARIO
    // --------------------------------------------------------

    if (campoCorreo) {

        campoCorreo.value =
            usuario.email || "";

    }


    obtenerDatosUsuario(usuario.uid)
        .then((datosUsuario) => {

            if (
                datosUsuario &&
                campoNombre
            ) {

                campoNombre.value =
                    `${datosUsuario.nombre || ""} ${datosUsuario.apellido || ""}`.trim();

            }

        })
        .catch((error) => {

            console.error(
                "Error al obtener datos del usuario:",
                error
            );

        });


    // --------------------------------------------------------
    // EVITAR DUPLICAR EVENTO
    // --------------------------------------------------------

    if (
        formulario.dataset.eventoRegistrado === "true"
    ) {

        return;

    }

    formulario.dataset.eventoRegistrado = "true";


    // --------------------------------------------------------
    // ENVÍO
    // --------------------------------------------------------

    formulario.addEventListener(
        "submit",
        async (evento) => {

            evento.preventDefault();


            const nombre =
                document
                    .getElementById("nombre")
                    .value
                    .trim();

            const correo =
                document
                    .getElementById("correo")
                    .value
                    .trim();

            const curso =
                document
                    .getElementById("curso")
                    .value;

            const tipoBeca =
                document
                    .getElementById("tipo-beca")
                    .value;

            const motivo =
                document
                    .getElementById("motivo")
                    .value
                    .trim();


            // ------------------------------------------------
            // VALIDACIONES
            // ------------------------------------------------

            if (!nombre) {

                alert(
                    "Ingresá tu nombre."
                );

                return;
            }


            if (!correo) {

                alert(
                    "No se pudo obtener tu correo electrónico."
                );

                return;
            }


            if (!curso) {

                alert(
                    "Seleccioná un curso."
                );

                return;
            }


            if (!tipoBeca) {

                alert(
                    "Seleccioná un tipo de beca."
                );

                return;
            }


            if (!motivo) {

                alert(
                    "Ingresá el motivo por el cual solicitás la beca."
                );

                return;
            }


            if (botonEnviar) {
                botonEnviar.disabled = true;
            }


            try {

                console.log(
                    "Registrando solicitud de beca:",
                    {
                        uid: usuario.uid,
                        nombre,
                        correo,
                        curso,
                        tipoBeca,
                        motivo
                    }
                );


                // --------------------------------------------
                // GUARDAR SOLICITUD
                // --------------------------------------------

                await addDoc(
                    collection(
                        db,
                        "solicitudesBecas"
                    ),
                    {
                        uid: usuario.uid,

                        nombre: nombre,

                        correo: correo,

                        curso: curso,

                        tipoBeca: tipoBeca,

                        motivo: motivo,

                        estado: "pendiente",

                        fechaSolicitud:
                            serverTimestamp()
                    }
                );


                // --------------------------------------------
                // ÉXITO
                // --------------------------------------------

                mostrarNotificacionExito();


                // --------------------------------------------
                // LIMPIAR FORMULARIO
                // --------------------------------------------

                document
                    .getElementById("curso")
                    .value = "";

                document
                    .getElementById("tipo-beca")
                    .value = "";

                document
                    .getElementById("motivo")
                    .value = "";

                const confirmacion =
                    document.getElementById("confirmacion");

                if (confirmacion) {
                    confirmacion.checked = false;
                }


            } catch (error) {

                console.error(
                    "Error al enviar la solicitud de beca:",
                    error
                );

                console.error(
                    "Código:",
                    error.code
                );

                console.error(
                    "Mensaje:",
                    error.message
                );


                alert(
                    "No se pudo enviar la solicitud de beca.\n\n" +
                    error.message
                );


            } finally {

                if (botonEnviar) {
                    botonEnviar.disabled = false;
                }

            }

        }
    );
}


// ============================================================
// AUTENTICACIÓN
// ============================================================

onAuthStateChanged(
    auth,
    async (usuario) => {

        if (!usuario) {

            controlarAccesoBoton(null);

            return;
        }


        controlarAccesoBoton(usuario);


        // ----------------------------------------------------
        // OBTENER CURSO DESDE LA URL
        // ----------------------------------------------------

        const cursoDesdeURL =
            obtenerCursoDesdeURL();


        console.log(
            "Curso recibido desde la URL:",
            cursoDesdeURL
        );


        // ----------------------------------------------------
        // CARGAR CURSOS Y PRESELECCIONAR
        // ----------------------------------------------------

        await cargarCursosEnSelect(
            cursoDesdeURL
        );


        // ----------------------------------------------------
        // INICIALIZAR FORMULARIO
        // ----------------------------------------------------

        inicializarFormularioBeca(usuario);

    }
);