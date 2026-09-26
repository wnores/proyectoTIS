import { db } from "./firebase-config.js";

import {
   collection,
    getDocs,
    query,
    where,
    doc,
    writeBatch,
    arrayUnion,
    getDoc,
    serverTimestamp
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

            let nombreCurso = solicitud.curso;

            const cursoId = solicitud.cursoId || solicitud.curso;

            if (cursoId) {

                try {

                    const referenciaCurso =
                        doc(
                            db,
                            "cursos",
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
                            <strong>Curso:</strong>
                            ${nombreCurso || "Curso no disponible"}
                        </p>

                        <p class="mb-2">
                            <strong>Tipo de beca:</strong>
                            ${solicitud.tipoBeca || "No especificado"}
                        </p>

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

            botonAprobar.addEventListener(
                "click",
                () => aprobarSolicitud(
                    documento.id,
                    {
                        ...solicitud,
                        cursoId: cursoId,
                        curso: nombreCurso
                    }
                )
            );

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

    const confirmar =
        confirm(
            `¿Querés aprobar la beca para el curso "${solicitud.curso}"?`
        );

    if (!confirmar) return;

    try {

        const cursoId =
            solicitud.cursoId || solicitud.curso;

        if (!cursoId) {
            alert("No se encontró el curso asociado a la solicitud.");
            return;
        }

        // ==================================================
        // OBTENER CURSO
        // ==================================================

        const referenciaCurso =
            doc(
                db,
                "cursos",
                cursoId
            );

        const resultadoCurso =
            await getDoc(referenciaCurso);

        if (!resultadoCurso.exists()) {
            alert("No se encontró el curso asociado a la solicitud.");
            return;
        }

        const datosCurso =
            resultadoCurso.data();

        const nombreCurso =
            datosCurso.titulo ||
            datosCurso.nombre ||
            datosCurso.nombreCurso ||
            "Curso sin nombre";


        // ==================================================
        // CREAR BATCH
        // ==================================================

        const batch =
            writeBatch(db);


        // ==================================================
        // ACTUALIZAR SOLICITUD DE BECA
        // ==================================================

        const referenciaSolicitud =
            doc(
                db,
                "solicitudesBecas",
                idSolicitud
            );

        batch.update(
            referenciaSolicitud,
            {
                estado: "aprobada",
                cursoId: cursoId,
                curso: nombreCurso
            }
        );


        // ==================================================
        // ACTUALIZAR USUARIO
        // ==================================================

        const referenciaUsuario =
            doc(
                db,
                "usuarios",
                solicitud.uid
            );

        batch.update(
            referenciaUsuario,
            {
                serviciosAdquiridos:
                    arrayUnion(nombreCurso),

                becasAdquiridas:
                    arrayUnion({
                        curso: nombreCurso,
                        cursoId: cursoId,
                        tipoBeca: solicitud.tipoBeca
                    })
            }
        );


        // ==================================================
        // REGISTRAR ADQUISICIÓN POR BECA
        // ==================================================

        const referenciaAdquisicion =
            doc(
                collection(db, "adquisiciones")
            );

        batch.set(
            referenciaAdquisicion,
            {
                usuarioId: solicitud.uid,
                cursoId: cursoId,
                cursoTitulo: nombreCurso,
                precio: 0,
                metodoPago: "beca",
                tipoBeca: solicitud.tipoBeca,
                fechaAdquisicion: serverTimestamp(),
                estado: "aprobada"
            }
        );


        // ==================================================
        // GUARDAR TODOS LOS CAMBIOS
        // ==================================================

        await batch.commit();


        alert(
            "La solicitud fue aprobada correctamente."
        );

        cargarSolicitudes();

    } catch (error) {

        console.error(
            "Error al aprobar la solicitud:",
            error
        );

        alert(
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