const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User'); // Adjust the path accordingly
const router = express.Router();
const jwt = require('jsonwebtoken');

router.post("/register",async(req,res)=>{
    try{
        const {username,email,password}=req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required.' });
        }
        const existingUser  = await User.findOne({ email });
        if (existingUser ) {
            return res.status(400).json({ message: 'User  already exists with this email.' });
        }
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        const newUser  = new User({
            username,
            email,
            passwordHash,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        await newUser .save();
        const token = jwt.sign({ email: newUser.email }, '123', { expiresIn: '1h' });
        res.status(201).json({ message: 'User  registered successfully.', token });




    }catch(err){
        console.error(err);
        res.status(500).json({ message: 'Error registering user.' });
    }
})
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Compare the provided password with the stored password hash
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Generate a JWT token
        const token = jwt.sign({ email: user.email }, '123', { expiresIn: '1h' });
        return res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
            },
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});


module.exports = router;
