import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { buscarUsuarioPorCorreo } from './buscarUsuarios.js'; // <- esta es la función que debes tener

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const JWT_SECRET = process.env.JWT_SECRET;

export const verificarToken = async (req, res, next) => {
  const cookies = req.headers.cookie;
  if (!cookies) {
    return next()
  }
  const cookiesArray = cookies.split(';');
  const tokenCookie = cookiesArray.find(cookie => cookie.trim().startsWith('token='));

  if (!tokenCookie) {
    return next()
  }
  const token = tokenCookie.split('=')[1].trim();
  try {
    const datos = jwt.verify(token, JWT_SECRET);
    const correo = datos.correo;

    // Buscar en la base de datos si ese correo existe
    const usuario = await buscarUsuarioPorCorreo(correo);

    if (usuario) {
      // Si el usuario existe, lo redirigimos a otra página (por ejemplo /reservado)
      return res.redirect('/enEspera');
    }

    // Si no existe, lo dejamos pasar a la siguiente ruta
    req.usuario = datos;
    next();
  } catch (error) {
    return res.status(403).json({ message: `Token inválido o expirado, ${error}` });
  }
};
