const bcrypt = require('bcryptjs');
const { User } = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const { generateToken } = require('../utils/jwt');

//login
const login = asyncHandler(async (req, res) => {
    console.log('Datos de login recibidos:', req.body.email);
    const { email, username, password } = req.body;
    const loginField = email || username;

    console.log('Campo de login:', loginField);
    console.log('Contraseña recibida:', password ? '[PRESENTE]' : '[AUSENTE]');
    
    //Validaciones
    if (!loginField || !password) {
        console.error('ERROR - Faltan campos requeridos');
        return res.status(400).json({
            success: false,
            message: 'Email/Username y contraseña son requeridos'
        });
    }

    //Busqueda de usuario en la base de datos
    try {
    console.log('Buscando usuario en la base de datos con:', loginField.toLowerCase());
    const user = await User.findOne({ 
        $or: [
            { email: loginField.toLowerCase() }, 
            { username: loginField.toLowerCase() },
        ] 
    }).select('+password');
    console.log('Usuario encontrado:', user ? user.username : '[AUSENTE]');

    if (!user) {
        console.error('ERROR - Usuario no encontrado');
        return res.status(404).json({
            success: false,
            message: 'Usuario no encontrado'
        });
    }

    //verificacion usuario inactivo
    if(!user.isActive) {
        console.log('ERROR - Usuario inactivo contacta al administrador');
        return res.status(403).json({
            success: false,
            message: 'Usuario inactivo, contacta al administrador'
        });
    }

    //verificacion de la contraseña
    console.log('Verificando contraseña...');
    const isPasswordValid = await user.comparePassword(password);
    console.log('Contraseña válida:', isPasswordValid);
    if (!isPasswordValid) {
        console.log('ERROR DE AUTENTICACIÓN - Contraseña inválida');
        return res.status(401).json({
            success: false,
            message: 'Credenciales inválidas'
        });
    }
    user.lastlogin = new Date();
    await user.save();
    //Generar token JWT
    console.log('Generando token JWT...');
    const token = generateToken(user._id);
    console.log('Token generado:', token);
    res.status(200).json({
        success: true,
        message: 'Login exitoso',
        data: {
            user: userResponse,
            token: token,
            expiresIn: proccess.env.JWT_EXPIRES_IN || '1h'
        }
    });

    } catch (error) {
        console.log('ERROR DEL SERVIDOR - LOGIN: ', error);
        return res.status(500).json({
            success: false,
            message: 'Error del servidor'
        });
    }
});

//obtener info del usuario autenticado
const getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    res.status(200).json({
        success: true,
        data: user
    });
});

//Cambio de contraseña
const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        return res.status(400).json({
            success: false,
            message: 'Se requieren la contraseña actual y la nueva'
        });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'La nueva contraseña debe tener al menos 6 caracteres'
        });
    }

    //obtener usuario con contraseña actual
    const user = await User.findById(req.user._id).select('+password');

    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
        return res.status(401).json({
            success: false,
            message: 'La contraseña actual es incorrecta'
        });
    }

    user.password = newPassword;
    await user.save();
    res.status(200).json({
        success: true,
        message: 'Contraseña actualizada exitosamente'
    });
});

//invalidar token usuario extraño
const logout = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Logout exitoso'
    });
});

//verificar token
const verifyToken = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Token válido',
        data: req.user
    });
});

module.exports = {
    login,
    getMe,
    changePassword,
    logout,
    verifyToken
};