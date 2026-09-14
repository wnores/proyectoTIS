import { auth, db } from "./firebase-config.js";
import {
    onAuthStateChanged,
    updateProfile,
    updatePassword,
    deleteUser,
    reauthenticateWithCredential,
    EmailAuthProvider
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import {
    doc,
    getDoc,
    updateDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

// ======================================================
// NORMALIZAR DEPARTAMENTO PARA MOSTRAR
// ======================================================
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
        tacuarembo: "Tacuarembó",
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
    "Artigas", "Canelones", "Cerro Largo", "Colonia", "Durazno", 
    "Flores", "Florida", "Lavalleja", "Maldonado", "Montevideo", 
    "Paysandú", "Río Negro", "Rivera", "Rocha", "Salto", 
    "San José", "Soriano", "Tacuarembó", "Treinta y Tres"
];

// ======================================================
// CARGAR DATOS EN EL PERFIL
// ======================================================
function cargarDatosEnPerfil(datosUsuario, user) {
    const nombre = document.getElementById("perfilNombre");
    if (nombre) nombre.textContent = datosUsuario.nombre || "";

    const apellido = document.getElementById("perfilApellido");
    if (apellido) apellido.textContent = datosUsuario.apellido || "";

    const email = document.getElementById("perfilEmail");
    if (email) email.textContent = datosUsuario.email || user.email || "";

    const departamento = document.getElementById("perfilDepartamento");
    if (departamento) {
        departamento.textContent = normalizarDepartamento(datosUsuario.departamento);
    }

    const tipoDocumento = document.getElementById("perfilTipoDocumento");
    if (tipoDocumento) tipoDocumento.textContent = datosUsuario.tipoDocumento || "";

    const nroDocumento = document.getElementById("perfilNroDocumento");
    if (nroDocumento) nroDocumento.textContent = datosUsuario.nroDocumento || "";

    const rolPerfil = document.getElementById("perfilRol");
    if (rolPerfil) rolPerfil.textContent = datosUsuario.tipoUsuario || "";

    // Nombre y rol debajo del avatar
    const avatarWrapper = document.querySelector(".avatar-wrapper");
    if (avatarWrapper) {
        const contenedor = avatarWrapper.parentElement;
        const nombreCompleto = contenedor.querySelector("h5");
        const rol = nombreCompleto?.nextElementSibling;

        if (nombreCompleto) {
            nombreCompleto.textContent = `${datosUsuario.nombre || ""} ${datosUsuario.apellido || ""}`.trim();
        }

        if (rol) rol.textContent = datosUsuario.tipoUsuario || "";
    }

    // Foto de perfil
    const photoURL = datosUsuario.photoURL || user.photoURL;
    if (photoURL) {
        const avatar = document.querySelector(".avatar-wrapper");
        if (avatar) {
            const contenedorAvatar = avatar.querySelector("div");
            if (contenedorAvatar) {
                contenedorAvatar.innerHTML = `<img src="${photoURL}" alt="Foto de perfil" class="w-100 h-100 rounded-circle object-fit-cover">`;
            }
        }
    }
}

// ======================================================
// EDITAR NOMBRE
// ======================================================
async function editarNombre(user, referenciaUsuario) {
    const nombreActual = document.getElementById("perfilNombre").textContent.trim();
    const nuevoNombre = prompt("Ingresá el nuevo nombre:", nombreActual);

    if (nuevoNombre === null) return;
    const nombreLimpio = nuevoNombre.trim();

    if (!nombreLimpio) {
        alert("El nombre no puede quedar vacío.");
        return;
    }

    try {
        await updateDoc(referenciaUsuario, { nombre: nombreLimpio });

        const apellidoActual = document.getElementById("perfilApellido").textContent.trim();
        const nombreCompleto = `${nombreLimpio} ${apellidoActual}`.trim();

        await updateProfile(user, { displayName: nombreCompleto });

        document.getElementById("perfilNombre").textContent = nombreLimpio;

        const nombreFoto = document.querySelector(".avatar-wrapper")?.parentElement?.querySelector("h5");
        if (nombreFoto) nombreFoto.textContent = nombreCompleto;

        const nombreNavbar = document.getElementById("nombreUsuario");
        if (nombreNavbar) nombreNavbar.textContent = nombreCompleto;

        alert("Nombre actualizado correctamente.");
    } catch (error) {
        console.error("Error al actualizar el nombre:", error);
        alert("No se pudo actualizar el nombre.");
    }
}

// ======================================================
// EDITAR APELLIDO
// ======================================================
async function editarApellido(user, referenciaUsuario) {
    const apellidoActual = document.getElementById("perfilApellido").textContent.trim();
    const nuevoApellido = prompt("Ingresá el nuevo apellido:", apellidoActual);

    if (nuevoApellido === null) return;
    const apellidoLimpio = nuevoApellido.trim();

    if (!apellidoLimpio) {
        alert("El apellido no puede quedar vacío.");
        return;
    }

    try {
        await updateDoc(referenciaUsuario, { apellido: apellidoLimpio });

        const nombreActual = document.getElementById("perfilNombre").textContent.trim();
        const nombreCompleto = `${nombreActual} ${apellidoLimpio}`.trim();

        await updateProfile(user, { displayName: nombreCompleto });

        document.getElementById("perfilApellido").textContent = apellidoLimpio;

        const nombreFoto = document.querySelector(".avatar-wrapper")?.parentElement?.querySelector("h5");
        if (nombreFoto) nombreFoto.textContent = nombreCompleto;

        const nombreNavbar = document.getElementById("nombreUsuario");
        if (nombreNavbar) nombreNavbar.textContent = nombreCompleto;

        alert("Apellido actualizado correctamente.");
    } catch (error) {
        console.error("Error al actualizar el apellido:", error);
        alert("No se pudo actualizar el apellido.");
    }
}

// ======================================================
// EDITAR DEPARTAMENTO
// ======================================================
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

            alert("Departamento actualizado correctamente.");
        } catch (error) {
            console.error("Error al actualizar el departamento:", error);
            alert("No se pudo actualizar el departamento.");
        }
    };
}

// ======================================================
// EDITAR FOTO DE PERFIL
// ======================================================
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
            // Mostrar un indicador visual de carga
            if (avatarDiv) {
                avatarDiv.style.opacity = "0.5";
            }

            // 1. Preparar los datos con las variables correctas
            const formData = new FormData();
            formData.append("file", archivo);
            formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

            // 2. Subir imagen a la API REST de Cloudinary
            const respuesta = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
                method: "POST",
                body: formData
            });

            if (!respuesta.ok) {
                const errorData = await respuesta.json();
                console.error("Detalle del error en Cloudinary:", errorData);
                throw new Error("Error al subir la imagen a Cloudinary");
            }

            const dataCloudinary = await respuesta.json();
            const urlFoto = dataCloudinary.secure_url; // URL HTTPS devuelta por Cloudinary

            // 3. Actualizar la URL en Firestore y Firebase Auth
            await updateDoc(referenciaUsuario, { photoURL: urlFoto });
            await updateProfile(user, { photoURL: urlFoto });

            // 4. Actualizar la vista de la pantalla
            if (avatarDiv) {
                avatarDiv.style.opacity = "1";
                avatarDiv.innerHTML = `<img src="${urlFoto}" alt="Foto de perfil" class="w-100 h-100 rounded-circle object-fit-cover">`;
            }

            alert("Foto de perfil actualizada correctamente.");
        } catch (error) {
            console.error("Error al actualizar la foto:", error);
            alert("No se pudo actualizar la foto de perfil.");
            
            if (avatarDiv) {
                avatarDiv.style.opacity = "1";
            }
        }
    });
}


// ======================================================
// MODIFICAR CONTRASEÑA
// ======================================================
function configurarModificarPassword(user) {
    const boton = document.getElementById("btnModificarPassword");

    if (!boton) return;

    boton.addEventListener("click", () => {
        const modalElemento = document.getElementById("modalPassword");

        if (!modalElemento) return;

        const modal = new bootstrap.Modal(modalElemento);

        document.getElementById("nuevaPassword").value = "";
        document.getElementById("confirmarPassword").value = "";

        const mensaje = document.getElementById("mensajePassword");
        mensaje.textContent = "";
        mensaje.className = "small";

        modal.show();
    });

    const botonGuardar = document.getElementById("btnGuardarPassword");

    if (!botonGuardar) return;

    botonGuardar.addEventListener("click", async () => {
        const nuevaPassword =
            document.getElementById("nuevaPassword").value.trim();

        const confirmarPassword =
            document.getElementById("confirmarPassword").value.trim();

        const mensaje =
            document.getElementById("mensajePassword");

        mensaje.textContent = "";
        mensaje.className = "small";

        if (nuevaPassword.length < 6) {
            mensaje.textContent =
                "La contraseña debe tener al menos 6 caracteres.";
            mensaje.classList.add("text-danger");
            return;
        }

        if (nuevaPassword !== confirmarPassword) {
            mensaje.textContent =
                "Las contraseñas no coinciden.";
            mensaje.classList.add("text-danger");
            return;
        }

        try {
            await updatePassword(user, nuevaPassword);

            mensaje.textContent =
                "Contraseña actualizada correctamente.";
            mensaje.classList.add("text-success");

            setTimeout(() => {
                const modalElemento =
                    document.getElementById("modalPassword");

                const modal =
                    bootstrap.Modal.getInstance(modalElemento);

                if (modal) {
                    modal.hide();
                }
            }, 1200);

        } catch (error) {
            console.error(
                "Error al modificar la contraseña:",
                error
            );

            if (error.code === "auth/requires-recent-login") {
                abrirModalReautenticarPassword(
                    user,
                    nuevaPassword
                );
            } else {
                mensaje.textContent =
                    "No se pudo modificar la contraseña.";
                mensaje.classList.add("text-danger");
            }
        }
    });
}

// ======================================================
// REAUTENTICAR PARA MODIFICAR CONTRASEÑA
// ======================================================
function abrirModalReautenticarPassword(user, nuevaPassword) {
    const modalElemento =
        document.getElementById("modalReautenticarPassword");

    const campoPassword =
        document.getElementById("passwordActualReautenticar");

    const mensaje =
        document.getElementById("mensajeReautenticarPassword");

    const boton =
        document.getElementById("btnReautenticarPassword");

    if (!modalElemento || !campoPassword || !mensaje || !boton) {
        return;
    }

    campoPassword.value = "";
    campoPassword.classList.remove("is-invalid");

    mensaje.textContent = "";
    mensaje.className = "small mt-2";

    boton.disabled = false;
    boton.textContent = "Continuar";

    const modalPasswordElemento =
    document.getElementById("modalPassword");

    const modalPassword =
        bootstrap.Modal.getInstance(modalPasswordElemento);

    if (modalPassword) {
        modalPassword.hide();
    }

    setTimeout(() => {
        const modal = new bootstrap.Modal(modalElemento);
        modal.show();
    }, 300);

    boton.onclick = async () => {
        const passwordActual = campoPassword.value.trim();

        if (!passwordActual) {
            mensaje.textContent =
                "Ingresá tu contraseña actual.";

            mensaje.classList.add("text-danger");

            campoPassword.classList.add("is-invalid");

            return;
        }

        boton.disabled = true;
        boton.textContent = "Verificando...";

        mensaje.textContent = "";
        mensaje.className = "small mt-2";

        campoPassword.classList.remove("is-invalid");

        try {
            const credencial =
                EmailAuthProvider.credential(
                    user.email,
                    passwordActual
                );

            await reauthenticateWithCredential(
                user,
                credencial
            );

            await updatePassword(
                user,
                nuevaPassword
            );

            mensaje.textContent =
                "Contraseña actualizada correctamente.";

            mensaje.classList.add("text-success");

            campoPassword.classList.remove("is-invalid");

            boton.disabled = false;
            boton.textContent = "Continuar";

            setTimeout(() => {
                modal.hide();

                const modalPassword =
                    document.getElementById("modalPassword");

                const instanciaPassword =
                    bootstrap.Modal.getInstance(modalPassword);

                if (instanciaPassword) {
                    instanciaPassword.hide();
                }
            }, 1000);

        } catch (error) {
            console.error(
                "Error durante la reautenticación:",
                error
            );

            boton.disabled = false;
            boton.textContent = "Continuar";

            if (
                error.code === "auth/wrong-password" ||
                error.code === "auth/invalid-credential"
            ) {
                mensaje.textContent =
                    "La contraseña actual es incorrecta.";

                campoPassword.classList.add("is-invalid");
            } else {
                mensaje.textContent =
                    "No se pudo verificar tu identidad. Intentá nuevamente.";
            }

            mensaje.classList.add("text-danger");
        }
    };
}

// ======================================================
// MOSTRAR / OCULTAR CONTRASEÑA
// ======================================================
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

// ======================================================
// SERVICIOS ADQUIRIDOS
// ======================================================
function configurarServiciosAdquiridos(datosUsuario) {
    const boton = document.getElementById("btnServiciosAdquiridos");

    if (!boton) return;

    boton.addEventListener("click", () => {
        const contenedor = document.getElementById("listaServiciosAdquiridos");

        if (!contenedor) return;

        contenedor.innerHTML = "";

        

        const servicios = datosUsuario.serviciosAdquiridos;

        
        if (!Array.isArray(servicios) || servicios.length === 0) {
            contenedor.innerHTML = `
                <div class="text-center py-3">
                    <i class="bi bi-mortarboard fs-1 text-secondary"></i>
                    <p class="mt-3 mb-0">
                        No tenés servicios adquiridos.
                    </p>
                </div>
            `;
        } else {
            const lista = document.createElement("div");
            lista.className = "list-group";

            servicios.forEach((servicio) => {
                const elemento = document.createElement("div");

                elemento.className =
                    "list-group-item d-flex align-items-center gap-2";

                elemento.innerHTML = `
                    <i class="bi bi-check-circle-fill text-success"></i>
                    <span>${servicio}</span>
                `;

                lista.appendChild(elemento);
            });

            contenedor.appendChild(lista);
        }

        const modalElemento = document.getElementById("modalServicios");

        if (modalElemento) {
            const modal = new bootstrap.Modal(modalElemento);
            modal.show();
        }
    });
}

// ======================================================
// ELIMINAR CUENTA
// ======================================================
function configurarEliminarCuenta(user, referenciaUsuario) {
    const boton = document.getElementById("btnEliminarCuenta");

    if (!boton) return;

    boton.addEventListener("click", () => {
        const modalElemento = document.getElementById("modalEliminarCuenta");

        if (!modalElemento) return;

        const modal = new bootstrap.Modal(modalElemento);
        modal.show();
    });

    const botonConfirmar =
        document.getElementById("btnConfirmarEliminarCuenta");

    const botonReautenticar =
        document.getElementById("btnReautenticarEliminar");

    const inputPassword =
        document.getElementById("passwordEliminarCuenta");

    const errorPassword =
        document.getElementById("errorPasswordEliminar");

    if (!botonConfirmar || !botonReautenticar || !inputPassword) return;

    botonConfirmar.addEventListener("click", async () => {

        botonConfirmar.disabled = true;
        botonConfirmar.textContent = "Comprobando...";

        try {

            // Intentamos eliminar la cuenta.
            // Si Firebase requiere una autenticación reciente,
            // se mostrará el modal para ingresar la contraseña.
            await deleteUser(user);

            // Si llegó hasta acá, Authentication se eliminó correctamente.
            // Luego eliminamos el documento de Firestore.
            await deleteDoc(referenciaUsuario);

            alert("Tu cuenta fue eliminada correctamente.");

            window.location.href = "index.html";

        } catch (error) {

            console.error("Error al eliminar la cuenta:", error);

            if (error.code === "auth/requires-recent-login") {

                // Restaurar botón de confirmación
                botonConfirmar.disabled = false;
                botonConfirmar.textContent = "Sí, eliminar mi cuenta";

                // Cerrar modal de confirmación
                const modalConfirmacion =
                    document.getElementById("modalEliminarCuenta");

                if (modalConfirmacion) {
                    const instancia =
                        bootstrap.Modal.getInstance(modalConfirmacion);

                    if (instancia) {
                        instancia.hide();
                    }
                }

                // Limpiar campos
                inputPassword.value = "";

                if (errorPassword) {
                    errorPassword.textContent = "";
                    errorPassword.style.display = "none";
                }

                // Mostrar modal de reautenticación
                const modalReautenticar =
                    document.getElementById("modalReautenticarEliminar");

                if (modalReautenticar) {
                    const modal = new bootstrap.Modal(modalReautenticar);
                    modal.show();
                }

            } else {

                botonConfirmar.disabled = false;
                botonConfirmar.textContent = "Sí, eliminar mi cuenta";

                alert(
                    "No se pudo eliminar la cuenta. Revisá la consola para obtener más información."
                );
            }
        }
    });

    botonReautenticar.addEventListener("click", async () => {

        const password = inputPassword.value.trim();

        if (!password) {

            if (errorPassword) {
                errorPassword.textContent =
                    "Ingresá tu contraseña actual.";
                errorPassword.style.display = "block";
            }

            return;
        }

        botonReautenticar.disabled = true;
        botonReautenticar.textContent = "Verificando...";

        if (errorPassword) {
            errorPassword.textContent = "";
            errorPassword.style.display = "none";
        }

        try {

            // Crear las credenciales con correo y contraseña
            const credencial = EmailAuthProvider.credential(
                user.email,
                password
            );

            // Reautenticar al usuario
            await reauthenticateWithCredential(user, credencial);

            // La sesión ahora es reciente.
            // Podemos eliminar la cuenta de Authentication.
            await deleteUser(user);

            // Luego eliminar el documento de Firestore.
            await deleteDoc(referenciaUsuario);

            alert("Tu cuenta fue eliminada correctamente.");

            window.location.href = "index.html";

        } catch (error) {

            console.error("Error durante la reautenticación:", error);

            botonReautenticar.disabled = false;
            botonReautenticar.textContent = "Continuar";

            if (error.code === "auth/wrong-password" ||
                error.code === "auth/invalid-credential") {

                if (errorPassword) {
                    errorPassword.textContent =
                        "La contraseña ingresada no es correcta.";
                    errorPassword.style.display = "block";
                }

            } else {

                if (errorPassword) {
                    errorPassword.textContent =
                        "No se pudo verificar tu identidad. Intentá nuevamente.";
                    errorPassword.style.display = "block";
                }
            }
        }
    });
}


// ======================================================
// CONFIGURAR BOTONES DE EDICIÓN
// ======================================================
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

// ======================================================
// INICIALIZACIÓN Y CONTROL DE SESIÓN
// ======================================================
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const referenciaUsuario = doc(db, "usuarios", user.uid);
        const docSnap = await getDoc(referenciaUsuario);

        if (docSnap.exists()) {
            const datosUsuario = docSnap.data();

            cargarDatosEnPerfil(datosUsuario, user);

            configurarBotonesEdicion(user, referenciaUsuario);

            configurarModificarPassword(user);

            configurarServiciosAdquiridos(datosUsuario);

            configurarEliminarCuenta(user, referenciaUsuario);
        } else {
            console.warn("No se encontraron datos adicionales en Firestore para este usuario.");
        }
    } else {
        // Redirigir al login si no hay sesión activa
        window.location.href = "index.html";
    }
});