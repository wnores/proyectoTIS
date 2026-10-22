import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import {
    collection,
    getDocs,
    query,
    where,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const contenidoEstudiante = document.getElementById("contenidoEstudiante");
const contenedor = document.getElementById("contenedorMisCursos");
const mensaje = document.getElementById("mensajeMisCursos");
const cargando = document.getElementById("cargandoMisCursos");

iniciarPagina();

function iniciarPagina() {
    onAuthStateChanged(auth, async (usuario) => {
        if (!usuario) {
            mostrarAccesoDenegado("Debés iniciar sesión como estudiante para ver tus cursos", "index.html");
            return;
        }

        try {
            const referenciaUsuario = doc(db, "usuarios", usuario.uid);
            const docSnap = await getDoc(referenciaUsuario);

            if (docSnap.exists()) {
                const datosUsuario = docSnap.data();
                const rol = (datosUsuario.tipoUsuario || datosUsuario.rol || "").toLowerCase().trim();

                if (rol === "estudiante") {
                    if (contenidoEstudiante) {
                        contenidoEstudiante.classList.remove("d-none");
                    }
                    await cargarMisCursos(usuario.uid);
                } else {
                    mostrarAccesoDenegado("Esta sección es exclusiva para estudiantes.", "index.html");
                }
            } else {
                mostrarAccesoDenegado("No se encontraron los datos de tu usuario.", "index.html");
            }
        } catch (error) {
            console.error("Error al verificar permisos:", error);
            mostrarAccesoDenegado("Ocurrió un error al verificar tus permisos.", "index.html");
        }
    });
}

function mostrarAccesoDenegado(mensajeTexto, destinoRedireccion) {
    if (contenidoEstudiante) {
        contenidoEstudiante.classList.add("d-none");
    }

    const contenedorMensaje = document.getElementById("mensajeSinPermiso");
    if (!contenedorMensaje) return;

    contenedorMensaje.className = "container py-5";
    contenedorMensaje.classList.remove("d-none");
    contenedorMensaje.innerHTML = `
        <style>
            @keyframes entradaSmooth {
                0% { opacity: 0; transform: translateY(20px) scale(0.95); }
                100% { opacity: 1; transform: translateY(0) scale(1); }
            }
            @keyframes pulsoAtencion {
                0% { transform: scale(1); }
                50% { transform: scale(1.08); }
                100% { transform: scale(1); }
            }
            .card-microinteraccion {
                animation: entradaSmooth 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                border-radius: 1rem;
                background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
            }
            .icono-alerta-animado {
                animation: pulsoAtencion 1.8s infinite ease-in-out;
                display: inline-block;
            }
        </style>
        <div class="row justify-content-center my-5">
            <div class="col-12 col-md-8 col-lg-6">
                <div class="card border-0 shadow-lg text-center p-4 card-microinteraccion">
                    <div class="card-body">
                        <div class="mb-3">
                            <span class="icono-alerta-animado p-3 rounded-circle bg-danger bg-opacity-10 text-danger fs-1">
                                <i class="bi bi-shield-lock-fill"></i>
                            </span>
                        </div>
                        <h2 class="h4 fw-bold text-dark mb-2">Acceso Restringido</h2>
                        <p class="text-secondary mb-4">${mensajeTexto}</p>
                        
                        <div class="d-flex justify-content-center align-items-center gap-2 mb-3">
                            <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                            <span class="small text-muted">Redirigiendo en unos segundos...</span>
                        </div>

                        <a href="${destinoRedireccion}" class="btn btn-primary btn-sm px-4 rounded-pill">
                            <i class="bi bi-house-door-fill me-1"></i> Ir ahora
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;

    setTimeout(() => {
        window.location.href = destinoRedireccion;
    }, 3500);
}

async function cargarMisCursos(uid) {
    try {
        mostrarCargando(true);
        limpiarMensaje();

        const referenciaAdquisiciones = collection(db, "adquisiciones");
        const consultaAdquisiciones = query(referenciaAdquisiciones, where("usuarioId", "==", uid));
        const resultadoAdquisiciones = await getDocs(consultaAdquisiciones);

        const referenciaBecas = collection(db, "solicitudesBecas");
        const consultaBecas = query(referenciaBecas, where("uid", "==", uid));
        const resultadoBecas = await getDocs(consultaBecas);

        const cursos = [];

        for (const documento of resultadoAdquisiciones.docs) {
            const adquisicion = {
                id: documento.id,
                origen: "adquisicion",
                ...documento.data()
            };

            let datosCurso = {};
            if (adquisicion.cursoId) {
                datosCurso = await obtenerDatosCurso(adquisicion.cursoId);
            }

            cursos.push({
                ...adquisicion,
                ...datosCurso
            });
        }

        for (const documento of resultadoBecas.docs) {
            const solicitud = {
                id: documento.id,
                origen: "beca",
                ...documento.data()
            };

            if (solicitud.estado === "aprobada") {
                continue;
            }

            const cursoId = solicitud.cursoId || solicitud.curso;
            let datosCurso = {};

            if (cursoId) {
                datosCurso = await obtenerDatosCurso(cursoId);
            }

            cursos.push({
                id: solicitud.id,
                origen: "beca",
                usuarioId: uid,
                cursoId: cursoId,
                cursoTitulo: datosCurso.titulo || datosCurso.nombre || solicitud.curso || "Curso sin título",
                categoria: datosCurso.categoria || datosCurso.categoriaCurso || "No disponible",
                duracion: datosCurso.duracion,
                precio: 0,
                metodoPago: "beca",
                tipoBeca: solicitud.tipoBeca,
                estado: solicitud.estado,
                fechaAdquisicion: solicitud.fechaSolicitud
            });
        }

        if (cursos.length === 0) {
            mostrarCargando(false);
            mostrarMensaje("Todavía no tenés cursos adquiridos, explorá nuestro catálogo para encontrar un curso que te interese.", "info");
            return;
        }

        cursos.sort((a, b) => obtenerMilisegundos(b.fechaAdquisicion) - obtenerMilisegundos(a.fechaAdquisicion));

        contenedor.innerHTML = "";
        cursos.forEach((curso) => {
            const tarjeta = crearTarjetaCurso(curso);
            contenedor.appendChild(tarjeta);
        });

        mostrarCargando(false);
        contenedor.classList.remove("d-none");

    } catch (error) {
        console.error("Error al cargar Mis cursos:", error);
        mostrarCargando(false);
        mostrarMensaje("No fue posible cargar tus cursos. Intentá nuevamente.", "danger");
    }
}

async function obtenerDatosCurso(cursoId) {
    if (!cursoId) return {};

    try {
        const referenciaCurso = doc(db, "cursoscc", cursoId);
        const resultadoCurso = await getDoc(referenciaCurso);

        if (resultadoCurso.exists()) {
            return resultadoCurso.data();
        }
    } catch (error) {
        console.error("Error al obtener los datos del curso:", error);
    }
    return {};
}

function crearTarjetaCurso(curso) {
    const columna = document.createElement("div");
    columna.className = "col-12 col-md-6 col-xl-4";

    const tarjeta = document.createElement("article");
    tarjeta.className = "card h-100 shadow-sm";

    const cuerpo = document.createElement("div");
    cuerpo.className = "card-body d-flex flex-column";

    const estado = obtenerEstado(curso.estado, curso.estadoPagoSaldo);
    const metodo = obtenerMetodo(curso);
    const cursoTitulo = curso.cursoTitulo || curso.titulo || curso.nombre || "Curso sin título";

    cuerpo.innerHTML = `
        <div class="d-flex justify-content-between align-items-start mb-3">
            <h2 class="h5 mb-0">${escaparHTML(cursoTitulo)}</h2>
            <span class="badge ${estado.clase}">${estado.texto}</span>
        </div>

        <div class="mb-3">
            <p class="mb-2"><strong>Categoría:</strong> ${escaparHTML(curso.categoria || curso.categoriaCurso || "No disponible")}</p>
            <p class="mb-2"><strong>Modalidad:</strong> Virtual</p>
            <p class="mb-2"><strong>Duración:</strong> ${escaparHTML(formatearDuracion(curso.duracion))}</p>
            <p class="mb-2">
                <strong>${curso.origen === "beca" ? "Fecha de solicitud:" : "Fecha de inscripción:"}</strong>
                ${formatearFecha(curso.fechaAdquisicion)}
            </p>
            <p class="mb-2"><strong>Tipo de adquisición:</strong> ${metodo.tipo}</p>
            ${metodo.detalle}

            ${
                curso.metodoPago === "beca" && curso.porcentajeBeca != null
                    ? `
                        <hr>
                        <p class="mb-2"><strong>Precio original:</strong> ${formatearPrecio(curso.precio)}</p>
                        <p class="mb-2"><strong>Porcentaje de beca:</strong> ${curso.porcentajeBeca}%</p>
                        <p class="mb-2 text-success"><strong>Cubierto por la beca:</strong> ${formatearPrecio(curso.importeBeca)}</p>
                        <p class="mb-2 ${Number(curso.saldoPendiente) > 0 ? "text-danger" : "text-success"}">
                            <strong>Saldo pendiente:</strong> ${formatearPrecio(curso.saldoPendiente)}
                        </p>
                    `
                    : `
                        <p class="mb-0"><strong>Importe:</strong> ${formatearPrecio(curso.precio)}</p>
                    `
            }
        </div>

        <div class="mt-auto pt-3">
            ${
                curso.metodoPago === "beca" && Number(curso.saldoPendiente) > 0 && curso.estadoPagoSaldo !== "pagado"
                    ? `
                        <a href="pasarelaDePago.html?curso=${encodeURIComponent(curso.cursoId)}&adquisicion=${encodeURIComponent(curso.id)}"
                           class="btn btn-primary w-100 mb-2">
                            <i class="bi bi-credit-card me-2"></i> Pagar saldo pendiente
                        </a>
                    `
                    : ""
            }

            ${
                (curso.estado === "aprobada" && (curso.estadoPagoSaldo === "pagado" || curso.estadoPagoSaldo == null)) ||
                (curso.metodoPago === "beca" && Number(curso.porcentajeBeca) > 0 && curso.estadoPagoSaldo === "pagado" && Number(curso.saldoPendiente) === 0)
                    ? `
                        <a href="contenidoCurso.html?curso=${encodeURIComponent(curso.cursoId)}" class="btn btn-success w-100">
                            <i class="bi bi-play-circle me-2"></i> Acceder al curso
                        </a>
                    `
                    : `
                        <button type="button" class="btn btn-secondary w-100" disabled>
                            <i class="bi bi-lock me-2"></i> Acceso no disponible
                        </button>
                    `
            }
        </div>
    `;

    tarjeta.appendChild(cuerpo);
    columna.appendChild(tarjeta);

    return columna;
}

function obtenerEstado(estado, estadoPagoSaldo) {
    if (estadoPagoSaldo === "pendiente") {
        return { texto: "Pendiente de pago", clase: "text-bg-warning" };
    }
    if (estadoPagoSaldo === "pagado") {
        return { texto: "Pago completado", clase: "text-bg-success" };
    }
    switch (estado) {
        case "aprobada":
            return { texto: "Aprobada", clase: "text-bg-success" };
        case "pendiente":
            return { texto: "Pendiente", clase: "text-bg-warning" };
        case "rechazada":
            return { texto: "Rechazada", clase: "text-bg-danger" };
        case "pendiente_pago":
            return { texto: "Pendiente de pago", clase: "text-bg-warning" };
        default:
            return { texto: "Sin estado", clase: "text-bg-secondary" };
    }
}

function obtenerMetodo(curso) {
    if (curso.metodoPago === "tarjeta") {
        return {
            tipo: "Pago",
            detalle: `<p class="mb-2"><strong>Método de pago:</strong> Tarjeta</p>`
        };
    }

    if (curso.metodoPago === "transferencia") {
        return {
            tipo: "Pago",
            detalle: `
                <p class="mb-2"><strong>Método de pago:</strong> Transferencia bancaria</p>
                ${
                    curso.comprobanteUrl
                        ? `<p class="mb-2"><strong>Comprobante:</strong> <a href="${escaparHTML(curso.comprobanteUrl)}" target="_blank" rel="noopener noreferrer" class="link-primary">Ver comprobante</a></p>`
                        : ""
                }
            `
        };
    }

    if (curso.metodoPago === "beca") {
        return {
            tipo: "Beca",
            detalle: `<p class="mb-2"><strong>Tipo de beca:</strong> ${escaparHTML(obtenerNombreBeca(curso.tipoBeca))}</p>`
        };
    }

    return { tipo: "No especificado", detalle: "" };
}

function obtenerNombreBeca(tipo) {
    switch (tipo) {
        case "acceso": return "Beca de acceso";
        case "rendimiento": return "Beca de rendimiento";
        case "inclusion": return "Beca de inclusión";
        default: return "No especificada";
    }
}

function formatearDuracion(duracion) {
    if (!duracion) return "No disponible";
    if (typeof duracion === "number") return `${duracion} horas`;
    return String(duracion);
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
            return timestamp.toDate().toLocaleDateString("es-UY");
        }
        if (timestamp.seconds) {
            return new Date(timestamp.seconds * 1000).toLocaleDateString("es-UY");
        }
        return new Date(timestamp).toLocaleDateString("es-UY");
    } catch {
        return "No disponible";
    }
}

function obtenerMilisegundos(timestamp) {
    if (!timestamp) return 0;
    try {
        if (typeof timestamp.toDate === "function") {
            return timestamp.toDate().getTime();
        }
        if (timestamp.seconds) {
            return Number(timestamp.seconds) * 1000;
        }
        return new Date(timestamp).getTime();
    } catch {
        return 0;
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

function mostrarCargando(mostrar) {
    if (cargando) cargando.classList.toggle("d-none", !mostrar);
}

function mostrarMensaje(texto, tipo) {
    if (!mensaje) return;
    mensaje.innerHTML = `
        <div class="alert alert-${tipo}" role="alert">
            ${escaparHTML(texto)}
        </div>
    `;
}

function limpiarMensaje() {
    if (mensaje) mensaje.innerHTML = "";
}