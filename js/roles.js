// js/roles.js
// Modelo de roles de usuario. Se basa en el campo "tipoUsuario" guardado en Firestore.

import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

// Mapeo exacto con los valores guardados en la base de datos
export const ROLES = {
  ESTUDIANTE: "estudiante",
  DOCENTE_ADMIN: "docente/admin" 
};

// Permisos del sistema
const PERMISOS = {
  comprarCursos: [ROLES.ESTUDIANTE],
  accederContenidoCurso: [ROLES.ESTUDIANTE, ROLES.DOCENTE_ADMIN],
  obtenerCertificado: [ROLES.ESTUDIANTE],
  crearCursos: [ROLES.DOCENTE_ADMIN],
  editarCursos: [ROLES.DOCENTE_ADMIN],
  eliminarCursos: [ROLES.DOCENTE_ADMIN],
  gestionarCuentasEstudiantes: [ROLES.DOCENTE_ADMIN],
  verPanelAdmin: [ROLES.DOCENTE_ADMIN]
};

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

export function esDocenteAdmin(rol) {
  return rol === ROLES.DOCENTE_ADMIN;
}

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

export async function aplicarVisibilidadPorRol() {
  const rol = await obtenerRolActual();
  document.querySelectorAll("[data-requiere-permiso]").forEach((el) => {
    if (!tienePermiso(rol, el.dataset.requierePermiso)) {
      el.classList.add("d-none");
    }
  });
}