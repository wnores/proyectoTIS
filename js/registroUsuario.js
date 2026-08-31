import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const form = document.getElementById("registerForm");
const errorBox = document.getElementById("registerError");
const submitBtn = form.querySelector('button[type="submit"]');

function activarToggleContraseña(inputId, botonId, iconoId) {
  const input = document.getElementById(inputId);
  const boton = document.getElementById(botonId);
  const icono = document.getElementById(iconoId);

  boton.addEventListener("click", () => {
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

  if (password !== repetirPassword) {
    mostrarError("Las contraseñas no coinciden.");
    return;
  }

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
      Documento,
      tipoUsuario: "estudiante",
    });

    window.location.href = "index.html";

  } catch (error) {
    mostrarError(traducirError(error.code));
    deshabilitarBoton(false);
  }
});

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
    default:
      return "Ocurrió un error al crear la cuenta. Intentá de nuevo.";
  }
}