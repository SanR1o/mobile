const express = require('express');
const router = express.Router();
//importar controladors de autenticación
const {
    login,
    getMe,
    changePassword,
    logout,
    verifyToken,
} = require('../controllers/AuthController')
//importar middlewares
const { verifyToken: authMiddleware } = require('../middleware/auth')

//Rutas
router.post('/login', login);
router.get('/me', authMiddleware, getMe);
router.put('/change-password', authMiddleware, changePassword);
router.post('/logout', authMiddleware, logout);
router.get('/verify', authMiddleware, verifyToken);

module.exports = router;