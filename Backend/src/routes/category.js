const express = require('express');
const router = express.Router();
const {
    getCategories,
    getActiveCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus,
    sortCategories,
    getCategoriesWithStats
} = require('../controllers/CategoryController');
const {
    verifyToken, 
    verifyRole,
    verifyAdmin, 
    verifyAdminCoordinador, 
    verifyAdminOrOwner 
} = require('../middleware/auth');
const { validateObjectId } = require('../middleware/errorHandler');

//Ruta de verificacion de token
router.use(verifyToken);

//Rutas
router.get('/stats', verifyAdmin, getCategoriesWithStats);
router.get('/', getCategories);
router.get('/active', getActiveCategories);
router.get('/:id', validateObjectId('id'), getCategoryById);

router.post('/reorder', verifyAdminCoordinador, sortCategories);
router.post('/', verifyAdminCoordinador, createCategory);
router.put('/:id', validateObjectId('id'), verifyAdminCoordinador, updateCategory);
router.delete('/:id', validateObjectId('id'), verifyAdmin, deleteCategory);
router.patch('/:id/toggle-status', validateObjectId('id'), verifyAdminCoordinador, toggleCategoryStatus);

module.exports = router;