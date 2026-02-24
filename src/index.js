require('dotenv').config()
const express    = require('express')
const cors       = require('cors')
const path       = require('path')
const rateLimit  = require('express-rate-limit')
const { testConnection } = require('./db/connection')

const contactoRoutes = require('./routes/contacto')
const empleoRoutes   = require('./routes/empleo')
const blogRoutes     = require('./routes/blog')
const adminRoutes    = require('./routes/admin')

const app        = express()
const PORT       = process.env.PORT || 4000
const isProd     = process.env.NODE_ENV === 'production'

// ── CORS ─────────────────────────────────────────────────────────────────────
// En producción el frontend lo sirve el mismo servidor → no necesita CORS.
// En desarrollo se permite el origen del servidor de Vite.
if (!isProd) {
  app.use(cors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3001',
      'http://localhost:5173',
      'http://localhost:3000',
    ],
    credentials: true,
  }))
}

app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

// ── Rate limiting ─────────────────────────────────────────────────────────────
const formLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      20,
  message:  { ok: false, mensaje: 'Demasiadas solicitudes. Inténtalo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders:   false,
})

// ── Rutas API ─────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    ok:      true,
    mensaje: 'Asiste ING API funcionando correctamente',
    env:     process.env.NODE_ENV || 'development',
    fecha:   new Date().toISOString(),
  })
})

app.use('/api/contacto', formLimiter, contactoRoutes)
app.use('/api/empleo',   formLimiter, empleoRoutes)
app.use('/api/blog',     blogRoutes)
app.use('/api/admin',    adminRoutes)

// ── Frontend estático (solo en producción) ────────────────────────────────────
if (isProd) {
  const distPath = path.join(__dirname, '../../frontend/dist')
  app.use(express.static(distPath))

  // Cualquier ruta que no sea /api/* devuelve index.html (React SPA)
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
} else {
  // En desarrollo, 404 para rutas no encontradas
  app.use((_req, res) => {
    res.status(404).json({ ok: false, mensaje: 'Ruta no encontrada' })
  })
}

// ── Error handler global ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Error no manejado:', err)
  res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' })
})

// ── Arranque ──────────────────────────────────────────────────────────────────
async function iniciar() {
  await testConnection()
  app.listen(PORT, () => {
    console.log(`\n🚀 Asiste ING Backend corriendo en http://localhost:${PORT}`)
    console.log(`🌍 Entorno: ${isProd ? 'PRODUCCIÓN' : 'desarrollo'}`)
    if (isProd) {
      console.log(`📁 Sirviendo frontend desde: frontend/dist`)
    }
    console.log(`\n📋 API disponible en /api/health\n`)
  })
}

iniciar()
