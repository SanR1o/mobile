const express = require('express');
const router = express.Router();
const {
    getSubcategories,
    sortSubcategories,
    getSubcategoriesWithStats,
    getActiveSubcategories,
    getSubcategoriesByCategory,
    getSubcategoryById,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
    toggleSubcategoryStatus
} = require('../controllers/SubcategoryController');
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
router.get('/stats', verifyAdmin, getSubcategoriesWithStats);
router.get('/', getSubcategories);
router.get('/active', getActiveSubcategories);
router.get('/category/:categoryId', validateObjectId('categoryId'), getSubcategoriesByCategory);
router.get('/id', validateObjectId('id'), verifyAdminOrOwner, getSubcategoryById);

router.post('/', verifyAdmin, createSubcategory);
router.put('/:id', validateObjectId('id'), verifyAdminCoordinador, updateSubcategory);
router.delete('/:id', validateObjectId('id'), verifyAdmin, deleteSubcategory);
router.patch('/:id/toogle-status', validateObjectId('id'), verifyAdminCoordinador, toggleSubcategoryStatus);

module.exports = router;