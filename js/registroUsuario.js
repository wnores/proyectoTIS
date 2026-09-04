import { auth, db } from "./firebase-config.js"; 
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const form = document.getElementById("registerForm");
const errorBox = document.getElementById("registerError");
const submitBtn = form.querySelector('button[type="submit"]');
const passwordInput = document.getElementById("password");
const repetirPasswordInput = document.getElementById("repetirPassword");

function validarCoincidenciaContraseñas() {
  if (repetirPasswordInput.value !== passwordInput.value) {
    repetirPasswordInput.setCustomValidity("Las contraseñas no coinciden.");
  } else {
    repetirPasswordInput.setCustomValidity("");
  }
}

passwordInput.addEventListener("input", validarCoincidenciaContraseñas);
repetirPasswordInput.addEventListener("input", validarCoincidenciaContraseñas);

function activarToggleContraseña(inputId, botonId, iconoId) {
  const input = document.getElementById(inputId);
  const boton = document.getElementById(botonId);
  const icono = document.getElementById(iconoId);

  if (!input || !boton || !icono) return;

  boton.addEventListener("click", (e) => {
    e.preventDefault();
    const oculto = input.type === "password";
    input.type = oculto ? "text" : "password";
    icono.classList.toggle("bi-eye", !oculto);
    icono.classList.toggle("bi-eye-slash", oculto);
  });
}

activarToggleContraseña("password", "togglePassword", "togglePasswordIcon");
activarToggleContraseña("repetirPassword", "toggleRepetirPassword", "toggleRepetirPasswordIcon");

const avatarBtn = document.getElementById("avatarBtn");
const avatarInput = document.getElementById("avatarInput");
const avatarImg = document.getElementById("avatarImg");
const avatarIcon = document.getElementById("avatarIcon");
let avatarFile = null; 

if (avatarBtn && avatarInput) {
  avatarBtn.addEventListener("click", () => avatarInput.click());

  avatarInput.addEventListener("change", () => {
    const archivo = avatarInput.files[0];
    if (!archivo) return;

    avatarFile = archivo;

    const lector = new FileReader();
    lector.onload = (e) => {
      avatarImg.src = e.target.result;
      avatarImg.classList.remove("d-none");
      avatarIcon.classList.add("d-none");
    };
    lector.readAsDataURL(archivo);
  });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  event.stopPropagation();

  validarCoincidenciaContraseñas();
  validarEmail();

  form.classList.add("was-validated");

  if (!form.checkValidity()) {
    if (emailInput.validity.customError) {
      mostrarError("Ingresá un correo electrónico válido (ejemplo: usuario@dominio.com).");
    } else if (passwordInput.validity.patternMismatch) {
      mostrarError("La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.");
    } else if (repetirPasswordInput.validity.customError) {
      mostrarError("Las contraseñas ingresadas no coinciden.");
    }
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

    mostrarRegistroExitoso();

    setTimeout(() => {
      window.location.href = "index.html"; 
    }, 1500);

  } catch (error) {
    console.error("Error al registrar:", error);
    mostrarError(traducirError(error?.code));
    deshabilitarBoton(false);
  }
});

const emailInput = document.getElementById("email");
function validarEmail() {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const valor = emailInput.value.trim();
  if (!emailRegex.test(valor)) {
    emailInput.setCustomValidity("Correo no válido");
  } else {
    emailInput.setCustomValidity("");
  }
}
emailInput.addEventListener("input", validarEmail);

let timerOverlay = null;

function mostrarRegistroExitoso() {
  const overlay = document.getElementById("successOverlay");
  const cerrarBtn = document.getElementById("cerrarOverlayBtn");

  if (overlay) {
    overlay.classList.remove("d-none");
    const ocultarOverlay = () => {
      overlay.classList.add("d-none");
      if (timerOverlay) clearTimeout(timerOverlay);
    };

    if (cerrarBtn) {
      cerrarBtn.addEventListener("click", ocultarOverlay, { once: true });
    }

    timerOverlay = setTimeout(() => {
      ocultarOverlay();
    }, 5000);
  }
}

function mostrarError(mensaje) {
  errorBox.textContent = mensaje;
  errorBox.classList.remove("d-none");
}

function ocultarError() {
  errorBox.textContent = "";
  errorBox.classList.add("d-none");
}

function deshabilitarBoton(deshabilitado) {
  submitBtn.disabled = deshabilitado;
  submitBtn.textContent = deshabilitado ? "Creando cuenta..." : "Registrarme";
}

function traducirError(codigo) {
  switch (codigo) {
    case "auth/email-already-in-use":
      return "Ese correo electrónico ya está registrado.";
    case "auth/weak-password":
      return "La contraseña es demasiado débil (mínimo 6 caracteres).";
    case "auth/invalid-email":
      return "El correo electrónico no es válido.";
    case "permission-denied":
      return "Error de permisos en Firestore. Revisa las reglas de seguridad.";
    default:
      return "Ocurrió un error al crear la cuenta. Revisa la consola F12.";
  }
}