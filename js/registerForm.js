    import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
    import { auth } from "./firebase.js"; 
    import {showMessage} from "./showMessage.js";

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
            
            showMessage("Usuario registrado exitosamente: " + userCredential.user.email, "success");
            setTimeout(() => {
                window.location.href = "../index.html";
            }, 1500); // 1500 milisegundos = 1.5 segundos

        } catch (error) {
            if(error.code === 'auth/email-already-in-use') {
                showMessage("El correo ya está en uso. Por favor, utiliza otro correo.", "error");  
            } else if(error.code === 'auth/invalid-email') {
                showMessage("El correo electrónico no es válido. Por favor, ingresa un correo válido.", "error");
            }else if(error.code === 'auth/weak-password') {
                showMessage("La contraseña es demasiado débil. Por favor, ingresa una contraseña más segura.", "error");    
            }else if(error.code) {
                showMessage("Se produjo un error al registrar el usuario.", "error");
            }  
        }
    });