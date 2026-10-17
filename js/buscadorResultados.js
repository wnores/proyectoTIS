import { db } from "./firebase-config.js";
import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {

    const contenedor = document.getElementById('resultadosBusqueda');
    const textoBusqueda = document.getElementById('textoBusqueda');
    const sinResultados = document.getElementById('sinResultados');

    const parametros = new URLSearchParams(window.location.search);
    const texto = parametros.get('buscar');

    if (!texto) {
        textoBusqueda.textContent =
            'No se ingresó ningún término de búsqueda.';
        return;
    }

    const busqueda = normalizarTexto(texto);

    textoBusqueda.textContent =
        `Resultados para: "${texto}"`;

    const paginas = [
        {
            titulo: 'Inicio',
            descripcion:
                'Página principal de Cursos de Ciencias de la Computación',
            palabras:
                'inicio cursos aprendizaje tecnologia',
            url: 'index.html'
        },
        {
            titulo: 'Acerca de',
            descripcion:
                'Conocé más sobre nuestra propuesta educativa',
            palabras:
                'acerca propuesta nosotros informacion',
            url: 'acercaDe.html'
        },
        {
            titulo: 'Becas',
            descripcion:
                'Información sobre becas y oportunidades para acceder a los cursos',
            palabras:
                'beca becas ayuda oportunidades beneficio',
            url: 'beca.html'
        },
        {
            titulo: 'Contacto',
            descripcion:
                'Encontrá nuestros medios de contacto.',
            palabras:
                'contacto comunicacion consultar mensaje',
            url: 'contacto.html'
        },
        {
            titulo: 'Catálogo de cursos',
            descripcion:
                'Explorá todos los cursos disponibles',
            palabras:
                'catalogo cursos programacion informatica tecnologia',
            url: 'catalogo.html'
        }
    ];

    let resultados = paginas.filter(pagina => {

        const contenidoPagina = normalizarTexto(`
            ${pagina.titulo}
            ${pagina.descripcion}
            ${pagina.palabras}
        `);

        return contenidoPagina.includes(busqueda);
    });

    try {

        const referenciaCursos = collection(db, 'cursoscc');

        const snapshot = await getDocs(referenciaCursos);

        const cursos = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        const cursosActivos = cursos.filter(curso => {

            return (
                curso.activo !== false &&
                curso.estado !== 'inactivo'
            );

        });

        const cursosEncontrados = cursosActivos.filter(curso => {

            const contenidoCurso = normalizarTexto(`
                ${curso.titulo ?? ''}
                ${curso.descripcion ?? ''}
                ${curso.categoria ?? ''}
                ${curso.modalidad ?? ''}
                ${curso.duracion_horas ?? ''}
            `);

            return contenidoCurso.includes(busqueda);
        });

        cursosEncontrados.forEach(curso => {

            resultados.push({
                titulo:
                    curso.titulo ??
                    'Curso sin título',

                descripcion:
                    curso.descripcion ??
                    'Curso disponible en nuestro catálogo.',

                palabras: 'curso',

                url:
                    `descripcionDeCurso.html?id=${curso.id}`
            });

        });

    } catch (error) {

        console.error(
            'Error al cargar los cursos desde Firestore:',
            error
        );

    }

    if (resultados.length === 0) {

        sinResultados.classList.remove('d-none');
        return;

    }

    resultados.forEach(resultado => {

        const tarjeta = document.createElement('div');

        tarjeta.className =
            'col-12 col-md-6 col-lg-4';

        tarjeta.innerHTML = `
            <div class="card h-100 shadow-sm">

                <div class="card-body d-flex flex-column">

                    <h2 class="h5 card-title">
                        ${resultado.titulo}
                    </h2>

                    <p class="card-text flex-grow-1">
                        ${resultado.descripcion}
                    </p>

                    <a
                        href="${resultado.url}"
                        class="btn btn-primary mt-auto">
                        Ver resultado
                    </a>

                </div>

            </div>
        `;

        contenedor.appendChild(tarjeta);

    });

    function normalizarTexto(texto) {

        return texto
            .toString()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');

    }

});