const mongoose = require('mongoose');

// Sender types as constants
const SENDER_TYPES = {
    USER: 'user',
    ASSISTANT: 'assistant'
};

// Define the schema for chat messages associated with each file
const chatMessageSchema = new mongoose.Schema({
    messageId: { type: mongoose.Schema.Types.ObjectId, required: true, default: () => new mongoose.Types.ObjectId() }, // Unique identifier for the message
    content: { type: String, required: true }, // The message content
    sentAt: { type: Date, default: Date.now }, // Timestamp for when the message was sent
    sender: { type: String, enum: Object.values(SENDER_TYPES), required: true } // Who sent the message
}, { _id: false }); // Prevent Mongoose from creating an additional _id for subdocuments

// Define the schema for files uploaded by the user
const fileSchema = new mongoose.Schema({
    fileId: { type: String, required: true, unique: true,index: true  }, // Unique identifier for the file in GCS
    fileName: { type: String, required: true }, // Original name of the file
    fileUrl: { type: String, required: true },
    extractedText: { type: String, required: false }, // Public URL or GCS path
    uploadedAt: { type: Date, default: Date.now }, // Timestamp for when the file was uploaded
    chatHistory: [chatMessageSchema] // Array of chat messages related to this file
}, { timestamps: true }); // Automatically manage createdAt and updatedAt timestamps

// Define the main User schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, minlength: 3 }, // User's username
    email: { type: String, required: true, unique: true,index: true }, // User's email
    passwordHash: { type: String, required: true }, // Hashed password
    files: [fileSchema] // Array of files uploaded by the user
}, { timestamps: true }); // Automatically manage createdAt and updatedAt timestamps

// Create the User model
const User = mongoose.model('User', userSchema);

// Export the User model
module.exports = User;
