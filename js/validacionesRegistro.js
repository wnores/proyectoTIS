document.addEventListener('DOMContentLoaded', function () {
  if (typeof bootstrap !== 'undefined' && bootstrap.Popover) {
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl));
  }

  function vincularOjo(btnId, inputId, iconId) {
    const btn = document.getElementById(btnId);
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);

    if (btn && input && icon) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();

        const esPassword = input.type === 'password';

        input.type = esPassword ? 'text' : 'password';

        if (esPassword) {
          icon.className = 'bi bi-eye-slash';
        } else {
          icon.className = 'bi bi-eye';
        }
      });
    }
  }

  vincularOjo('togglePassword', 'password', 'togglePasswordIcon');
  vincularOjo('toggleRepetirPassword', 'repetirPassword', 'toggleRepetirPasswordIcon');
});