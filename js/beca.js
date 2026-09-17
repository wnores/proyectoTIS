import { db } from './firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

async function cargarCursosEnSelect() {
    const selectCurso = document.getElementById("curso");
    
    if (!selectCurso) return;

    try {
        const querySnapshot = await getDocs(collection(db, "cursos"));

        selectCurso.innerHTML = `<option value="">Seleccioná un curso</option>`;

        querySnapshot.forEach((doc) => {
            const curso = doc.data();

            const option = document.createElement("option");

            option.value = doc.id; 
    
            option.textContent = curso.nombre || curso.titulo || curso.nombreCurso || "Curso sin nombre";

            selectCurso.appendChild(option);
        });

    } catch (error) {
        console.error("Error al obtener los cursos desde Firestore:", error);
        selectCurso.innerHTML = `<option value="">Error al cargar los cursos</option>`;
    }
}

document.addEventListener("DOMContentLoaded", cargarCursosEnSelect);