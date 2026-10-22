import { db } from "./firebase-config.js";
import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {

    const contenedor = document.getElementById('resultadosBusqueda');
    const textoBusqueda = document.getElementById('textoBusqueda');
    const sinResultados = document.getElementById('sinResultados');
    const parrafoSinResultados = document.getElementById('parrafoSinResultados');

    const parametros = new URLSearchParams(window.location.search);
    const texto = parametros.get('buscar');

    if (!texto || !texto.trim()) {
        if (textoBusqueda) {
            textoBusqueda.textContent = '';
        }
        if (parrafoSinResultados) {
            parrafoSinResultados.textContent = 'No ingresaste ningún término de búsqueda.';
        }
        if (sinResultados) {
            sinResultados.classList.remove('d-none');
        }
        return;
    }

    const busqueda = normalizarTexto(texto.trim());

    if (textoBusqueda) {
        textoBusqueda.textContent = `Resultados para: "${texto}"`;
    }

    let resultados = [];

    try {
        const referenciaCursos = collection(db, 'cursoscc');
        const snapshot = await getDocs(referenciaCursos);

        const cursos = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        const cursosEncontrados = cursos.filter(curso => {
            const esActivo = curso.activo !== false && curso.estado !== 'inactivo';
            if (!esActivo) return false;

            const titulo = curso.titulo || curso.nombre || '';
            const descripcion = curso.descripcion || '';
            
            let categoria = '';
            if (Array.isArray(curso.categoria)) {
                categoria = curso.categoria.join(' ');
            } else if (Array.isArray(curso.categorias)) {
                categoria = curso.categorias.join(' ');
            } else {
                categoria = curso.categoria || curso.categorias || '';
            }

            const modalidad = curso.modalidad || '';
            const duracion = curso.duracion_horas || curso.duracion || '';

            const contenidoCurso = normalizarTexto(`
                ${titulo}
                ${descripcion}
                ${categoria}
                ${modalidad}
                ${duracion}
            `);

            return contenidoCurso.includes(busqueda);
        });

        cursosEncontrados.forEach(curso => {
            resultados.push({
                titulo: curso.titulo || curso.nombre || 'Curso sin título',
                descripcion: curso.descripcion || 'Curso disponible en nuestro catálogo.',
                url: `descripcionDeCurso.html?id=${curso.id}`
            });
        });

    } catch (error) {
        console.error('Error al cargar los cursos desde Firestore:', error);
    }

    if (resultados.length === 0) {
        if (contenedor) contenedor.innerHTML = '';
        if (parrafoSinResultados) {
            parrafoSinResultados.textContent = 'Probá con otras palabras o revisá la búsqueda.';
        }
        if (sinResultados) sinResultados.classList.remove('d-none');
        return;
    }

    if (sinResultados) {
        sinResultados.classList.add('d-none');
    }

    if (contenedor) {
        contenedor.innerHTML = '';
        resultados.forEach(resultado => {
            const tarjeta = document.createElement('div');
            tarjeta.className = 'col-12 col-md-6 col-lg-4';
            tarjeta.innerHTML = `
                <div class="card h-100 shadow-sm">
                    <div class="card-body d-flex flex-column">
                        <h2 class="h5 card-title">
                            ${resultado.titulo}
                        </h2>
                        <p class="card-text flex-grow-1 text-secondary">
                            ${resultado.descripcion}
                        </p>
                        <a href="${resultado.url}" class="btn btn-primary mt-auto">
                            Ver curso
                        </a>
                    </div>
                </div>
            `;
            contenedor.appendChild(tarjeta);
        });
    }

    function normalizarTexto(texto) {
        if (!texto) return '';
        return texto
            .toString()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

});