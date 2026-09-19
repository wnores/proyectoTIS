import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const contenidoAdministrador = document.getElementById("contenidoAdministrador");

iniciarPagina();

function iniciarPagina() {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            alert("Debés iniciar sesión para acceder.");
            window.location.replace("ingresar.html");
            return;
        }

        try {
            const referenciaUsuario = doc(db, "usuarios", user.uid);
            const docSnap = await getDoc(referenciaUsuario);

            if (docSnap.exists()) {
                const datosUsuario = docSnap.data();
                const rol = (datosUsuario.tipoUsuario || datosUsuario.rol || "").toLowerCase().trim();

                // 3. Validar si el rol es docente o admin
                if (rol.includes("docente") || rol.includes("admin")) {
                    if (contenidoAdministrador) {
                        contenidoAdministrador.classList.remove("d-none");
                    }
                } else {
                    alert("No tenés permiso para administrar cursos.");
                    window.location.replace("index.html");
                }
            } else {
                alert("No se encontraron los datos de tu usuario.");
                window.location.replace("index.html");
            }
        } catch (error) {
            console.error("Error al verificar permisos:", error);
            window.location.replace("index.html");
        }
    });
}
