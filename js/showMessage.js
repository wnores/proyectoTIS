// js/showMessage.js
// Función que asegura que el toast exista en el DOM
function ensureToastElement() {
    let toastElement = document.querySelector("#appToast");
    let toastMessage = document.querySelector("#toastMessage");

    // Si no existe, lo creamos dinámicamente
    if (!toastElement) {
        const toastContainer = document.createElement("div");
        toastContainer.className = "toast-container position-fixed bottom-0 end-0 p-3";
        toastContainer.innerHTML = `
            <div id="appToast" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header">
                    <strong class="me-auto">Atención</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Cerrar"></button>
                </div>
                <div class="toast-body" id="toastMessage"></div>
            </div>
        `;
        document.body.appendChild(toastContainer);

        // Reasignamos las referencias
        toastElement = document.querySelector("#appToast");
        toastMessage = document.querySelector("#toastMessage");
    }

    return { toastElement, toastMessage };
}



export function showMessage(message, type = "success") {
    
    const { toastElement, toastMessage } = ensureToastElement();

    // Actualizamos el mensaje y el color según el tipo
    toastMessage.textContent = message;
        // Limpiamos clases previas
    toastElement.classList.remove("bg-success", "bg-danger", "bg-warning", "text-white", "text-dark");


    // Si type es "error" o "danger", cambiamos el estilo del toast
    if (type === "error" || type === "danger") {
        toastElement.classList.add("bg-danger", "text-white");
        
    } else if (type === "warning") {
        toastElement.classList.add("bg-warning", "text-dark");
        
    } else {
        toastElement.classList.add("bg-success", "text-white");
        
    }

    // Instanciamos y mostramos el toast de Bootstrap
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
}