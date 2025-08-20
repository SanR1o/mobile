const express = require('express');
const router = express.Router();
const {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    getUserStats
} = require('../controllers/UserController');
const {
    verifyToken, 
    verifyRole,
    verifyAdmin, 
    verifyAdminCoordinador, 
    verifyAdminOrOwner 
} = require('../middleware/auth');
const { validateObjectId } = require('../middleware/errorHandler')

//Ruta de verificacion de token
router.use(verifyToken);
//rutas
router.get('/stats', verifyAdminCoordinador, getUserStats);
router.get('/', verifyAdminCoordinador, getUsers);
router.get('/id', validateObjectId('id'), verifyAdminOrOwner, getUserById);

router.post('/', verifyAdminCoordinador, createUser);
router.put('/:id', validateObjectId('id'), verifyAdminCoordinador, updateUser);
router.delete('/:id', validateObjectId('id'), verifyAdmin, deleteUser);
router.patch('/:id//toogle-status', validateObjectId('id'), verifyAdminCoordinador, toggleUserStatus);

module.exports = router;