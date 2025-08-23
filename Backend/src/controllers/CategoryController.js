const { Category, Subcategory, Product } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');

//obtener todas las categorias
const getCategories = asyncHandler(async (req, res) => {
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

    //consulta a la base de datos
    let query = Category.find(filter)
    .populate('createdBy', 'username firstName lastName')
    .sort({ sortOrder: 1, name: 1 });

    if (req.query.page) {
        query = query.skip(skip).limit(limit);
    }

    //ejecutar las consultas
    const categories = await query;
    const totalCount = await Category.countDocuments(filter);

    res.status(200).json({
        success: true,
        data: categories,
        pagination: req.query.page ? {
            page,
            limit,
            total: totalCount,
            pages: Math.ceil(totalCount / limit),
        } : undefined
    });
});

//ordenar categorias
const sortCategories = asyncHandler(async (req, res) => {
    const { sortOrder } = req.body;
    if (!Array.isArray(sortOrder) || sortOrder.length === 0) {
        res.status(400).json({
            success: false,
            message: 'El orden debe ser un arreglo no vacío'
        });
        return;
    }

    // Actualizar el orden de las categorías
    const bulkOps = sortOrder.map((id, index) => ({
        updateOne: {
            filter: { _id: id },
            update: { sortOrder: index }
        }
    }));

    await Category.bulkWrite(bulkOps);

    res.status(200).json({
        success: true,
        message: 'Categorías ordenadas correctamente'
    });
});

//obtener categoria por id
const getCategoryById = asyncHandler(async (req, res) => {

    const category = await Category.findById(req.params.id)
        .populate('createdBy', 'username firstName lastName')
        .populate('updatedBy', 'username firstName lastName');

        if (!category) {
            res.status(404).json({
                success: false,
                message: 'Categoría no encontrada'
            });
        }
    //obtener subcategorias de esta categoria
    const subcategories = await Subcategory
    .find({ category: category._id, isActive: true })
    .sort({ sortOrder: 1, name: 1 });
    res.status(200).json({
        success: true,
        data: {
            ...category.toObject(),
            subcategories
        }
    });
});

const getActiveCategories = asyncHandler(async (req, res) => {
    const filter = { isActive: true };
    const categories = await Category.find(filter)
        .populate('createdBy', 'username firstName lastName')
        .sort({ sortOrder: 1, name: 1 });
    res.status(200).json({
        success: true,
        data: categories
    });
});

//crear categoria
const createCategory = asyncHandler(async (req, res) => {
    const { 
        name, 
        description,
        icon, 
        isActive, 
        sortOrder,
        color,
        createdBy,
        slug
    } = req.body;

    if (!name || !slug) {
        const errors = [];
        if (!name) errors.push('El nombre de la categoría es obligatorio');
        if (!slug) errors.push('El slug de la categoría es obligatorio');
        return res.status(400).json({
            success: false,
            message: 'Error de validación',
            errors
        });
    }

    const existingCategory = await Category.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') }
        });
    if (existingCategory) {
        res.status(400).json({
            success: false,
            message: 'Ya existe una categoría con este nombre'
        });
    }

    // Validar slug duplicado
    const existingSlug = await Category.findOne({ slug });
    if (existingSlug) {
        return res.status(400).json({
            success: false,
            message: 'Ya existe una categoría con este slug',
            errors: ['El slug de la categoría ya está en uso']
        });
    }

    //crear la categoria
    const category = await Category.create({
        name,
        description,
        icon,
        color,
        slug,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder : sortOrder || 0,
        createdBy: req.user._id,
    });

    res.status(201).json({
        success: true,
        data: category
    });
});

//actualizar una categoria
const updateCategory = asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id);
    if (!category) {
        res.status(404).json({
            success: false,
            message: 'Categoría no encontrada'
        });
    }
    const { 
        name, 
        description,
        icon,
        color,
        isActive,
        sortOrder
    } = req.body;

    //verificar duplicados
    if (name && name !== category.name) {
        const existingCategory = await Category.findOne({
            name: { $regex: new RegExp(`^${name}$`, 'i') }
        });
        if (existingCategory) {
            res.status(400).json({
                success: false,
                message: 'Ya existe una categoría con este nombre'
            });
            return;
        }
    }

    //actualizar la categoria
    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    if (icon !== undefined) category.icon = icon;
    if (color !== undefined) category.color = color;
    if (isActive !== undefined) category.isActive = isActive;
    if (sortOrder !== undefined) category.sortOrder = sortOrder;
    category.updatedBy = req.user._id;

    await category.save();

    res.status(200).json({
        success: true,
        message: 'Categoría actualizada correctamente',
        data: category
    });
});

//eliminar una categoria
const deleteCategory = asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id);
    if (!category) {
        res.status(404).json({
            success: false,
            message: 'Categoría no encontrada'
        });
        return;
    }
    //solo admin puede eliminar
    if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({
            success: false,
            message: 'No tienes permiso para eliminar esta categoría'
        });
        return;
    }
    //verificar que no tenga subcategorias
    const subcategories = await Subcategory.find({ category: category._id });
    if (subcategories.length > 0) {
        res.status(400).json({
            success: false,
            message: 'No se puede eliminar esta categoría porque tiene subcategorías asociadas'
        });
        return;
    }
    //verificar que no tenga productos asociados
    const products = await Product.find({ category: category._id });
    if (products.length > 0) {
        res.status(400).json({
            success: false,
            message: 'No se puede eliminar esta categoría porque tiene productos asociados'
        });
        return;
    }
    await category.deleteOne();
    res.status(200).json({
        success: true,
        message: 'Categoría eliminada correctamente'
    });
});

//activar o desactivar una categoria
const toggleCategoryStatus = asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id);
    if (!category) {
        res.status(404).json({
            success: false,
            message: 'Categoría no encontrada'
        });
        return;
    }
    category.isActive = !category.isActive;
    category.updatedBy = req.user._id;
    await category.save();
    res.status(200).json({
        success: true,
        message: `Categoría ${category.isActive ? 'activada' : 'desactivada'} exitosamente`,
        data: category
    });
});

const getCategoriesWithStats = asyncHandler(async (req, res) => {
    const categoriesWithSubcounts = await Category.aggregate([
        {
            $lookup: {
                from: 'subcategories',
                localField: '_id',
                foreignField: 'category',
                as: 'subcategories'
            }
        },
        {
            $project: {
                name: 1,
                description: 1,
                subcategoriesCount: { $size: '$subcategories' },
            }
        },
        { $sort: { subcategoriesCount: -1 } },
        { $limit: 5 }
    ]);

    res.status(200).json({
        success: true,
        data: categoriesWithSubcounts
    });
});

module.exports = {
    getCategories,
    getActiveCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus,
    sortCategories,
    getCategoriesWithStats
};