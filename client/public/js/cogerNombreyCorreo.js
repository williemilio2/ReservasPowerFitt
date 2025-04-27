document.addEventListener('DOMContentLoaded', async () => {
    try {
      const res = await fetch('https://powerfitt.onrender.com/usuario', {
        method: 'GET',
        credentials: 'include' // Importante para enviar la cookie
      });

      if (res.ok) {
        const data = await res.json();
        const correoUsuario = data.correo;
        const nombreUsuario = data.nombre;

        // Muestra el correo donde quieras (por ejemplo, en un span con id="correoUsuario")
        document.getElementById('nombre').value = nombreUsuario;
        document.getElementById('email').value = correoUsuario;
      }
    } catch (err) {
      console.error('Error al obtener el correo:' + err);
      console.error('Error al obtener el correo2:', err.stack);
    }
});
