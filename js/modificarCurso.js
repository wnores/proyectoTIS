import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import {
    collection,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    addDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const CLOUDINARY_CLOUD_NAME = "fd9bzuxj";
const CLOUDINARY_UPLOAD_PRESET = "ProyectoTaller";

const contenidoAdmin = document.getElementById("contenidoAdmin");
const selectorCurso = document.getElementById("selectorCurso");
const formModificarCurso = document.getElementById("formModificarCurso");
const mensajeCurso = document.getElementById("mensajeCurso");
const btnGuardarCambios = document.getElementById("btnGuardarCambios");
const selectCategoria = document.getElementById("categoria");

const imagenCurso = document.getElementById("imagenCurso");
const nombreImagenCurso = document.getElementById("nombreImagenCurso");
const vistaPreviaCurso = document.getElementById("vistaPreviaCurso");

const actividadPdf = document.getElementById("actividadPdf");
const nombreActividadPdf = document.getElementById("nombreActividadPdf");
const contenedorPreviaPdf = document.getElementById("contenedorPreviaPdf");
const enlacePdfActual = document.getElementById("enlacePdfActual");

const contenedorModulos = document.getElementById("contenedorModulos");
const btnAgregarModulo = document.getElementById("btnAgregarModulo");

let cursoSeleccionadoId = null;
let archivoImagenCurso = null;
let urlImagenActual = "";

let archivoActividadPdf = null;
let urlPdfActual = "";

let listaModulos = [];
let modulosEliminados = [];
let temasEliminados = [];

let moduloPaginaActual = 0;

iniciarPagina();

function iniciarPagina() {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            mostrarAccesoDenegado("Debés iniciar sesión para acceder a esta sección.", "ingresar.html");
            return;
        }

        try {
            const docRef = doc(db, "usuarios", user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const datos = docSnap.data();
                const rol = (datos.tipoUsuario || datos.rol || "").toLowerCase().trim();

                if (rol.includes("docente/admin")) {
                    if (contenidoAdmin) {
                        contenidoAdmin.classList.remove("d-none");
                    }
                    await cargarListaCursos();
                } else {
                    mostrarAccesoDenegado("No tenés permiso para modificar cursos.", "index.html");
                }
            } else {
                mostrarAccesoDenegado("No se encontraron los datos de tu usuario.", "index.html");
            }
        } catch (error) {
            console.error("Error al validar permisos de administrador:", error);
            mostrarAccesoDenegado("Ocurrió un error al verificar tus permisos.", "index.html");
        }
    });
}

function mostrarAccesoDenegado(mensajeTexto, destinoRedireccion) {
    if (contenidoAdmin) {
        contenidoAdmin.classList.add("d-none");
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

if (actividadPdf) {
    actividadPdf.addEventListener("change", (event) => {
        const archivo = event.target.files[0];

        if (!archivo) {
            archivoActividadPdf = null;
            if (nombreActividadPdf) nombreActividadPdf.textContent = "No se seleccionó ningún archivo PDF.";
            return;
        }

        if (archivo.type !== "application/pdf") {
            alert("Por favor, seleccioná un archivo en formato PDF.");
            actividadPdf.value = "";
            archivoActividadPdf = null;
            if (nombreActividadPdf) nombreActividadPdf.textContent = "No se seleccionó ningún archivo PDF.";
            return;
        }

        archivoActividadPdf = archivo;
        if (nombreActividadPdf) nombreActividadPdf.textContent = `Archivo seleccionado: ${archivo.name}`;
    });
}

async function cargarListaCursos() {
    try {
        const snapshot = await getDocs(collection(db, "cursoscc"));
        const categoriasSet = new Set();

        if (selectorCurso) {
            selectorCurso.innerHTML = '<option value="">Seleccioná un curso para editar</option>';
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
        console.error("Error al cargar los cursos:", error);
        mostrarMensaje("No se pudieron cargar los cursos.", "danger");
    }
}

if (selectorCurso) {
    selectorCurso.addEventListener("change", async () => {
        const id = selectorCurso.value;

        archivoImagenCurso = null;
        archivoActividadPdf = null;
        listaModulos = [];
        modulosEliminados = [];
        temasEliminados = [];
        moduloPaginaActual = 0;

        if (imagenCurso) imagenCurso.value = "";
        if (nombreImagenCurso) nombreImagenCurso.textContent = "No se seleccionó ninguna imagen nueva.";
        if (vistaPreviaCurso) {
            vistaPreviaCurso.classList.add("d-none");
            vistaPreviaCurso.removeAttribute("src");
        }

        if (actividadPdf) actividadPdf.value = "";
        if (nombreActividadPdf) nombreActividadPdf.textContent = "No se seleccionó ningún archivo PDF.";
        if (contenedorPreviaPdf) contenedorPreviaPdf.classList.add("d-none");

        if (!id) {
            if (formModificarCurso) formModificarCurso.classList.add("d-none");
            cursoSeleccionadoId = null;
            urlImagenActual = "";
            urlPdfActual = "";
            return;
        }

        try {
            const snap = await getDoc(doc(db, "cursoscc", id));

            if (!snap.exists()) {
                mostrarMensaje("El curso seleccionado ya no existe.", "danger");
                if (formModificarCurso) formModificarCurso.classList.add("d-none");
                return;
            }

            const curso = snap.data();
            cursoSeleccionadoId = id;
            urlImagenActual = curso.URL_imagen ?? curso.imagen_url ?? "";
            urlPdfActual = curso.actividad_pdf_url ?? curso.actividadPdf ?? curso.actividad ?? "";

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

            if (urlPdfActual && enlacePdfActual && contenedorPreviaPdf) {
                enlacePdfActual.href = urlPdfActual;
                contenedorPreviaPdf.classList.remove("d-none");
                if (nombreActividadPdf) {
                    nombreActividadPdf.textContent = "PDF actual registrado (puedes adjuntar uno nuevo para reemplazarlo).";
                }
            }

            await cargarModulosDelCurso(id);

            if (formModificarCurso) formModificarCurso.classList.remove("d-none");
            if (mensajeCurso) mensajeCurso.classList.add("d-none");
        } catch (error) {
            console.error("Error al cargar el curso:", error);
            mostrarMensaje("No se pudo cargar el curso seleccionado.", "danger");
        }
    });
}

async function cargarModulosDelCurso(idCurso) {
    try {
        const modulosRef = collection(db, "cursoscc", idCurso, "modulos");
        const snapshot = await getDocs(modulosRef);

        listaModulos = [];

        for (const docSnap of snapshot.docs) {
            const data = docSnap.data();
            const modId = docSnap.id;

            const temasRef = collection(db, "cursoscc", idCurso, "modulos", modId, "temas");
            const snapshotTemas = await getDocs(temasRef);
            let temasArr = [];

            if (!snapshotTemas.empty) {
                snapshotTemas.forEach((tDoc, idx) => {
                    const tData = tDoc.data();
                    temasArr.push({
                        id: tDoc.id,
                        orden: tData.orden ?? tData.numero ?? (idx + 1),
                        nombre: tData.nombre || tData.titulo || '',
                        descripcion: tData.descripcion || '',
                        objetivos: Array.isArray(tData.objetivos) ? tData.objetivos : [],
                        recursos: Array.isArray(tData.recursos) ? tData.recursos : []
                    });
                });
                temasArr.sort((a, b) => a.orden - b.orden);
            } else if (Array.isArray(data.temas)) {
                temasArr = data.temas.map((t, idx) => ({
                    id: null,
                    orden: idx + 1,
                    nombre: typeof t === 'string' ? t : (t.nombre || t.titulo || ''),
                    descripcion: typeof t === 'object' ? (t.descripcion || '') : '',
                    objetivos: typeof t === 'object' && Array.isArray(t.objetivos) ? t.objetivos : [],
                    recursos: typeof t === 'object' && Array.isArray(t.recursos) ? t.recursos : []
                }));
            }

            listaModulos.push({
                id: modId,
                numero: data.numero || (listaModulos.length + 1),
                nombre: data.nombre || data.modulo || data.titulo || '',
                temas: temasArr
            });
        }

        listaModulos.sort((a, b) => a.numero - b.numero);
        moduloPaginaActual = 0;
        renderizarModulos();
    } catch (error) {
        console.error("Error al obtener los módulos del curso:", error);
    }
}

function renderizarModulos() {
    if (!contenedorModulos) return;
    contenedorModulos.innerHTML = '';

    if (listaModulos.length === 0) {
        contenedorModulos.innerHTML = `
            <div class="alert alert-secondary text-center">
                El curso aún no posee módulos agregados. Presioná <strong>"+ Agregar Módulo"</strong> para empezar.
            </div>
        `;
        return;
    }

    if (moduloPaginaActual >= listaModulos.length) {
        moduloPaginaActual = Math.max(0, listaModulos.length - 1);
    }

    listaModulos.forEach((m, i) => m.numero = i + 1);

    const mod = listaModulos[moduloPaginaActual];
    const indexModulo = moduloPaginaActual;

    mod.temas.forEach((t, idx) => {
        t.orden = idx + 1;
    });

    const divNavegacion = document.createElement('div');
    divNavegacion.className = 'mb-3 bg-light p-3 rounded border shadow-sm';

    let htmlBotonesPasos = '';
    listaModulos.forEach((m, idx) => {
        const esActivo = idx === moduloPaginaActual;
        htmlBotonesPasos += `
            <button type="button" class="btn btn-sm ${esActivo ? 'btn-primary' : 'btn-outline-secondary'} me-1 mb-1 btn-ir-a-modulo" data-index="${idx}">
                Módulo ${m.numero}
            </button>
        `;
    });

    divNavegacion.innerHTML = `
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
            <div>
                <span class="fw-bold text-dark me-2"><i class="bi bi-collection-play me-1"></i>Página de Módulo:</span>
                ${htmlBotonesPasos}
            </div>
            <span class="badge bg-secondary">Módulo ${indexModulo + 1} de ${listaModulos.length}</span>
        </div>
    `;

    const divModulo = document.createElement('div');
    divModulo.className = 'card border-secondary shadow-sm p-3 mb-3';
    divModulo.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="m-0 text-primary fw-bold">Módulo ${mod.numero}</h5>
        <button type="button" class="btn btn-outline-danger btn-sm btn-eliminar-modulo" data-index="${indexModulo}">
          <i class="bi bi-trash me-1"></i>Eliminar Este Módulo
        </button>
      </div>

      <div class="mb-3">
        <label class="form-label fw-bold">Nombre del Módulo:</label>
        <input type="text" class="form-control input-nombre-modulo" data-index="${indexModulo}" value="${mod.nombre}" placeholder="Ej. Introducción a la programación" required>
      </div>

      <div class="mb-3 border p-3 rounded bg-light">
        <label class="form-label fw-bold text-dark fs-6">
          <i class="bi bi-journal-text me-1"></i> Temas del Módulo
        </label>
        
        <div id="contenedorTemas-${indexModulo}">
          ${mod.temas.map((tema, indexTema) => `
            <div class="border rounded p-3 mb-3 bg-white shadow-sm">
              <div class="d-flex align-items-center justify-content-between mb-2">
                <span class="fw-bold text-primary">Tema ${indexTema + 1}</span>
                <button type="button" class="btn btn-outline-danger btn-sm btn-eliminar-tema" data-mod-index="${indexModulo}" data-tema-index="${indexTema}">
                  <i class="bi bi-trash"></i> Eliminar Tema
                </button>
              </div>

              <div class="mb-2">
                <label class="form-label small fw-bold">Nombre del Tema:</label>
                <input type="text" class="form-control input-nombre-tema" data-mod-index="${indexModulo}" data-tema-index="${indexTema}" value="${tema.nombre}" placeholder="Ej. Variables y tipos de datos">
              </div>

              <div class="mb-2">
                <label class="form-label small fw-bold">Descripción del Tema:</label>
                <textarea class="form-control input-descripcion-tema" data-mod-index="${indexModulo}" data-tema-index="${indexTema}" rows="2" placeholder="Resumen de lo que aborda este tema">${tema.descripcion}</textarea>
              </div>

              <div class="mb-3 p-2 bg-light rounded border">
                <label class="form-label small fw-bold text-secondary">Objetivos del Tema:</label>
                <div>
                  ${tema.objetivos.map((obj, indexObj) => `
                    <div class="input-group input-group-sm mb-1">
                      <input type="text" class="form-control input-objetivo-tema" data-mod-index="${indexModulo}" data-tema-index="${indexTema}" data-obj-index="${indexObj}" value="${obj}" placeholder="Ej. Dominar el uso de condicionales">
                      <button type="button" class="btn btn-outline-danger btn-eliminar-objetivo-tema" data-mod-index="${indexModulo}" data-tema-index="${indexTema}" data-obj-index="${indexObj}">✕</button>
                    </div>
                  `).join('')}
                </div>
                <button type="button" class="btn btn-sm btn-link p-0 mt-1 btn-agregar-objetivo-tema text-decoration-none" data-mod-index="${indexModulo}" data-tema-index="${indexTema}">
                  + Agregar Objetivo al Tema
                </button>
              </div>

              <div class="p-2 bg-light rounded border">
                <label class="form-label small fw-bold text-secondary">Recursos del Tema:</label>
                <div>
                  ${tema.recursos.map((rec, indexRec) => `
                    <div class="row g-2 mb-2 align-items-center">
                      <div class="col-md-3">
                        <select class="form-select form-select-sm select-tipo-recurso" data-mod-index="${indexModulo}" data-tema-index="${indexTema}" data-rec-index="${indexRec}">
                          <option value="pdf" ${rec.tipo === 'pdf' ? 'selected' : ''}>📄 PDF / Doc</option>
                          <option value="drive" ${rec.tipo === 'drive' ? 'selected' : ''}>📁 Google Drive</option>
                          <option value="presentacion" ${rec.tipo === 'presentacion' ? 'selected' : ''}>📊 Presentación</option>
                          <option value="url" ${rec.tipo === 'url' ? 'selected' : ''}>🔗 Enlace Web</option>
                        </select>
                      </div>
                      <div class="col-md-4">
                        <input type="text" class="form-control form-control-sm input-nombre-recurso" data-mod-index="${indexModulo}" data-tema-index="${indexTema}" data-rec-index="${indexRec}" value="${rec.nombre || ''}" placeholder="Nombre del recurso">
                      </div>
                      <div class="col-md-4">
                        <input type="url" class="form-control form-control-sm input-url-recurso" data-mod-index="${indexModulo}" data-tema-index="${indexTema}" data-rec-index="${indexRec}" value="${rec.url || ''}" placeholder="https://...">
                      </div>
                      <div class="col-md-1 text-end">
                        <button type="button" class="btn btn-outline-danger btn-sm btn-eliminar-recurso" data-mod-index="${indexModulo}" data-tema-index="${indexTema}" data-rec-index="${indexRec}">✕</button>
                      </div>
                    </div>
                  `).join('')}
                </div>
                <button type="button" class="btn btn-sm btn-link p-0 mt-1 btn-agregar-recurso text-decoration-none" data-mod-index="${indexModulo}" data-tema-index="${indexTema}">
                  + Agregar Recurso al Tema
                </button>
              </div>

            </div>
          `).join('')}
        </div>

        <button type="button" class="btn btn-sm btn-outline-primary mt-1 btn-agregar-tema" data-index="${indexModulo}">
          + Agregar Nuevo Tema
        </button>
      </div>
    `;

    const divFooterPaginacion = document.createElement('div');
    divFooterPaginacion.className = 'd-flex justify-content-between align-items-center mt-3';

    const btnAnterior = document.createElement('button');
    btnAnterior.type = 'button';
    btnAnterior.className = `btn btn-outline-secondary btn-sm ${moduloPaginaActual === 0 ? 'disabled' : ''}`;
    btnAnterior.innerHTML = `<i class="bi bi-chevron-left me-1"></i> Anterior Módulo`;
    btnAnterior.addEventListener('click', () => {
        if (moduloPaginaActual > 0) {
            moduloPaginaActual--;
            renderizarModulos();
        }
    });

    const btnSiguiente = document.createElement('button');
    btnSiguiente.type = 'button';
    btnSiguiente.className = `btn btn-outline-secondary btn-sm ${moduloPaginaActual === listaModulos.length - 1 ? 'disabled' : ''}`;
    btnSiguiente.innerHTML = `Siguiente Módulo <i class="bi bi-chevron-right ms-1"></i>`;
    btnSiguiente.addEventListener('click', () => {
        if (moduloPaginaActual < listaModulos.length - 1) {
            moduloPaginaActual++;
            renderizarModulos();
        }
    });

    divFooterPaginacion.appendChild(btnAnterior);
    divFooterPaginacion.appendChild(btnSiguiente);

    contenedorModulos.appendChild(divNavegacion);
    contenedorModulos.appendChild(divModulo);
    contenedorModulos.appendChild(divFooterPaginacion);

    asignarEventosModulos();
}

function asignarEventosModulos() {
    document.querySelectorAll('.btn-ir-a-modulo').forEach(btn => {
        btn.addEventListener('click', (e) => {
            moduloPaginaActual = Number(e.target.dataset.index);
            renderizarModulos();
        });
    });

    document.querySelectorAll('.input-nombre-modulo').forEach(input => {
        input.addEventListener('input', (e) => {
            listaModulos[e.target.dataset.index].nombre = e.target.value;
        });
    });

    document.querySelectorAll('.input-nombre-tema').forEach(input => {
        input.addEventListener('input', (e) => {
            const { modIndex, temaIndex } = e.target.dataset;
            listaModulos[modIndex].temas[temaIndex].nombre = e.target.value;
        });
    });

    document.querySelectorAll('.input-descripcion-tema').forEach(textarea => {
        textarea.addEventListener('input', (e) => {
            const { modIndex, temaIndex } = e.target.dataset;
            listaModulos[modIndex].temas[temaIndex].descripcion = e.target.value;
        });
    });

    document.querySelectorAll('.btn-agregar-tema').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modIdx = e.target.dataset.index;
            listaModulos[modIdx].temas.push({
                id: null,
                orden: listaModulos[modIdx].temas.length + 1,
                nombre: '',
                descripcion: '',
                objetivos: [''],
                recursos: [{ tipo: 'pdf', nombre: '', url: '' }]
            });
            renderizarModulos();
        });
    });

    document.querySelectorAll('.btn-eliminar-tema').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const { modIndex, temaIndex } = e.target.dataset;
            const temaRemovido = listaModulos[modIndex].temas.splice(temaIndex, 1)[0];
            
            if (listaModulos[modIndex].id && temaRemovido.id) {
                temasEliminados.push({
                    moduloId: listaModulos[modIndex].id,
                    temaId: temaRemovido.id
                });
            }
            renderizarModulos();
        });
    });

    document.querySelectorAll('.input-objetivo-tema').forEach(input => {
        input.addEventListener('input', (e) => {
            const { modIndex, temaIndex, objIndex } = e.target.dataset;
            listaModulos[modIndex].temas[temaIndex].objetivos[objIndex] = e.target.value;
        });
    });

    document.querySelectorAll('.btn-agregar-objetivo-tema').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const { modIndex, temaIndex } = e.target.dataset;
            listaModulos[modIndex].temas[temaIndex].objetivos.push('');
            renderizarModulos();
        });
    });

    document.querySelectorAll('.btn-eliminar-objetivo-tema').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const { modIndex, temaIndex, objIndex } = e.target.dataset;
            listaModulos[modIndex].temas[temaIndex].objetivos.splice(objIndex, 1);
            renderizarModulos();
        });
    });

    document.querySelectorAll('.select-tipo-recurso').forEach(select => {
        select.addEventListener('change', (e) => {
            const { modIndex, temaIndex, recIndex } = e.target.dataset;
            listaModulos[modIndex].temas[temaIndex].recursos[recIndex].tipo = e.target.value;
        });
    });

    document.querySelectorAll('.input-nombre-recurso').forEach(input => {
        input.addEventListener('input', (e) => {
            const { modIndex, temaIndex, recIndex } = e.target.dataset;
            listaModulos[modIndex].temas[temaIndex].recursos[recIndex].nombre = e.target.value;
        });
    });

    document.querySelectorAll('.input-url-recurso').forEach(input => {
        input.addEventListener('input', (e) => {
            const { modIndex, temaIndex, recIndex } = e.target.dataset;
            listaModulos[modIndex].temas[temaIndex].recursos[recIndex].url = e.target.value;
        });
    });

    document.querySelectorAll('.btn-agregar-recurso').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const { modIndex, temaIndex } = e.target.dataset;
            listaModulos[modIndex].temas[temaIndex].recursos.push({ tipo: 'pdf', nombre: '', url: '' });
            renderizarModulos();
        });
    });

    document.querySelectorAll('.btn-eliminar-recurso').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const { modIndex, temaIndex, recIndex } = e.target.dataset;
            listaModulos[modIndex].temas[temaIndex].recursos.splice(recIndex, 1);
            renderizarModulos();
        });
    });

    document.querySelectorAll('.btn-eliminar-modulo').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = Number(e.target.dataset.index);
            const moduloRemovido = listaModulos.splice(idx, 1)[0];
            if (moduloRemovido.id) {
                modulosEliminados.push(moduloRemovido.id);
            }
            if (moduloPaginaActual >= listaModulos.length) {
                moduloPaginaActual = Math.max(0, listaModulos.length - 1);
            }
            renderizarModulos();
        });
    });
}

if (btnAgregarModulo) {
    btnAgregarModulo.addEventListener('click', () => {
        listaModulos.push({
            id: null,
            numero: listaModulos.length + 1,
            nombre: '',
            temas: [{
                id: null,
                orden: 1,
                nombre: '',
                descripcion: '',
                objetivos: [''],
                recursos: [{ tipo: 'pdf', nombre: '', url: '' }]
            }]
        });
        moduloPaginaActual = listaModulos.length - 1;
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
            let urlPdfFinal = urlPdfActual;

            if (archivoImagenCurso) {
                urlImagenFinal = await subirImagenACloudinary(archivoImagenCurso);
            }

            if (archivoActividadPdf) {
                urlPdfFinal = await subirPdfACloudinary(archivoActividadPdf);
            }

            await updateDoc(doc(db, "cursoscc", cursoSeleccionadoId), {
                titulo: titulo,
                descripcion: descripcion,
                categoria: categoria,
                precio: precio,
                duracion_horas: duracionHoras,
                cupos_disponibles: cuposDisponibles,
                URL_imagen: urlImagenFinal,
                actividad_pdf_url: urlPdfFinal
            });

            for (const idModEliminar of modulosEliminados) {
                await deleteDoc(doc(db, "cursoscc", cursoSeleccionadoId, "modulos", idModEliminar));
            }
            modulosEliminados = [];

            for (const tElim of temasEliminados) {
                await deleteDoc(doc(db, "cursoscc", cursoSeleccionadoId, "modulos", tElim.moduloId, "temas", tElim.temaId));
            }
            temasEliminados = [];

            const modulosRef = collection(db, "cursoscc", cursoSeleccionadoId, "modulos");

            for (let i = 0; i < listaModulos.length; i++) {
                const mod = listaModulos[i];

                const arrayTemasObjetos = [];
                const arrayNombresTemas = [];

                for (let j = 0; j < mod.temas.length; j++) {
                    const tema = mod.temas[j];

                    const estaCompletamenteVacio =
                        !(tema.nombre && tema.nombre.trim()) &&
                        !(tema.descripcion && tema.descripcion.trim()) &&
                        (!tema.objetivos || tema.objetivos.length === 0) &&
                        (!tema.recursos || tema.recursos.length === 0);

                    if (estaCompletamenteVacio) continue;

                    const nombreLimpio = (tema.nombre || "").trim();

                    const datosTema = {
                        orden: j + 1,
                        nombre: nombreLimpio,
                        descripcion: (tema.descripcion || "").trim(),
                        objetivos: Array.isArray(tema.objetivos) ? tema.objetivos.filter(o => typeof o === 'string' && o.trim() !== '') : [],
                        recursos: Array.isArray(tema.recursos) ? tema.recursos.filter(r => r.url && r.url.trim() !== '') : []
                    };

                    arrayTemasObjetos.push({ datos: datosTema, original: tema });
                    arrayNombresTemas.push(nombreLimpio);
                }

                const datosModulo = {
                    numero: i + 1,
                    nombre: (mod.nombre || "").trim(),
                    temas: arrayNombresTemas
                };

                let targetModuloId = mod.id;

                if (targetModuloId) {
                    await updateDoc(doc(db, "cursoscc", cursoSeleccionadoId, "modulos", targetModuloId), datosModulo);
                } else {
                    const docNuevoModulo = await addDoc(modulosRef, datosModulo);
                    targetModuloId = docNuevoModulo.id;
                    mod.id = targetModuloId;
                }

                const temasRef = collection(db, "cursoscc", cursoSeleccionadoId, "modulos", targetModuloId, "temas");

                for (let j = 0; j < arrayTemasObjetos.length; j++) {
                    const { datos, original } = arrayTemasObjetos[j];

                    if (original && original.id) {
                        await updateDoc(doc(db, "cursoscc", cursoSeleccionadoId, "modulos", targetModuloId, "temas", original.id), datos);
                    } else {
                        const docNuevoTema = await addDoc(temasRef, datos);
                        if (original) original.id = docNuevoTema.id;
                    }
                }
            }

            urlImagenActual = urlImagenFinal;
            archivoImagenCurso = null;
            if (imagenCurso) imagenCurso.value = "";
            if (nombreImagenCurso) nombreImagenCurso.textContent = "No se seleccionó ninguna imagen nueva.";

            urlPdfActual = urlPdfFinal;
            archivoActividadPdf = null;
            if (actividadPdf) actividadPdf.value = "";
            if (nombreActividadPdf) nombreActividadPdf.textContent = "No se seleccionó ningún archivo PDF.";

            mostrarMensaje("El curso, sus módulos y temas se guardaron correctamente. Redirigiendo...", "success");

            setTimeout(() => {
                window.location.href = "administrarCursos.html";
            }, 2500);

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

async function subirPdfACloudinary(archivo) {
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
        throw new Error("No se pudo subir el archivo PDF a Cloudinary");
    }

    const datos = await respuesta.json();
    return datos.secure_url;
}