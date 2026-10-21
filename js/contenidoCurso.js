import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import {
    doc,
    getDoc,
    setDoc,
    collection,
    getDocs,
    query,
    where,
    writeBatch,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const CLOUDINARY_CLOUD_NAME = "fd9bzuxj";
const CLOUDINARY_UPLOAD_PRESET = "ProyectoTaller";

const contenedorPrincipalVista = document.getElementById("contenedorPrincipalVista");
const estadoCarga = document.getElementById("estadoCarga");
const mensajeError = document.getElementById("mensajeError");
const contenidoCurso = document.getElementById("contenidoCurso");
const nombreCursoRuta = document.getElementById("nombreCursoRuta");
const tituloCurso = document.getElementById("tituloCurso");
const listaModulos = document.getElementById("listaModulos");
const numeroModulo = document.getElementById("numeroModulo");
const tituloModulo = document.getElementById("tituloModulo");
const contenedorTemas = document.getElementById("contenedorTemas");
const btnForoCurso = document.getElementById("btnForoCurso");

const parametros = new URLSearchParams(window.location.search);
const cursoId = parametros.get("curso") || parametros.get("id");

let rolUsuarioActual = "";
let datosUsuarioActual = null;

if (btnForoCurso && cursoId) {
    btnForoCurso.href = `foroCurso.html?curso=${encodeURIComponent(cursoId)}`;
}

iniciarPagina();

function iniciarPagina() {
    onAuthStateChanged(auth, async (usuario) => {
        // Redirigir de inmediato si no hay sesión iniciada
        if (!usuario) {
            window.location.replace("ingresar.html");
            return;
        }

        // Si la sesión está iniciada, mostramos el contenedor principal
        if (contenedorPrincipalVista) {
            contenedorPrincipalVista.classList.remove("d-none");
        }

        if (!cursoId) {
            mostrarError("No se indicó qué curso se debe mostrar.");
            return;
        }

        try {
            const referenciaUsuario = doc(db, "usuarios", usuario.uid);
            const referenciaCurso = doc(db, "cursoscc", cursoId);

            const [resultadoUsuario, resultadoCurso] = await Promise.all([
                getDoc(referenciaUsuario),
                getDoc(referenciaCurso)
            ]);

            if (!resultadoUsuario.exists()) {
                mostrarError("No se encontraron los datos del usuario.");
                return;
            }

            if (!resultadoCurso.exists()) {
                mostrarError("El curso solicitado no existe.");
                return;
            }

            datosUsuarioActual = { uid: usuario.uid, ...resultadoUsuario.data() };
            rolUsuarioActual = (datosUsuarioActual.tipoUsuario || datosUsuarioActual.rol || "").toString().trim().toLowerCase();

            gestionarEnlaceMisCursos(rolUsuarioActual);

            const curso = {
                id: resultadoCurso.id,
                ...resultadoCurso.data()
            };

            const tieneAcceso = await comprobarAcceso(rolUsuarioActual, curso, usuario.uid);

            if (!tieneAcceso) {
                mostrarError("No tenés acceso al contenido de este curso. Debés adquirirlo o solicitar una beca.");
                return;
            }

            const modulos = await obtenerModulosConTemas(curso.id);
            mostrarCurso(curso, modulos);

            // Verificar y mostrar el estado del certificado en la barra lateral
            verificarEstadoCertificadoBarraLateral(usuario.uid, cursoId);

        } catch (error) {
            console.error("Error al cargar el contenido del curso:", error);
            mostrarError("No fue posible cargar el contenido del curso.");
        }
    });
}

function gestionarEnlaceMisCursos(rol) {
    const esEstudiante = rol === "estudiante";

    const itemMenuMisCursos = document.getElementById("menuMisCursos");
    if (itemMenuMisCursos) {
        if (esEstudiante) {
            itemMenuMisCursos.classList.remove("d-none");
        } else {
            itemMenuMisCursos.classList.add("d-none");
        }
    }

    const enlaceBreadcrumb = document.querySelector('.breadcrumb a[href="misCursos.html"]');
    if (enlaceBreadcrumb) {
        const itemBreadcrumb = enlaceBreadcrumb.parentElement;
        if (esEstudiante) {
            enlaceBreadcrumb.classList.remove("d-none");
            if (itemBreadcrumb) itemBreadcrumb.classList.remove("d-none");
        } else {
            enlaceBreadcrumb.classList.add("d-none");
            if (itemBreadcrumb) itemBreadcrumb.classList.add("d-none");
        }
    }
}

async function comprobarAcceso(rol, curso, uid) {
    if (rol.includes("admin") || rol.includes("docente")) {
        return true;
    }

    if (rol !== "estudiante") {
        return false;
    }

    const referenciaAdquisiciones = collection(db, "adquisiciones");
    const consultaAdquisiciones = query(
        referenciaAdquisiciones,
        where("usuarioId", "==", uid)
    );

    const resultadoAdquisiciones = await getDocs(consultaAdquisiciones);

    const adquisicionEncontrada = resultadoAdquisiciones.docs.some(
        (documento) => {
            const adquisicion = documento.data();

            if (adquisicion.cursoId !== curso.id) {
                return false;
            }

            if (adquisicion.metodoPago === "beca") {
                const becaAprobada =
                    adquisicion.porcentajeBeca > 0 &&
                    adquisicion.estadoPagoSaldo === "pagado" &&
                    Number(adquisicion.saldoPendiente) === 0;

                return becaAprobada;
            }

            if (adquisicion.estado !== "aprobada") {
                return false;
            }

            if (
                adquisicion.estadoPagoSaldo != null &&
                adquisicion.estadoPagoSaldo !== "pagado"
            ) {
                return false;
            }

            return true;
        }
    );

    return adquisicionEncontrada;
}

async function verificarEstadoCertificadoBarraLateral(usuarioUid, cursoId) {
    const contenedor = document.getElementById("contenedorCertificadoCurso");
    if (!contenedor) return;

    try {
        const refEntrega = doc(db, "cursoscc", cursoId, "entregas", usuarioUid);
        const snapEntrega = await getDoc(refEntrega);

        if (snapEntrega.exists()) {
            const dataEntrega = snapEntrega.data();
            const nota = Number(dataEntrega.nota);

            if (!isNaN(nota)) {
                if (nota >= 6) {
                    contenedor.innerHTML = `
                        <div class="alert alert-success p-2 mb-2 text-center">
                            <i class="bi bi-patch-check-fill fs-4 d-block mb-1"></i>
                            <strong>¡Curso Aprobado!</strong><br>Nota: <strong>${nota}/10</strong>
                        </div>
                        <a href="certificado.html?curso=${cursoId}" class="btn btn-success w-100 fw-bold d-flex align-items-center justify-content-center gap-2">
                            <i class="bi bi-award fs-5"></i>
                            <span>Ver / Descargar Certificado</span>
                        </a>
                    `;
                } else {
                    contenedor.innerHTML = `
                        <div class="alert alert-danger p-2 mb-0 text-center">
                            <i class="bi bi-x-circle-fill fs-4 d-block mb-1"></i>
                            <strong>Calificación: ${nota}/10</strong><br>
                            <span class="small">No aprobaste el curso.</span>
                        </div>
                    `;
                }
            }
        }
    } catch (e) {
        console.error("Error al verificar certificado en barra lateral:", e);
    }
}

async function obtenerModulosConTemas(idCurso) {
    const referenciaModulos = collection(db, "cursoscc", idCurso, "modulos");
    const resultadoModulos = await getDocs(referenciaModulos);

    const modulos = [];

    for (const docModulo of resultadoModulos.docs) {
        const datosMod = docModulo.data();
        const modId = docModulo.id;

        const referenciaTemas = collection(db, "cursoscc", idCurso, "modulos", modId, "temas");
        const resultadoTemas = await getDocs(referenciaTemas);

        let temas = [];

        if (!resultadoTemas.empty) {
            temas = resultadoTemas.docs.map((docTema, index) => {
                const dataTema = docTema.data();
                return {
                    id: docTema.id,
                    orden: dataTema.orden ?? dataTema.numero ?? (index + 1),
                    nombre: dataTema.nombre || dataTema.titulo || "Tema sin nombre",
                    descripcion: dataTema.descripcion || "",
                    objetivos: Array.isArray(dataTema.objetivos) ? dataTema.objetivos : [],
                    recursos: Array.isArray(dataTema.recursos) ? dataTema.recursos : []
                };
            });
            temas.sort((a, b) => Number(a.orden) - Number(b.orden));
        } else if (Array.isArray(datosMod.temas)) {
            temas = datosMod.temas.map((t, index) => {
                if (typeof t === "string") {
                    return {
                        id: null,
                        orden: index + 1,
                        nombre: t,
                        descripcion: "",
                        objetivos: [],
                        recursos: []
                    };
                }
                return {
                    id: null,
                    orden: t.orden ?? (index + 1),
                    nombre: t.nombre || t.titulo || "Tema sin nombre",
                    descripcion: t.descripcion || "",
                    objetivos: Array.isArray(t.objetivos) ? t.objetivos : [],
                    recursos: Array.isArray(t.recursos) ? t.recursos : []
                };
            });
            temas.sort((a, b) => Number(a.orden) - Number(b.orden));
        }

        modulos.push({
            id: modId,
            numero: datosMod.numero || (modulos.length + 1),
            nombre: datosMod.nombre || datosMod.modulo || datosMod.titulo || "Módulo",
            temas: temas
        });
    }

    modulos.sort((a, b) => Number(a.numero) - Number(b.numero));
    return modulos;
}

function mostrarCurso(curso, modulos) {
    if (nombreCursoRuta) {
        nombreCursoRuta.textContent = curso.titulo || "Curso";
    }

    if (tituloCurso) {
        const rutaImagen = curso.URL_imagen ?? curso.imagen_url;

        tituloCurso.replaceChildren();
        tituloCurso.classList.add("d-flex", "flex-column", "mb-4");

        if (rutaImagen) {
            const imgMiniatura = document.createElement("img");
            imgMiniatura.src = rutaImagen;
            imgMiniatura.alt = curso.titulo || "Curso";
            imgMiniatura.className = "img-fluid rounded border shadow-sm w-100 mb-3";
            imgMiniatura.style.maxHeight = "280px";
            imgMiniatura.style.objectFit = "cover";

            tituloCurso.appendChild(imgMiniatura);
        }

        const textoTitulo = document.createElement("h2");
        textoTitulo.className = "h3 fw-bold text-dark mb-0";
        textoTitulo.textContent = curso.titulo || "Contenido del curso";

        tituloCurso.appendChild(textoTitulo);
    }

    if (modulos.length === 0) {
        mostrarError("Este curso todavía no tiene módulos disponibles.");
        return;
    }

    mostrarListaModulos(modulos, curso);

    if (parametros.get("actividad") === "final") {
        listaModulos.lastElementChild.click();
    } else {
        mostrarModulo(modulos[0], 0, modulos.length);
    }

    estadoCarga.classList.add("d-none");
    mensajeError.classList.add("d-none");
    contenidoCurso.classList.remove("d-none");
}

function mostrarListaModulos(modulos, curso) {
    listaModulos.replaceChildren();

    modulos.forEach((modulo, indice) => {
        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = "list-group-item list-group-item-action p-3";

        const numero = document.createElement("strong");
        numero.className = "d-block mb-1";
        numero.textContent = `Módulo ${modulo.numero}`;

        const nombre = document.createElement("span");
        nombre.textContent = modulo.nombre;

        boton.appendChild(numero);
        boton.appendChild(nombre);

        boton.addEventListener("click", () => {
            quitarModuloActivo();
            boton.classList.add("active");
            mostrarModulo(modulo, indice, modulos.length);
        });

        if (indice === 0) {
            boton.classList.add("active");
        }

        listaModulos.appendChild(boton);
    });

    const urlActividad = curso.actividad_pdf_url || curso.actividad || curso.actividad_url || curso.pdf_actividad || "";
    
    const botonActividad = document.createElement("button");
    botonActividad.type = "button";
    botonActividad.className = "list-group-item list-group-item-action p-3";

    const numero = document.createElement("strong");
    numero.className = "d-block mb-1";
    numero.textContent = "Evaluación / Cierre";

    const nombre = document.createElement("span");
    nombre.innerHTML = `<i class="bi bi-file-earmark-text me-1"></i> Actividad Final Integradora`;

    botonActividad.appendChild(numero);
    botonActividad.appendChild(nombre);

    botonActividad.addEventListener("click", () => {
        quitarModuloActivo();
        botonActividad.classList.add("active");
        mostrarActividadFinal(urlActividad, modulos.length);
    });

    listaModulos.appendChild(botonActividad);
}

async function mostrarActividadFinal(urlActividad, cantidadModulos) {
    numeroModulo.textContent = "Evaluación / Cierre";
    tituloModulo.textContent = "Actividad Final Integradora";

    actualizarProgreso(cantidadModulos - 1, cantidadModulos);
    contenedorTemas.replaceChildren();

    const esAdminODocente = rolUsuarioActual.includes("admin") || rolUsuarioActual.includes("docente");
    const tieneConsignaDocente = Boolean(urlActividad && urlActividad.trim() !== "");

    const contenedor = document.createElement("div");
    contenedor.className = "card border-0 shadow-sm p-4 bg-light";

    let htmlConsigna = '';
    if (tieneConsignaDocente) {
        const urlPdfLimpia = urlActividad.trim();
        const urlVisorGoogle = `https://docs.google.com/viewer?url=${encodeURIComponent(urlPdfLimpia)}&embedded=true`;

        htmlConsigna = `
            <div class="mb-4">
                <h3 class="h5 fw-bold text-primary mb-2">1. Consigna de la actividad</h3>
                <p class="text-muted">Visualizá o descargá la consigna oficial en formato PDF.</p>
                
                <div class="d-flex gap-2 flex-wrap mb-3">
                    <a href="${urlPdfLimpia}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-danger d-inline-flex align-items-center gap-2">
                        <i class="bi bi-file-earmark-pdf-fill fs-5"></i>
                        <span>Abrir / Descargar PDF directo</span>
                    </a>
                </div>

                <div class="ratio ratio-16x9 rounded border shadow-xs overflow-hidden mt-3 bg-white" style="min-height: 480px;">
                    <iframe src="${urlVisorGoogle}" title="Consigna de Actividad Final" allowfullscreen style="border: 0;"></iframe>
                </div>
            </div>
            <hr class="my-4">
        `;
    } else {
        htmlConsigna = `
            <div class="alert alert-warning mb-0">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                El docente aún no ha adjuntado un documento de consigna para este curso.
            </div>
        `;
    }

    contenedor.innerHTML = `
        ${htmlConsigna}
        <div id="seccionEntregaYCalificacion" class="mt-4">
            <div class="text-center py-3">
                <div class="spinner-border text-primary spinner-border-sm" role="status"></div>
                <span class="ms-2 small text-muted">Cargando estado...</span>
            </div>
        </div>
    `;

    contenedorTemas.appendChild(contenedor);

    const seccionDinamica = document.getElementById("seccionEntregaYCalificacion");

    if (esAdminODocente) {
        await renderizarSeccionAdministrador(seccionDinamica);
    } else {
        if (!tieneConsignaDocente) {
            seccionDinamica.innerHTML = '';
        } else {
            await renderizarSeccionEstudiante(seccionDinamica);
        }
    }
}

async function renderizarSeccionEstudiante(contenedor) {
    try {
        if (!datosUsuarioActual || !datosUsuarioActual.uid) {
            contenedor.innerHTML = `<div class="alert alert-danger">No se pudo verificar la información del estudiante.</div>`;
            return;
        }

        const refEntrega = doc(db, "cursoscc", cursoId, "entregas", datosUsuarioActual.uid);
        let entrega = null;

        try {
            const snapEntrega = await getDoc(refEntrega);
            if (snapEntrega.exists()) {
                entrega = snapEntrega.data();
            }
        } catch (eDoc) {
            console.warn("No existía entrega previa registrada:", eDoc);
        }

        let htmlCalificacion = '';
        if (entrega && entrega.nota !== undefined && entrega.nota !== null) {
            const notaNum = Number(entrega.nota);
            const aprobado = notaNum >= 6;

            htmlCalificacion = `
                <div class="alert ${aprobado ? 'alert-success border-success' : 'alert-danger border-danger'} mb-4 p-3 shadow-sm">
                    <div class="d-flex align-items-center gap-2 mb-2">
                        <i class="bi ${aprobado ? 'bi-award-fill text-success' : 'bi-x-circle-fill text-danger'} fs-4"></i>
                        <h4 class="h5 m-0 fw-bold ${aprobado ? 'text-success' : 'text-danger'}">Calificación Asignada</h4>
                    </div>
                    <div class="fs-4 fw-bold text-dark mb-2">Nota: <span class="badge ${aprobado ? 'bg-success' : 'bg-danger'}">${entrega.nota} / 10</span></div>
                    <p class="mb-2"><strong>Estado:</strong> ${aprobado ? '¡Aprobado! Ya podés ver tu certificado en el menú lateral.' : 'No aprobaste el curso.'}</p>
                    ${entrega.comentario ? `<p class="mb-0 text-secondary"><strong>Devolución del docente:</strong> ${entrega.comentario}</p>` : ''}
                </div>
            `;
        } else if (entrega) {
            htmlCalificacion = `
                <div class="alert alert-warning mb-4 p-3">
                    <i class="bi bi-hourglass-split me-2 fs-5"></i>
                    <strong>Entrega enviada.</strong> Tu trabajo está pendiente de calificación por parte del docente.
                </div>
            `;
        }

        let htmlArchivosEnviados = '';
        if (entrega) {
            htmlArchivosEnviados = `
                <div class="p-3 bg-light rounded border mb-3">
                    <h5 class="h6 fw-bold mb-2 text-dark"><i class="bi bi-check-circle-fill text-success me-2"></i>Tu entrega realizada:</h5>
                    ${entrega.archivoUrl ? `<a href="${entrega.archivoUrl}" target="_blank" class="btn btn-sm btn-outline-danger me-2 mb-1"><i class="bi bi-file-earmark-pdf me-1"></i>Ver PDF enviado</a>` : ''}
                    ${entrega.enlaceUrl ? `<a href="${entrega.enlaceUrl}" target="_blank" class="btn btn-sm btn-outline-primary mb-1"><i class="bi bi-link-45deg me-1"></i>Ver enlace enviado</a>` : ''}
                    <div class="form-text text-muted small mt-1">Fecha de envío: ${entrega.fechaEnvio ? new Date(entrega.fechaEnvio).toLocaleString() : 'Registrada'}</div>
                </div>
            `;
        }

        contenedor.innerHTML = `
            <h3 class="h5 fw-bold text-primary mb-3">2. Entrega del estudiante</h3>
            ${htmlCalificacion}
            ${htmlArchivosEnviados}
            
            <form id="formEntregaActividad" class="bg-white p-3 rounded border shadow-xs">
                <h5 class="h6 fw-bold mb-3 text-secondary">${entrega ? 'Reemplazar / Reenviar entrega' : 'Realizar entrega'}</h5>
                
                <div class="mb-3">
                    <label for="archivoEntrega" class="form-label fw-bold small text-muted">Subir archivo de resolución (PDF)</label>
                    <input type="file" class="form-control" id="archivoEntrega" accept=".pdf">
                </div>
                
                <div class="text-center my-2 text-muted small fw-bold">- O -</div>

                <div class="mb-3">
                    <label for="enlaceEntrega" class="form-label fw-bold small text-muted">Enlace / URL del proyecto o repositorio</label>
                    <input type="url" class="form-control" id="enlaceEntrega" placeholder="https://github.com/tu-usuario/proyecto" value="${entrega?.enlaceUrl || ''}">
                </div>

                <button type="submit" class="btn btn-success w-100 d-flex align-items-center justify-content-center gap-2" id="btnEnviarEntrega">
                    <i class="bi bi-send-fill"></i>
                    <span>${entrega ? 'Actualizar Entrega' : 'Enviar Entrega'}</span>
                </button>
            </form>
            
            <div id="mensajeEntrega" class="mt-3 small text-center d-none alert"></div>
        `;

        const formEntrega = document.getElementById("formEntregaActividad");
        const archivoEntrega = document.getElementById("archivoEntrega");
        const enlaceEntrega = document.getElementById("enlaceEntrega");
        const mensajeEntrega = document.getElementById("mensajeEntrega");
        const btnEnviar = document.getElementById("btnEnviarEntrega");

        formEntrega.addEventListener("submit", async (e) => {
            e.preventDefault();

            const archivo = archivoEntrega.files[0];
            const url = enlaceEntrega.value.trim();

            if (!archivo && !url) {
                mensajeEntrega.className = "mt-3 alert alert-danger d-block";
                mensajeEntrega.textContent = "Por favor, adjuntá un archivo PDF o ingresá un enlace.";
                return;
            }

            btnEnviar.disabled = true;
            btnEnviar.innerHTML = `<span class="spinner-border spinner-border-sm" role="status"></span> Enviando...`;

            try {
                let archivoUrl = entrega?.archivoUrl || "";

                if (archivo) {
                    archivoUrl = await subirPdfACloudinary(archivo);
                }

                const refDoc = doc(db, "cursoscc", cursoId, "entregas", datosUsuarioActual.uid);
                const refNotificacion = doc(collection(db, "notificaciones"));

                const nombreEstudiante = [
                    datosUsuarioActual.nombre,
                    datosUsuarioActual.apellido
                ].filter(Boolean).join(" ") || auth.currentUser.email || "Estudiante";

                const lote = writeBatch(db);

                lote.set(refDoc, {
                    archivoUrl,
                    enlaceUrl: url,
                    fechaEnvio: new Date().toISOString(),
                    nombreEstudiante,
                    emailEstudiante: auth.currentUser.email || ""
                }, { merge: true });

                lote.set(refNotificacion, {
                    tipo: "entrega",
                    destinatarioRol: "docente/admin",
                    estudianteId: datosUsuarioActual.uid,
                    autorNombre: nombreEstudiante,
                    cursoId: cursoId,
                    cursoTitulo: nombreCursoRuta.textContent || "Curso",
                    titulo: entrega ? "Entrega actualizada para revisar" : "Nueva entrega para calificar",
                    leida: false,
                    fechaCreacion: serverTimestamp(),
                    enlace: `contenidoCurso.html?curso=${encodeURIComponent(cursoId)}&actividad=final`
                });

                await lote.commit();

                mensajeEntrega.className = "mt-3 alert alert-success d-block";
                mensajeEntrega.textContent = "¡Tu entrega se guardó correctamente!";

                setTimeout(() => {
                    renderizarSeccionEstudiante(contenedor);
                }, 1500);

            } catch (err) {
                console.error("Error al guardar entrega:", err);
                mensajeEntrega.className = "mt-3 alert alert-danger d-block";
                mensajeEntrega.textContent = "Ocurrió un error al guardar la entrega. Volvé a intentarlo.";
                btnEnviar.disabled = false;
                btnEnviar.innerHTML = `<i class="bi bi-send-fill"></i><span>Enviar Entrega</span>`;
            }
        });

    } catch (error) {
        console.error("Error al obtener el estado de la entrega:", error);
        contenedor.innerHTML = `<div class="alert alert-danger">No se pudo obtener el estado de tu entrega.</div>`;
    }
}

async function renderizarSeccionAdministrador(contenedor) {
    try {
        const refEntregas = collection(db, "cursoscc", cursoId, "entregas");
        const snapEntregas = await getDocs(refEntregas);

        if (snapEntregas.empty) {
            contenedor.innerHTML = `
                <h3 class="h5 fw-bold text-primary mb-3">2. Calificación de Entregas</h3>
                <div class="alert alert-info">
                    <i class="bi bi-info-circle me-2"></i>Aún ningún estudiante ha realizado una entrega para este curso.
                </div>
            `;
            return;
        }

        let htmlLista = '';
        snapEntregas.forEach((docSnap) => {
            const data = docSnap.data();
            const estUid = docSnap.id;

            htmlLista += `
                <div class="card mb-3 border shadow-xs">
                    <div class="card-body p-3">
                        <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
                            <span class="fw-bold text-dark fs-6">
                                <i class="bi bi-person-circle me-1 text-primary"></i> ${data.nombreEstudiante || 'Estudiante'} (${data.emailEstudiante || estUid})
                            </span>
                            <span class="badge ${data.nota !== undefined && data.nota !== null ? 'bg-success' : 'bg-warning text-dark'}">
                                ${data.nota !== undefined && data.nota !== null ? `Calificado: ${data.nota}/10` : 'Pendiente de revisión'}
                            </span>
                        </div>

                        <div class="mb-3 bg-light p-2 rounded border small">
                            <strong>Archivos entregados:</strong><br>
                            ${data.archivoUrl ? `<a href="${data.archivoUrl}" target="_blank" class="btn btn-sm btn-outline-danger me-2 mt-1"><i class="bi bi-file-earmark-pdf me-1"></i>Ver PDF enviado</a>` : ''}
                            ${data.enlaceUrl ? `<a href="${data.enlaceUrl}" target="_blank" class="btn btn-sm btn-outline-primary mt-1"><i class="bi bi-link-45deg me-1"></i>Ver Enlace</a>` : ''}
                            <div class="text-muted mt-1">Fecha: ${data.fechaEnvio ? new Date(data.fechaEnvio).toLocaleString() : 'N/D'}</div>
                        </div>

                        <form class="form-calificar-estudiante bg-white p-2 rounded border" data-uid="${estUid}">
                            <div class="row g-2 align-items-center">
                                <div class="col-12 col-md-3">
                                    <label class="form-label small fw-bold mb-1">Nota (0 a 10):</label>
                                    <input type="number" class="form-control form-control-sm input-nota" min="0" max="10" step="0.5" value="${data.nota ?? ''}" required placeholder="Ej: 8.5">
                                </div>
                                <div class="col-12 col-md-6">
                                    <label class="form-label small fw-bold mb-1">Devolución / Comentario:</label>
                                    <input type="text" class="form-control form-control-sm input-comentario" value="${data.comentario || ''}" placeholder="Ej: Excelente desarrollo.">
                                </div>
                                <div class="col-12 col-md-3 text-end mt-md-4">
                                    <button type="submit" class="btn btn-primary btn-sm w-100 btn-guardar-nota">
                                        <i class="bi bi-check-circle me-1"></i> Guardar Nota
                                    </button>
                                </div>
                            </div>
                            <div class="mensaje-calificacion mt-2 small text-center d-none alert py-1 mb-0"></div>
                        </form>
                    </div>
                </div>
            `;
        });

        contenedor.innerHTML = `
            <h3 class="h5 fw-bold text-primary mb-3"><i class="bi bi-journal-check me-2"></i>2. Calificación de Entregas (${snapEntregas.size})</h3>
            <p class="text-muted small mb-3">Revisá las entregas de los alumnos y asignales su correspondiente nota y comentario.</p>
            ${htmlLista}
        `;

        document.querySelectorAll(".form-calificar-estudiante").forEach((formulario) => {
            formulario.addEventListener("submit", async (e) => {
                e.preventDefault();

                const estUid = formulario.dataset.uid;
                const inputNota = formulario.querySelector(".input-nota");
                const inputComentario = formulario.querySelector(".input-comentario");
                const btnSubmit = formulario.querySelector(".btn-guardar-nota");
                const msgBox = formulario.querySelector(".mensaje-calificacion");

                const notaVal = Number(inputNota.value);
                const comentarioVal = inputComentario.value.trim();

                if (inputNota.value.trim() === "" || !Number.isFinite(notaVal) || notaVal < 0 || notaVal > 10) {
                    inputNota.reportValidity();
                    return;
                }

                btnSubmit.disabled = true;

                try {
                    const refDoc = doc(db, "cursoscc", cursoId, "entregas", estUid);
                    const refCertificado = doc(db, "certificados", `${estUid}_${cursoId}`);
                    const refNotificacion = doc(collection(db, "notificaciones"));

                    const lote = writeBatch(db);
                    const cursoAprobado = notaVal >= 6;

                    lote.set(refDoc, {
                        nota: notaVal,
                        comentario: comentarioVal,
                        estadoFinal: cursoAprobado ? "aprobado" : "no_aprobado",
                        cursoFinalizado: cursoAprobado,
                        fechaCalificacion: new Date().toISOString()
                    }, { merge: true });

                    if (cursoAprobado) {
                        lote.set(refCertificado, {
                            usuarioId: estUid,
                            cursoId: cursoId,
                            nota: notaVal,
                            fecha: serverTimestamp(),
                            codigo: `CERT-UY-${Math.floor(100000 + Math.random() * 900000)}`
                        }, { merge: true });
                    }

                    lote.set(refNotificacion, {
                        tipo: "calificacion",
                        destinatarioRol: "estudiante",
                        destinatarioId: estUid,
                        cursoId: cursoId,
                        cursoTitulo: nombreCursoRuta.textContent || "Tu curso",
                        titulo: cursoAprobado ? "¡Felicitaciones! Curso aprobado y certificado disponible" : "Tu actividad fue calificada",
                        nota: notaVal,
                        leida: false,
                        fechaCreacion: serverTimestamp(),
                        enlace: `contenidoCurso.html?curso=${encodeURIComponent(cursoId)}&actividad=final`
                    });

                    await lote.commit();

                    msgBox.className = "mensaje-calificacion mt-2 small text-center alert alert-success py-1 mb-0 d-block";
                    msgBox.textContent = "¡Calificación guardada y certificado emitido con éxito!";

                    setTimeout(() => {
                        msgBox.className = "mensaje-calificacion mt-2 small text-center d-none alert py-1 mb-0";
                        btnSubmit.disabled = false;
                    }, 2000);

                } catch (errorCal) {
                    console.error("Error al guardar calificación:", errorCal);
                    msgBox.className = "mensaje-calificacion mt-2 small text-center alert alert-danger py-1 mb-0 d-block";
                    msgBox.textContent = "Error al guardar la nota.";
                    btnSubmit.disabled = false;
                }
            });
        });

    } catch (error) {
        console.error("Error al listar entregas para el administrador:", error);
        contenedor.innerHTML = `<div class="alert alert-danger">No se pudieron cargar las entregas para su revisión.</div>`;
    }
}

async function subirPdfACloudinary(archivo) {
    const datosFormulario = new FormData();
    datosFormulario.append("file", archivo);
    datosFormulario.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const respuesta = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/raw/upload`,
        {
            method: "POST",
            body: datosFormulario
        }
    );

    if (!respuesta.ok) {
        throw new Error("No se pudo subir el archivo PDF.");
    }

    const datos = await respuesta.json();
    return datos.secure_url;
}

function mostrarModulo(modulo, indice, cantidadModulos) {
    numeroModulo.textContent = `Módulo ${modulo.numero} de ${cantidadModulos}`;
    tituloModulo.textContent = modulo.nombre;

    renderizarTemasDelModulo(modulo.temas);
    actualizarProgreso(indice, cantidadModulos);
}

function renderizarTemasDelModulo(temas) {
    contenedorTemas.replaceChildren();

    if (!Array.isArray(temas) || temas.length === 0) {
        contenedorTemas.innerHTML = `
            <div class="alert alert-secondary mb-0">
                <i class="bi bi-info-circle me-2"></i>
                Este módulo todavía no tiene temas asignados.
            </div>
        `;
        return;
    }

    temas.forEach((tema, indice) => {
        const cardTema = document.createElement("article");
        cardTema.className = "card mb-4 border-1 shadow-sm";

        const cardBody = document.createElement("div");
        cardBody.className = "card-body p-4";

        const titulo = document.createElement("h3");
        titulo.className = "h5 text-primary mb-2";
        titulo.textContent = `${indice + 1}. ${tema.nombre}`;

        cardBody.appendChild(titulo);

        if (tema.descripcion) {
            const descripcion = document.createElement("p");
            descripcion.className = "text-muted mb-3";
            descripcion.textContent = tema.descripcion;

            cardBody.appendChild(descripcion);
        }

        if (
            Array.isArray(tema.objetivos) &&
            tema.objetivos.length > 0
        ) {
            const objetivosValidos = tema.objetivos.filter(
                (objetivo) =>
                    typeof objetivo === "string" &&
                    objetivo.trim() !== ""
            );

            if (objetivosValidos.length > 0) {
                const cajaObjetivos =
                    document.createElement("div");

                cajaObjetivos.className =
                    "alert alert-info py-2 px-3 mb-3";

                const tituloObjetivos =
                    document.createElement("h4");

                tituloObjetivos.className =
                    "h6 mb-2 fw-bold text-dark";

                tituloObjetivos.innerHTML = `
                    <i class="bi bi-bullseye me-2 text-primary"></i>
                    Objetivos del tema:
                `;

                const listaObjetivos =
                    document.createElement("ul");

                listaObjetivos.className = "mb-0 small";

                objetivosValidos.forEach((objetivo) => {
                    const elemento =
                        document.createElement("li");

                    elemento.textContent = objetivo;

                    listaObjetivos.appendChild(elemento);
                });

                cajaObjetivos.appendChild(tituloObjetivos);
                cajaObjetivos.appendChild(listaObjetivos);

                cardBody.appendChild(cajaObjetivos);
            }
        }

        const tituloMateriales =
            document.createElement("h4");

        tituloMateriales.className =
            "h6 fw-bold mb-3 text-secondary";

        tituloMateriales.textContent =
            "Materiales del tema:";

        cardBody.appendChild(tituloMateriales);

        const filaMateriales =
            document.createElement("div");

        filaMateriales.className = "row g-3";

        const materiales = Array.isArray(tema.recursos)
            ? tema.recursos.filter(
                (recurso) =>
                    recurso &&
                    recurso.url
            )
            : [];

        if (materiales.length === 0) {
            const columna =
                document.createElement("div");

            columna.className = "col-12";

            columna.innerHTML = `
                <div class="alert alert-light text-muted small mb-0 border">
                    <i class="bi bi-info-circle me-1"></i>
                    No hay materiales disponibles para este tema.
                </div>
            `;

            filaMateriales.appendChild(columna);

        } else {
            materiales.forEach((recurso) => {
                const columna =
                    document.createElement("div");

                columna.className =
                    "col-12 col-md-6";

                const tarjeta =
                    document.createElement("div");

                tarjeta.className =
                    "card h-100 border";

                const cuerpo =
                    document.createElement("div");

                cuerpo.className =
                    "card-body d-flex flex-column p-3";

                const icono =
                    document.createElement("i");

                icono.className =
                    obtenerIconoRecurso(recurso.tipo);

                const nombre =
                    document.createElement("h5");

                nombre.className =
                    "card-title h6 mb-2";

                nombre.textContent =
                    recurso.nombre ||
                    "Material del tema";

                const enlace =
                    document.createElement("a");

                enlace.className =
                    "btn btn-outline-primary btn-sm mt-auto w-100";

                enlace.href = recurso.url;
                enlace.target = "_blank";
                enlace.rel = "noopener noreferrer";

                enlace.textContent =
                    obtenerTextoBotonRecurso(
                        recurso.tipo
                    );

                cuerpo.appendChild(icono);
                cuerpo.appendChild(nombre);
                cuerpo.appendChild(enlace);

                tarjeta.appendChild(cuerpo);
                columna.appendChild(tarjeta);

                filaMateriales.appendChild(columna);
            });
        }

        cardBody.appendChild(filaMateriales);
        cardTema.appendChild(cardBody);

        contenedorTemas.appendChild(cardTema);
    });
}

function obtenerIconoRecurso(tipo) {
    const iconos = {
        pdf: "bi bi-file-earmark-pdf fs-3 text-danger mb-2",
        video: "bi bi-play-btn-fill fs-3 text-danger mb-2",
        drive: "bi bi-google fs-3 text-success mb-2",
        presentacion: "bi bi-easel fs-3 text-warning mb-2",
        url: "bi bi-link-45deg fs-3 text-primary mb-2",
        python: "bi bi-filetype-py fs-3 text-primary mb-2"
    };

    return (
        iconos[tipo] ||
        "bi bi-file-earmark fs-3 text-primary mb-2"
    );
}

function obtenerTextoBotonRecurso(tipo) {
    const textos = {
        pdf: "Abrir PDF",
        video: "Ver video",
        drive: "Abrir en Drive",
        presentacion: "Ver presentación",
        url: "Visitar enlace",
        python: "Descargar Python"
    };

    return textos[tipo] || "Abrir material";
}

function actualizarProgreso(indiceModulo, totalModulos) {
    const barraProgreso = document.getElementById("barraProgreso");
    if (!barraProgreso || totalModulos === 0) return;

    const porcentaje = Math.round(((indiceModulo + 1) / totalModulos) * 100);
    barraProgreso.style.width = `${porcentaje}%`;
    barraProgreso.textContent = `${porcentaje}%`;
}

function quitarModuloActivo() {
    if (!listaModulos) return;
    const items = listaModulos.querySelectorAll(".list-group-item");
    items.forEach((item) => item.classList.remove("active"));
}

function mostrarError(mensaje) {
    if (estadoCarga) estadoCarga.classList.add("d-none");
    if (contenidoCurso) contenidoCurso.classList.add("d-none");
    if (mensajeError) {
        mensajeError.textContent = mensaje;
        mensajeError.classList.remove("d-none");
    }
}