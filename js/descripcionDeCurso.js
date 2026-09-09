
// js/descripcionDeCurso.js
// Lee el "id" del curso desde la URL (?id=3) y muestra sus datos
// clonando la plantilla <template id="plantillaDetalleCurso"> del HTML.

document.addEventListener('DOMContentLoaded', () => {
  const contenedor = document.getElementById('detalleCurso');
  const mensajeEstado = document.getElementById('estadoCarga');
  const plantilla = document.getElementById('plantillaDetalleCurso');

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
      const curso = cursos.find((item) => item.id == id);

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

    const detalle = plantilla.content.cloneNode(true);

    const thumbContainer = detalle.querySelector('.js-thumb-container');
    const thumbImg = detalle.querySelector('.js-thumb-img');
    const thumbIcono = detalle.querySelector('.js-thumb-icono');

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

    detalle.querySelector('.js-titulo').textContent = curso.titulo;
    detalle.querySelector('.js-descripcion').textContent = curso.descripcion ?? '';
    detalle.querySelector('.js-precio').textContent = precioFormateado;
    detalle.querySelector('.js-duracion').textContent = curso.duracion_horas ?? '-';
    detalle.querySelector('.js-cupos').textContent = curso.cupos_disponibles;
    detalle.querySelector('.js-beca').href = `beca.html?curso=${curso.id}`;

    contenedor.replaceChildren(detalle);
  }

  function mostrarError(texto) {
    mensajeEstado.textContent = texto;
    mensajeEstado.classList.remove('d-none');
    contenedor.replaceChildren();
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
