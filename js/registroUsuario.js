import { auth, db } from "./firebase-config.js"; 
import { createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


form.addEventListener("submit", async (event) => {
  event.preventDefault();
  event.stopPropagation();

  validarCoincidenciaContraseñas();
  validarEmail();

  form.classList.add("was-validated");

  if (!form.checkValidity()) {
    return;
  }

  const nombre = document.getElementById("nombre").value.trim();
  const apellido = document.getElementById("apellido").value.trim();
  const email = document.getElementById("email").value.trim();
  const departamento = document.getElementById("departamento").value;
  const password = passwordInput.value;
  const tipoDocumento = document.getElementById("tipoDocumento").value;
  const nroDocumento = document.getElementById("nroDocumento").value.trim();

  ocultarError();
  deshabilitarBoton(true);

  try {
    const credenciales = await createUserWithEmailAndPassword(auth, email, password);
    const uid = credenciales.user.uid;

    await updateProfile(credenciales.user, {
      displayName: `${nombre} ${apellido}`
    });

    await setDoc(doc(db, "usuarios", uid), {
      nombre,
      apellido,
      email,
      departamento,
      tipoDocumento,
      nroDocumento,
      tipoUsuario: "estudiante",
      creadoEn: new Date()
    });

    mostrarRegistroExitoso(() => {
      window.location.href = "index.html"; 
    });

  } catch (error) {
    console.error("Error al registrar:", error);
    mostrarError(traducirError(error?.code));
    deshabilitarBoton(false);
  }
});

function mostrarRegistroExitoso(onComplete) {
  const overlay = document.getElementById("successOverlay");
  const cerrarBtn = document.getElementById("cerrarOverlayBtn");

  if (overlay) {
    overlay.classList.remove("d-none");
    
    const ocultarYRedirigir = () => {
      overlay.classList.add("d-none");
      if (timerOverlay) clearTimeout(timerOverlay);
      if (onComplete) onComplete();
    };

    if (cerrarBtn) {
      cerrarBtn.addEventListener("click", ocultarYRedirigir, { once: true });
    }

    timerOverlay = setTimeout(() => {
      ocultarYRedirigir();
    }, 3500);
  }
}