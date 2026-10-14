import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { 
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

let cancelarEscuchaNotificaciones = null;

/**
 * Actualiza los enlaces de las tarjetas en Cursos Destacados según el rol del usuario.
 * @param {string|null} rol - Rol del usuario actual ('estudiante', 'docente', 'admin', etc.)
 */
function actualizarEnlacesCursosDestacados(rol) {
  const rolLimpio = (rol || "").toLowerCase().trim();
  const esAdminODocente = rolLimpio.includes("docente") || rolLimpio.includes("admin");

  // Selecciona los enlaces de los cursos destacados (Soporta botones directos y tarjetas con enlace)
  const enlacesCursos = document.querySelectorAll('.destacados .curso-card a');

  enlacesCursos.forEach(enlace => {
    try {
      const url = new URL(enlace.href, window.location.origin);
      const cursoId = url.searchParams.get("id");

      if (cursoId) {
        if (esAdminODocente) {
          enlace.href = `contenidoCurso.html?id=${encodeURIComponent(cursoId)}`;
        } else {
          enlace.href = `descripcionDeCurso.html?id=${encodeURIComponent(cursoId)}`;
        }
      }
    } catch (e) {
      console.error("Error al actualizar enlace del curso:", e);
    }
  });
}

onAuthStateChanged(auth, async (user) => {
  const grupoIngresar = document.getElementById("grupIngresar");
  const grupoRegistrarse = document.getElementById("grupoRegistrarse");
  const grupoUsuario = document.getElementById("grupoUsuario");
  const nombreUsuario = document.getElementById("nombreUsuario");
  const menuAdminCursos = document.getElementById("menuAdminCursos");
  const menuMisCursos = document.getElementById("menuMisCursos");

  detenerNotificacionesDocente();
  
  if (user) {
    if (grupoIngresar) grupoIngresar.classList.add("d-none");
    if (grupoRegistrarse) grupoRegistrarse.classList.add("d-none");
    if (grupoUsuario) grupoUsuario.classList.remove("d-none");

    try {
      const referenciaUsuario = doc(db, "usuarios", user.uid);
      const docSnap = await getDoc(referenciaUsuario);

      if (docSnap.exists()) {
        const datosUsuario = docSnap.data();

        if (nombreUsuario) {
          const nombreCompleto =
            `${datosUsuario.nombre || ""} ${datosUsuario.apellido || ""}`.trim();

          nombreUsuario.textContent =
            nombreCompleto ||
            user.displayName ||
            user.email.split("@")[0];
        }

        const rol = (
          datosUsuario.tipoUsuario ||
          datosUsuario.rol ||
          ""
        ).toLowerCase().trim();

        const esAdminODocente =
          rol.includes("docente") ||
          rol.includes("admin");

        if (esAdminODocente) {
          iniciarNotificacionesDocente(grupoUsuario);
        } else if (rol === "estudiante") {
  iniciarNotificacionesDocente(grupoUsuario, user.uid);
        } else {
          detenerNotificacionesDocente();
        }

        // ADMINISTRAR CURSOS
        if (menuAdminCursos) {
          if (esAdminODocente) {
            menuAdminCursos.classList.remove("d-none");
          } else {
            menuAdminCursos.classList.add("d-none");
          }
        }

        // MIS CURSOS
        if (menuMisCursos) {
          if (esAdminODocente) {
            menuMisCursos.classList.add("d-none");
          } else {
            menuMisCursos.classList.remove("d-none");
          }
        }

        // ACTUALIZAR ENLACES DE TARJETAS DE CURSOS
        actualizarEnlacesCursosDestacados(rol);

      } else {
        if (nombreUsuario) {
          nombreUsuario.textContent =
            user.displayName ||
            user.email.split("@")[0];
        }

        if (menuAdminCursos) {
          menuAdminCursos.classList.add("d-none");
        }

        if (menuMisCursos) {
          menuMisCursos.classList.remove("d-none");
        }

        actualizarEnlacesCursosDestacados(null);
      }

    } catch (error) {
      console.error(
        "Error al obtener datos del usuario desde Firestore:",
        error
      );

      if (nombreUsuario) {
        nombreUsuario.textContent =
          user.displayName ||
          user.email.split("@")[0];
      }

      if (menuAdminCursos) {
        menuAdminCursos.classList.add("d-none");
      }

      if (menuMisCursos) {
        menuMisCursos.classList.remove("d-none");
      }

      actualizarEnlacesCursosDestacados(null);
    }

  } else {

    detenerNotificacionesDocente();

    if (grupoIngresar) grupoIngresar.classList.remove("d-none");
    if (grupoRegistrarse) grupoRegistrarse.classList.remove("d-none");
    if (grupoUsuario) grupoUsuario.classList.add("d-none");

    if (menuAdminCursos) {
      menuAdminCursos.classList.add("d-none");
    }

    if (menuMisCursos) {
      menuMisCursos.classList.add("d-none");
    }

    // SIN SESIÓN: Redirigir a descripción de curso
    actualizarEnlacesCursosDestacados(null);
  }
});


document.addEventListener("DOMContentLoaded", () => {

  // CERRAR SESIÓN
  const btnCerrarSesion = document.getElementById("btnCerrarSesion");

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


  // BUSCADOR
  const formBuscador = document.getElementById("formBuscador");
  const inputBuscador = document.getElementById("inputBuscador");

  if (formBuscador && inputBuscador) {

    formBuscador.addEventListener("submit", (event) => {

      event.preventDefault();

      const texto = inputBuscador.value.trim();

      if (texto) {
        window.location.href =
          `resultados.html?buscar=${encodeURIComponent(texto)}`;
      }

    });

  }

});

// NOTIFICACIÓN DOCENTE
function iniciarNotificacionesDocente(grupoUsuario, estudianteUid = null) {

  if (!grupoUsuario) {
    return;
  }

  detenerNotificacionesDocente();


  let grupoNotificaciones =
    document.getElementById("grupoNotificaciones");


  if (!grupoNotificaciones) {

    grupoNotificaciones =
      document.createElement("div");

    grupoNotificaciones.id =
      "grupoNotificaciones";

    grupoNotificaciones.className =
      "dropdown me-2";


    grupoNotificaciones.innerHTML = `
      <button
        class="btn btn-outline-light btn-sm position-relative"
        type="button"
        id="dropdownNotificaciones"
        data-bs-toggle="dropdown"
        data-bs-auto-close="outside"
        aria-expanded="false"
        aria-label="Notificaciones"
      >
        <i class="bi bi-bell-fill fs-5"></i>

        <span
          id="contadorNotificaciones"
          class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger d-none"
        >
          0
        </span>
      </button>

      <div
        id="listaNotificaciones"
        class="dropdown-menu dropdown-menu-end shadow p-0"
        aria-labelledby="dropdownNotificaciones"
        style="width: 340px; max-height: 420px; overflow-y: auto;"
      >
        <div class="p-3 border-bottom">
          <h2 class="h6 mb-0">
            <i class="bi bi-bell me-2"></i>
            Notificaciones
          </h2>
        </div>

        <div
          id="contenidoNotificaciones"
          class="p-2"
        >
          <p class="text-muted text-center small mb-0 p-3">
            Cargando notificaciones...
          </p>
        </div>
      </div>
    `;


    grupoUsuario.parentNode.insertBefore(
      grupoNotificaciones,
      grupoUsuario
    );
  }


  grupoNotificaciones.classList.remove("d-none");


  const referenciaNotificaciones =
    collection(db, "notificaciones");


  const consultaNotificaciones =
    query(
      referenciaNotificaciones,
      where (estudianteUid ? "destinatarioId" : "destinatarioRol",
      "==",
      estudianteUid || "docente/admin"
      )
    );
cancelarEscuchaNotificaciones = onSnapshot(
    consultaNotificaciones,
    (resultado) => {
      const notificaciones = resultado.docs
        .map((documento) => ({
          id: documento.id,
          ...documento.data()
        }))
        .filter((notificacion) =>
          notificacion.leida === false &&
          (
            estudianteUid
              ? notificacion.destinatarioId === estudianteUid
              : notificacion.destinatarioRol === "docente/admin"
          )
        );

      notificaciones.sort((a, b) =>
        obtenerMilisegundos(b.fechaCreacion) -
        obtenerMilisegundos(a.fechaCreacion)
      );

      mostrarNotificacionesDocente(notificaciones);
    },
    (error) => {
      console.error("Error al escuchar las notificaciones:", error);

      const contenido = document.getElementById(
        "contenidoNotificaciones"
      );

      if (contenido) {
        contenido.innerHTML = `
          <p class="text-danger small mb-0 p-3">
            No se pudieron cargar las notificaciones.
          </p>
        `;
      }
    }
  );
}


// MOSTRAR NOTIFICACIONES
function mostrarNotificacionesDocente(
  notificaciones
) {

  const contador =
    document.getElementById(
      "contadorNotificaciones"
    );

  const contenido =
    document.getElementById(
      "contenidoNotificaciones"
    );


  if (!contador || !contenido) {
    return;
  }


  contador.textContent =
    notificaciones.length;


  if (notificaciones.length === 0) {

    contador.classList.add("d-none");

    contenido.innerHTML = `
      <p class="text-muted text-center small mb-0 p-3">
        No hay notificaciones nuevas.
      </p>
    `;

    return;
  }

  contador.classList.remove("d-none");

  contenido.replaceChildren();


  notificaciones.forEach(
    (notificacion) => {

      const boton =
        document.createElement("button");

      boton.type = "button";

      boton.className =
        "dropdown-item text-wrap border-bottom p-3";


      const encabezado =
        document.createElement("div");

      encabezado.className =
        "d-flex align-items-start gap-2";


      const icono =
        document.createElement("i");

      icono.className =
        "bi bi-chat-left-text-fill text-primary mt-1";


      const datos =
        document.createElement("div");

      datos.className =
        "flex-grow-1";


      const titulo =
        document.createElement("p");

      titulo.className =
        "fw-bold mb-1";

      titulo.textContent =
        notificacion.titulo ||
        "Nueva publicación";


      const detalle =
        document.createElement("p");

      detalle.className =
        "small mb-1";

      if (notificacion.tipo === "calificacion") {
        detalle.textContent =
          `${notificacion.cursoTitulo || "Tu curso"}: recibiste ` +
          `${notificacion.nota}/10 en la Actividad Final Integradora. Ver actividad.`;

      } else if (notificacion.tipo === "entrega") {
        detalle.textContent =
          `${notificacion.autorNombre || "Un estudiante"} envió una entrega en ` +
          `${notificacion.cursoTitulo || "un curso"}. Abrí la actividad para revisar y calificar.`;

      } else {
        detalle.textContent =
          `${notificacion.autorNombre || "Estudiante"} publicó en ` +
          `${notificacion.cursoTitulo || "un curso"}.`;
      }


      const fecha =
        document.createElement("p");

      fecha.className =
        "small text-muted mb-0";

      fecha.textContent =
        formatearFechaNotificacion(
          notificacion.fechaCreacion
        );


      datos.appendChild(titulo);
      datos.appendChild(detalle);
      datos.appendChild(fecha);

      encabezado.appendChild(icono);
      encabezado.appendChild(datos);

      boton.appendChild(encabezado);


      boton.addEventListener(
        "click",
        async () => {

          try {

            await updateDoc(
              doc(
                db,
                "notificaciones",
                notificacion.id
              ),
              {
                leida: true,
                fechaLectura:
                  serverTimestamp()
              }
            );

          } catch (error) {

            console.error(
              "No se pudo marcar la notificación como leída:",
              error
            );
          }


          window.location.href =
            notificacion.enlace ||
            `foroCurso.html?curso=${encodeURIComponent(notificacion.cursoId)}`;
        }
      );


      contenido.appendChild(boton);
    }
  );
}


// DETENER NOTIFICACIONES
function detenerNotificacionesDocente() {

  if (cancelarEscuchaNotificaciones) {

    cancelarEscuchaNotificaciones();

    cancelarEscuchaNotificaciones =
      null;
  }


  const grupoNotificaciones =
    document.getElementById(
      "grupoNotificaciones"
    );


  if (grupoNotificaciones) {
    grupoNotificaciones.classList.add(
      "d-none"
    );
  }
}


// OBTENER FECHA EN MILISEGUNDOS
function obtenerMilisegundos(fecha) {

  if (!fecha) {
    return 0;
  }


  if (
    typeof fecha.toMillis === "function"
  ) {
    return fecha.toMillis();
  }


  if (
    typeof fecha.toDate === "function"
  ) {
    return fecha.toDate().getTime();
  }


  return new Date(fecha).getTime();
}


// FORMATEAR FECHA DE NOTIFICACIÓN
function formatearFechaNotificacion(fecha) {

  if (!fecha) {
    return "Ahora";
  }


  let fechaJavaScript;


  if (
    typeof fecha.toDate === "function"
  ) {
    fechaJavaScript =
      fecha.toDate();

  } else {
    fechaJavaScript =
      new Date(fecha);
  }


  return fechaJavaScript.toLocaleString(
    "es-UY",
    {
      dateStyle: "short",
      timeStyle: "short"
    }
  );
}