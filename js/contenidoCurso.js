import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import {
    doc,
    getDoc,
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

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

if (btnForoCurso && cursoId) {
    btnForoCurso.href = `foroCurso.html?curso=${encodeURIComponent(cursoId)}`;
}

iniciarPagina();

function iniciarPagina() {
    if (!cursoId) {
        mostrarError("No se indicó qué curso se debe mostrar.");
        return;
    }

    onAuthStateChanged(auth, async (usuario) => {
        if (!usuario) {
            window.location.href = "ingresar.html";
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

            const datosUsuario = resultadoUsuario.data();
            const rol = (datosUsuario.tipoUsuario || datosUsuario.rol || "").toString().trim().toLowerCase();

            gestionarEnlaceMisCursos(rol);

            const curso = {
                id: resultadoCurso.id,
                ...resultadoCurso.data()
            };

            const tieneAcceso = await comprobarAcceso(rol, curso, usuario.uid);

            if (!tieneAcceso) {
                mostrarError("No tenés acceso al contenido de este curso. Debés adquirirlo o solicitar una beca.");
                return;
            }

            const modulos = await obtenerModulosConTemas(curso.id);
            mostrarCurso(curso, modulos);

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

    const consulta = await getDocs(consultaAdquisiciones);

    const adquisicionEncontrada = consulta.docs.find((documento) => {
        const adquisicion = documento.data();
        return (
            adquisicion.cursoId === curso.id &&
            adquisicion.estado === "aprobada"
        );
    });

    return Boolean(adquisicionEncontrada);
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

    // Cargar la lista combinada (Módulos + Actividad Final si existe)
    mostrarListaModulos(modulos, curso);
    
    // Cargar el primer módulo por defecto
    mostrarModulo(modulos[0], 0, modulos.length);

    estadoCarga.classList.add("d-none");
    mensajeError.classList.add("d-none");
    contenidoCurso.classList.remove("d-none");
}

function mostrarListaModulos(modulos, curso) {
    listaModulos.replaceChildren();

    // 1. Agregar Módulos
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

    // 2. Agregar la Actividad Final con estilo unificado
    const urlActividad = curso.actividad_pdf_url || curso.actividad || curso.actividad_url || curso.pdf_actividad;
    
    if (urlActividad) {
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
}

function mostrarActividadFinal(urlActividad, cantidadModulos) {
    numeroModulo.textContent = "Evaluación / Cierre";
    tituloModulo.textContent = "Actividad Final Integradora";

    actualizarProgreso(cantidadModulos - 1, cantidadModulos);

    contenedorTemas.replaceChildren();

    const urlPdfLimpia = urlActividad.trim();
    // Usar Google Docs Viewer para resolver visualización cross-origin
    const urlVisorGoogle = `https://docs.google.com/viewer?url=${encodeURIComponent(urlPdfLimpia)}&embedded=true`;

    const contenedor = document.createElement("div");
    contenedor.className = "card border-0 shadow-sm p-4 bg-light";

    contenedor.innerHTML = `
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

        <div>
            <h3 class="h5 fw-bold text-primary mb-3">2. Entrega del estudiante</h3>
            <form id="formEntregaActividad" class="bg-white p-3 rounded border shadow-xs">
                <div class="mb-3">
                    <label for="archivoEntrega" class="form-label fw-bold small text-muted">Subir archivo de resolución (PDF)</label>
                    <input type="file" class="form-control" id="archivoEntrega" accept=".pdf">
                </div>
                
                <div class="text-center my-2 text-muted small fw-bold">- O -</div>

                <div class="mb-3">
                    <label for="enlaceEntrega" class="form-label fw-bold small text-muted">Enlace / URL del proyecto o repositorio</label>
                    <input type="url" class="form-control" id="enlaceEntrega" placeholder="https://github.com/tu-usuario/proyecto">
                </div>

                <button type="submit" class="btn btn-success w-100 d-flex align-items-center justify-content-center gap-2" id="btnEnviarEntrega">
                    <i class="bi bi-send-fill"></i>
                    <span>Enviar Entrega</span>
                </button>
            </form>
            
            <div id="mensajeEntrega" class="mt-3 small text-center d-none alert"></div>
        </div>
    `;

    contenedorTemas.appendChild(contenedor);

    const formEntrega = document.getElementById("formEntregaActividad");
    const archivoEntrega = document.getElementById("archivoEntrega");
    const enlaceEntrega = document.getElementById("enlaceEntrega");
    const mensajeEntrega = document.getElementById("mensajeEntrega");

    formEntrega.addEventListener("submit", (e) => {
        e.preventDefault();

        const archivo = archivoEntrega.files[0];
        const url = enlaceEntrega.value.trim();

        if (!archivo && !url) {
            mensajeEntrega.className = "mt-3 alert alert-danger d-block";
            mensajeEntrega.textContent = "Por favor, adjuntá un archivo PDF o ingresá un enlace.";
            return;
        }

        mensajeEntrega.className = "mt-3 alert alert-success d-block";
        mensajeEntrega.textContent = "¡Tu entrega fue enviada correctamente!";
        formEntrega.reset();
    });
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

    temas.forEach((tema, index) => {
        const cardTema = document.createElement("div");
        cardTema.className = "card mb-4 border-1 shadow-sm";

        const cardBody = document.createElement("div");
        cardBody.className = "card-body p-4";

        const tituloTema = document.createElement("h3");
        tituloTema.className = "h5 text-primary mb-2";
        tituloTema.textContent = `${index + 1}. ${tema.nombre}`;
        cardBody.appendChild(tituloTema);

        if (tema.descripcion) {
            const descTema = document.createElement("p");
            descTema.className = "text-muted mb-3";
            descTema.textContent = tema.descripcion;
            cardBody.appendChild(descTema);
        }

        if (Array.isArray(tema.objetivos) && tema.objetivos.length > 0) {
            const divObjetivos = document.createElement("div");
            divObjetivos.className = "alert alert-info py-2 px-3 mb-3";
            
            const hObj = document.createElement("h4");
            hObj.className = "h6 mb-2 fw-bold text-dark";
            hObj.innerHTML = `<i class="bi bi-bullseye me-2 text-primary"></i>Objetivos del tema:`;
            divObjetivos.appendChild(hObj);

            const ulObj = document.createElement("ul");
            ulObj.className = "mb-0 small";

            tema.objetivos.forEach(obj => {
                if (typeof obj === 'string' && obj.trim()) {
                    const li = document.createElement("li");
                    li.textContent = obj;
                    ulObj.appendChild(li);
                }
            });

            if (ulObj.children.length > 0) {
                divObjetivos.appendChild(ulObj);
                cardBody.appendChild(divObjetivos);
            }
        }

        const hRecursos = document.createElement("h4");
        hRecursos.className = "h6 fw-bold mb-3 text-secondary";
        hRecursos.textContent = "Recursos del tema:";
        cardBody.appendChild(hRecursos);

        const rowRecursos = document.createElement("div");
        rowRecursos.className = "row g-3";

        if (!Array.isArray(tema.recursos) || tema.recursos.length === 0) {
            const col = document.createElement("div");
            col.className = "col-12";
            col.innerHTML = `
                <div class="alert alert-light text-muted small mb-0 border">
                    <i class="bi bi-info-circle me-1"></i> No hay recursos disponibles para este tema.
                </div>
            `;
            rowRecursos.appendChild(col);
        } else {
            tema.recursos.forEach((recurso) => {
                const col = document.createElement("div");
                col.className = "col-12 col-md-6";

                const cardRecurso = document.createElement("div");
                cardRecurso.className = "card h-100 border shadow-xs";

                const bodyRecurso = document.createElement("div");
                bodyRecurso.className = "card-body d-flex flex-column p-3";

                const icono = document.createElement("i");
                icono.className = obtenerIconoRecurso(recurso.tipo);

                const tituloRec = document.createElement("h5");
                tituloRec.className = "card-title h6 mb-2";
                tituloRec.textContent = recurso.nombre || "Recurso del tema";

                const enlace = document.createElement("a");
                enlace.className = "btn btn-outline-primary btn-sm mt-auto w-100";
                enlace.target = "_blank";
                enlace.rel = "noopener noreferrer";

                if (recurso.url) {
                    enlace.href = recurso.url;
                    enlace.textContent = obtenerTextoBoton(recurso.tipo);
                } else {
                    enlace.href = "#";
                    enlace.textContent = "Material no disponible";
                    enlace.classList.add("disabled");
                    enlace.setAttribute("aria-disabled", "true");
                }

                bodyRecurso.appendChild(icono);
                bodyRecurso.appendChild(tituloRec);
                bodyRecurso.appendChild(enlace);

                cardRecurso.appendChild(bodyRecurso);
                col.appendChild(cardRecurso);
                rowRecursos.appendChild(col);
            });
        }

        cardBody.appendChild(rowRecursos);
        cardTema.appendChild(cardBody);
        contenedorTemas.appendChild(cardTema);
    });
}

function obtenerIconoRecurso(tipo) {
    const iconos = {
        pdf: "bi bi-file-earmark-pdf fs-3 text-danger mb-2",
        drive: "bi bi-google fs-3 text-success mb-2",
        presentacion: "bi bi-easel fs-3 text-warning mb-2",
        url: "bi bi-link-45deg fs-3 text-primary mb-2"
    };
    return iconos[tipo] || "bi bi-file-earmark fs-3 text-primary mb-2";
}

function obtenerTextoBoton(tipo) {
    const textos = {
        pdf: "Abrir PDF",
        drive: "Abrir en Drive",
        presentacion: "Ver presentación",
        url: "Visitar enlace",
        python: "Descargar Python"
    };
    return textos[tipo] || "Abrir material";
}

function actualizarProgreso(indice, cantidadModulos) {
    const porcentaje = Math.round(((indice + 1) / cantidadModulos) * 100);
    const barra = document.getElementById("barraProgreso");

    if (barra) {
        barra.style.width = `${porcentaje}%`;
        barra.textContent = `${porcentaje}%`;
        barra.setAttribute("aria-valuenow", porcentaje);
    }
}

function quitarModuloActivo() {
    const botones = listaModulos.querySelectorAll(".list-group-item");
    botones.forEach((boton) => {
        boton.classList.remove("active");
    });
}

function mostrarError(mensaje) {
    estadoCarga.classList.add("d-none");
    contenidoCurso.classList.add("d-none");

    mensajeError.textContent = mensaje;
    mensajeError.classList.remove("d-none");
}