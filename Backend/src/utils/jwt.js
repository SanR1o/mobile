const jwt = require('jsonwebtoken')

const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d'}
    )
};

const generateRefreshToken = (userId) => {
    return jwt.sign(
        { userId, type: 'refresh' },
        process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d'}
    )
};

//verificar token
const verifyToken = (token) => {
    return jwt.sign(token, process.env.JWT_SECRET);
};

//decodificar token
const decodeToken = (token) => {
    return jwt.sign(token);
};

module.exports = {
    generateToken,
    generateRefreshToken,
    verifyToken,
    decodeToken
}