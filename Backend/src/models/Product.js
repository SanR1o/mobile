const mongoose = require('mongoose');
const { validate } = require('./Subcategory');

const productSchema = new mongoose.Schema({
    name:{
        type: String,
        required: [true, 'El nombre del producto es obligatorio'],
        trim: true,
        minlength: [2, 'El nombre del producto debe tener al menos 2 caracteres'],
        maxlength: [100, 'El nombre del producto no puede exceder los 100 caracteres'],
    },
    shortDescription: {
        type: String,
        trim: true,
        maxlength: [250, 'La descripción corta del producto no puede exceder los 250 caracteres'],
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'La descripción del producto no puede exceder los 1000 caracteres'],
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'La categoría es obligatoria'],
        validate: {
            validator: async function(categoryId) {
                const Category = mongoose.model('Category');
                const category = await Category.findById(categoryId);
                return category && category.isActive;
            },
            message: 'La categoría debe existir y estar activa',
        }
    },
    subcategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subcategory',
        required: [true, 'La subcategoría es obligatoria'],
        validate: {
            validator: async function(subcategoryId) {
                const Subcategory = mongoose.model('Subcategory');
                const subcategory = await Subcategory.findById(subcategoryId);
                return subcategory && subcategory.isActive;
            },
            message: 'La subcategoría debe existir y estar activa',
        }
    },
    slug: {
        type: String,
        lowercase: true,
        trim: true,
    },
    sku:{
        type: String,
        required: [true, 'El SKU del producto es obligatorio'],
        unique: true,
        uppercase: true,
        minlength: [3, 'El SKU del producto debe tener al menos 3 caracteres'],
        maxlength: [50, 'El SKU del producto no puede exceder los 50 caracteres'],
    },
    price: {
        type: Number,
        required: [true, 'El precio del producto es obligatorio'],  
        min: [0, 'El precio del producto no puede ser negativo'],
        validate: {
            validator: function(value) {
                return Number.isFinite(value) && value > 0;
            },
            message: 'El precio del producto debe ser un número mayor a cero',
        }
    },
    comparePrice: {
        type: Number,
        min: [0, 'El precio de comparación no puede ser negativo'],
        validate: {
            validator: function(value) {
                if (value === null || value === undefined) {
                    return true;
                }
                return Number.isFinite(value) && value >= 0;
            },
            message: 'El precio de comparación debe ser un número mayor o igual al precio del producto',
        }
    },
    cost: {
        type: Number,
        min: [0, 'El costo del producto no puede ser negativo'],
        validate: {
            validator: function(value){
                if (value === null || value === undefined) {
                    return true;
                }
                return Number.isFinite(value) && value >= 0;
            },
            message: 'El costo del producto debe ser un número mayor o igual a cero',
        },
    },
    stock: {
        quantity: {
            type: Number,
            required: [true, 'La cantidad en stock es obligatoria'],
            min: [0, 'La cantidad en stock no puede ser negativa'],
            default: 0,
        },
        minStock: {
            type: Number,
            min: [0, 'El stock mínimo no puede ser negativo'],
        },
    },
    dimensions: {
        weight: {
            type: Number,
            min: [0, 'El peso no puede ser negativo'],
        },
        length: {
            type: Number,
            min: [0, 'La longitud no puede ser negativa'],
        },
        height: {
            type: Number,
            min: [0, 'La altura no puede ser negativa'],
        }
    },
    tags: [{
        type: String,
        trim: true,
        lowercase: true,
        maxlength: [50, 'cada etiqueta no puede exceder los 50 caracteres'],
    }],
    images:[{
        url:{
            type: String,
            required: [true, 'La URL de la imagen es obligatoria'],
            trim: true,
        },
        alt: {
            type: String,
            trim: true,
            maxlength: [200, 'El texto alternativo de la imagen no puede exceder los 200 caracteres'],
        },
        isPrimary:{
            type: Boolean,
            default: false,
        }
    }],
    isActive: {
        type: Boolean,
        default: true,
    },
    isFeatured: {
        type: Boolean,
        default: false,
    },
    isDigital: {
        type: Boolean,
        default: false,
    },
    sortOrder: {
        type: Number,
        default: 0,
        maxlength: [70, 'El título no puede exceder los 70 dígitos'],
    },
    seoDescription: {
        type: String,
        trim: true,
        maxlength: [160, 'La descripción SEO no puede exceder los 160 caracteres'],
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }
},{
    timestamps:true
});

productSchema.pre('save', function(next) {
    if (this.isModified('name') && !this.slug) {
        this.slug = this.name
            .toLowerCase()
            .trim()
            .replace(/[áàäâ]/g, 'a')
            .replace(/[éèëê]/g, 'e')
            .replace(/[íìïî]/g, 'i')
            .replace(/[óòöô]/g, 'o')
            .replace(/[úùüû]/g, 'u')
            .replace(/[ñ]/g, 'n')
            .replace(/[ç]/g, 'c')
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }
    next();
});

productSchema.pre('findOneAndUpdate', function(next) {
    const update = this.getUpdate();

    if (update.name) {
        update.slug = update.name.toLowerCase().replace(/[a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
    this.setUpdate(update);
    next();
});

productSchema.pre('save', async function(next) {
    if (this.isModified('category') || this.isModified('subcategory')) {
        const Subcategory = mongoose.model('Subcategory');
        const subcategory = await Subcategory.findById(this.subcategory);

        if (!subcategory) {
            return next(new Error('La subcategoría especificada no existe'));
        }

        if (!subcategory.category) {
            return next(new Error('La subcategoría no tiene una categoría asignada'));
        }

        if (subcategory.category.toString() !== this.category.toString()) {
            return next(new Error('La subcategoría no pertenece a la categoría especificada'));
        }
    }
    next();
});

productSchema.virtual('profitMargin').get(function() {
    if (this.cost && this.price) {
        return ((this.price - this.cost) / this.price) * 100;
    }
    return 0;
});

productSchema.virtual('isOutOfStock').get(function() {
    if (this.stock.trackStock) return false;
    return this.stock.quantity <= 0;
});

productSchema.virtual('primaryImage').get(function() {
    return this.images.find(img => img.isPrimary) || this.images[0];
});

productSchema.statics.findActive = function() {
    return this.find({ isActive: true }).populate('category','name slug').populate('subcategory','name slug').sort({ sortOrder: 1, name: 1 });
};

productSchema.statics.findbyCategory = function(categoryId) {
    return this.find({ 
        category: categoryId, 
        isActive: true 
    }).populate('category','name slug').populate('subcategory','name slug').sort({ sortOrder: 1, name: 1 });
};

productSchema.statics.findbySubcategory = function(subcategoryId) {
    return this.find({ 
        subcategory: subcategoryId, 
        isActive: true 
    }).populate('category','name slug').populate('subcategory','name slug').sort({ sortOrder: 1, name: 1 });
};

productSchema.statics.findbyFeature = function() {
    return this.find({ 
        isFeatured: true, 
        isActive: true 
    }).populate('category','name slug').populate('subcategory','name slug').sort({ sortOrder: 1, name: 1 });
};

productSchema.methods.getFullPath = async function() {
    await this.populate([
        { path: 'category', select: 'name' },
        { path: 'subcategory', select: 'name' }
    ]);

    return `${this.category.name} > ${this.subcategory.name} > ${this.name}`;
};

productSchema.methods.updateStock = async function(quantity) {
    if (this.stock.trackStock) {
        this.stock.quantity += quantity;
        if (this.stock.quantity < 0) {
            this.stock.quantity = 0;
        }
    }
    return this.save();
};

//indices para mejorar el rendimiento de las consultas
productSchema.index({ category: 1});
productSchema.index({ subcategory: 1});
productSchema.index({ isActive: 1});
productSchema.index({ isFeatured: 1});
productSchema.index({ price: 1});
productSchema.index({ 'stock.quantity': 1});
productSchema.index({ sortOrder: 1});
productSchema.index({ createdBy: 1});
productSchema.index({ tags: 1});

productSchema.index({
    name: 'text',
    shortDescription: 'text',
    description: 'text',
    tags: 'text',

});

module.exports = mongoose.model('Product', productSchema);