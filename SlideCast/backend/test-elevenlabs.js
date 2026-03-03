import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

async function testElevenLabsAPI() {
  console.log('Starting ElevenLabs API test...');
  
  // Simple test script with narrator and expert roles
  const testScript = `Narrator: Welcome to our educational podcast about quantum physics.
Expert: Today we'll explore the fascinating world of quantum mechanics and its implications.
Narrator: Let's start with a basic introduction to quantum theory.`;

  console.log('Test script:');
  console.log(testScript);
  console.log('\n');

  try {
    console.log('Generating audio segments...');
    const audioSegments = await generateAudioForScript(testScript);
    
    console.log(`Successfully generated ${audioSegments.length} audio segments`);
    
    // Save each audio segment to a file for testing
    const outputDir = path.join(process.cwd(), 'test-output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    audioSegments.forEach((segment, index) => {
      const filePath = path.join(outputDir, `test-segment-${segment.role}-${index}.mp3`);
      fs.writeFileSync(filePath, segment.audio);
      console.log(`Saved audio segment to ${filePath}`);
    });
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

async function generateAudioForScript(text) {
  try {
    // Parse the script into separate lines for each speaker
    const lines = text.split('\n').filter(line => line.trim());
    console.log(`Total script lines: ${lines.length}`);
    console.log(`First few lines: ${lines.slice(0, 3).join('\n')}`);
    
    const audioSegments = [];
    
    // Check if ElevenLabs API key is valid
    if (!process.env.ELEVEN_LABS_API_KEY || process.env.ELEVEN_LABS_API_KEY.trim() === '') {
      console.error('ElevenLabs API key is missing');
      throw new Error('No valid ElevenLabs API key configured');
    }
    
    // Voice presets for different roles
    const voicePresets = {
      narrator: { 
        voice_id: 'FGY2WhTYpPnrIDTdsKH5', // Laura voice - clear and engaging
        model_id: 'eleven_multilingual_v2',
        stability: 0.7,
        similarity_boost: 0.75,
        style: 0.35,
        use_speaker_boost: true
      },
      expert: { 
        voice_id: 'onwK4e9ZLuTAKqWW03F9', // Daniel voice - professional and authoritative
        model_id: 'eleven_multilingual_v2',
        stability: 0.8,
        similarity_boost: 0.85,
        style: 0.45,
        use_speaker_boost: true
      }
    };

    for (const line of lines) {
      // Extract the role and text using a fixed regex pattern
      const roleMatch = line.match(/^(Narrator|Expert):\s*(.*)/i);
      if (!roleMatch) {
        console.log(`Line doesn't match pattern: "${line}"`);
        continue;
      }

      const role = roleMatch[1].toLowerCase();
      const speechText = roleMatch[2].trim(); // Use the captured group directly
      
      if (!speechText || speechText.length < 2) {
        console.log(`Empty or too short speech text for ${role}: "${speechText}"`);
        continue;
      }

      console.log(`Processing ${role} line: "${speechText.substring(0, 50)}..."`);

      // Get voice settings based on role
      const voiceSettings = voicePresets[role];
      
      try {
        console.log(`Trying ElevenLabs for ${role} with voice ${voiceSettings.voice_id}`);
        console.log(`Using API key: ${process.env.ELEVEN_LABS_API_KEY.substring(0, 5)}...`);
        console.log(`Using base URL: ${process.env.ELEVEN_LABS_BASE_URL}`);
        
        const audioBuffer = await generateAudioWithElevenLabs(speechText, voiceSettings);
        
        if (audioBuffer) {
          audioSegments.push({
            role,
            audio: audioBuffer
          });
          console.log(`Successfully generated audio for ${role}`);
        }
      } catch (error) {
        console.error(`ElevenLabs error for ${role}: ${error.message}`);
        if (error.response) {
          console.error(`Status: ${error.response.status}`);
          console.error(`Data: ${JSON.stringify(error.response.data)}`);
        }
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
  console.log(`Using model: ${voiceSettings.model_id}`);
  console.log(`Text length: ${text.length} characters`);
  
  const response = await axios({
    method: 'post',
    url: `${process.env.ELEVEN_LABS_BASE_URL}/text-to-speech/${voiceSettings.voice_id}`,
    data: {
      text: text,
      model_id: voiceSettings.model_id,
      voice_settings: {
        stability: voiceSettings.stability,
        similarity_boost: voiceSettings.similarity_boost,
        style: voiceSettings.style,
        use_speaker_boost: voiceSettings.use_speaker_boost
      }
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

// Run the test
testElevenLabsAPI(); 