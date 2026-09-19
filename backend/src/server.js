import app from './app.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Backend de mandalestart ejecutándose en http://localhost:${PORT}`);
  console.log('Usa /api/health para comprobar que el backend responde correctamente.');
});
