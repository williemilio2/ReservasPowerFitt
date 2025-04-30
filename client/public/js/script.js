document.addEventListener('DOMContentLoaded', function() {
    const socket =io(); // Cambia esto si está en otro host/puerto
    const diasCerrado = []
    let reservasPorFecha = {};
    socket.emit('obtenerReservas', null, (reservas) => {
        reservasPorFecha = reservas.reduce((acc, r) => {
          if (!acc[r.fecha]) acc[r.fecha] = [];
          acc[r.fecha].push(r.hora);
          return acc;
        }, {});
      });

    // Variables para almacenar los datos de la reserva
    let datosReserva = {
        nombre: '',
        email: '',
        comentarios: '',
        fecha: null,
        hora: ''
    };

    // Referencias a elementos del DOM
    const seccion1 = document.getElementById('seccion-1');
    const seccion2 = document.getElementById('seccion-2');
    const seccion3 = document.getElementById('seccion-3');
    const seccionExito = document.getElementById('seccion-exito');
    
    const paso1 = document.getElementById('paso-1');
    const paso2 = document.getElementById('paso-2');
    const paso3 = document.getElementById('paso-3');
    
    const pasosTexto = document.querySelectorAll('.paso-texto');
    
    const formularioInfo = document.getElementById('formulario-info');
    
    const volverPaso1 = document.getElementById('volver-paso1');
    const continuarPaso3 = document.getElementById('continuar-paso3');
    const volverPaso2 = document.getElementById('volver-paso2');
    const confirmarReserva = document.getElementById('confirmar-reserva');
    const nuevaReserva = document.getElementById('nueva-reserva');

    // Elementos del calendario
    const mesAnterior = document.getElementById('mes-anterior');
    const mesSiguiente = document.getElementById('mes-siguiente');
    const mesActual = document.getElementById('mes-actual');
    const calendarioDias = document.getElementById('calendario-dias');
    
    // Elementos de horas
    const horasDisponibles = document.querySelectorAll('.hora');
    
    // Elementos de resumen
    const resumenNombre = document.getElementById('resumen-nombre');
    const resumenEmail = document.getElementById('resumen-email');
    const resumenFecha = document.getElementById('resumen-fecha');
    const resumenHora = document.getElementById('resumen-hora');
    const resumenComentarios = document.getElementById('resumen-comentarios');
    const resumenComentariosContainer = document.getElementById('resumen-comentarios-container');
    
    // Elementos de éxito
    const exitoFecha = document.getElementById('exito-fecha');
    const exitoHora = document.getElementById('exito-hora');

    // Variables para el calendario
    let fechaActual = new Date();
    let mesSeleccionado = fechaActual.getMonth();
    let añoSeleccionado = fechaActual.getFullYear();

    // Inicializar el calendario
    actualizarCalendario();

    // Evento para el formulario de información
    formularioInfo.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Guardar datos del formulario
        datosReserva.nombre = document.getElementById('nombre').value;
        datosReserva.email = document.getElementById('email').value;
        datosReserva.comentarios = document.getElementById('comentarios').value;
        socket.emit('estaEsteCorreo', datosReserva.email, datosReserva.nombre, async (callback) => {
            if(callback['confirmacion']){
                try {
                    //Creo la cookie
                    const response = await fetch('https://ReservasPowerFitt.onrender.com/guardar-cookie', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',  // Esto asegura que las cookies se envíen entre dominios
                      body: JSON.stringify({ token: callback['cookie'] })
                    });
                  
                    if (!response.ok) {
                      // Si la respuesta no es "ok", lanza un error
                      throw new Error(`Error: ${response.status} - ${response.statusText}`);
                    }
                  
                    const data = await response.json();
                } catch (error) {
                    // Si ocurre un error en la solicitud o en la conversión de la respuesta, este bloque se ejecuta
                    console.error('Hubo un problema al guardar la cookie:');
                  }
                mostrarPaso(2);
                document.getElementById('mensajeError').textContent = ""
            }
            else{
                document.getElementById('mensajeError').textContent = "Este correo ya tiene una reserva"
            }
        })
    });

    // Eventos para navegación entre pasos
    volverPaso1.addEventListener('click', function() {
        mostrarPaso(1);
    });
    
    continuarPaso3.addEventListener('click', function() {
        if (!datosReserva.fecha) {
            alert('Por favor, selecciona una fecha');
            return;
        }
        
        if (!datosReserva.hora) {
            alert('Por favor, selecciona una hora');
            return;
        }
        
        // Actualizar resumen
        actualizarResumen();
        
        // Ir al paso 3
        mostrarPaso(3);
    });
    
    volverPaso2.addEventListener('click', function() {
        mostrarPaso(2);
    });
    
    confirmarReserva.addEventListener('click', function() {
        // Simular envío de datos
        confirmarReserva.textContent = 'Procesando...';
        confirmarReserva.disabled = true;
        
        setTimeout(function() {
            // Actualizar resumen de éxito
            exitoFecha.textContent = formatearFecha(datosReserva.fecha);
            exitoHora.textContent = datosReserva.hora;
            
            // Mostrar pantalla de éxito
            seccion1.classList.add('oculto');
            seccion2.classList.add('oculto');
            seccion3.classList.add('oculto');
            seccionExito.classList.remove('oculto');
            
            // Resetear botón
            confirmarReserva.textContent = 'Confirmar Reserva';
            confirmarReserva.disabled = false;
        }, 500);
        
        socket.emit('mensaje', datosReserva, (callback) => {
            console.log(callback)
        })
        async function enviarCorreoUser() {
            await fetch('/enviar-correo', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ email: datosReserva.email, nombre: datosReserva.nombre, fecha: datosReserva.fecha, hora: datosReserva.hora, tipoDeEnvio: "reserva" })
            });
        }
        enviarCorreoUser()
        async function enviarCorreoAdmin() {
            await fetch('/enviar-correo', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ email: datosReserva.email, nombre: datosReserva.nombre, fecha: datosReserva.fecha, hora: datosReserva.hora, tipoDeEnvio: "mailAdmin" })
            });
        }
        enviarCorreoAdmin()
    });
    
    nuevaReserva.addEventListener('click', function() {
        // Resetear formulario
        formularioInfo.reset();
        datosReserva = {
            nombre: '',
            email: '',
            comentarios: '',
            fecha: null,
            hora: ''
        };
        
        document.querySelectorAll('.dia').forEach(dia => dia.classList.remove('seleccionado'));
        horasDisponibles.forEach(hora => hora.classList.remove('seleccionada'));
        
        // Volver al paso 1
        mostrarPaso(1);
        seccionExito.classList.add('oculto');
        window.location.reload(true);
    });

    // Eventos para el calendario
    mesAnterior.addEventListener('click', function() {
        mesSeleccionado--;
        if (mesSeleccionado < 0) {
            mesSeleccionado = 11;
            añoSeleccionado--;
        }
        actualizarCalendario();
    });
    
    mesSiguiente.addEventListener('click', function() {
        mesSeleccionado++;
        if (mesSeleccionado > 11) {
            mesSeleccionado = 0;
            añoSeleccionado++;
        }
        actualizarCalendario();
    });

    // Función para mostrar un paso específico
    function mostrarPaso(numeroPaso) {
        // Ocultar todas las secciones
        seccion1.classList.add('oculto');
        seccion2.classList.add('oculto');
        seccion3.classList.add('oculto');
        
        // Mostrar la sección correspondiente
        document.getElementById(`seccion-${numeroPaso}`).classList.remove('oculto');
        
        // Actualizar indicadores de paso
        paso1.classList.remove('active');
        paso2.classList.remove('active');
        paso3.classList.remove('active');
        
        pasosTexto.forEach(pt => pt.classList.remove('active'));
        
        // Activar el paso actual y los anteriores
        for (let i = 1; i <= numeroPaso; i++) {
            document.getElementById(`paso-${i}`).classList.add('active');
            pasosTexto[i-1].classList.add('active');
        }
    }

    // Función para actualizar el calendario
    function actualizarCalendario() {
        // Actualizar el título del mes
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        mesActual.textContent = `${meses[mesSeleccionado]} ${añoSeleccionado}`;
        
        // Limpiar el calendario
        calendarioDias.innerHTML = '';
        
        // Obtener el primer día del mes
        const primerDia = new Date(añoSeleccionado, mesSeleccionado, 1);
        
        // Obtener el último día del mes
        const ultimoDia = new Date(añoSeleccionado, mesSeleccionado + 1, 0);
        
        // Obtener el día de la semana del primer día (0 = domingo, 1 = lunes, etc.)
        let diaSemana = primerDia.getDay();
        if (diaSemana === 0) diaSemana = 7; // Convertir domingo (0) a 7 para que la semana comience en lunes
        
        // Obtener el día de hoy
        const hoy = new Date(); // Fecha actual
        hoy.setHours(0, 0, 0, 0);
        
        // Añadir días del mes anterior
        const diasMesAnterior = new Date(añoSeleccionado, mesSeleccionado, 0).getDate();
        for (let i = diaSemana - 1; i > 0; i--) {
            const dia = document.createElement('div');
            dia.classList.add('dia', 'otro-mes', 'deshabilitado');
            dia.textContent = diasMesAnterior - i + 1;
            calendarioDias.appendChild(dia);
        }
        
        // Añadir días del mes actual
        for (let i = 1; i <= ultimoDia.getDate(); i++) {
            const dia = document.createElement('div');
            dia.classList.add('dia');
            dia.textContent = i;
            
            // Comprobar si es fin de semana
            const fecha = new Date(añoSeleccionado, mesSeleccionado, i);
            const fechaFormateada = `${String(fecha.getDate()).padStart(2, '0')}/${String(fecha.getMonth() + 1).padStart(2, '0')}/${fecha.getFullYear()}`;
            const esFinde = fecha.getDay() === 0 || fecha.getDay() === 6;
            
            // Comprobar si es un día pasado
            const esPasado = fecha <= hoy;
            if (esFinde || esPasado) {
                dia.classList.add('deshabilitado');
            }
            else if(diasCerrado.includes(fechaFormateada)){
                dia.classList.add('deshabilitado');
            }
             else {
                // Añadir evento click para días disponibles
                dia.addEventListener('click', function() {
                    document.querySelectorAll('.dia').forEach(d => d.classList.remove('seleccionado'));
                    this.classList.add('seleccionado');
                    const fechaSeleccionada = new Date(añoSeleccionado, mesSeleccionado, i);
                    datosReserva.fecha = fechaSeleccionada;
                  
                    // Limpiar las horas anteriores
                    horasDisponibles.forEach(h => {
                      h.classList.remove('deshabilitada');
                      h.classList.remove('seleccionada');
                      h.disabled = false;
                    });
                  
                    // Ver qué horas ya están reservadas para esa fecha
                    const diaNum = fechaSeleccionada.getDate();
                    const mes = fechaSeleccionada.getMonth() + 1;
                    const año = fechaSeleccionada.getFullYear();
                    const clave = `${diaNum}/${mes}/${año}`;
                    const horasReservadas = reservasPorFecha[clave] || [];
                  
                    // Deshabilitar esas horas
                    horasDisponibles.forEach(hora => {
                      const horaStr = hora.getAttribute('data-hora');
                      if (horasReservadas.includes(horaStr)) {
                        hora.classList.add('deshabilitada');
                        hora.disabled = true;
                      }
                      
                      hora.addEventListener('click', function() {
                        if (this.classList.contains('deshabilitada')) return;
                        horasDisponibles.forEach(h => h.classList.remove('seleccionada'));
                        this.classList.add('seleccionada');
                        datosReserva.hora = this.getAttribute('data-hora');
                    });
                    });
                  });
                
                // Comprobar si es el día seleccionado
                if (datosReserva.fecha && 
                    datosReserva.fecha.getDate() === i && 
                    datosReserva.fecha.getMonth() === mesSeleccionado && 
                    datosReserva.fecha.getFullYear() === añoSeleccionado) {
                    dia.classList.add('seleccionado');
                }
            }
            
            calendarioDias.appendChild(dia);
        }
        
        // Añadir días del mes siguiente para completar la cuadrícula
        const diasRestantes = 42 - (diaSemana - 1) - ultimoDia.getDate(); // 42 = 6 filas * 7 días
        for (let i = 1; i <= diasRestantes; i++) {
            const dia = document.createElement('div');
            dia.classList.add('dia', 'otro-mes', 'deshabilitado');
            dia.textContent = i;
            calendarioDias.appendChild(dia);
        }
    }

    // Función para actualizar el resumen
    function actualizarResumen() {
        resumenNombre.textContent = datosReserva.nombre;
        resumenEmail.textContent = datosReserva.email;
        resumenFecha.textContent = formatearFecha(datosReserva.fecha);
        resumenHora.textContent = datosReserva.hora;
        
        if (datosReserva.comentarios.trim()) {
            resumenComentarios.textContent = datosReserva.comentarios;
            resumenComentariosContainer.style.display = 'flex';
        } else {
            resumenComentariosContainer.style.display = 'none';
        }
    }

    // Función para formatear la fecha
    function formatearFecha(fecha) {
        if (!fecha) return '';
        
        const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        
        const diaSemana = dias[fecha.getDay()];
        const dia = fecha.getDate();
        const mes = meses[fecha.getMonth()];
        const año = fecha.getFullYear();
        
        return `${diaSemana}, ${dia} de ${mes} de ${año}`;
    }
});