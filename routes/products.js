const express = require('express');
const router = express.Router();
const { verifyToken } = require('./verifyToken');
const Product = require('../models/Product');
const Category = require('../models/category');

router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, description, price, images, category, quantity } = req.body;

    const categoryDocs = await Category.find({ name: { $in: category } });
    if (categoryDocs.length !== category.length) {
      return res.status(400).json({ message: 'One or more categories not found' });
    }
    console.log(categoryDocs);
    const categoryIds = categoryDocs.map(cat => cat._id);

    const newProduct = new Product({
      title,
      description,
      price,
      images,
      category: categoryIds,
      quantity,
      seller: req.user.id
    });

    const product = await newProduct.save();
    
    await Promise.all(
      categoryIds.map(categoryId => 
        Category.findByIdAndUpdate(categoryId, { $push: { products: product._id } }, { new: true })
      )
    );

    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.get('/myproducts', verifyToken, async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user.id });

    res.json(products);
  } catch (error) {
    console.error('Error fetching seller products:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const products = await Product.find().populate('seller', 'username');
    
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});


router.get('/getPriceRange', async (req, res) => {
  try {
    const minPriceProduct = await Product.findOne().sort({ price: 1 }).limit(1);
    const maxPriceProduct = await Product.findOne().sort({ price: -1 }).limit(1);
    
    res.json({ minPrice: minPriceProduct.price, maxPrice: maxPriceProduct.price });
  } catch (error) {
    console.error('Error fetching price range:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});



router.get('/filterByPrice', async (req, res) => {
  try {
    const { minPrice, maxPrice } = req.query;

    const min = Number(minPrice);
    const max = Number(maxPrice);
    
    const products = await Product.find({ price: { $gte: min, $lte: max }}).populate('seller', 'username');
    
    res.json(products);
  } catch (error) {
    console.error('Error fetching products by price range:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});


router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('seller', 'username');
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error.message);    
    res.status(500).json({ message: 'Server Error' });
  }
});

router.get('/category/:categoryName', async (req, res) => {
  try {
    const { categoryName } = req.params;
    
    const category = await Category.findOne({ name: categoryName });
    if (!category) {
      return res.status(404).json({ message: `Category '${categoryName}' not found` });
    }

    const allProducts = await Product.find().populate('seller', 'username').populate('category', 'name');
    
    const filteredProducts = allProducts.filter(product => {
      return product.category.some(cat => cat._id.toString() === category._id.toString());
    });
    
    res.json(filteredProducts);
  } catch (error) {
    console.error('Error fetching products by category:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.get('/category/:categoryName/filter', async (req, res) => {
  try {
    const { categoryName } = req.params;
    const { minPrice, maxPrice } = req.query;
    
    const min = Number(minPrice);
    const max = Number(maxPrice);
    
    const formattedCategoryName = categoryName.charAt(0).toUpperCase() + categoryName.slice(1).toLowerCase();
    const category = await Category.findOne({ name: formattedCategoryName });
    if (!category) {
      return res.status(404).json({ message: `Category '${categoryName}' not found` });
    }

    const allProducts = await Product.find({
      price: { $gte: min, $lte: max }
    }).populate('seller', 'username').populate('category', 'name');
    
    const filteredProducts = allProducts.filter(product => {
      return product.category.some(cat => cat._id.toString() === category._id.toString());
    });
        
    res.json(filteredProducts);
  } catch (error) {
    console.error('Error filtering products by category and price:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.get('/category/:categoryName/getPriceRange', async (req, res) => {
  try {
    const { categoryName } = req.params;
    
    const category = await Category.findOne({ name: categoryName });
    if (!category) {
      return res.status(404).json({ message: `Category '${categoryName}' not found` });
    }

    const allProducts = await Product.find().populate('category', 'name');
    
    const filteredProducts = allProducts.filter(product => {
      return product.category.some(cat => cat._id.toString() === category._id.toString());
    });
    
    if (filteredProducts.length === 0) {
      return res.json({ minPrice: 0, maxPrice: 0 });
    }
    
    const prices = filteredProducts.map(product => product.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    res.json({ minPrice, maxPrice });
  } catch (error) {
    console.error('Error fetching category price range:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.get('/search/query', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // Use a case-insensitive regular expression to search in both title and description
    const searchRegex = new RegExp(q, 'i');
    
    const products = await Product.find({
      $or: [
        { title: { $regex: searchRegex } }
      ]
    }).populate('seller', 'username');
    
    res.json(products);
  } catch (error) {
    console.error('Error searching products:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.get('/random/:count', async (req, res) => {
  try {
    const count = parseInt(req.params.count) || 8;

    const totalProducts = await Product.countDocuments();
    const limitCount = Math.min(count, totalProducts);
    
    const randomProducts = await Product.aggregate([ { $sample: { size: limitCount } } ]);
    
    await Product.populate(randomProducts, { path: 'seller', select: 'username' });
    
    res.json(randomProducts);
  } catch (error) {
    console.error('Error fetching random products:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (product.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own products' });
    }
    
    await Promise.all(
      product.category.map(categoryId => 
        Category.findByIdAndUpdate(categoryId, { $pull: { products: product._id } }, { new: true })
      )
    );
    
    await Product.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.put('/:id', verifyToken, async (req, res) => {
  try {
    const productId = req.params.id;
    const { title, description, price, images, category, quantity } = req.body;
    
    const product = await Product.findById(productId);
    
    if (product.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only update your own products' });
    }
    
    if (category && Array.isArray(category)) {
      const categoryDocs = await Category.find({ name: { $in: category } });
      
      const newCategoryIds = categoryDocs.map(cat => cat._id.toString());
      const oldCategoryIds = product.category.map(id => id.toString());
      
      const categoriesToAdd = newCategoryIds.filter(id => !oldCategoryIds.includes(id));
      const categoriesToRemove = oldCategoryIds.filter(id => !newCategoryIds.includes(id));
      
      await Promise.all(
        categoriesToRemove.map(categoryId => Category.findByIdAndUpdate(categoryId,{ $pull: { products: productId } }))
      );
      await Promise.all(
        categoriesToAdd.map(categoryId => Category.findByIdAndUpdate(categoryId,{ $push: { products: productId } }))
      );
      
      product.category = newCategoryIds.map(id => id);
    }
    
    if (title) product.title = title;
    if (description) product.description = description;
    if (price) product.price = price;
    if (images) product.images = images;
    if (quantity !== undefined) product.quantity = quantity;
    
    const updatedProduct = await product.save();
    
    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});


router.get('/:id/related', async (req, res) => {
  try {
    const productId = req.params.id;

    // Find the product by ID
    const product = await Product.findById(productId).populate('category', 'name');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Find related products in the same categories, excluding the current product
    const relatedProducts = await Product.find({
      category: { $in: product.category },
      _id: { $ne: productId }
    }).limit(10).populate('seller', 'username');

    res.json(relatedProducts);
  } catch (error) {
    console.error('Error fetching related products:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
