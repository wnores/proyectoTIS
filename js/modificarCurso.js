import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import {
    collection,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    addDoc,
    deleteDoc,
    query, 
    where
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const CLOUDINARY_CLOUD_NAME = "fd9bzuxj";
const CLOUDINARY_UPLOAD_PRESET = "ProyectoTaller";

const contenidoAdministrador = document.getElementById("contenidoAdministrador");
const selectorCurso = document.getElementById("selectorCurso");
const formModificarCurso = document.getElementById("formModificarCurso");
const mensajeCurso = document.getElementById("mensajeCurso");
const btnGuardarCambios = document.getElementById("btnGuardarCambios");
const selectCategoria = document.getElementById("categoria");

const imagenCurso = document.getElementById("imagenCurso");
const nombreImagenCurso = document.getElementById("nombreImagenCurso");
const vistaPreviaCurso = document.getElementById("vistaPreviaCurso");

// Elementos de la sección Módulos
const contenedorModulos = document.getElementById("contenedorModulos");
const btnAgregarModulo = document.getElementById("btnAgregarModulo");

let cursoSeleccionadoId = null;
let archivoImagenCurso = null;
let urlImagenActual = "";

// Estado local para los módulos
let listaModulos = [];
let modulosEliminados = [];

iniciarPagina();

if (imagenCurso) {
    imagenCurso.addEventListener("change", (event) => {
        const archivo = event.target.files[0];

        if (!archivo) {
            archivoImagenCurso = null;
            if (nombreImagenCurso) nombreImagenCurso.textContent = "No se seleccionó ninguna imagen nueva.";
            return;
        }

        archivoImagenCurso = archivo;
        if (nombreImagenCurso) nombreImagenCurso.textContent = archivo.name;

        if (vistaPreviaCurso) {
            vistaPreviaCurso.src = URL.createObjectURL(archivo);
            vistaPreviaCurso.classList.remove("d-none");
        }
    });
}

function iniciarPagina() {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            alert("Debés iniciar sesión para acceder.");
            window.location.href = "ingresar.html";
            return;
        }

        try {
            const docRef = doc(db, "usuarios", user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const datos = docSnap.data();
                const rol = (datos.tipoUsuario || datos.rol || "").toLowerCase().trim();

                if (rol.includes("admin") || rol.includes("docente")) {
                    if (contenidoAdministrador) {
                        contenidoAdministrador.classList.remove("d-none");
                    }
                    await cargarListaCursos();
                } else {
                    alert("No tenés permiso para modificar cursos.");
                    window.location.href = "catalogo.html";
                }
            } else {
                window.location.href = "catalogo.html";
            }
        } catch (error) {
            console.error("Error al validar permisos de administrador:", error);
            window.location.href = "catalogo.html";
        }
    });
}

async function cargarListaCursos() {
    try {
        const q = query(
            collection(db, "cursos"), 
            where("activo", "==", true)
        );

        const snapshot = await getDocs(q);
        const categoriasSet = new Set();

        if (selectorCurso) {
            selectorCurso.innerHTML = '<option value="">Selecciona un curso para editar</option>';
        }

        snapshot.forEach((docSnap) => {
            const curso = docSnap.data();

            if (selectorCurso) {
                const opcion = document.createElement("option");
                opcion.value = docSnap.id;
                opcion.textContent = curso.titulo || docSnap.id;
                selectorCurso.appendChild(opcion);
            }

            const cat = curso.categoria || curso.categorias;
            if (cat) {
                if (Array.isArray(cat)) {
                    cat.forEach((c) => c && categoriasSet.add(c.trim()));
                } else if (typeof cat === "string") {
                    categoriasSet.add(cat.trim());
                }
            }
        });

        if (selectCategoria) {
            selectCategoria.innerHTML = '<option value="">Seleccioná una categoría</option>';
            const categoriasOrdenadas = Array.from(categoriasSet).sort();
            categoriasOrdenadas.forEach((catNombre) => {
                const opcionCat = document.createElement("option");
                opcionCat.value = catNombre;
                opcionCat.textContent = catNombre;
                selectCategoria.appendChild(opcionCat);
            });
        }

    } catch (error) {
        console.error("Error al cargar los cursos activos:", error);
        mostrarMensaje("No se pudieron cargar los cursos activos.", "danger");
    }
}

if (selectorCurso) {
    selectorCurso.addEventListener("change", async () => {
        const id = selectorCurso.value;

        archivoImagenCurso = null;
        listaModulos = [];
        modulosEliminados = [];

        if (imagenCurso) imagenCurso.value = "";
        if (nombreImagenCurso) nombreImagenCurso.textContent = "No se seleccionó ninguna imagen nueva.";
        if (vistaPreviaCurso) {
            vistaPreviaCurso.classList.add("d-none");
            vistaPreviaCurso.removeAttribute("src");
        }

        if (!id) {
            if (formModificarCurso) formModificarCurso.classList.add("d-none");
            cursoSeleccionadoId = null;
            urlImagenActual = "";
            return;
        }

        try {
            const snap = await getDoc(doc(db, "cursos", id));

            if (!snap.exists()) {
                mostrarMensaje("El curso seleccionado ya no existe.", "danger");
                if (formModificarCurso) formModificarCurso.classList.add("d-none");
                return;
            }

            const curso = snap.data();
            cursoSeleccionadoId = id;
            urlImagenActual = curso.URL_imagen ?? curso.imagen_url ?? "";

            document.getElementById("titulo").value = curso.titulo ?? "";
            document.getElementById("descripcion").value = curso.descripcion ?? "";
            
            if (selectCategoria) {
                selectCategoria.value = curso.categoria ?? curso.categorias ?? "";
            }
            
            document.getElementById("precio").value = curso.precio ?? "";
            document.getElementById("duracion").value = curso.duracion_horas ?? "";
            document.getElementById("cupos").value = curso.cupos_disponibles ?? "";

            if (urlImagenActual && vistaPreviaCurso) {
                vistaPreviaCurso.src = urlImagenActual;
                vistaPreviaCurso.classList.remove("d-none");
                if (nombreImagenCurso) {
                    nombreImagenCurso.textContent = "Imagen actual del curso (elegí un archivo para reemplazarla).";
                }
            }

            // Cargar subcolección de módulos desde Firestore
            await cargarModulosDelCurso(id);

            if (formModificarCurso) formModificarCurso.classList.remove("d-none");
            if (mensajeCurso) mensajeCurso.classList.add("d-none");
        } catch (error) {
            console.error("Error al cargar el curso:", error);
            mostrarMensaje("No se pudo cargar el curso seleccionado.", "danger");
        }
    });
}

/**
 * Carga los módulos y adapta los recursos si vienen como texto único o como array
 */
async function cargarModulosDelCurso(idCurso) {
    try {
        const modulosRef = collection(db, "cursos", idCurso, "modulos");
        const snapshot = await getDocs(modulosRef);

        listaModulos = [];
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            
            // Normalizar el arreglo de recursos
            let recursosArr = [];
            if (Array.isArray(data.recursos)) {
                recursosArr = data.recursos;
            } else if (typeof data.recursos === "string" && data.recursos.trim() !== "") {
                recursosArr = [{ tipo: "pdf", url: data.recursos, nombre: "Recurso del módulo" }];
            }

            listaModulos.push({
                id: docSnap.id,
                numero: data.numero || (listaModulos.length + 1),
                titulo: data.titulo || '',
                descripcion: data.descripcion || '',
                recursos: recursosArr,
                objetivos: Array.isArray(data.objetivos) ? [...data.objetivos] : []
            });
        });

        listaModulos.sort((a, b) => a.numero - b.numero);
        renderizarModulos();
    } catch (error) {
        console.error("Error al obtener los módulos del curso:", error);
    }
}

/**
 * Renderiza módulos con selector dinámico de tipos de recurso (PDF, Drive, Presentación, URL)
 */
function renderizarModulos() {
    if (!contenedorModulos) return;
    contenedorModulos.innerHTML = '';

    listaModulos.forEach((mod, indexModulo) => {
        mod.numero = indexModulo + 1;

        const divModulo = document.createElement('div');
        divModulo.className = 'card mb-3 p-3 border-secondary';
        divModulo.innerHTML = `
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h5 class="m-0">Módulo ${mod.numero}</h5>
            <button type="button" class="btn btn-outline-danger btn-sm btn-eliminar-modulo" data-index="${indexModulo}">
              Eliminar Módulo
            </button>
          </div>

          <div class="mb-2">
            <label class="form-label font-weight-bold">Título del Módulo:</label>
            <input type="text" class="form-control input-titulo" data-index="${indexModulo}" value="${mod.titulo}" required>
          </div>

          <div class="mb-2">
            <label class="form-label">Descripción:</label>
            <textarea class="form-control input-descripcion" data-index="${indexModulo}" rows="2">${mod.descripcion}</textarea>
          </div>

          <!-- SECCIÓN DE RECURSOS / MATERIALES -->
          <div class="mb-3 border p-2 rounded bg-light">
            <label class="form-label font-weight-bold text-secondary">
              <i class="bi bi-folder2-open me-1"></i> Recursos y Materiales
            </label>
            <div id="contenedorRecursos-${indexModulo}">
              ${mod.recursos.map((rec, indexRec) => `
                <div class="row g-2 mb-2 align-items-center">
                  <div class="col-md-3">
                    <select class="form-select select-tipo-recurso" data-mod-index="${indexModulo}" data-rec-index="${indexRec}">
                      <option value="pdf" ${rec.tipo === 'pdf' ? 'selected' : ''}>📄 PDF / Documento</option>
                      <option value="drive" ${rec.tipo === 'drive' ? 'selected' : ''}>📁 Google Drive</option>
                      <option value="presentacion" ${rec.tipo === 'presentacion' ? 'selected' : ''}>📊 Presentación (Slides/Canva)</option>
                      <option value="url" ${rec.tipo === 'url' ? 'selected' : ''}>🔗 Enlace / Web</option>
                      <option value="python">🐍 Archivo Python</option>
                    </select>
                  </div>
                  <div class="col-md-4">
                    <input type="text" class="form-control input-nombre-recurso" data-mod-index="${indexModulo}" data-rec-index="${indexRec}" value="${rec.nombre || ''}" placeholder="Nombre del material">
                  </div>
                  <div class="col-md-4">
                    <input type="url" class="form-control input-url-recurso" data-mod-index="${indexModulo}" data-rec-index="${indexRec}" value="${rec.url || ''}" placeholder="https://drive.google.com/..." required>
                  </div>
                  <div class="col-md-1 text-end">
                    <button type="button" class="btn btn-outline-danger btn-sm btn-eliminar-recurso" data-mod-index="${indexModulo}" data-rec-index="${indexRec}">✕</button>
                  </div>
                </div>
              `).join('')}
            </div>
            <button type="button" class="btn btn-sm btn-outline-secondary mt-1 btn-agregar-recurso" data-index="${indexModulo}">
              + Agregar Material / Recurso
            </button>
          </div>

          <!-- SECCIÓN DE OBJETIVOS -->
          <div class="mb-2">
            <label class="form-label font-weight-bold text-secondary">Objetivos del Módulo:</label>
            <div id="contenedorObjetivos-${indexModulo}">
              ${mod.objetivos.map((obj, indexObj) => `
                <div class="input-group mb-1">
                  <input type="text" class="form-control input-objetivo" data-mod-index="${indexModulo}" data-obj-index="${indexObj}" value="${obj}">
                  <button type="button" class="btn btn-outline-secondary btn-eliminar-objetivo" data-mod-index="${indexModulo}" data-obj-index="${indexObj}">✕</button>
                </div>
              `).join('')}
            </div>
            <button type="button" class="btn btn-sm btn-outline-primary mt-1 btn-agregar-objetivo" data-index="${indexModulo}">
              + Agregar Objetivo
            </button>
          </div>
        `;

        contenedorModulos.appendChild(divModulo);
    });

    asignarEventosModulos();
}

function asignarEventosModulos() {
    // Título y Descripción
    document.querySelectorAll('.input-titulo').forEach(input => {
        input.addEventListener('input', (e) => {
            listaModulos[e.target.dataset.index].titulo = e.target.value;
        });
    });

    document.querySelectorAll('.input-descripcion').forEach(textarea => {
        textarea.addEventListener('input', (e) => {
            listaModulos[e.target.dataset.index].descripcion = e.target.value;
        });
    });

    // Manejo de Recursos
    document.querySelectorAll('.select-tipo-recurso').forEach(select => {
        select.addEventListener('change', (e) => {
            const modIdx = e.target.dataset.modIndex;
            const recIdx = e.target.dataset.recIndex;
            listaModulos[modIdx].recursos[recIdx].tipo = e.target.value;
        });
    });

    document.querySelectorAll('.input-nombre-recurso').forEach(input => {
        input.addEventListener('input', (e) => {
            const modIdx = e.target.dataset.modIndex;
            const recIdx = e.target.dataset.recIndex;
            listaModulos[modIdx].recursos[recIdx].nombre = e.target.value;
        });
    });

    document.querySelectorAll('.input-url-recurso').forEach(input => {
        input.addEventListener('input', (e) => {
            const modIdx = e.target.dataset.modIndex;
            const recIdx = e.target.dataset.recIndex;
            listaModulos[modIdx].recursos[recIdx].url = e.target.value;
        });
    });

    document.querySelectorAll('.btn-agregar-recurso').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modIdx = e.target.dataset.index;
            listaModulos[modIdx].recursos.push({ tipo: 'pdf', nombre: '', url: '' });
            renderizarModulos();
        });
    });

    document.querySelectorAll('.btn-eliminar-recurso').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modIdx = e.target.dataset.modIndex;
            const recIdx = e.target.dataset.recIndex;
            listaModulos[modIdx].recursos.splice(recIdx, 1);
            renderizarModulos();
        });
    });

    // Manejo de Objetivos
    document.querySelectorAll('.input-objetivo').forEach(input => {
        input.addEventListener('input', (e) => {
            const modIdx = e.target.dataset.modIndex;
            const objIdx = e.target.dataset.objIndex;
            listaModulos[modIdx].objetivos[objIdx] = e.target.value;
        });
    });

    document.querySelectorAll('.btn-agregar-objetivo').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modIdx = e.target.dataset.index;
            listaModulos[modIdx].objetivos.push('');
            renderizarModulos();
        });
    });

    document.querySelectorAll('.btn-eliminar-objetivo').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modIdx = e.target.dataset.modIndex;
            const objIdx = e.target.dataset.objIndex;
            listaModulos[modIdx].objetivos.splice(objIdx, 1);
            renderizarModulos();
        });
    });

    // Eliminar Módulo Completo
    document.querySelectorAll('.btn-eliminar-modulo').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = e.target.dataset.index;
            const moduloRemovido = listaModulos.splice(idx, 1)[0];
            if (moduloRemovido.id) {
                modulosEliminados.push(moduloRemovido.id);
            }
            renderizarModulos();
        });
    });
}

// Botón "+ Agregar módulo"
if (btnAgregarModulo) {
    btnAgregarModulo.addEventListener('click', () => {
        listaModulos.push({
            id: null,
            numero: listaModulos.length + 1,
            titulo: '',
            descripcion: '',
            recursos: [{ tipo: 'pdf', nombre: '', url: '' }],
            objetivos: ['']
        });
        renderizarModulos();
    });
}

if (formModificarCurso) {
    formModificarCurso.addEventListener("submit", async (event) => {
        event.preventDefault();

        const usuario = auth.currentUser;
        if (!usuario) {
            mostrarMensaje("Debés iniciar sesión para modificar un curso.", "danger");
            return;
        }

        if (!cursoSeleccionadoId) {
            mostrarMensaje("Seleccioná un curso para modificar.", "danger");
            return;
        }

        const titulo = document.getElementById("titulo").value.trim();
        const descripcion = document.getElementById("descripcion").value.trim();
        const categoria = selectCategoria ? selectCategoria.value : "";
        const precio = Number(document.getElementById("precio").value);
        const duracionHoras = Number(document.getElementById("duracion").value);
        const cuposDisponibles = Number(document.getElementById("cupos").value);

        if (
            !titulo ||
            !descripcion ||
            !categoria ||
            precio < 0 ||
            duracionHoras <= 0 ||
            cuposDisponibles <= 0
        ) {
            mostrarMensaje("Revisá los datos ingresados en el formulario.", "danger");
            return;
        }

        if (btnGuardarCambios) {
            btnGuardarCambios.disabled = true;
            btnGuardarCambios.innerHTML = `
                <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Guardando...
            `;
        }

        try {
            let urlImagenFinal = urlImagenActual;

            if (archivoImagenCurso) {
                urlImagenFinal = await subirImagenACloudinary(archivoImagenCurso);
            }

            // 1. Guardar datos generales del curso
            await updateDoc(doc(db, "cursos", cursoSeleccionadoId), {
                titulo: titulo,
                descripcion: descripcion,
                categoria: categoria,
                precio: precio,
                duracion_horas: duracionHoras,
                cupos_disponibles: cuposDisponibles,
                URL_imagen: urlImagenFinal
            });

            // 2. Eliminar de Firestore los módulos retirados
            for (const idModEliminar of modulosEliminados) {
                await deleteDoc(doc(db, "cursos", cursoSeleccionadoId, "modulos", idModEliminar));
            }
            modulosEliminados = [];

            // 3. Crear o actualizar cada módulo en `modulos`
            const modulosRef = collection(db, "cursos", cursoSeleccionadoId, "modulos");

            for (let i = 0; i < listaModulos.length; i++) {
                const mod = listaModulos[i];
                
                // Filtrar recursos válidos (que tengan URL)
                const recursosValidos = mod.recursos.filter(r => r.url && r.url.trim() !== '');

                const datosModulo = {
                    numero: i + 1,
                    titulo: mod.titulo,
                    descripcion: mod.descripcion,
                    recursos: recursosValidos,
                    objetivos: mod.objetivos.filter(obj => obj.trim() !== '')
                };

                if (mod.id) {
                    await updateDoc(doc(db, "cursos", cursoSeleccionadoId, "modulos", mod.id), datosModulo);
                } else {
                    const docNuevo = await addDoc(modulosRef, datosModulo);
                    mod.id = docNuevo.id;
                }
            }

            urlImagenActual = urlImagenFinal;
            archivoImagenCurso = null;
            if (imagenCurso) imagenCurso.value = "";
            if (nombreImagenCurso) nombreImagenCurso.textContent = "No se seleccionó ninguna imagen nueva.";

            mostrarMensaje("El curso y sus recursos se guardaron correctamente. Redirigiendo...", "success");

            setTimeout(() => {
                window.location.href = "administrarCursos.html";
            }, 3000);

        } catch (error) {
            console.error("Error al modificar el curso:", error);
            mostrarMensaje("No se pudo modificar el curso. Intentá nuevamente.", "danger");
            
            if (btnGuardarCambios) {
                btnGuardarCambios.disabled = false;
                btnGuardarCambios.innerHTML = `
                    <i class="bi bi-check-circle-fill me-2"></i>
                    Guardar cambios
                `;
            }
        }
    });
}

function mostrarMensaje(texto, tipo) {
    if (mensajeCurso) {
        mensajeCurso.textContent = texto;
        mensajeCurso.className = `alert alert-${tipo}`;
        mensajeCurso.classList.remove("d-none");

        mensajeCurso.style.transition = "transform 0.2s ease, opacity 0.2s ease";
        mensajeCurso.style.transform = "scale(1.03)";
        setTimeout(() => {
            mensajeCurso.style.transform = "scale(1)";
        }, 200);

        mensajeCurso.scrollIntoView({ behavior: "smooth", block: "center" });
    }
}

async function subirImagenACloudinary(archivo) {
    const datosFormulario = new FormData();
    datosFormulario.append("file", archivo);
    datosFormulario.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const respuesta = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
            method: "POST",
            body: datosFormulario
        }
    );

    if (!respuesta.ok) {
        throw new Error("No se pudo subir la imagen.");
    }

    const datos = await respuesta.json();
    return datos.secure_url;
}