import { db } from "./firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
  const cargando = document.getElementById("cargandoPasarela");
  const errorBox = document.getElementById("errorPasarela");
  const mensajeError = document.getElementById("mensajeErrorPasarela");
  const tarjetaCurso = document.getElementById("tarjetaCurso");
  const seccionPago = document.getElementById("seccionPago");

  const formPago = document.getElementById("formPago");
  const radiosMetodo = document.querySelectorAll('input[name="metodoPago"]');
  const desplegableTarjeta = document.getElementById("desplegableTarjeta");
  const desplegableTransferencia = document.getElementById("desplegableTransferencia");
  const btnConfirmar = document.getElementById("btnConfirmarPago");

  const inputNombre = document.getElementById("nombreTarjeta");
  const inputNumero = document.getElementById("numeroTarjeta");
  const inputVencimiento = document.getElementById("vencimiento");
  const inputCvv = document.getElementById("cvv");

  const inputComprobante = document.getElementById("comprobantePago");
  const errorComprobante = document.getElementById("errorComprobante");

  const parametros = new URLSearchParams(window.location.search);
  const cursoId = parametros.get("curso");

  if (!cursoId) {
    if (cargando) cargando.classList.add("d-none");
    if (errorBox && mensajeError) {
      mensajeError.textContent = "No se especificó ningún curso para realizar el pago.";
      errorBox.classList.remove("d-none");
    }
    return;
  }

  try {
    const cursoRef = doc(db, "cursos", cursoId);
    const docSnap = await getDoc(cursoRef);

    if (!docSnap.exists()) {
      if (cargando) cargando.classList.add("d-none");
      if (errorBox && mensajeError) {
        mensajeError.textContent = "El curso solicitado no existe o fue desactivado.";
        errorBox.classList.remove("d-none");
      }
      return;
    }

    const curso = docSnap.data();

    const elTitulo = document.getElementById("cursoTitulo");
    const elPrecio = document.getElementById("cursoPrecio");
    const elImg = document.getElementById("cursoImg");

    const precioFormateado = Number(curso.precio || 0).toLocaleString("es-UY", {
      style: "currency",
      currency: "UYU"
    });

    if (elTitulo) elTitulo.textContent = curso.titulo || curso.nombre || "Curso sin título";
    if (elPrecio) elPrecio.textContent = precioFormateado;

    if (elImg) {
      const rutaImagen = curso.URL_imagen ?? curso.imagen_url;
      if (rutaImagen) {
        elImg.src = rutaImagen;
        elImg.alt = curso.titulo || "Imagen del curso";
      } else {
        elImg.src = "recursos/imagenes/logo.jpg";
        elImg.alt = "Cursos CC";
      }
    }

    if (cargando) cargando.classList.add("d-none");
    if (tarjetaCurso) tarjetaCurso.classList.remove("d-none");
    if (seccionPago) seccionPago.classList.remove("d-none");

  } catch (error) {
    console.error("Error al consultar el curso desde Firestore:", error);
    if (cargando) cargando.classList.add("d-none");
    if (errorBox && mensajeError) {
      mensajeError.textContent = "Ocurrió un error al cargar la información de pago. Intente nuevamente.";
      errorBox.classList.remove("d-none");
    }
    return;
  }

  radiosMetodo.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      if (desplegableTarjeta) desplegableTarjeta.classList.add("d-none");
      if (desplegableTransferencia) desplegableTransferencia.classList.add("d-none");

      const metodo = e.target.value;
      if (metodo === "tarjeta" && desplegableTarjeta) {
        desplegableTarjeta.classList.remove("d-none");
      } else if (metodo === "transferencia" && desplegableTransferencia) {
        desplegableTransferencia.classList.remove("d-none");
      }

      validarFormulario();
    });
  });

  if (inputNumero) {
    inputNumero.addEventListener("input", (e) => {
      let valor = e.target.value.replace(/\D/g, "");
      valor = valor.replace(/(.{4})/g, "$1 ").trim();
      e.target.value = valor.substring(0, 19);
      validarFormulario();
    });
  }

  if (inputVencimiento) {
    inputVencimiento.addEventListener("input", (e) => {
      let valor = e.target.value.replace(/\D/g, "");
      if (valor.length >= 3) {
        valor = valor.substring(0, 2) + "/" + valor.substring(2, 4);
      }
      e.target.value = valor.substring(0, 5);
      validarFormulario();
    });
  }

  if (inputNombre) inputNombre.addEventListener("input", validarFormulario);

  if (inputCvv) {
    inputCvv.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/\D/g, "").substring(0, 4);
      validarFormulario();
    });
  }

  if (inputComprobante) {
    inputComprobante.addEventListener("change", () => {
      const archivo = inputComprobante.files[0];

      if (archivo) {
        const tiposPermitidos = ["image/jpeg", "image/png", "image/jpg"];
        if (!tiposPermitidos.includes(archivo.type)) {
          if (errorComprobante) errorComprobante.classList.remove("d-none");
          inputComprobante.value = ""; 
        } else {
          if (errorComprobante) errorComprobante.classList.add("d-none");
        }
      }

      validarFormulario();
    });
  }

  function validarFormulario() {
    if (!btnConfirmar) return;

    const radioSeleccionado = document.querySelector('input[name="metodoPago"]:checked');

    if (!radioSeleccionado) {
      btnConfirmar.disabled = true;
      return;
    }

    const metodo = radioSeleccionado.value;

    if (metodo === "tarjeta") {
      const nombreValido = inputNombre && inputNombre.value.trim().length >= 3;
      const numeroLimpio = inputNumero ? inputNumero.value.replace(/\s/g, "") : "";
      const numeroValido = numeroLimpio.length >= 15 && numeroLimpio.length <= 16;
      const vencimientoValido = inputVencimiento && inputVencimiento.value.trim().length === 5;
      const cvvValido = inputCvv && inputCvv.value.trim().length >= 3;

      btnConfirmar.disabled = !(nombreValido && numeroValido && vencimientoValido && cvvValido);

    } else if (metodo === "transferencia") {
      const archivo = inputComprobante ? inputComprobante.files[0] : null;
      const tieneComprobanteValido = archivo && ["image/jpeg", "image/png", "image/jpg"].includes(archivo.type);

      btnConfirmar.disabled = !tieneComprobanteValido;
    }
  }

  if (formPago) {
    formPago.addEventListener("submit", (e) => {
      e.preventDefault();
      const metodo = document.querySelector('input[name="metodoPago"]:checked')?.value;
      
      if (metodo === "transferencia") {
        const archivo = inputComprobante.files[0];
        alert(`¡Comprobante "${archivo.name}" adjuntado correctamente! Procesando inscripción.`);
      } else {
        alert("¡Pago con tarjeta procesado exitosamente!");
      }
    });
  }
});