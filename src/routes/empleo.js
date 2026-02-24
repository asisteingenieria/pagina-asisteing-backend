const express = require('express')
const router  = express.Router()
const { pool } = require('../db/connection')

// Validación
function validarEmpleo(body) {
  const { nombre, cedula, edad, telefono1, experiencia, terminos } = body
  const errores = []

  if (!nombre?.trim())     errores.push('El nombre es requerido')
  if (!cedula?.trim())     errores.push('La cédula es requerida')
  const edadNum = Number(edad)
  if (!edad || edadNum < 18 || edadNum > 65)
                           errores.push('La edad debe estar entre 18 y 65 años')
  if (!telefono1?.trim())  errores.push('El teléfono principal es requerido')
  if (!experiencia)        errores.push('La experiencia es requerida')
  if (!terminos)           errores.push('Debes aceptar los términos')

  return errores
}

const experienciasValidas = ['si', 'no']

// POST /api/empleo — registrar postulación
router.post('/', async (req, res) => {
  try {
    const { nombre, cedula, edad, telefono1, telefono2, experiencia, terminos } = req.body

    const errores = validarEmpleo(req.body)
    if (errores.length) {
      return res.status(400).json({ ok: false, errores })
    }

    if (!experienciasValidas.includes(experiencia)) {
      return res.status(400).json({ ok: false, errores: ['Opción de experiencia inválida'] })
    }

    const [result] = await pool.execute(
      `INSERT INTO aspirantes (nombre, cedula, edad, telefono1, telefono2, experiencia, acepta_terminos)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre.trim(),
        cedula.trim(),
        Number(edad),
        telefono1.trim(),
        telefono2?.trim() || null,
        experiencia,
        terminos ? 1 : 0,
      ]
    )

    res.status(201).json({
      ok: true,
      mensaje: 'Postulación recibida. Revisaremos tu perfil y te contactaremos pronto.',
      id: result.insertId,
    })
  } catch (err) {
    // Manejar duplicados de cédula
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        ok: false,
        errores: ['Ya existe una postulación registrada con este número de cédula'],
      })
    }
    console.error('Error en /api/empleo:', err)
    res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' })
  }
})

// GET /api/empleo — listar postulaciones (para panel admin)
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM aspirantes ORDER BY fecha_postulacion DESC LIMIT 100'
    )
    res.json({ ok: true, aspirantes: rows })
  } catch (err) {
    console.error('Error en GET /api/empleo:', err)
    res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' })
  }
})

module.exports = router
