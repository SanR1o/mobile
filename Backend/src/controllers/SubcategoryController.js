const { Category, Subcategory, Product } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');

//obtener todas las subcategorias
const getSubcategories = asyncHandler(async (req, res) => {
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
    //consulta a la base de datos
    let query = Subcategory.find(filter)
    .populate('createdBy', 'username firstname lastname')
    .populate('category', 'name')
    .populate('productsCount').sort({ sortOrder: 1, name: 1 });
    if (req.query.page) {
        query = query.skip(skip).limit(limit);
    }
    //ejecutar las consultas
    const subcategories = await query;
    const totalCount = await Subcategory
        .countDocuments(filter);

    res.status(200).json({
        success: true,
        data: subcategories,
        pagination: req.query.page ? {  
            page,
            limit,
            total: totalCount,  
            pages: Math.ceil(totalCount / limit),
        } : undefined
    });
});

const getActiveSubcategories = asyncHandler(async (req, res) => {
    const filter = { isActive: true };
    const subcategories = await Subcategory.find(filter)
        .populate('createdBy', 'username firstname lastname')
        .populate('category', 'name')
        .populate('productsCount');
    res.status(200).json({
        success: true,
        data: subcategories
    });
});

//obtener subcategoria por id
const getSubcategoryById = asyncHandler(async (req, res) => {
    const subcategory = await Subcategory.findById(req.params.id)
        .populate('createdBy', 'username firstname lastname')
        .populate('category', 'name')
        .populate('productsCount');
    if (!subcategory) {
        res.status(404).json({
            success: false,
            message: 'Subcategoría no encontrada'
        });
        return;
    }
    res.status(200).json({
        success: true,
        data: subcategory
    });
});

//crear subcategoria
const createSubcategory = asyncHandler(async (req, res) => {
    const { 
        name, 
        description,
        icon,
        color,  
        category, 
        sortOrder, 
        isActive 
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

    const targetCategoryId = categoryExists._id;
    //verificar que no exista una subcategoria con el mismo nombre en la misma categoria
    const subcategoryExists = await Subcategory.findOne({
        name,
        category: targetCategoryId
    });
    if (subcategoryExists) {
        res.status(400).json({
            success: false,
            message: 'Ya existe una subcategoría con ese nombre dentro de esta categoría'
        });
        return;
    }

    //crear la subcategoría
    const subcategory = await Subcategory.create({
        name,
        description,
        category: targetCategoryId,
        icon,
        color,
        sortOrder: sortOrder || 0,
        isActive: isActive !== undefined ? isActive : true,
        createdBy: req.user._id
    });

    await subcategory.populate('category', 'name slug')

    res.status(201).json({
        success: true,
        data: subcategory
    });
});

//actualizar subcategoria