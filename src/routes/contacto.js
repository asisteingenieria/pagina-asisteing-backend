const express = require('express')
const router  = express.Router()
const { pool } = require('../db/connection')

// Validación básica
function validarContacto(body) {
  const { nombre, telefono, email, codigo_postal, terminos } = body
  const errores = []

  if (!nombre?.trim())        errores.push('El nombre es requerido')
  if (!telefono?.trim())      errores.push('El teléfono es requerido')
  if (!email?.trim())         errores.push('El correo es requerido')
  else if (!/\S+@\S+\.\S+/.test(email)) errores.push('Correo electrónico inválido')
  if (!codigo_postal?.trim()) errores.push('El código postal es requerido')
  else if (!/^\d{10}$/.test(codigo_postal)) errores.push('El código postal debe tener 10 dígitos')
  if (!terminos)              errores.push('Debes aceptar los términos')

  return errores
}

// POST /api/contacto — guardar nuevo mensaje de contacto
router.post('/', async (req, res) => {
  try {
    const { nombre, telefono, email, codigo_postal, mensaje, terminos } = req.body

    const errores = validarContacto(req.body)
    if (errores.length) {
      return res.status(400).json({ ok: false, errores })
    }

    const [result] = await pool.execute(
      `INSERT INTO contactos (nombre, telefono, email, codigo_postal, mensaje, acepta_terminos)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nombre.trim(), telefono.trim(), email.trim().toLowerCase(), codigo_postal.trim(), mensaje?.trim() || null, terminos ? 1 : 0]
    )

    res.status(201).json({
      ok: true,
      mensaje: 'Mensaje recibido correctamente. Nos pondremos en contacto pronto.',
      id: result.insertId,
    })
  } catch (err) {
    console.error('Error en /api/contacto:', err)
    res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' })
  }
})

// GET /api/contacto — listar mensajes (para panel admin)
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM contactos ORDER BY fecha_creacion DESC LIMIT 100'
    )
    res.json({ ok: true, contactos: rows })
  } catch (err) {
    console.error('Error en GET /api/contacto:', err)
    res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' })
  }
})

module.exports = router
