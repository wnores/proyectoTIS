// js/descripcionDeCurso.js
// Lee el "id" del curso desde la URL (?id=3) y trae sus datos desde el backend.

document.addEventListener('DOMContentLoaded', () => {
  const contenedor = document.getElementById('detalleCurso');
  const mensajeEstado = document.getElementById('estadoCarga');

  const parametros = new URLSearchParams(window.location.search);
  const cursoId = parametros.get('id');

  if (!cursoId) {
    mostrarError('No se especificó qué curso mostrar. Volvé al catálogo y elegí un curso.');
  } else {
    cargarCurso(cursoId);
  }

  async function cargarCurso(id) {
  try {
    const respuesta = await fetch('js/data/cursos.json');

    if (!respuesta.ok) {
      throw new Error('No se pudo obtener el curso.');
    }

    const cursos = await respuesta.json();
    const curso = cursos.find(item => item.id == id);

    if (!curso) {
      mostrarError('El curso que buscás no existe.');
      return;
    }

    mostrarCurso(curso);
  } catch (error) {
    console.error('Error al cargar el curso:', error);
    mostrarError('Ocurrió un error al cargar el curso. Intentá nuevamente más tarde.');
  }
}

  function mostrarCurso(curso) {
    const { claseCategoria, icono } = obtenerCategoria(curso.titulo);
    const precioFormateado = Number(curso.precio).toLocaleString('es-UY', {
      style: 'currency',
      currency: 'UYU'
    });

    document.title = `${curso.titulo} | Detalle de curso`;
    mensajeEstado.classList.add('d-none');

    contenedor.innerHTML = `
      <div class="row">
        <div class="col-12 col-md-6">
          ${crearThumb(curso, claseCategoria, icono)}
        </div>
        <div class="col-12 col-md-6">
          <h1>${curso.titulo}</h1>
          <p class="lead">${curso.descripcion ?? ''}</p>
          <ul class="list-unstyled">
            <li><strong>Precio:</strong> ${precioFormateado}</li>
            <li><strong>Duración:</strong> ${curso.duracion_horas ?? '-'} horas</li>
            <li><strong>Cupos disponibles:</strong> ${curso.cupos_disponibles}</li>
          </ul>
          <div class="d-flex gap-2 mt-3 flex-wrap">
            <button class="btn btn-primary" id="btnInscribirse" disabled>
              Inscribirme (próximamente)
            </button>
            <a href="beca.html?curso=${curso.id}" class="btn btn-outline-secondary">Solicitar beca para este curso</a>
          </div>
        </div>
      </div>
    `;
  }

  function mostrarError(texto) {
    mensajeEstado.textContent = texto;
    mensajeEstado.classList.remove('d-none');
    contenedor.innerHTML = '';
  }

  // Misma lógica de categorías que catalogo.js, para mantener consistencia visual.
  function obtenerCategoria(titulo) {
    const t = titulo.toLowerCase();

    if (t.includes('excel')) return { claseCategoria: 'categoria-ofimatica', icono: '📊' };
    if (t.includes('word')) return { claseCategoria: 'categoria-ofimatica', icono: '📝' };
    if (t.includes('micro:bit') || t.includes('microbit')) return { claseCategoria: 'categoria-hardware', icono: '🔌' };
    if (t.includes('scratch')) return { claseCategoria: 'categoria-hardware', icono: '🧩' };
    if (t.includes('inteligencia artificial') || t.includes('machine learning')) return { claseCategoria: 'categoria-ia', icono: '🤖' };
    if (t.includes('base de datos') || t.includes('mysql') || t.includes('datos')) return { claseCategoria: 'categoria-datos', icono: '🗄️' };
    return { claseCategoria: 'categoria-programacion', icono: '💻' };
  }

  // Misma lógica que catalogo.js: foto real si existe, ícono de color si no.
  function crearThumb(curso, claseCategoria, icono) {
    if (curso.imagen_url) {
      return `
        <div class="curso-thumb-container">
          <img src="${curso.imagen_url}" class="curso-thumb-real" alt="${curso.titulo}"
               data-clase="${claseCategoria}" data-icono="${icono}"
               onerror="handleThumbError(this)">
        </div>
      `;
    }
    return `<div class="curso-thumb ${claseCategoria}">${icono}</div>`;
  }
});

function handleThumbError(imgEl) {
  const clase = imgEl.dataset.clase;
  const icono = imgEl.dataset.icono;
  const contenedor = imgEl.parentElement;
  contenedor.outerHTML = `<div class="curso-thumb ${clase}">${icono}</div>`;
}