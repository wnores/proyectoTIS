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
      const respuesta = await fetch(`${API_BASE_URL}/cursos/${id}`);

      if (respuesta.status === 404) {
        mostrarError('El curso que buscás no existe.');
        return;
      }
      if (!respuesta.ok) {
        throw new Error('No se pudo obtener el curso.');
      }

      const curso = await respuesta.json();
      mostrarCurso(curso);
    } catch (error) {
      console.error('Error al cargar el curso:', error);
      mostrarError('Ocurrió un error al cargar el curso. Intentá nuevamente más tarde.');
    }
  }

  function mostrarCurso(curso) {
    const imagen = curso.imagen_url || 'recursos/img/curso-default.jpg';
    const precioFormateado = Number(curso.precio).toLocaleString('es-UY', {
      style: 'currency',
      currency: 'UYU'
    });

    document.title = `${curso.titulo} | Detalle de curso`;
    mensajeEstado.classList.add('d-none');

    contenedor.innerHTML = `
      <div class="row">
        <div class="col-12 col-md-6">
          <img src="${imagen}" alt="${curso.titulo}" class="img-fluid rounded shadow-sm">
        </div>
        <div class="col-12 col-md-6">
          <h1>${curso.titulo}</h1>
          <p class="lead">${curso.descripcion ?? ''}</p>
          <ul class="list-unstyled">
            <li><strong>Precio:</strong> ${precioFormateado}</li>
            <li><strong>Duración:</strong> ${curso.duracion_horas ?? '-'} horas</li>
            <li><strong>Cupos disponibles:</strong> ${curso.cupos_disponibles}</li>
          </ul>
          <div class="d-flex gap-2 mt-3">
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
});
