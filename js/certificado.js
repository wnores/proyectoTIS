import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const estadoCarga = document.getElementById("estadoCarga");
const mensajeError = document.getElementById("mensajeError");
const zonaCertificado = document.getElementById("zonaCertificado");
const certificado = document.getElementById("certificado");
const btnDescargar = document.getElementById("btnDescargar");

const cursoId = new URLSearchParams(window.location.search).get("curso");
let tituloCurso = "Curso";

if (!cursoId) {
    mostrarError("No se indicó de qué curso es el certificado.");
} else {
    onAuthStateChanged(auth, async (usuario) => {
        if (!usuario) {
            window.location.href = "ingresar.html";
            return;
        }

        try {
            const [resCertificado, resUsuario, resCurso] = await Promise.all([
                getDoc(doc(db, "certificados", `${usuario.uid}_${cursoId}`)),
                getDoc(doc(db, "usuarios", usuario.uid)),
                getDoc(doc(db, "cursoscc", cursoId))
            ]);

            if (!resCertificado.exists()) {
                mostrarError(
                    "Todavía no tenés un certificado para este curso. Se emite cuando el docente carga una nota aprobatoria."
                );
                return;
            }

            if (!resUsuario.exists() || !resCurso.exists()) {
                mostrarError("No se pudieron obtener los datos del certificado o del curso.");
                return;
            }

            const datosCert = resCertificado.data();
            const notaObtenida = Number(datosCert.nota ?? 0);

            const NOTA_MINIMA = 6;

            if (notaObtenida < NOTA_MINIMA) {
                mostrarError(`Tu calificación es ${notaObtenida}. No aprobaste el curso, por lo tanto no hay certificado disponible.`);
                return;
            }

            mostrarCertificado(
                datosCert,
                resUsuario.data(),
                resCurso.data()
            );
        } catch (error) {
            console.error("Error al cargar el certificado:", error);
            mostrarError("No fue posible cargar el certificado.");
        }
    });
}

function mostrarCertificado(cert, usuario, curso) {
    tituloCurso = curso.titulo ?? "Curso";

    const tipoDoc = String(usuario.tipoDocumento ?? "").toLowerCase();
    const etiquetaDoc = tipoDoc === "ci" ? "C.I." : tipoDoc.toUpperCase() || "Documento";

    const fecha = cert.fecha?.toDate ? cert.fecha.toDate() : new Date();

    document.getElementById("certNombre").textContent =
        `${usuario.nombre ?? ""} ${usuario.apellido ?? ""}`.trim();
    document.getElementById("certDocumento").textContent =
        `${etiquetaDoc} ${usuario.nroDocumento ?? ""}`.trim();
    document.getElementById("certCurso").textContent = tituloCurso;
    document.getElementById("certHoras").textContent = curso.duracion_horas ?? "-";
    document.getElementById("certNota").textContent = cert.nota ?? "-";
    document.getElementById("certFecha").textContent = fecha.toLocaleDateString("es-UY", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
    document.getElementById("certCodigo").textContent = cert.codigo ?? "-";

    estadoCarga.classList.add("d-none");
    mensajeError.classList.add("d-none");
    zonaCertificado.classList.remove("d-none");
}

if (btnDescargar) {
    btnDescargar.addEventListener("click", () => {
        const nombreArchivo = `Certificado - ${tituloCurso}`.replace(/[\\/:*?"<>|]/g, "");

        const textoOriginal = btnDescargar.innerHTML;
        btnDescargar.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status"></span>Generando PDF...`;
        btnDescargar.disabled = true;

        html2pdf()
            .set({
                margin: 0,
                filename: `${nombreArchivo}.pdf`,
                image: { type: "jpeg", quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: "mm", format: "a4", orientation: "landscape" }
            })
            .from(certificado)
            .save()
            .then(() => {
                btnDescargar.innerHTML = textoOriginal;
                btnDescargar.disabled = false;
            })
            .catch((err) => {
                console.error("Error al generar PDF:", err);
                btnDescargar.innerHTML = textoOriginal;
                btnDescargar.disabled = false;
            });
    });
}

function mostrarError(mensaje) {
    estadoCarga.classList.add("d-none");
    zonaCertificado.classList.add("d-none");
    mensajeError.textContent = mensaje;
    mensajeError.classList.remove("d-none");
}