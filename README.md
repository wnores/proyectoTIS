# proyectoTIS
PROYECTO DE TALLER INTEGRADOR DE SISTEMAS
================================================
Creación de la base del proyecto.
En el index.html se crea el menú y botón de ingreso.
Se agrega una imagen de portada creada con IA gemini.
Y se crea el footer. 
El menú y el pie se mostrará en todas las páginas, a excepeción del botón de ingresar que no se
mostrará en las páginas ingresar.html y registrarse.html.

El menú contiene:
"acercaDe.html": Dónde se describirá el por qué de la página y la información de los creadores, público al que va dirigido y qué cursos contiene.

"catalogo.html": Se muestra la lista de cursos que se ofrecen y una breve descripción de cada uno. con la opción "ver detalle del curso" que te llevará a la pagina descripcionDeCurso.html".

"descripcionDeCurso.html": Dónde se datallará específicamente cada curso que se ofrece, su descripción, contenidos, precio, duración, etc.

"beca.html": Se describen las becas y/o descuentos que ofrece el sitio para beneficio de los cursos. 

"contacto.html": Se colocan los medios de contacto para consultar sobre cursos u otras consultas.

"ingresar.html": Formulario de ingreso como docente o alumno.

"registrarse.html: Formulario de registro, sólo con opción como alumno, los docentes que van a administrar la página ya deberían estar creados por defecto.

"politicaDePrivacidad": Políticas de privacidad que se utilizan para tratar datos personales, imágenes agregadas y el propio contenido de los cursos.

## Pagina "Acerca de ..."
 La página "Acerca de ..." posee información acerca de la organización, su misión, y el propósito del sitio.

 ## Backend y catálogo de cursos (Giovanna)

Se implementó el backend del sitio y se conectó con las páginas de catálogo de cursos.

### Backend
- API en Node.js + Express, con MySQL como base de datos (carpeta `backend/`).
- Endpoints principales: registro/login de usuarios, listado de cursos, detalle de curso, solicitud de becas, mensajes de contacto.
- Instrucciones de instalación y configuración en `backend/README.md`.

### Catálogo de cursos
- `catalogo.html`: muestra los cursos disponibles trayéndolos dinámicamente desde la base de datos (ya no están escritos a mano en el HTML).
- `descripcionDeCurso.html`: muestra el detalle de un curso específico según el `id` en la URL (ej. `descripcionDeCurso.html?id=3`).
- Se cargaron 10 cursos reales, organizados en categorías (Programación, Inteligencia Artificial, Bases de Datos, Ofimática, Hardware/Electrónica).
- Cada curso muestra su foto real si está disponible; si no, se muestra un ícono de color de respaldo según su categoría.

### Diseño responsive
- Se agregaron estilos para el catálogo y el detalle de curso (tarjetas, colores, hero) sumados al diseño ya existente.
- Se verificó el comportamiento en distintos tamaños de pantalla (celular, tablet, escritorio) usando Bootstrap y media queries adicionales.

### Pendiente
- Carrito de compras y flujo de pago (se implementará más adelante según indique el profesor).
- Fotos propias para los cursos de Machine Learning, Bases de Datos, Excel, Word, Micro:bit y Scratch.