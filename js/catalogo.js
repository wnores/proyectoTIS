// js/catalogo.js
// Trae los cursos desde cursos.json y arma las tarjetas de catalogo.html

document.addEventListener('DOMContentLoaded', () => {
  const contenedor = document.getElementById('listaCursos');
  const mensajeEstado = document.getElementById('estadoCarga');
  const formBuscar = document.getElementById('formBuscarCursos');
  const inputBuscar = document.getElementById('inputBuscarCursos');

  let todosLosCursos = [];

  cargarCursos();

  if (formBuscar) {
    formBuscar.addEventListener('submit', (e) => {
      e.preventDefault();
      filtrarCursos();
    });
  }

  if (inputBuscar) {
    inputBuscar.addEventListener('input', filtrarCursos);
  }

  async function cargarCursos() {
    try {
      const respuesta = await fetch('cursos.json');

      if (!respuesta.ok) {
        throw new Error('No se pudo obtener el catálogo de cursos.');
      }

      const cursos = await respuesta.json();
      todosLosCursos = cursos;

      if (cursos.length === 0) {
        mensajeEstado.textContent = 'Todavía no hay cursos cargados.';
        return;
      }

      mensajeEstado.classList.add('d-none');
      mostrarCursos(cursos);
    } catch (error) {
      console.error('Error al cargar cursos:', error);
      mensajeEstado.textContent = 'Ocurrió un error al cargar los cursos. Intentá nuevamente más tarde.';
      mensajeEstado.classList.remove('d-none');
    }
  }

  function mostrarCursos(cursos) {
    contenedor.innerHTML = cursos.map(crearTarjetaCurso).join('');
  }

  function filtrarCursos() {
    const texto = inputBuscar.value.trim().toLowerCase();
    const filtrados = todosLosCursos.filter(curso =>
      curso.titulo.toLowerCase().includes(texto) ||
      (curso.descripcion ?? '').toLowerCase().includes(texto)
    );

    if (filtrados.length === 0) {
      contenedor.innerHTML = '';
      mensajeEstado.textContent = 'No se encontraron cursos que coincidan con la búsqueda.';
      mensajeEstado.classList.remove('d-none');
    } else {
      mensajeEstado.classList.add('d-none');
      mostrarCursos(filtrados);
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
          ${crearThumb(curso, claseCategoria, icono)}
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