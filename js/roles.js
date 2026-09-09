// js/roles.js
// Modelo de roles de usuario. Se basa en el campo "tipoUsuario" que ya se
// guarda en Firestore (colección "usuarios").
//
// Tipos de usuario del proyecto:
// - Visitante: no tiene sesión iniciada. No se guarda como valor en la base,
//   es simplemente la ausencia de sesión (usuario === null).
// - Estudiante: usuario registrado. Compra cursos, accede a sus contenidos
//   y obtiene certificados.
// - Administrador: gestiona y supervisa toda la plataforma (alta, edición y
//   baja de cursos; habilitar/deshabilitar cuentas de estudiantes; control
//   general del sistema).

import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

// Los roles posibles en el sistema (no incluye "visitante": eso es null).
export const ROLES = {
  ESTUDIANTE: "estudiante",
  ADMINISTRADOR: "administrador"
};

// Qué puede hacer cada rol. Cada clave es un permiso; el valor, los roles que lo tienen.
const PERMISOS = {
  comprarCursos: [ROLES.ESTUDIANTE],
  accederContenidoCurso: [ROLES.ESTUDIANTE],
  obtenerCertificado: [ROLES.ESTUDIANTE],
  crearCursos: [ROLES.ADMINISTRADOR],
  editarCursos: [ROLES.ADMINISTRADOR],
  eliminarCursos: [ROLES.ADMINISTRADOR],
  gestionarCuentasEstudiantes: [ROLES.ADMINISTRADOR],
  verPanelAdmin: [ROLES.ADMINISTRADOR]
};

// ¿El rol dado tiene este permiso? (rol === null significa visitante: nunca tiene permisos)
export function tienePermiso(rol, permiso) {
  const rolesConPermiso = PERMISOS[permiso];
  if (!rolesConPermiso) {
    console.warn(`Permiso desconocido: ${permiso}`);
    return false;
  }
  return rolesConPermiso.includes(rol);
}

export function esVisitante(rol) {
  return rol === null;
}

export function esEstudiante(rol) {
  return rol === ROLES.ESTUDIANTE;
}

export function esAdministrador(rol) {
  return rol === ROLES.ADMINISTRADOR;
}

// Trae el rol (tipoUsuario) del usuario logueado actualmente, leyendo Firestore.
// Devuelve null si no hay sesión iniciada (visitante).
export function obtenerRolActual() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (usuario) => {
      if (!usuario) {
        resolve(null);
        return;
      }
      try {
        const perfilSnap = await getDoc(doc(db, "usuarios", usuario.uid));
        if (perfilSnap.exists()) {
          resolve(perfilSnap.data().tipoUsuario ?? ROLES.ESTUDIANTE);
        } else {
          resolve(null);
        }
      } catch (error) {
        console.error("No se pudo obtener el rol del usuario:", error);
        resolve(null);
      }
    });
  });
}

// Oculta cualquier elemento con data-requiere-permiso="nombreDelPermiso"
// si el usuario actual (o un visitante sin sesión) no tiene ese permiso.
export async function aplicarVisibilidadPorRol() {
  const rol = await obtenerRolActual();
  document.querySelectorAll("[data-requiere-permiso]").forEach((el) => {
    if (!tienePermiso(rol, el.dataset.requierePermiso)) {
      el.classList.add("d-none");
    }
  });
}