const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

app.use(express.json());


// MongoDB connection
const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI)
.then(() => console.log('MongoDB Connected'))
.catch((err) => console.error('MongoDB connection error:', err));


// Server connection
const PORT = process.env.PORT;
app.listen(PORT || 5000, () => {
    console.log(`Server running on port ${PORT}`);
});
