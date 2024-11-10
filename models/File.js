// models/File.js
const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: true,
    },
    url: {
        type: String,
        required: true,
    },
    extractedText: {
        type: String,
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User ', // Reference to the User model
        required: false,
    },
}, {
    timestamps: true, // Automatically manage createdAt and updatedAt timestamps
});

const File = mongoose.model('File', fileSchema);
module.exports = File;