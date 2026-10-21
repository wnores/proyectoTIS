import { auth, db } from "./firebase-config.js";
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
  doc,
  getDoc,
  addDoc,
  collection,
  serverTimestamp,
  runTransaction
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {

  const cargando = document.getElementById("cargandoPasarela");
  const errorBox = document.getElementById("errorPasarela");
  const mensajeError = document.getElementById("mensajeErrorPasarela");
  const tarjetaCurso = document.getElementById("tarjetaCurso");
  const seccionPago = document.getElementById("seccionPago");

  const formPago = document.getElementById("formPago");
  const radiosMetodo = document.querySelectorAll(
    'input[name="metodoPago"]'
  );

  const desplegableTarjeta = document.getElementById("desplegableTarjeta");
  const desplegableTransferencia = document.getElementById("desplegableTransferencia");
  const btnConfirmar = document.getElementById("btnConfirmarPago");

  const inputNombre = document.getElementById("nombreTarjeta");
  const inputNumero = document.getElementById("numeroTarjeta");
  const inputVencimiento = document.getElementById("vencimiento");
  const inputCvv = document.getElementById("cvv");
  const inputComprobante = document.getElementById("comprobantePago");
  const errorComprobante = document.getElementById("errorComprobante");

  // CONFIGURACIÓN CLOUDINARY
  const CLOUDINARY_CLOUD_NAME = "fd9bzuxj";
  const CLOUDINARY_UPLOAD_PRESET = "ProyectoTaller";

  // DATOS INICIALES
  const parametros = new URLSearchParams(window.location.search);
  const cursoId = parametros.get("curso");
  const adquisicionId = parametros.get("adquisicion");

  let curso = null;
  let usuarioActual = null;
  let adquisicionExistente = null;
  let esPagoSaldoBeca = false;

  // MODAL DE ALERTA CENTRADA DINÁMICA
  function mostrarAlertaCentrada(mensaje, tipo = "exito", callbackAccion = null) {
    const idModal = "alertaCentradaPasarela";
    let modalExistente = document.getElementById(idModal);
    if (modalExistente) modalExistente.remove();

    const configuracion = {
        exito: { icono: "bi-check-circle-fill", colorTexto: "text-success", colorBorde: "border-success", bgIcono: "bg-success bg-opacity-10", titulo: "¡Comprobante Enviado!" },
        error: { icono: "bi-x-circle-fill", colorTexto: "text-danger", colorBorde: "border-danger", bgIcono: "bg-danger bg-opacity-10", titulo: "Error de Procesamiento" },
        advertencia: { icono: "bi-exclamation-triangle-fill", colorTexto: "text-warning", colorBorde: "border-warning", bgIcono: "bg-warning bg-opacity-10", titulo: "Atención" },
        info: { icono: "bi-info-circle-fill", colorTexto: "text-info", colorBorde: "border-info", bgIcono: "bg-info bg-opacity-10", titulo: "Información" }
    };

    const cfg = configuracion[tipo] || configuracion.info;

    const htmlModal = `
        <div class="modal fade" id="${idModal}" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-0 shadow-lg text-center p-4 border-top border-4 ${cfg.colorBorde}" style="border-radius: 1.25rem;">
                    <div class="modal-body p-2">
                        <div class="mb-3">
                            <span class="p-3 rounded-circle d-inline-block ${cfg.bgIcono} ${cfg.colorTexto} fs-1">
                                <i class="bi ${cfg.icono}"></i>
                            </span>
                        </div>
                        <h4 class="fw-bold mb-2">${cfg.titulo}</h4>
                        <p class="text-secondary mb-4 fs-6">${mensaje}</p>
                        <button type="button" class="btn btn-dark px-4 rounded-pill fw-bold" data-bs-dismiss="modal">Aceptar</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML("beforeend", htmlModal);
    const modalElem = document.getElementById(idModal);
    const bsModal = new bootstrap.Modal(modalElem);

    if (callbackAccion) {
        modalElem.addEventListener("hidden.bs.modal", callbackAccion, { once: true });
    }

    bsModal.show();
  }

  // VERIFICAR USUARIO AUTENTICADO Y ROL
  onAuthStateChanged(auth, async (usuario) => {
    usuarioActual = usuario;

    if (!usuario) {
      mostrarAccesoDenegado("Debés iniciar sesión para acceder a la pasarela de pago.", "ingresar.html");
      return;
    }

    try {
      const docRef = doc(db, "usuarios", usuario.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const datos = docSnap.data();
        const rol = (datos.tipoUsuario || datos.rol || "").toLowerCase().trim();

        if (rol.includes("docente/admin")) {
          mostrarAccesoDenegado("Los administradores y docentes no tienen acceso a la pasarela de pago.", "index.html");
          return;
        }
      }
    } catch (error) {
      console.error("Error al verificar permisos en pasarela:", error);
    }
  });

  function mostrarAccesoDenegado(mensajeTexto, destinoRedireccion) {
    const seccionPrincipal = document.getElementById("seccionPrincipalPasarela");
    if (seccionPrincipal) seccionPrincipal.classList.add("d-none");

    if (cargando) cargando.classList.add("d-none");
    if (seccionPago) seccionPago.classList.add("d-none");
    if (tarjetaCurso) tarjetaCurso.classList.add("d-none");

    const contenedorMensaje = document.getElementById("mensajeSinPermiso");
    if (!contenedorMensaje) return;

    contenedorMensaje.className = "container py-5";
    contenedorMensaje.classList.remove("d-none");
    contenedorMensaje.innerHTML = `
        <div class="row justify-content-center my-5">
            <div class="col-12 col-md-8 col-lg-6">
                <div class="card border-0 shadow-lg text-center p-4">
                    <div class="card-body">
                        <span class="p-3 rounded-circle bg-danger bg-opacity-10 text-danger fs-1 d-inline-block mb-3">
                            <i class="bi bi-shield-lock-fill"></i>
                        </span>
                        <h2 class="h4 fw-bold text-dark mb-2">Acceso Restringido</h2>
                        <p class="text-secondary mb-4">${mensajeTexto}</p>
                        <a href="${destinoRedireccion}" class="btn btn-primary btn-sm px-4 rounded-pill">Ir ahora</a>
                    </div>
                </div>
            </div>
        </div>
    `;

    setTimeout(() => {
      window.location.href = destinoRedireccion;
    }, 3500);
  }

  if (!cursoId) {
    if (cargando) cargando.classList.add("d-none");
    if (errorBox && mensajeError) {
      mensajeError.textContent = "No se especificó ningún curso para realizar el pago.";
      errorBox.classList.remove("d-none");
    }
    return;
  }

  try {
    if (adquisicionId) {
      const adquisicionRef = doc(db, "adquisiciones", adquisicionId);
      const adquisicionSnap = await getDoc(adquisicionRef);

      if (!adquisicionSnap.exists()) throw new Error("ADQUISICION_NO_EXISTE");

      adquisicionExistente = { id: adquisicionSnap.id, ...adquisicionSnap.data() };
      const usuario = auth.currentUser;

      if (!usuario || adquisicionExistente.usuarioId !== usuario.uid) throw new Error("ADQUISICION_NO_AUTORIZADA");
      if (adquisicionExistente.cursoId !== cursoId) throw new Error("CURSO_NO_COINCIDE");
      if (
        adquisicionExistente.metodoPago !== "beca" ||
        Number(adquisicionExistente.saldoPendiente) <= 0 ||
        adquisicionExistente.estadoPagoSaldo === "pagado"
      ) throw new Error("SALDO_NO_PENDIENTE");

      esPagoSaldoBeca = true;
    }

    const cursoRef = doc(db, "cursoscc", cursoId);
    const docSnap = await getDoc(cursoRef);

    if (!docSnap.exists()) {
      if (cargando) cargando.classList.add("d-none");
      if (errorBox && mensajeError) {
        mensajeError.textContent = "El curso solicitado no existe o fue desactivado.";
        errorBox.classList.remove("d-none");
      }
      return;
    }

    curso = docSnap.data();

    const formatoUYU = (importe) =>
      Number(importe).toLocaleString("es-UY", { style: "currency", currency: "UYU" });

    if (esPagoSaldoBeca) {
      const saldoPendiente = Number(adquisicionExistente.saldoPendiente);
      if (!Number.isFinite(saldoPendiente) || saldoPendiente <= 0) throw new Error("SALDO_NO_PENDIENTE");

      const detalleBeca = document.getElementById("detallePagoBeca");
      const precioOriginalBeca = document.getElementById("precioOriginalBeca");
      const porcentajeBeca = document.getElementById("porcentajeBeca");
      const importeBeca = document.getElementById("importeBeca");
      const etiquetaImportePago = document.getElementById("etiquetaImportePago");

      if (detalleBeca) detalleBeca.classList.remove("d-none");
      if (precioOriginalBeca) precioOriginalBeca.textContent = formatoUYU(adquisicionExistente.precio);
      if (porcentajeBeca) porcentajeBeca.textContent = `${adquisicionExistente.porcentajeBeca}%`;
      if (importeBeca) importeBeca.textContent = formatoUYU(adquisicionExistente.importeBeca);
      if (etiquetaImportePago) etiquetaImportePago.textContent = "Saldo pendiente a abonar:";
    }

    const elTitulo = document.getElementById("cursoTitulo");
    const elPrecio = document.getElementById("cursoPrecio");
    const elImg = document.getElementById("cursoImg");

    if (elTitulo) elTitulo.textContent = curso.titulo || curso.nombre || "Curso sin título";

    if (elPrecio) {
      const importeAMostrar = esPagoSaldoBeca
        ? Number(adquisicionExistente.saldoPendiente)
        : Number(curso.precio || 0);

      elPrecio.textContent = formatoUYU(importeAMostrar);
    }

    if (elImg) {
      const rutaImagen = curso.URL_imagen ?? curso.imagen_url;
      elImg.src = rutaImagen ? rutaImagen : "recursos/imagenes/logo.jpg";
      elImg.alt = curso.titulo || "Cursos CC";
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
      if (metodo === "tarjeta" && desplegableTarjeta) desplegableTarjeta.classList.remove("d-none");
      else if (metodo === "transferencia" && desplegableTransferencia) desplegableTransferencia.classList.remove("d-none");

      validarFormulario();
    });
  });

  function aplicarClasesValidacion(input, esValido) {
    if (!input) return;
    if (input.value.trim() === "") {
      input.classList.remove("is-valid", "is-invalid");
      return;
    }
    if (esValido) {
      input.classList.add("is-valid");
      input.classList.remove("is-invalid");
    } else {
      input.classList.add("is-invalid");
      input.classList.remove("is-valid");
    }
  }

  function esVencimientoValido(vencimientoTexto) {
    if (!vencimientoTexto || vencimientoTexto.length !== 5) return false;
    const [mesTexto, anioTexto] = vencimientoTexto.split("/");
    const mes = parseInt(mesTexto, 10);
    const anio2D = parseInt(anioTexto, 10);

    if (isNaN(mes) || mes < 1 || mes > 12 || isNaN(anio2D)) return false;

    const anioIngresado = 2000 + anio2D;
    const fechaActual = new Date();
    const anioActual = fechaActual.getFullYear();
    const mesActual = fechaActual.getMonth() + 1;

    if (anioIngresado < anioActual) return false;
    if (anioIngresado === anioActual && mes < mesActual) return false;

    return true;
  }

  if (inputNombre) {
    inputNombre.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
      validarFormulario();
    });
  }

  if (inputNumero) {
    inputNumero.addEventListener("input", (e) => {
      let valor = e.target.value.replace(/\D/g, "").substring(0, 16);
      e.target.value = valor.replace(/(.{4})/g, "$1 ").trim();
      validarFormulario();
    });
  }

  if (inputVencimiento) {
    inputVencimiento.addEventListener("input", (e) => {
      let valor = e.target.value.replace(/\D/g, "");
      if (valor.length >= 3) valor = valor.substring(0, 2) + "/" + valor.substring(2, 4);
      e.target.value = valor.substring(0, 5);
      validarFormulario();
    });
  }

  if (inputCvv) {
    inputCvv.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/\D/g, "").substring(0, 4);
      validarFormulario();
    });
  }

  if (inputComprobante) {
    inputComprobante.addEventListener("change", () => {
      const archivo = inputComprobante.files[0];
      if (!archivo) {
        validarFormulario();
        return;
      }
      const tiposPermitidos = ["image/jpeg", "image/png", "image/jpg"];
      if (!tiposPermitidos.includes(archivo.type)) {
        if (errorComprobante) errorComprobante.classList.remove("d-none");
        inputComprobante.value = "";
      } else {
        if (errorComprobante) errorComprobante.classList.add("d-none");
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
      const nombreTexto = inputNombre ? inputNombre.value.trim() : "";
      const nombreValido = nombreTexto.length >= 3 && /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombreTexto);
      const numeroLimpio = inputNumero ? inputNumero.value.replace(/\s/g, "") : "";
      const numeroValido = numeroLimpio.length === 16;
      const vencimientoValido = inputVencimiento && esVencimientoValido(inputVencimiento.value.trim());
      const cvvValido = inputCvv && inputCvv.value.trim().length >= 3;

      aplicarClasesValidacion(inputNombre, nombreValido);
      aplicarClasesValidacion(inputNumero, numeroValido);
      aplicarClasesValidacion(inputVencimiento, vencimientoValido);
      aplicarClasesValidacion(inputCvv, cvvValido);

      btnConfirmar.disabled = !(nombreValido && numeroValido && vencimientoValido && cvvValido);
    } else if (metodo === "transferencia") {
      const archivo = inputComprobante ? inputComprobante.files[0] : null;
      const tieneComprobanteValido = archivo && ["image/jpeg", "image/png", "image/jpg"].includes(archivo.type);
      btnConfirmar.disabled = !tieneComprobanteValido;
    }
  }

  async function subirComprobanteACloudinary(archivo) {
    if (!archivo) throw new Error("NO_HAY_COMPROBANTE");
    const formulario = new FormData();
    formulario.append("file", archivo);
    formulario.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const respuesta = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: "POST", body: formulario }
    );

    if (!respuesta.ok) throw new Error("ERROR_CLOUDINARY");
    const datos = await respuesta.json();
    if (!datos.secure_url) throw new Error("URL_COMPROBANTE_NO_GENERADA");
    return datos.secure_url;
  }

  if (formPago) {
    formPago.addEventListener("submit", async (e) => {
      e.preventDefault();
      const usuario = auth.currentUser;

      if (!usuario) {
        mostrarAlertaCentrada("Debés iniciar sesión para realizar la compra.", "advertencia", () => {
            window.location.href = "ingresar.html";
        });
        return;
      }

      const metodo = document.querySelector('input[name="metodoPago"]:checked')?.value;
      if (!metodo) {
        mostrarAlertaCentrada("Seleccioná un método de pago.", "advertencia");
        return;
      }

      let estado = metodo === "transferencia" ? "pendiente" : "aprobada";

      btnConfirmar.disabled = true;
      btnConfirmar.textContent = "Procesando...";

      try {
        const datosAdquisicion = {
          usuarioId: usuario.uid,
          usuarioCorreo: usuario.email || "",
          cursoId: cursoId,
          cursoTitulo: curso.titulo || curso.nombre || "Curso sin título",
          precio: Number(curso.precio || 0),
          metodoPago: metodo,
          fechaAdquisicion: serverTimestamp(),
          estado: estado
        };

        if (metodo === "tarjeta") {
          if (esPagoSaldoBeca) {
            const referenciaAdquisicion = doc(db, "adquisiciones", adquisicionId);
            await runTransaction(db, async (transaccion) => {
              const resultadoAdquisicion = await transaccion.get(referenciaAdquisicion);
              if (!resultadoAdquisicion.exists()) throw new Error("ADQUISICION_NO_EXISTE");

              transaccion.update(referenciaAdquisicion, {
                saldoPendiente: 0,
                estadoPagoSaldo: "pagado",
                estado: "aprobada",
                metodoPagoSaldo: "tarjeta",
                fechaPagoSaldo: serverTimestamp()
              });
            });

            window.location.href = `comprobanteCompra.html?id=${adquisicionId}`;
            return;
          }

          const referenciaAdquisicion = doc(collection(db, "adquisiciones"));
          const referenciaCurso = doc(db, "cursoscc", cursoId);

          await runTransaction(db, async (transaccion) => {
            const resultadoCurso = await transaccion.get(referenciaCurso);
            if (!resultadoCurso.exists()) throw new Error("CURSO_NO_EXISTE");

            const datosCurso = resultadoCurso.data();
            const cuposActuales = Number(datosCurso.cupos_disponibles || 0);
            if (cuposActuales <= 0) throw new Error("SIN_CUPOS");

            transaccion.update(referenciaCurso, {
              cupos_disponibles: cuposActuales - 1
            });

            transaccion.set(referenciaAdquisicion, datosAdquisicion);
          });

          window.location.href = `comprobanteCompra.html?id=${referenciaAdquisicion.id}`;
          return;
        }

        if (metodo === "transferencia") {
          const archivo = inputComprobante?.files?.[0];
          if (!archivo) throw new Error("NO_HAY_COMPROBANTE");

          const comprobanteUrl = await subirComprobanteACloudinary(archivo);

          let idNotif = null;

          if (esPagoSaldoBeca) {
            const referenciaAdquisicion = doc(db, "adquisiciones", adquisicionId);
            await runTransaction(db, async (transaccion) => {
              const resultadoAdquisicion = await transaccion.get(referenciaAdquisicion);
              if (!resultadoAdquisicion.exists()) throw new Error("ADQUISICION_NO_EXISTE");

              transaccion.update(referenciaAdquisicion, {
                comprobanteUrl: comprobanteUrl,
                comprobanteNombre: archivo.name,
                metodoPagoSaldo: "transferencia",
                estadoPagoSaldo: "pendiente",
                fechaEnvioComprobanteSaldo: serverTimestamp()
              });
            });
            idNotif = adquisicionId;
          } else {
            datosAdquisicion.comprobanteUrl = comprobanteUrl;
            datosAdquisicion.comprobanteNombre = archivo.name;

            const referenciaAdquisicion = await addDoc(
              collection(db, "adquisiciones"),
              datosAdquisicion
            );
            idNotif = referenciaAdquisicion.id;
          }

          // Notificar al administrador mandándolo a administrarCursos.html
          await addDoc(collection(db, "notificaciones"), {
            tipo: "transferencia",
            destinatarioRol: "docente/admin",
            estudianteUid: usuario.uid,
            titulo: "Nuevo Pago por Transferencia Pendiente",
            mensaje: `El estudiante ${usuario.email} envió un comprobante de pago para "${curso.titulo || 'el curso'}".`,
            leida: false,
            fechaCreacion: serverTimestamp(),
            enlace: "administrarCursos.html"
          });

          mostrarAlertaCentrada(
            "El comprobante fue enviado correctamente. Un administrador verificará la transferencia a la brevedad.", 
            "exito", 
            () => { window.location.href = `comprobanteCompra.html?id=${idNotif}`; }
          );
          return;
        }
      } catch (error) {
        console.error("Error al registrar la adquisición:", error);
        mostrarAlertaCentrada("No fue posible registrar el pago. Verificá tu conexión e intentá nuevamente.", "error");

        btnConfirmar.disabled = false;
        btnConfirmar.textContent = "Confirmar pago";
      }
    });
  }

});