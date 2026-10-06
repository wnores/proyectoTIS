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

const parametros = new URLSearchParams(window.location.search);
const cursoId = parametros.get("curso");

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
            const curso = {
                id: resultadoCurso.id,
                ...resultadoCurso.data()
            };

            const tieneAcceso = await comprobarAcceso(datosUsuario, curso, usuario.uid);

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

async function comprobarAcceso(datosUsuario, curso, uid) {
    const rol = (datosUsuario.tipoUsuario || datosUsuario.rol || "")
        .toString()
        .trim()
        .toLowerCase();

    console.log("=== COMPROBACIÓN DE ACCESO ===");
    console.log("UID usuario:", uid);
    console.log("ID curso:", curso.id);
    console.log("Título curso:", curso.titulo);
    console.log("Rol:", rol);

    // Admin/docente tiene acceso
    if (rol.includes("admin") || rol.includes("docente")) {
        console.log("Acceso concedido: admin/docente");
        return true;
    }

    // Solo estudiantes continúan
    if (rol !== "estudiante") {
        console.log("Acceso rechazado: rol no válido");
        return false;
    }

    const referenciaAdquisiciones = collection(db, "adquisiciones");

    // Traer solamente las adquisiciones del usuario actual
    const consultaAdquisiciones = query(
        referenciaAdquisiciones,
        where("usuarioId", "==", uid)
    );

    const consulta = await getDocs(consultaAdquisiciones);

    console.log(
        "Adquisiciones del usuario:",
        consulta.size
    );

    const adquisicionEncontrada = consulta.docs.find((documento) => {
        const adquisicion = documento.data();

        console.log("Adquisición encontrada:", adquisicion);

        return (
            adquisicion.cursoId === curso.id &&
            adquisicion.estado === "aprobada"
        );
    });

    if (adquisicionEncontrada) {
        console.log(
            "ACCESO CONCEDIDO. Adquisición:",
            adquisicionEncontrada.id
        );

        return true;
    }

    console.log(
        "ACCESO RECHAZADO: no existe una adquisición aprobada para este curso."
    );

    return false;
}

/**
 * Obtiene los módulos y sus respectivos temas desde Firestore (Subcolección o Array)
 */
async function obtenerModulosConTemas(idCurso) {
    const referenciaModulos = collection(db, "cursoscc", idCurso, "modulos");
    const resultadoModulos = await getDocs(referenciaModulos);

    const modulos = [];

    for (const docModulo of resultadoModulos.docs) {
        const datosMod = docModulo.data();
        const modId = docModulo.id;

        // 1. Intentar obtener temas desde la subcolección 'temas'
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
            // Ordenar según el campo de orden
            temas.sort((a, b) => Number(a.orden) - Number(b.orden));
        } else if (Array.isArray(datosMod.temas)) {
            // 2. Si no hay subcolección, tomar del array 'temas' del módulo
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
    nombreCursoRuta.textContent = curso.titulo || "Curso";
    tituloCurso.textContent = curso.titulo || "Contenido del curso";

    if (modulos.length === 0) {
        mostrarError("Este curso todavía no tiene módulos disponibles.");
        return;
    }

    mostrarListaModulos(modulos);
    mostrarModulo(modulos[0], 0, modulos.length);

    estadoCarga.classList.add("d-none");
    mensajeError.classList.add("d-none");
    contenidoCurso.classList.remove("d-none");
}

function mostrarListaModulos(modulos) {
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
}

function mostrarModulo(modulo, indice, cantidadModulos) {
    numeroModulo.textContent = `Módulo ${modulo.numero} de ${cantidadModulos}`;
    tituloModulo.textContent = modulo.nombre;

    renderizarTemasDelModulo(modulo.temas);
    actualizarProgreso(indice, cantidadModulos);
}

/**
 * Renderiza cada tema respetando el orden con su descripción, objetivos y recursos
 */
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

        // Título del Tema con el número de orden
        const tituloTema = document.createElement("h3");
        tituloTema.className = "h5 text-primary mb-2";
        tituloTema.textContent = `${index + 1}. ${tema.nombre}`;
        cardBody.appendChild(tituloTema);

        // Descripción del Tema
        if (tema.descripcion) {
            const descTema = document.createElement("p");
            descTema.className = "text-muted mb-3";
            descTema.textContent = tema.descripcion;
            cardBody.appendChild(descTema);
        }

        // Objetivos del Tema
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

        // Recursos del Tema
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

    barra.style.width = `${porcentaje}%`;
    barra.textContent = `${porcentaje}%`;
    barra.setAttribute("aria-valuenow", porcentaje);
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