import { auth, db } from "./firebase-config.js"; 
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const form = document.getElementById("registerForm");
const errorBox = document.getElementById("registerError");
const submitBtn = form.querySelector('button[type="submit"]');

// Alternar visibilidad de contraseña
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

// Manejo del Avatar
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

// Envío del Formulario
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  event.stopPropagation();

  if (!form.checkValidity()) {
    form.classList.add("was-validated");
    return;
  }

  const nombre = document.getElementById("nombre").value.trim();
  const apellido = document.getElementById("apellido").value.trim();
  const email = document.getElementById("email").value.trim();
  const departamento = document.getElementById("departamento").value;
  const password = document.getElementById("password").value;
  const repetirPassword = document.getElementById("repetirPassword").value;
  const tipoDocumento = document.getElementById("tipoDocumento").value;
  const nroDocumento = document.getElementById("nroDocumento").value.trim();

  ocultarError();

  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!regexEmail.test(email)) {
    mostrarError("Ingresá un correo electrónico válido (ejemplo: usuario@dominio.com).");
    return;
  }

  const regexDocumento = /^\d{6,9}$/;
  if (!regexDocumento.test(nroDocumento)) {
    mostrarError("El número de documento debe contener solo números, sin puntos ni guiones.");
    return;
  }

  if (password !== repetirPassword) {
    mostrarError("Las contraseñas no coinciden.");
    return;
  }

  const regexPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!regexPassword.test(password)) {
    mostrarError("La contraseña debe tener al menos 8 caracteres, incluir una letra mayúscula, una minúscula y un número.");
    return;
  }

  deshabilitarBoton(true);

  try {
    // 1. Crear usuario en Firebase Auth
    const credenciales = await createUserWithEmailAndPassword(auth, email, password);
    const uid = credenciales.user.uid;

    // 2. Guardar datos en Firestore
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

    // Redirección con sintaxis corregida
    setTimeout(() => {
      window.location.href = "index.html"; 
    }, 1500);

  } catch (error) {
    console.error("Error al registrar:", error);
    mostrarError(traducirError(error?.code));
    deshabilitarBoton(false);
  }
});

// Función para disparar la microinteracción con Bootstrap Toast
function mostrarRegistroExitoso() {
  const toastElement = document.getElementById("successToast");
  if (toastElement) {
    const toast = new bootstrap.Toast(toastElement, { delay: 2000 });
    toast.show();
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