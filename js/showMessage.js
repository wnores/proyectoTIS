function ensureToastElement() {
    let toastElement = document.querySelector("#appToast");
    let toastMessage = document.querySelector("#toastMessage");

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

        toastElement = document.querySelector("#appToast");
        toastMessage = document.querySelector("#toastMessage");
    }

    return { toastElement, toastMessage };
}

export function showMessage(message, type = "success") {
    
    const { toastElement, toastMessage } = ensureToastElement();

    toastMessage.textContent = message;
    toastElement.classList.remove("bg-success", "bg-danger", "bg-warning", "text-white", "text-dark");

    if (type === "error" || type === "danger") {
        toastElement.classList.add("bg-danger", "text-white");
        
    } else if (type === "warning") {
        toastElement.classList.add("bg-warning", "text-dark");
        
    } else {
        toastElement.classList.add("bg-success", "text-white");
        
    }

    const toast = new bootstrap.Toast(toastElement);
    toast.show();
}