import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { doc, getDoc, getDocs, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const contenidoAdministrador = document.getElementById("contenidoAdministrador");  
const formPublicarCurso = document.getElementById("formPublicarCurso");
const mensajeCurso = document.getElementById("mensajeCurso");
const btnPublicarCurso = document.getElementById("btnPublicarCurso");
const contenedorModulos = document.getElementById("contenedorModulos");
const btnAgregarModulo = document.getElementById("btnAgregarModulo");
const selectCategoria = document.getElementById("categoria");

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

async function cargarCategorias() {
  if (!selectCategoria) return;

  try {
    const querySnapshot = await getDocs(collection(db, "cursos"));
    const categoriasSet = new Set();

    querySnapshot.forEach((doc) => {
      const datos = doc.data();
      const cat = datos.categoria || datos.categorias;

      if (cat) {
        if (Array.isArray(cat)) {
          cat.forEach((c) => c && categoriasSet.add(c.trim()));
        } else if (typeof cat === "string") {
          categoriasSet.add(cat.trim());
        }
      }
    });

    selectCategoria.innerHTML = '<option value="">Seleccioná una categoría</option>';

    const categoriasOrdenadas = Array.from(categoriasSet).sort();
    
    categoriasOrdenadas.forEach((catNombre) => {
      const option = document.createElement("option");
      option.value = catNombre;
      option.textContent = catNombre;
      selectCategoria.appendChild(option);
    });

  } catch (error) {
    console.error("Error al obtener las categorías desde la colección cursos:", error);
    selectCategoria.innerHTML = '<option value="">Error al cargar categorías</option>';
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

if (btnAgregarModulo) {
  btnAgregarModulo.addEventListener("click", () => {
    cantidadModulos++;

    const nuevoModulo = document.createElement("div");
    nuevoModulo.className = "modulo-item mb-3";

    nuevoModulo.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-2">
        <label class="form-label mb-0">
          Módulo ${cantidadModulos}
          <span class="text-danger">*</span>
        </label>
        <button type="button" class="btn btn-outline-danger btn-sm btnEliminarModulo">
          <i class="bi bi-trash3 me-1"></i>
          Eliminar
        </button>
      </div>
      <textarea class="form-control moduloCurso" rows="3" placeholder="Ingresá los temas del módulo" required></textarea>
    `;

    contenedorModulos.appendChild(nuevoModulo);
  });
}

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
        Módulo ${indice + 1}
        <span class="text-danger">*</span>
      `;
    }
  });

  cantidadModulos = modulos.length;
}

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
    const categoria = selectCategoria.value;
    const precio = Number(document.getElementById("precio").value);
    const duracionHoras = Number(document.getElementById("duracion").value);
    const cuposDisponibles = Number(document.getElementById("cupos").value);

    const camposModulos = document.querySelectorAll(".moduloCurso");
    
    const modulos = Array.from(camposModulos).map(
      (campo,indice) => ({
        numero: indice + 1, 
        titulo: `Módulo ${indice + 1}`,
        descripcion: campo.value.trim(),
        objetivos: [],
        recursos: []
      })
    );
    const modulosCompletos = 
    modulos.length > 0 &&
    modulos.every(
    (modulo) => modulo.descripcion !== ""
    );

    if (
      !titulo ||
      !descripcion ||
      !categoria ||
      precio <= 0 ||
      duracionHoras <= 0 ||
      cuposDisponibles <= 0 ||
      !modulosCompletos
    ) {
      mostrarMensaje("Revisá los datos ingresados en el formulario.", "danger");
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

      const referenciaCurso = await addDoc(collection(db, "cursos"), {
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

      const referenciaModulos = collection(
        db,
        "cursos",
        referenciaCurso.id,
        "modulos"
      );

      for (const modulo of modulos) {
        await addDoc(referenciaModulos, modulo);
      }

      mostrarMensaje("El curso fue creado correctamente. Redirigiendo a administración...", "success");

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
      console.error("Error al crear el curso:", error);
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