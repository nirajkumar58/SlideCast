// Google Text-to-Speech API Integration
const API_KEY = import.meta.env.VITE_GOOGLE_TTS_API_KEY || 'Enter Your Key';

// Available voices in Google TTS
const GOOGLE_VOICES = {
  FEMALE: {
    en: 'en-US-Neural2-F', // Neural female voice (not Studio)
    enGB: 'en-GB-Neural2-F', // British female voice
  },
  MALE: {
    en: 'en-US-Neural2-D', // Neural male voice (not Studio)
    enGB: 'en-GB-Neural2-D', // British male voice
  }
};

/**
 * Converts text to speech using Google's Text-to-Speech API
 * @param {string} text - The text to convert to speech
 * @param {Object} options - Configuration options
 * @param {string} options.voiceName - The name of the voice to use
 * @param {string} options.languageCode - The language code (default: 'en-US')
 * @param {string} options.ssmlGender - The gender of the voice (default: 'FEMALE')
 * @param {number} options.pitch - The pitch of the voice (default: 0)
 * @param {number} options.speakingRate - The speaking rate (default: 1.0)
 * @returns {Promise<Object>} - A promise that resolves to the API response
 */
async function synthesizeSpeech(text, options = {}) {
  const {
    voiceName = GOOGLE_VOICES.FEMALE.en,
    languageCode = 'en-US',
    ssmlGender = 'FEMALE',
    pitch = 0,
    speakingRate = 1.0
  } = options;

  try {
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: {
            text: text,
          },
          voice: {
            languageCode,
            name: voiceName,
            ssmlGender,
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google TTS API Error:', errorData);
      return { success: false, error: errorData };
    }

    const data = await response.json();
    return { success: true, audioContent: data.audioContent };
  } catch (error) {
    console.error('Error calling Google TTS API:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Creates an audio element from a base64 audio string
 * @param {string} base64Audio - The base64 encoded audio data
 * @returns {HTMLAudioElement} - An audio element with the source set
 */
function createAudioFromBase64(base64Audio) {
  const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
  return audio;
}

/**
 * Converts a transcript segment to speech
 * @param {Object} segment - The transcript segment
 * @param {string} segment.role - The role (narrator, expert, etc.)
 * @param {string} segment.text - The text to speak
 * @returns {Promise<Object>} - A promise that resolves to the audio data
 */
async function synthesizeSegment(segment) {
  const options = {
    // Use different voices based on role
    voiceName: segment.role?.toLowerCase() === 'narrator' 
      ? GOOGLE_VOICES.FEMALE.en 
      : GOOGLE_VOICES.MALE.en,
    languageCode: 'en-US',
    ssmlGender: segment.role?.toLowerCase() === 'narrator' ? 'FEMALE' : 'MALE',
    speakingRate: segment.role?.toLowerCase() === 'narrator' ? 1.0 : 0.95,
  };

  return synthesizeSpeech(segment.text, options);
}

/**
 * Synthesizes an entire transcript
 * @param {Array} transcript - Array of transcript segments
 * @param {Function} onProgress - Callback for progress updates
 * @param {Function} onComplete - Callback when synthesis is complete
 * @param {Function} onError - Callback for errors
 * @returns {Promise<Array>} - A promise that resolves to an array of audio elements
 */
async function synthesizeTranscript(transcript, onProgress, onComplete, onError) {
  const audioElements = [];
  let totalSegments = transcript.length;
  let completedSegments = 0;
  let fallbackToSpeechSynthesis = false;

  try {
    for (const segment of transcript) {
      let result;
      
      // Try Google TTS first unless we've already fallen back
      if (!fallbackToSpeechSynthesis) {
        result = await synthesizeSegment(segment);
      } else {
        result = { success: false };
      }
      
      if (result.success) {
        const audio = createAudioFromBase64(result.audioContent);
        audioElements.push(audio);
        
        completedSegments++;
        if (onProgress) {
          onProgress(completedSegments / totalSegments);
        }
      } else {
        // If Google TTS fails, try browser's speech synthesis
        if (!fallbackToSpeechSynthesis) {
          console.log('Falling back to browser speech synthesis');
          fallbackToSpeechSynthesis = true;
          
          if (onError) {
            onError({ 
              message: 'Google TTS failed, falling back to browser speech synthesis',
              isFallback: true 
            });
          }
        }
        
        // Create an audio element with browser speech synthesis
        try {
          const audio = await synthesizeWithBrowserSpeech(segment);
          audioElements.push(audio);
          
          completedSegments++;
          if (onProgress) {
            onProgress(completedSegments / totalSegments);
          }
        } catch (speechError) {
          if (onError) {
            onError(speechError);
          }
          // Continue with other segments even if one fails
        }
      }
    }
    
    if (onComplete) {
      onComplete(audioElements);
    }
    
    return audioElements;
  } catch (error) {
    if (onError) {
      onError(error);
    }
    return audioElements;
  }
}

/**
 * Synthesizes speech using the browser's SpeechSynthesis API
 * @param {Object} segment - The transcript segment
 * @returns {Promise<HTMLAudioElement>} - A promise that resolves to an audio element
 */
function synthesizeWithBrowserSpeech(segment) {
  return new Promise((resolve, reject) => {
    if (!window.speechSynthesis) {
      reject(new Error('Browser speech synthesis not supported'));
      return;
    }
    
    // Create a new SpeechSynthesisUtterance
    const utterance = new SpeechSynthesisUtterance(segment.text);
    
    // Get available voices
    const voices = window.speechSynthesis.getVoices();
    
    // Select a voice based on role
    if (segment.role?.toLowerCase() === 'narrator') {
      // Try to find a female voice
      const femaleVoice = voices.find(voice => 
        voice.lang.startsWith('en') && voice.name.includes('Female'));
      utterance.voice = femaleVoice || voices.find(voice => voice.lang.startsWith('en'));
      utterance.pitch = 1.1;
      utterance.rate = 1.0;
    } else {
      // Try to find a male voice
      const maleVoice = voices.find(voice => 
        voice.lang.startsWith('en') && voice.name.includes('Male'));
      utterance.voice = maleVoice || voices.find(voice => voice.lang.startsWith('en'));
      utterance.pitch = 0.9;
      utterance.rate = 0.95;
    }
    
    // Create a MediaRecorder to capture the audio
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const mediaStreamDestination = audioContext.createMediaStreamDestination();
    const mediaRecorder = new MediaRecorder(mediaStreamDestination.stream);
    const audioChunks = [];
    
    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };
    
    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      resolve(audio);
    };
    
    // Start recording and speak
    mediaRecorder.start();
    window.speechSynthesis.speak(utterance);
    
    utterance.onend = () => {
      mediaRecorder.stop();
    };
    
    utterance.onerror = (error) => {
      mediaRecorder.stop();
      reject(error);
    };
  });
}

export {
  synthesizeSpeech,
  synthesizeSegment,
  synthesizeTranscript,
  createAudioFromBase64,
  synthesizeWithBrowserSpeech,
  GOOGLE_VOICES
}; 
