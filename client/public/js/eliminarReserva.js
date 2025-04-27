document.getElementById('eliminarReserva').addEventListener('click', async function() {
    try {
      const res = await fetch('/api/me', { credentials: 'include' }); // incluye cookies
      const data = await res.json();
      if (data.success) {
        window.location.href = '/';
      } else {
        window.location.href = '/';
      }
    } catch (e) {
      console.error("Error al obtener el usuario:");
    }
  });
  