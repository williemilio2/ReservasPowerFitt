const socket = io();


const listaHoras = [
    "10:30", "10:50", "11:10", "11:30", "11:50",
    "12:10", "12:30", "12:50", "13:10", "13:30", "13:50",
    "17:30", "17:50", "18:10", "18:30", "18:50",
    "19:10", "19:30", "19:50"
  ]

function horasDisponibles(dia, horas) {
    horas.innerHTML = "";
    let horasDeEseDia
    console.log('PRIMERO 1')
    console.log(dia.value)
    console.log(convertirFecha(dia.value))
    dia = convertirFecha(dia.value)
    socket.emit('revisarFechas', dia, (callback) => {
        horasDeEseDia = callback
        
        listaHoras.forEach(hora => {
            const option = document.createElement('option');
            option.value = hora;
            option.textContent = hora;
            console.log(horasDeEseDia)
            if(horasDeEseDia.some(obj => obj.Hora === option.value)){
                option.disabled = true
            }
            horas.appendChild(option);
        });
    })
}

function convertirFecha(fecha) {
    // Usamos expresión regular para separar por / o -
    let [dia, mes, año] = fecha.split(/[-/]/);
    
    // Aseguramos que el día y el mes sean siempre de dos dígitos
    const diaFormateado = dia.padStart(2, '0');
    mes = mes.replace(/^0/, ''); 
    
    // Devolvemos la fecha en formato dd/mm/yyyy
    return `${año}/${mes}/${diaFormateado}`;
}
function enviarDatosCambiarFecha(fecha, hora, id, nombre, email){
    console.log('LUEGO 1')
    console.log('fecha' + fecha)
    fechaFinal = convertirFecha(fecha)
    console.log('fechaFinal' + fechaFinal)
    socket.emit('cambiarFecha', { consulta: 'UPDATE reservas SET Fecha = ?, Hora = ? WHERE id = ?', args: [fechaFinal, hora, id] }, (response) => {
        if (!response.success) {
            alert('Error al cambiar la fecha, intentalo otra vez o contacta contacta con nuestro equipo');
        }
        else{
            async function botonClick() {
                await fetch('/enviar-correo', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                        emailParam: email,
                        nombreParam: nombre, 
                        fechaParam: fechaFinal,
                        horaParam: hora,
                        tipoDeEnvio: "cambioFecha"
                    })
                });
              }
            botonClick()
        }
    });
}

// Cuando se carga el DOM
document.addEventListener('DOMContentLoaded', function() {
    const tabla = document.getElementById('tablaAdmin');
    // Envia el cogerDatos, con el callback que le da TODOS los campos de la base de datos
    socket.emit('cogerDatos', (datos) => {
        
        // Actualizar el contador de citas en el badge
        const badge = document.querySelector('.badge');
        if (badge) {
            badge.textContent = `${datos.length} citas activas`;
        }
        
        // Por cada uno crea los tds para cada uno de los datos
        datos.forEach(element => {
            const tr = document.createElement('tr');
            // Añadir efecto hover (ya está en CSS, pero lo reforzamos)
            tr.addEventListener('mouseover', () => {
                tr.style.backgroundColor = '#fff1f1';
            });
            tr.addEventListener('mouseout', () => {
                tr.style.backgroundColor = '';
            });
            
            // Celda ID (restaurada como estaba originalmente)
            const tdId = document.createElement('td');
            tdId.textContent = element.id;
            tdId.className = 'font-medium';
            
            // Celda Nombre
            const tdNombre = document.createElement('td');
            tdNombre.textContent = element.Nombre;
            tdNombre.className = 'font-medium';
            
            // Celda Correo con icono
            const tdCorreo = document.createElement('td');
            const correoDiv = document.createElement('div');
            correoDiv.className = 'icon-text';
            
            const correoIcon = document.createElement('i');
            correoIcon.className = 'fas fa-envelope icon-muted';
            
            const correoSpan = document.createElement('span');
            correoSpan.textContent = element.Email;
            
            correoDiv.appendChild(correoIcon);
            correoDiv.appendChild(correoSpan);
            tdCorreo.appendChild(correoDiv);
            
            // Celda Fecha con icono
            const tdDia = document.createElement('td');
            const diaDiv = document.createElement('div');
            diaDiv.className = 'icon-text';
            
            const diaIcon = document.createElement('i');
            diaIcon.className = 'fas fa-calendar-days icon-muted';
            
            const diaSpan = document.createElement('span');
            diaSpan.textContent = element.Fecha;
            
            diaDiv.appendChild(diaIcon);
            diaDiv.appendChild(diaSpan);
            tdDia.appendChild(diaDiv);
            
            // Celda Hora con icono
            const tdHora = document.createElement('td');
            const horaDiv = document.createElement('div');
            horaDiv.className = 'icon-text';
            
            const horaIcon = document.createElement('i');
            horaIcon.className = 'fas fa-clock icon-muted';
            
            const horaSpan = document.createElement('span');
            horaSpan.textContent = element.Hora;
            horaDiv.appendChild(horaIcon);
            horaDiv.appendChild(horaSpan);
            tdHora.appendChild(horaDiv);
            
            // Celda Comentario con icono - MEJORADA PARA RESPONSIVIDAD
            const tdComentario = document.createElement('td');
            tdComentario.className = 'comentario-celda';
            
            const comentarioDiv = document.createElement('div');
            comentarioDiv.className = 'icon-text comentario-contenedor';
            
            const comentarioIcon = document.createElement('i');
            comentarioIcon.className = 'fas fa-message icon-muted';
            
            // Contenedor para el comentario
            const comentarioWrapper = document.createElement('div');
            comentarioWrapper.className = 'comentario-wrapper';
            
            // Determinar si el comentario está vacío
            const comentarioTexto = element.Comentarios || '';
            const estaVacio = comentarioTexto.trim() === '';
            
            // Si el comentario es corto o vacío, mostrar texto simple
            if (estaVacio || comentarioTexto.length < 5) {
                const comentarioSpan = document.createElement('span');
                comentarioSpan.className = estaVacio ? 'text-muted' : '';
                comentarioSpan.textContent = estaVacio ? 'Sin mensaje' : comentarioTexto;
                comentarioWrapper.appendChild(comentarioSpan);
            } else {
                // Para comentarios largos, usar un div con texto truncado y botón expandir
                const comentarioPreview = document.createElement('div');
                comentarioPreview.className = 'comentario-preview';
                comentarioPreview.textContent = comentarioTexto.substring(0, 5) + '...';
                
                const expandirBtn = document.createElement('button');
                expandirBtn.className = 'expandir-btn';
                expandirBtn.textContent = 'Ver más';
                expandirBtn.onclick = function(e) {
                    e.stopPropagation(); // Evitar que el clic afecte a la fila
                    
                    // Crear modal para mostrar el comentario completo
                    const modal = document.createElement('div');
                    modal.className = 'comentario-modal';
                    
                    const modalContenido = document.createElement('div');
                    modalContenido.className = 'comentario-modal-contenido';
                    
                    const modalHeader = document.createElement('div');
                    modalHeader.className = 'comentario-modal-header';
                    
                    const modalTitulo = document.createElement('h3');
                    modalTitulo.textContent = 'Comentario de ' + element.Nombre;
                    
                    const cerrarBtn = document.createElement('button');
                    cerrarBtn.innerHTML = '&times;';
                    cerrarBtn.className = 'comentario-modal-cerrar';
                    cerrarBtn.onclick = function() {
                        document.body.removeChild(modal);
                    };
                    
                    const modalTexto = document.createElement('div');
                    modalTexto.className = 'comentario-modal-texto';
                    modalTexto.textContent = comentarioTexto;
                    
                    modalHeader.appendChild(modalTitulo);
                    modalHeader.appendChild(cerrarBtn);
                    
                    modalContenido.appendChild(modalHeader);
                    modalContenido.appendChild(modalTexto);
                    
                    modal.appendChild(modalContenido);
                    document.body.appendChild(modal);
                    
                    // Cerrar modal al hacer clic fuera
                    modal.onclick = function(e) {
                        if (e.target === modal) {
                            document.body.removeChild(modal);
                        }
                    };
                };
                
                comentarioWrapper.appendChild(comentarioPreview);
                comentarioWrapper.appendChild(expandirBtn);
            }
            
            comentarioDiv.appendChild(comentarioIcon);
            comentarioDiv.appendChild(comentarioWrapper);
            tdComentario.appendChild(comentarioDiv);
            
            // Celda Quitar Cita con botón estilizado y botón de cambiar fecha
            const tdQuitarCita = document.createElement('td');
            tdQuitarCita.className = 'text-right';
            
            // Contenedor para los botones (para alinearlos mejor)
            const botonesContainer = document.createElement('div');
            botonesContainer.className = 'botones-acciones';
            botonesContainer.style.display = 'flex';
            botonesContainer.style.gap = '8px';
            botonesContainer.style.justifyContent = 'flex-end';
            
            // Botón Quitar Cita
            const tdQuitarCitaButton = document.createElement('button');
            tdQuitarCitaButton.className = 'btn btn-danger';
            tdQuitarCitaButton.style.display = 'flex';
            tdQuitarCitaButton.style.alignItems = 'center';
            
            // Crear icono para el botón quitar
            const buttonIcon = document.createElement('i');
            buttonIcon.className = 'fas fa-trash';
            
            // Crear span para el texto del botón
            const buttonText = document.createTextNode(' Quitar cita'); 
            
            tdQuitarCitaButton.appendChild(buttonIcon);
            tdQuitarCitaButton.appendChild(buttonText);
            
            // Mantener la funcionalidad original del botón
            tdQuitarCitaButton.onclick = () => {
                // Animación de desvanecimiento
                tr.style.transition = 'opacity 0.3s ease';
                tr.style.opacity = '0';
                
                setTimeout(() => {
                    // Aquí enviamos los datos al servidor para procesar la acción
                    socket.emit('adminConsultas', { 
                        consulta: 'DELETE FROM reservas WHERE id = ?', 
                        args: [element.id] 
                    }, (response) => {
                        if (response.success) {
                            tr.remove();
                            // Actualizar contador
                            const filas = document.querySelectorAll('tbody tr');
                            const badge = document.querySelector('.badge');
                            if (badge) {
                                badge.textContent = `${filas.length} citas activas`;
                            }
                        } else {
                            tr.style.opacity = '1';
                            alert('Error al eliminar la consulta');
                        }
                    });
                }, 300);
            };
            
            // Botón Cambiar Fecha (NUEVO)
            const tdCambiarFechaButton = document.createElement('button');
            tdCambiarFechaButton.className = 'btn btn-info';
            tdCambiarFechaButton.style.display = 'flex';
            tdCambiarFechaButton.style.alignItems = 'center';
            
            // Crear icono para el botón cambiar fecha
            const cambiarFechaIcon = document.createElement('i');
            cambiarFechaIcon.className = 'fas fa-calendar-alt';
            
            // Crear span para el texto del botón
            const cambiarFechaText = document.createTextNode(' Cambiar fecha'); 
            
            tdCambiarFechaButton.appendChild(cambiarFechaIcon);
            tdCambiarFechaButton.appendChild(cambiarFechaText);
            
            // Añadir los botones al contenedor
            botonesContainer.appendChild(tdQuitarCitaButton);
            botonesContainer.appendChild(tdCambiarFechaButton);
            
            // Añadir el contenedor de botones a la celda
            tdQuitarCita.appendChild(botonesContainer);
            tdCambiarFechaButton.classList.add("botonFecha");
            //Onclik de cambiar fecha
            tdCambiarFechaButton.addEventListener('click', () => {
                const fechaComprobar = document.getElementById('fecha');
                const select = document.getElementById('hora')
                select.disabled = true;

                fechaComprobar.addEventListener('input', () => {
                  // Se habilita solo si hay una fecha completa (formato YYYY-MM-DD)
                  if (fechaComprobar.value.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    select.disabled = false;
                    horasDisponibles(fechaComprobar, select)

                  } else {
                    select.disabled = true;
                  }
                })
                const modal = document.getElementById('dropdownModal');
                const overlay = document.getElementById('overlay');
                modal.style.display = 'block';
                overlay.style.display = 'block';
              
                // Evitamos múltiples listeners en el botón
                const enviarBtn = document.getElementById('enviarBtn');
                const nuevoEnviar = enviarBtn.cloneNode(true); 
                enviarBtn.parentNode.replaceChild(nuevoEnviar, enviarBtn);
              
                // Click en "Enviar" = imprimir + cerrar
                nuevoEnviar.addEventListener('click', () => {
                    const fecha = document.getElementById('fecha').value;
                    const hora = document.getElementById('hora').value;
                    enviarDatosCambiarFecha(fecha, hora, element.id, element.Nombre, element.Email);
                    horaSpan.textContent = hora;
                    diaSpan.textContent = convertirFecha(fecha);
                    cerrarModal()
                });
              
                // Click en overlay = solo cerrar
                overlay.addEventListener('click', cerrarModal);
              
                function cerrarModal() {
                  modal.style.display = 'none';
                  overlay.style.display = 'none';
                }
            });

            // Finalmente añadimos todos al tr, y metemos ese tr a la tabla
            tr.appendChild(tdId); // ID restaurado
            tr.appendChild(tdNombre);
            tr.appendChild(tdCorreo);
            tr.appendChild(tdDia);
            tr.appendChild(tdHora);
            tr.appendChild(tdComentario);
            tr.appendChild(tdQuitarCita);
            
            // Añadir el <tr> a la tabla
            tabla.appendChild(tr);
        });
    });
});