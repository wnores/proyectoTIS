import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import {
    collection,
    getDocs,
    query,
    where,
    doc,
    getDoc,
    runTransaction,
    writeBatch,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const ESTILOS = `
    @keyframes entradaModalSmooth {
        0% { opacity: 0; transform: scale(0.85) translateY(20px); }
        100% { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes pulsoIcono {
        0% { transform: scale(1); }
        50% { transform: scale(1.15); }
        100% { transform: scale(1); }
    }
    .modal-microinteraccion {
        animation: entradaModalSmooth 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        border-radius: 1.5rem !important;
        overflow: hidden;
    }
    .icono-animado-alerta {
        animation: pulsoIcono 1.6s infinite ease-in-out;
        display: inline-block;
    }
    .btn-microinteractivo {
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .btn-microinteractivo:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(0,0,0,0.15);
    }
    .btn-microinteractivo:active {
        transform: translateY(0);
    }
`;

if (!document.getElementById("estilosMicrointeraccionesCSS")) {
    const estilo = document.createElement("style");
    estilo.id = "estilosMicrointeraccionesCSS";
    estilo.textContent = ESTILOS;
    document.head.appendChild(estilo);
}

function crearModalDinamico(html) {
    document.querySelectorAll(".modal-dinamico").forEach((el) => {
        window.bootstrap.Modal.getInstance(el)?.hide();
    });

    const envoltorio = document.createElement("div");
    envoltorio.innerHTML = html.trim();
    const elem = envoltorio.firstElementChild;
    elem.classList.add("modal-dinamico");
    document.body.appendChild(elem);

    const modal = new window.bootstrap.Modal(elem);

    elem.addEventListener("hidden.bs.modal", () => {
        modal.dispose();
        elem.remove();
    });

    return { elem, modal };
}

function confirmarCentrado(titulo, mensaje, opciones = {}) {
    const { peligroso = false, textoConfirmar = "Confirmar" } = opciones;

    const colorBorde = peligroso ? "border-danger" : "border-success";
    const bgIcono = peligroso ? "bg-danger bg-opacity-10 text-danger" : "bg-success bg-opacity-10 text-success";
    const icono = peligroso ? "bi-exclamation-triangle-fill" : "bi-question-circle-fill";
    const btnClase = peligroso ? "btn-danger" : "btn-success";

    return new Promise((resolve) => {
        const { elem, modal } = crearModalDinamico(`
            <div class="modal fade" tabindex="-1" data-bs-backdrop="static" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content border-0 shadow-lg text-center p-4 border-top border-4 ${colorBorde} modal-microinteraccion">
                        <div class="modal-body p-2">
                            <div class="mb-3">
                                <span class="p-3 rounded-circle d-inline-block ${bgIcono} fs-1 icono-animado-alerta">
                                    <i class="bi ${icono}"></i>
                                </span>
                            </div>
                            <h4 class="fw-bold mb-2 text-dark" data-rol="titulo"></h4>
                            <p class="text-secondary mb-4 fs-6" data-rol="mensaje"></p>
                            <div class="d-flex justify-content-center gap-2">
                                <button type="button" class="btn btn-outline-secondary px-4 rounded-pill fw-bold btn-microinteractivo" data-bs-dismiss="modal">Cancelar</button>
                                <button type="button" data-rol="confirmar" class="btn ${btnClase} px-4 rounded-pill fw-bold btn-microinteractivo"></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);

        elem.querySelector('[data-rol="titulo"]').textContent = titulo;
        elem.querySelector('[data-rol="mensaje"]').textContent = mensaje;
        elem.querySelector('[data-rol="confirmar"]').textContent = textoConfirmar;

        let confirmado = false;

        elem.querySelector('[data-rol="confirmar"]').addEventListener("click", () => {
            confirmado = true;
            modal.hide();
        });

        elem.addEventListener("hidden.bs.modal", () => resolve(confirmado));

        modal.show();
    });
}

function mostrarAlertaCentrada(mensaje, tipo = "exito") {
    const configuracion = {
        exito: { icono: "bi-check-circle-fill", colorTexto: "text-success", colorBorde: "border-success", bgIcono: "bg-success bg-opacity-10", titulo: "¡Operación exitosa!" },
        error: { icono: "bi-x-circle-fill", colorTexto: "text-danger", colorBorde: "border-danger", bgIcono: "bg-danger bg-opacity-10", titulo: "Ha ocurrido un error" },
        advertencia: { icono: "bi-exclamation-triangle-fill", colorTexto: "text-warning", colorBorde: "border-warning", bgIcono: "bg-warning bg-opacity-10", titulo: "Atención" },
        info: { icono: "bi-info-circle-fill", colorTexto: "text-info", colorBorde: "border-info", bgIcono: "bg-info bg-opacity-10", titulo: "Información" }
    };

    const cfg = configuracion[tipo] || configuracion.info;

    return new Promise((resolve) => {
        const { elem, modal } = crearModalDinamico(`
            <div class="modal fade" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content border-0 shadow-lg text-center p-4 border-top border-4 ${cfg.colorBorde} modal-microinteraccion">
                        <div class="modal-body p-2">
                            <div class="mb-3">
                                <span class="p-3 rounded-circle d-inline-block ${cfg.bgIcono} ${cfg.colorTexto} fs-1 icono-animado-alerta">
                                    <i class="bi ${cfg.icono}"></i>
                                </span>
                            </div>
                            <h4 class="fw-bold mb-2 text-dark">${cfg.titulo}</h4>
                            <p class="text-secondary mb-4 fs-6" data-rol="mensaje"></p>
                            <button type="button" data-rol="aceptar" class="btn btn-dark px-4 rounded-pill fw-bold btn-microinteractivo" data-bs-dismiss="modal">Aceptar</button>
                        </div>
                    </div>
                </div>
            </div>
        `);

        elem.querySelector('[data-rol="mensaje"]').textContent = mensaje;
        elem.addEventListener("shown.bs.modal", () => elem.querySelector('[data-rol="aceptar"]')?.focus());
        elem.addEventListener("hidden.bs.modal", () => resolve());
        modal.show();
    });
}

const contenedor = document.getElementById("contenedorPagosTransferencia");
const botonMostrarPagos = document.getElementById("btnMostrarPagosTransferencia");

const ENLACE_NOTIFICACION = "misCursos.html";

if (botonMostrarPagos) {
    botonMostrarPagos.addEventListener("click", () => {
        const estaOculto = contenedor.classList.contains("d-none");

        if (estaOculto) {
            contenedor.classList.remove("d-none");
            botonMostrarPagos.innerHTML = `
                <i class="bi bi-chevron-up me-2"></i>
                Ocultar pagos
            `;
            cargarPagosPendientes();
        } else {
            contenedor.classList.add("d-none");
            botonMostrarPagos.innerHTML = `
                <i class="bi bi-credit-card me-2"></i>
                Ver pagos pendientes
            `;
        }
    });
}

onAuthStateChanged(auth, async (usuario) => {
    if (!usuario) {
        mostrarMensaje("Debés iniciar sesión para acceder a esta sección.");
        return;
    }

    try {
        const resultadoUsuario = await getDoc(doc(db, "usuarios", usuario.uid));

        if (!resultadoUsuario.exists()) {
            mostrarMensaje("No se encontraron los datos del usuario.");
            return;
        }

        const datosUsuario = resultadoUsuario.data();
        const tipoUsuario = (datosUsuario.tipoUsuario || datosUsuario.rol || "")
            .toString()
            .trim()
            .toLowerCase();

        if (tipoUsuario !== "docente/admin") {
            mostrarMensaje("No tenés permisos para acceder a esta sección.");
        }
    } catch (error) {
        console.error("Error al verificar permisos:", error);
        mostrarMensaje("No fue posible verificar los permisos.");
    }
});

async function cargarPagosPendientes() {
    try {
        const consulta = query(
            collection(db, "adquisiciones"),
            where("estado", "in", ["pendiente", "pendiente_pago"])
        );

        const resultado = await getDocs(consulta);

        const pagosPendientes = resultado.docs.filter((documento) => {
            const pago = documento.data();

            const transferenciaNormal = pago.metodoPago === "transferencia";

            const transferenciaSaldoBeca =
                pago.metodoPago === "beca" &&
                pago.metodoPagoSaldo === "transferencia" &&
                pago.estadoPagoSaldo === "pendiente";

            return transferenciaNormal || transferenciaSaldoBeca;
        });

        if (pagosPendientes.length === 0) {
            mostrarMensaje("No hay pagos por transferencia pendientes.");
            return;
        }

        contenedor.innerHTML = "";

        for (const documento of pagosPendientes) {
            const adquisicion = { id: documento.id, ...documento.data() };

            let nombreUsuario = "Usuario no disponible";
            let correoUsuario = adquisicion.usuarioCorreo || "Correo no disponible";

            if (adquisicion.usuarioId) {
                try {
                    const resultadoUsuario = await getDoc(doc(db, "usuarios", adquisicion.usuarioId));

                    if (resultadoUsuario.exists()) {
                        const datosUsuario = resultadoUsuario.data();

                        nombreUsuario =
                            `${datosUsuario.nombre || ""} ${datosUsuario.apellido || ""}`.trim() ||
                            "Usuario sin nombre";

                        correoUsuario =
                            datosUsuario.email ||
                            adquisicion.usuarioCorreo ||
                            "Correo no disponible";
                    }
                } catch (error) {
                    console.error("Error al obtener los datos del usuario:", error);
                }
            }

            contenedor.appendChild(
                crearTarjetaPago(adquisicion, nombreUsuario, correoUsuario)
            );
        }

    } catch (error) {
        console.error("Error al cargar pagos pendientes:", error);
        mostrarMensaje("No fue posible cargar los pagos pendientes.");
    }
}

function crearTarjetaPago(adquisicion, nombreUsuario, correoUsuario) {
    const columna = document.createElement("div");
    columna.className = "col-12 col-md-6 col-lg-4";

    const esPagoSaldoBeca =
        adquisicion.metodoPago === "beca" &&
        adquisicion.metodoPagoSaldo === "transferencia";

    const importe = formatearPrecio(
        esPagoSaldoBeca ? adquisicion.saldoPendiente : adquisicion.precio
    );
    const etiquetaImporte = esPagoSaldoBeca ? "Saldo a verificar:" : "Importe:";

    const comprobanteHTML = adquisicion.comprobanteUrl
        ? `
            <div class="mb-3">
                <strong>Comprobante:</strong>
                <div class="mt-2">
                    <a href="${escaparHTML(adquisicion.comprobanteUrl)}"
                       target="_blank"
                       rel="noopener noreferrer"
                       class="btn btn-outline-primary btn-sm">
                        <i class="bi bi-file-earmark-image me-2"></i>
                        Ver comprobante
                    </a>
                </div>
                ${adquisicion.comprobanteNombre
                    ? `<small class="text-muted d-block mt-2">${escaparHTML(adquisicion.comprobanteNombre)}</small>`
                    : ""}
            </div>
        `
        : `
            <div class="alert alert-warning py-2 mb-3">
                <i class="bi bi-exclamation-triangle me-2"></i>
                No se encontró un comprobante asociado.
            </div>
        `;

    columna.innerHTML = `
        <article class="card h-100 shadow-sm">
            <div class="card-body">

                <div class="d-flex justify-content-between align-items-start mb-3">
                    <div>
                        <h3 class="h5 mb-1">${escaparHTML(adquisicion.cursoTitulo || "Curso sin título")}</h3>
                        <span class="badge text-bg-warning">Pendiente</span>
                    </div>
                    <i class="bi bi-bank fs-3 text-success"></i>
                </div>

                <p class="mb-2"><strong>Estudiante:</strong> ${escaparHTML(nombreUsuario)}</p>
                <p class="mb-2"><strong>Correo:</strong> ${escaparHTML(correoUsuario)}</p>
                <p class="mb-2"><strong>${etiquetaImporte}</strong> ${importe}</p>
                <p class="mb-3"><strong>Fecha:</strong> ${formatearFecha(adquisicion.fechaAdquisicion)}</p>

                ${comprobanteHTML}

                <div class="d-flex gap-2">
                    <button type="button" class="btn btn-success flex-fill btn-microinteractivo btn-aprobar-transferencia">
                        <i class="bi bi-check-circle me-2"></i>
                        Aprobar
                    </button>
                    <button type="button" class="btn btn-danger flex-fill btn-microinteractivo btn-rechazar-transferencia">
                        <i class="bi bi-x-circle me-2"></i>
                        Rechazar
                    </button>
                </div>

            </div>
        </article>
    `;

    const botonAprobar = columna.querySelector(".btn-aprobar-transferencia");
    const botonRechazar = columna.querySelector(".btn-rechazar-transferencia");

    botonAprobar.addEventListener("click", () => aprobarPago(adquisicion.id, botonAprobar));
    botonRechazar.addEventListener("click", () => rechazarPago(adquisicion, botonRechazar));

    return columna;
}

function datosNotificacion({ usuarioId, idAdquisicion, cursoId, titulo, mensaje }) {
    return {
        tipo: "transferencia",
        destinatarioUid: usuarioId,
        destinatarioId: usuarioId,
        destinatarioRol: "estudiante",
        adquisicionId: idAdquisicion,
        cursoId: cursoId || null,
        titulo,
        mensaje,
        leida: false,
        fechaCreacion: serverTimestamp(),
        enlace: ENLACE_NOTIFICACION
    };
}

function bloquearBoton(boton, texto) {
    boton.disabled = true;
    boton.innerHTML = `
        <span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
        ${texto}
    `;
}

function restaurarBoton(boton, htmlOriginal) {
    boton.disabled = false;
    boton.innerHTML = htmlOriginal;
}

async function aprobarPago(idAdquisicion, boton) {
    const confirmado = await confirmarCentrado(
        "Aprobar transferencia",
        "¿Confirmás que la transferencia bancaria fue recibida?",
        { textoConfirmar: "Aprobar" }
    );

    if (!confirmado) return;

    const htmlOriginal = boton.innerHTML;

    try {
        bloquearBoton(boton, "Aprobando...");

        const referenciaAdquisicion = doc(db, "adquisiciones", idAdquisicion);
        const referenciaNotificacion = doc(collection(db, "notificaciones"));

        const { notificado } = await runTransaction(db, async (transaccion) => {
            const resultadoAdquisicion = await transaccion.get(referenciaAdquisicion);

            if (!resultadoAdquisicion.exists()) {
                throw new Error("ADQUISICION_NO_EXISTE");
            }

            const adquisicion = resultadoAdquisicion.data();
            const curso = adquisicion.cursoTitulo || "el curso";

            const esPagoSaldoBeca =
                adquisicion.metodoPago === "beca" &&
                adquisicion.metodoPagoSaldo === "transferencia";

            let mensaje;

            if (esPagoSaldoBeca) {
                if (adquisicion.estadoPagoSaldo !== "pendiente") {
                    throw new Error("PAGO_YA_PROCESADO");
                }

                transaccion.update(referenciaAdquisicion, {
                    saldoPendiente: 0,
                    estadoPagoSaldo: "pagado",
                    metodoPagoSaldo: "transferencia",
                    fechaPagoSaldo: new Date()
                });

                mensaje = `Verificamos el pago del saldo de tu beca para "${curso}". ¡Gracias!`;

            } else {
                if (adquisicion.estado !== "pendiente") {
                    throw new Error("PAGO_YA_PROCESADO");
                }

                if (!adquisicion.cursoId) {
                    throw new Error("CURSO_NO_EXISTE");
                }

                const referenciaCurso = doc(db, "cursoscc", adquisicion.cursoId);
                const resultadoCurso = await transaccion.get(referenciaCurso);

                if (!resultadoCurso.exists()) {
                    throw new Error("CURSO_NO_EXISTE");
                }

                const cuposActuales = Number(resultadoCurso.data().cupos_disponibles || 0);

                if (cuposActuales <= 0) {
                    throw new Error("SIN_CUPOS");
                }

                transaccion.update(referenciaCurso, { cupos_disponibles: cuposActuales - 1 });
                transaccion.update(referenciaAdquisicion, { estado: "aprobada" });

                mensaje = `Tu transferencia para "${curso}" fue verificada. ¡Ya podés acceder al curso!`;
            }

            if (!adquisicion.usuarioId) {
                return { notificado: false };
            }

            transaccion.set(
                referenciaNotificacion,
                datosNotificacion({
                    usuarioId: adquisicion.usuarioId,
                    idAdquisicion,
                    cursoId: adquisicion.cursoId,
                    titulo: "Pago aprobado",
                    mensaje
                })
            );

            return { notificado: true };
        });

        cargarPagosPendientes();

        if (notificado) {
            mostrarAlertaCentrada("La transferencia fue aprobada y se notificó al estudiante", "exito");
        } else {
            mostrarAlertaCentrada("La transferencia fue aprobada, pero no se pudo avisar al estudiante: la compra no tiene el campo usuarioId.", "advertencia");
        }

    } catch (error) {
        console.error("Error al aprobar el pago:", error);

        const mensajes = {
            SIN_CUPOS: ["No se puede aprobar el pago porque el curso no tiene cupos.", "advertencia"],
            PAGO_YA_PROCESADO: ["Este pago ya fue procesado anteriormente.", "advertencia"],
            CURSO_NO_EXISTE: ["No se encontró el curso asociado al pago.", "error"],
            ADQUISICION_NO_EXISTE: ["No se encontró la adquisición.", "error"]
        };

        const [texto, tipo] = mensajes[error.message] || [
            "No fue posible aprobar el pago. No se guardó ningún cambio. Revisá la consola.",
            "error"
        ];

        mostrarAlertaCentrada(texto, tipo);
        restaurarBoton(boton, htmlOriginal);
    }
}

async function rechazarPago(adquisicion, boton) {
    const confirmado = await confirmarCentrado(
        "Rechazar transferencia",
        "¿Confirmás que querés rechazar este pago por transferencia? Se le avisará al estudiante.",
        { peligroso: true, textoConfirmar: "Rechazar" }
    );

    if (!confirmado) return;

    const htmlOriginal = boton.innerHTML;

    try {
        bloquearBoton(boton, "Rechazando...");

        const curso = adquisicion.cursoTitulo || "el curso";
        const batch = writeBatch(db);

        batch.update(doc(db, "adquisiciones", adquisicion.id), { estado: "rechazada" });

        const notificar = Boolean(adquisicion.usuarioId);

        if (notificar) {
            batch.set(
                doc(collection(db, "notificaciones")),
                datosNotificacion({
                    usuarioId: adquisicion.usuarioId,
                    idAdquisicion: adquisicion.id,
                    cursoId: adquisicion.cursoId,
                    titulo: "Pago rechazado",
                    mensaje: `Tu comprobante de transferencia para "${curso}" fue rechazado. Si tenés dudas, contactá al equipo docente.`
                })
            );
        }

        await batch.commit();

        cargarPagosPendientes();

        if (notificar) {
            mostrarAlertaCentrada("El pago fue rechazado y se le notificó al estudiante", "advertencia");
        } else {
            mostrarAlertaCentrada("El pago fue rechazado, pero no se pudo avisar al estudiante: la compra no tiene el campo usuarioId.", "advertencia");
        }

    } catch (error) {
        console.error("Error al rechazar el pago:", error);
        mostrarAlertaCentrada("No fue posible rechazar el pago. No se guardó ningún cambio. Intentá nuevamente.", "error");
        restaurarBoton(boton, htmlOriginal);
    }
}

function formatearPrecio(precio) {
    return Number(precio || 0).toLocaleString("es-UY", {
        style: "currency",
        currency: "UYU"
    });
}

function formatearFecha(timestamp) {
    if (!timestamp) return "No disponible";

    try {
        if (typeof timestamp.toDate === "function") {
            return timestamp.toDate().toLocaleString("es-UY");
        }

        if (timestamp.seconds) {
            return new Date(Number(timestamp.seconds) * 1000).toLocaleString("es-UY");
        }

        return new Date(timestamp).toLocaleString("es-UY");
    } catch {
        return "No disponible";
    }
}

function escaparHTML(texto) {
    return String(texto ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function mostrarMensaje(mensaje) {
    if (!contenedor) return;

    contenedor.innerHTML = `
        <div class="col-12 text-center">
            <div class="alert alert-info">${escaparHTML(mensaje)}</div>
        </div>
    `;
}