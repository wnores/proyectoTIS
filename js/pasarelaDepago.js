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

  const desplegableTarjeta =
    document.getElementById("desplegableTarjeta");

  const desplegableTransferencia =
    document.getElementById("desplegableTransferencia");

  const btnConfirmar =
    document.getElementById("btnConfirmarPago");

  const inputNombre =
    document.getElementById("nombreTarjeta");

  const inputNumero =
    document.getElementById("numeroTarjeta");

  const inputVencimiento =
    document.getElementById("vencimiento");

  const inputCvv =
    document.getElementById("cvv");

  const inputComprobante =
    document.getElementById("comprobantePago");

  const errorComprobante =
    document.getElementById("errorComprobante");

  const CLOUDINARY_CLOUD_NAME = "fd9bzuxj";
  const CLOUDINARY_UPLOAD_PRESET = "ProyectoTaller";

  const parametros =
    new URLSearchParams(window.location.search);

  const cursoId =
    parametros.get("curso");

  let curso = null;
  let usuarioActual = null;

  onAuthStateChanged(auth, (usuario) => {
    usuarioActual = usuario;
    if (!usuario) {
      window.location.href =
        "ingresar.html";
    }
  });

  if (!cursoId) {

    if (cargando) {
      cargando.classList.add("d-none");
    }

    if (errorBox && mensajeError) {

      mensajeError.textContent =
        "No se especificó ningún curso para realizar el pago.";

      errorBox.classList.remove("d-none");
    }
    return;
  }

  try {
    const cursoRef =
      doc(db, "cursoscc", cursoId);
    const docSnap =
      await getDoc(cursoRef);

    if (!docSnap.exists()) {
      if (cargando) {
        cargando.classList.add("d-none");
      }
      if (errorBox && mensajeError) {
        mensajeError.textContent =
          "El curso solicitado no existe o fue desactivado.";
        errorBox.classList.remove("d-none");
      }
      return;
    }
    curso =
      docSnap.data();

    const elTitulo =
      document.getElementById("cursoTitulo");

    const elPrecio =
      document.getElementById("cursoPrecio");

    const elImg =
      document.getElementById("cursoImg");

    const precioFormateado =
      Number(curso.precio || 0).toLocaleString(
        "es-UY",
        {
          style: "currency",
          currency: "UYU"
        }
      );

    if (elTitulo) {

      elTitulo.textContent =
        curso.titulo ||
        curso.nombre ||
        "Curso sin título";
    }

    if (elPrecio) {

      elPrecio.textContent =
        precioFormateado;
    }

    if (elImg) {
      const rutaImagen =
        curso.URL_imagen ??
        curso.imagen_url;

      if (rutaImagen) {

        elImg.src =
          rutaImagen;

        elImg.alt =
          curso.titulo ||
          "Imagen del curso";

      } else {

        elImg.src =
          "recursos/imagenes/logo.jpg";

        elImg.alt =
          "Cursos CC";
      }
    }

    if (cargando) {
      cargando.classList.add("d-none");
    }
    if (tarjetaCurso) {
      tarjetaCurso.classList.remove("d-none");
    }
    if (seccionPago) {
      seccionPago.classList.remove("d-none");
    }

  } catch (error) {
    console.error(
      "Error al consultar el curso desde Firestore:",
      error
    );

    if (cargando) {
      cargando.classList.add("d-none");
    }

    if (errorBox && mensajeError) {
      mensajeError.textContent =
        "Ocurrió un error al cargar la información de pago. Intente nuevamente.";
      errorBox.classList.remove("d-none");
    }
    return;
  }

  radiosMetodo.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      if (desplegableTarjeta) {
        desplegableTarjeta.classList.add("d-none");
      }
      if (desplegableTransferencia) {
        desplegableTransferencia.classList.add("d-none");
      }

      const metodo =
        e.target.value;

      if (
        metodo === "tarjeta" &&
        desplegableTarjeta
      ) {
        desplegableTarjeta.classList.remove(
          "d-none"
        );
      } else if (
        metodo === "transferencia" &&
        desplegableTransferencia
      ) {
        desplegableTransferencia.classList.remove(
          "d-none"
        );
      }

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
    if (!vencimientoTexto || vencimientoTexto.length !== 5) {
      return false;
    }

    const [mesTexto, anioTexto] = vencimientoTexto.split("/");
    const mes = parseInt(mesTexto, 10);
    const anio2D = parseInt(anioTexto, 10);

    if (isNaN(mes) || mes < 1 || mes > 12 || isNaN(anio2D)) {
      return false;
    }

    const anioIngresado = 2000 + anio2D;

    const fechaActual = new Date();
    const anioActual = fechaActual.getFullYear();
    const mesActual = fechaActual.getMonth() + 1;

    if (anioIngresado < anioActual) {
      return false;
    }

    if (anioIngresado === anioActual && mes < mesActual) {
      return false;
    }

    return true;
  }

  if (inputNombre) {
    inputNombre.addEventListener("input", (e) => {
      // Elimina cualquier carácter que no sea una letra (con tildes/ñ) o espacio
      e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
      validarFormulario();
    });
  }

  if (inputNumero) {

    inputNumero.addEventListener(
      "input",
      (e) => {

        let valor =
          e.target.value.replace(
            /\D/g,
            ""
          );

        valor = valor.substring(0, 16);

        const valorFormateado =
          valor
            .replace(
              /(.{4})/g,
              "$1 "
            )
            .trim();

        e.target.value = valorFormateado;

        validarFormulario();
      }
    );
  }

  if (inputVencimiento) {

    inputVencimiento.addEventListener(
      "input",
      (e) => {

        let valor =
          e.target.value.replace(
            /\D/g,
            ""
          );

        if (valor.length >= 3) {

          valor =
            valor.substring(0, 2) +
            "/" +
            valor.substring(2, 4);
        }

        e.target.value =
          valor.substring(
            0,
            5
          );

        validarFormulario();
      }
    );
  }

  if (inputCvv) {
    inputCvv.addEventListener(
      "input",
      (e) => {

        e.target.value =
          e.target.value
            .replace(
              /\D/g,
              ""
            )
            .substring(
              0,
              4
            );

        validarFormulario();
      }
    );
  }

  if (inputComprobante) {

    inputComprobante.addEventListener(
      "change",
      () => {

        const archivo =
          inputComprobante.files[0];

        if (!archivo) {

          validarFormulario();
          return;
        }

        const tiposPermitidos = [
          "image/jpeg",
          "image/png",
          "image/jpg"
        ];

        if (
          !tiposPermitidos.includes(
            archivo.type
          )
        ) {

          if (errorComprobante) {

            errorComprobante.classList.remove(
              "d-none"
            );
          }

          inputComprobante.value = "";

        } else {

          if (errorComprobante) {

            errorComprobante.classList.add(
              "d-none"
            );
          }
        }

        validarFormulario();
      }
    );
  }

  function validarFormulario() {

    if (!btnConfirmar) {
      return;
    }

    const radioSeleccionado =
      document.querySelector(
        'input[name="metodoPago"]:checked'
      );

    if (!radioSeleccionado) {

      btnConfirmar.disabled =
        true;

      return;
    }

    const metodo =
      radioSeleccionado.value;

    if (metodo === "tarjeta") {

      const nombreTexto = inputNombre ? inputNombre.value.trim() : "";
      const nombreValido = nombreTexto.length >= 3 && /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombreTexto);

      const numeroLimpio =
        inputNumero
          ? inputNumero.value.replace(
              /\s/g,
              ""
            )
          : "";

      const numeroValido = numeroLimpio.length === 16;

      const vencimientoValido =
        inputVencimiento &&
        esVencimientoValido(inputVencimiento.value.trim());

      const cvvValido =
        inputCvv &&
        inputCvv.value
          .trim()
          .length >= 3;

      aplicarClasesValidacion(inputNombre, nombreValido);
      aplicarClasesValidacion(inputNumero, numeroValido);
      aplicarClasesValidacion(inputVencimiento, vencimientoValido);
      aplicarClasesValidacion(inputCvv, cvvValido);

      btnConfirmar.disabled =
        !(
          nombreValido &&
          numeroValido &&
          vencimientoValido &&
          cvvValido
        );

    } else if (metodo === "transferencia") {

      const archivo =
        inputComprobante
          ? inputComprobante.files[0]
          : null;

      const tieneComprobanteValido =
        archivo &&
        [
          "image/jpeg",
          "image/png",
          "image/jpg"
        ].includes(
          archivo.type
        );

      btnConfirmar.disabled =
        !tieneComprobanteValido;
    }
  }

  async function subirComprobanteACloudinary(
    archivo
  ) {

    if (!archivo) {
      throw new Error(
        "NO_HAY_COMPROBANTE"
      );
    }

    const formulario =
      new FormData();

    formulario.append(
      "file",
      archivo
    );

    formulario.append(
      "upload_preset",
      CLOUDINARY_UPLOAD_PRESET
    );

    const respuesta =
      await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formulario
        }
      );

    if (!respuesta.ok) {

      throw new Error(
        "ERROR_CLOUDINARY"
      );
    }

    const datos =
      await respuesta.json();

    if (!datos.secure_url) {

      throw new Error(
        "URL_COMPROBANTE_NO_GENERADA"
      );
    }

    return datos.secure_url;
  }

  if (formPago) {

    formPago.addEventListener(
      "submit",
      async (e) => {

        e.preventDefault();

        const usuario =
          auth.currentUser;

        if (!usuario) {

          alert(
            "Debés iniciar sesión para realizar la compra"
          );

          window.location.href =
            "ingresar.html";

          return;
        }

        const metodo =
          document.querySelector(
            'input[name="metodoPago"]:checked'
          )?.value;

        if (!metodo) {

          alert(
            "Seleccioná un método de pago."
          );

          return;
        }

        let estado =
          "aprobada";

        if (metodo === "transferencia") {

          estado =
            "pendiente";
        }

        btnConfirmar.disabled =
          true;

        btnConfirmar.textContent =
          "Procesando...";

        try {

          const datosAdquisicion = {

            usuarioId:
              usuario.uid,

            usuarioCorreo:
              usuario.email || "",

            cursoId:
              cursoId,

            cursoTitulo:
              curso.titulo ||
              curso.nombre ||
              "Curso sin título",

            precio:
              Number(
                curso.precio || 0
              ),

            metodoPago:
              metodo,

            fechaAdquisicion:
              serverTimestamp(),

            estado:
              estado
          };

          if (metodo === "tarjeta") {

            const referenciaAdquisicion =
              doc(
                collection(
                  db,
                  "adquisiciones"
                )
              );

            const referenciaCurso =
              doc(
                db,
                "cursoscc",
                cursoId
              );

            await runTransaction(
              db,
              async (transaccion) => {

                const resultadoCurso =
                  await transaccion.get(
                    referenciaCurso
                  );

                if (!resultadoCurso.exists()) {

                  throw new Error(
                    "CURSO_NO_EXISTE"
                  );
                }

                const datosCurso =
                  resultadoCurso.data();

                const cuposActuales =
                  Number(
                    datosCurso.cupos_disponibles ||
                    0
                  );

                if (cuposActuales <= 0) {

                  throw new Error(
                    "SIN_CUPOS"
                  );
                }

                transaccion.update(
                  referenciaCurso,
                  {
                    cupos_disponibles:
                      cuposActuales - 1
                  }
                );

                transaccion.set(
                  referenciaAdquisicion,
                  datosAdquisicion
                );
              }
            );

            window.location.href =
              `comprobanteCompra.html?id=${referenciaAdquisicion.id}`;

            return;
          }

          if (metodo === "transferencia") {

            const archivo =
              inputComprobante?.files?.[0];

            if (!archivo) {
              throw new Error(
                "NO_HAY_COMPROBANTE"
              );
            }

            const comprobanteUrl =
              await subirComprobanteACloudinary(
                archivo
              );

            datosAdquisicion.comprobanteUrl =
              comprobanteUrl;

            datosAdquisicion.comprobanteNombre =
              archivo.name;

            const referenciaAdquisicion =
              await addDoc(
                collection(
                  db,
                  "adquisiciones"
                ),
                datosAdquisicion
              );

            window.location.href =
              `comprobanteCompra.html?id=${referenciaAdquisicion.id}`;
            return;
          }

          throw new Error(
            "METODO_PAGO_NO_VALIDO"
          );

        } catch (error) {
          console.error(
            "Error al registrar la adquisición:",
            error
          );

          if (
            error.message ===
            "SIN_CUPOS"
          ) {
            alert(
              "Este curso ya no tiene cupos disponibles."
            );
          } else if (
            error.message ===
            "ERROR_CLOUDINARY"
          ) {
            alert(
              "No fue posible subir el comprobante. Intentá nuevamente."
            );
          } else if (
            error.message ===
            "URL_COMPROBANTE_NO_GENERADA"
          ) {
            alert(
              "No se pudo obtener el comprobante. Intentá nuevamente."
            );
          } else if (
            error.message ===
            "NO_HAY_COMPROBANTE"
          ) {
            alert(
              "Debés seleccionar un comprobante válido."
            );
          } else {
            alert(
              "No fue posible registrar la adquisición. Intentá nuevamente."
            );
          }

          btnConfirmar.disabled =
            false;

          btnConfirmar.textContent =
            "Confirmar pago";
        }
      }
    );
  }
});