
// js/catalogo.js
// Trae los cursos desde cursos.json y arma las tarjetas de catalogo.html
// clonando la plantilla <template id="plantillaTarjetaCurso"> del HTML.

document.addEventListener('DOMContentLoaded', () => {
  const contenedor = document.getElementById('listaCursos');
  const mensajeEstado = document.getElementById('estadoCarga');
  const formBuscar = document.getElementById('formBuscarCursos');
  const inputBuscar = document.getElementById('inputBuscarCursos');
  const plantilla = document.getElementById('plantillaTarjetaCurso');

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
      const respuesta = await fetch('js/data/cursos.json');

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
    const fragmento = document.createDocumentFragment();
    cursos.forEach((curso) => fragmento.appendChild(crearTarjetaCurso(curso)));
    contenedor.replaceChildren(fragmento);
  }

  function filtrarCursos() {
    const texto = inputBuscar.value.trim().toLowerCase();
    const filtrados = todosLosCursos.filter((curso) =>
      curso.titulo.toLowerCase().includes(texto) ||
      (curso.descripcion ?? '').toLowerCase().includes(texto)
    );

    if (filtrados.length === 0) {
      contenedor.replaceChildren();
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

    const tarjeta = plantilla.content.cloneNode(true);

    const thumbContainer = tarjeta.querySelector('.js-thumb-container');
    const thumbImg = tarjeta.querySelector('.js-thumb-img');
    const thumbIcono = tarjeta.querySelector('.js-thumb-icono');

    function mostrarIcono() {
      thumbContainer.classList.add('d-none');
      thumbIcono.classList.remove('d-none');
      thumbIcono.classList.add(claseCategoria);
      thumbIcono.textContent = icono;
    }

    if (curso.imagen_url) {
      thumbImg.src = curso.imagen_url;
      thumbImg.alt = curso.titulo;
      thumbImg.addEventListener('error', mostrarIcono, { once: true });
    } else {
      mostrarIcono();
    }

    tarjeta.querySelector('.js-titulo').textContent = curso.titulo;
    tarjeta.querySelector('.js-descripcion').textContent = curso.descripcion ?? '';
    tarjeta.querySelector('.js-precio').textContent = precioFormateado;
    tarjeta.querySelector('.js-cupos').textContent = curso.cupos_disponibles;

    const btnVerMas = tarjeta.querySelector('.js-ver-mas');
    btnVerMas.href = `descripcionDeCurso.html?id=${curso.id}`;

    return tarjeta;
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
});