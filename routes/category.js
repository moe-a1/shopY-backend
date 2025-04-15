const router = require('express').Router();
const Category = require('../models/category');

// Add multiple categories
router.post('/addCategories', async (req, res) => {
    try {
        const { names } = req.body;

        if (!Array.isArray(names) || names.length === 0) {
            return res.status(400).json({ message: 'Please provide an array of category names' });
        }

        const savedCategories = [];
        for (const name of names) {
            const trimmedName = name.trim();

            // Check if the category already exists
            const existingCategory = await Category.findOne({ name: trimmedName });
            if (!existingCategory) {
                // Create and save the new category
                const newCategory = new Category({ name: trimmedName });
                const savedCategory = await newCategory.save();
                savedCategories.push(savedCategory);
            }
        }

        res.status(201).json({
            message: 'Categories added successfully',
            categories: savedCategories,
        });
    } catch (error) {
        console.error('Error adding categories:', error.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get all categories
router.get('/getAllCategories', async (req, res) => {
    try {
        const categories = await Category.find();
        res.status(200).json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;