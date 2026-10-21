import { auth, db } from "./firebase-config.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
  doc,
  getDoc,
  getDocs,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const contenidoAdministrador =
  document.getElementById("contenidoAdministrador");

const formPublicarCurso =
  document.getElementById("formPublicarCurso");

const mensajeCurso =
  document.getElementById("mensajeCurso");

const btnPublicarCurso =
  document.getElementById("btnPublicarCurso");

const selectCategoria =
  document.getElementById("categoria");

const contenedorModulos =
  document.getElementById("contenedorModulos");

const btnAgregarModulo =
  document.getElementById("btnAgregarModulo");

const imagenCurso =
  document.getElementById("imagenCurso");

const nombreImagenCurso =
  document.getElementById("nombreImagenCurso");

const vistaPreviaCurso =
  document.getElementById("vistaPreviaCurso");

const CLOUDINARY_CLOUD_NAME = "fd9bzuxj";
const CLOUDINARY_UPLOAD_PRESET = "ProyectoTaller";

let archivoImagenCurso = null;
let cantidadModulos = 1;
let urlVistaPrevia = null;

iniciarPagina();

/**
 * Muestra la tarjeta animada de acceso restringido y redirige al usuario.
 */
function mostrarAccesoDenegado(mensajeTexto, destinoRedireccion) {
  if (contenidoAdministrador) {
    contenidoAdministrador.classList.add("d-none");
  }

  const contenedorMensaje = document.getElementById("mensajeSinPermiso");
  if (!contenedorMensaje) return;

  contenedorMensaje.className = "container py-5";
  contenedorMensaje.classList.remove("d-none");
  contenedorMensaje.innerHTML = `
      <style>
          @keyframes entradaSmooth {
              0% { opacity: 0; transform: translateY(20px) scale(0.95); }
              100% { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes pulsoAtencion {
              0% { transform: scale(1); }
              50% { transform: scale(1.08); }
              100% { transform: scale(1); }
          }
          .card-microinteraccion {
              animation: entradaSmooth 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
              border-radius: 1rem;
              background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
          }
          .icono-alerta-animado {
              animation: pulsoAtencion 1.8s infinite ease-in-out;
              display: inline-block;
          }
      </style>
      <div class="row justify-content-center my-5">
          <div class="col-12 col-md-8 col-lg-6">
              <div class="card border-0 shadow-lg text-center p-4 card-microinteraccion">
                  <div class="card-body">
                      <div class="mb-3">
                          <span class="icono-alerta-animado p-3 rounded-circle bg-danger bg-opacity-10 text-danger fs-1">
                              <i class="bi bi-shield-lock-fill"></i>
                          </span>
                      </div>
                      <h2 class="h4 fw-bold text-dark mb-2">Acceso Restringido</h2>
                      <p class="text-secondary mb-4">${mensajeTexto}</p>
                      
                      <div class="d-flex justify-content-center align-items-center gap-2 mb-3">
                          <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                          <span class="small text-muted">Redirigiendo en unos segundos...</span>
                      </div>

                      <a href="${destinoRedireccion}" class="btn btn-primary btn-sm px-4 rounded-pill">
                          <i class="bi bi-house-door-fill me-1"></i> Ir ahora
                      </a>
                  </div>
              </div>
          </div>
      </div>
  `;

  setTimeout(() => {
    window.location.href = destinoRedireccion;
  }, 3500);
}

/**
 * Valida la sesión y el rol del usuario.
 * Permite el acceso exclusivo a administradores y docentes.
 */
function iniciarPagina() {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      mostrarAccesoDenegado("Debés iniciar sesión para publicar un curso.", "ingresar.html");
      return;
    }

    try {
      const referenciaUsuario = doc(db, "usuarios", user.uid);
      const documentoUsuario = await getDoc(referenciaUsuario);

      if (!documentoUsuario.exists()) {
        mostrarAccesoDenegado("No se encontraron datos de usuario registrados.", "catalogo.html");
        return;
      }

      const datosUsuario = documentoUsuario.data();

      const rol = (
        datosUsuario.tipoUsuario ||
        datosUsuario.rol ||
        ""
      ).toLowerCase().trim();

      if (rol.includes("admin") || rol.includes("docente")) {
        if (contenidoAdministrador) {
          contenidoAdministrador.classList.remove("d-none");
        }

        await cargarCategorias();
      } else {
        mostrarAccesoDenegado("Solo los docentes y administradores tienen acceso para crear y publicar cursos.", "catalogo.html");
      }
    } catch (error) {
      console.error("Error al validar sesión y rol:", error);
      mostrarAccesoDenegado("Ocurrió un error al verificar tus permisos de acceso.", "catalogo.html");
    }
  });
}

/**
 * Obtiene las categorías existentes en la colección cursoscc
 * y las carga en el selector del formulario.
 */
async function cargarCategorias() {
  try {
    const snapshot = await getDocs(collection(db, "cursoscc"));
    const categoriasSet = new Set();

    snapshot.forEach((documento) => {
      const curso = documento.data();
      const categoria = curso.categoria || curso.categorias;

      if (Array.isArray(categoria)) {
        categoria.forEach((nombre) => {
          if (typeof nombre === "string" && nombre.trim()) {
            categoriasSet.add(nombre.trim());
          }
        });
      } else if (
        typeof categoria === "string" &&
        categoria.trim()
      ) {
        categoriasSet.add(categoria.trim());
      }
    });

    if (!selectCategoria) return;

    selectCategoria.replaceChildren();

    const opcionInicial = document.createElement("option");
    opcionInicial.value = "";
    opcionInicial.textContent = "Seleccioná una categoría";

    selectCategoria.appendChild(opcionInicial);

    const categoriasOrdenadas =
      Array.from(categoriasSet).sort((a, b) =>
        a.localeCompare(b, "es")
      );

    categoriasOrdenadas.forEach((nombreCategoria) => {
      const opcion = document.createElement("option");

      opcion.value = nombreCategoria;
      opcion.textContent = nombreCategoria;

      selectCategoria.appendChild(opcion);
    });
  } catch (error) {
    console.error("Error al cargar las categorías:", error);

    if (selectCategoria) {
      selectCategoria.replaceChildren();

      const opcionError = document.createElement("option");
      opcionError.value = "";
      opcionError.textContent = "Error al cargar categorías";

      selectCategoria.appendChild(opcionError);
    }

    mostrarMensaje(
      "No se pudieron cargar las categorías. Intentá recargar la página.",
      "danger"
    );
  }
}

/**
 * Gestiona la selección y la vista previa de la imagen.
 */
if (imagenCurso) {
  imagenCurso.addEventListener("change", (event) => {
    const archivo = event.target.files[0];

    if (urlVistaPrevia) {
      URL.revokeObjectURL(urlVistaPrevia);
      urlVistaPrevia = null;
    }

    if (!archivo) {
      archivoImagenCurso = null;

      if (nombreImagenCurso) {
        nombreImagenCurso.textContent =
          "No se seleccionó ninguna imagen.";
      }

      if (vistaPreviaCurso) {
        vistaPreviaCurso.classList.add("d-none");
        vistaPreviaCurso.removeAttribute("src");
      }

      return;
    }

    if (!archivo.type.startsWith("image/")) {
      archivoImagenCurso = null;
      imagenCurso.value = "";

      if (nombreImagenCurso) {
        nombreImagenCurso.textContent =
          "El archivo seleccionado no es una imagen válida.";
      }

      if (vistaPreviaCurso) {
        vistaPreviaCurso.classList.add("d-none");
        vistaPreviaCurso.removeAttribute("src");
      }

      mostrarMensaje(
        "Seleccioná un archivo de imagen válido.",
        "danger"
      );

      return;
    }

    archivoImagenCurso = archivo;

    if (nombreImagenCurso) {
      nombreImagenCurso.textContent = archivo.name;
    }

    if (vistaPreviaCurso) {
      urlVistaPrevia = URL.createObjectURL(archivo);
      vistaPreviaCurso.src = urlVistaPrevia;
      vistaPreviaCurso.classList.remove("d-none");
    }
  });
}

/**
 * Agrega un módulo nuevo con campos accesibles.
 */
if (btnAgregarModulo && contenedorModulos) {
  btnAgregarModulo.addEventListener("click", () => {
    cantidadModulos++;

    const numero = cantidadModulos;
    const nuevoModulo = document.createElement("fieldset");

    nuevoModulo.className =
      "modulo-item border rounded p-3 mb-3 bg-light";

    nuevoModulo.innerHTML = `
      <legend class="visually-hidden">
        Módulo ${numero}
      </legend>

      <div class="d-flex justify-content-between align-items-center mb-2">
        <label
          for="nombreModulo${numero}"
          class="form-label fw-bold mb-0">

          Módulo ${numero}: Nombre del módulo
          <span class="text-danger" aria-hidden="true">*</span>
        </label>

        <button
          type="button"
          class="btn btn-outline-danger btn-sm btnEliminarModulo"
          aria-label="Eliminar módulo ${numero}">

          <i class="bi bi-trash3 me-1" aria-hidden="true"></i>
          Eliminar
        </button>
      </div>

      <div class="mb-3">
        <input
          type="text"
          class="form-control nombreModulo"
          id="nombreModulo${numero}"
          placeholder="Ej.: Introducción a la programación"
          required>
      </div>

      <div>
        <label
          for="temasModulo${numero}"
          class="form-label">

          Temas del módulo (un tema por línea)
          <span class="text-danger" aria-hidden="true">*</span>
        </label>

        <textarea
          class="form-control temasModulo"
          id="temasModulo${numero}"
          rows="3"
          placeholder="Variables&#10;Tipos de datos&#10;Operadores"
          required></textarea>
      </div>
    `;

    contenedorModulos.appendChild(nuevoModulo);

    const campoNombre = nuevoModulo.querySelector(".nombreModulo");
    campoNombre?.focus();
  });
}

/**
 * Elimina los módulos agregados y actualiza su numeración.
 * El primer módulo se conserva como mínimo obligatorio.
 */
if (contenedorModulos) {
  contenedorModulos.addEventListener("click", (event) => {
    const objetivo = event.target;

    if (!(objetivo instanceof Element)) return;

    const botonEliminar = objetivo.closest(".btnEliminarModulo");

    if (!botonEliminar) return;

    const modulo = botonEliminar.closest(".modulo-item");

    if (!modulo) return;

    const modulos = contenedorModulos.querySelectorAll(".modulo-item");

    if (modulos.length <= 1) {
      mostrarMensaje(
        "El curso debe tener al menos un módulo.",
        "warning"
      );
      return;
    }

    modulo.remove();

    renumerarModulos();

    const primerCampo =
      contenedorModulos.querySelector(".nombreModulo");

    primerCampo?.focus();
  });
}

/**
 * Actualiza los números de los módulos y sus etiquetas asociadas.
 */
function renumerarModulos() {
  if (!contenedorModulos) return;

  const modulos =
    contenedorModulos.querySelectorAll(".modulo-item");

  modulos.forEach((modulo, indice) => {
    const numero = indice + 1;

    const leyenda = modulo.querySelector("legend");
    const campoNombre = modulo.querySelector(".nombreModulo");
    const campoTemas = modulo.querySelector(".temasModulo");
    const botonEliminar = modulo.querySelector(".btnEliminarModulo");
    const etiquetas = modulo.querySelectorAll("label");

    if (leyenda) {
      leyenda.textContent = `Módulo ${numero}`;
    }

    if (campoNombre) {
      campoNombre.id = `nombreModulo${numero}`;
    }

    if (campoTemas) {
      campoTemas.id = `temasModulo${numero}`;
    }

    if (etiquetas[0]) {
      etiquetas[0].htmlFor = `nombreModulo${numero}`;

      etiquetas[0].innerHTML = `
        Módulo ${numero}: Nombre del módulo
        <span class="text-danger" aria-hidden="true">*</span>
      `;
    }

    if (etiquetas[1]) {
      etiquetas[1].htmlFor = `temasModulo${numero}`;
    }

    if (botonEliminar) {
      botonEliminar.setAttribute(
        "aria-label",
        `Eliminar módulo ${numero}`
      );
    }
  });

  cantidadModulos = modulos.length;
}

/**
 * Procesa los datos y guarda el curso en Firestore.
 * Los módulos se guardan en una subcolección del curso.
 */
if (formPublicarCurso) {
  formPublicarCurso.addEventListener("submit", async (event) => {
    event.preventDefault();

    const usuario = auth.currentUser;

    if (!usuario) {
      mostrarMensaje(
        "Debés iniciar sesión para crear un curso.",
        "danger"
      );
      return;
    }

    const titulo =
      document.getElementById("titulo").value.trim();

    const descripcion =
      document.getElementById("descripcion").value.trim();

    const categoria =
      selectCategoria ? selectCategoria.value : "";

    const precio =
      Number(document.getElementById("precio").value);

    const duracionHoras =
      Number(document.getElementById("duracion").value);

    const cuposDisponibles =
      Number(document.getElementById("cupos").value);

    const elementosModulos =
      contenedorModulos.querySelectorAll(".modulo-item");

    const modulos = Array.from(elementosModulos).map(
      (elemento, indice) => {
        const campoNombre =
          elemento.querySelector(".nombreModulo");

        const campoTemas =
          elemento.querySelector(".temasModulo");

        const temasArray = campoTemas
          ? campoTemas.value
              .split("\n")
              .map((tema) => tema.trim())
              .filter((tema) => tema.length > 0)
          : [];

        return {
          numero: indice + 1,
          nombre: campoNombre
            ? campoNombre.value.trim()
            : "",
          temas: temasArray
        };
      }
    );

    const modulosValidos =
      modulos.length > 0 &&
      modulos.every(
        (modulo) =>
          modulo.nombre !== "" &&
          modulo.temas.length > 0
      );

    if (
      !titulo ||
      !descripcion ||
      !categoria ||
      !Number.isFinite(precio) ||
      precio <= 0 ||
      !Number.isFinite(duracionHoras) ||
      duracionHoras <= 0 ||
      !Number.isInteger(duracionHoras) ||
      !Number.isFinite(cuposDisponibles) ||
      cuposDisponibles <= 0 ||
      !Number.isInteger(cuposDisponibles) ||
      !modulosValidos
    ) {
      mostrarMensaje(
        "Revisá los datos ingresados. Seleccioná una categoría e ingresá un nombre y al menos un tema en cada módulo.",
        "danger"
      );
      return;
    }

    btnPublicarCurso.disabled = true;

    btnPublicarCurso.innerHTML = `
      <span
        class="spinner-border spinner-border-sm"
        role="status"
        aria-hidden="true"></span>
      <span>Creando...</span>
    `;

    try {
      let imagenUrl = "";

      if (archivoImagenCurso) {
        imagenUrl =
          await subirImagenACloudinary(archivoImagenCurso);
      }

      const referenciaCurso = await addDoc(
        collection(db, "cursoscc"),
        {
          titulo: titulo,
          descripcion: descripcion,
          categoria: categoria,
          precio: precio,
          duracion_horas: duracionHoras,
          cupos_disponibles: cuposDisponibles,
          URL_imagen: imagenUrl,
          modalidad: "Virtual",
          activo: true,
          creadoPor: usuario.uid,
          creadoEn: serverTimestamp()
        }
      );

      const referenciaModulos = collection(
        db,
        "cursoscc",
        referenciaCurso.id,
        "modulos"
      );

      for (const modulo of modulos) {
        await addDoc(referenciaModulos, modulo);
      }

      mostrarMensaje(
        "El curso fue creado correctamente. Redirigiendo a administración...",
        "success"
      );

      formPublicarCurso.reset();

      archivoImagenCurso = null;

      if (urlVistaPrevia) {
        URL.revokeObjectURL(urlVistaPrevia);
        urlVistaPrevia = null;
      }

      if (nombreImagenCurso) {
        nombreImagenCurso.textContent =
          "No se seleccionó ninguna imagen.";
      }

      if (vistaPreviaCurso) {
        vistaPreviaCurso.classList.add("d-none");
        vistaPreviaCurso.removeAttribute("src");
      }

      const modulosAgregados =
        contenedorModulos.querySelectorAll(
          ".modulo-item:not(:first-child)"
        );

      modulosAgregados.forEach((modulo) => modulo.remove());

      cantidadModulos = 1;
      renumerarModulos();

      setTimeout(() => {
        window.location.href = "administrarCursos.html";
      }, 3500);

    } catch (error) {
      console.error(
        "Error al crear el curso en cursoscc:",
        error
      );

      mostrarMensaje(
        "No se pudo crear el curso. Intentá nuevamente.",
        "danger"
      );

      btnPublicarCurso.disabled = false;

      btnPublicarCurso.innerHTML = `
        <i
          class="bi bi-cloud-arrow-up-fill me-2"
          aria-hidden="true"></i>
        Crear curso
      `;
    }
  });
}

/**
 * Muestra mensajes de validación, error o confirmación.
 */
function mostrarMensaje(texto, tipo) {
  if (!mensajeCurso) return;

  mensajeCurso.textContent = texto;
  mensajeCurso.className = `alert alert-${tipo}`;
  mensajeCurso.setAttribute("role", "alert");

  mensajeCurso.style.transition =
    "transform 0.2s ease, opacity 0.2s ease";

  mensajeCurso.style.transform = "scale(1.03)";

  setTimeout(() => {
    mensajeCurso.style.transform = "scale(1)";
  }, 200);

  mensajeCurso.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}

/**
 * Sube la imagen del curso a Cloudinary y devuelve su URL.
 */
async function subirImagenACloudinary(archivo) {
  const datosFormulario = new FormData();

  datosFormulario.append("file", archivo);
  datosFormulario.append(
    "upload_preset",
    CLOUDINARY_UPLOAD_PRESET
  );

  const respuesta = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: datosFormulario
    }
  );

  if (!respuesta.ok) {
    throw new Error("No se pudo subir la imagen.");
  }

  const datos = await respuesta.json();

  if (!datos.secure_url) {
    throw new Error(
      "Cloudinary no devolvió la URL de la imagen."
    );
  }

  return datos.secure_url;
}