import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
    doc,
    getDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-storage.js";

const storage = getStorage();

// ======================================================
// NORMALIZAR DEPARTAMENTO PARA MOSTRAR
// ======================================================

function normalizarDepartamento(departamento) {

    if (!departamento) {
        return "";
    }

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

// ======================================================
// CARGAR DATOS EN EL PERFIL
// ======================================================

function cargarDatosEnPerfil(datosUsuario, user) {

    const nombre = document.getElementById("perfilNombre");

    if (nombre) {
        nombre.textContent = datosUsuario.nombre || "";
    }


    const apellido = document.getElementById("perfilApellido");

    if (apellido) {
        apellido.textContent = datosUsuario.apellido || "";
    }


    // CORREO: SOLO LECTURA
    const email = document.getElementById("perfilEmail");

    if (email) {
        email.textContent =
            datosUsuario.email || user.email || "";
    }


    const departamento =
        document.getElementById("perfilDepartamento");

    if (departamento) {
        departamento.textContent =
            normalizarDepartamento(
                datosUsuario.departamento
            );
    }


    const tipoDocumento =
        document.getElementById("perfilTipoDocumento");

    if (tipoDocumento) {
        tipoDocumento.textContent =
            datosUsuario.tipoDocumento || "";
    }


    const nroDocumento =
        document.getElementById("perfilNroDocumento");

    if (nroDocumento) {
        nroDocumento.textContent =
            datosUsuario.nroDocumento || "";
    }


    const rolPerfil =
        document.getElementById("perfilRol");

    if (rolPerfil) {
        rolPerfil.textContent =
            datosUsuario.tipoUsuario || "";
    }


    // ==================================================
    // NOMBRE Y ROL DEBAJO DE LA FOTO
    // ==================================================

    const avatarWrapper =
        document.querySelector(".avatar-wrapper");

    if (avatarWrapper) {

        const contenedor =
            avatarWrapper.parentElement;

        const nombreCompleto =
            contenedor.querySelector("h5");

        const rol =
            nombreCompleto?.nextElementSibling;


        if (nombreCompleto) {

            nombreCompleto.textContent =
                `${datosUsuario.nombre || ""} ${datosUsuario.apellido || ""}`
                    .trim();
        }


        if (rol) {

            rol.textContent =
                datosUsuario.tipoUsuario || "";
        }
    }


    // ==================================================
    // FOTO DE PERFIL
    // ==================================================

    if (datosUsuario.photoURL) {

        const avatar =
            document.querySelector(".avatar-wrapper");

        if (avatar) {

            const imagenExistente =
                avatar.querySelector("img");

            if (imagenExistente) {

                imagenExistente.src =
                    datosUsuario.photoURL;

            } else {

                const imagen =
                    document.createElement("img");

                imagen.src =
                    datosUsuario.photoURL;

                imagen.alt =
                    "Foto de perfil";

                imagen.className =
                    "w-100 h-100 rounded-circle object-fit-cover";

                const contenedorAvatar =
                    avatar.querySelector("div");

                if (contenedorAvatar) {

                    contenedorAvatar.innerHTML = "";

                    contenedorAvatar.appendChild(
                        imagen
                    );
                }
            }
        }
    }
}


// ======================================================
// EDITAR NOMBRE
// ======================================================

async function editarNombre(user, referenciaUsuario) {

    const nombreActual =
        document.getElementById("perfilNombre").textContent.trim();

    const nuevoNombre =
        prompt(
            "Ingresá el nuevo nombre:",
            nombreActual
        );


    if (nuevoNombre === null) {
        return;
    }


    const nombreLimpio =
        nuevoNombre.trim();


    if (!nombreLimpio) {

        alert("El nombre no puede quedar vacío.");

        return;
    }


    try {

        await updateDoc(
            referenciaUsuario,
            {
                nombre: nombreLimpio
            }
        );


        // Actualizar Firebase Authentication
        const apellidoActual =
            document.getElementById("perfilApellido")
                .textContent
                .trim();


        const nombreCompleto =
            `${nombreLimpio} ${apellidoActual}`.trim();


        await updateProfile(
            user,
            {
                displayName: nombreCompleto
            }
        );


        // Actualizar pantalla
        document.getElementById(
            "perfilNombre"
        ).textContent = nombreLimpio;


        const nombreFoto =
            document.querySelector(
                ".avatar-wrapper"
            )?.parentElement?.querySelector("h5");


        if (nombreFoto) {

            nombreFoto.textContent =
                nombreCompleto;
        }


        // Actualizar nombre de la barra superior
        const nombreNavbar =
            document.getElementById("nombreUsuario");

        if (nombreNavbar) {

            nombreNavbar.textContent =
                nombreCompleto;
        }


        alert("Nombre actualizado correctamente.");

    } catch (error) {

        console.error(
            "Error al actualizar el nombre:",
            error
        );

        alert(
            "No se pudo actualizar el nombre."
        );
    }
}


// ======================================================
// EDITAR APELLIDO
// ======================================================

async function editarApellido(user, referenciaUsuario) {

    const apellidoActual =
        document.getElementById("perfilApellido")
            .textContent
            .trim();


    const nuevoApellido =
        prompt(
            "Ingresá el nuevo apellido:",
            apellidoActual
        );


    if (nuevoApellido === null) {
        return;
    }


    const apellidoLimpio =
        nuevoApellido.trim();


    if (!apellidoLimpio) {

        alert("El apellido no puede quedar vacío.");

        return;
    }


    try {

        await updateDoc(
            referenciaUsuario,
            {
                apellido: apellidoLimpio
            }
        );


        // Obtener nombre actual
        const nombreActual =
            document.getElementById("perfilNombre")
                .textContent
                .trim();


        const nombreCompleto =
            `${nombreActual} ${apellidoLimpio}`.trim();


        // Actualizar Firebase Authentication
        await updateProfile(
            user,
            {
                displayName: nombreCompleto
            }
        );


        // Actualizar pantalla
        document.getElementById(
            "perfilApellido"
        ).textContent = apellidoLimpio;


        const nombreFoto =
            document.querySelector(
                ".avatar-wrapper"
            )?.parentElement?.querySelector("h5");


        if (nombreFoto) {

            nombreFoto.textContent =
                nombreCompleto;
        }


        // Actualizar navbar
        const nombreNavbar =
            document.getElementById("nombreUsuario");

        if (nombreNavbar) {

            nombreNavbar.textContent =
                nombreCompleto;
        }


        alert(
            "Apellido actualizado correctamente."
        );

    } catch (error) {

        console.error(
            "Error al actualizar el apellido:",
            error
        );

        alert(
            "No se pudo actualizar el apellido."
        );
    }
}


// ======================================================
// EDITAR DEPARTAMENTO
// ======================================================

function editarDepartamento(referenciaUsuario) {

    const spanDepartamento =
        document.getElementById("perfilDepartamento");

    const contenedor =
        spanDepartamento.parentElement;

    const departamentoActual =
        spanDepartamento.textContent.trim();


    // Crear menú desplegable
    const select =
        document.createElement("select");

    select.className =
        "form-select form-select-sm";

    select.id =
        "selectDepartamento";


    // Agregar departamentos
    departamentosUruguay.forEach((departamento) => {

        const opcion =
            document.createElement("option");

        opcion.value =
            departamento;

        opcion.textContent =
            departamento;


        if (
            departamento.toLowerCase() ===
            departamentoActual.toLowerCase()
        ) {
            opcion.selected = true;
        }


        select.appendChild(opcion);
    });


    // Reemplazar el texto por el select
    spanDepartamento.replaceWith(select);


    // Cambiar lápiz por tilde
    const boton =
        contenedor.querySelector(".btn-editar");

    boton.innerHTML =
        '<i class="bi bi-check-lg"></i>';

    boton.title =
        "Guardar departamento";


    // Guardar
    boton.onclick = async () => {

        const nuevoDepartamento =
            select.value;


        try {

            const departamentoParaGuardar =
                nuevoDepartamento
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/\s+/g, "");


            await updateDoc(
                referenciaUsuario,
                {
                    departamento:
                        departamentoParaGuardar
                }
            );


            // Volver a mostrar el texto
            const nuevoSpan =
                document.createElement("span");

            nuevoSpan.id =
                "perfilDepartamento";

            nuevoSpan.textContent =
                normalizarDepartamento(
                    nuevoDepartamento
                );


            select.replaceWith(
                nuevoSpan
            );


            // Restaurar lápiz
            boton.innerHTML =
                '<i class="bi bi-pencil-square"></i>';

            boton.title =
                "Editar departamento";


            // Restaurar evento
            boton.onclick = null;

            boton.addEventListener(
                "click",
                () => {

                    editarDepartamento(
                        referenciaUsuario
                    );

                }
            );


            alert(
                "Departamento actualizado correctamente."
            );


        } catch (error) {

            console.error(
                "Error al actualizar el departamento:",
                error
            );

            alert(
                "No se pudo actualizar el departamento."
            );
        }
    };
}

// ======================================================
// EDITAR FOTO DE PERFIL
// ======================================================

async function editarFotoPerfil(user, referenciaUsuario) {

    const input =
        document.createElement("input");

    input.type = "file";
    input.accept = "image/*";

    input.click();


    input.addEventListener("change", async () => {

        const archivo = input.files[0];

        if (!archivo) {
            return;
        }


        // Verificar que sea una imagen
        if (!archivo.type.startsWith("image/")) {

            alert("Seleccioná una imagen válida.");

            return;
        }


        try {

            // Referencia donde se guardará la foto
            const referenciaFoto =
                ref(
                    storage,
                    `fotosPerfil/${user.uid}/fotoPerfil`
                );


            // Subir imagen
            await uploadBytes(
                referenciaFoto,
                archivo
            );


            // Obtener URL de la imagen
            const urlFoto =
                await getDownloadURL(
                    referenciaFoto
                );


            // Guardar URL en Firestore
            await updateDoc(
                referenciaUsuario,
                {
                    photoURL: urlFoto
                }
            );


            // Actualizar foto en Firebase Authentication
            await updateProfile(
                user,
                {
                    photoURL: urlFoto
                }
            );


            // Actualizar imagen en pantalla
            const avatar =
                document.querySelector(
                    ".avatar-wrapper"
                );


            if (avatar) {

                const imagen =
                    avatar.querySelector("img");


                if (imagen) {

                    imagen.src = urlFoto;

                } else {

                    const nuevaImagen =
                        document.createElement("img");

                    nuevaImagen.src =
                        urlFoto;

                    nuevaImagen.alt =
                        "Foto de perfil";

                    nuevaImagen.className =
                        "w-100 h-100 rounded-circle object-fit-cover";


                    const contenedorAvatar =
                        avatar.querySelector("div");


                    if (contenedorAvatar) {

                        contenedorAvatar.innerHTML = "";

                        contenedorAvatar.appendChild(
                            nuevaImagen
                        );
                    }
                }
            }


            alert(
                "Foto de perfil actualizada correctamente."
            );


        } catch (error) {

            console.error(
                "Error al actualizar la foto:",
                error
            );

            alert(
                "No se pudo actualizar la foto de perfil."
            );
        }

    });
}

// ======================================================
// CONFIGURAR BOTONES DE EDICIÓN
// ======================================================

function configurarBotonesEdicion(
    user,
    referenciaUsuario
) {

    const botonCamara =
    document.querySelector(".camera-btn");

        if (botonCamara) {

            botonCamara.addEventListener(
                "click",
                () => {

                    editarFotoPerfil(
                        user,
                        referenciaUsuario
                    );

                }
            );
        }

    const botones =
        document.querySelectorAll(
            ".btn-editar"
        );


    botones.forEach((boton) => {

        boton.addEventListener(
            "click",
            async () => {

                const titulo =
                    boton.getAttribute("title");


                if (
                    titulo === "Editar nombre"
                ) {

                    await editarNombre(
                        user,
                        referenciaUsuario
                    );

                }


                else if (
                    titulo === "Editar apellido"
                ) {

                    await editarApellido(
                        user,
                        referenciaUsuario
                    );

                }


                else if (
                    titulo === "Editar departamento"
                ) {

                    editarDepartamento(
                        referenciaUsuario
                    );

                }

            }
        );

    });
}

// ======================================================
// DETECTAR USUARIO AUTENTICADO
// ======================================================

onAuthStateChanged(auth, async (user) => {

    console.log(
        "AUTH STATE CAMBIÓ"
    );


    if (!user) {

        console.log(
            "NO HAY USUARIO AUTENTICADO"
        );

        window.location.href =
            "ingresar.html";

        return;
    }


    console.log(
        "USUARIO AUTENTICADO"
    );

    console.log(
        "UID:",
        user.uid
    );

    console.log(
        "EMAIL:",
        user.email
    );


    try {

        // ==============================================
        // REFERENCIA AL DOCUMENTO
        // ==============================================

        const referenciaUsuario =
            doc(
                db,
                "usuarios",
                user.uid
            );


        console.log(
            "LEYENDO DOCUMENTO:",
            `usuarios/${user.uid}`
        );


        // ==============================================
        // OBTENER DOCUMENTO
        // ==============================================

        const documentoUsuario =
            await getDoc(
                referenciaUsuario
            );


        console.log(
            "¿EXISTE EL DOCUMENTO?:",
            documentoUsuario.exists()
        );


        if (!documentoUsuario.exists()) {

            console.error(
                "No existe el documento del usuario en Firestore."
            );

            return;
        }


        // ==============================================
        // DATOS DEL USUARIO
        // ==============================================

        const datosUsuario =
            documentoUsuario.data();


        console.log(
            "DATOS DEL USUARIO:",
            datosUsuario
        );


        // ==============================================
        // CARGAR DATOS
        // ==============================================

        cargarDatosEnPerfil(
            datosUsuario,
            user
        );


        // ==============================================
        // CONFIGURAR LÁPICES
        // ==============================================

        configurarBotonesEdicion(
            user,
            referenciaUsuario
        );


        // ==============================================
        // ACTUALIZAR DISPLAY NAME SI ES NECESARIO
        // ==============================================

        const nombreCompleto =
            `${datosUsuario.nombre || ""} ${datosUsuario.apellido || ""}`
                .trim();


        if (
            nombreCompleto &&
            user.displayName !== nombreCompleto
        ) {

            await updateProfile(
                user,
                {
                    displayName: nombreCompleto
                }
            );

            console.log(
                "Nombre actualizado en Firebase Authentication."
            );
        }


    } catch (error) {

        console.error(
            "ERROR AL CARGAR EL PERFIL:",
            error
        );
    }

});