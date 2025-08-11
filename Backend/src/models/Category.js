const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'El nombre de la categoría es obligatorio'],
        trim: true,
        unique: true,
        minlength: [3, 'El nombre de la categoría debe tener al menos 3 caracteres'],
        maxlength: [100, 'El nombre de la categoría no puede exceder los 100 caracteres'],
    },
    description: {
        type: String,
        required: [true, 'La descripción de la categoría es obligatoria'],
        trim: true,
        maxlength: [500, 'La descripción de la categoría no puede exceder los 500 caracteres'],
    },
    slug: {
        type: String,
        required: [true, 'El slug de la categoría es obligatorio'],
        unique: true,
        lowercase: true,
        trim: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    color: {
        type: String,
        trim: true,
        match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Ingrese un color hexadecimal válido'],
    },
    icon: {
        type: String,
        trim: true,
    },
    sortOrder: {
        type: Number,
        default: 0,
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
}, {
    timestamps: true,
});

categorySchema.pre('save', function(next) {
    if (this.isModified('name')) {
        this.slug = this.name.toLowerCase().replace(/[a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
    next();
});

categorySchema.pre('findOneAndUpdate', function(next) {
    const update = this.getUpdate();

    if (update.name) {
        update.slug = update.name.toLowerCase().replace(/[a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
    this.setUpdate(update);
    next();
});

categorySchema.virtual('productCount', {
    ref: 'Product',
    localField: '_id',
    foreignField: 'category',
    count: true,
});

categorySchema.static.findActive = function() {
    return this.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
};

categorySchema.methods.canBeDeleted = async function() {
    const Subcategory = mongoose.model('Subcategory');
    const Product = mongoose.model('Product');

    const subcategoriesCount = await Subcategory.countDocuments({ Category: this._id });
    const productCount = await Product.countDocuments({ category: this._id });

    return subcategoriesCount === 0 && productCount === 0;
};

categorySchema.index({ isActive: 1 });
categorySchema.index({ sortOrder: 1 });
categorySchema.index({ createdBy: 1 });


module.exports = mongoose.model('Category', categorySchema);
