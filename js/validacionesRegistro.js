document.addEventListener('DOMContentLoaded', function () {
  // 1. Inicialización de Popovers de Bootstrap
  if (typeof bootstrap !== 'undefined' && bootstrap.Popover) {
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl));
  }

  // 2. Función segura para alternar ver/ocultar contraseña
  function vincularOjo(btnId, inputId, iconId) {
    const btn = document.getElementById(btnId);
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);

    if (btn && input && icon) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();

        // Comprobamos el estado actual
        const esPassword = input.type === 'password';

        // Cambiamos el tipo de input
        input.type = esPassword ? 'text' : 'password';

        // Cambiamos la clase del icono
        if (esPassword) {
          icon.className = 'bi bi-eye-slash';
        } else {
          icon.className = 'bi bi-eye';
        }
      });
    }
  }

  // Activamos los escuchadores para ambos campos
  vincularOjo('togglePassword', 'password', 'togglePasswordIcon');
  vincularOjo('toggleRepetirPassword', 'repetirPassword', 'toggleRepetirPasswordIcon');
});