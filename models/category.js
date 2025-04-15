const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        products: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product', 
            },
        ],
    },
    { timestamps: true }
);

module.exports = mongoose.model('Category', CategorySchema);