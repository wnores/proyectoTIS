
// js/catalogo.js
// Trae los cursos desde cursos.json y arma las tarjetas de catalogo.html
// clonando la plantilla <template id="plantillaTarjetaCurso"> del HTML.

import { db } from "./firebase-config.js";

import { collection, getDocs } 
from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
document.addEventListener('DOMContentLoaded', () => {
  const contenedor = document.getElementById('listaCursos');
  const mensajeEstado = document.getElementById('estadoCarga');
  const formBuscar = document.getElementById('formBuscarCursos');
  const inputBuscar = document.getElementById('inputBuscarCursos');
  const categoriaFiltro = document.getElementById('categoriaFiltro');
  const ordenCursos = document.getElementById('ordenCursos');
  const btnLimpiarFiltros = document.getElementById('btnLimpiarFiltros'); 
  const plantilla = document.getElementById('plantillaTarjetaCurso');

  let todosLosCursos = [];

  cargarCursos();

  formBuscar.addEventListener('submit', (event) => {
    event.preventDefault();
    actualizarCatalogo();
  });

  inputBuscar.addEventListener(
    "input",
    actualizarCatalogo
  );
  categoriaFiltro.addEventListener(
  "change",
  actualizarCatalogo
  );
  
  ordenCursos.addEventListener(
    "change",
    actualizarCatalogo
  );

  btnLimpiarFiltros.addEventListener('click', () => {
    formBuscar.reset();
    actualizarCatalogo();
    inputBuscar.focus();
  });

  async function cargarCursos() {
    try {
      mostrarMensaje('Cargando cursos...');

      //cursos en JSON
      const respuesta = await fetch("js/data/cursos.json");
      if (!respuesta.ok) {
      throw new Error("No se pudo cargar cursos.json");
      }
      const cursosDelArray = await respuesta.json();
      todosLosCursos = [...cursosDelArray];

      actualizarCatalogo();

      const resultado = await getDocs(collection(db, 'cursos'));

      const cursosDeFirestore = resultado.docs.map(documento => ({ ...documento.data(), id: documento.id}));

      //unir cursos
      todosLosCursos=[...cursosDelArray, ...cursosDeFirestore];

      actualizarCatalogo();

      console.log("Cursos cargados:", todosLosCursos);
    }catch (error){
      console.error ("Error al cargar cursos:", error);
      contenedor.replaceChildren();

      mostrarMensaje ("Ocurrió un error al cargar los cursos. Intenta nuevamente.");
    }  
  }
   
  function actualizarCatalogo() {
    const texto = normalizarTexto(inputBuscar.value.trim());
    const categoriaSeleccionada = categoriaFiltro.value;
    const ordenSeleccionado = ordenCursos.value;
    
    let cursosFiltrados = todosLosCursos.filter(curso => {
      const titulo = normalizarTexto(curso.titulo ?? "");
      const descripcion = normalizarTexto(curso.descripcion ?? "");
      const coincideTexto = titulo.includes(texto) || descripcion.includes(texto);
      const categoriaCurso = obtenerCategoria(curso);
      const coincideCategoria = !categoriaSeleccionada ||
      categoriaCurso === categoriaSeleccionada;

      return coincideTexto && coincideCategoria;
    });

    cursosFiltrados = ordenarCursos(cursosFiltrados, ordenSeleccionado);

    if (cursosFiltrados.length === 0) {
      contenedor.replaceChildren();
      mostrarMensaje('No se encontraron cursos que coincidan con la búsqueda.');
      return;
    }
    mostrarCursos(cursosFiltrados);
    const cantidad = cursosFiltrados.length;
    mostrarMensaje(`Se encontraron ${cantidad} curso${cantidad > 1 ? 's' : ''}.`);
    }

    function ordenarCursos(cursos, orden) {
      const cursosOrdenados = [...cursos];
      switch (orden) {
        case "precio-menor":
          cursosOrdenados.sort((a, b) => Number(a.precio) - Number(b.precio));
          break;
        case "precio-mayor":
          cursosOrdenados.sort((a, b) => Number(b.precio) - Number(a.precio));
          break;
        case "nombre-az":
          cursosOrdenados.sort((a, b) => (a.titulo ??"").localeCompare(b.titulo ??"","es"));
          break;
        case "nombre-za":
          cursosOrdenados.sort((a, b) => (b.titulo ??"").localeCompare(a.titulo ??"","es"));
          break;
        case "cupos-mayor":
          cursosOrdenados.sort((a, b) => Number(b.cupos_disponibles) - Number(a.cupos_disponibles));
          break;    
      }
      return cursosOrdenados;
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

    const thumbContainer = tarjeta.querySelector('.js-thumb-container');
    const thumbImg = tarjeta.querySelector('.js-thumb-img');
    const thumbIcono = tarjeta.querySelector('.js-thumb-icono');

    function mostrarIcono() {
      thumbContainer.classList.add('d-none');
      thumbIcono.classList.remove('d-none');
      thumbIcono.classList.add(categoriaVisual.claseCategoria);
      thumbIcono.textContent = categoriaVisual.icono;
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

  function obtenerCategoria(curso) {
    const categoria = normalizarTexto(curso.categoria ??"");
    const titulo = normalizarTexto(curso.titulo ??"");

    if (categoria.includes('desarrollo web')||titulo.includes('desarrollo web')){ return "desarrollo-web";
    }
    if (categoria.includes('inteligencia artificial')||titulo.includes("inteligencia artificial")||titulo.includes("machine learning")){ return "inteligencia-artificial";
    }
    if (categoria.includes('base de datos')||titulo.includes("base de datos")||titulo.includes('mysql')){ return "base-datos";
    }
    if (categoria.includes('ofimatica')||titulo.includes('excel')||titulo.includes('word')){ return "ofimatica";
    }
    if (categoria.includes('hardware')||titulo.includes('electronica')||titulo.includes('micro:bit')||titulo.includes('scratch')){ return "hardware-electronica";
    }
    return "programacion";
  }

  function obtenerCategoriaVisual(curso) {
    const categoria = obtenerCategoria(curso);
    const configuraciones = {
      "programacion": { claseCategoria: 'categoria-programacion', icono: '💻' },
      "desarrollo-web": { claseCategoria: 'categoria-web', icono: '🌐' },
      "inteligencia-artificial": { claseCategoria: 'categoria-ia', icono: '🤖' },
      "base-datos": { claseCategoria: 'categoria-datos', icono: '🗄️' },
      "ofimatica": { claseCategoria: 'categoria-ofimatica', icono: '📊' },
      "hardware-electronica": { claseCategoria: 'categoria-hardware', icono: '🔌' }
    };
    return configuraciones[categoria];
  }
  function normalizarTexto(texto){
    return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }
  function mostrarMensaje(texto) {
    mensajeEstado.textContent = texto;
    mensajeEstado.classList.remove('d-none');
  }
});

