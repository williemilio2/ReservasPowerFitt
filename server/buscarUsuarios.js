import { createClient } from '@libsql/client'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const TOKEN_TURSO = process.env.TOKEN_TURSO;
const client = createClient({
  url: 'libsql://picked-doctor-spectrum-williemilio.aws-eu-west-1.turso.io',
  authToken: TOKEN_TURSO,
})

export const buscarUsuarioPorCorreo = async (correo) => {
    try {
      const result = await client.execute({
        sql: 'SELECT * FROM reservas WHERE Email = ?',
        args: [correo]
      });
  
      // Si hay algún resultado, devolvemos el primer usuario
      if (result.rows.length > 0) {
        return result.rows[0];
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error buscando usuario por correo:', error);
      return null;
    }
  };