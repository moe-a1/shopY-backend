const mongoose = require('mongoose');

const BazaarCategoriesSchema = new mongoose.Schema(
    {
        name: { 
            type: String, 
            required: true, 
            trim: true 
        },
        brandsNames: { 
            type: String, 
            required: true, 
            trim: true
        },
        images: [{ 
            type: String, 
            required: true 
        }]
    }
);

const BazaarSchema = new mongoose.Schema(
    {
        name: { 
            type: String, 
            required: true, 
            trim: true 
        },
        status: {
            type: String,
            enum: ['active', 'coming_soon'],
            default: 'active',
            required: true
        },
        partitionInfo: { 
            type: String, 
            required: true, 
            trim: true 
        },
        openDates: { 
            type: String, 
            required: true, 
            trim: true 
        },
        openTimes: { 
            type: String, 
            required: true, 
            trim: true 
        },
        location: { 
            type: String, 
            required: true, 
            trim: true 
        },
        categories: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'BazaarCategories'
        }]
    },
    { timestamps: true }
);

BazaarSchema.pre('remove', async function(next) {
    try {
        await this.model('BazaarCategories').deleteMany({ bazaar: this._id });
        next();
    } catch (error) {
        next(error);
    }
});

const BazaarCategories = mongoose.model('BazaarCategories', BazaarCategoriesSchema);
const Bazaar = mongoose.model('Bazaar', BazaarSchema);

module.exports = {
    Bazaar,
    BazaarCategories
};