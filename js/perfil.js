import { auth, db } from "./firebase-config.js";
import {
    onAuthStateChanged,
    updateProfile,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
    doc,
    getDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const contenidoPerfil = document.getElementById("contenidoPerfil");

function normalizarDepartamento(departamento) {
    if (!departamento) return "";

    const equivalencias = {
        artigas: "Artigas",
        canelones: "Canelones",
        cerrolargo: "Cerro Largo",
        colonia: "Colonia",
        durazno: "Durazno",
        flores: "Flores",
        florida: "Florida",
        lavalleja: "Lavalleja",
        maldonado: "Maldonado",
        montevideo: "Montevideo",
        paysandu: "Paysandú",
        rionegro: "Río Negro",
        rivera: "Rivera",
        rocha: "Rocha",
        salto: "Salto",
        sanjose: "San José",
        soriano: "Soriano",
        tacuarembo: "Tacuarembo",
        treintaytres: "Treinta y Tres"
    };

    const clave = departamento
        .toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "");

    return equivalencias[clave] || (
        departamento.charAt(0).toUpperCase() +
        departamento.slice(1).toLowerCase()
    );
}

const departamentosUruguay = [
    "Artigas",
    "Canelones",
    "Cerro Largo",
    "Colonia",
    "Durazno",
    "Flores",
    "Florida",
    "Lavalleja",
    "Maldonado",
    "Montevideo",
    "Paysandú",
    "Río Negro",
    "Rivera",
    "Rocha",
    "Salto",
    "San José",
    "Soriano",
    "Tacuarembó",
    "Treinta y Tres"
];

function mostrarAccesoDenegado(mensajeTexto, destinoRedireccion) {
    if (contenidoPerfil) {
        contenidoPerfil.classList.add("d-none");
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

function cargarDatosEnPerfil(datosUsuario, user) {
    const nombre = document.getElementById("perfilNombre");
    if (nombre) {
        nombre.textContent = datosUsuario.nombre || "";
    }

    const apellido = document.getElementById("perfilApellido");
    if (apellido) {
        apellido.textContent = datosUsuario.apellido || "";
    }

    const email = document.getElementById("perfilEmail");
    if (email) {
        email.textContent = datosUsuario.email || user.email || "";
    }

    const departamento = document.getElementById("perfilDepartamento");
    if (departamento) {
        departamento.textContent = normalizarDepartamento(datosUsuario.departamento);
    }

    const tipoDocumento = document.getElementById("perfilTipoDocumento");
    if (tipoDocumento) {
        tipoDocumento.textContent = datosUsuario.tipoDocumento || "";
    }

    const nroDocumento = document.getElementById("perfilNroDocumento");
    if (nroDocumento) {
        nroDocumento.textContent = datosUsuario.nroDocumento || "";
    }

    const rolUsuario = datosUsuario.tipoUsuario || datosUsuario.rol || "";
    const rolPerfil = document.getElementById("perfilRol");

    if (rolPerfil) {
        rolPerfil.textContent = rolUsuario;
    }

    const perfilNombreFoto = document.getElementById("perfilNombreFoto");
    if (perfilNombreFoto) {
        perfilNombreFoto.textContent = `${datosUsuario.nombre || ""} ${datosUsuario.apellido || ""}`.trim();
    }

    const perfilRolFoto = document.getElementById("perfilRolFoto");
    if (perfilRolFoto) {
        perfilRolFoto.textContent = rolUsuario;
    }

    const photoURL = datosUsuario.photoURL || user.photoURL;
    if (photoURL) {
        const avatar = document.querySelector(".avatar-wrapper");
        if (avatar) {
            const contenedorAvatar = avatar.querySelector("div");
            if (contenedorAvatar) {
                contenedorAvatar.innerHTML = `
                    <img
                        src="${photoURL}"
                        alt="Foto de perfil"
                        class="w-100 h-100 rounded-circle object-fit-cover"
                    >
                `;
            }
        }
    }
}

function editarNombre(user, referenciaUsuario) {
    const modalElemento = document.getElementById("modalEditarNombre");
    const inputNombre = document.getElementById("inputNuevoNombre");
    const btnGuardar = document.getElementById("btnGuardarNombre");
    const nombreActual = document.getElementById("perfilNombre").textContent.trim();

    if (!modalElemento || !inputNombre || !btnGuardar) return;

    inputNombre.value = nombreActual;
    inputNombre.classList.remove("is-invalid");

    const modal = new bootstrap.Modal(modalElemento);
    modal.show();

    btnGuardar.onclick = async () => {
        const nombreLimpio = inputNombre.value.trim();

        if (!nombreLimpio) {
            inputNombre.classList.add("is-invalid");
            return;
        }

        btnGuardar.disabled = true;
        btnGuardar.textContent = "Guardando...";

        try {
            await updateDoc(referenciaUsuario, { nombre: nombreLimpio });

            const apellidoActual = document.getElementById("perfilApellido").textContent.trim();
            const nombreCompleto = `${nombreLimpio} ${apellidoActual}`.trim();

            await updateProfile(user, { displayName: nombreCompleto });

            document.getElementById("perfilNombre").textContent = nombreLimpio;

            const perfilNombreFoto = document.getElementById("perfilNombreFoto");
            if (perfilNombreFoto) {
                perfilNombreFoto.textContent = nombreCompleto;
            }

            const nombreNavbar = document.getElementById("nombreUsuario");
            if (nombreNavbar) {
                nombreNavbar.textContent = nombreCompleto;
            }

            modal.hide();
            mostrarNotificacion("Nombre actualizado correctamente.", "exito");

        } catch (error) {
            console.error("Error al actualizar el nombre:", error);
            mostrarNotificacion("No se pudo actualizar el nombre.", "error");
        } finally {
            btnGuardar.disabled = false;
            btnGuardar.textContent = "Guardar cambios";
        }
    };
}

function editarApellido(user, referenciaUsuario) {
    const modalElemento = document.getElementById("modalEditarApellido");
    const inputApellido = document.getElementById("inputNuevoApellido");
    const btnGuardar = document.getElementById("btnGuardarApellido");
    const apellidoActual = document.getElementById("perfilApellido").textContent.trim();

    if (!modalElemento || !inputApellido || !btnGuardar) return;

    inputApellido.value = apellidoActual;
    inputApellido.classList.remove("is-invalid");

    const modal = new bootstrap.Modal(modalElemento);
    modal.show();

    btnGuardar.onclick = async () => {
        const apellidoLimpio = inputApellido.value.trim();

        if (!apellidoLimpio) {
            inputApellido.classList.add("is-invalid");
            return;
        }

        btnGuardar.disabled = true;
        btnGuardar.textContent = "Guardando...";

        try {
            await updateDoc(referenciaUsuario, { apellido: apellidoLimpio });

            const nombreActual = document.getElementById("perfilNombre").textContent.trim();
            const nombreCompleto = `${nombreActual} ${apellidoLimpio}`.trim();

            await updateProfile(user, { displayName: nombreCompleto });

            document.getElementById("perfilApellido").textContent = apellidoLimpio;

            const perfilNombreFoto = document.getElementById("perfilNombreFoto");
            if (perfilNombreFoto) {
                perfilNombreFoto.textContent = nombreCompleto;
            }

            const nombreNavbar = document.getElementById("nombreUsuario");
            if (nombreNavbar) {
                nombreNavbar.textContent = nombreCompleto;
            }

            modal.hide();
            mostrarNotificacion("Apellido actualizado correctamente.", "exito");

        } catch (error) {
            console.error("Error al actualizar el apellido:", error);
            mostrarNotificacion("No se pudo actualizar el apellido.", "error");
        } finally {
            btnGuardar.disabled = false;
            btnGuardar.textContent = "Guardar cambios";
        }
    };
}

function editarDepartamento(referenciaUsuario) {
    const spanDepartamento = document.getElementById("perfilDepartamento");
    const contenedor = spanDepartamento.parentElement;
    const departamentoActual = spanDepartamento.textContent.trim();

    const select = document.createElement("select");
    select.className = "form-select form-select-sm";
    select.id = "selectDepartamento";

    departamentosUruguay.forEach((departamento) => {
        const opcion = document.createElement("option");
        opcion.value = departamento;
        opcion.textContent = departamento;

        if (departamento.toLowerCase() === departamentoActual.toLowerCase()) {
            opcion.selected = true;
        }

        select.appendChild(opcion);
    });

    spanDepartamento.replaceWith(select);

    const boton = contenedor.querySelector(".btn-editar");
    boton.innerHTML = '<i class="bi bi-check-lg"></i>';
    boton.title = "Guardar departamento";

    boton.onclick = async () => {
        const nuevoDepartamento = select.value;

        try {
            const departamentoParaGuardar = nuevoDepartamento
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/\s+/g, "");

            await updateDoc(referenciaUsuario, { departamento: departamentoParaGuardar });

            const nuevoSpan = document.createElement("span");
            nuevoSpan.id = "perfilDepartamento";
            nuevoSpan.textContent = normalizarDepartamento(nuevoDepartamento);

            select.replaceWith(nuevoSpan);

            boton.innerHTML = '<i class="bi bi-pencil-square"></i>';
            boton.title = "Editar departamento";
            boton.onclick = null;
            boton.addEventListener("click", () => editarDepartamento(referenciaUsuario));

            mostrarNotificacion("Departamento actualizado correctamente.", "exito");

        } catch (error) {
            console.error("Error al actualizar el departamento:", error);
            mostrarNotificacion("No se pudo actualizar el departamento.", "error");
        }
    };
}

async function editarFotoPerfil(user, referenciaUsuario) {
    const CLOUDINARY_CLOUD_NAME = "fd9bzuxj";
    const CLOUDINARY_UPLOAD_PRESET = "ProyectoTaller";

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.click();

    input.addEventListener("change", async () => {
        const archivo = input.files[0];
        if (!archivo) return;

        if (!archivo.type.startsWith("image/")) {
            alert("Seleccioná una imagen válida.");
            return;
        }

        const avatarDiv = document.querySelector(".avatar-wrapper div");

        try {
            if (avatarDiv) avatarDiv.style.opacity = "0.5";

            const formData = new FormData();
            formData.append("file", archivo);
            formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

            const respuesta = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
                {
                    method: "POST",
                    body: formData
                }
            );

            if (!respuesta.ok) {
                const errorData = await respuesta.json();
                console.error("Detalle del error en Cloudinary:", errorData);
                throw new Error("Error al subir la imagen a Cloudinary");
            }

            const dataCloudinary = await respuesta.json();
            const urlFoto = dataCloudinary.secure_url;

            await updateDoc(referenciaUsuario, { photoURL: urlFoto });
            await updateProfile(user, { photoURL: urlFoto });

            if (avatarDiv) {
                avatarDiv.style.opacity = "1";
                avatarDiv.innerHTML = `
                    <img
                        src="${urlFoto}"
                        alt="Foto de perfil"
                        class="w-100 h-100 rounded-circle object-fit-cover"
                    >
                `;
            }

            mostrarNotificacion("Foto de perfil actualizada correctamente.", "exito");

        } catch (error) {
            console.error("Error al actualizar la foto:", error);
            mostrarNotificacion("No se pudo actualizar la foto de perfil.", "error");

            if (avatarDiv) avatarDiv.style.opacity = "1";
        }
    });
}

function configurarModificarPassword(user) {
    const boton = document.getElementById("btnModificarPassword");
    if (!boton) return;

    boton.addEventListener("click", () => {
        abrirModalReautenticarPassword(user);
    });

    const botonGuardar = document.getElementById("btnGuardarPassword");
    if (!botonGuardar) return;

    botonGuardar.addEventListener("click", async () => {
        const nuevaPassword = document.getElementById("nuevaPassword").value.trim();
        const confirmarPassword = document.getElementById("confirmarPassword").value.trim();
        const mensaje = document.getElementById("mensajePassword");

        mensaje.textContent = "";
        mensaje.className = "small";

        if (nuevaPassword.length < 8) {
            mensaje.textContent = "La contraseña debe tener al menos 8 caracteres.";
            mensaje.classList.add("text-danger");
            return;
        }

        if (nuevaPassword.length > 20) {
            mensaje.textContent = "La contraseña no puede tener más de 20 caracteres.";
            mensaje.classList.add("text-danger");
            return;
        }

        if (!/[A-Z]/.test(nuevaPassword)) {
            mensaje.textContent = "La contraseña debe contener al menos una letra mayúscula.";
            mensaje.classList.add("text-danger");
            return;
        }

        if (!/[0-9]/.test(nuevaPassword)) {
            mensaje.textContent = "La contraseña debe contener al menos un número.";
            mensaje.classList.add("text-danger");
            return;
        }

        if (nuevaPassword !== confirmarPassword) {
            mensaje.textContent = "Las contraseñas no coinciden.";
            mensaje.classList.add("text-danger");
            return;
        }

        botonGuardar.disabled = true;
        botonGuardar.textContent = "Guardando...";

        try {
            await updatePassword(user, nuevaPassword);

            mensaje.textContent = "Contraseña actualizada correctamente.";
            mensaje.classList.add("text-success");
            botonGuardar.textContent = "Listo";

            setTimeout(() => {
                const modalElemento = document.getElementById("modalPassword");
                const modal = bootstrap.Modal.getInstance(modalElemento);
                if (modal) modal.hide();

                botonGuardar.disabled = false;
                botonGuardar.textContent = "Guardar contraseña";
            }, 1000);

        } catch (error) {
            console.error("Error al modificar la contraseña:", error);
            botonGuardar.disabled = false;
            botonGuardar.textContent = "Guardar contraseña";
            mensaje.textContent = "No se pudo modificar la contraseña.";
            mensaje.classList.add("text-danger");
        }
    });
}

function abrirModalReautenticarPassword(user) {
    const modalElemento = document.getElementById("modalReautenticarPassword");
    const campoPassword = document.getElementById("passwordActualReautenticar");
    const mensaje = document.getElementById("mensajeReautenticarPassword");
    const boton = document.getElementById("btnReautenticarPassword");

    if (!modalElemento || !campoPassword || !mensaje || !boton) return;

    campoPassword.value = "";
    campoPassword.classList.remove("is-invalid");

    mensaje.textContent = "";
    mensaje.className = "small mt-2";

    boton.disabled = false;
    boton.textContent = "Continuar";

    const modal = new bootstrap.Modal(modalElemento);
    modal.show();

    boton.onclick = async () => {
        const passwordActual = campoPassword.value.trim();

        if (!passwordActual) {
            mensaje.textContent = "Ingresá tu contraseña actual.";
            mensaje.className = "small mt-2 text-danger";
            campoPassword.classList.add("is-invalid");
            return;
        }

        boton.disabled = true;
        boton.textContent = "Verificando...";
        mensaje.textContent = "";
        mensaje.className = "small mt-2";
        campoPassword.classList.remove("is-invalid");

        try {
            const credencial = EmailAuthProvider.credential(user.email, passwordActual);
            await reauthenticateWithCredential(user, credencial);

            mensaje.textContent = "Identidad verificada correctamente.";
            mensaje.className = "small mt-2 text-success";
            boton.textContent = "Verificado";

            setTimeout(() => {
                modal.hide();

                const modalPasswordElemento = document.getElementById("modalPassword");
                const modalPassword = new bootstrap.Modal(modalPasswordElemento);

                document.getElementById("nuevaPassword").value = "";
                document.getElementById("confirmarPassword").value = "";

                const mensajePassword = document.getElementById("mensajePassword");
                mensajePassword.textContent = "";
                mensajePassword.className = "small";

                modalPassword.show();
            }, 1000);

        } catch (error) {
            console.error("Error durante la reautenticación:", error);
            boton.disabled = false;
            boton.textContent = "Continuar";

            if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
                mensaje.textContent = "La contraseña actual es incorrecta.";
                mensaje.className = "small mt-2 text-danger";
                campoPassword.classList.add("is-invalid");
            } else {
                mensaje.textContent = "No se pudo verificar tu identidad. Intentá nuevamente.";
                mensaje.className = "small mt-2 text-danger";
            }
        }
    };
}

document.querySelectorAll(".btn-toggle-password").forEach((boton) => {
    boton.addEventListener("click", () => {
        const idCampo = boton.dataset.target;
        const campo = document.getElementById(idCampo);
        const icono = boton.querySelector("i");

        if (!campo || !icono) return;

        if (campo.type === "password") {
            campo.type = "text";
            icono.classList.remove("bi-eye");
            icono.classList.add("bi-eye-slash");
            boton.setAttribute("aria-label", "Ocultar contraseña");
        } else {
            campo.type = "password";
            icono.classList.remove("bi-eye-slash");
            icono.classList.add("bi-eye");
            boton.setAttribute("aria-label", "Mostrar contraseña");
        }
    });
});

function deshabilitarCuenta(user, referenciaUsuario) {
    const botonAbrir = document.getElementById("btnDeshabilitarCuenta");
    const botonConfirmar = document.getElementById("btnConfirmarDeshabilitarCuenta");
    const botonReautenticar = document.getElementById("btnReautenticarDeshabilitar");
    const inputPassword = document.getElementById("passwordDeshabilitarCuenta");
    const mensajeDeshabilitar = document.getElementById("mensajeDeshabilitarCuenta");

    if (!botonAbrir) return;

    botonAbrir.addEventListener("click", () => {
        const modalElemento = document.getElementById("modalDeshabilitarCuenta");
        if (modalElemento) {
            const modal = new bootstrap.Modal(modalElemento);
            modal.show();
        }
    });

    if (botonConfirmar) {
        botonConfirmar.addEventListener("click", () => {
            if (inputPassword) {
                inputPassword.value = "";
                inputPassword.classList.remove("is-invalid");
            }

            if (mensajeDeshabilitar) {
                mensajeDeshabilitar.textContent = "";
                mensajeDeshabilitar.className = "small mt-2";
            }

            const modalConfirmacion = document.getElementById("modalDeshabilitarCuenta");
            if (modalConfirmacion) {
                const instancia = bootstrap.Modal.getInstance(modalConfirmacion);
                if (instancia) instancia.hide();
            }

            setTimeout(() => {
                const modalReautenticar = document.getElementById("modalReautenticarDeshabilitar");
                if (modalReautenticar) {
                    const modal = new bootstrap.Modal(modalReautenticar);
                    modal.show();
                }
            }, 300);
        });
    }

    if (botonReautenticar) {
        botonReautenticar.addEventListener("click", async () => {
            const password = inputPassword ? inputPassword.value.trim() : "";

            if (!password) {
                if (mensajeDeshabilitar) {
                    mensajeDeshabilitar.textContent = "Ingresá tu contraseña actual.";
                    mensajeDeshabilitar.className = "small mt-2 text-danger";
                }
                if (inputPassword) inputPassword.classList.add("is-invalid");
                return;
            }

            botonReautenticar.disabled = true;
            botonReautenticar.textContent = "Verificando...";

            if (mensajeDeshabilitar) {
                mensajeDeshabilitar.textContent = "";
                mensajeDeshabilitar.className = "small mt-2";
            }

            try {
                const credencial = EmailAuthProvider.credential(user.email, password);
                await reauthenticateWithCredential(user, credencial);

                await updateDoc(referenciaUsuario, {
                    activo: false,
                    fechaCambioEstado: new Date().toISOString()
                });

                if (mensajeDeshabilitar) {
                    mensajeDeshabilitar.textContent = "Tu cuenta ha sido deshabilitada correctamente.";
                    mensajeDeshabilitar.className = "small mt-2 text-success";
                }

                botonReautenticar.textContent = "Cuenta deshabilitada";

                setTimeout(async () => {
                    await auth.signOut();
                    window.location.href = "index.html";
                }, 1500);

            } catch (error) {
                console.error("Error al deshabilitar cuenta:", error);
                botonReautenticar.disabled = false;
                botonReautenticar.textContent = "Continuar";

                if (mensajeDeshabilitar) {
                    if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
                        mensajeDeshabilitar.textContent = "La contraseña ingresada no es correcta.";
                    } else {
                        mensajeDeshabilitar.textContent = "No se pudo deshabilitar la cuenta. Intentá nuevamente.";
                    }
                    mensajeDeshabilitar.className = "small mt-2 text-danger";
                }

                if (inputPassword) inputPassword.classList.add("is-invalid");
            }
        });
    }
}

function configurarBotonesEdicion(user, referenciaUsuario) {
    const botonCamara = document.querySelector(".camera-btn");
    if (botonCamara) {
        botonCamara.addEventListener("click", () => {
            editarFotoPerfil(user, referenciaUsuario);
        });
    }

    const botones = document.querySelectorAll(".btn-editar");
    botones.forEach((boton) => {
        boton.addEventListener("click", async () => {
            const titulo = boton.getAttribute("title");

            if (titulo === "Editar nombre") {
                await editarNombre(user, referenciaUsuario);
            } else if (titulo === "Editar apellido") {
                await editarApellido(user, referenciaUsuario);
            } else if (titulo === "Editar departamento") {
                editarDepartamento(referenciaUsuario);
            }
        });
    });
}

function mostrarNotificacion(mensaje, tipo = "exito") {
    const toastElemento = document.getElementById("toastNotificacion");
    const toastMensaje = document.getElementById("toastMensaje");
    const toastIcono = document.getElementById("toastIcono");

    if (!toastElemento) return;

    if (tipo === "exito") {
        toastElemento.className = "toast align-items-center text-white bg-success border-0 shadow-lg";
        toastIcono.className = "bi bi-check-circle-fill fs-5";
    } else if (tipo === "error") {
        toastElemento.className = "toast align-items-center text-white bg-danger border-0 shadow-lg";
        toastIcono.className = "bi bi-exclamation-triangle-fill fs-5";
    } else if (tipo === "info") {
        toastElemento.className = "toast align-items-center text-white bg-primary border-0 shadow-lg";
        toastIcono.className = "bi bi-info-circle-fill fs-5";
    }

    toastMensaje.textContent = mensaje;

    const toast = new bootstrap.Toast(toastElemento, { delay: 3500 });
    toast.show();
}

onAuthStateChanged(auth, async (user) => {
    if (user) {
        if (contenidoPerfil) {
            contenidoPerfil.classList.remove("d-none");
        }

        const referenciaUsuario = doc(db, "usuarios", user.uid);
        const docSnap = await getDoc(referenciaUsuario);

        if (docSnap.exists()) {
            const datosUsuario = docSnap.data();

            cargarDatosEnPerfil(datosUsuario, user);
            configurarBotonesEdicion(user, referenciaUsuario);
            configurarModificarPassword(user);
            deshabilitarCuenta(user, referenciaUsuario);
        } else {
            console.warn("No se encontraron datos adicionales en Firestore para este usuario.");
        }
    } else {
        mostrarAccesoDenegado("Debés iniciar sesión para ver tu perfil de usuario.", "ingresar.html");
    }
});