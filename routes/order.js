const router = require('express').Router();
const { verifyToken } = require('./verifyToken');
const Order = require('../models/order');
const Product = require('../models/Product');
const Cart = require('../models/cart');

router.get('/getOrders', verifyToken, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id })
            .populate({
                path: 'items.product',
                select: 'title price images',
                populate: {
                    path: 'seller',
                    select: 'username'
                }
            })
            .sort({ createdAt: -1 }); 

        if (!orders || orders.length === 0) {
            return res.status(200).json({
                message: 'No orders found',
                orders: []
            });
        }

        const formattedOrders = orders.map(order => ({
            orderId: order._id,
            items: order.items.map(item => ({
                product: {
                    _id: item.product._id,
                    title: item.product.title,
                    price: item.price,
                    seller: item.product.seller?.username || 'Unknown',
                    image: item.product.images[0] 
                },
                quantity: item.quantity,
                subtotal: Number((item.price * item.quantity).toFixed(2))
            })),
            totalAmount: order.totalAmount,
            status: order.status,
            createdAt: order.createdAt,
            itemCount: order.items.length
        }));

        res.status(200).json({
            orders: formattedOrders,
            totalOrders: formattedOrders.length
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ 
            message: 'Error fetching orders',
            error: error.message 
        });
    }
});





router.post('/createOrder', verifyToken, async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user.id })
            .populate('products.product');

        if (!cart || cart.products.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        const orderItems = cart.products.map(item => ({
            product: item.product._id,
            quantity: item.quantity,
            price: item.product.price
        }));

        const totalAmount = orderItems.reduce((total, item) => 
            total + (item.price * item.quantity), 0);

        const newOrder = new Order({
            user: req.user.id,
            items: orderItems,
            totalAmount: Number(totalAmount.toFixed(2)),
            status: 'pending'
        });

        await newOrder.save();

        // Clear the cart
        cart.products = [];
        cart.totalPrice = 0;
        await cart.save();

        const populatedOrder = await Order.findById(newOrder._id)
            .populate({
                path: 'items.product',
                select: 'title price images',
                populate: {
                    path: 'seller',
                    select: 'username'
                }
            });

        const formattedOrder = {
            orderId: populatedOrder._id,
            items: populatedOrder.items.map(item => ({
                product: {
                    _id: item.product._id,
                    title: item.product.title,
                    price: item.price,
                    seller: item.product.seller?.username || 'Unknown',
                    image: item.product.images[0]
                },
                quantity: item.quantity,
                subtotal: Number((item.price * item.quantity).toFixed(2))
            })),
            totalAmount: populatedOrder.totalAmount,
            status: populatedOrder.status,
            createdAt: populatedOrder.createdAt
        };

        res.status(201).json({
            message: 'Order created successfully',
            order: formattedOrder
        });

    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ 
            message: 'Error creating order',
            error: error.message 
        });
    }
});


module.exports = router;