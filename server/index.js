import express from 'express'
import { Server } from 'socket.io'
import http from 'http'
import path from 'path'
import { fileURLToPath } from 'url'
import routes from './routes.js'
import { createClient } from '@libsql/client'
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import cron from 'node-cron';
import { createEmailTemplate, generateEmailContent }from "./plantillaMail.js"

// Definir la tarea programada a las 9 AM todos los días
cron.schedule('0 9 * * *', async () => {
  
  // Llamar a tu función sacarFechas
  await sacarFechas();
});



const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_TURSO = process.env.TOKEN_TURSO;
const NODEMAILER_PASSWD = process.env.NODEMAILER_PASSWD;

const client = createClient({
  url: 'libsql://picked-doctor-spectrum-williemilio.aws-eu-west-1.turso.io',
  authToken: TOKEN_TURSO,
})
async function probarConexion() {
  try {
    const result = await client.execute("SELECT name FROM sqlite_master WHERE type = 'table';");
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos Turso:', error.message);
  }
}

probarConexion();

async function enviarCorreo(destinatario, asunto, mensaje, isHtml = false) {
  let transporter = nodemailer.createTransport({
    service: 'Gmail', // o el que uses
    auth: {
      user: 'willymarta@gmail.com',
      pass: NODEMAILER_PASSWD
    }
  });

  let info = await transporter.sendMail({
    from: '"Tu App" <emilio.gonzalezcanovas@gmail.com>',
    to: destinatario,
    subject: asunto,
    text: mensaje,
    text: isHtml ? undefined : mensaje, // Plain text fallback
    html: isHtml ? mensaje : undefined  // HTML content
  });
}


const port = process.env.PORT ?? 3000
const app = express()
const server = http.createServer(app)
const io = new Server(server)
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../client/public')))
app.use(express.json());
app.use(cookieParser());
app.use(routes)

app.post("/enviar-correo", async (req, res) => {

  try {
    let emailContent, userName, userEmail, fecha, fechaFormateada

    if (req.body.tipoDeEnvio == "reserva") {
      fecha = new Date(req.body.fecha)
      fechaFormateada = fecha.toLocaleDateString("es-ES")

      emailContent = generateEmailContent("reserva", {
        fechaFormateada,
        hora: req.body.hora,
      })

      userName = req.body.nombre
      userEmail = req.body.email
    } else if (req.body.tipoDeEnvio == "cambioFecha") {
      fechaFormateada = req.body.fechaParam

      emailContent = generateEmailContent("cambioFecha", {
        fechaFormateada,
        hora: req.body.horaParam,
      })

      userName = req.body.nombreParam
      userEmail = req.body.emailParam
    } else if (req.body.tipoDeEnvio == "recuerdo") {
      fechaFormateada = req.body.fecha
      emailContent = generateEmailContent("recuerdo", {
        fechaFormateada,
        hora: req.body.hora,
      })

      userName = req.body.nombre
      userEmail = req.body.email
    }

    // Create the complete HTML email
    const htmlEmail = createEmailTemplate(emailContent, userName)

    // Assuming your enviarCorreo function can handle HTML content
    await enviarCorreo(userEmail, "Información sobre tu cita", htmlEmail, true) // Added a parameter to indicate HTML content

    res.status(200).send("Correo enviado")
  } catch (error) {
    res.status(500).send("Error al enviar correo")
  }
})


app.post('/guardar-cookie', (req, res) => {
  
  try {

    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Token no proporcionado' });
    }

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,  // Cámbialo a 'true' si usas HTTPS
      sameSite: 'Lax',
      maxAge: 365 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({ message: 'Cookie guardada correctamente' });
  } catch (error) {
    return res.status(500).json({ message: 'Error al guardar la cookie', error: error.message });
  }
});
app.post('/admin', (req, res) => {

  const { clave } = req.body;
  if (clave === process.env.PASSWDADMINS) {
    res.cookie('accesoAdmin', 'true', {
      httpOnly: true,
      sameSite: 'Lax',
      maxAge: 604800 // 1 semana
    });
    return res.redirect('/admin/dashboard');
  } else {
    return res.send('❌ Contraseña incorrecta');
  }
});
app.get('/api/me', async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Sin token" });

  try {
    const data = jwt.verify(token, JWT_SECRET);
    await client.execute(
      `DELETE FROM reservas WHERE Email = ?`,
      [data.correo]
    );
    callback('✅ Registro insertado correctamente:');
    res.json({ success: true })
  } catch (e) {
    res.status(401).json({ error: "Token inválido" });
  }
});

function esManana(fechaBaseStr, fechaCompararStr, demasDatos) {

  // Calculamos la fecha de mañana respecto a la base
  const manana = new Date(fechaBaseStr);
  manana.setDate(fechaBaseStr.getDate() + 1);

  // Comparamos solo el año, mes y día
  if (
    fechaCompararStr.getFullYear() === manana.getFullYear() &&
    fechaCompararStr.getMonth() === manana.getMonth() &&
    fechaCompararStr.getDate() === manana.getDate()
  ) {
    async function enviarMail() {
      await fetch('https://powerfitt.onrender.com/enviar-correo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: demasDatos.Email, nombre: demasDatos.Nombre, fecha: demasDatos.Fecha, hora: demasDatos.Hora, tipoDeEnvio: "recuerdo" })
      });
    }
    enviarMail()
  } else {
    console.log("No, no es mañana.");
  }
}



async function sacarFechas(){
  const result = await client.execute(
    `SELECT * FROM reservas`,
  )
  for (const reserva of result.rows) {
    let fecha = reserva.Fecha;
    const losDemasDatos = reserva
    // Convierte fecha de DD/MM/YYYY a YYYY-MM-DD
    const partes = fecha.split('/');
    const fechaConvertida = `${partes[2]}-${partes[1]}-${partes[0]}`;
    const fechaFinal = new Date(fechaConvertida);
  
    const fechaHoy = new Date();
    esManana(fechaHoy, fechaFinal, losDemasDatos);
  }
}

io.on('connection', (socket) => {
    socket.on('mensaje', async (data, callback) => {
      
      data.fecha = new Date(data.fecha).toLocaleDateString("es-ES");
      try {
        const result = await client.execute({
          sql: `INSERT INTO reservas (Nombre, Email, Comentarios, Fecha, Hora)
                VALUES (?, ?, ?, ?, ?)`,
          args: [
            data.nombre,
            data.email,
            data.comentarios,
            data.fecha,
            data.hora,
          ],
        });
    
        callback('✅ Registro insertado correctamente:');
      } catch (error) {
        console.error('❌ Error al insertar datos:', error.message);
      }
    })
    socket.on('obtenerReservas', async (_, callback) => {
      try {
        const result = await client.execute("SELECT Fecha, Hora FROM reservas");
        const reservas = result.rows.map(r => ({
          fecha: r.Fecha, // asegúrate de quitar la hora si es ISO
          hora: r.Hora
        }));
        callback(reservas);
      } catch (err) {
        console.error('❌ Error al obtener reservas:', err.message);
        callback([]); // fallback vacío
      }
    });
    socket.on('estaEsteCorreo', async(emailPuesto, nombrePuesto, callback) => {
      try {
        const result = await client.execute("SELECT Email FROM reservas");
        const yaExiste = result.rows.some(row => row.Email === emailPuesto);
        if(yaExiste){
          callback({'confirmacion': false});
        }
        else{
          const token = jwt.sign(
            { correo: emailPuesto , nombre: nombrePuesto},
            JWT_SECRET
          );
          callback({
            'confirmacion': true,
            'cookie': token
          });
        }
      } catch (err) {
        console.error('❌ Error del servidor:', err.message);
        callback({'confirmacion': false}); // fallback vacío
      }
    })
    socket.on("cogerDatos", async (callback) => {
      try {
        const response = await client.execute('SELECT id, nombre, email, Fecha, Hora, Comentarios FROM reservas');
        callback(response.rows);  // Envía los datos al cliente
      } catch (err) {
          callback({ error: 'Error obteniendo datos' });  // Envia un error al cliente si falla la consulta
      }
    })
    socket.on("adminConsultas", async (data, callback) =>{
      const consulta = data.consulta
      const args = data.args
  
      const result = await client.execute({
        sql: consulta,
        args: args
      });
      if (result.rowsAffected > 0) {
        callback({ success: true });
      } else {
          callback({ success: false });
      }
    
    })
    socket.on("cambiarFecha", async (consulta, callback) => {
      const { consulta: sql, args } = consulta;
      const result = await client.execute({ sql, args });
      if (result.rowsAffected > 0) {
        callback({ success: true });
      } else {
          callback({ success: false });
      }
    })
})
//Configuro el cors para q pueda controlar el server de react tambien (Lo de arriba tambien es cinfigurar cors)

server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`)
})