import {auth, db} from "./firebase-config.js";
import {onAuthStateChanged} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import {doc, getDoc} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const estadoCarga =
    document.getElementById("estadoCarga");

const comprobanteCompra =
    document.getElementById("comprobanteCompra");

const mensajeError =
    document.getElementById("mensajeError");

const textoError =
    document.getElementById("textoError");

const parametros =
    new URLSearchParams(window.location.search);

const adquisicionId =
    parametros.get("id");

onAuthStateChanged(auth, async (usuario) => {
    if (!usuario) {
        window.location.href = "ingresar.html";
        return;
    }

    if (!adquisicionId) {
        mostrarError(
            "No se indicó qué comprobante se debe mostrar."
        );
        return;
    }

    try {
        const referenciaAdquisicion = doc(
            db,
            "adquisiciones",
            adquisicionId
        );

        const resultado =
            await getDoc(referenciaAdquisicion);

        if (!resultado.exists()) {
            mostrarError(
                "El comprobante solicitado no existe."
            );
            return;
        }

        const adquisicion = resultado.data();

        if (adquisicion.usuarioId !== usuario.uid) {
            mostrarError(
                "No tenés permiso para consultar este comprobante."
            );
            return;
        }

        mostrarComprobante(
            adquisicion,
            resultado.id
        );

    } catch (error) {
        console.error(
            "Error al obtener el comprobante:",
            error
        );

        mostrarError(
            "No fue posible cargar el comprobante."
        );
    }
});

function mostrarComprobante(adquisicion, idDocumento) {
    document.getElementById(
        "comprobanteNumero"
    ).textContent =
        adquisicion.numeroComprobante ||
        idDocumento;

    document.getElementById(
        "comprobanteCurso"
    ).textContent =
        adquisicion.cursoTitulo ||
        "Curso sin título";

    document.getElementById(
        "comprobantePrecio"
    ).textContent =
        Number(adquisicion.precio || 0)
            .toLocaleString("es-UY", {
                style: "currency",
                currency: "UYU"
            });

    document.getElementById(
        "comprobanteMetodo"
    ).textContent =
        obtenerNombreMetodo(
            adquisicion.metodoPago
        );

    document.getElementById(
        "comprobanteFecha"
    ).textContent =
        obtenerFecha(
            adquisicion.fechaAdquisicion
        );

    const estado =
        document.getElementById(
            "comprobanteEstado"
        );

    estado.textContent =
        obtenerNombreEstado(
            adquisicion.estado
        );

    if (adquisicion.estado === "aprobada") {
        estado.className =
            "badge text-bg-success";
    } else {
        estado.className =
            "badge text-bg-warning";
    }

    estadoCarga.classList.add("d-none");
    comprobanteCompra.classList.remove("d-none");
}

function obtenerNombreMetodo(metodo) {
    const metodos = {
        tarjeta: "Tarjeta",
        transferencia: "Transferencia bancaria"
    };

    return metodos[metodo] || metodo;
}

function obtenerNombreEstado(estado) {
    const estados = {
        aprobada: "Aprobada",
        pendiente: "Pendiente de verificación",
        rechazada: "Rechazada"
    };

    return estados[estado] || estado;
}

function obtenerFecha(fechaFirestore) {
    if (!fechaFirestore) {
        return "Fecha no disponible";
    }

    const fecha = fechaFirestore.toDate
        ? fechaFirestore.toDate()
        : new Date(fechaFirestore);

    return fecha.toLocaleString("es-UY", {
        dateStyle: "short",
        timeStyle: "short"
    });
}

function mostrarError(mensaje) {
    estadoCarga.classList.add("d-none");
    comprobanteCompra.classList.add("d-none");

    textoError.textContent = mensaje;
    mensajeError.classList.remove("d-none");
}

const btnImprimirComprobante =
    document.getElementById(
        "btnImprimirComprobante"
    );

btnImprimirComprobante.addEventListener(
    "click",
    () => {
        window.print();
    }
);