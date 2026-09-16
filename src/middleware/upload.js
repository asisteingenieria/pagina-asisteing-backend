const multer  = require('multer')
const path    = require('path')
const fs      = require('fs')
const crypto  = require('crypto')

const uploadDir = path.join(__dirname, '../../uploads/blog')
fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const nombre = crypto.randomBytes(16).toString('hex') + path.extname(file.originalname).toLowerCase()
    cb(null, nombre)
  },
})

const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!tiposPermitidos.includes(file.mimetype)) {
      return cb(new Error('Formato de imagen no permitido. Usa JPG, PNG, WEBP o GIF.'))
    }
    cb(null, true)
  },
})

module.exports = upload
