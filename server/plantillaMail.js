// HTML email template with styling
export function createEmailTemplate(content, userName) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Notificación de Cita</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table role="presentation" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 30px 0; text-align: center; background-color:rgb(182, 50, 50);">
              <img src="https://powerfitt.es/img/logo-1696614431.jpg" alt="Logo" style="max-width: 150px; height: auto;">
            </td>
          </tr>
          
          <!-- Greeting -->
          <tr>
            <td style="padding: 30px 30px 10px 30px;">
              <h2 style="margin: 0; color: #333333;">¡Hola ${userName}!</h2>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 10px 30px 30px 30px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.5; color: #555555;">
                ${content}
              </p>
            </td>
          </tr>
          
          <!-- Call to action -->
          <tr>
            <td style="padding: 0 30px 30px 30px; text-align: center;">
              <a href="https://powerfitt.es/" style="display: inline-block; padding: 12px 24px; background-color:rgb(99, 15, 15); color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: bold;">Visitar nuestra web</a>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px; text-align: center; background-color: #f8f8f8; color: #888888; font-size: 14px;">
              <p style="margin: 0 0 10px 0;">Si tienes alguna pregunta, contáctanos</p>
              <p style="margin: 0;">© ${new Date().getFullYear()} Powerfitt. Todos los derechos reservados.</p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  }

// Function to generate content based on email type
export function generateEmailContent(type, data) {
switch (type) {
    case "reserva":
    return `Gracias por realizar tu reserva. Tu cita está programada para el <strong>${data.fechaFormateada}</strong> a las <strong>${data.hora}</strong>. ¡Te esperamos!`

    case "cambioFecha":
    return `Te informamos que tu cita ha sido cambiada. Tu nueva cita está programada para el <strong>${data.fechaFormateada}</strong> a las <strong>${data.hora}</strong>. Si necesitas hacer algún cambio adicional, por favor contáctanos.`

    case "recuerdo":
    return `Te recordamos que mañana tienes una cita programada para el <strong>${data.fechaFormateada}</strong> a las <strong>${data.hora}</strong>. ¡Te esperamos!`
    
    case "mailAdmin":
    return `Hola! El cliente <strong>${data.userName}</strong> a reservado una cita el dia <strong>${data.fechaFormateada}</strong> a las <strong>${data.hora}</strong>.`

    default:
    return `Gracias por contactarnos. Estamos a tu disposición para cualquier consulta.`
}
}
