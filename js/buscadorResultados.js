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

    textoBusqueda.textContent = `Resultados para: "${texto}"`;

    /*
     * PÁGINAS FIJAS DEL SITIO
     * Estas páginas no dependen de Firestore.
     */
    const paginas = [
        {
            titulo: 'Inicio',
            descripcion:
                'Página principal de Cursos de Ciencias de la Computación.',
            palabras:
                'inicio cursos aprendizaje tecnologia educacion',
            url: 'index.html'
        },
        {
            titulo: 'Acerca de',
            descripcion:
                'Conocé más sobre nuestra propuesta educativa.',
            palabras:
                'acerca propuesta nosotros informacion quienes somos',
            url: 'acercaDe.html'
        },
        {
            titulo: 'Becas',
            descripcion:
                'Información sobre becas y oportunidades para acceder a los cursos.',
            palabras:
                'beca becas ayuda oportunidades beneficio acceso rendimiento inclusion',
            url: 'beca.html'
        },
        {
            titulo: 'Contacto',
            descripcion:
                'Encontrá nuestros medios de contacto.',
            palabras:
                'contacto comunicacion consultar mensaje consulta',
            url: 'contacto.html'
        },
        {
            titulo: 'Catálogo de cursos',
            descripcion:
                'Explorá todos los cursos disponibles.',
            palabras:
                'catalogo cursos programacion informatica tecnologia aprendizaje',
            url: 'catalogo.html'
        }
    ];

    /*
     * BUSCAR EN LAS PÁGINAS FIJAS
     */
    let resultados = paginas.filter(pagina => {

        const contenido = normalizarTexto(`
            ${pagina.titulo}
            ${pagina.descripcion}
            ${pagina.palabras}
        `);

        return contenido.includes(busqueda);
    });

    /*
     * BUSCAR CURSOS DIRECTAMENTE EN FIRESTORE
     *
     * Ya no se utiliza cursos.json.
     * De esta manera, cualquier modificación realizada
     * en la colección "cursos" se refleja automáticamente.
     */
    try {

        const snapshot = await getDocs(
            collection(db, 'cursos')
        );

        const cursos = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        /*
         * Solo se muestran cursos activos.
         * Se utiliza el mismo criterio que en catalogo.js.
         */
        const cursosActivos = cursos.filter(curso => {

            return (
                curso.activo !== false &&
                curso.estado !== 'inactivo'
            );
        });

        /*
         * Buscar en los datos actuales del curso.
         *
         * Se incluyen los campos principales utilizados
         * actualmente por la plataforma.
         */
        const cursosEncontrados = cursosActivos.filter(curso => {

            const contenidoCurso = normalizarTexto(`
                ${curso.titulo ?? ''}
                ${curso.descripcion ?? ''}
                ${curso.categoria ?? ''}
                ${curso.modalidad ?? ''}
                ${curso.duracion_horas ?? ''}
                ${curso.cupos_disponibles ?? ''}
            `);

            return contenidoCurso.includes(busqueda);
        });

        /*
         * Agregar los cursos encontrados a los resultados.
         */
        cursosEncontrados.forEach(curso => {

            resultados.push({
                titulo: curso.titulo ?? 'Curso sin título',

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

        /*
         * Si Firestore falla, no se eliminan los resultados
         * de las páginas estáticas.
         */
    }

    /*
     * MOSTRAR MENSAJE SI NO HAY RESULTADOS
     */
    if (resultados.length === 0) {

        sinResultados.classList.remove('d-none');
        return;
    }

    /*
     * MOSTRAR RESULTADOS
     */
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

    /*
     * NORMALIZAR TEXTO
     *
     * Permite realizar búsquedas sin importar
     * mayúsculas, minúsculas o tildes.
     *
     * Ejemplo:
     * "Programación" = "programacion"
     * "Inteligencia Artificial" =
     * "inteligencia artificial"
     */
    function normalizarTexto(texto) {

        return texto
            .toString()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

});
