/* ----- Lógica del contador de visitas y Modal de Estadísticas ----- */
const INTERVAL_MIN = 15;
const lastPing = Number(localStorage.getItem('visit_ping') || 0);
const now = Date.now();

// Registra una visita si han pasado más de 15 min.
if (now - lastPing > INTERVAL_MIN * 60 * 1000) {
  const img = new Image();
  img.src = 'https://bilateria.org/vce/stats/contador.php?' + now;
  img.style.display = 'none';
  document.body.appendChild(img);
  localStorage.setItem('visit_ping', now.toString());
}

// Obtiene el número total y configura el enlace para abrir el modal.
fetch('https://bilateria.org/vce/stats/total.php?' + now)
  .then(response => response.text())
  .then(totalVisitas => {
    const visitBox = document.getElementById('visit-box');
    if (!visitBox) return;

    // Preparamos los elementos del Modal
    const modal = document.getElementById('stats-modal');
    const closeModalBtn = document.getElementById('modal-close-btn');
    const modalIframe = document.getElementById('modal-iframe');
    
    if (!modal || !closeModalBtn || !modalIframe) return;

    // ---- ¡AQUÍ ESTÁ LA CLAVE! ----
    // Limpiamos COMPLETAMENTE el contenido del div antes de añadir nada.
    visitBox.innerHTML = ''; 
    
    const statsLink = document.createElement('a');
    statsLink.href = '#'; // Usamos '#' para que parezca un enlace, pero sin navegar
    statsLink.textContent = `${totalVisitas.trim()} visitas desde el 1 de julio de 2025`;
    visitBox.appendChild(statsLink);

    // ---- Lógica para ABRIR el modal ----
    statsLink.addEventListener('click', (event) => {
        event.preventDefault(); 
        modalIframe.src = 'https://bilateria.org/vce/stats/stats.html';
        modal.style.display = 'flex';
    });

    // ---- Lógica para CERRAR el modal ----
    const closeModal = () => {
        modal.style.display = 'none';
        modalIframe.src = 'about:blank';
    };

    closeModalBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });
  })
  .catch(() => {
    const visitBox = document.getElementById('visit-box');
    if (visitBox) {
        // En caso de error, también nos aseguramos de limpiar antes.
        visitBox.innerHTML = '–';
    }
  });
