require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const pdf = require('pdf-parse');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Serve static files from the React app
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

// Rate limiting: 10 requests per user per minute
const limiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 10,
  message: { error: 'Please wait before submitting again.' }
});
app.use('/api/', limiter);

// Gemini Setup
const apiKey = process.env.GEMINI_API_KEY;
console.log('API Key loaded:', apiKey ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}` : 'MISSING');
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Multer storage
const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.txt', '.png', '.jpg', '.jpeg', '.wav', '.mp3', '.m4a', '.webm'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('File type not supported.'));
    }
  }
});

const SYSTEM_PROMPT = `You are an expert disaster response coordinator. Analyze the emergency situation described and return ONLY a valid JSON object with no markdown or backticks. Structure: { severity: "CRITICAL" | "HIGH" | "MEDIUM", summary: string (2-3 sentences), steps: [{ action: string, priority: "critical" | "high" | "medium" }] (4-6 steps), agencies: string[] (3-5 agencies) }`;

// Route: Analyze Emergency
app.post('/api/analyze', upload.single('file'), async (req, res) => {
  try {
    const { type, text, lat, lng } = req.body;
    let contextInput = "";

    // 1. Prepare Content based on Type
    if (type === 'text') {
      contextInput = text;
    } else if (type === 'location') {
      contextInput = `Emergency reported at coordinates [lat: ${lat}, lng: ${lng}]. Please reverse geocode this mentally and assess the situation if possible, or provide generic high-quality advice for the area. Description: ${text || 'No additional description'}`;
    } else if (type === 'file' && req.file) {
      if (req.file.mimetype === 'application/pdf') {
        const data = await pdf(req.file.buffer);
        contextInput = data.text.substring(0, 10000);
      } else {
        contextInput = req.file.buffer.toString('utf8').substring(0, 10000);
      }
    } else if (type === 'image' && req.file) {
      // Vision processing
      const imagePart = {
        inlineData: {
          data: req.file.buffer.toString('base64'),
          mimeType: req.file.mimetype
        }
      };
      const result = await model.generateContent([SYSTEM_PROMPT, imagePart]);
      const response = await result.response;
      return res.json(parseGeminiResponse(response.text()));
    } else if (type === 'voice' && req.file) {
      // Audio processing (multimodal)
      const audioPart = {
        inlineData: {
          data: req.file.buffer.toString('base64'),
          mimeType: req.file.mimetype
        }
      };
      const result = await model.generateContent([SYSTEM_PROMPT, "Transcribe and analyze this emergency audio: ", audioPart]);
      const response = await result.response;
      return res.json(parseGeminiResponse(response.text()));
    }

    if (!contextInput && type !== 'image' && type !== 'voice') {
      return res.status(400).json({ error: 'No input provided' });
    }

    // Standard text analysis (for text, location, file text)
    const result = await model.generateContent(`${SYSTEM_PROMPT}\n\nSituation: ${contextInput}`);
    const response = await result.response;
    res.json(parseGeminiResponse(response.text()));

  } catch (error) {
    console.error('Error analyzing:', error.message);
    if (error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      return res.status(429).json({ error: 'Gemini API quota exceeded. Please wait a moment and try again.' });
    }
    if (error.message?.includes('API key')) {
      return res.status(401).json({ error: 'Invalid API key. Please update GEMINI_API_KEY in server/.env' });
    }
    res.status(500).json({ error: 'Failed to process request. ' + error.message });
  }
});

function parseGeminiResponse(text) {
  try {
    // Remove markdown backticks if present
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Parse Error:", text);
    return {
      severity: "MEDIUM",
      summary: "I'm sorry, I couldn't process the situation correctly. Please contact emergency services directly.",
      steps: [{ action: "Call 911/Emergency line immediately", priority: "critical" }],
      agencies: ["Emergency Services"]
    };
  }
}


// The catch-all handler: for any request that doesn't 
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../client/dist/index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
