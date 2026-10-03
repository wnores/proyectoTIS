
import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
    collection,
    getDocs,
    query,
    where,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


const contenedor = document.getElementById("contenedorMisCursos");
const mensaje = document.getElementById("mensajeMisCursos");
const cargando = document.getElementById("cargandoMisCursos");


iniciarPagina();


function iniciarPagina() {

    onAuthStateChanged(auth, async (usuario) => {

        if (!usuario) {
            window.location.replace("ingresar.html");
            return;
        }

        await cargarMisCursos(usuario.uid);
    });
}


/* =========================================================
   CARGAR MIS CURSOS
   ========================================================= */

async function cargarMisCursos(uid) {

    try {

        mostrarCargando(true);
        limpiarMensaje();

        /*
         * 1. Obtener adquisiciones
         *
         * Incluye:
         * - pagos con tarjeta
         * - pagos por transferencia
         * - becas aprobadas
         */

        const referenciaAdquisiciones =
            collection(db, "adquisiciones");

        const consultaAdquisiciones =
            query(
                referenciaAdquisiciones,
                where("usuarioId", "==", uid)
            );

        const resultadoAdquisiciones =
            await getDocs(consultaAdquisiciones);


        /*
         * 2. Obtener solicitudes de beca
         *
         * Esto permite mostrar:
         * - becas pendientes
         * - becas rechazadas
         *
         * Las becas aprobadas no se agregan nuevamente
         * porque ya generan una adquisición aprobada.
         */

        const referenciaBecas =
            collection(db, "solicitudesBecas");

        const consultaBecas =
            query(
                referenciaBecas,
                where("uid", "==", uid)
            );

        const resultadoBecas =
            await getDocs(consultaBecas);


        const cursos = [];


        /* =====================================================
           PROCESAR ADQUISICIONES
           ===================================================== */

        for (const documento of resultadoAdquisiciones.docs) {

            const adquisicion = {
                id: documento.id,
                origen: "adquisicion",
                ...documento.data()
            };


            let datosCurso = {};

            if (adquisicion.cursoId) {

                datosCurso =
                    await obtenerDatosCurso(
                        adquisicion.cursoId
                    );
            }


            cursos.push({
                ...adquisicion,
                ...datosCurso
            });
        }


        /* =====================================================
           PROCESAR SOLICITUDES DE BECA
           ===================================================== */

        for (const documento of resultadoBecas.docs) {

            const solicitud = {
                id: documento.id,
                origen: "beca",
                ...documento.data()
            };


            /*
             * Si la beca ya fue aprobada, la adquisición
             * correspondiente ya está en la lista.
             *
             * Por eso no la agregamos nuevamente.
             */

            if (solicitud.estado === "aprobada") {
                continue;
            }


            /*
             * La estructura actual de solicitudesBecas
             * utiliza "curso", mientras que algunas
             * solicitudes pueden tener "cursoId".
             */

            const cursoId =
                solicitud.cursoId ||
                solicitud.curso;


            let datosCurso = {};


            if (cursoId) {

                datosCurso =
                    await obtenerDatosCurso(cursoId);
            }


            cursos.push({

                id: solicitud.id,

                origen: "beca",

                usuarioId: uid,

                cursoId: cursoId,

                cursoTitulo:
                    datosCurso.titulo ||
                    datosCurso.nombre ||
                    solicitud.curso ||
                    "Curso sin título",

                categoria:
                    datosCurso.categoria ||
                    datosCurso.categoriaCurso ||
                    "No disponible",

                duracion:
                    datosCurso.duracion,

                precio: 0,

                metodoPago: "beca",

                tipoBeca: solicitud.tipoBeca,

                estado: solicitud.estado,

                fechaAdquisicion:
                    solicitud.fechaSolicitud
            });
        }


        /*
         * Si no existen adquisiciones ni solicitudes
         * de beca, mostrar el mensaje correspondiente.
         */

        if (cursos.length === 0) {

            mostrarCargando(false);

            mostrarMensaje(
                "Todavía no tenés cursos adquiridos, explorá nuestro catálogo para encontrar un curso que te interese.",
                "info"
            );

            return;
        }


        /*
         * Ordenar del más reciente al más antiguo.
         */

        cursos.sort(
            (a, b) =>
                obtenerMilisegundos(
                    b.fechaAdquisicion
                ) -
                obtenerMilisegundos(
                    a.fechaAdquisicion
                )
        );


        contenedor.innerHTML = "";


        cursos.forEach((curso) => {

            const tarjeta =
                crearTarjetaCurso(curso);

            contenedor.appendChild(tarjeta);
        });


        mostrarCargando(false);

        contenedor.classList.remove("d-none");


    } catch (error) {

        console.error(
            "Error al cargar Mis cursos:",
            error
        );

        mostrarCargando(false);

        mostrarMensaje(
            "No fue posible cargar tus cursos. Intentá nuevamente.",
            "danger"
        );
    }
}


/* =========================================================
   OBTENER DATOS DEL CURSO
   ========================================================= */

async function obtenerDatosCurso(cursoId) {

    if (!cursoId) {
        return {};
    }


    try {

        const referenciaCurso =
            doc(
                db,
                "cursoscc",
                cursoId
            );


        const resultadoCurso =
            await getDoc(referenciaCurso);


        if (resultadoCurso.exists()) {

            return resultadoCurso.data();
        }

    } catch (error) {

        console.error(
            "Error al obtener los datos del curso:",
            error
        );
    }


    return {};
}


/* =========================================================
   CREAR TARJETA
   ========================================================= */

function crearTarjetaCurso(curso) {

    const columna =
        document.createElement("div");

    columna.className =
        "col-12 col-md-6 col-xl-4";


    const tarjeta =
        document.createElement("article");

    tarjeta.className =
        "card h-100 shadow-sm";


    const cuerpo =
        document.createElement("div");

    cuerpo.className =
        "card-body d-flex flex-column";


    const estado =
        obtenerEstado(curso.estado);


    const metodo =
        obtenerMetodo(curso);


    const cursoTitulo =
        curso.cursoTitulo ||
        curso.titulo ||
        curso.nombre ||
        "Curso sin título";


    cuerpo.innerHTML = `

        <div class="d-flex justify-content-between align-items-start mb-3">

            <h2 class="h5 mb-0">
                ${escaparHTML(cursoTitulo)}
            </h2>

            <span class="badge ${estado.clase}">
                ${estado.texto}
            </span>

        </div>


        <div class="mb-3">

            <p class="mb-2">
                <strong>Categoría:</strong>
                ${escaparHTML(
                    curso.categoria ||
                    curso.categoriaCurso ||
                    "No disponible"
                )}
            </p>


            <p class="mb-2">
                <strong>Modalidad:</strong>
                Virtual
            </p>


            <p class="mb-2">
                <strong>Duración:</strong>
                ${escaparHTML(
                    formatearDuracion(curso.duracion)
                )}
            </p>


            <p class="mb-2">
                <strong>
                    ${
                        curso.origen === "beca"
                            ? "Fecha de solicitud:"
                            : "Fecha de inscripción:"
                    }
                </strong>

                ${formatearFecha(
                    curso.fechaAdquisicion
                )}
            </p>


            <p class="mb-2">
                <strong>Tipo de adquisición:</strong>
                ${metodo.tipo}
            </p>


            ${metodo.detalle}


            <p class="mb-0">
                <strong>Importe:</strong>
                ${formatearPrecio(curso.precio)}
            </p>

        </div>


        <div class="mt-auto pt-3">

            ${
                curso.estado === "aprobada"
                    ? `
                        <a
                            href="contenidoCurso.html?curso=${encodeURIComponent(curso.cursoId)}"
                            class="btn btn-success w-100"
                        >
                            <i class="bi bi-play-circle me-2"></i>
                            Acceder al curso
                        </a>
                    `
                    : `
                        <button
                            type="button"
                            class="btn btn-secondary w-100"
                            disabled
                        >
                            <i class="bi bi-lock me-2"></i>
                            Acceso no disponible
                        </button>
                    `
            }

        </div>

    `;


    tarjeta.appendChild(cuerpo);
    columna.appendChild(tarjeta);


    return columna;
}


/* =========================================================
   ESTADO
   ========================================================= */

function obtenerEstado(estado) {

    switch (estado) {

        case "aprobada":
            return {
                texto: "Aprobada",
                clase: "text-bg-success"
            };


        case "pendiente":
            return {
                texto: "Pendiente",
                clase: "text-bg-warning"
            };


        case "rechazada":
            return {
                texto: "Rechazada",
                clase: "text-bg-danger"
            };


        default:
            return {
                texto: "Sin estado",
                clase: "text-bg-secondary"
            };
    }
}


/* =========================================================
   MÉTODO DE ADQUISICIÓN
   ========================================================= */

function obtenerMetodo(curso) {

    if (curso.metodoPago === "tarjeta") {

        return {

            tipo: "Pago",

            detalle: `
                <p class="mb-2">
                    <strong>Método de pago:</strong>
                    Tarjeta
                </p>
            `
        };
    }


    if (curso.metodoPago === "transferencia") {

        return {

            tipo: "Pago",

            detalle: `
                <p class="mb-2">
                    <strong>Método de pago:</strong>
                    Transferencia bancaria
                </p>

                ${
                    curso.comprobanteUrl
                        ? `
                            <p class="mb-2">
                                <strong>Comprobante:</strong>
                                <a
                                    href="${escaparHTML(curso.comprobanteUrl)}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="link-primary"
                                >
                                    Ver comprobante
                                </a>
                            </p>
                        `
                        : ""
                }
            `
        };
    }


    if (curso.metodoPago === "beca") {

        return {

            tipo: "Beca",

            detalle: `
                <p class="mb-2">
                    <strong>Tipo de beca:</strong>
                    ${escaparHTML(
                        obtenerNombreBeca(
                            curso.tipoBeca
                        )
                    )}
                </p>
            `
        };
    }


    return {

        tipo: "No especificado",

        detalle: ""
    };
}


/* =========================================================
   NOMBRE DE BECA
   ========================================================= */

function obtenerNombreBeca(tipo) {

    switch (tipo) {

        case "acceso":
            return "Beca de acceso";


        case "rendimiento":
            return "Beca de rendimiento";


        case "inclusion":
            return "Beca de inclusión";


        default:
            return "No especificada";
    }
}


/* =========================================================
   DURACIÓN
   ========================================================= */

function formatearDuracion(duracion) {

    if (!duracion) {
        return "No disponible";
    }


    if (typeof duracion === "number") {

        return `${duracion} horas`;
    }


    return String(duracion);
}


/* =========================================================
   PRECIO
   ========================================================= */

function formatearPrecio(precio) {

    return Number(
        precio || 0
    ).toLocaleString(
        "es-UY",
        {
            style: "currency",
            currency: "UYU"
        }
    );
}


/* =========================================================
   FECHA
   ========================================================= */

function formatearFecha(timestamp) {

    if (!timestamp) {
        return "No disponible";
    }


    try {

        if (
            typeof timestamp.toDate === "function"
        ) {

            return timestamp
                .toDate()
                .toLocaleDateString("es-UY");
        }


        if (timestamp.seconds) {

            return new Date(
                timestamp.seconds * 1000
            ).toLocaleDateString("es-UY");
        }


        return new Date(
            timestamp
        ).toLocaleDateString("es-UY");

    } catch {

        return "No disponible";
    }
}


/* =========================================================
   MILISEGUNDOS
   ========================================================= */

function obtenerMilisegundos(timestamp) {

    if (!timestamp) {
        return 0;
    }


    try {

        if (
            typeof timestamp.toDate === "function"
        ) {

            return timestamp
                .toDate()
                .getTime();
        }


        if (timestamp.seconds) {

            return Number(
                timestamp.seconds
            ) * 1000;
        }


        return new Date(
            timestamp
        ).getTime();

    } catch {

        return 0;
    }
}


/* =========================================================
   ESCAPAR HTML
   ========================================================= */

function escaparHTML(texto) {

    return String(
        texto ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


/* =========================================================
   CARGANDO
   ========================================================= */

function mostrarCargando(mostrar) {

    if (!cargando) {
        return;
    }


    cargando.classList.toggle(
        "d-none",
        !mostrar
    );
}


/* =========================================================
   MENSAJE
   ========================================================= */

function mostrarMensaje(texto, tipo) {

    if (!mensaje) {
        return;
    }


    mensaje.innerHTML = `
        <div
            class="alert alert-${tipo}"
            role="alert"
        >
            ${escaparHTML(texto)}
        </div>
    `;
}


/* =========================================================
   LIMPIAR MENSAJE
   ========================================================= */

function limpiarMensaje() {

    if (mensaje) {
        mensaje.innerHTML = "";
    }
}

