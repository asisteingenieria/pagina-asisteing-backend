const express = require('express')
const jwt     = require('jsonwebtoken')
const XLSX    = require('xlsx')
const router  = express.Router()
const { pool } = require('../db/connection')
const auth    = require('../middleware/auth')
const upload  = require('../middleware/upload')

const estadoLabel = {
  pendiente:    'Pendiente',
  en_revision:  'En revisión',
  entrevista:   'Entrevista',
  seleccionado: 'Seleccionado',
  descartado:   'Descartado',
}

function enviarExcel(res, filas, nombreHoja, nombreArchivo) {
  const hoja = XLSX.utils.json_to_sheet(filas)
  const libro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libro, hoja, nombreHoja)
  const buffer = XLSX.write(libro, { type: 'buffer', bookType: 'xlsx' })

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`)
  res.send(buffer)
}

// POST /api/admin/login
router.post('/login', (req, res) => {
  const { usuario, password } = req.body
  if (
    usuario  !== process.env.ADMIN_USER ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return res.status(401).json({ ok: false, mensaje: 'Credenciales incorrectas' })
  }
  const token = jwt.sign(
    { usuario, rol: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  )
  res.json({ ok: true, token, usuario })
})

// GET /api/admin/stats — dashboard
router.get('/stats', auth, async (req, res) => {
  try {
    const [[{ contactos }]]  = await pool.execute('SELECT COUNT(*) as contactos FROM contactos')
    const [[{ aspirantes }]] = await pool.execute('SELECT COUNT(*) as aspirantes FROM aspirantes')
    const [[{ posts }]]      = await pool.execute('SELECT COUNT(*) as posts FROM blog_posts WHERE publicado = 1')
    const [[{ borradores }]] = await pool.execute('SELECT COUNT(*) as borradores FROM blog_posts WHERE publicado = 0')

    const [ultimosContactos] = await pool.execute(
      'SELECT id, nombre, email, fecha_creacion, leido FROM contactos ORDER BY fecha_creacion DESC LIMIT 5'
    )
    const [ultimosAspirantes] = await pool.execute(
      'SELECT id, nombre, experiencia, fecha_postulacion, estado FROM aspirantes ORDER BY fecha_postulacion DESC LIMIT 5'
    )

    res.json({ ok: true, stats: { contactos, aspirantes, posts, borradores }, ultimosContactos, ultimosAspirantes })
  } catch (err) {
    console.error(err)
    res.status(500).json({ ok: false, mensaje: 'Error interno' })
  }
})

// GET /api/admin/contactos
router.get('/contactos', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM contactos ORDER BY fecha_creacion DESC')
    res.json({ ok: true, contactos: rows })
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error interno' })
  }
})

// GET /api/admin/contactos/exportar — descargar Excel
router.get('/contactos/exportar', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT nombre, telefono, email, codigo_postal, mensaje, leido, fecha_creacion FROM contactos ORDER BY fecha_creacion DESC'
    )
    const filas = rows.map(c => ({
      Nombre:         c.nombre,
      Teléfono:       c.telefono,
      Email:          c.email,
      'Código postal': c.codigo_postal,
      Mensaje:        c.mensaje || '',
      Estado:         c.leido ? 'Leído' : 'Nuevo',
      Fecha:          new Date(c.fecha_creacion).toLocaleString('es-CO'),
    }))
    enviarExcel(res, filas, 'Contactos', 'contactos.xlsx')
  } catch (err) {
    console.error(err)
    res.status(500).json({ ok: false, mensaje: 'Error interno' })
  }
})

// PATCH /api/admin/contactos/:id/leido
router.patch('/contactos/:id/leido', auth, async (req, res) => {
  try {
    await pool.execute('UPDATE contactos SET leido = 1 WHERE id = ?', [req.params.id])
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error interno' })
  }
})

// DELETE /api/admin/contactos/:id
router.delete('/contactos/:id', auth, async (req, res) => {
  try {
    await pool.execute('DELETE FROM contactos WHERE id = ?', [req.params.id])
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error interno' })
  }
})

// GET /api/admin/aspirantes
router.get('/aspirantes', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM aspirantes ORDER BY fecha_postulacion DESC')
    res.json({ ok: true, aspirantes: rows })
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error interno' })
  }
})

// GET /api/admin/aspirantes/exportar — descargar Excel
router.get('/aspirantes/exportar', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT nombre, cedula, edad, telefono1, telefono2, experiencia, estado, notas, fecha_postulacion FROM aspirantes ORDER BY fecha_postulacion DESC'
    )
    const filas = rows.map(a => ({
      Nombre:       a.nombre,
      Cédula:       a.cedula,
      Edad:         a.edad,
      'Teléfono 1': a.telefono1,
      'Teléfono 2': a.telefono2 || '',
      Experiencia:  a.experiencia,
      Estado:       estadoLabel[a.estado] || a.estado,
      Notas:        a.notas || '',
      Fecha:        new Date(a.fecha_postulacion).toLocaleString('es-CO'),
    }))
    enviarExcel(res, filas, 'Aspirantes', 'aspirantes.xlsx')
  } catch (err) {
    console.error(err)
    res.status(500).json({ ok: false, mensaje: 'Error interno' })
  }
})

// PATCH /api/admin/aspirantes/:id/estado
router.patch('/aspirantes/:id/estado', auth, async (req, res) => {
  const estados = ['pendiente', 'en_revision', 'entrevista', 'seleccionado', 'descartado']
  const { estado } = req.body
  if (!estados.includes(estado)) {
    return res.status(400).json({ ok: false, mensaje: 'Estado inválido' })
  }
  try {
    await pool.execute('UPDATE aspirantes SET estado = ? WHERE id = ?', [estado, req.params.id])
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error interno' })
  }
})

// DELETE /api/admin/aspirantes/:id
router.delete('/aspirantes/:id', auth, async (req, res) => {
  try {
    await pool.execute('DELETE FROM aspirantes WHERE id = ?', [req.params.id])
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error interno' })
  }
})

// POST /api/admin/upload — subir imagen de portada
router.post('/upload', auth, (req, res) => {
  upload.single('imagen')(req, res, (err) => {
    if (err) return res.status(400).json({ ok: false, mensaje: err.message })
    if (!req.file) return res.status(400).json({ ok: false, mensaje: 'No se envió ninguna imagen' })
    res.json({ ok: true, url: `/uploads/blog/${req.file.filename}` })
  })
})

// GET /api/admin/blog — todos (incl. borradores)
router.get('/blog', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, titulo, slug, categoria, autor, publicado, vistas, fecha_publicacion FROM blog_posts ORDER BY fecha_publicacion DESC'
    )
    res.json({ ok: true, posts: rows })
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error interno' })
  }
})

// GET /api/admin/blog/:id
router.get('/blog/:id', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM blog_posts WHERE id = ?', [req.params.id])
    if (!rows.length) return res.status(404).json({ ok: false, mensaje: 'Post no encontrado' })
    res.json({ ok: true, post: rows[0] })
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error interno' })
  }
})

// POST /api/admin/blog — crear post
router.post('/blog', auth, async (req, res) => {
  try {
    const { titulo, slug, resumen, contenido, categoria, imagen, autor, publicado } = req.body
    if (!titulo || !contenido) {
      return res.status(400).json({ ok: false, mensaje: 'El título y el contenido son requeridos' })
    }
    const slugFinal = slug || titulo.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')

    const [result] = await pool.execute(
      `INSERT INTO blog_posts (titulo, slug, resumen, contenido, categoria, imagen, autor, publicado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [titulo, slugFinal, resumen || null, contenido, categoria || null, imagen || null,
       autor || 'Equipo Asiste ING', publicado ? 1 : 0]
    )
    res.status(201).json({ ok: true, id: result.insertId, slug: slugFinal })
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ ok: false, mensaje: 'Ya existe un post con ese slug' })
    res.status(500).json({ ok: false, mensaje: 'Error interno' })
  }
})

// PATCH /api/admin/blog/:id/publicado — cambiar solo el estado publicado
router.patch('/blog/:id/publicado', auth, async (req, res) => {
  const publicado = req.body.publicado ? 1 : 0
  try {
    await pool.execute('UPDATE blog_posts SET publicado = ? WHERE id = ?', [publicado, req.params.id])
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error interno' })
  }
})

// PUT /api/admin/blog/:id — editar post completo
router.put('/blog/:id', auth, async (req, res) => {
  try {
    const { titulo, slug, resumen, contenido, categoria, imagen, autor, publicado } = req.body
    if (!titulo || !contenido) {
      return res.status(400).json({ ok: false, mensaje: 'El título y el contenido son requeridos' })
    }
    await pool.execute(
      `UPDATE blog_posts SET titulo=?, slug=?, resumen=?, contenido=?, categoria=?, imagen=?, autor=?, publicado=?
       WHERE id=?`,
      [titulo, slug, resumen || null, contenido, categoria || null, imagen || null,
       autor || 'Equipo Asiste ING', publicado ? 1 : 0, req.params.id]
    )
    res.json({ ok: true })
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ ok: false, mensaje: 'Ya existe un post con ese slug' })
    res.status(500).json({ ok: false, mensaje: 'Error interno' })
  }
})

// DELETE /api/admin/blog/:id
router.delete('/blog/:id', auth, async (req, res) => {
  try {
    await pool.execute('DELETE FROM blog_posts WHERE id = ?', [req.params.id])
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error interno' })
  }
})

module.exports = router
