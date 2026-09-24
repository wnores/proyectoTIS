import {
    auth,
    db
} from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
    doc,
    getDoc,
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


const estadoCarga =
    document.getElementById("estadoCarga");

const mensajeError =
    document.getElementById("mensajeError");

const contenidoCurso =
    document.getElementById("contenidoCurso");

const nombreCursoRuta =
    document.getElementById("nombreCursoRuta");

const tituloCurso =
    document.getElementById("tituloCurso");

const listaModulos =
    document.getElementById("listaModulos");

const numeroModulo =
    document.getElementById("numeroModulo");

const tituloModulo =
    document.getElementById("tituloModulo");

const descripcionModulo =
    document.getElementById("descripcionModulo");

const seccionObjetivos =
    document.getElementById("seccionObjetivos");

const listaObjetivos =
    document.getElementById("listaObjetivos");

const listaRecursos =
    document.getElementById("listaRecursos");


const parametros =
    new URLSearchParams(window.location.search);

const cursoId =
    parametros.get("curso");


iniciarPagina();


function iniciarPagina() {
    if (!cursoId) {
        mostrarError(
            "No se indicó qué curso se debe mostrar."
        );
        return;
    }

    onAuthStateChanged(auth, async (usuario) => {
        if (!usuario) {
            window.location.href = "ingresar.html";
            return;
        }

        try {
            const referenciaUsuario =
                doc(db, "usuarios", usuario.uid);

            const referenciaCurso =
                doc(db, "cursos", cursoId);

            const [
                resultadoUsuario,
                resultadoCurso
            ] = await Promise.all([
                getDoc(referenciaUsuario),
                getDoc(referenciaCurso)
            ]);

            if (!resultadoUsuario.exists()) {
                mostrarError(
                    "No se encontraron los datos del usuario."
                );
                return;
            }

            if (!resultadoCurso.exists()) {
                mostrarError(
                    "El curso solicitado no existe."
                );
                return;
            }

            const datosUsuario =
                resultadoUsuario.data();

            const curso = {
                id: resultadoCurso.id,
                ...resultadoCurso.data()
            };

            const tieneAcceso =
                comprobarAcceso(datosUsuario, curso);

            if (!tieneAcceso) {
                mostrarError(
                    "No tenés acceso al contenido de este curso. Debés adquirirlo o solicitar una beca."
                );
                return;
            }

            const modulos = await obtenerModulos(curso.id);

            mostrarCurso(curso, modulos);

        } catch (error) {
            console.error(
                "Error al cargar el contenido del curso:",
                error
            );

            mostrarError(
                "No fue posible cargar el contenido del curso."
            );
        }
    });
}
//comprueba acceso
function comprobarAcceso(datosUsuario, curso) {
    const rol = (
        datosUsuario.tipoUsuario ||
        datosUsuario.rol ||
        ""
    )
        .toString()
        .trim()
        .toLowerCase();

    
    if (rol === "docente/admin") {
        return true;
    }
        

    if (rol !== "estudiante") {
        return false;
    }

    const servicios =
        Array.isArray(datosUsuario.serviciosAdquiridos)
            ? datosUsuario.serviciosAdquiridos
            : [];

    return servicios.some((servicio) => {
        
        if (typeof servicio === "string") {
            return normalizarTexto(servicio) ===
                normalizarTexto(curso.titulo);
        }

        return (
            servicio.cursoId === curso.id ||
            servicio.id === curso.id ||
            normalizarTexto(servicio.curso) ===
                normalizarTexto(curso.titulo) ||
            normalizarTexto(servicio.titulo) ===
                normalizarTexto(curso.titulo)
        );
    });
}
function mostrarCurso(curso, modulos) {
    nombreCursoRuta.textContent =
        curso.titulo || "Curso";

    tituloCurso.textContent =
        curso.titulo || "Contenido del curso";

    if (modulos.length === 0) {
        mostrarError(
            "Este curso todavía no tiene módulos disponibles."
        );
        return;
    }

    mostrarListaModulos(modulos);

    mostrarModulo(
        modulos[0],
        0,
        modulos.length
    );

    estadoCarga.classList.add("d-none");
    mensajeError.classList.add("d-none");
    contenidoCurso.classList.remove("d-none");
}


async function obtenerModulos(idCurso) {
    const referenciaModulos = collection(
        db,
        "cursos",
        idCurso,
        "modulos"
    );

    const resultado =
        await getDocs(referenciaModulos);

    const modulos = await Promise.all(
        resultado.docs.map(async (documento) => {
            const modulo = {
                id: documento.id,
                ...documento.data()
            };

            modulo.recursos = await obtenerRecursos(
                idCurso,
                documento.id
            );

            return modulo;
        })
    );

    modulos.sort(
        (a, b) =>
            Number(a.numero) - Number(b.numero)
    );

    return modulos;
}


async function obtenerRecursos(idCurso, idModulo) {
    const referenciaRecursos = collection(
        db,
        "cursos",
        idCurso,
        "modulos",
        idModulo,
        "recursos"
    );

    const resultado =
        await getDocs(referenciaRecursos);

    const recursos = resultado.docs.map(
        (documento) => ({
            id: documento.id,
            ...documento.data()
        })
    );

    recursos.sort(
        (a, b) =>
            Number(a.orden) - Number(b.orden)
    );

    return recursos;
}

//menú lateral
function mostrarListaModulos(modulos) {
    listaModulos.replaceChildren();

    modulos.forEach((modulo, indice) => {
        const boton =
            document.createElement("button");

        boton.type = "button";

        boton.className =
            "list-group-item list-group-item-action p-3";

        const numero =
            document.createElement("strong");

        numero.className =
            "d-block mb-1";

        numero.textContent =
            `Módulo ${modulo.numero}`;

        const nombre =
            document.createElement("span");

        nombre.textContent =
            modulo.titulo;

        boton.appendChild(numero);
        boton.appendChild(nombre);

        boton.addEventListener("click", () => {
            quitarModuloActivo();

            boton.classList.add("active");

            mostrarModulo(
                modulo,
                indice,
                modulos.length
            );
        });

        if (indice === 0) {
            boton.classList.add("active");
        }

        listaModulos.appendChild(boton);
    });
}
//muestra modulo seleccionado 
function mostrarModulo(
    modulo,
    indice,
    cantidadModulos
) {
    numeroModulo.textContent =
        `Módulo ${modulo.numero} de ${cantidadModulos}`;

    tituloModulo.textContent =
        modulo.titulo;

    descripcionModulo.textContent =
        modulo.descripcion ||
        "Este módulo todavía no tiene una descripción.";

    mostrarObjetivos(modulo.objetivos);

    mostrarRecursos(modulo.recursos);

    actualizarProgreso(
        indice,
        cantidadModulos
    );
}
//agrega recursos
function mostrarObjetivos(objetivos) {
    listaObjetivos.replaceChildren();

    if (
        !Array.isArray(objetivos) ||
        objetivos.length === 0
    ) {
        seccionObjetivos.classList.add("d-none");
        return;
    }

    objetivos.forEach((objetivo) => {
        const elemento =
            document.createElement("li");

        elemento.textContent =
            objetivo;

        listaObjetivos.appendChild(elemento);
    });

    seccionObjetivos.classList.remove("d-none");
}


function mostrarRecursos(recursos) {
    listaRecursos.replaceChildren();

    if (
        !Array.isArray(recursos) ||
        recursos.length === 0
    ) {
        const columna =
            document.createElement("div");

        columna.className = "col-12";

        const aviso =
            document.createElement("div");

        aviso.className =
            "alert alert-secondary mb-0";

        aviso.innerHTML = `
            <i class="bi bi-info-circle me-2"></i>
            Los recursos de este módulo se agregarán próximamente.
        `;

        columna.appendChild(aviso);
        listaRecursos.appendChild(columna);

        return;
    }
}
//agrega funciones auxiliares
function actualizarProgreso(
    indice,
    cantidadModulos
) {
    const porcentaje =
        Math.round(
            ((indice + 1) / cantidadModulos) * 100
        );

    const barra =
        document.getElementById("barraProgreso");

    barra.style.width =
        `${porcentaje}%`;

    barra.textContent =
        `${porcentaje}%`;

    barra.setAttribute(
        "aria-valuenow",
        porcentaje
    );
}


function quitarModuloActivo() {
    const botones =
        listaModulos.querySelectorAll(
            ".list-group-item"
        );

    botones.forEach((boton) => {
        boton.classList.remove("active");
    });
}


function normalizarTexto(texto) {
    return String(texto || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}


function mostrarError(mensaje) {
    estadoCarga.classList.add("d-none");
    contenidoCurso.classList.add("d-none");

    mensajeError.textContent =
        mensaje;

    mensajeError.classList.remove("d-none");
}
