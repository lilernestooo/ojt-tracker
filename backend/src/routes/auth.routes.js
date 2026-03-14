const express = require('express')
const router = express.Router()
const { register, login, me, updateUser, deleteUser } = require('../controllers/auth.controller')
const { authenticate, adminOnly } = require('../middleware/auth')

router.post('/register', register)
router.post('/login', login)
router.get('/me', authenticate, me)
router.put('/users/:id', authenticate, adminOnly, updateUser)
router.delete('/users/:id', authenticate, adminOnly, deleteUser)

module.exports = router