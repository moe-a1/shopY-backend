const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const categoryRoutes = require('./routes/category');

const app = express();

// Increase payload size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
const cors = require('cors');
app.use(cors());

// MongoDB connection
const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI)
.then(() => console.log('MongoDB Connected'))
.catch((err) => console.error('MongoDB connection error:', err));


app.use("/api/auth", authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/category', categoryRoutes);


// Server connection
const PORT = process.env.PORT;
app.listen(PORT || 5000, () => {
    console.log(`Server running on port ${PORT}`);
});
