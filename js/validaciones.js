(() => {
  'use strict';
  const forms = document.querySelectorAll('.needs-validation');
  Array.from(forms).forEach((form) => {
    form.addEventListener('submit', (event) => {
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }
      form.classList.add('was-validated');
    }, false);
  });

  window.addEventListener('pageshow', () => {
    Array.from(forms).forEach((form) => {
      form.reset();
      form.classList.remove('was-validated');
    });
  });
})();