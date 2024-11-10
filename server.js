// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const OpenAI = require("openai");

const upload = require('./routes/upload')
const gpt=require('./routes/gpt')
const bodyParser = require("body-parser");
const Auth=require('./routes/Auth');
const authMiddleWare=require('./middlewares/authenticateJWT')

dotenv.config();

const app = express();
const allowedOrigins = ['http://localhost:3000','http://localhost:5173','http://localhost:5174' ,process.env.frondend_url];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify the allowed HTTP methods
  credentials: true, // Allow credentials to be sent in requests
}));

app.use(express.json())
app.use(bodyParser.json());
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });


// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Define your routes here
app.use('/api', upload);
app.use('/gpt',gpt)
app.use('/auth',Auth)

app.post('/api/gpt4', async (req, res) => {
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'Text input is required' });
    }

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                 { role: "system", content: `You are frontend developer, excell in designing , css, javascript and react` },
                { role: "user", content: text }],
        });

        const gptResponse = response.choices[0].message.content;
        res.json({ response: gptResponse });
    } catch (error) {
        console.error("Error calling GPT-4 API:", error);
        res.status(500).json({ error: "Failed to get response from GPT-4" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

