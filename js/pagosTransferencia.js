import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
    collection,
    getDocs,
    query,
    where,
    doc,
    updateDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


const contenedor =
    document.getElementById("contenedorPagosTransferencia");


onAuthStateChanged(auth, async (usuario) => {

    if (!usuario) {
        mostrarMensaje(
            "Debés iniciar sesión para acceder a esta sección."
        );

        return;
    }

    try {

        const referenciaUsuario =
            doc(
                db,
                "usuarios",
                usuario.uid
            );

        const resultadoUsuario =
            await getDoc(referenciaUsuario);

        if (!resultadoUsuario.exists()) {

            mostrarMensaje(
                "No se encontraron los datos del usuario."
            );

            return;
        }

        const datosUsuario =
            resultadoUsuario.data();

        const tipoUsuario =
            (
                datosUsuario.tipoUsuario ||
                datosUsuario.rol ||
                ""
            )
                .toString()
                .trim()
                .toLowerCase();


        if (tipoUsuario !== "docente/admin") {

            mostrarMensaje(
                "No tenés permisos para acceder a esta sección."
            );

            return;
        }


        cargarPagosPendientes();

    } catch (error) {

        console.error(
            "Error al verificar permisos:",
            error
        );

        mostrarMensaje(
            "No fue posible verificar los permisos."
        );
    }
});


async function cargarPagosPendientes() {

    try {

        const referenciaAdquisiciones =
            collection(
                db,
                "adquisiciones"
            );

        const consulta =
            query(
                referenciaAdquisiciones,
                where(
                    "metodoPago",
                    "==",
                    "transferencia"
                ),
                where(
                    "estado",
                    "==",
                    "pendiente"
                )
            );

        const resultado =
            await getDocs(consulta);


        if (resultado.empty) {

            mostrarMensaje(
                "No hay pagos por transferencia pendientes."
            );

            return;
        }


        contenedor.innerHTML = "";


        resultado.forEach((documento) => {

            const adquisicion =
                documento.data();

            const tarjeta =
                crearTarjetaPago(
                    documento.id,
                    adquisicion
                );

            contenedor.appendChild(tarjeta);

        });

    } catch (error) {

        console.error(
            "Error al cargar pagos pendientes:",
            error
        );

        mostrarMensaje(
            "No fue posible cargar los pagos pendientes."
        );
    }
}


function crearTarjetaPago(
    idAdquisicion,
    adquisicion
) {

    const columna =
        document.createElement("div");

    columna.className =
        "col-12 col-md-6 col-lg-4";


    const tarjeta =
        document.createElement("article");

    tarjeta.className =
        "card h-100 shadow-sm";


    const cuerpo =
        document.createElement("div");

    cuerpo.className =
        "card-body";


    const fecha =
        formatearFecha(
            adquisicion.fechaAdquisicion
        );


    cuerpo.innerHTML = `

        <div class="d-flex justify-content-between align-items-start mb-3">

            <div>
                <h3 class="h5 mb-1">
                    ${adquisicion.cursoTitulo || "Curso sin título"}
                </h3>

                <span class="badge text-bg-warning">
                    Pendiente
                </span>
            </div>

            <i class="bi bi-bank fs-3 text-success"></i>

        </div>


        <p class="mb-2">
            <strong>Usuario:</strong>
            ${adquisicion.usuarioId || "No disponible"}
        </p>


        <p class="mb-2">
            <strong>Importe:</strong>
            ${formatearPrecio(adquisicion.precio)}
        </p>


        <p class="mb-3">
            <strong>Fecha:</strong>
            ${fecha}
        </p>


        <button
            type="button"
            class="btn btn-success w-100 btn-aprobar-transferencia">

            <i class="bi bi-check-circle me-2"></i>
            Aprobar pago

        </button>
    `;


    const boton =
        cuerpo.querySelector(
            ".btn-aprobar-transferencia"
        );


    boton.addEventListener(
        "click",
        () => aprobarPago(
            idAdquisicion,
            boton
        )
    );


    tarjeta.appendChild(cuerpo);
    columna.appendChild(tarjeta);


    return columna;
}


async function aprobarPago(
    idAdquisicion,
    boton
) {

    const confirmar =
        confirm(
            "¿Confirmás que la transferencia bancaria fue recibida?"
        );


    if (!confirmar) {
        return;
    }


    try {

        boton.disabled = true;

        boton.innerHTML = `
            <span
                class="spinner-border spinner-border-sm me-2"
                aria-hidden="true">
            </span>

            Aprobando...
        `;


        const referenciaAdquisicion =
            doc(
                db,
                "adquisiciones",
                idAdquisicion
            );


        await updateDoc(
            referenciaAdquisicion,
            {
                estado: "aprobada"
            }
        );


        alert(
            "El pago fue aprobado correctamente."
        );


        cargarPagosPendientes();


    } catch (error) {

        console.error(
            "Error al aprobar el pago:",
            error
        );


        alert(
            "No fue posible aprobar el pago. Intentá nuevamente."
        );


        boton.disabled = false;

        boton.innerHTML = `
            <i class="bi bi-check-circle me-2"></i>
            Aprobar pago
        `;
    }
}


function formatearPrecio(precio) {

    return Number(
        precio || 0
    ).toLocaleString(
        "es-UY",
        {
            style: "currency",
            currency: "UYU"
        }
    );
}


function formatearFecha(timestamp) {

    if (!timestamp) {
        return "No disponible";
    }


    try {

        return timestamp
            .toDate()
            .toLocaleString(
                "es-UY"
            );

    } catch {

        return "No disponible";
    }
}


function mostrarMensaje(mensaje) {

    if (!contenedor) {
        return;
    }


    contenedor.innerHTML = `

        <div class="col-12 text-center">

            <div class="alert alert-info">

                ${mensaje}

            </div>

        </div>

    `;
}