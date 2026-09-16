// js/descripcionDeCurso.js
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
  const contenedor = document.getElementById('detalleCurso');
  const mensajeEstado = document.getElementById('estadoCarga');
  const plantilla = document.getElementById('plantillaDetalleCurso');

  const parametros = new URLSearchParams(window.location.search);
  const cursoId = parametros.get('id');

  if (!cursoId) {
    mostrarError('No se especificó qué curso mostrar. Volvé al catálogo y elegí un curso.');
    return;
  }

  cargarCurso(cursoId);

  // NUEVA FUNCIÓN: Obtiene el curso directamente desde Firestore
  async function cargarCurso(id) {
    try {
        const docRef = doc(db, 'cursos', id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            mostrarError('El curso solicitado no existe.');
            return;
        }

        // Una sola declaración de la constante
        const curso = {
            id: docSnap.id,
            ...docSnap.data()
        };

        mostrarCursoBase(curso);
        verificarUsuarioYMostrarModulos(curso);
    } catch (error) {
        console.error('Error al cargar el curso desde Firestore:', error);
        mostrarError('Ocurrió un error al cargar el curso. Intentá nuevamente más tarde.');
    }
}

  function mostrarCursoBase(curso) {
    const { claseCategoria, icono } = obtenerCategoria(curso.titulo);

    const precioFormateado = Number(curso.precio || 0).toLocaleString('es-UY', {
      style: 'currency',
      currency: 'UYU'
    });

    document.title = `${curso.titulo || 'Curso'} | Detalle de curso`;

    if (mensajeEstado) {
      mensajeEstado.classList.add('d-none');
    }

    const detalle = plantilla.content.cloneNode(true);

    const thumbContainer = detalle.querySelector('.js-thumb-container');
    const thumbImg = detalle.querySelector('.js-thumb-img');
    const thumbIcono = detalle.querySelector('.js-thumb-icono');

    function mostrarIcono() {
      thumbContainer?.classList.add('d-none');
      thumbIcono?.classList.remove('d-none');
      thumbIcono?.classList.add(claseCategoria);

      if (thumbIcono) {
        thumbIcono.textContent = icono;
      }
    }

    if (curso.imagen_url) {
      thumbImg.src = curso.imagen_url;
      thumbImg.alt = curso.titulo || 'Imagen del curso';

      thumbImg.addEventListener('error', mostrarIcono, {
        once: true
      });
    } else {
      mostrarIcono();
    }

    detalle.querySelector('.js-titulo').textContent = curso.titulo || '';
    detalle.querySelector('.js-descripcion').textContent = curso.descripcion ?? '';
    detalle.querySelector('.js-precio').textContent = precioFormateado;
    detalle.querySelector('.js-categoria').textContent = curso.categoria ?? 'Sin categoría';
    detalle.querySelector('.js-duracion').textContent = curso.duracion_horas ?? '-';
    detalle.querySelector('.js-modalidad').textContent = curso.modalidad ?? 'No especificada';
    detalle.querySelector('.js-cupos').textContent = curso.cupos_disponibles ?? '-';

    const btnBeca = detalle.querySelector('.js-beca');

    if (btnBeca) {
      btnBeca.href = `beca.html?curso=${curso.id}`;
    }

    contenedor.replaceChildren(detalle);
  }

  function verificarUsuarioYMostrarModulos(curso) {
    onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      try {
        const docRef = doc(db, "usuarios", user.uid);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) return;

        const datosUsuario = docSnap.data();

        const tipo = (datosUsuario.tipoUsuario || '')
          .toString()
          .trim()
          .toLowerCase();

        const btnInscribirmeSuperior = document.querySelector(
          '.js-btn-inscribirme-superior'
        );

        if (btnInscribirmeSuperior) {
          btnInscribirmeSuperior.classList.add('d-none');
        }

        if (tipo === 'estudiante') {
          renderizarTablaModulos(curso);

          const contenedorAcciones = document.querySelector(
            '.js-acciones-estudiante'
          );

          const btnInscribirmeInferior = document.querySelector(
            '.js-btn-inscribirme-inferior'
          );

          const btnBeca = document.querySelector('.js-btn-beca');

          const alertaExito = document.querySelector(
            '.js-alerta-exito'
          );

          const textoBtn = btnInscribirmeInferior?.querySelector(
            '.js-texto-btn'
          );

          const spinnerBtn = btnInscribirmeInferior?.querySelector(
            '.js-spinner'
          );

          const iconoBtn = btnInscribirmeInferior?.querySelector(
            '.js-icono-btn'
          );

          if (btnBeca) {
            btnBeca.href = `beca.html?curso=${curso.id}`;
          }

          if (contenedorAcciones) {
            contenedorAcciones.classList.remove('d-none');
          }

          if (btnInscribirmeInferior) {
            btnInscribirmeInferior.addEventListener('click', async (e) => {
              e.preventDefault();

              btnInscribirmeInferior.disabled = true;

              if (spinnerBtn) {
                spinnerBtn.classList.remove('d-none');
              }

              if (textoBtn) {
                textoBtn.textContent = 'Procesando registro...';
              }

              try {
                await updateDoc(docRef, {
                  serviciosAdquiridos: arrayUnion(curso.titulo)
                });

                if (spinnerBtn) {
                  spinnerBtn.classList.add('d-none');
                }

                if (iconoBtn) {
                  iconoBtn.classList.remove('d-none');
                }

                if (textoBtn) {
                  textoBtn.textContent = '¡Inscripto!';
                }

                btnInscribirmeInferior.classList.remove('btn-success');
                btnInscribirmeInferior.classList.add('btn-secondary');

                if (alertaExito) {
                  alertaExito.classList.remove('d-none');
                }
              } catch (error) {
                console.error(
                  "Error al guardar la inscripción:",
                  error
                );

                btnInscribirmeInferior.disabled = false;

                if (spinnerBtn) {
                  spinnerBtn.classList.add('d-none');
                }

                if (textoBtn) {
                  textoBtn.textContent = 'Inscribirme a este curso';
                }

                alert(
                  'No se pudo guardar la inscripción. Intentá nuevamente.'
                );
              }
            });
          }
        }

      } catch (error) {
        console.error(
          "Error al consultar el usuario en Firestore:",
          error
        );
      }
    });
  }

  function renderizarTablaModulos(curso) {
    const seccionModulos = document.querySelector('.js-seccion-modulos');
    const tablaBody = document.querySelector('.js-tabla-modulos-body');

    if (!seccionModulos || !tablaBody) {
      console.error(
        "No se encontraron los elementos .js-seccion-modulos o .js-tabla-modulos-body en el DOM."
      );
      return;
    }

    const clavesModulos = Object.keys(curso)
      .filter((clave) => clave.startsWith('modulo'))
      .sort();

    if (clavesModulos.length > 0) {
      tablaBody.innerHTML = '';

      clavesModulos.forEach((clave, index) => {
        const tr = document.createElement('tr');

        const tdNumero = document.createElement('td');
        tdNumero.className = 'fw-bold text-center';
        tdNumero.textContent = `Módulo ${index + 1}`;

        const tdDetalle = document.createElement('td');
        tdDetalle.textContent = curso[clave];

        tr.appendChild(tdNumero);
        tr.appendChild(tdDetalle);
        tablaBody.appendChild(tr);
      });

      seccionModulos.classList.remove('d-none');

      console.log("Tabla de módulos renderizada exitosamente.");
    } else {
      console.log(
        "Este curso no tiene campos 'modulo' definidos en Firestore."
      );
    }
  }

  function mostrarError(texto) {
    if (mensajeEstado) {
      mensajeEstado.textContent = texto;
      mensajeEstado.classList.remove('d-none');
    }

    contenedor.replaceChildren();
  }

  function obtenerCategoria(curso) {
    const categoria = (curso.categoria ?? '').toLowerCase();
    const titulo = (curso.titulo ?? '').toLowerCase();

    if (categoria.includes('desarrollo web') || titulo.includes('desarrollo web')) {
      return { claseCategoria: 'categoria-web', icono: '🌐' };
    }

    if (categoria.includes('excel') || titulo.includes('excel')) {
      return { claseCategoria: 'categoria-ofimatica', icono: '📊' };
    }

    if (categoria.includes('word') || titulo.includes('word')) {
      return { claseCategoria: 'categoria-ofimatica', icono: '📝' };
    }

    if (categoria.includes('hardware') || titulo.includes('micro:bit') || titulo.includes('microbit')) {
      return { claseCategoria: 'categoria-hardware', icono: '🔌' };
    }

    if (titulo.includes('scratch')) {
      return { claseCategoria: 'categoria-hardware', icono: '🧩' };
    }

    if (
      categoria.includes('inteligencia artificial') ||
      titulo.includes('inteligencia artificial') ||
      titulo.includes('machine learning')
    ) {
      return { claseCategoria: 'categoria-ia', icono: '🤖' };
    }

    if (
      categoria.includes('base de datos') ||
      titulo.includes('base de datos') ||
      titulo.includes('mysql')
    ) {
      return { claseCategoria: 'categoria-datos', icono: '🗄️' };
    }

    return { claseCategoria: 'categoria-programacion', icono: '💻' };
  }
});