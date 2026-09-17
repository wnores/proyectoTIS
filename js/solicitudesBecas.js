import { db } from "./firebase-config.js";

import {
   collection,
    getDocs,
    query,
    where,
    doc,
    writeBatch,
    arrayUnion,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const contenedor =
    document.getElementById("contenedorSolicitudesBecas");

cargarSolicitudes();

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

            // Si tenemos el ID del curso, buscar su nombre
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
                "col-12 col-md-6 col-lg-5";

            tarjeta.innerHTML = `

                <article class="card h-100 shadow-sm">

                    <div class="card-body">

                        <h3 class="h5">
                            ${solicitud.nombre}
                        </h3>

                        <p class="mb-2">
                            <strong>Correo:</strong>
                            ${solicitud.correo}
                        </p>

                        <p class="mb-2">
                            <strong>Curso:</strong>
                            ${nombreCurso}
                        </p>

                        <p class="mb-2">
                            <strong>Tipo de beca:</strong>
                            ${solicitud.tipoBeca}
                        </p>

                        <p class="mb-3">
                            <strong>Motivo:</strong><br>
                            ${solicitud.motivo}
                        </p>

                        <span class="badge text-bg-warning mb-3">
                            Pendiente
                        </span>

                        <div class="d-flex gap-2">

                            <button
                                type="button"
                                class="btn btn-success btn-sm js-aprobar-beca">
                                Aprobar
                            </button>

                            <button
                                type="button"
                                class="btn btn-danger btn-sm js-rechazar-beca">
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


// ======================================================
// APROBAR SOLICITUD
// ======================================================

// ======================================================
// APROBAR SOLICITUD
// ======================================================

async function aprobarSolicitud(idSolicitud, solicitud) {

    const confirmar =
        confirm(
            `¿Querés aprobar la beca para el curso "${solicitud.curso}"?`
        );

    if (!confirmar) return;

    try {

        // El ID del curso puede venir en cursoId
        // o, en solicitudes anteriores, directamente en curso
        const cursoId =
            solicitud.cursoId || solicitud.curso;

        if (!cursoId) {
            alert("No se encontró el curso asociado a la solicitud.");
            return;
        }

        // Obtener los datos reales del curso
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

        const datosCurso = resultadoCurso.data();

        const nombreCurso =
            datosCurso.titulo ||
            datosCurso.nombre ||
            datosCurso.nombreCurso ||
            "Curso sin nombre";

        const batch = writeBatch(db);

        const referenciaSolicitud =
            doc(
                db,
                "solicitudesBecas",
                idSolicitud
            );

        const referenciaUsuario =
            doc(
                db,
                "usuarios",
                solicitud.uid
            );

        // Marcar solicitud como aprobada
        batch.update(
            referenciaSolicitud,
            {
                estado: "aprobada",
                cursoId: cursoId,
                curso: nombreCurso
            }
        );

        // Agregar curso y beca al usuario
        batch.update(
            referenciaUsuario,
            {
                serviciosAdquiridos:
                    arrayUnion(nombreCurso),

                becasAdquiridas:
                    arrayUnion({
                        curso: nombreCurso,
                        tipoBeca: solicitud.tipoBeca
                    })
            }
        );

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


// ======================================================
// RECHAZAR SOLICITUD
// ======================================================

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