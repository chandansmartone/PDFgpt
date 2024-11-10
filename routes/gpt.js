const express = require('express');
const OpenAI = require("openai");
const User = require('../models/User'); // Import the User model
const authenticateJWT = require("../middlewares/authenticateJWT");
const mongoose = require('mongoose');
const router = express.Router();
require("dotenv").config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Function to handle OpenAI API call
const getOpenAIResponse = async (messages) => {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o", // or your chosen model
            messages: messages,
        });
        return completion.choices[0].message.content;
    } catch (error) {
        throw new Error('Failed to fetch response from OpenAI API: ' + error.message);
    }
};

// Message route to handle user prompts and responses from OpenAI
router.post('/message', authenticateJWT, async (req, res) => {
    const { fileId, userPrompt } = req.body;

    // Validate input
    if (!fileId || !userPrompt) {
        return res.status(400).send('fileId and userPrompt are required.');
    }

    try {
        // Fetch the user
        const user = await User.findOne({ email: req.user.email }).exec();
        if (!user) {
            return res.status(404).send('User not found.');

        }
     
        

        const file = user.files.find(file => file.fileId === fileId);
        if (!file) {
            return res.status(404).send('File not found.');
        }

        // Construct the prompt for OpenAI API request
        const messages = [
            { role: "system", content: `You are a helpful assistant. Here is the extracted text from the file(pdf,image,docs): "${file.extractedText}"` },
            ...file.chatHistory.map(msg => ({ role: msg.sender, content: msg.content })),
            { role: "user", content: userPrompt }
        ];

        // Get the response from OpenAI
        const gptResponse = await getOpenAIResponse(messages);

        // Update chat history
        file.chatHistory.push({
            messageId: new mongoose.Types.ObjectId().toString(),
            content: userPrompt,
            sender: 'user'
        });
        file.chatHistory.push({
            messageId: new mongoose.Types.ObjectId().toString(),
            content: gptResponse,
            sender: 'assistant'
        });

        // Save the updated user model with new chat history
        await user.save();

        // Respond to the client with the GPT response
        res.status(200).json({ response: gptResponse });
    } catch (error) {
        console.error('Error in message route:', error);
        res.status(500).send(error.message);
    }
});

module.exports = router;
