const express = require('express');
const router = express.Router();
const {
    getProducts,
    sortProducts,
    getActiveProducts,
    getProductsByCategory,
    getProductsBySubcategory,
    getProductById,
    getProductBySku,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleProductStatus,
    getFeaturedProducts,
    getProductStats,
    updateProductStock
} = require('../controllers/ProductController');
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

//Rutas
router.get('/', getProducts);
router.get('/active', getActiveProducts);
router.get('/sku/:sku', getProductBySku);
router.get('/featured', getFeaturedProducts);
router.get('/stats', verifyAdmin, getProductStats);
router.get('/category/:categoryId', validateObjectId('categoryId'), getProductsByCategory);
router.get('/subcategory/:subcategoryId', validateObjectId('subcategoryId'), getProductsBySubcategory);
router.get('/:id', validateObjectId('id'), getProductById);

router.post('/reorder', verifyAdminCoordinador, sortProducts);
router.post('/', verifyAdminCoordinador, createProduct);
router.put('/:id', validateObjectId('id'), verifyAdminCoordinador, updateProduct);
router.delete('/:id', validateObjectId('id'), verifyAdmin, deleteProduct);
router.patch('/:id/toggle-status', validateObjectId('id'), verifyAdminCoordinador, toggleProductStatus);
router.patch('/:id/stock', validateObjectId('id'), verifyAdminCoordinador, updateProductStock);

module.exports = router;