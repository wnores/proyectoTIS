import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { auth } from "./firebase.js"; 

const registerForm = document.querySelector('#registerForm');

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nombre = registerForm['nombre'].value;
    const apellido = registerForm['apellido'].value;
    const correo = registerForm['correo'].value;
    const password = registerForm['password'].value;
    const confirmPassword = registerForm['confirmPassword'].value;
    
    try {
        if (password !== confirmPassword) {
            alert("Las contraseñas no coinciden");
            return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, correo, password);
        
        alert("Usuario registrado exitosamente: " + userCredential.user.email);
        setTimeout(() => {
            window.location.href = "../index.html";
        }, 1500); // 1500 milisegundos = 1.5 segundos

    } catch (error) {
        
        alert("Error al registrar el usuario: " + error.message);
    }
});