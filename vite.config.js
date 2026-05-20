import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // El backend (config/cors.php) fija allowed_origins = http://localhost:5174,
  // así que la app debe abrirse por ese origen exacto (no 127.0.0.1) para que
  // CORS no rechace las respuestas.
  // host: true bindea a IPv4 + IPv6: el resolver de Windows puede mandar
  // localhost a 127.0.0.1 o a [::1] de forma errática y necesitamos escuchar
  // en ambas para no caer en ERR_CONNECTION_REFUSED.
  // strictPort: evita que Vite caiga a otro puerto y rompa CORS sin avisar.
  server: {
    host: true,
    port: 5174,
    strictPort: true,
  },
})
