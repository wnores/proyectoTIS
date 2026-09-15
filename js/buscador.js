document.addEventListener('DOMContentLoaded', () => {

    const formulario = document.getElementById('formBuscador');
    const input = document.getElementById('inputBuscador');

    if (!formulario || !input) {
        return;
    }

    formulario.addEventListener('submit', (e) => {

        e.preventDefault();

        const texto = input.value.trim();

        if (texto === '') {
            return;
        }

        window.location.href =
            `resultados.html?buscar=${encodeURIComponent(texto)}`;

    });

});