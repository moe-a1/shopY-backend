const router = require('express').Router();
const { verifyToken } = require('./verifyToken');
const Cart = require('../models/cart');
const Product = require('../models/Product');

// Calculate total price
const calculateTotalPrice = async (products) => {
    let totalPrice = 0;
    for (const item of products) {
        const product = await Product.findById(item.product);
        if (product) {
            totalPrice += product.price * item.quantity;
        }
    }
    return totalPrice;
};

// Update cart
router.post('/cart/updateCart', verifyToken, async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        let cart = await Cart.findOne({ user: req.user.id });

        if (cart) {
            const existingProductIndex = cart.products.findIndex(
                (item) => item.product.toString() === productId
            );

            if (existingProductIndex > -1) {
                cart.products[existingProductIndex].quantity += quantity;
            } else {
                cart.products.push({ product: productId, quantity });
            }
        } else {
            cart = new Cart({
                user: req.user.id,
                products: [{ product: productId, quantity }],
            });
        }

        cart.totalPrice = await calculateTotalPrice(cart.products);

        await cart.save();

        res.status(200).json(cart);
    } catch (error) {
        console.error('Error adding product to cart:', error.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Remove product from cart
router.delete('/cart/removeProduct/:productId', verifyToken, async (req, res) => {
    try {
        const { productId } = req.params;

        const cart = await Cart.findOne({ user: req.user.id });

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const productIndex = cart.products.findIndex(
            (item) => item.product.toString() === productId
        );

        if (productIndex === -1) {
            return res.status(404).json({ message: 'Product not found in cart' });
        }

        cart.products.splice(productIndex, 1);

        cart.totalPrice = await calculateTotalPrice(cart.products);

        await cart.save();

        res.status(200).json(cart);
    } catch (error) {
        console.error('Error removing product from cart:', error.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Empty cart
router.delete('/cart/empty', verifyToken, async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user.id });

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        cart.products = [];
        cart.totalPrice = 0;

        await cart.save();

        res.status(200).json({ message: 'Cart emptied successfully', cart });
    } catch (error) {
        console.error('Error emptying cart:', error.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;