const express = require('express')
const router  = express.Router()
const { pool } = require('../db/connection')

// GET /api/blog — listar posts publicados
router.get('/', async (req, res) => {
  try {
    const limit     = Math.min(parseInt(req.query.limit)  || 20, 50)
    const offset    = parseInt(req.query.offset) || 0
    const categoria = req.query.categoria || null

    let query  = 'SELECT id, titulo, slug, resumen, categoria, imagen, autor, fecha_publicacion FROM blog_posts WHERE publicado = 1'
    const params = []

    if (categoria) {
      query += ' AND categoria = ?'
      params.push(categoria)
    }

    // LIMIT y OFFSET se incrustan directamente (valores numéricos controlados)
    query += ` ORDER BY fecha_publicacion DESC LIMIT ${limit} OFFSET ${offset}`

    const [rows] = await pool.query(query, params)

    const countQuery = 'SELECT COUNT(*) as total FROM blog_posts WHERE publicado = 1' +
                       (categoria ? ' AND categoria = ?' : '')
    const [[{ total }]] = await pool.query(countQuery, categoria ? [categoria] : [])

    res.json({ ok: true, posts: rows, total, limit, offset })
  } catch (err) {
    console.error('Error en GET /api/blog:', err)
    res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' })
  }
})

// GET /api/blog/:slug — obtener post por slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params

    if (!/^[a-z0-9-]+$/.test(slug)) {
      return res.status(400).json({ ok: false, mensaje: 'Slug inválido' })
    }

    const [rows] = await pool.execute(
      'SELECT * FROM blog_posts WHERE slug = ? AND publicado = 1 LIMIT 1',
      [slug]
    )

    if (!rows.length) {
      return res.status(404).json({ ok: false, mensaje: 'Post no encontrado' })
    }

    // Incrementar vistas
    await pool.execute('UPDATE blog_posts SET vistas = vistas + 1 WHERE id = ?', [rows[0].id])

    res.json({ ok: true, post: rows[0] })
  } catch (err) {
    console.error('Error en GET /api/blog/:slug:', err)
    res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' })
  }
})

// POST /api/blog — crear post (básico, sin auth por ahora)
router.post('/', async (req, res) => {
  try {
    const { titulo, slug, resumen, contenido, categoria, imagen, autor } = req.body

    if (!titulo || !slug || !contenido) {
      return res.status(400).json({ ok: false, mensaje: 'titulo, slug y contenido son requeridos' })
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      return res.status(400).json({ ok: false, mensaje: 'El slug solo puede tener letras minúsculas, números y guiones' })
    }

    const [result] = await pool.execute(
      `INSERT INTO blog_posts (titulo, slug, resumen, contenido, categoria, imagen, autor, publicado)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [titulo, slug, resumen || null, contenido, categoria || null, imagen || null, autor || 'Equipo Asiste ING']
    )

    res.status(201).json({ ok: true, id: result.insertId })
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ ok: false, mensaje: 'Ya existe un post con ese slug' })
    }
    console.error('Error en POST /api/blog:', err)
    res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' })
  }
})

module.exports = router
