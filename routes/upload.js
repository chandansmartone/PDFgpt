// routes/upload.js
const express = require('express');
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const { parsePDF, parseDOCX, parseImage, parseJS,parseCSS,parseXLSX,parseTXT } = require('../utils/fileParser'); // Add parseJS function
const User = require('../models/User');
const router = express.Router();
const authenticateJWT = require("../middlewares/authenticateJWT");
const mongoose = require('mongoose');
require("dotenv").config();

const gcsKeyBase64 = process.env.GCS_KEY_BASE64;
const gcsKeyJson = Buffer.from(gcsKeyBase64, 'base64').toString('utf-8');

const gcsKey = JSON.parse(gcsKeyJson);

// Initialize Google Cloud Storage with the decoded credentials
const storage = new Storage({
    credentials: gcsKey,
});
// Configure Google Cloud Storage
const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);

// Configure Multer
const upload = multer({
    storage: multer.memoryStorage(), // Store file in memory for GCS upload
});

// File upload route
router.post('/upload', authenticateJWT, upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded.');
   
    try {
        // Upload to Google Cloud Storage
        const blob = bucket.file(req.file.originalname);
        const blobStream = blob.createWriteStream({
            resumable: false,
        });

        blobStream.on('error', (err) => {
            console.error('Error uploading to GCS:', err);
            res.status(500).send(err);
        });

        blobStream.on('finish', async () => {
            // Extract text based on file type
            let extractedText;
            if (req.file.mimetype === 'application/pdf') {
                extractedText = await parsePDF(req.file.buffer);
            } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                extractedText = await parseDOCX(req.file.buffer);
            } else if (req.file.mimetype.startsWith('image/')) {
                extractedText = await parseImage(req.file.buffer);
            } else if (req.file.mimetype === 'application/javascript') {
                extractedText = await parseJS(req.file.buffer); // Handle JavaScript files
            } else if (req.file.mimetype === 'text/css') {
                extractedText = await parseCSS(req.file.buffer); // Handle CSS files
            }else if (req.file.mimetype === 'text/plain') {
                extractedText = await parseTXT(req.file.buffer);
            }else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
                extractedText = await parseXLSX(req.file.buffer);
            } else {
                return res.status(400).send('Unsupported file type.');
            }

            const user = await User.findOne({ email: req.user.email }).exec();
            if (!user) return res.status(404).send('User not found.');

            const newFile = {
                fileId: new mongoose.Types.ObjectId().toString(),
                fileName: req.file.originalname,
                extractedText: extractedText || " ",
                fileUrl: `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${req.file.originalname}`,
            };

            if (!user.files) {
                user.files = [];
            }
            user.files.push(newFile);

            await user.save();

            res.status(200).json({ message: 'File uploaded successfully', file: newFile });
        });

        blobStream.end(req.file.buffer);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Get a specific file by fileId
router.get('/file/:fileId', authenticateJWT, async (req, res) => {
    const { fileId } = req.params;

    try {
        const user = await User.findOne({ email: req.user.email }).exec();
        if (!user) {
            return res.status(404).send('User not found.');
        }

        const file = user.files.find(file => file.fileId === fileId);
        if (!file) {
            return res.status(404).send('File not found.');
        }

        res.status(200).json({ file });
    } catch (error) {
        console.error("Error retrieving file:", error);
        res.status(500).send(error.message);
    }
});

// Get all files for a user
router.get('/files', authenticateJWT, async (req, res) => {
    try {
        const user = await User.findOne({ email: req.user.email }).exec();
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.status(200).json({ files: user.files });
    } catch (error) {
        console.error("Error retrieving files:", error);
        res.status(500).json({ message: 'Error retrieving files.' });
    }
});
// Delete a specific file by fileId
router.delete('/file/:fileId', authenticateJWT, async (req, res) => {
    const { fileId } = req.params;

    try {
        // Find the user by their email from the JWT payload
        const user = await User.findOne({ email: req.user.email });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Find the index of the file to be deleted
        const fileIndex = user.files.findIndex(file => file.fileId === fileId);
        if (fileIndex === -1) {
            return res.status(404).json({ message: 'File not found.' });
        }

        // Remove the file from the user's files array
        const [deletedFile] = user.files.splice(fileIndex, 1);
        await user.save();

        // Delete the file from Google Cloud Storage
        const file = bucket.file(deletedFile.fileName);
        await file.delete();

        res.status(200).json({ message: 'File deleted successfully', fileId });
    } catch (error) {
        console.error("Error deleting file:", error);
        res.status(500).json({ message: 'Error deleting file.', error: error.message });
    }
});



module.exports = router;
