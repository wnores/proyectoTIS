# Backend - Proyecto TIS (venta de cursos)

Backend en Node.js + Express + MySQL para la página de venta de cursos informáticos.

## Estructura de carpetas

```
backend/
├── server.js              # Punto de entrada del servidor
├── package.json
├── .env.example            # Plantilla de variables de entorno
├── config/
│   └── db.js               # Conexión a MySQL
├── database/
│   └── schema.sql          # Script para crear la base de datos y las tablas
├── models/                 # Consultas SQL (una función por acción)
│   ├── usuario.model.js
│   ├── curso.model.js
│   ├── beca.model.js
│   └── contacto.model.js
├── controllers/            # Lógica de cada endpoint
│   ├── auth.controller.js
│   ├── cursos.controller.js
│   ├── beca.controller.js
│   └── contacto.controller.js
├── routes/                 # Define las URLs de la API
│   ├── auth.routes.js
│   ├── cursos.routes.js
│   ├── beca.routes.js
│   └── contacto.routes.js
└── middleware/
    └── auth.middleware.js  # Protege rutas que requieren login
```

## Pasos para levantarlo (en VS Code)

1. **Instalar dependencias**
   ```
   cd backend
   npm install
   ```

2. **Crear la base de datos**
   - Abrir MySQL (Workbench, XAMPP, o consola).
   - Ejecutar el contenido de `database/schema.sql`. Esto crea la base `proyecto_tis`, las tablas y algunos cursos de ejemplo.

3. **Configurar variables de entorno**
   - Copiar `.env.example` y renombrarlo a `.env`.
   - Completar `DB_PASSWORD` con tu contraseña de MySQL, y `JWT_SECRET` con cualquier texto largo.

4. **Levantar el servidor**
   ```
   npm start
   ```
   Si instalaste nodemon (`npm install -D nodemon`), podés usar `npm run dev` para que se reinicie solo al guardar cambios.

5. **Probar que funciona**
   - Abrir en el navegador: `http://localhost:3000/api/health`
   - Debería responder: `{"estado":"ok","mensaje":"Backend funcionando correctamente."}`

## Endpoints disponibles

| Método | Ruta                  | Descripción                                  | Body (JSON)                                   |
|--------|-----------------------|-----------------------------------------------|------------------------------------------------|
| POST   | /api/auth/registro    | Registra un usuario nuevo                      | `{ nombre, apellido, email, contrasena }`       |
| POST   | /api/auth/login       | Inicia sesión y devuelve un token              | `{ email, contrasena }`                         |
| GET    | /api/cursos           | Lista todos los cursos (para catalogo.html)    | -                                                |
| GET    | /api/cursos/:id       | Devuelve un curso puntual (para descripcionDeCurso.html) | -                                     |
| POST   | /api/becas            | Envía una solicitud de beca (para beca.html)   | `{ nombre, email, cursoId, motivo }`            |
| POST   | /api/contacto         | Envía un mensaje de contacto (para contacto.html) | `{ nombre, email, mensaje }`                 |

## Cómo lo conecta el Frontend

Ejemplo, para traer los cursos en `catalogo.html`, en el JS del frontend:

```javascript
fetch('http://localhost:3000/api/cursos')
  .then(res => res.json())
  .then(cursos => {
    console.log(cursos);
    // acá se recorre "cursos" y se genera el HTML dinámicamente
  });
```

Ejemplo de registro desde `registrarse.html`:

```javascript
fetch('http://localhost:3000/api/auth/registro', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ nombre, apellido, email, contrasena })
})
  .then(res => res.json())
  .then(data => console.log(data));
```

## Pendiente (más adelante, según lo vaya pidiendo el profesor)

- Carrito de compras y confirmación de pago (tablas `carrito` y lógica de pago).
- Endpoint de inscripción a curso (usa la tabla `inscripciones`, ya creada en el schema).
- Panel de administrador para gestionar cursos y usuarios.
- Recuperación de contraseña por email.

## Cómo subir esto a tu rama

1. Copiar la carpeta `backend/` a la raíz de tu clon del repositorio `wnores/proyectoTIS`.
2. Verificar que estás parada en tu rama: `git checkout tu-rama`
3. `git add backend/`
4. `git commit -m "Agrega estructura inicial del backend (auth, cursos, beca, contacto)"`
5. `git push origin tu-rama`
6. Crear el Pull Request desde GitHub para que el equipo lo revise.
