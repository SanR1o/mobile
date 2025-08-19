const errorHandler = (err, req, res, next) => {
    console.error('Error Stack', err.stack);

    //error de validacion de mongoose
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(error => error.message);
        return res.status(400).json({
            success: false,
            message: 'Error de validación',
            errors: err.errors
        });
    }

    //error de duplicado
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return res.status(400).json({
            success: false,
            message: `${field} ya existe en el sistema`
        });
    }

    //error de cast en ObjectId
    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: 'ID de usuario inválido'
        });
    }

    //Error JWT
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Token de acceso inválido'
        });
    }

    //Error de expiración del token
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token de acceso expirado'
        });
    }



    res.status(err.statusCode || 500).json({
        success: false,
        message: 'Error interno del servidor'
    });
};