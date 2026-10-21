import { db } from "./firebase-config.js";

import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    doc,
    writeBatch,
    getDoc,
    serverTimestamp,
    runTransaction
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

// ======================================================
// ESTILOS DE MICROINTERACCIONES INYECTADOS
// ======================================================
const ESTILOS_MICROINTERACCIONES = `
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

if (!document.getElementById("estilosMicrointeraccionesBecasCSS")) {
    const estilo = document.createElement("style");
    estilo.id = "estilosMicrointeraccionesBecasCSS";
    estilo.textContent = ESTILOS_MICROINTERACCIONES;
    document.head.appendChild(estilo);
}

// ======================================================
// MODAL DE CONFIRMACIÓN CON MICROINTERACCIÓN
// ======================================================
function solicitarConfirmacionCentrada(titulo, mensaje, accionConfirmar, esPeligroso = false) {
    const idModal = "modalConfirmacionBeca";
    let modalExistente = document.getElementById(idModal);
    if (modalExistente) modalExistente.remove();

    const colorBorde = esPeligroso ? "border-danger" : "border-success";
    const bgIcono = esPeligroso ? "bg-danger bg-opacity-10 text-danger" : "bg-success bg-opacity-10 text-success";
    const icono = esPeligroso ? "bi-exclamation-triangle-fill" : "bi-question-circle-fill";
    const btnClase = esPeligroso ? "btn-danger" : "btn-success";

    const htmlModal = `
        <div class="modal fade" id="${idModal}" tabindex="-1" data-bs-backdrop="static" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-0 shadow-lg text-center p-4 border-top border-4 ${colorBorde} modal-microinteraccion">
                    <div class="modal-body p-2">
                        <div class="mb-3">
                            <span class="p-3 rounded-circle d-inline-block ${bgIcono} fs-1 icono-animado-alerta">
                                <i class="bi ${icono}"></i>
                            </span>
                        </div>
                        <h4 class="fw-bold mb-2 text-dark">${titulo}</h4>
                        <p class="text-secondary mb-4 fs-6">${mensaje}</p>
                        <div class="d-flex justify-content-center gap-2">
                            <button type="button" class="btn btn-outline-secondary px-4 rounded-pill fw-bold btn-microinteractivo" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" id="btnAceptarConfirmacionBeca" class="btn ${btnClase} px-4 rounded-pill fw-bold btn-microinteractivo">
                                <span id="txtBtnConfirmarBeca">Confirmar</span>
                                <span id="spinnerBtnConfirmarBeca" class="spinner-border spinner-border-sm d-none" role="status" aria-hidden="true"></span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML("beforeend", htmlModal);
    const modalElem = document.getElementById(idModal);
    const bsModal = new bootstrap.Modal(modalElem);

    const btnConfirmar = document.getElementById("btnAceptarConfirmacionBeca");
    btnConfirmar.addEventListener("click", async () => {
        const txt = document.getElementById("txtBtnConfirmarBeca");
        const spinner = document.getElementById("spinnerBtnConfirmarBeca");

        btnConfirmar.disabled = true;
        if (txt) txt.textContent = "Procesando...";
        if (spinner) spinner.classList.remove("d-none");

        try {
            await accionConfirmar();
        } finally {
            bsModal.hide();
        }
    });

    bsModal.show();
}

// ======================================================
// MODAL DE ALERTA CON ANIMACIÓN
// ======================================================
function mostrarAlertaCentrada(mensaje, tipo = "exito") {
    const idModal = "alertaCentradaBeca";
    let modalExistente = document.getElementById(idModal);
    if (modalExistente) modalExistente.remove();

    const configuracion = {
        exito: {
            icono: "bi-check-circle-fill",
            colorTexto: "text-success",
            colorBorde: "border-success",
            bgIcono: "bg-success bg-opacity-10",
            titulo: "¡Operación Exitosa!"
        },
        error: {
            icono: "bi-x-circle-fill",
            colorTexto: "text-danger",
            colorBorde: "border-danger",
            bgIcono: "bg-danger bg-opacity-10",
            titulo: "Ha ocurrido un error"
        },
        advertencia: {
            icono: "bi-exclamation-triangle-fill",
            colorTexto: "text-warning",
            colorBorde: "border-warning",
            bgIcono: "bg-warning bg-opacity-10",
            titulo: "Atención"
        }
    };

    const cfg = configuracion[tipo] || configuracion.exito;

    const htmlModal = `
        <div class="modal fade" id="${idModal}" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-0 shadow-lg text-center p-4 border-top border-4 ${cfg.colorBorde} modal-microinteraccion">
                    <div class="modal-body p-2">
                        <div class="mb-3">
                            <span class="p-3 rounded-circle d-inline-block ${cfg.bgIcono} ${cfg.colorTexto} fs-1 icono-animado-alerta">
                                <i class="bi ${cfg.icono}"></i>
                            </span>
                        </div>
                        <h4 class="fw-bold mb-2 text-dark">${cfg.titulo}</h4>
                        <p class="text-secondary mb-4 fs-6">${mensaje}</p>
                        <button type="button" class="btn btn-dark px-4 rounded-pill fw-bold btn-microinteractivo" data-bs-dismiss="modal">Aceptar</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML("beforeend", htmlModal);
    const modalElem = document.getElementById(idModal);
    const bsModal = new bootstrap.Modal(modalElem);
    bsModal.show();
}

const contenedor = document.getElementById("contenedorSolicitudesBecas");
const botonMostrarSolicitudes = document.getElementById("btnMostrarSolicitudesBecas");

if (botonMostrarSolicitudes) {
    botonMostrarSolicitudes.addEventListener("click", () => {
        const estaOculto = contenedor.classList.contains("d-none");

        if (estaOculto) {
            contenedor.classList.remove("d-none");
            botonMostrarSolicitudes.innerHTML = `
                <i class="bi bi-chevron-up me-2"></i>
                Ocultar solicitudes
            `;
            cargarSolicitudes();
        } else {
            contenedor.classList.add("d-none");
            botonMostrarSolicitudes.innerHTML = `
                <i class="bi bi-list-check me-2"></i>
                Ver solicitudes
            `;
        }
    });
}

function formatearFechaSolicitud(fecha) {
    if (!fecha) return "Fecha no disponible";
    let fechaReal;
    if (typeof fecha.toDate === "function") {
        fechaReal = fecha.toDate();
    } else if (fecha instanceof Date) {
        fechaReal = fecha;
    } else {
        return "Fecha no disponible";
    }

    return fechaReal.toLocaleDateString("es-UY", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}

function obtenerPorcentajesPorTipoBeca(tipoBeca) {
    const tipo = (tipoBeca || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    if (tipo.includes("acceso")) return [50, 60, 75, 90];
    if (tipo.includes("rendimiento")) return [25, 50, 75, 90];
    if (tipo.includes("inclusion")) return [50, 75, 90];

    return [];
}

async function cargarSolicitudes() {
    if (!contenedor) return;

    try {
        const consulta = query(
            collection(db, "solicitudesBecas"),
            where("estado", "==", "pendiente")
        );

        const resultado = await getDocs(consulta);
        contenedor.innerHTML = "";

        if (resultado.empty) {
            contenedor.innerHTML = `
                <div class="col-12 text-center">
                    <div class="alert alert-info">
                        No hay solicitudes de becas pendientes.
                    </div>
                </div>
            `;
            return;
        }

        resultado.forEach(async (documento) => {
            const solicitud = documento.data();
            const fechaSolicitud = formatearFechaSolicitud(solicitud.fechaSolicitud);
            let nombreCurso = solicitud.curso;
            const cursoId = solicitud.cursoId || solicitud.curso;

            if (cursoId) {
                try {
                    const referenciaCurso = doc(db, "cursoscc", cursoId);
                    const resultadoCurso = await getDoc(referenciaCurso);

                    if (resultadoCurso.exists()) {
                        const datosCurso = resultadoCurso.data();
                        nombreCurso = datosCurso.titulo || datosCurso.nombre || datosCurso.nombreCurso || solicitud.curso;
                    }
                } catch (error) {
                    console.error("Error al obtener el nombre del curso:", error);
                }
            }

            const porcentajesDisponibles = obtenerPorcentajesPorTipoBeca(solicitud.tipoBeca);
            const opcionesPorcentaje = porcentajesDisponibles
                .map(porcentaje => `<option value="${porcentaje}">${porcentaje}%</option>`)
                .join("");

            const tarjeta = document.createElement("div");
            tarjeta.className = "col-12 col-md-6 col-lg-4 mb-3";

            tarjeta.innerHTML = `
                <article class="card h-100 shadow-sm border-0 border-top border-4 border-warning modal-microinteraccion">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <div>
                                <h3 class="h5 mb-1 fw-bold">${solicitud.nombre || "Estudiante no disponible"}</h3>
                                <span class="badge bg-warning text-dark">Pendiente</span>
                            </div>
                            <i class="bi bi-award fs-3 text-warning"></i>
                        </div>

                        <p class="mb-2 small"><strong>Correo:</strong> ${solicitud.correo || "Correo no disponible"}</p>
                        <p class="mb-2 small"><strong>Fecha:</strong> ${fechaSolicitud}</p>
                        <p class="mb-2 small"><strong>Curso:</strong> ${nombreCurso || "Curso no disponible"}</p>
                        <p class="mb-2 small"><strong>Tipo:</strong> ${solicitud.tipoBeca || "No especificado"}</p>

                        <div class="mb-3">
                            <label class="form-label small fw-bold" for="porcentaje-${documento.id}">Cobertura:</label>
                            <select id="porcentaje-${documento.id}" class="form-select form-select-sm js-porcentaje-beca" required ${porcentajesDisponibles.length === 0 ? "disabled" : ""}>
                                <option value="">Seleccionar cobertura...</option>
                                ${opcionesPorcentaje}
                            </select>
                        </div>

                        <p class="mb-3 small"><strong>Motivo:</strong> ${solicitud.motivo || "No especificado"}</p>

                        <div class="d-flex gap-2">
                            <button type="button" class="btn btn-success btn-sm flex-fill js-aprobar-beca btn-microinteractivo">
                                <i class="bi bi-check-circle me-1"></i>Aprobar
                            </button>
                            <button type="button" class="btn btn-danger btn-sm flex-fill js-rechazar-beca btn-microinteractivo">
                                <i class="bi bi-x-circle me-1"></i>Rechazar
                            </button>
                        </div>
                    </div>
                </article>
            `;

            const botonAprobar = tarjeta.querySelector(".js-aprobar-beca");
            const botonRechazar = tarjeta.querySelector(".js-rechazar-beca");

            botonAprobar.addEventListener("click", () => {
                const selectorPorcentaje = tarjeta.querySelector(".js-porcentaje-beca");
                const porcentajeBeca = Number(selectorPorcentaje.value);

                if (!selectorPorcentaje.value || !porcentajesDisponibles.includes(porcentajeBeca)) {
                    mostrarAlertaCentrada("Seleccioná un porcentaje de cobertura válido antes de aprobar.", "advertencia");
                    return;
                }

                solicitarConfirmacionCentrada(
                    "Aprobar Solicitud de Beca",
                    `¿Querés aprobar la beca del ${porcentajeBeca}% para ${solicitud.nombre || 'el estudiante'} en el curso "${nombreCurso}"?`,
                    () => aprobarSolicitud(documento.id, {
                        ...solicitud,
                        cursoId: cursoId,
                        curso: nombreCurso,
                        porcentajeBeca: porcentajeBeca
                    }),
                    false
                );
            });

            botonRechazar.addEventListener("click", () => {
                solicitarConfirmacionCentrada(
                    "Rechazar Solicitud de Beca",
                    `¿Estás seguro de rechazar la solicitud de beca de ${solicitud.nombre || 'el estudiante'}?`,
                    () => rechazarSolicitud(documento.id, solicitud),
                    true
                );
            });

            contenedor.appendChild(tarjeta);
        });

    } catch (error) {
        console.error("Error al cargar las solicitudes de becas:", error);
        contenedor.innerHTML = `<div class="col-12"><div class="alert alert-danger">No se pudieron cargar las solicitudes.</div></div>`;
    }
}

async function aprobarSolicitud(idSolicitud, solicitud) {
    const porcentajeBeca = Number(solicitud.porcentajeBeca);
    const cursoId = solicitud.cursoId || solicitud.curso;
    const uidEstudiante = solicitud.uid || solicitud.usuarioId;

    try {
        if (!cursoId || !uidEstudiante) {
            mostrarAlertaCentrada("Faltan datos del curso o del estudiante.", "error");
            return;
        }

        const referenciaCurso = doc(db, "cursoscc", cursoId);
        const referenciaSolicitud = doc(db, "solicitudesBecas", idSolicitud);
        const referenciaUsuario = doc(db, "usuarios", uidEstudiante);
        const referenciaAdquisicion = doc(collection(db, "adquisiciones"));
        let importeBeca = 0;
        let saldoPendiente = 0;

        await runTransaction(db, async (transaccion) => {
            const resultadoCurso = await transaccion.get(referenciaCurso);
            const resultadoSolicitud = await transaccion.get(referenciaSolicitud);
            const resultadoUsuario = await transaccion.get(referenciaUsuario);

            if (!resultadoCurso.exists()) throw new Error("CURSO_NO_EXISTE");
            if (!resultadoSolicitud.exists()) throw new Error("SOLICITUD_NO_EXISTE");
            if (!resultadoUsuario.exists()) throw new Error("USUARIO_NO_EXISTE");

            const datosSolicitud = resultadoSolicitud.data();
            if (datosSolicitud.estado !== "pendiente") throw new Error("SOLICITUD_YA_PROCESADA");

            const datosCurso = resultadoCurso.data();
            const precioCurso = Number(datosCurso.precio);
            if (!Number.isFinite(precioCurso) || precioCurso < 0) throw new Error("PRECIO_INVALIDO");

            const cuposActuales = Number(datosCurso.cupos_disponibles || 0);
            if (cuposActuales <= 0) throw new Error("SIN_CUPOS");

            const nombreCurso = datosCurso.titulo || datosCurso.nombre || datosCurso.nombreCurso || "Curso";

            importeBeca = Math.round(precioCurso * porcentajeBeca) / 100;
            saldoPendiente = Math.round((precioCurso - importeBeca) * 100) / 100;

            transaccion.update(referenciaSolicitud, {
                estado: "aprobada",
                cursoId,
                curso: nombreCurso,
                porcentajeBeca,
                precioOriginal: precioCurso,
                importeBeca,
                saldoPendiente,
                estadoPagoSaldo: saldoPendiente === 0 ? "pagado" : "pendiente"
            });

            transaccion.set(referenciaAdquisicion, {
                usuarioId: uidEstudiante,
                cursoId,
                cursoTitulo: nombreCurso,
                precio: precioCurso,
                porcentajeBeca,
                importeBeca,
                saldoPendiente,
                metodoPago: "beca",
                tipoBeca: solicitud.tipoBeca,
                fechaAdquisicion: serverTimestamp(),
                estado: "pendiente_pago",
                estadoPagoSaldo: saldoPendiente === 0 ? "pagado" : "pendiente"
            });

            transaccion.update(referenciaCurso, {
                cupos_disponibles: cuposActuales - 1
            });
        });

        // NOTIFICACIÓN EN LA CAMPANITA DEL ESTUDIANTE
        try {
            await addDoc(collection(db, "notificaciones"), {
                tipo: "beca",
                destinatarioUid: uidEstudiante,
                destinatarioId: uidEstudiante,
                destinatarioRol: "estudiante",
                autorNombre: "Equipo docente",
                cursoId: cursoId,
                cursoTitulo: solicitud.curso,
                solicitudId: idSolicitud,
                porcentajeBeca: porcentajeBeca,
                titulo: "¡Tu solicitud de beca fue aprobada!",
                mensaje: `Tu solicitud para "${solicitud.curso}" fue aprobada con un ${porcentajeBeca}% de descuento.`,
                leida: false,
                fechaCreacion: serverTimestamp(),
                enlace: "misCursos.html"
            });
        } catch (errorNotificacion) {
            console.error("No se pudo enviar la notificación a la campanita:", errorNotificacion);
        }

        mostrarAlertaCentrada(`Beca aprobada del ${porcentajeBeca}%. Se notificó al estudiante en su cuenta.`, "exito");
        await cargarSolicitudes();

    } catch (error) {
        console.error("Error al aprobar la solicitud:", error);
        const mensajes = {
            SIN_CUPOS: "No hay cupos disponibles en el curso.",
            SOLICITUD_YA_PROCESADA: "Esta solicitud ya fue procesada.",
            CURSO_NO_EXISTE: "No se encontró el curso registrado.",
            SOLICITUD_NO_EXISTE: "No se encontró la solicitud."
        };
        mostrarAlertaCentrada(mensajes[error.message] || "No se pudo aprobar la beca.", "error");
    }
}

async function rechazarSolicitud(idSolicitud, solicitud = {}) {
    const uidEstudiante = solicitud.uid || solicitud.usuarioId;

    try {
        const referenciaSolicitud = doc(db, "solicitudesBecas", idSolicitud);
        const batch = writeBatch(db);

        batch.update(referenciaSolicitud, { estado: "rechazada" });
        await batch.commit();

        // NOTIFICACIÓN EN LA CAMPANITA AL RECHAZAR
        if (uidEstudiante) {
            try {
                await addDoc(collection(db, "notificaciones"), {
                    tipo: "beca",
                    destinatarioUid: uidEstudiante,
                    destinatarioId: uidEstudiante,
                    destinatarioRol: "estudiante",
                    titulo: "Solicitud de Beca Rechazada",
                    mensaje: `Lamentablemente tu solicitud de beca para "${solicitud.curso || 'el curso'}" fue rechazada.`,
                    leida: false,
                    fechaCreacion: serverTimestamp(),
                    enlace: "beca.html"
                });
            } catch (errNotif) {
                console.error("Error al notificar rechazo:", errNotif);
            }
        }

        mostrarAlertaCentrada("La solicitud fue rechazada y se le notificó al estudiante", "advertencia");
        cargarSolicitudes();

    } catch (error) {
        console.error("Error al rechazar la solicitud:", error);
        mostrarAlertaCentrada("No se pudo rechazar la solicitud.", "error");
    }
}