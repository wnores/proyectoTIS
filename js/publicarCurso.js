import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { 
  doc, 
  getDoc, 
  getDocs, 
  collection, 
  addDoc, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const contenidoAdministrador = document.getElementById("contenidoAdministrador");  
const formPublicarCurso = document.getElementById("formPublicarCurso");
const mensajeCurso = document.getElementById("mensajeCurso");
const btnPublicarCurso = document.getElementById("btnPublicarCurso");
const selectCategoria = document.getElementById("categoria");
const contenedorModulos = document.getElementById("contenedorModulos");
const btnAgregarModulo = document.getElementById("btnAgregarModulo");

const imagenCurso = document.getElementById("imagenCurso");
const nombreImagenCurso = document.getElementById("nombreImagenCurso");
const vistaPreviaCurso = document.getElementById("vistaPreviaCurso");

const CLOUDINARY_CLOUD_NAME = "fd9bzuxj";
const CLOUDINARY_UPLOAD_PRESET = "ProyectoTaller";

let archivoImagenCurso = null;
let cantidadModulos = 1;

iniciarPagina();

function iniciarPagina() {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      alert("Debés iniciar sesión para acceder.");
      window.location.href = "ingresar.html";
      return;
    }

    try {
      const docRef = doc(db, "usuarios", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const datos = docSnap.data();
        const rol = (datos.tipoUsuario || datos.rol || "").toLowerCase().trim();

        if (rol.includes("admin") || rol.includes("docente")) {
          if (contenidoAdministrador) {
            contenidoAdministrador.classList.remove("d-none");
          }
          await cargarCategorias();
        } else {
          alert("No tenés permiso para crear cursos.");
          window.location.href = "catalogo.html";
        }
      } else {
        window.location.href = "catalogo.html";
      }
    } catch (error) {
      console.error("Error al validar sesión y rol:", error);
      window.location.href = "catalogo.html";
    }
  });
}

/**
 * Obtiene todas las categorías únicas de la colección 'cursoscc' y llena el selector
 */
async function cargarCategorias() {
  try {
    const snapshot = await getDocs(collection(db, "cursoscc"));
    const categoriasSet = new Set();

    snapshot.forEach((docSnap) => {
      const curso = docSnap.data();
      const cat = curso.categoria || curso.categorias;
      if (cat) {
        if (Array.isArray(cat)) {
          cat.forEach((c) => c && categoriasSet.add(c.trim()));
        } else if (typeof cat === "string") {
          categoriasSet.add(cat.trim());
        }
      }
    });

    if (selectCategoria) {
      selectCategoria.innerHTML = '<option value="">Seleccioná una categoría</option>';
      const categoriasOrdenadas = Array.from(categoriasSet).sort();
      categoriasOrdenadas.forEach((catNombre) => {
        const opcionCat = document.createElement("option");
        opcionCat.value = catNombre;
        opcionCat.textContent = catNombre;
        selectCategoria.appendChild(opcionCat);
      });
    }
  } catch (error) {
    console.error("Error al cargar las categorías:", error);
    if (selectCategoria) {
      selectCategoria.innerHTML = '<option value="">Error al cargar categorías</option>';
    }
  }
}

if (imagenCurso) {
  imagenCurso.addEventListener("change", (event) => {
    const archivo = event.target.files[0];

    if (!archivo) {
      archivoImagenCurso = null;
      if (nombreImagenCurso) nombreImagenCurso.textContent = "No se seleccionó ninguna imagen.";
      if (vistaPreviaCurso) {
        vistaPreviaCurso.classList.add("d-none");
        vistaPreviaCurso.removeAttribute("src");
      }
      return;
    }

    archivoImagenCurso = archivo;
    if (nombreImagenCurso) nombreImagenCurso.textContent = archivo.name;

    if (vistaPreviaCurso) {
      vistaPreviaCurso.src = URL.createObjectURL(archivo);
      vistaPreviaCurso.classList.remove("d-none");
    }
  });
}

// Agregar un nuevo módulo dinámicamente
if (btnAgregarModulo) {
  btnAgregarModulo.addEventListener("click", () => {
    cantidadModulos++;

    const nuevoModulo = document.createElement("div");
    nuevoModulo.className = "modulo-item border rounded p-3 mb-3 bg-light";

    nuevoModulo.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-2">
        <label class="form-label fw-bold mb-0">
          Módulo ${cantidadModulos}: Nombre del módulo <span class="text-danger">*</span>
        </label>
        <button type="button" class="btn btn-outline-danger btn-sm btnEliminarModulo">
          <i class="bi bi-trash3 me-1"></i>
          Eliminar
        </button>
      </div>
      <div class="mb-2">
        <input type="text" class="form-control nombreModulo" placeholder="Ej.: Introducción a la programación" required>
      </div>
      <div>
        <label class="form-label">
          Temas del módulo (un tema por línea) <span class="text-danger">*</span>
        </label>
        <textarea class="form-control temasModulo" rows="3" placeholder="Variables&#10;Tipos de datos&#10;Operadores" required></textarea>
      </div>
    `;

    contenedorModulos.appendChild(nuevoModulo);
  });
}

// Eliminar módulo del DOM y renumerar
if (contenedorModulos) {
  contenedorModulos.addEventListener("click", (event) => {
    const botonEliminar = event.target.closest(".btnEliminarModulo");
    if (!botonEliminar) return;

    const modulo = botonEliminar.closest(".modulo-item");
    modulo.remove();

    renumerarModulos();
  });
}

function renumerarModulos() {
  const modulos = contenedorModulos.querySelectorAll(".modulo-item");

  modulos.forEach((modulo, indice) => {
    const etiqueta = modulo.querySelector("label");
    if (etiqueta) {
      etiqueta.innerHTML = `
        Módulo ${indice + 1}: Nombre del módulo <span class="text-danger">*</span>
      `;
    }
  });

  cantidadModulos = modulos.length;
}

// Procesamiento del formulario y guardado en la colección 'cursoscc'
if (formPublicarCurso) {
  formPublicarCurso.addEventListener("submit", async (event) => {
    event.preventDefault();

    const usuario = auth.currentUser;
    if (!usuario) {
      mostrarMensaje("Debés iniciar sesión para crear un curso.", "danger");
      return;
    }

    const titulo = document.getElementById("titulo").value.trim();
    const descripcion = document.getElementById("descripcion").value.trim();
    const categoria = selectCategoria ? selectCategoria.value : "";
    const precio = Number(document.getElementById("precio").value);
    const duracionHoras = Number(document.getElementById("duracion").value);
    const cuposDisponibles = Number(document.getElementById("cupos").value);

    // Mapeo del campo 'módulo' y la conversión de temas a array de cadenas
    const itemsModulos = contenedorModulos.querySelectorAll(".modulo-item");
    
    const modulos = Array.from(itemsModulos).map((item, indice) => {
      const nombreInput = item.querySelector(".nombreModulo");
      const temasTextarea = item.querySelector(".temasModulo");

      const temasArray = temasTextarea ? temasTextarea.value
        .split("\n")
        .map((tema) => tema.trim())
        .filter((tema) => tema.length > 0) : [];

      return {
        numero: indice + 1,
        nombre: nombreInput ? nombreInput.value.trim() : "",
        temas: temasArray
      };
    });

    const modulosValidos = modulos.length > 0 && modulos.every(
      (m) => m.nombre !== "" && m.temas.length > 0
    );

    if (
      !titulo ||
      !descripcion ||
      !categoria ||
      precio <= 0 ||
      duracionHoras <= 0 ||
      cuposDisponibles <= 0 ||
      !modulosValidos
    ) {
      mostrarMensaje("Revisá los datos ingresados en el formulario. Asegurate de seleccionar una categoría e ingresar al menos un tema por módulo.", "danger");
      return;
    }

    btnPublicarCurso.disabled = true;
    btnPublicarCurso.innerHTML = `
      <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
      Creando...
    `;

    try {
      let imagenUrl = "";
      if (archivoImagenCurso) {
        imagenUrl = await subirImagenACloudinary(archivoImagenCurso);
      }

      // Guardado principal en la colección 'cursoscc'
      const referenciaCurso = await addDoc(collection(db, "cursoscc"), {
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
      });

      // Guardado de subcolección 'modulos' dentro del documento de la colección 'cursoscc'
      const referenciaModulos = collection(
        db,
        "cursoscc",
        referenciaCurso.id,
        "modulos"
      );

      for (const modulo of modulos) {
        await addDoc(referenciaModulos, modulo);
      }

      mostrarMensaje("El curso fue creado correctamente en 'cursoscc'. Redirigiendo a administración...", "success");

      formPublicarCurso.reset();

      archivoImagenCurso = null;
      if (nombreImagenCurso) nombreImagenCurso.textContent = "No se seleccionó ninguna imagen.";
      if (vistaPreviaCurso) {
        vistaPreviaCurso.classList.add("d-none");
        vistaPreviaCurso.removeAttribute("src");
      }

      const modulosAgregados = contenedorModulos.querySelectorAll(".modulo-item:not(:first-child)");
      modulosAgregados.forEach((modulo) => modulo.remove());

      cantidadModulos = 1;

      setTimeout(() => {
        window.location.href = "administrarCursos.html";
      }, 3500); 

    } catch (error) {
      console.error("Error al crear el curso en cursoscc:", error);
      mostrarMensaje("No se pudo crear el curso. Intentá nuevamente.", "danger");
      btnPublicarCurso.disabled = false;
      btnPublicarCurso.innerHTML = `
        <i class="bi bi-cloud-arrow-up-fill me-2"></i>
        Crear curso
      `;
    }
  });
}

function mostrarMensaje(texto, tipo) {
  if (mensajeCurso) {
    mensajeCurso.textContent = texto;
    mensajeCurso.className = `alert alert-${tipo}`;
    
    mensajeCurso.style.transition = "transform 0.2s ease, opacity 0.2s ease";
    mensajeCurso.style.transform = "scale(1.03)";
    setTimeout(() => {
      mensajeCurso.style.transform = "scale(1)";
    }, 200);

    mensajeCurso.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

async function subirImagenACloudinary(archivo) {
  const datosFormulario = new FormData();
  datosFormulario.append("file", archivo);
  datosFormulario.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

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
  return datos.secure_url;
}