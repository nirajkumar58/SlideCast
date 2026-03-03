import express from 'express';
import multer from 'multer';
import { PPTConverter } from '../utils/pptConverter.js';
import { ContentExtractor } from '../utils/contentExtractor.js';
import { generateDualNarratorScript, generateAudioForScript, voicePresets } from '../utils/audioProcessor.js';
import Presentation from '../models/Presentation.js';
import OpenAI from 'openai';
import axios from 'axios';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Configure OpenAI with custom endpoint
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.BASE_URL,
});

// Configure Perplexity API
const perplexityConfig = {
  headers: {
    'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY || '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'}`,
    'Content-Type': 'application/json'
  }
};

// API status tracking
const apiStatus = {
  openai: {
    available: false,
    lastChecked: null,
    error: null
  },
  perplexity: {
    available: false,
    lastChecked: null,
    error: null
  }
};

// Health check for OpenAI API
async function checkOpenAIHealth() {
  try {
    console.log('Testing OpenAI API connection...');
    const response = await openai.chat.completions.create({
      model: process.env.MODEL || "provider-3/gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: "Hello, this is a test message. Please respond with 'OK' if you receive this."
        }
      ],
      max_tokens: 10
    });
    
    apiStatus.openai.available = true;
    apiStatus.openai.lastChecked = new Date();
    apiStatus.openai.error = null;
    console.log('✅ OpenAI API is working properly');
    return true;
  } catch (error) {
    apiStatus.openai.available = false;
    apiStatus.openai.lastChecked = new Date();
    apiStatus.openai.error = error.message;
    console.error('❌ OpenAI API check failed:', error.message);
    return false;
  }
}

// Health check for Perplexity API
async function checkPerplexityHealth() {
  try {
    const apiKey = process.env.PERPLEXITY_API_KEY || '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';
    
    if (!apiKey) {
      apiStatus.perplexity.available = false;
      apiStatus.perplexity.lastChecked = new Date();
      apiStatus.perplexity.error = 'API key not configured';
      console.warn('⚠️ Perplexity API key not configured');
      return false;
    }
    
    console.log('Testing Perplexity API connection...');
    const response = await axios.post(
      'https://api.perplexity.ai/chat/completions',
      {
        model: 'sonar',
        messages: [
          {
            role: "user",
            content: "Hello, this is a test message. Please respond with 'OK' if you receive this."
          }
        ],
        max_tokens: 10
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    apiStatus.perplexity.available = true;
    apiStatus.perplexity.lastChecked = new Date();
    apiStatus.perplexity.error = null;
    console.log('✅ Perplexity API is working properly');
    return true;
  } catch (error) {
    apiStatus.perplexity.available = false;
    apiStatus.perplexity.lastChecked = new Date();
    apiStatus.perplexity.error = error.message;
    console.error('❌ Perplexity API check failed:', error.message);
    return false;
  }
}

// Run API health checks on server start
(async function runInitialHealthChecks() {
  console.log('Running initial API health checks...');
  // Check Perplexity first (our default API)
  await checkPerplexityHealth();
  // Then check OpenAI (our fallback API)
  await checkOpenAIHealth();
  
  // Schedule periodic health checks (every 30 minutes)
  setInterval(async () => {
    console.log('Running scheduled API health checks...');
    await checkPerplexityHealth();
    await checkOpenAIHealth();
  }, 30 * 60 * 1000);
})();

// API status endpoint
router.get('/api-status', (req, res) => {
  res.json({
    openai: apiStatus.openai,
    perplexity: apiStatus.perplexity,
    timestamp: new Date()
  });
});

router.post('/process', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Create initial presentation record
    const presentation = new Presentation({
      mode: 'dual',
      title: 'Processing...',
      totalSlides: 1,
      content: '',
      originalFileName: req.file.originalname,
      processingStatus: 'processing',
      processingProgress: 0,
      error: null,
      errorDetails: null
    });

    await presentation.save();
    console.log('Created initial presentation record:', presentation._id);

    // Start processing in background
    processPresentation(presentation._id, req.file.buffer);

    // Return immediately with presentation ID
    res.json({
      id: presentation._id,
      status: 'processing',
      message: 'Processing started'
    });

  } catch (error) {
    console.error('Processing error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Background processing function
async function processPresentation(presentationId, fileBuffer) {
  let currentProgress = 0;
  
  const updateProgress = async (progress, status = 'processing') => {
    currentProgress = progress;
    await Presentation.findByIdAndUpdate(presentationId, {
      processingProgress: progress,
      processingStatus: status
    });
    console.log(`Progress updated: ${progress}%`);
  };

  try {
    console.log('Starting presentation processing:', { presentationId });
    await updateProgress(5);

    // Convert PPT to PDF
    console.log('Converting PPT to PDF...');
    const pdfBuffer = await PPTConverter.convertToPDF(fileBuffer);
    await updateProgress(20);

    // Extract content from PDF
    console.log('Extracting content from PDF...');
    const extractedContent = await ContentExtractor.extractFromPDF(pdfBuffer);
    console.log('Content extracted successfully:', { 
      title: extractedContent.metadata.title,
      totalSlides: extractedContent.metadata.totalSlides
    });
    
    await updateProgress(40);
    
    // Update presentation details
    await Presentation.findByIdAndUpdate(presentationId, {
      title: extractedContent.metadata.title,
      totalSlides: extractedContent.metadata.totalSlides,
      content: extractedContent.slides.map(slide => slide.content).join('\n\n'),
      slides: extractedContent.slides
    });

    // Generate enhanced narrative script
    console.log('Generating enhanced narrative script...');
    const script = await generateEnhancedScript(extractedContent);
    console.log('Enhanced script generated successfully');
    
    await updateProgress(60);
    
    // Format the script properly for audio generation
    // Ensure each line starts with either "Narrator:" or "Expert:"
    const formattedScript = script
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        // If line already has a proper prefix, keep it as is
        if (line.match(/^(Narrator|Expert):/i)) {
          return line;
        }
        // Otherwise, add "Narrator:" prefix
        return `Narrator: ${line}`;
      })
      .join('\n');
    
    console.log('Formatted script sample:', formattedScript.substring(0, 200) + '...');
    
    console.log('Generating audio from script...');
    // Generate audio from the script
    let audioSegments = [];
    try {
      audioSegments = await generateAudioForScript(formattedScript);
      
      if (!audioSegments || audioSegments.length === 0) {
        console.error('No valid audio segments were generated');
        // We'll continue with the script but mark that audio generation failed
      } else {
        console.log(`Generated ${audioSegments.length} audio segments`);
      }
    } catch (error) {
      console.error('Audio generation failed:', error.message);
      // We'll continue with the script but mark that audio generation failed
    }
    
    // Create transcript from the script even if audio generation failed
    const transcript = script.split('\n')
      .filter(line => line.trim())
      .map(line => {
        const match = line.match(/^(Narrator|Expert):\s*(.*)/i);
        if (match) {
          return {
            role: match[1],
            text: match[2].trim()
          };
        }
        return {
          role: 'Narrator',
          text: line.trim()
        };
      });
    
    // Update the presentation with whatever we have
    const updateData = {
      audioScript: script,
      audioTranscript: transcript,
      processingStatus: 'completed',
      processingProgress: 100
    };
    
    // Only add audio data if we successfully generated audio
    if (audioSegments && audioSegments.length > 0) {
      try {
        // Combine all audio segments into a single buffer
        const combinedAudio = await combineAudioFiles(audioSegments);
        updateData.audioBuffer = combinedAudio;
        updateData.hasAudio = true;
        updateData.audioMode = 'dual';
        console.log('Successfully combined audio segments');
      } catch (combineError) {
        console.error('Error combining audio segments:', combineError);
        updateData.hasAudio = false;
        updateData.error = 'Audio combination failed, but transcript is available';
      }
    } else {
      updateData.hasAudio = false;
      updateData.error = 'Audio generation failed, but transcript is available';
    }

    // Save the data to the presentation
    await Presentation.findByIdAndUpdate(presentationId, updateData);
    
    console.log('Processing completed successfully');
  } catch (error) {
    console.error('Background processing error:', error);
    console.error('Error stack:', error.stack);
    
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code || 'UNKNOWN'
    };
    
    await Presentation.findByIdAndUpdate(presentationId, {
      processingStatus: 'failed',
      processingProgress: currentProgress,
      error: error.message,
      errorDetails: JSON.stringify(errorDetails)
    });
  }
}

// Get processing status
router.get('/status/:id', async (req, res) => {
  try {
    const presentation = await Presentation.findById(req.params.id);
    
    if (!presentation) {
      return res.status(404).json({ error: 'Presentation not found' });
    }

    res.json({
      id: presentation._id,
      status: presentation.processingStatus,
      progress: presentation.processingProgress,
      error: presentation.error
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get generated content
router.get('/content/:id', async (req, res) => {
  try {
    const presentation = await Presentation.findById(req.params.id);
    
    if (!presentation) {
      return res.status(404).json({ error: 'Presentation not found' });
    }

    if (presentation.processingStatus !== 'completed') {
      return res.status(400).json({
        error: 'Content not ready',
        status: presentation.processingStatus,
        progress: presentation.processingProgress
      });
    }

    // Check if we have the combined audio buffer
    let audioBase64 = null;
    if (presentation.audioBuffer) {
      audioBase64 = presentation.audioBuffer.toString('base64');
    } 
    // If not, try to use the legacy audioData format
    else if (presentation.audioData && presentation.audioData.length > 0) {
      // Map audio data to include the actual audio buffers
      const audioData = presentation.audioData.map(data => ({
        role: data.role,
        audio: data.audio.toString('base64'), // Convert buffer to base64
        audioUrl: `/api/audio/stream/${presentation._id}/${data.role}`
      }));
      
      // For backward compatibility
      res.json({
        id: presentation._id,
        title: presentation.title,
        mode: presentation.mode,
        totalSlides: presentation.totalSlides,
        content: presentation.content,
        slides: presentation.slides,
        hasAudio: presentation.hasAudio || false,
        audioMode: presentation.audioMode,
        audioScript: presentation.audioScript,
        audioData: audioData // Include the audio data with base64 encoded buffers
      });
      return;
    }

    // Return the combined audio data with transcript
    res.json({
      id: presentation._id,
      title: presentation.title,
      audioData: audioBase64,
      mimeType: 'audio/mpeg',
      hasAudio: presentation.hasAudio || false,
      audioMode: presentation.audioMode,
      audioScript: presentation.audioScript,
      audioTranscript: presentation.audioTranscript || [],
      duration: presentation.audioDuration || 0,
      createdAt: presentation.audioProcessedAt || presentation.updatedAt
    });

  } catch (error) {
    console.error('Content retrieval error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Submit feedback
// Get audio content
router.get('/audio/:id', async (req, res) => {
  try {
    const presentation = await Presentation.findById(req.params.id);
    
    if (!presentation) {
      return res.status(404).json({ error: 'Presentation not found' });
    }

    if (!presentation.hasAudio) {
      return res.status(404).json({ error: 'No audio available for this presentation' });
    }

    if (presentation.processingStatus !== 'completed') {
      return res.status(400).json({
        error: 'Audio not ready',
        status: presentation.processingStatus,
        progress: presentation.processingProgress
      });
    }

    // Return audio information
    res.json({
      id: presentation._id,
      title: presentation.title,
      audioMode: presentation.audioMode,
      audioScript: presentation.audioScript,
      audioData: presentation.audioData?.map(data => ({
        role: data.role,
        audioUrl: `/api/audio/stream/${presentation._id}/${data.role}`
      })) || []
    });

  } catch (error) {
    console.error('Audio retrieval error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stream audio content
router.get('/stream/:id/:role', async (req, res) => {
  try {
    const presentation = await Presentation.findById(req.params.id);
    const { role } = req.params;
    
    if (!presentation) {
      return res.status(404).json({ error: 'Presentation not found' });
    }

    if (!presentation.audioData) {
      return res.status(404).json({ error: 'No audio data available' });
    }

    const audioData = presentation.audioData.find(data => data.role === role);
    
    if (!audioData) {
      return res.status(404).json({ error: `No audio for role: ${role}` });
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(audioData.audio);

  } catch (error) {
    console.error('Audio streaming error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/feedback', async (req, res) => {
  try {
    const { presentationId, rating, comment } = req.body;
    
    if (!presentationId || !rating) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const presentation = await Presentation.findById(presentationId);
    
    if (!presentation) {
      return res.status(404).json({ error: 'Presentation not found' });
    }

    presentation.feedback.push({
      rating,
      comment,
      createdAt: new Date()
    });

    await presentation.save();
    
    res.json({ message: 'Feedback received' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function generateEnhancedScript(extractedContent) {
  try {
    const prompt = `Create a dual-narration script for an educational presentation. The script should feature a Narrator who introduces concepts and an Expert who provides deeper insights.

Important Guidelines:
- For mathematical concepts: Include step-by-step explanations and real-world applications
- For coding: Break down the logic and explain the purpose of each component
- For scientific concepts: Connect them to everyday experiences and current research
- Include relevant statistics, facts, and figures to support explanations
- Add engaging analogies to make complex topics more accessible
- Format: Each line must start with "Narrator: " or "Expert: " (no asterisks or other formatting)
- Keep each speaker's part concise and focused
- Ensure natural dialogue flow between speakers

Presentation Title: ${extractedContent.metadata.title}
Total Slides: ${extractedContent.metadata.totalSlides}

Content:
${extractedContent.slides.map(slide => `Slide ${slide.slideNumber}:
${slide.content}`).join('\n\n')}`;

    // Check API status and choose the best available API
    let script = null;
    
    // Try Perplexity first as the default option
    if (apiStatus.perplexity.available) {
      console.log('Generating script with Perplexity API (default)...');
      
      try {
        const apiKey = process.env.PERPLEXITY_API_KEY || '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';
        
        const perplexityResponse = await axios.post(
          'https://api.perplexity.ai/chat/completions',
          {
            model: 'sonar',
            messages: [
              {
                role: "system",
                content: "You are an expert at creating engaging educational content. You excel at breaking down complex topics and making them accessible while maintaining technical accuracy. Create natural dialogue between a Narrator and an Expert."
              },
              {
                role: "user",
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 4000
          },
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        script = perplexityResponse.data.choices[0].message.content;
        
        // Ensure proper formatting
        script = script.replace(/\*\*Narrator:\*\*/g, 'Narrator:')
                      .replace(/\*\*Expert:\*\*/g, 'Expert:')
                      .replace(/\*\*Narrator\*\*:/g, 'Narrator:')
                      .replace(/\*\*Expert\*\*:/g, 'Expert:');
        
        console.log('Script generated successfully with Perplexity API');
        return script;
      } catch (perplexityError) {
        console.error('Perplexity API error:', perplexityError);
        // Update API status
        apiStatus.perplexity.available = false;
        apiStatus.perplexity.error = perplexityError.message;
        apiStatus.perplexity.lastChecked = new Date();
        // Continue to try OpenAI as fallback
      }
    } else {
      console.log('Perplexity API is not available, trying fallback...');
    }
    
    // Try OpenAI as fallback if Perplexity failed or is unavailable
    if (apiStatus.openai.available) {
      console.log('Generating script with OpenAI API (fallback)...');
      
      try {
        const openAIResponse = await openai.chat.completions.create({
          model: process.env.MODEL || "provider-3/gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are an expert at creating engaging educational content. You excel at breaking down complex topics and making them accessible while maintaining technical accuracy. Create natural dialogue between a Narrator and an Expert."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 4000
        });

        script = openAIResponse.choices[0].message.content;
        
        // Ensure proper formatting
        script = script.replace(/\*\*Narrator:\*\*/g, 'Narrator:')
                      .replace(/\*\*Expert:\*\*/g, 'Expert:')
                      .replace(/\*\*Narrator\*\*:/g, 'Narrator:')
                      .replace(/\*\*Expert\*\*:/g, 'Expert:');

        console.log('Script generated successfully with OpenAI (fallback)');
        return script;
      } catch (openaiError) {
        console.error('OpenAI API error:', openaiError);
        // Update API status
        apiStatus.openai.available = false;
        apiStatus.openai.error = openaiError.message;
        apiStatus.openai.lastChecked = new Date();
        // Continue to fallback
      }
    } else {
      console.log('OpenAI API is not available, using basic fallback...');
    }
    
    // If both APIs failed or are unavailable, use the fallback
    console.log('Both APIs unavailable, using fallback script generation');
    
    // Generate a basic script from the slide content
    let fallbackScript = '';
    
    extractedContent.slides.forEach(slide => {
      fallbackScript += `Narrator: Let's look at slide ${slide.slideNumber}: ${slide.title || 'Untitled Slide'}.\n\n`;
      
      // Split content into bullet points if possible
      const bulletPoints = slide.content.split(/•|\*/).filter(point => point.trim());
      
      if (bulletPoints.length > 1) {
        fallbackScript += `Narrator: This slide covers the following points:\n\n`;
        
        bulletPoints.forEach((point, index) => {
          const speaker = index % 2 === 0 ? 'Narrator' : 'Expert';
          fallbackScript += `${speaker}: ${point.trim()}\n\n`;
        });
      } else {
        // If no bullet points, just use the content directly
        fallbackScript += `Narrator: ${slide.content}\n\n`;
        fallbackScript += `Expert: This is an important concept to understand because it forms the foundation for the rest of the presentation.\n\n`;
      }
    });
    
    console.log('Fallback script generated successfully');
    return fallbackScript;

  } catch (error) {
    console.error('Script generation error:', error);
    if (error.response) {
      console.error('API Response Error:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    }
    throw new Error(`Failed to generate script: ${error.message}`);
  }
}

// Get audio content for a presentation
async function getAudioContent(req, res) {
  try {
    const { id } = req.params;
    const presentation = await Presentation.findById(id);
    
    if (!presentation) {
      return res.status(404).json({ error: 'Presentation not found' });
    }
    
    if (!presentation.audioProcessed || !presentation.audioBuffer) {
      return res.status(404).json({ error: 'Audio not available for this presentation' });
    }
    
    // Convert the audio buffer to base64
    const audioBase64 = presentation.audioBuffer.toString('base64');
    
    // Return the audio data as base64 with metadata
    return res.json({
      id: presentation._id,
      title: presentation.title,
      audioData: audioBase64,
      mimeType: 'audio/mpeg',
      duration: presentation.audioDuration || 0,
      createdAt: presentation.audioProcessedAt
    });
  } catch (error) {
    console.error('Error getting audio content:', error);
    return res.status(500).json({ error: 'Failed to get audio content' });
  }
}

export default router;
