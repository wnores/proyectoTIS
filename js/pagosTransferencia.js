
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
    updateDoc,
    getDoc,
    runTransaction
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


const contenedor =
    document.getElementById("contenedorPagosTransferencia");

const botonMostrarPagos =
    document.getElementById("btnMostrarPagosTransferencia");

if (botonMostrarPagos) {

    botonMostrarPagos.addEventListener(
        "click",
        () => {
            const estaOculto =
                contenedor.classList.contains("d-none");
            if (estaOculto) {
                contenedor.classList.remove(
                    "d-none"
                );
                botonMostrarPagos.innerHTML = `
                    <i class="bi bi-chevron-up me-2"></i>
                    Ocultar pagos
                `;
                cargarPagosPendientes();
            } else {
                contenedor.classList.add(
                    "d-none"
                );
                botonMostrarPagos.innerHTML = `
                    <i class="bi bi-credit-card me-2"></i>
                    Ver pagos pendientes
                `;
            }
        }
    );
}

onAuthStateChanged(
    auth,
    async (usuario) => {
        if (!usuario) {
            mostrarMensaje(
                "Debés iniciar sesión para acceder a esta sección."
            );
            return;
        }

        try {
            const referenciaUsuario =
                doc(
                    db,
                    "usuarios",
                    usuario.uid
                );
            const resultadoUsuario =
                await getDoc(
                    referenciaUsuario
                );

            if (!resultadoUsuario.exists()) {

                mostrarMensaje(
                    "No se encontraron los datos del usuario."
                );

                return;
            }

            const datosUsuario =
                resultadoUsuario.data();

            const tipoUsuario =
                (
                    datosUsuario.tipoUsuario ||
                    datosUsuario.rol ||
                    ""
                )
                    .toString()
                    .trim()
                    .toLowerCase();

            if (tipoUsuario !== "docente/admin") {

                mostrarMensaje(
                    "No tenés permisos para acceder a esta sección."
                );

                return;
            }

        } catch (error) {

            console.error(
                "Error al verificar permisos:",
                error
            );

            mostrarMensaje(
                "No fue posible verificar los permisos."
            );
        }
    }
);

async function cargarPagosPendientes() {
    try {

        const referenciaAdquisiciones =
            collection(
                db,
                "adquisiciones"
            );

        const consulta =
            query(
                referenciaAdquisiciones,
                where(
                    "metodoPago",
                    "==",
                    "transferencia"
                ),
                where(
                    "estado",
                    "==",
                    "pendiente"
                )
            );

        const resultado =
            await getDocs(
                consulta
            );

        if (resultado.empty) {

            mostrarMensaje(
                "No hay pagos por transferencia pendientes."
            );

            return;
        }

        contenedor.innerHTML = "";

        for (
            const documento
            of resultado.docs
        ) {

            const adquisicion = {
                id: documento.id,
                ...documento.data()
            };

            let nombreUsuario =
                "Usuario no disponible";

            let correoUsuario =
                adquisicion.usuarioCorreo ||
                "Correo no disponible";

            if (adquisicion.usuarioId) {
                try {
                    const referenciaUsuario =
                        doc(
                            db,
                            "usuarios",
                            adquisicion.usuarioId
                        );

                    const resultadoUsuario =
                        await getDoc(
                            referenciaUsuario
                        );

                    if (
                        resultadoUsuario.exists()
                    ) {

                        const datosUsuario =
                            resultadoUsuario.data();

                        nombreUsuario =
                            `${datosUsuario.nombre || ""} ${datosUsuario.apellido || ""}`
                                .trim() ||
                            "Usuario sin nombre";

                        correoUsuario =
                            datosUsuario.email ||
                            adquisicion.usuarioCorreo ||
                            "Correo no disponible";
                    }

                } catch (error) {

                    console.error(
                        "Error al obtener los datos del usuario:",
                        error
                    );
                }
            }

            const tarjeta =
                crearTarjetaPago(
                    documento.id,
                    adquisicion,
                    nombreUsuario,
                    correoUsuario
                );

            contenedor.appendChild(
                tarjeta
            );
        }

    } catch (error) {

        console.error(
            "Error al cargar pagos pendientes:",
            error
        );

        mostrarMensaje(
            "No fue posible cargar los pagos pendientes."
        );
    }
}

function crearTarjetaPago(
    idAdquisicion,
    adquisicion,
    nombreUsuario,
    correoUsuario
) {

    const columna =
        document.createElement("div");

    columna.className =
        "col-12 col-md-6 col-lg-4";

    const tarjeta =
        document.createElement("article");

    tarjeta.className =
        "card h-100 shadow-sm";

    const cuerpo =
        document.createElement("div");

    cuerpo.className =
        "card-body";

    const fecha =
        formatearFecha(
            adquisicion.fechaAdquisicion
        );

    const tituloCurso =
        escaparHTML(
            adquisicion.cursoTitulo ||
            "Curso sin título"
        );

    const nombre =
        escaparHTML(
            nombreUsuario
        );

    const correo =
        escaparHTML(
            correoUsuario
        );

    const importe =
        formatearPrecio(
            adquisicion.precio
        );

    let comprobanteHTML = "";

    if (
        adquisicion.comprobanteUrl
    ) {
        comprobanteHTML = `
            <div class="mb-3">
                <strong>
                    Comprobante:
                </strong>
                <div class="mt-2">
                    <a
                        href="${escaparHTML(adquisicion.comprobanteUrl)}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="btn btn-outline-primary btn-sm"
                    >
                        <i class="bi bi-file-earmark-image me-2"></i>
                        Ver comprobante
                    </a>
                </div>
                ${
                    adquisicion.comprobanteNombre
                        ? `
                            <small class="text-muted d-block mt-2">
                                ${escaparHTML(
                                    adquisicion.comprobanteNombre
                                )}
                            </small>
                        `
                        : ""
                }
            </div>
        `;
    } else {
        comprobanteHTML = `
            <div class="alert alert-warning py-2 mb-3">
                <i class="bi bi-exclamation-triangle me-2"></i>
                No se encontró un comprobante asociado.
            </div>
        `;
    }

    cuerpo.innerHTML = `
        <div class="d-flex justify-content-between align-items-start mb-3">
            <div>
                <h3 class="h5 mb-1">
                    ${tituloCurso}
                </h3>
                <span class="badge text-bg-warning">
                    Pendiente
                </span>
            </div>
            <i class="bi bi-bank fs-3 text-success"></i>
        </div>
        <p class="mb-2">
            <strong>
                Estudiante:
            </strong>
            ${nombre}
        </p>
        <p class="mb-2">
            <strong>
                Correo:
            </strong>
            ${correo}
        </p>
        <p class="mb-2">
            <strong>
                Importe:
            </strong>
            ${importe}
        </p>
        <p class="mb-3">
            <strong>
                Fecha:
            </strong>
            ${fecha}
        </p>
        ${comprobanteHTML}
        <div class="d-flex gap-2">
            <button
                type="button"
                class="btn btn-success flex-fill btn-aprobar-transferencia"
            >
                <i class="bi bi-check-circle me-2"></i>
                Aprobar
            </button>
            <button
                type="button"
                class="btn btn-danger flex-fill btn-rechazar-transferencia"
            >
                <i class="bi bi-x-circle me-2"></i>
                Rechazar
            </button>
        </div>
    `;
    const botonAprobar =
        cuerpo.querySelector(
            ".btn-aprobar-transferencia"
        );
    const botonRechazar =
        cuerpo.querySelector(
            ".btn-rechazar-transferencia"
        );
    botonAprobar.addEventListener(
        "click",
        () =>
            aprobarPago(
                idAdquisicion,
                botonAprobar
            )
    );

    botonRechazar.addEventListener(
        "click",
        () =>
            rechazarPago(
                idAdquisicion,
                botonRechazar
            )
    );

    tarjeta.appendChild(
        cuerpo
    );

    columna.appendChild(
        tarjeta
    );

    return columna;
}

async function aprobarPago(
    idAdquisicion,
    boton
) {
    const confirmar =
        confirm(
            "¿Confirmás que la transferencia bancaria fue recibida?"
        );

    if (!confirmar) {
        return;
    }
    try {
        boton.disabled = true;

        boton.innerHTML = `
            <span
                class="spinner-border spinner-border-sm me-2"
                aria-hidden="true">
            </span>
            Aprobando...
        `;

        const referenciaAdquisicion =
            doc(
                db,
                "adquisiciones",
                idAdquisicion
            );

        await runTransaction(
            db,
            async (transaccion) => {
                const resultadoAdquisicion =
                    await transaccion.get(
                        referenciaAdquisicion
                    );

                if (
                    !resultadoAdquisicion.exists()
                ) {

                    throw new Error(
                        "ADQUISICION_NO_EXISTE"
                    );
                }

                const adquisicion =
                    resultadoAdquisicion.data();

                if (
                    adquisicion.estado !==
                    "pendiente"
                ) {

                    throw new Error(
                        "PAGO_YA_PROCESADO"
                    );
                }

                if (
                    !adquisicion.cursoId
                ) {

                    throw new Error(
                        "CURSO_NO_EXISTE"
                    );
                }

                const referenciaCurso =
                    doc(
                        db,
                        "cursoscc",
                        adquisicion.cursoId
                    );


                const resultadoCurso =
                    await transaccion.get(
                        referenciaCurso
                    );


                if (
                    !resultadoCurso.exists()
                ) {

                    throw new Error(
                        "CURSO_NO_EXISTE"
                    );
                }


                const cuposActuales =
                    Number(
                        resultadoCurso
                            .data()
                            .cupos_disponibles ||
                        0
                    );


                if (
                    cuposActuales <= 0
                ) {

                    throw new Error(
                        "SIN_CUPOS"
                    );
                }

                transaccion.update(
                    referenciaCurso,
                    {
                        cupos_disponibles:
                            cuposActuales - 1
                    }
                );

                transaccion.update(
                    referenciaAdquisicion,
                    {
                        estado:
                            "aprobada"
                    }
                );
            }
        );

        alert(
            "El pago fue aprobado correctamente."
        );

        await cargarPagosPendientes();

    } catch (error) {

        console.error(
            "Error al aprobar el pago:",
            error
        );

        if (
            error.message ===
            "SIN_CUPOS"
        ) {

            alert(
                "No se puede aprobar el pago porque el curso no tiene cupos."
            );

        } else if (
            error.message ===
            "PAGO_YA_PROCESADO"
        ) {

            alert(
                "Este pago ya fue procesado anteriormente."
            );

        } else if (
            error.message ===
            "CURSO_NO_EXISTE"
        ) {

            alert(
                "No se encontró el curso asociado al pago."
            );

        } else if (
            error.message ===
            "ADQUISICION_NO_EXISTE"
        ) {

            alert(
                "No se encontró la adquisición."
            );

        } else {

            alert(
                "No fue posible aprobar el pago. Intentá nuevamente."
            );
        }

        boton.disabled =
            false;

        boton.innerHTML = `
            <i class="bi bi-check-circle me-2"></i>
            Aprobar
        `;
    }
}

async function rechazarPago(
    idAdquisicion,
    boton
) {

    const confirmar =
        confirm(
            "¿Confirmás que querés rechazar este pago por transferencia?"
        );

    if (!confirmar) {
        return;
    }

    try {

        boton.disabled =
            true;

        boton.innerHTML = `
            <span
                class="spinner-border spinner-border-sm me-2"
                aria-hidden="true">
            </span>
            Rechazando...
        `;

        const referenciaAdquisicion =
            doc(
                db,
                "adquisiciones",
                idAdquisicion
            );

        await updateDoc(
            referenciaAdquisicion,
            {
                estado:
                    "rechazada"
            }
        );

        alert(
            "El pago fue rechazado correctamente."
        );

        await cargarPagosPendientes();

    } catch (error) {

        console.error(
            "Error al rechazar el pago:",
            error
        );

        alert(
            "No fue posible rechazar el pago. Intentá nuevamente."
        );

        boton.disabled =
            false;

        boton.innerHTML = `
            <i class="bi bi-x-circle me-2"></i>
            Rechazar
        `;
    }
}

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

function formatearFecha(timestamp) {

    if (!timestamp) {
        return "No disponible";
    }

    try {

        if (
            typeof timestamp.toDate ===
            "function"
        ) {

            return timestamp
                .toDate()
                .toLocaleString(
                    "es-UY"
                );
        }

        if (
            timestamp.seconds
        ) {

            return new Date(
                Number(
                    timestamp.seconds
                ) * 1000
            ).toLocaleString(
                "es-UY"
            );
        }

        return new Date(
            timestamp
        ).toLocaleString(
            "es-UY"
        );

    } catch {

        return "No disponible";
    }
}

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

function mostrarMensaje(mensaje) {

    if (!contenedor) {
        return;
    }

    contenedor.innerHTML = `

        <div class="col-12 text-center">

            <div class="alert alert-info">

                ${escaparHTML(mensaje)}

            </div>

        </div>

    `;
}
