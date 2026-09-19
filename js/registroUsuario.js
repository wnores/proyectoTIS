import { auth, db } from "./firebase-config.js"; 
import { createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const CLOUDINARY_CLOUD_NAME = "fd9bzuxj"; 
const CLOUDINARY_UPLOAD_PRESET = "ProyectoTaller"; 

const form = document.getElementById("registerForm");
const passwordInput = document.getElementById("password");
const repetirPasswordInput = document.getElementById("repetirPassword");
const emailInput = document.getElementById("email");
const nroDocumentoInput = document.getElementById("nroDocumento");
const registerError = document.getElementById("registerError");
const submitBtn = form ? form.querySelector('button[type="submit"]') : null;

const avatarBtn = document.getElementById("avatarBtn");
const avatarInput = document.getElementById("avatarInput");
const avatarPreview = document.getElementById("avatarPreview");
const avatarIcon = document.getElementById("avatarIcon");
const avatarImg = document.getElementById("avatarImg");

let archivoImagen = null;
let timerOverlay = null;

if (avatarBtn && avatarInput) {
  avatarBtn.addEventListener("click", () => avatarInput.click());
  if (avatarPreview) avatarPreview.addEventListener("click", () => avatarInput.click());

  avatarInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      archivoImagen = file;
      avatarImg.src = URL.createObjectURL(file);
      avatarImg.classList.remove("d-none");
      if (avatarIcon) avatarIcon.classList.add("d-none");
    }
  });
}

async function subirACloudinary(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: formData
  });

  if (!res.ok) {
    throw new Error("Error al subir la imagen a Cloudinary");
  }

  const data = await res.json();
  return data.secure_url; 
}

const regexPassword = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const regexDoc = /^[0-9]{6,9}$/;

function validarContrasenia() {
  if (!regexPassword.test(passwordInput.value)) {
    passwordInput.setCustomValidity("Requisitos no cumplidos.");
    passwordInput.classList.add("is-invalid");
    passwordInput.classList.remove("is-valid");
    return false;
  }
  passwordInput.setCustomValidity("");
  passwordInput.classList.remove("is-invalid");
  passwordInput.classList.add("is-valid");
  return true;
}

function validarCoincidenciaContrasenias() {
  if (repetirPasswordInput.value === "" || passwordInput.value !== repetirPasswordInput.value) {
    repetirPasswordInput.setCustomValidity("No coinciden.");
    repetirPasswordInput.classList.add("is-invalid");
    repetirPasswordInput.classList.remove("is-valid");
    return false;
  }
  repetirPasswordInput.setCustomValidity("");
  repetirPasswordInput.classList.remove("is-invalid");
  repetirPasswordInput.classList.add("is-valid");
  return true;
}

function validarEmail() {
  if (!regexEmail.test(emailInput.value.trim())) {
    emailInput.setCustomValidity("Email inválido.");
    return false;
  }
  emailInput.setCustomValidity("");
  return true;
}

function validarDocumento() {
  if (!regexDoc.test(nroDocumentoInput.value.trim())) {
    nroDocumentoInput.setCustomValidity("Documento inválido.");
    return false;
  }
  nroDocumentoInput.setCustomValidity("");
  return true;
}

if (passwordInput) {
  passwordInput.addEventListener("input", () => {
    validarContrasenia();
    if (repetirPasswordInput.value !== "") validarCoincidenciaContrasenias();
  });
}
if (repetirPasswordInput) repetirPasswordInput.addEventListener("input", validarCoincidenciaContrasenias);
if (emailInput) emailInput.addEventListener("input", validarEmail);
if (nroDocumentoInput) nroDocumentoInput.addEventListener("input", validarDocumento);

function ocultarError() {
  if (registerError) {
    registerError.textContent = "";
    registerError.classList.add("d-none");
  }
}

function mostrarError(mensaje) {
  if (registerError) {
    registerError.textContent = mensaje || "Ocurrió un error inesperado.";
    registerError.classList.remove("d-none");
  }
}

function deshabilitarBoton(deshabilitar) {
  if (submitBtn) submitBtn.disabled = deshabilitar;
}

function traducirError(codigo) {
  switch (codigo) {
    case "auth/email-already-in-use": return "El correo electrónico ya está registrado.";
    case "auth/invalid-email": return "El correo electrónico no es válido.";
    case "auth/weak-password": return "La contraseña es muy débil.";
    default: return "Ocurrió un error al registrar el usuario.";
  }
}

function mostrarRegistroExitoso(onComplete) {
  const overlay = document.getElementById("successOverlay");
  const cerrarBtn = document.getElementById("cerrarOverlayBtn");

  const cardFormulario = document.querySelector(".register-card") || form;
  if (cardFormulario) {
    cardFormulario.style.visibility = "hidden";
  }

  if (overlay) {
    overlay.classList.remove("d-none");
    overlay.classList.add("position-fixed", "top-0", "start-0", "w-100", "h-100", "bg-white");
    overlay.style.zIndex = "9999";

    const ocultarYRedirigir = () => {
      overlay.classList.add("d-none");
      if (timerOverlay) clearTimeout(timerOverlay);
      if (onComplete) onComplete();
    };

    if (cerrarBtn) cerrarBtn.addEventListener("click", ocultarYRedirigir, { once: true });
    timerOverlay = setTimeout(ocultarYRedirigir, 3000);
  } else if (onComplete) {
    onComplete();
  }
}

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    event.stopPropagation();

    const esPassValida = validarContrasenia();
    const coinciden = validarCoincidenciaContrasenias();
    const emailValido = validarEmail();
    const docValido = validarDocumento();

    form.classList.add("was-validated");

    if (!form.checkValidity() || !esPassValida || !coinciden || !emailValido || !docValido) {
      return;
    }

    const nombre = document.getElementById("nombre").value.trim();
    const apellido = document.getElementById("apellido").value.trim();
    const email = emailInput.value.trim();
    const departamento = document.getElementById("departamento").value;
    const password = passwordInput.value;
    const tipoDocumento = document.getElementById("tipoDocumento").value;
    const nroDocumento = nroDocumentoInput.value.trim();

    ocultarError();
    deshabilitarBoton(true);

    try {
      let photoURL = null;

      if (archivoImagen) {
        photoURL = await subirACloudinary(archivoImagen);
      }

      const credenciales = await createUserWithEmailAndPassword(auth, email, password);
      const uid = credenciales.user.uid;

      await updateProfile(credenciales.user, {
        displayName: `${nombre} ${apellido}`,
        photoURL: photoURL
      });

      await setDoc(doc(db, "usuarios", uid), {
        nombre,
        apellido,
        email,
        departamento,
        tipoDocumento,
        nroDocumento,
        photoURL: photoURL,
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
}