const express = require('express');
const router = express.Router();
const { verifyToken } = require('./verifyToken');
const Product = require('../models/Product');

router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, description, price, images, category, quantity } = req.body;

    const newProduct = new Product({
      title,
      description,
      price,
      images,
      category,
      quantity,
      seller: req.user.id
    });

    const product = await newProduct.save();
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

module.exports = router;
