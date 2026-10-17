import { auth, db } from './firebase-config.js';

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    doc,
    getDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


function obtenerCursoDesdeURL() {
    const parametros = new URLSearchParams(window.location.search);
    return parametros.get("curso");
}

function mostrarNotificacionExito() {
    const notificacion = document.createElement("div");
    notificacion.className = "alert alert-success position-fixed top-0 start-50 translate-middle-x mt-3 shadow";
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

async function controlarAccesoBoton(usuario) {
    const botonSolicitar = document.getElementById("btnSolicitarBeca");

    if (!botonSolicitar) {
        return;
    }

    // El botón siempre se mantiene visible
    botonSolicitar.hidden = false;

    // Si no hay sesión iniciada, dejar desactivado
    if (!usuario) {
        botonSolicitar.disabled = true;
        return;
    }

    try {
        const datosUsuario = await obtenerDatosUsuario(usuario.uid);

        const rol = (
            datosUsuario?.tipoUsuario ||
            datosUsuario?.rol ||
            ""
        ).toLowerCase().trim();

        const esEstudiante = rol === "estudiante";

        // Se desactiva si NO es estudiante (por ejemplo docente/admin)
        botonSolicitar.disabled = !esEstudiante;

    } catch (error) {
        console.error("Error al verificar el rol para solicitar una beca:", error);
        botonSolicitar.disabled = true;
    }
}

async function cargarCursosEnSelect(cursoSeleccionado = null) {
    const selectCurso = document.getElementById("curso");

    if (!selectCurso) {
        console.error("No se encontró el elemento #curso.");
        return;
    }

    try {
        const cursosRef = collection(db, "cursoscc");
        const resultado = await getDocs(cursosRef);

        selectCurso.innerHTML = `
            <option value="">
                Seleccioná un curso
            </option>
        `;

        resultado.forEach((documento) => {
            const curso = documento.data();

            if (curso.activo !== false) {
                const opcion = document.createElement("option");
                opcion.value = documento.id;
                opcion.textContent = curso.titulo || "Curso sin título";

                if (cursoSeleccionado && documento.id === cursoSeleccionado) {
                    opcion.selected = true;
                }
                selectCurso.appendChild(opcion);
            }
        });

        if (cursoSeleccionado) {
            const cursoExiste = Array.from(selectCurso.options).some(
                opcion => opcion.value === cursoSeleccionado
            );

            if (!cursoExiste) {
                console.warn("El curso indicado en la URL no existe o no está activo:", cursoSeleccionado);
            }
        }

    } catch (error) {
        console.error("Error al cargar los cursos:", error);
        selectCurso.innerHTML = `
            <option value="">
                No se pudieron cargar los cursos
            </option>
        `;
    }
}

async function obtenerDatosUsuario(uid) {
    try {
        const referenciaUsuario = doc(db, "usuarios", uid);
        const documentoUsuario = await getDoc(referenciaUsuario);

        if (documentoUsuario.exists()) {
            return documentoUsuario.data();
        }
        return null;
    } catch (error) {
        console.error("Error al obtener el usuario:", error);
        return null;
    }
}

async function validarSolicitudBeca(uid, cursoId, tipoBeca) {
    const datosUsuario = await obtenerDatosUsuario(uid);

    if (!datosUsuario) {
        throw new Error("No se pudieron verificar los datos del usuario.");
    }

    const rol = (
        datosUsuario.tipoUsuario ||
        datosUsuario.rol ||
        ""
    ).toLowerCase().trim();

    if (rol !== "estudiante") {
        throw new Error("Solo los estudiantes pueden solicitar becas.");
    }

    const normalizarTipoBeca = (tipo) =>
        (tipo || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();

    const tipoSolicitado = normalizarTipoBeca(tipoBeca);

    const consultaAdquisiciones = query(
        collection(db, "adquisiciones"),
        where("usuarioId", "==", uid)
    );

    const resultadoAdquisiciones = await getDocs(consultaAdquisiciones);
    const adquisiciones = resultadoAdquisiciones.docs.map(doc => doc.data());

    const cursoAdquiridoPorPago = adquisiciones.some(adquisicion => {
        const metodoPago = (adquisicion.metodoPago || "").toLowerCase().trim();
        return (
            adquisicion.cursoId === cursoId &&
            metodoPago !== "beca"
        );
    });

    if (cursoAdquiridoPorPago) {
        throw new Error(
            "Ya adquiriste este curso mediante un pago. No podés solicitar una beca para el mismo curso."
        );
    }

    const consultaSolicitudes = query(
        collection(db, "solicitudesBecas"),
        where("uid", "==", uid)
    );

    const resultadoSolicitudes = await getDocs(consultaSolicitudes);
    const solicitudes = resultadoSolicitudes.docs.map(doc => doc.data());

    for (const solicitud of solicitudes) {
        const estado = (solicitud.estado || "").toLowerCase().trim();
        const mismoTipo = normalizarTipoBeca(solicitud.tipoBeca) === tipoSolicitado;

        if (estado !== "aprobada" || !mismoTipo) {
            continue;
        }

        const idCursoAnterior = solicitud.cursoId || solicitud.curso;
        if (!idCursoAnterior) {
            continue;
        }

        const referenciaEntrega = doc(
            db,
            "cursoscc",
            idCursoAnterior,
            "entregas",
            uid
        );

        const documentoEntrega = await getDoc(referenciaEntrega);

        const cursoFinalizado =
            documentoEntrega.exists() &&
            documentoEntrega.data().cursoFinalizado === true;

        if (!cursoFinalizado) {
            throw new Error(
                "Ya tenés una beca de este tipo aprobada para un curso que todavía no finalizaste. Debés aprobar la actividad final con una nota mínima de 6 para volver a solicitar este tipo de beca. Podés solicitar los otros tipos."
            );
        }
    }

    const solicitudPendiente = solicitudes.some(solicitud => {
        const estado = (solicitud.estado || "").toLowerCase().trim();
        const idCursoSolicitado = solicitud.cursoId || solicitud.curso;

        return (
            estado === "pendiente" &&
            idCursoSolicitado === cursoId &&
            normalizarTipoBeca(solicitud.tipoBeca) === tipoSolicitado
        );
    });

    if (solicitudPendiente) {
        throw new Error(
            "Ya tenés una solicitud pendiente de este tipo de beca para este curso."
        );
    }

    return true;
}

function inicializarFormularioBeca(usuario) {
    const formulario = document.getElementById("formularioBeca");
    if (!formulario) {
        console.error("No se encontró el formulario #formularioBeca.");
        return;
    }

    const campoNombre = document.getElementById("nombre");
    const campoCorreo = document.getElementById("correo");
    const botonEnviar = formulario.querySelector('button[type="submit"]');

    if (campoCorreo) {
        campoCorreo.value = usuario.email || "";
    }

    obtenerDatosUsuario(usuario.uid)
        .then((datosUsuario) => {
            if (datosUsuario && campoNombre) {
                campoNombre.value = `${datosUsuario.nombre || ""} ${datosUsuario.apellido || ""}`.trim();
            }
        })
        .catch((error) => {
            console.error("Error al obtener datos del usuario:", error);
        });

    if (formulario.dataset.eventoRegistrado === "true") {
        return;
    }

    formulario.dataset.eventoRegistrado = "true";

    formulario.addEventListener("submit", async (evento) => {
        evento.preventDefault();

        const nombre = document.getElementById("nombre").value.trim();
        const correo = document.getElementById("correo").value.trim();
        const curso = document.getElementById("curso").value;
        const tipoBeca = document.getElementById("tipo-beca").value;
        const motivo = document.getElementById("motivo").value.trim();

        if (!nombre) {
            alert("Ingresá tu nombre.");
            return;
        }

        if (!correo) {
            alert("No se pudo obtener tu correo electrónico.");
            return;
        }

        if (!curso) {
            alert("Seleccioná un curso.");
            return;
        }

        if (!tipoBeca) {
            alert("Seleccioná un tipo de beca.");
            return;
        }

        if (!motivo) {
            alert("Ingresá el motivo por el cual solicitás la beca.");
            return;
        }

        if (botonEnviar) {
            botonEnviar.disabled = true;
        }

        try {
            await validarSolicitudBeca(usuario.uid, curso, tipoBeca);

            const referenciaSolicitud = await addDoc(
                collection(db, "solicitudesBecas"),
                {
                    uid: usuario.uid,
                    nombre: nombre,
                    correo: correo,
                    curso: curso,
                    tipoBeca: tipoBeca,
                    motivo: motivo,
                    estado: "pendiente",
                    fechaSolicitud: serverTimestamp()
                }
            );

            await addDoc(
                collection(db, "notificaciones"),
                {
                    tipo: "beca",
                    destinatarioRol: "docente/admin",
                    estudianteId: usuario.uid,
                    autorNombre: nombre,
                    cursoId: curso,
                    solicitudId: referenciaSolicitud.id,
                    cursoTitulo: document.getElementById("curso").selectedOptions[0]?.textContent || "Curso",
                    titulo: "Nueva solicitud de beca",
                    leida: false,
                    fechaCreacion: serverTimestamp(),
                    enlace: "./administrarCursos.html"
                }
            );

            mostrarNotificacionExito();

            document.getElementById("curso").value = "";
            document.getElementById("tipo-beca").value = "";
            document.getElementById("motivo").value = "";

            const confirmacion = document.getElementById("confirmacion");
            if (confirmacion) {
                confirmacion.checked = false;
            }

        } catch (error) {
            console.error("Error al enviar la solicitud de beca:", error);
            alert("No se pudo enviar la solicitud de beca.\n\n" + error.message);
        } finally {
            if (botonEnviar) {
                botonEnviar.disabled = false;
            }
        }
    });
}

onAuthStateChanged(auth, async (usuario) => {
    if (!usuario) {
        await controlarAccesoBoton(null);
        return;
    }

    await controlarAccesoBoton(usuario);

    const cursoDesdeURL = obtenerCursoDesdeURL();
    await cargarCursosEnSelect(cursoDesdeURL);

    inicializarFormularioBeca(usuario);
});