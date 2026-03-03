import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

// Load environment variables
dotenv.config();

async function testGoogleTTS() {
  console.log('Starting Google TTS API test...');
  
  // Simple test text
  const testText = "This is a test of the Google Cloud Text-to-Speech API. It provides high-quality, natural-sounding voices.";

  console.log('Test text:', testText);
  console.log('\n');

  try {
    // Check if API key is configured
    if (!process.env.GOOGLE_CLOUD_API_KEY) {
      console.error('Google Cloud API key is not configured. Please add it to your .env file.');
      return;
    }

    console.log('Generating audio with Google TTS...');
    
    // Define voice configuration
    const voice = {
      name: 'en-US-Neural2-F',
      languageCode: 'en-US',
      ssmlGender: 'FEMALE'
    };
    
    console.log(`Using voice: ${voice.name}`);
    
    // Make API request
    const response = await axios({
      method: 'post',
      url: 'https://texttospeech.googleapis.com/v1/text:synthesize',
      data: {
        input: { text: testText },
        voice: voice,
        audioConfig: { audioEncoding: 'MP3' }
      },
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': process.env.GOOGLE_CLOUD_API_KEY
      }
    });

    if (response.status === 200 && response.data && response.data.audioContent) {
      // Convert base64 to audio buffer
      const audioBuffer = Buffer.from(response.data.audioContent, 'base64');
      console.log(`Audio generated successfully: ${audioBuffer.length} bytes`);
      
      // Save to file
      const outputDir = path.join(process.cwd(), 'test-output');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const filePath = path.join(outputDir, 'google-tts-test.mp3');
      fs.writeFileSync(filePath, audioBuffer);
      console.log(`Saved audio to ${filePath}`);
      
      console.log('Test completed successfully!');
    } else {
      console.error('Failed to generate audio:', response.statusText);
    }
  } catch (error) {
    console.error('Test failed with error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testGoogleTTS(); 