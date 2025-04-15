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

module.exports = router;
