import { Router } from 'express'
import express from 'express';
import path from 'path'
import { fileURLToPath } from 'url'
import {verificarToken} from './verificarToken.js'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const PASSWDADMINS = process.env.PASSWDADMINS;


const app = express();

// ⬇️ Esto permite que puedas acceder a req.body con datos de formularios
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
const router = Router()

router.get('/usuario', verificarToken, (req, res) => {
  // Devuelve solo el correo (o más info si quieres)
  res.json({ correo: req.usuario.correo, nombre: req.usuario.nombre });
});
// Ruta principal
router.get('/', verificarToken, (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'))
})
router.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/admin-pass.html'));
});
router.get('/enEspera', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/enEspera.html'))
})
router.get('/admin/dashboard', (req, res) => {
  const acceso = req.cookies.accesoAdmin;

  if (acceso !== 'true') {
    return res  .status(403).send('⛔ Acceso denegado');
  }
  res.sendFile(path.join(__dirname, '../client/admin.html'));
});

export default router