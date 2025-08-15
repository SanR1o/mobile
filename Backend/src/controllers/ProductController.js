const { Category, Subcategory, Product } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');

//obtener todos los productos
const getProducts = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    //filtros de busqueda
    const filter = {};
    //activo-inactivo
    if (req.query.isActive !== undefined) {
        filter.isActive = req.query.isActive === 'true';
    }
    //nombre o descripcion
    if (req.query.search) {
        filter.$or = [
            { name: { $regex: req.query.search, $options: 'i' } },
            { description: { $regex: req.query.search, $options: 'i' } }
        ];
    }
    //filtrar por categoria
    if (req.query.categoryId) {
        filter.category = req.query.categoryId;
    }

    //filtrar por subcategoria
    if (req.query.subcategoryId) {
        filter.subcategory = req.query.subcategoryId;
    }

    //filtro por rangos de precio
    if (req.query.minPrice || req.query.maxPrice) {
        filter.price = {};
        if (req.query.minPrice) {
            filter.price.$gte = parseFloat(req.query.minPrice);
        }
        if (req.query.maxPrice) {
            filter.price.$lte = parseFloat(req.query.maxPrice);
        }
    }

    //filtro de stock bajo
    if (req.query.lowStock) {
        filter.$expr = {
            $and : [
                { $eq: ['$stock.trackStock', true] },
                { $lt: ['$stock.quantity', parseInt(req.query.lowStock)] }  
            ]
        }
    }

    //nombre o descripcion
    if (req.query.search) {
        filter.$or = [
            { name: { $regex: req.query.search, $options: 'i' } },
            { description: { $regex: req.query.search, $options: 'i' } },
            { sku: { $regex: req.query.search, $options: 'i' } },
            { tags: { $regex: req.query.search, $options: 'i' } }
        ];
    }

    //consulta a la base de datos
    let query = Product.find(filter)
    .populate('category', 'name')
    .populate('subcategory', 'name')
    .populate('createdBy', 'username firstname lastname');
    if (req.query.page) {
        query = query.skip(skip).limit(limit);
    }

    //ejecutar las consultas
    const products = await query;
    const totalCount = await Product
        .countDocuments(filter);

    res.status(200).json({
        success: true,
        data: products,
        pagination: req.query.page ? {  
            page,
            limit,
            total: totalCount,  
            pages: Math.ceil(totalCount / limit),
        } : undefined
    });
});

//ordenar productos
const sortProducts = asyncHandler(async (req, res) => {
    const { sortOrder } = req.body;
    if (!Array.isArray(sortOrder) || sortOrder.length === 0) {
        res.status(400).json({
            success: false,
            message: 'El orden debe ser un arreglo no vacío'
        });
        return;
    }

    // Actualizar el orden de las subcategorías
    const bulkOps = sortOrder.map((id, index) => ({
        updateOne: {
            filter: { _id: id },
            update: { sortOrder: index }
        }
    }));

    await Subcategory.bulkWrite(bulkOps);

    res.status(200).json({
        success: true,
        message: 'Productos ordenados correctamente'
    });
});

const getActiveProducts = asyncHandler(async (req, res) => {
    const filter = { isActive: true };
    const products = await Product.find(filter)
        .populate('createdBy', 'username firstname lastname')
        .populate('category', 'name')
        .populate('subcategory', 'name')
        .populate('productsCount')
        .sort({ sortOrder: 1, name: 1 });
    res.status(200).json({
        success: true,
        data: products
    });
});

//obtener producto por categoría o subcategoria
const getProductsByCategory = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;
    const category = await Category.findById(categoryId);
    if (!category || !category.isActive) {
        res.status(404).json({
            success: false,
            message: 'Categoría no encontrada o inactiva'
        });
        return;
    }
    const products = await Product.findByCategory(categoryId)
        .populate('createdBy', 'username firstname lastname')
        .populate('category', 'name')
        .populate('productsCount')
        .sort({ sortOrder: 1, name: 1 });

    res.status(200).json({
        success: true,
        data: products
    });
});

const getProductsBySubcategory = asyncHandler(async (req, res) => {
    const { subcategoryId } = req.params;

    //verifircar que la categoría exista y este activa
    const subcategory = await Subcategory.findById(subcategoryId);
    if (!subcategory || !subcategory.isActive) {
        res.status(404).json({
            success: false,
            message: 'Subcategoría no encontrada o inactiva'
        });
        return;
    }

    const products = await Product.findBySubcategory(subcategoryId)
        .populate('createdBy', 'username firstname lastname')
        .populate('category', 'name')
        .populate('subcategory', 'name')
        .populate('productsCount')
        .sort({ sortOrder: 1, name: 1 });

    res.status(200).json({
        success: true,
        data: products
    });
});

const getFeaturedProducts = asyncHandler(async (req, res) => {
    const products = await Product.findFeatured();
    res.status(200).json({
        success: true,
        data: products
    });
});


//obtener producto por id
const getProductById = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id)
        .populate('category', 'name slug description')
        .populate('subcategory', 'name slug description')
        .populate('createdBy', 'username firstname lastname')
        .populate('updatedBy', 'username firstname lastname')
    if (!product) {
        res.status(404).json({
            success: false,
            message: 'Producto no encontrado'
        });
        return;
    }
    res.status(200).json({
        success: true,
        data: product
    });
});

//obtener producto por sku
const getProductBySku = asyncHandler(async (req, res) => {
    const product = await Product.findOne({ sku: req.params.sku.toUpperCase() })
        .populate('category', 'name slug description')
        .populate('subcategory', 'name slug description')
        .populate('createdBy', 'username firstname lastname')
        .populate('updatedBy', 'username firstname lastname');

    if (!product) {
        res.status(404).json({
            success: false,
            message: 'Producto no encontrado'
        });
        return;
    }
    res.status(200).json({
        success: true,
        data: product
    });
});

//crear producto
const createProduct = asyncHandler(async (req, res) => {
    const { 
        name,
        shortDescription, 
        description,
        sku,
        icon,
        color,  
        category,
        subcategory,
        price,
        tags,
        comparePrice,
        cost,
        dimensions,
        images,
        stock, 
        sortOrder, 
        isActive,
        isFeatured,
        isDigital,
    } = req.body;

    //verificar que la categoria exista
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
        res.status(400).json({
            success: false,
            message: 'Categoría no encontrada'
        });
        return;
    }
    //verificar que la subcategoria exista
    const subcategoryExists = await Subcategory.findById(subcategory);
    if (!subcategoryExists) {
        res.status(400).json({
            success: false,
            message: 'Subcategoría no encontrada'
        });
        return;
    }

    //verificar que no exista un producto de la misma categoría y subcategoría
    const targetCategoryId = categoryExists._id;
    const targetSubcategoryId = subcategoryExists._id;
    const productExists = await Product.findOne({
        name,
        category: targetCategoryId,
        subcategory: targetSubcategoryId
    });
    if (productExists) {
        res.status(400).json({
            success: false,
            message: 'Ya existe un producto con ese nombre dentro de esta categoría y subcategoría'
        });
        return;
    }

    //verificar que la subcategoría pertenezca a la categoría
    if (subcategoryExists.category.toString() !== targetCategoryId.toString()) {
        res.status(400).json({
            success: false,
            message: 'esta subcategoría no pertenece a la categoría'
        });
        return;
    }

    //crear el producto
    const product = await Product.create({
        name,
        shortDescription, 
        description,
        sku,
        icon,
        color,  
        category: targetCategoryId,
        subcategory: targetSubcategoryId,
        price,
        comparePrice,
        cost,
        dimensions,
        images,
        tags: tags || [],
        stock: stock || {quantity: 0, minStock: 0, trackStock: false}, 
        sortOrder: sortOrder || 0, 
        isActive: isActive !== undefined ? isActive : true,
        isFeatured: isFeatured !== undefined ? isFeatured : false,
        isDigital: isDigital !== undefined ? isDigital : false,
        createdBy: req.user._id
    });

    await product.populate('category', 'name slug').populate('subcategory', 'name slug');

    res.status(201).json({
        success: true,
        data: product
    });
});

//actualizar producto
const updateProduct = asyncHandler(async (req, res) => {
    const { 
        name,
        shortDescription, 
        description,
        sku,
        icon,
        color,  
        category,
        subcategory,
        price,
        tags,
        comparePrice,
        cost,
        dimensions,
        images,
        stock, 
        sortOrder, 
        isActive,
        isFeatured,
        isDigital,
    } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
        res.status(404).json({
            success: false,
            message: 'Producto no encontrado'
        });
        return;
    }

    if (sku && sku.toUpperCase() !== product.sku) {
        const existingSku = await Product.findOne({ sku: sku.toUpperCase() });
        if (existingSku) {
            res.status(400).json({
                success: false,
                message: 'El SKU ya está en uso por otro producto'
            });
            return;
        }
    }

    //verificar que la categoria exista y este activa
    const categoryExists = await Category.findById(category);
    if (!categoryExists || !categoryExists.isActive) {
        res.status(400).json({
            success: false,
            message: 'Categoría no encontrada o inactiva'
        });
        return;
    }

    //verificar que la subcategoria exista y este activa
    const subcategoryExists = await Subcategory.findById(req.params.id);
    if (!subcategoryExists || !subcategoryExists.isActive) {
        res.status(404).json({
            success: false,
            message: 'Subcategoría no encontrada o inactiva'
        });
        return;
    }

    //verificar que no exista un producto con el mismo nombre 
    const productExists = await Product.findOne({
        name,
    });
    if (productExists) {
        res.status(400).json({
            success: false,
            message: 'Ya existe un producto con ese nombre'
        });
        return;
    }

    //verificar que la subcategoría pertenezca a la categoría
    if (subcategoryExists.category.toString() !== categoryExists._id.toString()) {
        res.status(400).json({
            success: false,
            message: 'Esta subcategoría no pertenece a la categoría'
        });
        return;
    }

    //actualizar el producto
    if (name) product.name = name;
    if (description !== undefined) product.description = description;
    if (shortDescription !== undefined) product.shortDescription = shortDescription;
    if (icon !== undefined) product.icon = icon;
    if (category !== undefined) product.category = category;
    if (subcategory !== undefined) product.subcategory = subcategory;
    if (price !== undefined) product.price = price;
    if (stock !== undefined) product.stock = stock;
    if (color !== undefined) product.color = color;
    if (isActive !== undefined) product.isActive = isActive;
    if (isFeatured !== undefined) product.isFeatured = isFeatured;
    if (isDigital !== undefined) product.isDigital = isDigital;
    if (tags !== undefined) product.tags = tags;
    if (sku !== undefined) product.sku = sku.toUpperCase();
    if (comparePrice !== undefined) product.comparePrice = comparePrice;
    if (cost !== undefined) product.cost = cost;
    if (dimensions !== undefined) product.dimensions = dimensions;
    if (images !== undefined) product.images = images;
    if (sortOrder !== undefined) product.sortOrder = sortOrder;

    product.updatedBy = req.user._id;
    await product.save();

    res.status(200).json({
        success: true,
        message: 'Producto actualizado correctamente',
        data: product
    });
});

//eliminar producto
const deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
        res.status(404).json({
            success: false,
            message: 'Producto no encontrado'
        });
        return;
    }

    //solo admin puede eliminar productos
    if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({ 
            success: false,
            message: 'No tienes permiso para eliminar este producto'
        });
        return;
    }

    await product.remove();

    res.status(200).json({
        success: true,
        message: 'Producto eliminado correctamente'
    });
});

//activar/desactivar producto
const toggleProductStatus = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        res.status(404).json({
            success: false,
            message: 'Producto no encontrado'
        });
        return;
    }

    product.isActive = !product.isActive;
    await product.save();

    res.status(200).json({
        success: true,
        message: 'Estado del producto actualizado correctamente',
        data: product
    });
});

const getProductStats = asyncHandler(async (req, res) => {
    const productWithSubcounts = await Subcategory.aggregate([
        {  
            $lookup: {
                from: 'products',
                localField: '_id',
                foreignField: 'subcategory',
                count: 'categoriesCount',
                
            }
        },
        {
            $project: {
                name: 1,
                categoryName: { $ArrayElemAt: ['$categoryInfo.name', 0] },
                subcategoriesCount: {$size: '$subcategories'},
                productsCount: 1
            }
        },
        { $sort: { productsCount: -1 } },
        { $limit: 5}
    ]);

    res.status(200).json({
        success: true,
        data: {
            stats: stats[0] || {
                totalCategories: 0,
                totalSubcategories: 0,
                totalProducts: 0
            },
            products: productWithSubcounts
        }
    });
});

module.exports = {
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
    getProductStats
};
