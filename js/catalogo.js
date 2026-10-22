import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
  const contenedor = document.getElementById('listaCursos');
  const mensajeEstado = document.getElementById('estadoCarga');
  const formBuscar = document.getElementById('formBuscarCursos');
  const inputBuscar = document.getElementById('inputBuscarCursos');
  const categoriaFiltro = document.getElementById('categoriaFiltro');
  const ordenCursos = document.getElementById('ordenCursos');
  const btnLimpiarFiltros = document.getElementById('btnLimpiarFiltros'); 
  const plantilla = document.getElementById('plantillaTarjetaCurso');
  const contadorCursos = document.getElementById('contadorCursos');

  const contenedorPaginacion = document.getElementById('contenedorPaginacion');
  const listaPaginacion = document.getElementById('listaPaginacion');

  let todosLosCursos = [];
  let paginaActual = 1;
  const cursosPorPagina = 6;
  
  let rolUsuario = "estudiante";

  detectarRolEIniciar();

  function detectarRolEIniciar() {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "usuarios", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const datos = docSnap.data();
            rolUsuario = (datos.tipoUsuario || datos.rol || "estudiante").toLowerCase().trim();
          }
        } catch (error) {
          console.error("Error al obtener rol del usuario:", error);
        }
      } else {
        rolUsuario = "estudiante";
      }

      cargarCategoriasYCursos();
    });
  }

  formBuscar.addEventListener('submit', (event) => {
    event.preventDefault();
    paginaActual = 1;
    actualizarCatalogo();
  });

  inputBuscar.addEventListener("input", () => {
    paginaActual = 1;
    actualizarCatalogo();
  });

  categoriaFiltro.addEventListener("change", () => {
    paginaActual = 1;
    actualizarCatalogo();
  });

  ordenCursos.addEventListener("change", () => {
    paginaActual = 1;
    actualizarCatalogo();
  });

  btnLimpiarFiltros.addEventListener('click', () => {
    formBuscar.reset();
    paginaActual = 1;
    actualizarCatalogo();
    inputBuscar.focus();
  });

  async function cargarCategoriasYCursos() {
    try {
      mostrarMensaje('Cargando catálogo...');

      const resultadoCursos = await getDocs(collection(db, 'cursoscc'));
      todosLosCursos = resultadoCursos.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }));

      await cargarCategoriasDesdeBD();

      actualizarCatalogo();
    } catch (error) {
      console.error("Error al cargar datos desde Firebase:", error);
      contenedor.replaceChildren();
      actualizarContador(0);
      mostrarMensaje("Ocurrió un error al cargar los cursos. Intenta nuevamente.");
    }   
  }

  async function cargarCategoriasDesdeBD() {
    try {
      const snapshot = await getDocs(collection(db, 'categorias'));

      categoriaFiltro.innerHTML = '<option value="">Todas las categorías</option>';

      if (!snapshot.empty) {
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          const nombre = data.nombre || data.titulo || doc.id;
          const valor = data.slug || normalizarTexto(nombre).replace(/\s+/g, '-');

          const option = document.createElement('option');
          option.value = valor;
          option.textContent = nombre;
          categoriaFiltro.appendChild(option);
        });
      } else {
        extraerCategoriasDeCursos();
      }
    } catch (e) {
      console.warn("No se pudo leer la colección 'categorias', extrayendo de los cursos...", e);
      extraerCategoriasDeCursos();
    }
  }

  function extraerCategoriasDeCursos() {
    const categoriasUnicas = new Set();
    
    todosLosCursos.forEach(curso => {
      const cat = curso.categoria || curso.categorias;
      if (Array.isArray(cat)) {
        cat.forEach(c => c && categoriasUnicas.add(c.trim()));
      } else if (typeof cat === 'string' && cat.trim()) {
        categoriasUnicas.add(cat.trim());
      }
    });

    categoriasUnicas.forEach(cat => {
      const option = document.createElement('option');
      option.value = normalizarTexto(cat).replace(/\s+/g, '-');
      option.textContent = cat;
      categoriaFiltro.appendChild(option);
    });
  }
    
  function actualizarCatalogo() {
    const texto = normalizarTexto(inputBuscar.value.trim());
    const categoriaSeleccionada = categoriaFiltro.value;
    const ordenSeleccionado = ordenCursos.value;
    
    let cursosFiltrados = todosLosCursos.filter(curso => {
      const esActivo = curso.activo !== false && curso.estado !== "inactivo";
      if (!esActivo) return false;

      const titulo = normalizarTexto(curso.titulo ?? "");
      const descripcion = normalizarTexto(curso.descripcion ?? "");
      const coincideTexto = titulo.includes(texto) || descripcion.includes(texto);
      
      let categoriasDelCurso = [];
      const catField = curso.categoria || curso.categorias;
      if (Array.isArray(catField)) {
        categoriasDelCurso = catField.map(c => normalizarTexto(c).replace(/\s+/g, '-'));
      } else if (typeof catField === 'string' && catField.trim()) {
        categoriasDelCurso = [normalizarTexto(catField).replace(/\s+/g, '-')];
      }

      const coincideCategoria = !categoriaSeleccionada || 
                                 categoriaSeleccionada === "todas" || 
                                 categoriasDelCurso.includes(categoriaSeleccionada);

      return coincideTexto && coincideCategoria;
    });

    cursosFiltrados = ordenarCursos(cursosFiltrados, ordenSeleccionado);

    actualizarContador(cursosFiltrados.length);

    if (cursosFiltrados.length === 0) {
      contenedor.replaceChildren();
      mostrarMensaje('No se encontraron cursos que coincidan con la búsqueda.');
      contenedorPaginacion.classList.add('d-none');
      return;
    }
    
    ocultarMensaje();

    const totalPaginas = Math.ceil(cursosFiltrados.length / cursosPorPagina);
    if (paginaActual > totalPaginas) paginaActual = totalPaginas;

    const inicio = (paginaActual - 1) * cursosPorPagina;
    const fin = inicio + cursosPorPagina;
    const cursosPaginaActual = cursosFiltrados.slice(inicio, fin);

    mostrarCursos(cursosPaginaActual);
    renderizarPaginacion(totalPaginas);
  }

  function actualizarContador(total) {
    if (!contadorCursos) return;
    contadorCursos.textContent = `${total} ${total === 1 ? 'curso' : 'cursos'}`;
  }

  function renderizarPaginacion(totalPaginas) {
    if (totalPaginas <= 1) {
      contenedorPaginacion.classList.add('d-none');
      return;
    }

    contenedorPaginacion.classList.remove('d-none');
    listaPaginacion.replaceChildren();

    const liAnterior = document.createElement('li');
    liAnterior.className = `page-item ${paginaActual === 1 ? 'disabled' : ''}`;
    liAnterior.innerHTML = `<button class="page-link" aria-label="Anterior">&laquo;</button>`;
    liAnterior.addEventListener('click', () => {
      if (paginaActual > 1) {
        paginaActual--;
        actualizarCatalogo();
        desplazarHaciaArriba();
      }
    });
    listaPaginacion.appendChild(liAnterior);

    for (let i = 1; i <= totalPaginas; i++) {
      const li = document.createElement('li');
      li.className = `page-item ${i === paginaActual ? 'active' : ''}`;
      li.innerHTML = `<button class="page-link">${i}</button>`;
      li.addEventListener('click', () => {
        paginaActual = i;
        actualizarCatalogo();
        desplazarHaciaArriba();
      });
      listaPaginacion.appendChild(li);
    }

    const liSiguiente = document.createElement('li');
    liSiguiente.className = `page-item ${paginaActual === totalPaginas ? 'disabled' : ''}`;
    liSiguiente.innerHTML = `<button class="page-link" aria-label="Siguiente">&raquo;</button>`;
    liSiguiente.addEventListener('click', () => {
      if (paginaActual < totalPaginas) {
        paginaActual++;
        actualizarCatalogo();
        desplazarHaciaArriba();
      }
    });
    listaPaginacion.appendChild(liSiguiente);
  }

  function desplazarHaciaArriba() {
    document.getElementById('tituloCursosDisponibles').scrollIntoView({ behavior: 'smooth' });
  }

  function ordenarCursos(cursos, orden) {
    const cursosOrdenados = [...cursos];
    switch (orden) {
      case "precio-menor":
        return cursosOrdenados.sort((a, b) => Number(a.precio) - Number(b.precio));
      case "precio-mayor":
        return cursosOrdenados.sort((a, b) => Number(b.precio) - Number(a.precio));
      case "nombre-az":
        return cursosOrdenados.sort((a, b) => (a.titulo ?? "").localeCompare(b.titulo ?? "", "es"));
      case "nombre-za":
        return cursosOrdenados.sort((a, b) => (b.titulo ?? "").localeCompare(a.titulo ?? "", "es"));
      case "cupos-mayor":
        return cursosOrdenados.sort((a, b) => Number(b.cupos_disponibles) - Number(a.cupos_disponibles));
      default:
        return cursosOrdenados;
    }
  }

  function mostrarCursos(cursos) {
    const fragmento = document.createDocumentFragment();
    cursos.forEach((curso) => fragmento.appendChild(crearTarjetaCurso(curso)));
    contenedor.replaceChildren(fragmento);
  }

  function crearTarjetaCurso(curso) {
    const categoriaVisual = obtenerCategoriaVisual(curso);
    const precioFormateado = Number(curso.precio).toLocaleString('es-UY', {
      style: 'currency',
      currency: 'UYU'
    });

    const tarjeta = plantilla.content.cloneNode(true);

    const thumbImg = tarjeta.querySelector('.js-thumb-img');
    const thumbIcono = tarjeta.querySelector('.js-thumb-icono');

    function mostrarIcono() {
      thumbImg.classList.add('d-none');
      thumbIcono.classList.remove('d-none');
      thumbIcono.classList.add(categoriaVisual.claseCategoria);
      thumbIcono.textContent = categoriaVisual.icono;
    }

    const rutaImagen = curso.URL_imagen ?? curso.imagen_url;

    if (rutaImagen) {
      thumbImg.src = rutaImagen;
      thumbImg.alt = curso.titulo ?? 'Curso';
      thumbImg.addEventListener('error', mostrarIcono, { once: true });
    } else {
      mostrarIcono();
    }

    const categoriaEl = tarjeta.querySelector('.js-categoria');
    if (categoriaEl) {
      categoriaEl.textContent = Array.isArray(curso.categoria) ? curso.categoria.join(', ') : (curso.categoria ?? 'Sin categoría');
    }

    tarjeta.querySelector('.js-titulo').textContent = curso.titulo ?? 'Sin título';
    tarjeta.querySelector('.js-descripcion').textContent = curso.descripcion ?? '';
    tarjeta.querySelector('.js-precio').textContent = precioFormateado;
    tarjeta.querySelector('.js-cupos').textContent = curso.cupos_disponibles ?? 0;
    
    const btnVerMas = tarjeta.querySelector('.js-ver-curso');
    
    if (rolUsuario.includes("admin") || rolUsuario.includes("docente")) {
      btnVerMas.href = `contenidoCurso.html?id=${curso.id}`;
    } else {
      btnVerMas.href = `descripcionDeCurso.html?id=${curso.id}`;
    }

    return tarjeta;
  }

  function obtenerCategoriaVisual(curso) {
    const catStr = normalizarTexto(curso.categoria ?? "");
    if (catStr.includes('web')) return { claseCategoria: 'categoria-web', icono: '🌐' };
    if (catStr.includes('inteligencia') || catStr.includes('ia')) return { claseCategoria: 'categoria-ia', icono: '🤖' };
    if (catStr.includes('base') || catStr.includes('datos')) return { claseCategoria: 'categoria-datos', icono: '🗄️' };
    if (catStr.includes('ofim') || catStr.includes('excel')) return { claseCategoria: 'categoria-ofimatica', icono: '📊' };
    if (catStr.includes('hardware') || catStr.includes('robotica')) return { claseCategoria: 'categoria-hardware', icono: '🔌' };
    
    return { claseCategoria: 'categoria-programacion', icono: '💻' };
  }

  function normalizarTexto(texto) {
    if (!texto) return "";
    return texto.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function mostrarMensaje(texto) {
    mensajeEstado.textContent = texto;
    mensajeEstado.classList.remove('d-none');
  }

  function ocultarMensaje() {
    mensajeEstado.classList.add('d-none');
  }
});