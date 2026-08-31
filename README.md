Proyecto TIS
Taller Integrador de Sistemas

Sitio web de gestión de cursos sobre ciencias de la computación.

Nombre del sitio: Cursos CC

Institución: CERP Salto - Uruguay

Equipo:

Ercila Giovanna

Nores Walter

Ottonelli Silvana

Rosales Anny

Techera Marilina

Perfil: Estudiantes de 3.º año del Profesorado Semipresencial (Especialidad Informática)

Configuración y Tecnologías Utilizadas
Formspree: Servicio en línea para procesar los formularios de contacto y becas, enviando las consultas al correo grupal sin necesidad de servidor propio.

Correo Grupal: tallercerpsalto@gmail.com (utilizado para Formspree y Firebase).

Firebase (Proyecto BDCursos): Base de datos NoSQL alojada en la nube para sincronización en tiempo real.

Firestore: Creación de colecciones para datos del sitio.

Authentication: Registro, acceso y autenticación de usuarios.

Sprint 1 (10/08/2026 – 30/08/2026)
Base del Proyecto (12/08)
Página principal (index.html): Menú de navegación, footer persistente en todo el sitio e imagen de portada generada con IA (Gemini). (Nota: El botón de ingreso no se muestra en ingresar.html ni en registrarse.html).

Estructura del Menú y Páginas Desarrolladas:

acercaDe.html (Walter): Propósito de la página, creadores, público objetivo y resumen de contenidos.

catalogo.html (Giovanna): Catálogo dinámico de cursos desde la base de datos con tarjeta descriptiva y enlace a detalles.

descripcionDeCurso.html (Giovanna): Detalle dinámico según id en la URL (ej. ?id=3). Carga 10 cursos reales organizados por categorías (Programación, Inteligencia Artificial, Bases de Datos, Ofimática, Hardware/Electrónica) con imagen real o ícono de respaldo.

beca.html (Anny): Explicación del sistema de becas, requisitos, beneficios y formulario de solicitud usando componentes Bootstrap.

contacto.html (Marilina): Datos de contacto (WhatsApp, horarios, dirección) y formulario de consultas.

ingresar.html: Formulario de acceso para usuarios registrados (estudiante o docente/admin).

registrarse.html (Marilina): Registro de usuarios estándar (estudiante). Conexión directa a Firestore y Firebase Auth. Validaciones aplicadas:

Todos los campos obligatorios.

Formato de cédula (solo números, sin puntos ni guiones).

Correo válido y no duplicado.

Contraseña segura (mayúsculas, minúsculas y al menos un número) con confirmación de coincidencia.

Carga temporal de imagen de perfil.

Inicio de sesión automático tras registro exitoso.

politicaDePrivacidad.html (Anny): Normativa sobre protección de datos personales y derecho de uso de contenidos adaptada a Uruguay.

Aportes Frontend – Anny
Página de Becas: Maquetación con Bootstrap, inclusión de secciones explicativas, formulario de solicitud y corrección de anidamientos en estructuras HTML.

Política de Privacidad: Maquetación responsiva con Bootstrap integrando términos legales del contexto local.

Diseño Responsive: Adaptación visual con Bootstrap y media queries adicionales para celulares, tablets y escritorio.

Sprint 2 (31/08/2026 – 20/09/2026)
Iniciar sesión (ingresar.html): Formulario y lógica de autenticación (Walter).

Cerrar sesión: Gestión de cierre de sesión (Giovanna).

Ver / Modificar perfil (perfil.html): Consulta y actualización de datos de usuario (Silvana).

Recuperar contraseña (recuperar_password): Flujo de restablecimiento de contraseña (Anny).

Sprint 3 (28/09/2026 – 11/10/2026)
(En desarrollo)

Sprint 4 (12/10/2026 – 23/10/2026)
(En desarrollo)

Pendientes y Próximos Pasos
Carrito de compras.

Flujo e integración de pago.
