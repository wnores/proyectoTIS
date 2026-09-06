// js/roles.js
// Modelo de roles de usuario: define qué roles existen y qué puede hacer cada uno.
// Se basa en el campo "tipoUsuario" que ya se guarda en Firestore (colección "usuarios").

import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

// Roles.
export const ROLES = {
  ESTUDIANTE: "estudiante",
  DOCENTE: "docente",
  ADMINISTRADOR: "administrador"
};

// Permisos de cada rol. Cada clave es un permiso; el valor, los roles que lo tienen.
const PERMISOS = {
  inscribirseCursos: [ROLES.ESTUDIANTE],
  crearCursos: [ROLES.DOCENTE, ROLES.ADMINISTRADOR],
  editarCursos: [ROLES.DOCENTE, ROLES.ADMINISTRADOR],
  eliminarCursos: [ROLES.ADMINISTRADOR],
  gestionarUsuarios: [ROLES.ADMINISTRADOR],
  verPanelDocente: [ROLES.DOCENTE, ROLES.ADMINISTRADOR],
  verPanelAdmin: [ROLES.ADMINISTRADOR]
};

// ¿El rol dado tiene este permiso?
export function tienePermiso(rol, permiso) {
  const rolesConPermiso = PERMISOS[permiso];
  if (!rolesConPermiso) {
    console.warn(`Permiso desconocido: ${permiso}`);
    return false;
  }
  return rolesConPermiso.includes(rol);
}

export function esEstudiante(rol) {
  return rol === ROLES.ESTUDIANTE;
}

export function esDocente(rol) {
  return rol === ROLES.DOCENTE;
}

export function esAdministrador(rol) {
  return rol === ROLES.ADMINISTRADOR;
}

// Trae el rol (tipoUsuario) del usuario logueado actualmente, leyendo Firestore.
// Devuelve null si no hay sesión iniciada.
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
// si el usuario actual no tiene ese permiso. Útil para botones o secciones que solo deben verse para ciertos roles (ej: "Crear curso", panel de admin).
export async function aplicarVisibilidadPorRol() {
  const rol = await obtenerRolActual();
  document.querySelectorAll("[data-requiere-permiso]").forEach((el) => {
    const permiso = el.dataset.requierePermiso;
    if (!rol || !tienePermiso(rol, permiso)) {
      el.classList.add("d-none");
    }
  });
}