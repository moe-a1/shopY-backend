const express = require('express');
const router = express.Router();
const { verifyToken } = require('./verifyToken');
const { Bazaar, BazaarCategories } = require('../models/bazaar');

// Create a new bazaar
router.post('/', async (req, res) => {
  try {
    const { name, partitionInfo, openDates, openTimes, location, categoriesIds } = req.body;

    // Ensure categoriesIds is an array
    const categoryIdsArray = Array.isArray(categoriesIds)
      ? categoriesIds
      : categoriesIds.split(',').map(id => id.trim());

    // Validate the provided category IDs
    const validCategories = await BazaarCategories.find({
      _id: { $in: categoryIdsArray }
    });

    if (validCategories.length !== categoryIdsArray.length) {
      return res.status(400).json({ message: 'Some category IDs are invalid' });
    }

    // Create a new bazaar with the valid category IDs
    const newBazaar = new Bazaar({
      name,
      partitionInfo,
      openDates,
      openTimes,
      location,
      categories: validCategories.map(category => category._id)
    });

    const bazaar = await newBazaar.save();
    res.status(201).json(bazaar);
  } catch (error) {
    console.error('Error creating bazaar:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get all bazaars
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalBazaars = await Bazaar.countDocuments();
    const totalPages = Math.ceil(totalBazaars / limit);

    const bazaars = await Bazaar.find()
      .populate('categories')
      .skip(skip)
      .limit(limit);

    res.json({ 
      bazaars, 
      currentPage: page, 
      totalPages, 
      totalBazaars 
    });
  } catch (error) {
    console.error('Error fetching bazaars:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get a single bazaar by ID
router.get('/:id', async (req, res) => {
  try {
    const bazaar = await Bazaar.findById(req.params.id).populate('categories');
    
    if (!bazaar) {
      return res.status(404).json({ message: 'Bazaar not found' });
    }
    
    res.json(bazaar);
  } catch (error) {
    console.error('Error fetching bazaar:', error.message);    
    res.status(500).json({ message: 'Server Error' });
  }
});

// Update a bazaar
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { name, partitionInfo, openDates, openTimes, location } = req.body;
    
    const bazaar = await Bazaar.findById(req.params.id);
    
    if (!bazaar) {
      return res.status(404).json({ message: 'Bazaar not found' });
    }
    
    if (name) bazaar.name = name;
    if (partitionInfo) bazaar.partitionInfo = partitionInfo;
    if (openDates) bazaar.openDates = openDates;
    if (openTimes) bazaar.openTimes = openTimes;
    if (location) bazaar.location = location;
    
    const updatedBazaar = await bazaar.save();
    
    res.json(updatedBazaar);
  } catch (error) {
    console.error('Error updating bazaar:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Delete a bazaar
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const bazaar = await Bazaar.findById(req.params.id);
    
    if (!bazaar) {
      return res.status(404).json({ message: 'Bazaar not found' });
    }
    
    await BazaarCategories.deleteMany({ bazaar: bazaar._id });
    
    await Bazaar.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Bazaar deleted successfully' });
  } catch (error) {
    console.error('Error deleting bazaar:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Add a category to a bazaar
router.post('/:id/categories', verifyToken, async (req, res) => {
  try {
    const bazaarId = req.params.id;
    const { name, brandsNames, images } = req.body;

    const bazaar = await Bazaar.findById(bazaarId);
    if (!bazaar) {
      return res.status(404).json({ message: 'Bazaar not found' });
    }

    const newCategory = new BazaarCategories({
      name,
      brandsNames,
      images,
      bazaar: bazaarId
    });

    const savedCategory = await newCategory.save();

    bazaar.categories.push(savedCategory._id);
    await bazaar.save();

    res.status(201).json(savedCategory);
  } catch (error) {
    console.error('Error adding category to bazaar:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get all categories of a bazaar
router.get('/:id/categories', async (req, res) => {
  try {
    const bazaarId = req.params.id;
    
    const bazaar = await Bazaar.findById(bazaarId).populate('categories');
    if (!bazaar) {
      return res.status(404).json({ message: 'Bazaar not found' });
    }
    
    res.json(bazaar.categories);
  } catch (error) {
    console.error('Error fetching bazaar categories:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get a specific category from a bazaar
router.get('/:bazaarId/categories/:categoryId', async (req, res) => {
  try {
    const { bazaarId, categoryId } = req.params;
    
    const category = await BazaarCategories.findOne({
      _id: categoryId,
      bazaar: bazaarId
    });
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found in this bazaar' });
    }
    
    res.json(category);
  } catch (error) {
    console.error('Error fetching bazaar category:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Update a category in a bazaar
router.put('/:bazaarId/categories/:categoryId', verifyToken, async (req, res) => {
  try {
    const { bazaarId, categoryId } = req.params;
    const { name, brandsNames, images } = req.body;
    
    const category = await BazaarCategories.findOne({
      _id: categoryId,
      bazaar: bazaarId
    });
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found in this bazaar' });
    }
    
    if (name) category.name = name;
    if (brandsNames) category.brandsNames = brandsNames;
    if (images) category.images = images;
    
    const updatedCategory = await category.save();
    
    res.json(updatedCategory);
  } catch (error) {
    console.error('Error updating bazaar category:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Delete a category from a bazaar
router.delete('/:bazaarId/categories/:categoryId', verifyToken, async (req, res) => {
  try {
    const { bazaarId, categoryId } = req.params;
    
    const bazaar = await Bazaar.findById(bazaarId);
    if (!bazaar) {
      return res.status(404).json({ message: 'Bazaar not found' });
    }
    
    const category = await BazaarCategories.findOneAndDelete({
      _id: categoryId,
      bazaar: bazaarId
    });
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found in this bazaar' });
    }
    
    bazaar.categories = bazaar.categories.filter(
      catId => catId.toString() !== categoryId
    );
    await bazaar.save();
    
    res.json({ message: 'Category removed from bazaar successfully' });
  } catch (error) {
    console.error('Error removing category from bazaar:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Add multiple BazaarCategories to the database
router.post('/categories/add', async (req, res) => {
  try {
    const { categories } = req.body;

    if (!Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of categories' });
    }

    const savedCategories = [];
    for (const category of categories) {
      const { name, brandsNames, images, bazaar } = category;
      
      if (!name || !brandsNames || !Array.isArray(images)) {
        continue;
      }

      const newCategory = new BazaarCategories({
        name,
        brandsNames,
        images,
        bazaar: bazaar || null
      });

      const savedCategory = await newCategory.save();
      savedCategories.push(savedCategory);
      
      if (bazaar) {
        const existingBazaar = await Bazaar.findById(bazaar);
        if (existingBazaar) {
          existingBazaar.categories.push(savedCategory._id);
          await existingBazaar.save();
        }
      }
    }

    res.status(201).json({
      message: 'BazaarCategories added successfully',
      categories: savedCategories
    });
  } catch (error) {
    console.error('Error adding BazaarCategories:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get all BazaarCategories
router.get('/categories/all', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const totalCategories = await BazaarCategories.countDocuments();
    const totalPages = Math.ceil(totalCategories / limit);

    const categories = await BazaarCategories.find()
      .populate('bazaar', 'name')
      .skip(skip)
      .limit(limit);

    res.json({ 
      categories, 
      currentPage: page, 
      totalPages, 
      totalCategories 
    });
  } catch (error) {
    console.error('Error fetching BazaarCategories:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;