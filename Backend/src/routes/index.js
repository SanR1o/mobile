const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');
const userRoutes = require('./user');
const categoryRoutes = require('./category'); 
const subcategoryRoutes = require('./subcategory');
const productRoutes = require('./product');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/subcategories', subcategoryRoutes);
router.use('/products', productRoutes);

router.get('health', (req, res) => {
    res.status(200).json({
        success: true,
        message: "APi funcionando correctamente",
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

//proporciona información
router.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Bienvenido a la API de gestión',
        version: '1.0.0',
        endpoints: {
            auth: 'api/auth',
            users: 'api/users',
            categories: 'api/categories',
            subcategories: 'api/subcategories',
            products: 'api/products'
        },
        documentation: {
            postman: 'importe la colección de Postman para probar los endpoints',
            authentication: 'usa /api/auth/login para obtener el token de acceso'
        }
    });
});

module.exports = router;