import OpenAI from 'openai';
import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.BASE_URL
});

// Configure APIs
const perplexityConfig = {
  headers: {
    'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
    'Content-Type': 'application/json'
  }
};

const elevenLabsConfig = {
  headers: {
    'xi-api-key': process.env.ELEVEN_LABS_API_KEY,
    'Content-Type': 'application/json'
  }
};

// Google Cloud TTS configuration
const googleTTSConfig = {
  headers: {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': process.env.GOOGLE_CLOUD_API_KEY
  }
};

export const voicePresets = {
  default: {
    voice_id: 'IKne3meq5aSn9XLyUdCD', // Charlie voice
    model_id: 'eleven_multilingual_v2',
    stability: 0.5,
    similarity_boost: 0.75,
    style: 0.0,
    use_speaker_boost: true
  },
  narrator_expert: [
    { 
      role: 'narrator', 
      voice_id: 'FGY2WhTYpPnrIDTdsKH5', // Laura voice - clear and engaging
      model_id: 'eleven_multilingual_v2',
      stability: 0.7,
      similarity_boost: 0.75,
      style: 0.35,
      use_speaker_boost: true,
      // Google TTS fallback
      google_voice: {
        name: 'en-US-Neural2-F',
        languageCode: 'en-US',
        ssmlGender: 'FEMALE'
      }
    },
    { 
      role: 'expert', 
      voice_id: 'onwK4e9ZLuTAKqWW03F9', // Daniel voice - professional and authoritative
      model_id: 'eleven_multilingual_v2',
      stability: 0.8,
      similarity_boost: 0.85,
      style: 0.45,
      use_speaker_boost: true,
      // Google TTS fallback
      google_voice: {
        name: 'en-US-Neural2-D',
        languageCode: 'en-US',
        ssmlGender: 'MALE'
      }
    }
  ]
};

// Test API connections
async function testAPIs() {
  const results = {
    openai: false,
    perplexity: false
  };

  try {
    // Test OpenAI
    const openaiResponse = await openai.chat.completions.create({
      model: process.env.MODEL || "provider-3/gpt-4o-mini",
      messages: [{ role: "user", content: "Test connection" }],
      max_tokens: 5
    });
    results.openai = true;
    console.log('OpenAI API test successful');
  } catch (error) {
    console.error('OpenAI API test failed:', error.message);
  }

  try {
    // Test Perplexity
    const perplexityResponse = await axios.post('https://api.perplexity.ai/chat/completions', {
      model: 'sonar',
      messages: [{ role: "user", content: "Test connection" }],
      max_tokens: 5
    }, perplexityConfig);
    results.perplexity = true;
    console.log('Perplexity API test successful');
  } catch (error) {
    console.error('Perplexity API test failed:', error.message);
  }

  return results;
}

export async function generateDualNarratorScript(content) {
  const apis = await testAPIs();
  let script = null;

  const prompt = `Create an engaging dual-narrator script from this content. 
The script should have a Narrator who introduces topics and provides context, and an Expert who explains technical details and insights.
Format the output as a conversation between Narrator and Expert, with each line prefixed by the speaker's role.
Make it engaging and natural.

Content: ${content}`;

  try {
    if (apis.openai) {
      // Try OpenAI first
      const response = await openai.chat.completions.create({
        model: process.env.MODEL || "provider-3/gpt-4o-mini",
      messages: [
        {
          role: "system",
            content: "You are an expert at creating engaging dual-narrator scripts."
        },
        {
          role: "user",
            content: prompt
          }
        ],
        temperature: 0.7
      });
      script = response.choices[0].message.content;
    } else if (apis.perplexity) {
      // Fallback to Perplexity
      const response = await axios.post('https://api.perplexity.ai/chat/completions', {
        model: 'sonar',
        messages: [
          {
            role: "system",
            content: "You are an expert at creating engaging dual-narrator scripts."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      }, perplexityConfig);
      script = response.data.choices[0].message.content;
    } else {
      throw new Error('No working API available');
    }

    return script;
  } catch (error) {
    console.error('Script generation error:', error);
    throw error;
  }
}

export async function generateAudioForScript(text, mode = 'narrator_expert', voiceId = null) {
  try {
    // Parse the script into separate lines for each speaker
    const lines = text.split('\n').filter(line => line.trim());
    console.log(`Total script lines: ${lines.length}`);
    console.log(`First few lines: ${lines.slice(0, 3).join('\n')}`);
    
    const audioSegments = [];
    let useGoogleTTS = false;
    
    // Check if ElevenLabs API key is valid
    if (!process.env.ELEVEN_LABS_API_KEY || process.env.ELEVEN_LABS_API_KEY.trim() === '') {
      console.log('ElevenLabs API key is missing, will use Google TTS instead');
      useGoogleTTS = true;
    }
    
    // Check if Google Cloud API key is valid for fallback
    if (useGoogleTTS && (!process.env.GOOGLE_CLOUD_API_KEY || process.env.GOOGLE_CLOUD_API_KEY.trim() === '')) {
      console.error('Both ElevenLabs and Google Cloud API keys are missing');
      throw new Error('No valid TTS API keys configured');
    }

    for (const line of lines) {
      // Extract the role and text using a fixed regex pattern
      const roleMatch = line.match(/^(Narrator|Expert):\s*(.*)/i);
      if (!roleMatch) {
        console.log(`Line doesn't match pattern: "${line}"`);
        continue;
      }

      const role = roleMatch[1].toLowerCase();
      const speechText = roleMatch[2].trim(); // Remove the role prefix for speech
      
      if (!speechText || speechText.length < 2) {
        console.log(`Empty or too short speech text for ${role}: "${speechText}"`);
        continue;
      }

      console.log(`Processing ${role} line: "${speechText.substring(0, 50)}..."`);

      // Get voice settings based on role
      let voiceSettings;
      if (mode === 'narrator_expert') {
        voiceSettings = voicePresets.narrator_expert.find(v => v.role === role) || voicePresets.default;
      } else {
        voiceSettings = voiceId ? 
          { voice_id: voiceId, ...voicePresets.default } : 
          voicePresets.default;
      }

      let audioBuffer = null;
      
      // Try ElevenLabs first if we're not already using Google TTS
      if (!useGoogleTTS) {
        try {
          console.log(`Trying ElevenLabs for ${role} with voice ${voiceSettings.voice_id}`);
          audioBuffer = await generateAudioWithElevenLabs(speechText, voiceSettings);
        } catch (error) {
          console.error(`ElevenLabs error: ${error.message}`);
          
          if (error.response?.status === 401) {
            console.log('Authentication failed with ElevenLabs, switching to Google TTS for all segments');
            useGoogleTTS = true;
          }
          
          // Continue to Google TTS fallback
          audioBuffer = null;
        }
      }
      
      // Fallback to Google TTS if ElevenLabs failed or we're using Google TTS for all
      if (!audioBuffer && (useGoogleTTS || process.env.GOOGLE_CLOUD_API_KEY)) {
        try {
          console.log(`Using Google TTS for ${role}`);
          audioBuffer = await generateAudioWithGoogleTTS(speechText, voiceSettings.google_voice);
        } catch (error) {
          console.error(`Google TTS error: ${error.message}`);
          // Continue to next line if both services fail
          continue;
        }
      }
      
      if (audioBuffer) {
        audioSegments.push({
          role,
          audio: audioBuffer
        });
        console.log(`Successfully generated audio for ${role}`);
      } else {
        console.error(`Failed to generate audio for ${role} with any service`);
      }

      // Add a small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (audioSegments.length === 0) {
      console.error('No valid audio segments were generated from any lines');
      throw new Error('No valid audio segments generated');
    }

    console.log(`Successfully generated ${audioSegments.length} audio segments`);
    return audioSegments;
  } catch (error) {
    console.error('Audio generation error:', error);
    throw error;
  }
}

// Helper function to generate audio with ElevenLabs
async function generateAudioWithElevenLabs(text, voiceSettings) {
  console.log(`ElevenLabs request: ${process.env.ELEVEN_LABS_BASE_URL}/text-to-speech/${voiceSettings.voice_id}`);
  console.log(`Using model: ${process.env.ELEVEN_LABS_MODEL_ID || voiceSettings.model_id}`);
  console.log(`Text length: ${text.length} characters`);
  
  // Add SSML for more expressive speech
  const role = voiceSettings.role || 'narrator';
  let ssmlText;
  
  if (role === 'narrator') {
    // Narrator should be engaging and clear
    ssmlText = `<speak>
      <prosody rate="medium">
        ${text}
      </prosody>
    </speak>`;
  } else if (role === 'expert') {
    // Expert should sound authoritative and knowledgeable
    ssmlText = `<speak>
      <prosody rate="medium">
        <emphasis level="strong">
          ${text}
        </emphasis>
      </prosody>
    </speak>`;
  } else {
    ssmlText = text;
  }
  
  const response = await axios({
    method: 'post',
    url: `${process.env.ELEVEN_LABS_BASE_URL}/text-to-speech/${voiceSettings.voice_id}`,
    data: {
      text: ssmlText,
      model_id: process.env.ELEVEN_LABS_MODEL_ID || voiceSettings.model_id,
      voice_settings: {
        stability: voiceSettings.stability,
        similarity_boost: voiceSettings.similarity_boost,
        style: voiceSettings.style || 0.75, // Increase style for more expression
        use_speaker_boost: voiceSettings.use_speaker_boost
      },
      output_format: process.env.ELEVEN_LABS_OUTPUT_FORMAT
    },
    headers: {
      'xi-api-key': process.env.ELEVEN_LABS_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg'
    },
    responseType: 'arraybuffer',
    maxBodyLength: Infinity
  });

  if (response.status === 200 && response.data) {
    const audioBuffer = Buffer.from(response.data);
    console.log(`Audio generated successfully with ElevenLabs: ${audioBuffer.length} bytes`);
    return audioBuffer;
  }
  
  throw new Error(`Failed to generate audio with ElevenLabs: ${response.statusText}`);
}

// Helper function to generate audio with Google Cloud TTS
async function generateAudioWithGoogleTTS(text, voiceConfig) {
  try {
    // Default voice if not provided
    const voice = voiceConfig || {
      name: 'en-US-Neural2-F',
      languageCode: 'en-US',
      ssmlGender: 'FEMALE'
    };
    
    console.log(`Google TTS request for voice: ${voice.name}`);
    console.log(`Text length: ${text.length} characters`);
    
    // Create SSML to enhance the speech with expression
    const ssmlText = `<speak>
      <prosody rate="0.95">
        <emphasis level="moderate">${text}</emphasis>
      </prosody>
    </speak>`;
    
    const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
    if (!apiKey) {
      console.error('Google Cloud API key is not configured');
      throw new Error('Google Cloud API key is missing');
    }
    
    const response = await axios({
      method: 'post',
      url: 'https://texttospeech.googleapis.com/v1/text:synthesize',
      data: {
        input: { ssml: ssmlText },
        voice: voice,
        audioConfig: { 
          audioEncoding: 'MP3',
          effectsProfileId: ['small-bluetooth-speaker-class-device'],
          speakingRate: voice.ssmlGender === 'MALE' ? 0.9 : 1.0
        }
      },
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey
      }
    });

    if (response.status === 200 && response.data && response.data.audioContent) {
      const audioBuffer = Buffer.from(response.data.audioContent, 'base64');
      console.log(`Audio generated successfully with Google TTS: ${audioBuffer.length} bytes`);
      return audioBuffer;
    }
    
    console.error(`Unexpected response from Google TTS API: ${response.status} ${response.statusText}`);
    throw new Error(`Failed to generate audio with Google TTS: ${response.statusText}`);
  } catch (error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(`Google TTS error: ${error.response.status} ${error.response.statusText}`);
      console.error('Error data:', error.response.data);
      
      if (error.response.status === 403) {
        console.error('API key may be invalid or has reached its quota limit');
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Google TTS error: No response received from server');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error(`Google TTS error: ${error.message}`);
    }
    
    throw error;
  }
}

export async function combineAudioFiles(audioFiles) {
  try {
    if (!audioFiles || audioFiles.length === 0) {
      throw new Error('No audio files provided for combination');
    }
    
    if (audioFiles.length === 1) {
      return audioFiles[0].audio;
    }
    
    // For now, we'll concatenate the buffers with a small silence between them
    // In a production environment, you would use a proper audio processing library
    // like ffmpeg to combine the audio files with proper transitions
    
    // Create a small silence buffer (500ms of silence)
    const silenceLength = 500; // 500ms
    const sampleRate = 44100; // 44.1kHz
    const bytesPerSample = 2; // 16-bit audio
    const channels = 2; // Stereo
    const silenceSize = Math.floor(sampleRate * (silenceLength / 1000) * bytesPerSample * channels);
    const silenceBuffer = Buffer.alloc(silenceSize, 0);
    
    // Combine all audio buffers with silence in between
    const combinedBuffers = [];
    for (let i = 0; i < audioFiles.length; i++) {
      combinedBuffers.push(audioFiles[i].audio);
      
      // Add silence between segments (except after the last one)
      if (i < audioFiles.length - 1) {
        combinedBuffers.push(silenceBuffer);
      }
    }
    
    // Concatenate all buffers
    const combinedAudio = Buffer.concat(combinedBuffers);
    console.log(`Combined ${audioFiles.length} audio segments into a single buffer of ${combinedAudio.length} bytes`);
    
    return combinedAudio;
  } catch (error) {
    console.error('Audio combination error:', error);
    throw new Error(`Failed to combine audio files: ${error.message}`);
  }
}
