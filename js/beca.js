import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    getDoc, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

function mostrarNotificacionExito(mensaje, redireccionarA = "index.html", tiempoEspera = 3000) {
   
    if (typeof Swal !== "undefined") {
        Swal.fire({
            icon: 'success',
            title: '¡Solicitud Enviada!',
            text: mensaje,
            showConfirmButton: false,
            timer: tiempoEspera,
            timerProgressBar: true
        }).then(() => {
            window.location.href = redireccionarA;
        });
        return;
    }

    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.zIndex = "9999";
    overlay.style.backdropFilter = "blur(4px)";

    overlay.innerHTML = `
        <div style="
            background: #ffffff;
            padding: 30px;
            border-radius: 16px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            text-align: center;
            max-width: 400px;
            width: 90%;
            animation: popIn 0.3s ease-out;
            font-family: system-ui, -apple-system, sans-serif;
        ">
            <div style="
                width: 60px;
                height: 60px;
                background-color: #d1e7dd;
                color: #0f5132;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 15px auto;
                font-size: 30px;
            ">✓</div>
            <h3 style="margin: 0 0 10px 0; color: #198754; font-size: 1.5rem;">¡Solicitud enviada!</h3>
            <p style="margin: 0 0 15px 0; color: #6c757d; font-size: 0.95rem;">${mensaje}</p>
            <small style="color: #6c757d; font-style: italic;">Redirigiendo al inicio en breve...</small>
        </div>
    `;

    document.body.appendChild(overlay);

    setTimeout(() => {
        window.location.href = redireccionarA;
    }, tiempoEspera);
}

function controlarAccesoBoton() {
    const btnSolicitarBeca = document.getElementById("btnSolicitarBeca");
    if (!btnSolicitarBeca) return;

    btnSolicitarBeca.addEventListener("click", (evento) => {
        if (btnSolicitarBeca.disabled) {
            evento.preventDefault();
            evento.stopPropagation();
        }
    });

    onAuthStateChanged(auth, async (usuario) => {
        if (!usuario) {
            btnSolicitarBeca.disabled = true;
            btnSolicitarBeca.title = "Debés iniciar sesión para solicitar una beca.";
            return;
        }

        try {
            const userDocRef = doc(db, "usuarios", usuario.uid);
            const userSnapshot = await getDoc(userDocRef);

            if (userSnapshot.exists()) {
                const datosUsuario = userSnapshot.data();
                const tipoUsuario = datosUsuario.tipoUsuario 
                    ? String(datosUsuario.tipoUsuario).trim().toLowerCase() 
                    : "";

                if (tipoUsuario === "estudiante") {
                    btnSolicitarBeca.disabled = false;
                    btnSolicitarBeca.removeAttribute("title");
                } else {
                    btnSolicitarBeca.disabled = true;
                    btnSolicitarBeca.title = "Solo los usuarios registrados como estudiantes pueden solicitar becas.";
                }
            } else {
                btnSolicitarBeca.disabled = true;
                btnSolicitarBeca.title = "No se encontraron datos asociados a tu usuario.";
            }
        } catch (error) {
            console.error("Error al obtener el tipo de usuario desde Firestore:", error);
            btnSolicitarBeca.disabled = true;
        }
    });
}

async function cargarCursosEnSelect() {
    const selectCurso = document.getElementById("curso");
    if (!selectCurso) return;

    try {
        const querySnapshot = await getDocs(collection(db, "cursos"));
        selectCurso.innerHTML = `<option value="">Seleccioná un curso...</option>`;

        querySnapshot.forEach((doc) => {
            const curso = doc.data();
            const option = document.createElement("option");
            option.value = doc.id;
            option.textContent = curso.nombre || curso.titulo || curso.nombreCurso || "Curso sin nombre";
            selectCurso.appendChild(option);
        });

        const parametros = new URLSearchParams(window.location.search);
        const cursoId = parametros.get("curso");
        if (cursoId) {
            selectCurso.value = cursoId;
        }

    } catch (error) {
        console.error("Error al obtener los cursos desde Firestore:", error);
        selectCurso.innerHTML = `<option value="">Error al cargar los cursos</option>`;
    }
}

function inicializarFormularioBeca() {
    const formulario = document.getElementById("formularioBeca");
    if (!formulario) return;

    formulario.addEventListener("submit", async (evento) => {
        evento.preventDefault();

        const usuario = auth.currentUser;
        if (!usuario) {
            alert("Debés iniciar sesión para solicitar una beca.");
            return;
        }

        const nombre = document.getElementById("nombre").value.trim();
        const correo = document.getElementById("correo").value.trim();
        const curso = document.getElementById("curso").value;
        const tipoBeca = document.getElementById("tipo-beca").value;
        const motivo = document.getElementById("motivo").value.trim();

        try {
            await addDoc(collection(db, "solicitudesBecas"), {
                uid: usuario.uid,
                nombre: nombre,
                correo: correo,
                curso: curso,
                tipoBeca: tipoBeca,
                motivo: motivo,
                estado: "pendiente",
                fechaSolicitud: serverTimestamp()
            });

            formulario.reset();

            mostrarNotificacionExito(
                "Tu solicitud fue registrada con éxito. Te avisaremos pronto sobre el estado de la beca.", 
                "index.html", 
                3000
            );

        } catch (error) {
            console.error("Error al guardar la solicitud de beca:", error);
            alert("No se pudo enviar la solicitud. Intentá nuevamente.");
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    controlarAccesoBoton();
    cargarCursosEnSelect();
    inicializarFormularioBeca();
});