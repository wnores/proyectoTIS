import { db } from "./firebase-config.js";

import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    doc,
    writeBatch,
    arrayUnion,
    getDoc,
    serverTimestamp,
    runTransaction
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const contenedor =
    document.getElementById("contenedorSolicitudesBecas");

const botonMostrarSolicitudes =
    document.getElementById("btnMostrarSolicitudesBecas");

if (botonMostrarSolicitudes) {

    botonMostrarSolicitudes.addEventListener(
        "click",
        () => {

            const estaOculto =
                contenedor.classList.contains("d-none");

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
        }
    );
}

function formatearFechaSolicitud(fecha) {
    if (!fecha) {
        return "Fecha no disponible";
    }

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

    if (tipo.includes("acceso")) {
        return [50, 60, 75, 90];
    }

    if (tipo.includes("rendimiento")) {
        return [25, 50, 75, 90];
    }

    if (tipo.includes("inclusion")) {
        return [50, 75, 90];
    }

    return [];
}


async function cargarSolicitudes() {

    if (!contenedor) return;

    try {

        const consulta =
            query(
                collection(db, "solicitudesBecas"),
                where("estado", "==", "pendiente")
            );

        const resultado =
            await getDocs(consulta);

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

            const fechaSolicitud =
                formatearFechaSolicitud(solicitud.fechaSolicitud);

            let nombreCurso = solicitud.curso;

            const cursoId = solicitud.cursoId || solicitud.curso;

            if (cursoId) {

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

                        const datosCurso =
                            resultadoCurso.data();

                        nombreCurso =
                            datosCurso.titulo ||
                            datosCurso.nombre ||
                            datosCurso.nombreCurso ||
                            solicitud.curso;

                    }

                } catch (error) {

                    console.error(
                        "Error al obtener el nombre del curso:",
                        error
                    );

                }
            }

            
            const porcentajesDisponibles =
                obtenerPorcentajesPorTipoBeca(solicitud.tipoBeca);

            const opcionesPorcentaje = porcentajesDisponibles
                .map(porcentaje =>
                    `<option value="${porcentaje}">${porcentaje}%</option>`
                )
                .join("");


            const tarjeta =
                document.createElement("div");

            tarjeta.className =
                "col-12 col-md-6 col-lg-4";

            tarjeta.innerHTML = `

                <article class="card h-100 shadow-sm">

                    <div class="card-body">

                        <div class="d-flex justify-content-between align-items-start mb-3">

                            <div>
                                <h3 class="h5 mb-1">
                                    ${solicitud.nombre || "Estudiante no disponible"}
                                </h3>

                                <span class="badge text-bg-warning">
                                    Pendiente
                                </span>
                            </div>

                            <i class="bi bi-award fs-3 text-warning"></i>

                        </div>

                        <p class="mb-2">
                            <strong>Correo:</strong>
                            ${solicitud.correo || "Correo no disponible"}
                        </p>

                        <p class="mb-2">
                            <strong>Fecha de solicitud:</strong>
                            ${fechaSolicitud}
                        </p>

                        <p class="mb-2">
                            <strong>Curso:</strong>
                            ${nombreCurso || "Curso no disponible"}
                        </p>

                        <p class="mb-2">
                            <strong>Tipo de beca:</strong>
                            ${solicitud.tipoBeca || "No especificado"}
                        </p>

                        
                        <div class="mb-3">
                            <label class="form-label" for="porcentaje-${documento.id}">
                                Porcentaje de cobertura
                            </label>

                            <select
                                id="porcentaje-${documento.id}"
                                class="form-select js-porcentaje-beca"
                                required
                                ${porcentajesDisponibles.length === 0 ? "disabled" : ""}>

                                <option value="">Seleccionar cobertura...</option>
                                ${opcionesPorcentaje}
                            </select>

                            ${porcentajesDisponibles.length === 0
                                ? '<small class="text-danger">Tipo de beca no reconocido.</small>'
                                : ""}
                        </div>


                        <p class="mb-3">
                            <strong>Motivo:</strong>
                            ${solicitud.motivo || "No especificado"}
                        </p>

                        <div class="d-flex gap-2">

                            <button
                                type="button"
                                class="btn btn-success flex-fill js-aprobar-beca">
                                <i class="bi bi-check-circle me-2"></i>
                                Aprobar
                            </button>

                            <button
                                type="button"
                                class="btn btn-danger flex-fill js-rechazar-beca">
                                <i class="bi bi-x-circle me-2"></i>
                                Rechazar
                            </button>

                        </div>

                    </div>

                </article>

            `;

            const botonAprobar =
                tarjeta.querySelector(".js-aprobar-beca");

            const botonRechazar =
                tarjeta.querySelector(".js-rechazar-beca");

            
            botonAprobar.addEventListener("click", () => {
                const selectorPorcentaje =
                    tarjeta.querySelector(".js-porcentaje-beca");

                const porcentajeBeca =
                    Number(selectorPorcentaje.value);

                if (
                    !selectorPorcentaje.value ||
                    !porcentajesDisponibles.includes(porcentajeBeca)
                ) {
                    alert("Seleccioná un porcentaje de beca válido antes de aprobar.");
                    return;
                }

                aprobarSolicitud(documento.id, {
                    ...solicitud,
                    cursoId: cursoId,
                    curso: nombreCurso,
                    porcentajeBeca: porcentajeBeca
                });
            });


            botonRechazar.addEventListener(
                "click",
                () => rechazarSolicitud(
                    documento.id
                )
            );

            contenedor.appendChild(tarjeta);

        });

    } catch (error) {

        console.error(
            "Error al cargar las solicitudes de becas:",
            error
        );

        contenedor.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    No se pudieron cargar las solicitudes de becas.
                </div>
            </div>
        `;
    }
}


async function aprobarSolicitud(idSolicitud, solicitud) {
    const porcentajeBeca = Number(solicitud.porcentajeBeca);

    const porcentajesDisponibles =
        obtenerPorcentajesPorTipoBeca(solicitud.tipoBeca);

    if (!porcentajesDisponibles.includes(porcentajeBeca)) {
        alert("Seleccioná un porcentaje de beca válido.");
        return;
    }

    const confirmar = confirm(
        `¿Querés aprobar la beca del ${porcentajeBeca}% para el curso "${solicitud.curso}"?`
    );

    if (!confirmar) return;

    try {
        const cursoId = solicitud.cursoId || solicitud.curso;

        if (!cursoId || !solicitud.uid) {
            alert("Faltan datos del curso o del estudiante.");
            return;
        }

        const referenciaCurso = doc(db, "cursoscc", cursoId);
        const referenciaSolicitud = doc(db, "solicitudesBecas", idSolicitud);
        const referenciaUsuario = doc(db, "usuarios", solicitud.uid);
        const referenciaAdquisicion = doc(collection(db, "adquisiciones"));
        let importeBeca = 0;
        let saldoPendiente = 0;

        await runTransaction(db, async (transaccion) => {
            // Leer todos los documentos antes de escribir.
            const resultadoCurso = await transaccion.get(referenciaCurso);
            const resultadoSolicitud = await transaccion.get(referenciaSolicitud);
            const resultadoUsuario = await transaccion.get(referenciaUsuario);

            if (!resultadoCurso.exists()) {
                throw new Error("CURSO_NO_EXISTE");
            }

            if (!resultadoSolicitud.exists()) {
                throw new Error("SOLICITUD_NO_EXISTE");
            }

            if (!resultadoUsuario.exists()) {
                throw new Error("USUARIO_NO_EXISTE");
            }

            const datosSolicitud = resultadoSolicitud.data();

            if (datosSolicitud.estado !== "pendiente") {
                throw new Error("SOLICITUD_YA_PROCESADA");
            }

            const datosCurso = resultadoCurso.data();
            const precioCurso = Number(datosCurso.precio);

            if (!Number.isFinite(precioCurso) || precioCurso < 0) {
                throw new Error("PRECIO_INVALIDO");
            }

            const cuposActuales = Number(datosCurso.cupos_disponibles || 0);

            if (cuposActuales <= 0) {
                throw new Error("SIN_CUPOS");
            }

            const nombreCurso =
                datosCurso.titulo ||
                datosCurso.nombre ||
                datosCurso.nombreCurso ||
                "Curso sin nombre";

            importeBeca = Math.round(
                precioCurso * porcentajeBeca
            ) / 100;

            saldoPendiente = Math.round(
                (precioCurso - importeBeca) * 100
            ) / 100;

            // Registrar la beca concedida y el saldo pendiente.
            transaccion.update(referenciaSolicitud, {
                estado: "aprobada",
                cursoId,
                curso: nombreCurso,
                porcentajeBeca,
                precioOriginal: precioCurso,
                importeBeca,
                saldoPendiente,
                estadoPagoSaldo: saldoPendiente === 0
                    ? "pagado"
                    : "pendiente"
            });

            // Registrar el beneficio económico, no una compra pagada.
            transaccion.set(referenciaAdquisicion, {
                usuarioId: solicitud.uid,
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
                estadoPagoSaldo: saldoPendiente === 0
                    ? "pagado"
                    : "pendiente"
            });

            // Reservar el cupo del curso.
            transaccion.update(referenciaCurso, {
                cupos_disponibles: cuposActuales - 1
            });
        });

                // Notificar al estudiante que su beca fue aprobada.
        try {
            await addDoc(collection(db, "notificaciones"), {
                tipo: "beca",
                destinatarioRol: "estudiante",
                destinatarioId: solicitud.uid,
                estudianteId: solicitud.uid,
                autorNombre: "Equipo docente",
                cursoId: cursoId,
                cursoTitulo: solicitud.curso,
                solicitudId: idSolicitud,
                porcentajeBeca: porcentajeBeca,
                titulo: "¡Tu beca fue aprobada!",
                mensaje: `Tu solicitud de beca para el curso "${solicitud.curso}" fue aprobada con una cobertura del ${porcentajeBeca}%.`,
                leida: false,
                fechaCreacion: serverTimestamp(),
                enlace: "misCursos.html"
            });
        } catch (errorNotificacion) {
            console.error(
                "La beca fue aprobada, pero no se pudo crear la notificación:",
                errorNotificacion
            );
        }

        alert(
            `Beca aprobada: ${porcentajeBeca}%.\n` +
            `Importe cubierto: ${importeBeca.toLocaleString("es-UY", {
                style: "currency",
                currency: "UYU"
            })}\n` +
            `Saldo pendiente: ${saldoPendiente.toLocaleString("es-UY", {
                style: "currency",
                currency: "UYU"
            })}`
        );

        await cargarSolicitudes();

    } catch (error) {
        console.error("Error al aprobar la solicitud:", error);

        const mensajes = {
            SIN_CUPOS: "No se puede aprobar la beca porque el curso no tiene cupos.",
            SOLICITUD_YA_PROCESADA: "Esta solicitud ya fue procesada.",
            CURSO_NO_EXISTE: "No se encontró el curso.",
            SOLICITUD_NO_EXISTE: "No se encontró la solicitud.",
            USUARIO_NO_EXISTE: "No se encontró el usuario.",
            PRECIO_INVALIDO: "El precio del curso no es válido."
        };

        alert(
            mensajes[error.message] ||
            "No se pudo aprobar la solicitud. Intentá nuevamente."
        );
    }
}


async function rechazarSolicitud(idSolicitud) {

    const confirmar =
        confirm(
            "¿Querés rechazar esta solicitud de beca?"
        );

    if (!confirmar) return;

    try {

        const referenciaSolicitud =
            doc(
                db,
                "solicitudesBecas",
                idSolicitud
            );

        const batch = writeBatch(db);

        batch.update(
            referenciaSolicitud,
            {
                estado: "rechazada"
            }
        );

        await batch.commit();

        alert(
            "La solicitud fue rechazada correctamente."
        );

        cargarSolicitudes();

    } catch (error) {

        console.error(
            "Error al rechazar la solicitud:",
            error
        );

        alert(
            "No se pudo rechazar la solicitud. Intentá nuevamente."
        );
    }
}