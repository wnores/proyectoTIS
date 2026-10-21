import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { doc, getDoc, collection, query, where, onSnapshot, updateDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

let desuscripcionNotificaciones = null;

document.addEventListener("DOMContentLoaded", () => {
    configurarNavegacionUsuario();
});

function configurarNavegacionUsuario() {
    const elementosDesconectado = document.querySelectorAll(".logged-out, #grupIngresar, #grupoRegistrarse");
    const elementosConectado = document.querySelectorAll(".logged-in, #grupoUsuario, #grupoNotificaciones");
    
    const nombreUsuario = document.getElementById("nombreUsuario");
    const btnCerrarSesion = document.getElementById("btnCerrarSesion");

    const itemMisCursos = document.getElementById("menuMisCursos");
    const itemAdminCursos = document.getElementById("menuAdminCursos");
    const itemsRequierenAdmin = document.querySelectorAll('[data-requiere-permiso="verPanelAdmin"]');

    onAuthStateChanged(auth, async (user) => {
        let rolUsuario = "estudiante";

        if (desuscripcionNotificaciones) {
            desuscripcionNotificaciones();
            desuscripcionNotificaciones = null;
        }

        if (user) {
            elementosDesconectado.forEach(el => el.classList.add("d-none"));
            elementosConectado.forEach(el => el.classList.remove("d-none"));

            try {
                const userDocRef = doc(db, "usuarios", user.uid);
                const userSnap = await getDoc(userDocRef);

                if (userSnap.exists()) {
                    const datosUsuario = userSnap.data();
                    rolUsuario = (datosUsuario.tipoUsuario || datosUsuario.rol || "").toLowerCase().trim();
                    const nombreCompleto = `${datosUsuario.nombre || ""} ${datosUsuario.apellido || ""}`.trim() || user.email;

                    if (nombreUsuario) {
                        nombreUsuario.textContent = nombreCompleto;
                    }

                    const esDocenteOAdmin = rolUsuario.includes("admin") || rolUsuario.includes("docente");

                    if (esDocenteOAdmin) {
                        if (itemMisCursos) itemMisCursos.classList.add("d-none");
                        if (itemAdminCursos) itemAdminCursos.classList.remove("d-none");
                        itemsRequierenAdmin.forEach(el => el.classList.remove("d-none"));
                    } else {
                        if (itemMisCursos) itemMisCursos.classList.remove("d-none");
                        if (itemAdminCursos) itemAdminCursos.classList.add("d-none");
                        itemsRequierenAdmin.forEach(el => el.classList.add("d-none"));
                    }
                } else {
                    if (nombreUsuario) nombreUsuario.textContent = user.displayName || user.email;
                }
            } catch (error) {
                console.error("Error al cargar datos de navegación del usuario:", error);
                if (nombreUsuario) nombreUsuario.textContent = user.displayName || user.email;
            }

            escucharNotificaciones(user.uid, rolUsuario);

        } else {
            elementosDesconectado.forEach(el => el.classList.remove("d-none"));
            elementosConectado.forEach(el => el.classList.add("d-none"));
            
            if (itemMisCursos) itemMisCursos.classList.add("d-none");
            if (itemAdminCursos) itemAdminCursos.classList.add("d-none");
            itemsRequierenAdmin.forEach(el => el.classList.add("d-none"));
        }

        actualizarEnlacesTarjetasCurso(rolUsuario);
    });

    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener("click", async () => {
            try {
                await signOut(auth);
                window.location.href = "index.html";
            } catch (error) {
                console.error("Error al cerrar sesión:", error);
            }
        });
    }
}

function escucharNotificaciones(uid, rol) {
    const esDocenteOAdmin = rol.includes("admin") || rol.includes("docente");
    const notificacionesRef = collection(db, "notificaciones");

    let consulta;
    if (esDocenteOAdmin) {
        consulta = query(notificacionesRef, where("destinatarioRol", "==", "docente/admin"));
    } else {
        consulta = query(notificacionesRef, where("destinatarioUid", "==", uid));
    }

    desuscripcionNotificaciones = onSnapshot(consulta, (snapshot) => {
        const notificaciones = [];
        snapshot.forEach((docSnap) => {
            notificaciones.push({ id: docSnap.id, ...docSnap.data() });
        });

        notificaciones.sort((a, b) => {
            const fechaA = a.fechaCreacion?.toMillis() || 0;
            const fechaB = b.fechaCreacion?.toMillis() || 0;
            return fechaB - fechaA;
        });

        renderizarNotificaciones(notificaciones);
    }, (error) => {
        console.error("Error al consultar notificaciones en tiempo real:", error);
    });
}

function renderizarNotificaciones(notificaciones) {
    const contador = document.getElementById("contadorNotificaciones");
    const lista = document.getElementById("listaNotificaciones");

    if (!lista) return;

    lista.innerHTML = `
        <li class="dropdown-header fw-bold text-dark">Notificaciones</li>
        <li><hr class="dropdown-divider"></li>
    `;

    const sinLeer = notificaciones.filter(n => n.leida !== true);

    if (contador) {
        if (sinLeer.length > 0) {
            contador.textContent = sinLeer.length;
            contador.classList.remove("d-none");
        } else {
            contador.classList.add("d-none");
            contador.textContent = "0";
        }
    }

    if (notificaciones.length === 0) {
        lista.innerHTML += `<li class="text-center text-muted p-2 small" id="sinNotificaciones">No tenés notificaciones</li>`;
        return;
    }

    notificaciones.forEach((notif) => {
        const li = document.createElement("li");
        const enlace = notif.enlace || "#";
        const estiloTexto = notif.leida ? "text-muted bg-light" : "fw-bold";

        li.innerHTML = `
            <a class="dropdown-item py-2 px-3 ${estiloTexto}" href="${enlace}" data-id="${notif.id}">
                <div class="d-flex flex-column">
                    <span class="small">${notif.titulo || "Notificación"}</span>
                    <span class="text-secondary small fw-normal">${notif.mensaje || ""}</span>
                </div>
            </a>
        `;

        const enlaceElem = li.querySelector("a");

        enlaceElem.addEventListener("click", async (e) => {
            if (!notif.leida) {
                e.preventDefault();

                notif.leida = true;
                const pendientesRestantes = notificaciones.filter(n => n.leida !== true).length;

                if (contador) {
                    if (pendientesRestantes > 0) {
                        contador.textContent = pendientesRestantes;
                    } else {
                        contador.classList.add("d-none");
                        contador.textContent = "0";
                    }
                }

                try {
                    const docRef = doc(db, "notificaciones", notif.id);
                    await updateDoc(docRef, { leida: true });
                } catch (err) {
                    console.error("Error al marcar notificación como leída:", err);
                }

                if (enlace && enlace !== "#") {
                    window.location.href = enlace;
                }
            }
        });

        lista.appendChild(li);
    });
}

function actualizarEnlacesTarjetasCurso(rol) {
    const esDocenteOAdmin = rol.includes("admin") || rol.includes("docente");
    const botonesVerCurso = document.querySelectorAll(".destacados .btn-primary, .curso-card a.btn");

    botonesVerCurso.forEach((boton) => {
        const url = new URL(boton.href, window.location.origin);
        const cursoId = url.searchParams.get("id") || url.searchParams.get("curso");

        if (cursoId) {
            if (esDocenteOAdmin) {
                boton.href = `contenidoCurso.html?id=${cursoId}`;
            } else {
                boton.href = `descripcionDeCurso.html?id=${cursoId}`;
            }
        }
    });
}