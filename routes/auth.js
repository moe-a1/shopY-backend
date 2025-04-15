const router = require('express').Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');
const saltRounds = parseInt(process.env.SALT_ROUNDS);
const jwt = require('jsonwebtoken');

// Register 
router.post("/register", async (req, res) => {
    try {
        const { username, email, password, confirmPassword, phone, address } = req.body;

        
        if (password !== confirmPassword) {
            return res.status(400).json({ error: "Passwords do not match" });
        }


        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            phone,
            address,
        });

        const user = await newUser.save();
        res.status(201).json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    }
});


// Login
router.post("/login", async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) return res.status(404).json("User not found");

        const isPasswordValid = await bcrypt.compare(req.body.password, user.password);
        if (!isPasswordValid) return res.status(400).json("Wrong password");

        const accessToken = jwt.sign(
            {
                id: user._id,
                username: user.username
            },
            process.env.JWT_SECRET,
            { expiresIn: "3d" }
        );

        const { password, ...otherDetails } = user._doc;

        res.status(200).json({ ...otherDetails, accessToken });
    } catch (err) {
        console.error("Error during login:", err);
        res.status(500).json(err);
    }
});

module.exports = router;