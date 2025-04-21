const { verifyToken } = require('./verifyToken');
const bcrypt = require('bcrypt'); 
const saltRounds = parseInt(process.env.SALT_ROUNDS);
const router = require('express').Router();
const User = require('../models/user');

// Update User
router.put('/:id', verifyToken, async (req, res) => {
    if (req.body.password) {
        req.body.password = await bcrypt.hash(req.body.password, saltRounds);
    }
    try {
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            {
                $set: req.body,
            },
            { new: true }
        );
        res.status(200).json(updatedUser);
    } catch (err) {
        res.status(500).json(err);
    }
});

// Get User
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        const { password, ...others } = user._doc;
        res.status(200).json(others);
    } catch (err) {
        res.status(500).json(err);
    }
});

module.exports = router;