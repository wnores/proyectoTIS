// js/catalogo.js
// Trae los cursos desde el backend y arma las tarjetas de catalogo.html

document.addEventListener('DOMContentLoaded', () => {
  const contenedor = document.getElementById('listaCursos');
  const mensajeEstado = document.getElementById('estadoCarga');

  cargarCursos();

  async function cargarCursos() {
    try {
      const respuesta = await fetch(`${API_BASE_URL}/cursos`);

      if (!respuesta.ok) {
        throw new Error('No se pudo obtener el catálogo de cursos.');
      }

      const cursos = await respuesta.json();

      if (cursos.length === 0) {
        mensajeEstado.textContent = 'Todavía no hay cursos cargados.';
        return;
      }

      mensajeEstado.classList.add('d-none');
      contenedor.innerHTML = cursos.map(crearTarjetaCurso).join('');
    } catch (error) {
      console.error('Error al cargar cursos:', error);
      mensajeEstado.textContent = 'Ocurrió un error al cargar los cursos. Intentá nuevamente más tarde.';
      mensajeEstado.classList.remove('d-none');
    }
  }

  function crearTarjetaCurso(curso) {
    const { claseCategoria, icono } = obtenerCategoria(curso.titulo);
    const precioFormateado = Number(curso.precio).toLocaleString('es-UY', {
      style: 'currency',
      currency: 'UYU'
    });

    return `
      <div class="col-12 col-md-6 col-lg-4 mb-4">
        <div class="card h-100">
          <div class="curso-thumb ${claseCategoria}">${icono}</div>
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">${curso.titulo}</h5>
            <p class="card-text flex-grow-1">${curso.descripcion ?? ''}</p>
            <p class="card-text precio-curso">${precioFormateado}</p>
            <p class="card-text"><small class="text-muted">${curso.cupos_disponibles} cupos disponibles</small></p>
            <a href="descripcionDeCurso.html?id=${curso.id}" class="btn btn-primary mt-auto">Ver más</a>
          </div>
        </div>
      </div>
    `;
  }

  // Elige un color/ícono de categoría según palabras clave del título.
  // Es un recurso visual temporal, hasta tener fotos reales de cada curso.
  function obtenerCategoria(titulo) {
    const tituloLower = titulo.toLowerCase();

    if (tituloLower.includes('inteligencia artificial') || tituloLower.includes('machine learning') || tituloLower.includes(' ia')) {
      return { claseCategoria: 'categoria-ia', icono: '🤖' };
    }
    if (tituloLower.includes('base de datos') || tituloLower.includes('mysql') || tituloLower.includes('datos')) {
      return { claseCategoria: 'categoria-datos', icono: '🗄️' };
    }
    return { claseCategoria: 'categoria-programacion', icono: '💻' };
  }
});