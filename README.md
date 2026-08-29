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

"beca.html": Se describen las becas y/o descuentos que ofrece el sitio para beneficio de los cursos. Se incorporó una sección explicativa sobre el sistema de becas. Se agregaron los tipos de becas, requisitos y beneficios. Se creó un apartado para solicitar una beca. Se incorporó un formulario utilizando componentes de Bootstrap, con campos para nombre, correo electrónico, curso de interés, tipo de beca y motivo de la solicitud. Se revisó la estructura HTML y se corrigieron errores en los div para que el formulario quedara correctamente dentro de la tarjeta.
Se verificó la presentación visual y la adaptación de la página al diseño general del sitio.

"contacto.html": Se colocan los medios de contacto para consultar sobre cursos u otras consultas.

"ingresar.html": Formulario de ingreso como docente o alumno.

"registrarse.html: Formulario de registro, sólo con opción como alumno, los docentes que van a administrar la página ya deberían estar creados por defecto.


"politicaDePrivacidad": Políticas de privacidad que se utilizan para tratar datos personales, imágenes agregadas y el propio contenido de los cursos.

## Pagina "Acerca de ..."
 La página "Acerca de ..." posee información acerca de la organización, su misión, y el propósito del sitio.

 ## Backend y catálogo de cursos (Giovanna)

Se implementó el backend del sitio y se conectó con las páginas de catálogo de cursos.

### Backend
- API en Node.js + Express, con json como base de datos (carpeta `backend/`).
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

"politicaDePrivacidad": Políticas de privacidad que se utilizan para tratar datos personales, imágenes agregadas y el propio contenido de los cursos. e incorporó información sobre el tratamiento y protección de los datos personales de los usuarios.Se adaptó el contenido a la realidad del proyecto y al contexto normativo de Uruguay. Se mantuvo la estructura visual del sitio utilizando HTML y Bootstrap.Se verificó la navegación y el acceso a la página desde el sitio.

## Sprint 1
Se crea el contenido de todas las páginas creadas hasta el momento.
Comenzando con una base del proyecto que contiene el menú principal con las páginas inicio.html, acercaDe.html, catalogo.html, beca.html y contacto.html. Además en la parte superior derecha aparece el botón "ingresar" que redirige a la página ingresar.html si el usuario ya está registrado en la web podrá iniciar sesión ingresando su usuario en este caso el correo electrónico y la contraseña creada. Además aparecen las opciones de recuperar contraseña, en caso que se haya olvidado, recuperar_password que se implementará más adelante y también aparece la opción de registrarse si aún no lo hizo en la web, esta página se llama registrarse.html y también se implementará más adelante.

#inicio (index.html)

#Acerca de (acercaDe.html)

#Catálogo (catálogo.html)
Se muestra con un array de objetos en Javascript y el detalle (descripcionDeCurso.html) se muestra con los parámetros de URL...

#Detalle de cada curso (descripcionDeCurso.html)

#Becas (beca.html)
Se ofrecen 3 tipos...

#Contacto (contacto.html)
Aparece la información para consultas: se brinda un número de whatsapp, los días y horarios de atención y la dirección de las oficinas administrativas donde sólo se brinda información de los cursos. Además esta página cuenta con un formulario de contacto, dónde se ingresa el nombre y apellido, un correo electrónico y el mensaje o consulta que se desea enviar. 

#Formspree
Para los formularios de contacto y becas se utiliza Formspree, el cuál es un servicio en línea que permite recibir los datos de un formulario web directamente en un correo electrónico o panel sin necesidad de programar un servidor.

#Correo electrónico
Para que todo el grupo pueda probar y tener acceso a los formulario se creó un correo electrónico grupal: tallercerpsalto@gmail.com. 
Este correo fue registrado en la cuenta de formspree y además se utilizará más adelante para la cuenta de Firebase.

#Ingresar/inciar sesión (ingresar.html)

#Ver perfil/modificar perfil (perfil.html)

#Política de privacidad (politicaDePrivacidad.html)
Se encuentra en el pie de página un enlace que redirige a la página de privacidad, donde se detalla...

#Recuperar contraseña (recuperar_password)

#Resultados (resultados.html)

#Registrarse (registrarse.html)
Cuando se completa el formulario con los datos se guardan en la base de datos de Firestore database. Todos los campos son obligatorios. La contraseña tiene información de qué datos debe contener cuando se crea. Además permite adjuntar una imagen de perfil desde el navegador que por el momento sólo se guarda de forma temporal. Otra cosa que se implementó en este caso es que el tipo de usuario que se registra en la página en este caso siempre va a ser el estudiante. Los demás tipos de usuario que contendrá la página se detallarán más adelante cuando sea el momento.

#Firebase (con el correo electrónico creado anteriormente)
Se crea un proyecto en Firebase que se llama BDCursos dónde contendrá toda la información de los cursos, tipos de usuarios y todo lo que se necesite guardar sobre los cursos. En este caso Firebase es una base de datos NoSQL alojada en la nube que almacena y sincroniza datos en tiempo real. Por el momento se utilizan dos extensiones Firestore que es donde se crean las colecciones, que simulan las tablas y authentication donde se registran los usuarios creados.


