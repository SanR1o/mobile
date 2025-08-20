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

//ordenar subcategorias
const sortSubcategories = asyncHandler(async (req, res) => {
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
        message: 'Subcategorías ordenadas correctamente'
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
        .populate('updatedBy', 'username firstname lastname')
        .populate('category', 'name slug description')
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
const updateSubcategory = asyncHandler(async (req, res) => {
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

    //verificar que la subcategoria exista
    const subcategory = await Subcategory.findById(req.params.id);
    if (!subcategory) {
        res.status(404).json({
            success: false,
            message: 'Subcategoría no encontrada'
        });
        return;
    }

    //verificar que no exista una subcategoria con el mismo nombre en la misma categoria
    const subcategoryExists = await Subcategory.findOne({
        name,
        category
    });
    if (subcategoryExists) {
        res.status(400).json({
            success: false,
            message: 'Ya existe una subcategoría con ese nombre dentro de esta categoría'
        });
        return;
    }

    //actualizar la subcategoría
    if (name) subcategory.name = name;
    if (description !== undefined) subcategory.description = description;
    if (icon !== undefined) subcategory.icon = icon;
    if (color !== undefined) subcategory.color = color;
    if (isActive !== undefined) subcategory.isActive = isActive;
    if (sortOrder !== undefined) subcategory.sortOrder = sortOrder;

    subcategory.updatedBy = req.user._id;
    await subcategory.save();

    res.status(200).json({
        success: true,
        message: 'Subcategoría actualizada correctamente',
        data: subcategory
    });
});

//eliminar subcategoria
const deleteSubcategory = asyncHandler(async (req, res) => {
    const subcategory = await Subcategory.findById(req.params.id);
    if (!subcategory) {
        res.status(404).json({
            success: false,
            message: 'Subcategoría no encontrada'
        });
        return;
    }

    await subcategory.remove();

    res.status(200).json({
        success: true,
        message: 'Subcategoría eliminada correctamente'
    });

    //verificar si se puede eliminar
    const canDelete = await subcategory.canDelete();
    if (!canDelete) {
        res.status(400).json({
            success: false,
            message: 'No se puede eliminar esta subcategoría porque tiene productos asociados'
        });
        return;
    }

    //solo admin puede eliminar
    if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({
            success: false,
            message: 'No tienes permiso para eliminar esta subcategoría'
        });
        return;
    }
});

//activar/desactivar subcategoria
const toggleSubcategoryStatus = asyncHandler(async (req, res) => {
    const subcategory = await Subcategory.findById(req.params.id);
    if (!subcategory) {
        res.status(404).json({
            success: false,
            message: 'Subcategoría no encontrada'
        });
        return;
    }

    subcategory.isActive = !subcategory.isActive;
    await subcategory.save();

    res.status(200).json({
        success: true,
        message: 'Estado de la subcategoría actualizado correctamente',
        data: subcategory
    });

    //si la subcategoria se desactiva, desactivar productos asociados
    if (!subcategory.isActive) {
    await Subcategory.updateMany(
        { subcategory: subcategory._id },
        { isActive: false, updatedBy: req.user._id }
    );
    }
});

const getSubcategoriesWithStats = asyncHandler(async (req, res) => {
    const subcategoriesWithSubcounts = await Subcategory.aggregate([
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
            subcategories: subcategoriesWithSubcounts
        }
    });
});

const getSubcategoriesByCategory = asyncHandler(async (req, res) => {
    const categoryId = req.params.categoryId;
    const subcategories = await Subcategory.find({ category: categoryId })
        .populate('createdBy', 'username firstname lastname')
        .populate('category', 'name')
        .populate('productsCount');

    res.status(200).json({
        success: true,
        data: subcategories
    });
});


module.exports = {
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
};
