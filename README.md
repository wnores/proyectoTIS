PROYECTO DE TALLER INTEGRADOR DE SISTEMAS (proyectoTIS)
==================================================================

- Sitio web de gestión de cursos sobre ciencias de la computación.
- Integrantes: Ercila Giovanna, Nores Walter, Ottonelli Silvana, Rosales Anny y Techera Marilina
- Estudiantes de tercer año del profesorado semipresencial especialidad informática
- CERP Salto - Uruguay

### Nombre
El nombre seleccionado para el sitio fue Cursos CC

### Logo
Se crea el logo correspondiente
<img width="200" height="200" alt="Logo" src="https://github.com/wnores/proyectoTIS/blob/main/recursos/imagenes/logo.jpg"/>

## Sprint 1 (10/08/2026 al 30/08/2026)

- 12/08 Creación de la base del proyecto.
- En el index.html se crea el menú y botón de ingreso.
- Se agrega una imagen de portada creada con IA gemini.
- Y se crea el footer. 
El menú y el pie se mostrará en todas las páginas, a excepeción del botón de ingresar que no se
mostrará en las páginas ingresar.html y registrarse.html.

- A partir de esa base del proyecto y teniendo en cuenta el prototipo realizado anteriormente en Miro, se comienza a programar la estructura del sitio web con tareas específicas asignadas a cada integrante.

### El menú contiene:
- acercaDe.html: Dónde se describirá el por qué de la página y la información de los creadores, público al que va dirigido y qué cursos contiene. (Creado por Walter)
- "catalogo.html": Se muestra la lista de cursos que se ofrecen y una breve descripción de cada uno. con la opción "ver detalle del curso" que te llevará a la pagina descripcionDeCurso.html". Muestra los cursos disponibles trayéndolos dinámicamente desde la base de datos (ya no están escritos a mano en el HTML).(Creado por Giovanna)
- "descripcionDeCurso.html": Dónde se detallará específicamente cada curso que se ofrece, su descripción, precio, duración, contenidos, etc. Muestra el detalle de un curso específico según el `id` en la URL (ej. `descripcionDeCurso.html?id=3`). Se cargaron 10 cursos reales, organizados en categorías (Programación, Inteligencia Artificial, Bases de Datos, Ofimática, Hardware/Electrónica). Cada curso muestra su foto real si está disponible; si no, se muestra un ícono de color de respaldo según su categoría.(Creado por Giovanna)
- "beca.html": Se describen las becas y/o descuentos que ofrece el sitio para beneficio de los cursos. Se incorporó una sección explicativa sobre el sistema de becas. Se agregaron los tipos de becas, requisitos y beneficios. Se creó un apartado para solicitar una beca. Se incorporó un formulario utilizando componentes de Bootstrap, con campos para nombre, correo electrónico, curso de interés, tipo de beca y motivo de la solicitud. Se revisó la estructura HTML y se corrigieron errores en los div para que el formulario quedara correctamente dentro de la tarjeta. (Creado por Anny)
Se verificó la presentación visual y la adaptación de la página al diseño general del sitio.
- "contacto.html": Aparece la información para consultas: se brinda un número de whatsapp, los días y horarios de atención y la dirección de las oficinas administrativas donde sólo se brinda información de los cursos. Además esta página cuenta con un formulario de contacto, dónde se ingresa el nombre y apellido, un correo electrónico y el mensaje o consulta que se desea enviar. (Creado por Marilina)

- Botón "ingresar.html": Formulario de ingreso mediante correo electrónico y contraseña (Previo registro, se ingresa con tipo de usuario docente/admin o estudiante.

- Botón "registrarse.html": Formulario de registro, por defecto crea los usuario de tipo "estudiante". Por otro lado, os docente/admin que van a administrar la página ya deberían estar creados por defecto.

### Desarrollo Frontend – Anny
### Página de becas
Se desarrolló y ajustó la página beca.html, destinada a informar a los usuarios sobre las becas y beneficios disponibles para los cursos.

### Se incorporó información sobre el sistema de becas.
Se agregaron los diferentes tipos de becas, requisitos y beneficios.
Se creó una sección para solicitar una beca.
Se desarrolló un formulario de solicitud utilizando componentes de Bootstrap.
El formulario incluye campos para nombre, correo electrónico, curso de interés, tipo de beca y motivo de la solicitud.
Se corrigió la estructura HTML
Se verificó la presentación visual y la adaptación responsive de la página.
Se mantuvo la identidad visual y la estructura general del proyecto.

### Página de Política de Privacidad
Se desarrolló y adaptó la página politicaDePrivacidad.html, destinada a informar a los usuarios sobre el tratamiento y protección de los datos utilizados por el sitio.
Se incorporó información relacionada con el tratamiento de datos personales.
Se contempló el uso de imágenes y contenidos publicados dentro de la plataforma.
Se adaptó el contenido al contexto del proyecto y a la normativa vigente en Uruguay.
Se mantuvo la estructura visual general del sitio utilizando HTML y Bootstrap.
Se verificó la navegación y el acceso a la página desde el menú principal.
Estructura y diseño del sitio

### Durante el desarrollo se trabajó en:
Estructuración de páginas mediante HTML semántico.
Integración de Bootstrap mediante CDN.
Aplicación y ajuste de estilos CSS.
Creación y modificación de formularios.
Revisión de la estructura HTML y corrección de errores.

### Diseño responsive
- Se agregaron estilos para el catálogo y el detalle de curso (tarjetas, colores, hero) sumados al diseño ya existente.
- Se verificó el comportamiento en distintos tamaños de pantalla (celular, tablet, escritorio) usando Bootstrap y media queries adicionales.

### Pendiente
- Carrito de compras y flujo de pago (se implementará más adelante según sprint).

### Formspree
Para los formularios de contacto y becas se utiliza Formspree, el cuál es un servicio en línea que permite recibir los datos de un formulario web directamente en un correo electrónico o panel sin necesidad de programar un servidor.

### Correo electrónico
Para que todo el grupo pueda probar y tener acceso a los formulario se creó un correo electrónico grupal: tallercerpsalto@gmail.com. 
Este correo fue registrado en la cuenta de formspree y además se utilizará más adelante para la cuenta de Firebase.

### Firebase (con el correo electrónico creado anteriormente)
Se crea un proyecto en Firebase que se llama BDCursos dónde contendrá toda la información de los cursos, tipos de usuarios y todo lo que se necesite guardar sobre los cursos. En este caso Firebase es una base de datos NoSQL alojada en la nube que almacena y sincroniza datos en tiempo real. 
Por el momento se utilizan dos extensiones Firestore que es donde se crean las colecciones, que simulan las tablas y authentication donde se registran los usuarios creados.

### Antes de finalizar el sprint 1 (Implementación del formulario de registro y conexión con Firebase)
### Registrarse (registrarse.html) - Marilina
Cuando se completa el formulario con los datos se guardan en la base de datos de Firestore database. Todos los campos son obligatorios. La contraseña tiene información de qué datos debe contener cuando se crea. Además permite adjuntar una imagen de perfil desde el navegador que por el momento sólo se guarda de forma temporal. Otra cosa que se implementó en este caso es que el tipo de usuario que se registra en la página en este caso siempre va a ser el estudiante. El otro tipo de usuario que contendrá la página será docente/admin que se detallará su implementación cuando se desarrolle en el sprint determinado. Además en el formulario se implementan algunas restricciones: el correo debe ser válido y no se puede repetir para 2 o más usuarios. La cédula se debe ingresar sin puntos ni guiones y deben ser sólo números. La contraseña debe contener letras mayúsculas, minúsculas y al menos un número. Contraseña y repetir contraseña deben coincidir. Luego de registrarse exitosamente el usuario queda logueado.

## Sprint 2 (31/08/2026 al 20/09/2026)
### iniciar sesión (ingresar.html) (Walter)

### Cerrar Sesión (Giovanna)

### Ver perfil/modificar perfil (perfil.html) (Silvana)

### Recuperar contraseña (recuperar_password) (Anny)
Se desarrolló la funcionalidad para recuperar la contraseña mediante Firebase Authentication. El usuario ingresa el correo electrónico asociado a su cuenta y recibe un enlace para establecer una nueva contraseña.

Se incorporaron mensajes para informar si el correo fue enviado correctamente o si ocurrió un error. También se configuró en Firebase una política de seguridad para exigir contraseñas de al menos 8 caracteres, con letras mayúsculas, minúsculas y números.

#### Mejoras en la página de becas (beca.html) - 

Se realizaron mejoras visuales y de validación en el formulario de solicitud de becas. Se agregaron asteriscos para identificar los campos obligatorios y se mantuvo el atributo `required` para impedir el envío de formularios incompletos.

También se incorporaron íconos de Bootstrap Icons con diferentes colores en los tres tipos de becas y en la sección de beneficios, manteniendo la identidad visual y el diseño responsive de la plataforma.

#### Publicación de cursos (publicarCurso.html) - 

Se creó un formulario para que los usuarios con rol `docente/admin` puedan publicar nuevos cursos en la plataforma.

El formulario permite ingresar:

- Título del curso.
- Descripción.
- Categoría.
- Precio.
- Duración en horas.
- Cupos disponibles.
- URL o ruta de la imagen.

Se incorporaron campos obligatorios, validaciones numéricas y mensajes de éxito o error. El precio debe ser igual o superior a 1.

Los datos ingresados se almacenan en la colección `cursos` de Cloud Firestore. Cada curso guarda también el identificador del usuario que realizó la publicación y la fecha de creación mediante `serverTimestamp()`.

#### Control de acceso según el rol -

Se implementó la verificación de permisos para que el formulario de publicación solamente pueda ser visualizado y utilizado por usuarios autenticados con el rol `docente/admin`.

Los visitantes son redirigidos a la página de inicio de sesión y los estudiantes que intentan ingresar directamente son redirigidos al catálogo. También se configuró la visibilidad de las opciones administrativas mediante los permisos definidos en `roles.js`.

#### Panel de administración de cursos (administrarCursos.html) - 

Se creó una página destinada a centralizar las funcionalidades administrativas relacionadas con los cursos.

Desde este panel, el usuario con rol `docente/admin` puede acceder al formulario para publicar cursos. También se prepararon las opciones para modificar y eliminar cursos, que serán implementadas progresivamente.

El acceso “Administrar cursos” se incorporó en el menú desplegable del usuario y solamente se muestra cuando la cuenta autenticada posee permisos administrativos.


## Sprint 3 (28/09/2026 al 11/10/2026)

## Sprint 4 (12/10/2026 al 23/10/2026)
