// middleware/auth.middleware.js
// Se usa para proteger rutas que requieren estar logueado
// (ej. inscribirse a un curso, ver el perfil, panel de administrador).
//
// Ejemplo de uso en una ruta:
//   router.post('/inscripcion', verificarToken, controller.inscribirse);

const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization']; // formato esperado: "Bearer <token>"

  if (!authHeader) {
    return res.status(401).json({ error: 'No se envió un token de autenticación.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Formato de token inválido.' });
  }

  try {
    const datosToken = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = datosToken; // { id, rol } quedan disponibles en el resto de la petición
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
}

// Middleware extra para rutas solo de administrador
function soloAdministrador(req, res, next) {
  if (req.usuario?.rol !== 'administrador') {
    return res.status(403).json({ error: 'No tenés permisos para realizar esta acción.' });
  }
  next();
}

module.exports = {
  verificarToken,
  soloAdministrador
};
