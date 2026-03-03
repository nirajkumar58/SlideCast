// Google TTS API Test
// This file tests the Google Text-to-Speech API with the provided API key

const API_KEY = 'Replace with your actual API key'; // Replace with your actual API key

// Function to test Google TTS API
async function testGoogleTTS(text) {
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
            languageCode: 'en-US',
            name: 'en-US-Neural2-F', // Using a neural voice
            ssmlGender: 'FEMALE',
          },
          audioConfig: {
            audioEncoding: 'MP3',
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

// Function to play the audio from base64 string
function playAudio(base64Audio) {
  const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
  audio.play();
}

// Export functions for use in browser console
window.testGoogleTTS = testGoogleTTS;
window.playAudio = playAudio;

// Example usage (can be run from browser console):
// testGoogleTTS("Hello, this is a test of Google's Text to Speech API").then(result => {
//   if (result.success) {
//     playAudio(result.audioContent);
//   }
// });

export { testGoogleTTS, playAudio }; 
