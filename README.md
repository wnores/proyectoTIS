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

## Sprint 1 (10/08/2026 al 30/08/2026) - Semanas 4 a 6 Base del Sistema

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

- Botón "ingresar.html": Formulario de ingreso mediante correo electrónico y contraseña (Previo registro), se ingresa con los tipo de usuario "docente/admin" o "estudiante", dependiendo de los permisos que posea cada usuario.

- Botón "registrarse.html": Formulario de registro, por defecto crea los usuario de tipo "estudiante". Por otro lado, los "docente/admin" que van a administrar la página ya están estar creados por defecto.

### Desarrollo Frontend – (Anny)
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

### Formspree (Marilina)
Para los formularios de contacto y becas se utiliza Formspree, el cuál es un servicio en línea que permite recibir los datos de un formulario web directamente en un correo electrónico o panel sin necesidad de programar un servidor.

### Correo electrónico
Para que todo el grupo pueda probar y tener acceso a los formulario se creó un correo electrónico grupal: tallercerpsalto@gmail.com. 
Este correo fue registrado en la cuenta de formspree y además se utilizará más adelante para la cuenta de Firebase.

### Firebase (con el correo electrónico creado anteriormente) (Marilina)
Se crea un proyecto en Firebase que se llama BDCursos dónde contendrá toda la información de los cursos, tipos de usuarios y todo lo que se necesite guardar sobre los cursos. En este caso Firebase es una base de datos NoSQL alojada en la nube que almacena y sincroniza datos en tiempo real. 
Por el momento se utilizan dos extensiones Firestore que es donde se crean las colecciones, que simulan las tablas y authentication donde se registran los usuarios creados.

### Antes de finalizar el sprint 1 (Implementación del formulario de registro y conexión con Firebase)
### Registrarse (registrarse.html) - (Marilina)
Cuando se completa el formulario con los datos se guardan en la base de datos de Firestore database. Todos los campos son obligatorios. La contraseña tiene información de qué datos debe contener cuando se crea. Además permite adjuntar una imagen de perfil desde el navegador que por el momento sólo se guarda de forma temporal. Otra cosa que se implementó en este caso es que el tipo de usuario que se registra en la página en este caso siempre va a ser el estudiante. El otro tipo de usuario que contendrá la página será docente/admin que se detallará su implementación cuando se desarrolle en el sprint determinado. Además en el formulario se implementan algunas restricciones: el correo debe ser válido y no se puede repetir para 2 o más usuarios. La cédula se debe ingresar sin puntos ni guiones y deben ser sólo números. La contraseña debe contener letras mayúsculas, minúsculas y al menos un número. Contraseña y repetir contraseña deben coincidir. Luego de registrarse exitosamente el usuario queda logueado.

Se publica una primera versión del sitio en Firebase Hosting luego de completado el sprint 1: 
https://bdcursoscc.web.app/

## Sprint 2 (31/08/2026 al 20/09/2026) - Semanas 7 a 9 Funcionalidades dinámicas

### iniciar sesión (ingresar.html) (Walter)

- Formulario 'ingresar.html' conectado a **Firebase Authentication** mediante 'signInWithEmailAndPassword'.
- Validación de credenciales contra la base de usuarios registrados.
- Manejo de errores específicos: usuario no encontrado ('auth/user-not-found'), contraseña incorrecta ('auth/wrong-password'), correo inválido, entre otros.
- Al iniciar sesión correctamente, se muestra una notificación tipo **toast** y se redirige al usuario a la página de inicio ('index.html').
- La sesión persiste automáticamente gracias a 'onAuthStateChanged', por lo que al recargar la página el usuario sigue logueado.

### Cerrar Sesión (Walter)

- Botón **"Cerrar Sesión"** visible en el navbar solo cuando hay un usuario autenticado.
- Al hacer clic, se ejecuta 'signOut(auth)' de Firebase, se muestra un toast de confirmación y se redirige al inicio.
- El navbar se actualiza dinámicamente: al cerrar sesión vuelve a mostrar el botón **"Ingresar"**.

### Ver perfil/modificar perfil (perfil.html) (Silvana)

Se actualizó el módulo de perfil de usuario, incorporando funcionalidades para la gestión de los datos personales, la imagen de perfil, la contraseña, los servicios adquiridos y la eliminación de la cuenta.

### Funcionalidades implementadas

* **Edición de datos personales**

  * Nombre.
  * Apellido.
  * Departamento.
  * Foto de perfil.

* **Cambio de contraseña**

  * Reautenticación mediante la contraseña actual.
  * Validación de la nueva contraseña.
  * Actualización mediante Firebase Authentication.

* **Imagen de perfil**

  * Selección de una imagen desde el ordenador.
  * Carga de la imagen mediante Cloudinary.
  * Almacenamiento de la URL de la imagen en Firestore y Firebase Authentication.

* **Servicios adquiridos**

  * Visualización de los cursos adquiridos.
  * Visualización de las becas otorgadas al usuario.
  * La información se obtiene desde la base de datos.

* **Eliminación de cuenta**

  * Confirmación de la acción.
  * Reautenticación del usuario.
  * Eliminación de las solicitudes de beca asociadas.
  * Eliminación de los datos del usuario en Firestore.
  * Eliminación de la cuenta en Firebase Authentication.

### Cambios técnicos

* Se implementó y actualizó **`perfil.js`** para centralizar la gestión del perfil y las operaciones relacionadas con los datos del usuario.
* Se creó **`beca.js`** para gestionar funcionalidades relacionadas con cursos y becas.
* Se dejó de utilizar **Freeform** para cargar la información de estas funcionalidades.
* Los datos del usuario, cursos y becas se obtienen directamente desde **Firestore**, permitiendo trabajar con información almacenada en la base de datos y actualizada dinámicamente.
* Se integró **Firebase Authentication** para la gestión de la sesión, contraseña y eliminación de cuentas.
* Se integró **Cloudinary** para el almacenamiento de las imágenes de perfil.

En conjunto, las modificaciones permiten gestionar el perfil de forma dinámica y conectar las funcionalidades de usuario, cursos y becas directamente con los servicios de Firebase y la base de datos.


### Recuperar contraseña (recuperarContrasenia.html) (Anny)
Se implementó la recuperación de contraseña mediante Firebase Authentication. El usuario puede ingresar el correo electrónico asociado a su cuenta y se solicita el envío de un enlace para restablecer su contraseña.

Se incorporaron validaciones para comprobar que el campo no esté vacío y que el correo tenga un formato válido. También se agregaron mensajes para informar si la solicitud se realizó correctamente o si ocurrió un error durante el proceso.

La página mantiene la identidad visual del sitio, incluye navegación, contenido principal y pie de página, y presenta un enlace para volver al inicio.

### Administración de cursos (administrarCursos.html) (Anny)

Se desarrolló un panel de administración disponible únicamente para usuarios con rol docente/admin. El acceso se controla mediante el sistema de roles y permisos implementado en el proyecto.

Desde este panel, el administrador puede acceder a las funcionalidades relacionadas con la gestión de cursos:

- Crear un nuevo curso.
- Modificar un curso existente.
- Dar de baja un curso.
La opción “Administrar cursos” se incorporó al menú desplegable del usuario y solamente se muestra cuando la persona autenticada posee el permiso correspondiente.

### Crear cursos (publicarCurso.html) (Anny)

Se desarrolló el formulario para crear cursos, disponible únicamente para usuarios con rol docente/admin y permiso `crearCursos`.

El formulario permite ingresar:

- Título del curso.
- Descripción.
- Categoría.
- Precio.
- Duración en horas.
- Cupos disponibles.
- Imagen del curso.
- Contenidos organizados en módulos.

Se agregaron validaciones para comprobar que los campos obligatorios estén completos y que los valores numéricos sean correctos.

Al confirmar la creación, la información se guarda como un nuevo documento dentro de la colección `cursos` de Cloud Firestore. También se registra el identificador del usuario que creó el curso y la fecha de creación mediante `serverTimestamp()`.

Durante el proceso, el botón muestra el mensaje “Creando...” y queda temporalmente deshabilitado para evitar que el formulario sea enviado varias veces.

### Módulos dinámicos de los cursos (Anny)

Se incorporó al formulario de creación de cursos la posibilidad de agregar una cantidad variable de módulos.

El formulario comienza mostrando el módulo 1. Mediante el botón “Agregar módulo”, el administrador puede generar nuevos campos para ingresar los contenidos de cada módulo.

Los módulos se guardan en Firestore utilizando los campos `modulo1`, `modulo2`, `modulo3` y así sucesivamente. Esto permite que cada curso tenga una cantidad diferente de módulos.

La página de detalle del curso identifica estos campos y presenta sus contenidos dinámicamente en una tabla para los estudiantes autenticados.
Los módulos agregados también pueden eliminarse antes de crear el curso. El módulo 1 permanece como obligatorio y los módulos restantes se renumeran automáticamente después de una eliminación. Una vez creado correctamente el curso, el formulario elimina los módulos adicionales y vuelve a mostrar únicamente el módulo 1.

### Carga de imágenes de los cursos con Cloudinary (Anny)

Se reemplazó el ingreso manual de la dirección de una imagen por un selector de archivos que permite elegir una imagen almacenada en el ordenador.

Al seleccionar el archivo:

- Se muestra el nombre de la imagen.
- Se presenta una vista previa.
- La imagen se sube a Cloudinary.
- La URL segura generada por Cloudinary se guarda en el campo `imagen_url` del documento del curso en Firestore.

De esta manera, los administradores pueden seleccionar la imagen desde su computadora sin tener que escribir o buscar previamente una URL.

### HTML semántico y accesibilidad (Anny)

Se revisó y mejoró la estructura HTML de diferentes páginas del sitio mediante el uso de etiquetas semánticas como `header`, `nav`, `main`, `section`, `article` y `footer`.

También se incorporaron mejoras de accesibilidad:

- Asociación entre etiquetas `label` y campos de formulario.
- Textos alternativos en las imágenes.
- Uso de `aria-label` y `aria-labelledby`.
- Identificación de la navegación principal.
- Organización jerárquica de los encabezados.
- Mensajes con `role="alert"`.
- Uso de botones con tipos correctamente definidos.

Estas modificaciones se realizaron procurando conservar la apariencia, las clases de Bootstrap, la navegación y los elementos comunes utilizados en todas las páginas.

### Búsqueda, filtrado y ordenamiento del catálogo (Anny)

Se mejoró el catálogo incorporando herramientas para buscar y organizar los cursos obtenidos desde Cloud Firestore.

El usuario puede:
- Buscar cursos por título o descripción.
- Filtrar por categoría.
- Ordenar por precio de menor a mayor o de mayor a menor.
- Ordenar alfabéticamente de A a Z o de Z a A.
- Ordenar por cantidad de cupos disponibles.
- Limpiar todos los filtros aplicados.

El catálogo muestra la cantidad de cursos encontrados y presenta un mensaje cuando no existen resultados que coincidan con la búsqueda.

## Perfiles de usuario (Giovanna)
Se definieron dos roles: estudiante y docente/admin, guardados en el campo tipoUsuario de cada usuario en Firestone. 
Se creó js/roles.js con las reglas de permisos de cada rol:
- Estudiante: puede comprar cursos, acceder a sus contenidos y obtener certificado.
- Docente/admin: puede crear, editar y eliminar cursos, y gestionar las cuentas de los estudiantes.
Se agregó una función (aplicarVisibilidadPorRol) que oculta u muestra elementos de la interfaz según el rol del usuario logueado (o de un visitante sin sesión).

## Detalle del curso con usuario logueado (Marilina)
Si vamos a la página detalleDeCurso.html desde el catálogo, nos muestra la información del curso seleccionado: nombre, descripción, precio, duración, modalidad y precio, además del botón de "Inscribirse". En este primer caso como el usuario no está logueado, es sólo visitante, el botón te llevará a la página de iniciar sesión. Si iniciamos sesión con un usuario de tipo "docente/admin" muestra todo lo mismo menos el botón de "inscribirse" y si iniciamos sesión con un usuario de tipo "estudiante" muestra toda la información del curso y una tabla con los contenidos, diferenciados por módulos. En este último caso, debejo de la tabla muestra 2 botones: "Solicitar una beca" que lleva a la página de beca.html la cuál contiene el formulario de solicitud y "Inscribirme a este curso" que si hacemos clic, en este sprint sólo muestra un mensaje debajo que dice ¡Inscripción confirmada! y especifica que es solo un mensaje de prueba ya que su funcionalidad se implementará más adelante para realizar el pago del curso. Internamente se está guardando en la base de datos, usuarios, para que registre para ese usuario los servicios adquiridos.

## Habilitar y deshabilitar cursos (eliminación lógica) (Walter)

- Página 'deshabilitar_curso.html' que lista **todos** los cursos almacenados en Firestore (activos e inactivos).
- Cada fila muestra: nombre, descripción, categoría, precio, estado (badge "Activo" / "Inactivo") y un botón de acción.
- Eliminación lógica (soft delete): en lugar de borrar el documento de Firestore, se actualiza el campo booleano 'activo':
  - Deshabilitar: 'activo: false' → el curso deja de mostrarse en el catálogo público, pero permanece en la base de datos.
  - **Habilitar:** 'activo: true' → el curso vuelve a estar visible en el catálogo.
- Confirmación mediante **modal** antes de ejecutar la acción, con textos dinámicos según corresponda.
- El botón cambia de color y texto según el estado actual del curso (rojo para deshabilitar, verde para habilitar).
- Listado paginado para manejar grandes volúmenes de cursos sin afectar el rendimiento.

## Modificar curso (Giovanna)
Se creó la página modificarCurso.html y su lógica en js/modificarCurso.js disponible sólo para usuarios con rol docente/admin.
Permite elegir un curso existente desde un desplegable (cargado desde Firestore), completar automáticamente el formulario con sus datos actuales y guardar los cambios (título, descripción, categoría, precio, duración, cupos, imagen) directamente en la base de datos.
Se habilitó el acceso a esta funcionalidad desde administrarCursos.html, reemplazando el botón "Próximamente".

## Categoría de los cursos (Giovanna)
Se agregó la visualización de la categoría del curso tanto en las tarjetas del catálogo (catalogo.html) cómo en la página de detalle (descripcionDeCurso.html).
Se corrigió descripcionDeCurso.js para que también busque los cursos en Firestore (antes sólo buscaba en cursos.json, por lo que los cursos nuevos no se podían ver en detalle).
Se completó manualmente el campo categoria en Firestore para los cursos que no lo tenían cargado.

--------------------------------------------------------------------------------------------

## Sprint 3 (28/09/2026 al 11/10/2026)

### Gestión de usuarios: habilitar / deshabilitar (Walter)

Se implementó un sistema de **baja lógica** sobre la colección `usuarios` de Firestore, que permite al administrador bloquear el acceso de un usuario sin eliminar su cuenta.

**Funcionamiento:**

- Cada documento de la colección `usuarios` incluye un campo booleano `activo` (por defecto `true`).
- El panel de administración (`administrarCursos.html`) lista a todos los usuarios registrados en una tabla, con búsqueda, filtro por estado (activos/inactivos) y paginación.
- Cada fila muestra un botón dinámico:
  - **Deshabilitar** (rojo) si el usuario está activo.
  - **Habilitar** (verde) si el usuario está inactivo.
- La acción se confirma mediante un modal antes de aplicar el cambio.
- Al confirmar, se actualiza el campo `activo` en Firestore y se registra la fecha del cambio (`fechaCambioEstado`).

**Validación en el inicio de sesión:**

En `inicioCierreSesion.js`, luego de autenticar correctamente con Firebase Auth, se consulta el documento del usuario en Firestore. Si el campo `activo` es `false`:

1. Se cierra la sesión inmediatamente con `signOut(auth)`.
2. Se muestra un mensaje al usuario: *"Tu cuenta está deshabilitada. Contacta al administrador."*
3. No se permite la redirección al sitio.

De esta forma, un usuario deshabilitado **puede autenticarse** (Firebase Auth no lo bloquea), pero **no puede acceder a la aplicación** porque la validación ocurre antes de permitir el ingreso. Se definen además, las reglas de Firestore sobre la coleccción 'usuarios' de 'lectura/escritura' de acuerdo al 'tipoUsuario' 'docente/admin' y 'estudiante'.

### Panel de estadísticas (Walter)

Se implementó un dashboard de métricas en el panel de administración (`administrarCursos.html`) que muestra un resumen general de la plataforma en tiempo real: total de usuarios (activos e inactivos), distribución por rol, estudiantes matriculados, ranking de cursos más populares, ingresos totales y becas otorgadas. Los datos se obtienen desde Firestore y se procesan con métodos de arrays para calcular agrupaciones y porcentajes.

**Métricas mostradas:**

- **Usuarios:** total registrados, activos, inactivos y distribución por rol (estudiante / docente-admin).
- **Estudiantes matriculados:** usuarios únicos con al menos una adquisición aprobada.
- **Cursos:** total publicados y ranking de los 5 más populares según cantidad de inscripciones.
- **Ingresos:** suma total de adquisiciones aprobadas con estado de pago.
- **Becas:** cantidad de solicitudes aprobadas u otorgadas.

### Pasarela de pagos (Marilina y Silvana)
**Marilina:** Se implementa la pasarela de pago del curso para acceder a los contenidos, para esta opción se debe estar logueado como "estudiante" y presenta dos opciones de pago. 
1- Mediante pago con tarjeta donde se deben agregar los datos de la tarjeta: nombre del titular, número de tarjeta, fecha de vencimiento y CVV. Se validan todos los campos y no mes y año anterior al actual en la fecha de vencimiento. Luego el pago se concreta y se accede al curso directamente.
2- Pago por transferencia, solicita adjuntar el comprobante de pago en formato JPG o PNG y al aceptar la compra queda pendiente de aprobación por el administrador, si el docente/admin ve el comprobante y lo aprueba se concreta el pago y se accede al curso, si rechaza el pago no puede acceder al curso.

**Silvana:**

### Control de acceso por compra (Marilina)
Se controla que el usuario logueado como "estudiante" pueda ver el detalle del curso con información del curso y de los contenidos (sólo módulo y temas). Para acceder a los contenidos reales y materiales debe pagar el curso por medio de la pasarela de pagos. Luego el estudiante en la página **misCursos.html** ve el historial de adquisiciones, los cursos que accedió y los que fueron rechazados por algún motivo.

### Descarga de materiales (Marilina)
Por el momento el estudiante sólo puede descargar el PDF que contiene la consigna de la actividad final o de cierre, este archivo se sube a cloudinary y luego en la sección actividad final se integra una vista previa y la posibilidad de poder verlo en el navegador o descargarlo. A futuro se podría pensar implementar que también se puedan descargar los materiales de los módulos.

### Protección de rutas privadas (Marilina)
Se asegura que si se coloca el nombre del archivo html directo en la barra del navegador no se tenga acceso si es una página que sólo se puede ver cuando se inicia sesión o con un determinado tipo de usuario.
--------------------------------------------------------------------------------------

## Sprint 4 (12/10/2026 al 23/10/2026)

### Crear curso (Marilina)
A la creación del curso se le agrega la sección módulos del curso: dónde se agregan la cantidad de módulos que va a contener el curso y los temas correspondientes. Se pueden agregar o eliminar módulos.

### Modificar curso (Marilina) 
Se reestructura la modificación de los cursos. Además de los ítems que ya estaban en el sprint 2, Se muestran los módulos creados con sus temas correspondientes. Tanto al módulo como a los temas que ya estaban creados se les puede modificar el nombre y permite agregar para cada tema del módulo una descripción, los objetivos y recursos que pueden ser pdf, enlaces, drive o presentaciones. Y al final permite adjuntar en formato pdf la actividad final del curso que luego será la única que se podrá calificar y si se aprueba satisfactoriamente el curso obtener un certificado.

### Registro de calificación (Marilina)
Cuando se adjunta la tarea final, automáticamente el docente/admin recibe una notificación que tiene una tarea para ser calificada. Se ingresa, se corrige la tarea y se coloca una nota y un comentario para que el estudiante lo vea. Inmediatamente luego de calificar el estudiante recibe una notificación y en la sección de actividad final ya no puede realizar más entregas y podrá visualizar la calificación final del curso, si la nota es entre 6 y 10, aprueba el curso y obtiene un certificado. Si es menor a 6 no aprueba pero tampoco puede volver a realizar entregas de la actividad final.

### Pruebas de flujo completo (Marilina y el resto)
Marilina: chequeo de permisos, reglas y corrección de errores. Se hace un primer testing y luego cada uno prueba individualmente para poder integrar a main y actualizar el hosting

### Configuración y Seguridad de Firestore (Marilina)

Se ha incorporado el archivo **`firestore.rules`** en la raíz del proyecto. Este archivo contiene la configuración de seguridad (Reglas de Firestore) necesaria para proteger la base de datos y garantizar el correcto funcionamiento de las funcionalidades del sistema.

### Publicación de la versión final (Marilina)
Se pasa todo el proyecto de develop a main, se vuelven a realizar pruebas y se actualiza el hosting en firebase.
### Comprobante de compra (Anny)

Se desarrolló la página `comprobanteCompra.html` junto con su correspondiente lógica en JavaScript.

Después de registrar una adquisición, el usuario es redirigido al comprobante mediante el identificador de la operación almacenada en Firestore.

El comprobante permite visualizar:

- Nombre del estudiante.
- Curso adquirido.
- Precio del curso.
- Método de pago seleccionado.
- Estado de la adquisición.
- Fecha de la operación.
- Identificador del comprobante.

También se incorporaron mensajes de error para los casos en los que no se indica un comprobante, la adquisición no existe o el usuario no tiene permiso para consultarla.

### Actualización de cupos disponibles (Anny)

Se implementó la actualización automática de los cupos disponibles cuando una compra con tarjeta es aprobada.

La operación se realiza mediante una transacción de Cloud Firestore, permitiendo:

- Verificar que el curso exista.
- Comprobar que queden cupos disponibles.
- Descontar exactamente un cupo.
- Registrar la adquisición.
- Evitar que dos estudiantes ocupen simultáneamente el último cupo.
- Mostrar un mensaje cuando el curso ya no dispone de lugares.

Las transferencias pendientes no descuentan el cupo hasta que la operación sea aprobada.

### Restricción para solicitar becas (Anny)

Se incorporó una validación para impedir que un estudiante solicite una beca para un curso que ya adquirió.

La aplicación consulta las adquisiciones del usuario en Firestore y, cuando detecta una compra aprobada, oculta o deshabilita la opción “Solicitar una beca”.

Esto evita solicitudes duplicadas o incompatibles con el estado del estudiante dentro del curso.

### Acceso al contenido de los cursos (Anny)

Se desarrollaron las páginas `contenidoCurso.html` y su correspondiente archivo JavaScript para mostrar el contenido académico de cada curso.

El acceso se controla según la autenticación, el rol y la relación del usuario con el curso:

- El visitante puede consultar el catálogo y el detalle general.
- El estudiante solamente puede acceder al material de los cursos adquiridos.
- El docente/admin puede consultar y administrar los contenidos.
- Los accesos no autorizados muestran un mensaje y redirigen al usuario.

### Organización del contenido por módulos y temas (Anny)

Se amplió la estructura de los cursos en Cloud Firestore utilizando subcolecciones de módulos y temas.

Cada módulo puede contener:

- Título.
- Descripción.
- Objetivos.
- Temas.
- Materiales teóricos.
- Videos.
- Proyecto o actividad final.

Esta estructura permite que cada curso posea una cantidad diferente de módulos, temas y recursos.

### Gestión de materiales educativos (Anny)

Se incorporó la posibilidad de agregar y visualizar materiales educativos desde la administración de cursos.

Los recursos pueden incluir:

- Documentos PDF.
- Videos educativos.
- Actividades prácticas.
- Materiales teóricos.

Los archivos y enlaces se recuperan dinámicamente desde Firestore y se presentan dentro del contenido correspondiente.

### Elaboración de contenidos educativos (Anny)

Se diseñaron y cargaron materiales para diferentes cursos de la plataforma, principalmente:

- Introducción a la Ciberseguridad.
- Desarrollo Web.
- Introducción a la Programación en Python

### Gestión de materiales educativos (Giovanna)

Se agrega en conjunto con Anny la visualización de materiales educativos desde la administración de cursos, se incorpora: Documentos PDF, videos, actividades prácticas y materiales educativos. 
Se incorporó la posibilidad de agregar y visualizar materiales educativos desde la administración de cursos.

### Elaboración de contenidos educativos (Giovanna)

Se diseñaron y cargaron materiales para diferentes cursos de la plataforma, principalmente:

- Programación con Scratch.
- Excel para el trabajo y el estudio.
- Introducción a la placa Microbit.


## Sprint 4 (12/10/2026 al 23/10/2026)

### Integración, comunicación y mejoras finales

### Foro interno de los cursos (Anny)

Se incorporó un foro dentro del contenido de cada curso para facilitar la comunicación entre estudiantes y docentes.

Los usuarios autorizados pueden:

- Publicar mensajes.
- Consultar las publicaciones del curso.
- Responder mensajes.
- Identificar el autor y la fecha de publicación.
- Eliminar sus propias publicaciones.
- Participar únicamente en los cursos a los que tienen acceso.

Cada foro se almacena como una subcolección del curso correspondiente en Cloud Firestore, evitando que las publicaciones de diferentes cursos se mezclen.

### Respuestas a publicaciones (Anny)

Se agregó la posibilidad de responder las publicaciones del foro.

Las respuestas quedan asociadas al mensaje original e incluyen:

- Identificador del autor.
- Nombre del usuario.
- Contenido de la respuesta.
- Fecha de publicación.

Esta funcionalidad permite generar intercambios entre los estudiantes y el docente dentro de cada curso.

### Notificaciones del foro (Anny)

Se incorporó un sistema de notificaciones para informar al docente/admin sobre la existencia de nuevas publicaciones en los foros.

Las notificaciones se muestran mediante una campana ubicada en el encabezado y permiten identificar:

- El curso relacionado.
- El autor del mensaje.
- El contenido o resumen de la publicación.
- La fecha del mensaje.
- Su estado de lectura.

Esto permite que el docente pueda conocer la actividad de los foros sin tener que ingresar individualmente a cada curso.

### Reglas de seguridad para foros y notificaciones (Anny)

Se actualizaron las reglas de seguridad de Cloud Firestore para controlar el acceso a:

- Publicaciones del foro.
- Respuestas.
- Notificaciones.
- Módulos y temas.
- Adquisiciones.
- Solicitudes de becas.

Las reglas comprueban que el usuario esté autenticado y controlan las acciones según el autor del contenido o el rol docente/admin.

Los usuarios pueden modificar o eliminar únicamente sus propias publicaciones, mientras que el docente/admin dispone de permisos de moderación.

### Corrección del acceso a “Mis cursos” (Anny)

Se corrigió el enlace de la opción “Mis cursos”, que anteriormente redirigía incorrectamente al perfil.

La opción dirige ahora a la sección correspondiente, donde el estudiante puede consultar los cursos adquiridos y acceder a sus contenidos.

### Integración y pruebas realizadas (Marilina)

Se realizaron pruebas sobre los principales flujos implementados:

- Creación y modificación de cursos.
- Incorporación de módulos y temas.
- Carga de PDF, videos y actividades.
- Acceso al contenido según el rol.
- Registro y consulta de adquisiciones.
- Generación del comprobante de compra.
- Descuento de cupos disponibles.
- Restricción de solicitudes de beca.
- Publicación y visualización de mensajes en el foro.
- Visualización de notificaciones.
- Navegación desde “Mis cursos”.
- Mensajes de error y estados de carga.

También se revisaron errores de consola, enlaces, permisos de Firestore y la integración entre las diferentes páginas.

### Certificado de aprobación (Giovanna)
- Página `certificado.html` con su lógica en `js/certificado.js`: el estudiante puede ver y descargar su certificado en PDF.
- Incluye logo, nombre, cédula, curso, carga horaria, calificación, fecha de emisión, firma ficticia y código de verificación.
- Los datos salen de Firestore (`usuarios`, `cursos` y `certificados`) y el PDF se genera en el navegador con `html2pdf.js`.
- El certificado se emite cuando el docente carga una nota mayor a 6.

### Reglas de seguridad para certificados (Giovanna)

Se actualizaron las reglas de seguridad de Cloud Firestore para controlar el acceso a:
- Certificados.

### Pruebas (Giovanna)

Se realizaron pruebas sobre los principales flujos implementados:

- Modificación de cursos.
- Incorporación de módulos y temas.
- Carga de PDF, videos y actividades.
- Acceso al contenido según el rol.
- Vista y descarga de Certificados. 

### Configuración y Seguridad de Firestore

Se ha incorporado el archivo **`firestore.rules`** en la raíz del proyecto. Este archivo contiene la configuración de seguridad (Reglas de Firestore) necesaria para proteger la base de datos y garantizar el correcto funcionamiento de las funcionalidades del sistema.

## Gestión de becas y Mis cursos (Silvana)

### Gestión de becas

Implementación del sistema de solicitud, validación y administración de becas mediante JavaScript, Firebase Authentication y Cloud Firestore.

- **Solicitud de becas:** formulario para solicitar becas asociadas a cursos, con selección del tipo de beneficio.
- **Validación de solicitudes:** incorporación de restricciones para evitar solicitudes incompatibles según las solicitudes existentes, las becas aprobadas y las adquisiciones del estudiante.
- **Control de becas activas:** prevención de solicitudes de otro tipo para un curso que ya cuenta con una beca activa, y de solicitudes para otros cursos cuando existe una beca activa del mismo tipo.
- **Restricciones por pagos:** bloqueo de solicitudes de becas para cursos adquiridos mediante otros medios de pago.
- **Control de roles:** restricción de solicitudes para usuarios con perfil docente o administrador.
- **Aprobación de solicitudes:** actualización del estado de las solicitudes y registro de las becas aprobadas.
- **Gestión de cupos:** actualización de los cupos disponibles al aprobar una beca.
- **Registro de adquisiciones:** incorporación de las becas aprobadas a la colección `adquisiciones`, con método de pago `beca` y precio cero.
- **Gestión de saldos pendientes:** integración de las becas con el control de saldos y el estado de pago correspondiente.
- **Notificaciones:** implementación de notificaciones relacionadas con las solicitudes de becas y sus cambios de estado, mediante Firestore.
- **Reutilización del beneficio:** posibilidad de volver a solicitar una beca una vez finalizado el curso, respetando las validaciones establecidas.

### Mis cursos

Desarrollo de una sección personal para que los estudiantes puedan consultar sus cursos adquiridos y el estado de sus solicitudes de becas.

- **Visualización de cursos:** presentación de tarjetas con información obtenida de la colección `cursoscc` y vinculada a las adquisiciones y solicitudes del usuario.
- **Seguimiento de solicitudes:** visualización de cursos asociados a solicitudes de becas pendientes, aprobadas o rechazadas.
- **Estado de adquisición:** presentación de información sobre el estado de cada curso, el método de pago y la beca correspondiente, cuando aplica.
- **Gestión de saldos:** visualización de información relacionada con las becas, los saldos pendientes y el estado de pago.
- **Acceso al curso:** habilitación del acceso cuando se cumplen las condiciones correspondientes, incluyendo adquisiciones aprobadas y becas con saldo totalmente pagado.
- **Ordenamiento:** organización de los cursos según su fecha de adquisición o registro.
- **Integración con la navegación:** incorporación de la opción *Mis cursos* para estudiantes y diferenciación de las opciones disponibles para docentes y administradores.
- **Actualización de la interfaz:** ajustes en el diseño, el ancho del contenedor y la distribución de las tarjetas para mantener la coherencia visual con el resto de la plataforma.
- **Integración con el catálogo:** contemplación de restricciones para evitar que se ofrezcan nuevamente las opciones de inscripción o solicitud de beca cuando el usuario ya adquirió el curso.

### Tecnologías utilizadas

- JavaScript (ES Modules).
- Firebase Authentication.
- Cloud Firestore.
- HTML5 y CSS3.

### Elaboración de contenidos educativos (Silvana)

Diseño y desarrollo de materiales didácticos para los cursos **Introducción a la Inteligencia Artificial** y **Machine Learning Aplicado**, destinados a la formación en Ciencias de la Computación.

- **Introducción a la Inteligencia Artificial:** elaboración de contenidos teóricos y actividades prácticas organizados.
- **Machine Learning Aplicado:** desarrollo de materiales organizados por temas y diferenciados en documentos teóricos y prácticos.
- **Material teórico:** elaboración de explicaciones conceptuales, fundamentos, metodologías y ejemplos para facilitar la comprensión progresiva de los contenidos.
- **Actividades prácticas:** diseño de ejercicios y propuestas de aplicación para relacionar los conceptos teóricos con situaciones concretas.
- **Organización modular:** estructuración de los contenidos en módulos y temas, favoreciendo una secuencia de aprendizaje gradual.
- **Generación automatizada de documentos:** utilización de Python y ReportLab para crear documentos PDF con formato uniforme, encabezados institucionales, tablas, estilos y numeración de páginas.
- **Diseño visual:** aplicación de criterios de legibilidad, jerarquía de títulos y consistencia gráfica para mantener una presentación homogénea de los materiales educativos.

**Tecnologías y herramientas utilizadas:** Python, ReportLab y generación automatizada de documentos PDF.


