import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import Presentation from './models/Presentation.js';
import audioRoutes from './routes/audio.js';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create temp directories if they don't exist
const tempDir = join(__dirname, 'temp');
const audioDir = join(tempDir, 'audio');
fs.mkdirSync(tempDir, { recursive: true });
fs.mkdirSync(audioDir, { recursive: true });

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.pptx');
  }
});

const upload = multer({ storage });

// Middleware
app.use(cors());
app.use(express.json());
app.use('/temp/audio', express.static(join(__dirname, 'temp/audio')));
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB with proper options
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('Connected to MongoDB Atlas');
  console.log('Database:', new URL(process.env.MONGODB_URI).pathname.substr(1));
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Handle MongoDB connection events
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected');
});

// Configure routes
app.use('/api/audio', audioRoutes);

// Routes
app.post('/api/audio/process', upload.single('file'), async (req, res) => {
  try {
    const { file } = req;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Create a new presentation record
    const presentation = new Presentation({
      title: 'Processing...',
      originalFileName: file.originalname,
      totalSlides: 0,
      mode: req.body.mode || 'overview',
      processingStatus: 'processing'
    });

    await presentation.save();

    // Start processing in background
    processPresentation(presentation._id, file.path)
      .catch(err => console.error('Processing error:', err));

    res.json({
      id: presentation._id,
      status: 'processing'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to process file' });
  }
});

app.get('/api/audio/status/:id', async (req, res) => {
  try {
    const presentation = await Presentation.findById(req.params.id);
    if (!presentation) {
      return res.status(404).json({ error: 'Presentation not found' });
    }
    res.json({
      status: presentation.processingStatus,
      progress: presentation.processingProgress,
      error: presentation.error
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check status' });
  }
});

app.get('/api/audio/content/:id', async (req, res) => {
  try {
    const presentation = await Presentation.findById(req.params.id);
    if (!presentation) {
      return res.status(404).json({ error: 'Presentation not found' });
    }
    res.json({
      title: presentation.title,
      content: presentation.content,
      audioData: presentation.audioData,
      hasAudio: presentation.hasAudio
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

// Update the Perplexity API request format
app.post('/api/audio/generate-notes', async (req, res) => {
  try {
    const { content, title } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    console.log(`Generating notes for presentation: ${title || 'Untitled'}`);
    console.log(`Content length: ${content.length} characters`);
    
    // Check if Perplexity API is available
    if (!process.env.PERPLEXITY_API_KEY) {
      return res.status(500).json({ error: 'Perplexity API key is not configured' });
    }
    
    // Use Perplexity AI to generate concise bullet point notes
    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at extracting key information from presentations and creating concise, valuable bullet point notes. Focus on the most important concepts, facts, and takeaways. The content provided is a transcript of a discussion or presentation. Your task is to understand the topic being discussed and provide short, crisp notes about the TOPIC itself, not just summarizing the transcript. DO NOT use any markdown formatting like asterisks or brackets in your response. Keep your bullet points clean and simple.'
          },
          {
            role: 'user',
            content: `The content below is a transcript from a presentation or discussion. Understand the content and provide me with 5-7 short, crisp bullet point notes about the TOPIC they are referring to or talking about, NOT just a summary of the transcript itself. Focus on the key concepts, insights, and takeaways about the subject matter. DO NOT use any markdown formatting like asterisks or brackets in your response.\n\nTitle: ${title || 'Presentation'}\n\nContent: ${content}`
          }
        ],
        temperature: 0.2
      })
    });
    
    if (!perplexityResponse.ok) {
      const errorData = await perplexityResponse.json();
      console.error('Perplexity API error:', errorData);
      throw new Error(`Perplexity API error: ${perplexityResponse.status}`);
    }
    
    const perplexityData = await perplexityResponse.json();
    console.log('Perplexity response received');
    
    // Extract the bullet points from the response
    try {
      const responseContent = perplexityData.choices[0].message.content;
      console.log('Raw response content:', responseContent);
      
      // Extract bullet points from the text response
      const bulletPoints = responseContent
        .split(/\n+/)
        .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•') || line.trim().match(/^\d+\./))
        .map(line => {
          // Remove markdown formatting (asterisks, brackets, etc.)
          return line.trim()
            .replace(/^[-•\d+.]\s+/, '') // Remove bullet point markers
            .replace(/\*\*/g, '') // Remove bold formatting
            .replace(/\*/g, '') // Remove italic formatting
            .replace(/\[(\d+)\](?:\[\d+\])*/g, '') // Remove citation references like [1][5]
            .trim();
        })
        .filter(line => line.length > 0);
      
      // If no bullet points were found, try to split by newlines
      if (bulletPoints.length === 0) {
        const lines = responseContent
          .split(/\n+/)
          .filter(line => line.trim().length > 0)
          .map(line => {
            // Remove markdown formatting
            return line.trim()
              .replace(/\*\*/g, '') // Remove bold formatting
              .replace(/\*/g, '') // Remove italic formatting
              .replace(/\[(\d+)\](?:\[\d+\])*/g, '') // Remove citation references
              .trim();
          })
          .slice(0, 7); // Limit to 7 lines
        
        return res.json({ notes: lines });
      }
      
      return res.json({ notes: bulletPoints });
    } catch (parseError) {
      console.error('Error parsing Perplexity response:', parseError);
      
      // If parsing fails, extract lines from the raw text
      const rawContent = perplexityData.choices[0].message.content;
      console.log('Falling back to raw text extraction');
      const bulletPoints = rawContent
        .split(/\n+/)
        .filter(line => line.trim().length > 0)
        .map(line => {
          // Remove markdown formatting
          return line.replace(/^[•\-*]\s+/, '') // Remove bullet markers
            .replace(/\*\*/g, '') // Remove bold formatting
            .replace(/\*/g, '') // Remove italic formatting
            .replace(/\[(\d+)\](?:\[\d+\])*/g, '') // Remove citation references
            .trim();
        })
        .filter(line => line.length > 0)
        .slice(0, 7); // Limit to 7 points
      
      return res.json({ notes: bulletPoints });
    }
  } catch (error) {
    console.error('Error generating notes:', error);
    res.status(500).json({ 
      error: 'Failed to generate notes',
      // Return empty notes array to ensure frontend has something to display
      notes: [
        "Failed to generate AI notes from the transcript",
        "Please try regenerating notes or check the server logs"
      ]
    });
  }
});

// Add a new endpoint for generating AI-powered summaries
app.post('/api/audio/generate-summary', async (req, res) => {
  try {
    const { content, title } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    console.log(`Generating summary for presentation: ${title || 'Untitled'}`);
    console.log(`Content length: ${content.length} characters`);
    
    // Check if Perplexity API is available
    if (!process.env.PERPLEXITY_API_KEY) {
      return res.status(500).json({ error: 'Perplexity API key is not configured' });
    }
    
    // Use Perplexity AI to generate a concise summary
    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at summarizing presentations and discussions. Your task is to create a concise, coherent summary of the content provided. Focus on the main topic, key points, and conclusions. The summary should be 1-2 very short paragraphs long, written in a clear, professional style. Be extremely concise and to the point. Do not use bullet points or any special formatting. Keep sentences short and direct.'
          },
          {
            role: 'user',
            content: `The content below is a transcript from a presentation or discussion. Create an extremely concise, coherent summary that captures the essence of the topic and main points discussed. The summary should be 1-2 very short paragraphs long, written in a clear, professional style. Be very brief and to the point. Use short sentences. Do not use bullet points or any special formatting.\n\nTitle: ${title || 'Presentation'}\n\nContent: ${content}`
          }
        ],
        temperature: 0.1
      })
    });
    
    if (!perplexityResponse.ok) {
      const errorData = await perplexityResponse.json();
      console.error('Perplexity API error:', errorData);
      throw new Error(`Perplexity API error: ${perplexityResponse.status}`);
    }
    
    const perplexityData = await perplexityResponse.json();
    console.log('Perplexity summary response received');
    
    // Extract the summary from the response
    try {
      const responseContent = perplexityData.choices[0].message.content;
      console.log('Raw summary response content:', responseContent);
      
      // Clean up the response content
      const summary = responseContent
        .replace(/\*\*/g, '') // Remove bold formatting
        .replace(/\*/g, '') // Remove italic formatting
        .replace(/\[(\d+)\](?:\[\d+\])*/g, '') // Remove citation references
        .trim();
      
      return res.json({ summary });
    } catch (parseError) {
      console.error('Error parsing Perplexity summary response:', parseError);
      
      // If parsing fails, return the raw content
      const rawContent = perplexityData.choices[0].message.content;
      return res.json({ summary: rawContent });
    }
  } catch (error) {
    console.error('Error generating summary:', error);
    res.status(500).json({ 
      error: 'Failed to generate summary',
      summary: "We couldn't generate an AI-powered summary at this time. Please try again later or check the server logs for more information."
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log('Environment:', process.env.NODE_ENV);
  console.log('MongoDB URI:', process.env.MONGODB_URI?.substring(0, 20) + '...');
  console.log('OpenAI API Key:', process.env.OPENAI_API_KEY ? 'Configured' : 'Missing');
  console.log('Perplexity API Key:', process.env.PERPLEXITY_API_KEY ? 'Configured' : 'Missing');
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
