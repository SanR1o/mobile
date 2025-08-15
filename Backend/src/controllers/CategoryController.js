const { Cateogory, Subcategory, Product } = require('../models');
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
    .populate('createdBy', 'username', 'firstname', 'lastname')
    .populate('subcategoriesCount')
    .populate('productsCount').sort({ sortOrder: 1, name: 1 });

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
            total,
            pages: Math.ceil(totalCount / limit),
        } : undefined
    });
});

const getActiveCategories = asyncHandler(async (req, res) => {
    const categories = await Category.find({ isActive: true });
    res.status(200).json({
        success: true,
        data: categories
    });
});

//obtener categoria por id
const getCategoryById = asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id)
        .populate('createdBy', 'username firstname lastname')
        .populate('updatedBy', 'username firstname lastname');

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
    } = req.body;

    if (!name) {
        res.status(400).json({
            success: false,
            message: 'Nombre y descripción son requeridos'
        });
        return;
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

    //crear la categoria
    const category = await Category.create({
        name,
        description,
        icon,
        color,
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

    await category.remove();

    res.status(200).json({
        success: true,
        message: 'Categoría eliminada correctamente'
    });

    //solo admin puede eliminar
    if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({
            success: false,
            message: 'No tienes permiso para eliminar esta categoría'
        });
        return;
    }
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
    await category.save();

    res.status(200).json({
        success: true,
        message: 'Estado de la categoría actualizado correctamente',
        data: category
    });

    //solo admin puede cambiar estado
    if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({
            success: false,
            message: 'No tienes permiso para cambiar el estado de esta categoría'
        });
        return;
    }
});

module.exports = {
    getCategories,
    getActiveCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus
};