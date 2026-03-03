import React, { useState } from 'react';
import { testGoogleTTS, playAudio } from '../../utils/googleTtsTest';

function GoogleTtsTest() {
  const [text, setText] = useState('Hello, this is a test of Google Text to Speech API.');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);

  const handleTextChange = (e) => {
    setText(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);
    setAudioUrl(null);

    try {
      const response = await testGoogleTTS(text);
      setResult(response);

      if (response.success && response.audioContent) {
        // Create an audio URL from the base64 content
        const audioSrc = `data:audio/mp3;base64,${response.audioContent}`;
        setAudioUrl(audioSrc);
      }
    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlay = () => {
    if (result?.success && result?.audioContent) {
      playAudio(result.audioContent);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-4">
          Google Text-to-Speech API Test
        </h2>

        <form onSubmit={handleSubmit} className="mb-6">
          <div className="mb-4">
            <label htmlFor="text" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Text to Speak
            </label>
            <textarea
              id="text"
              value={text}
              onChange={handleTextChange}
              rows={4}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter text to convert to speech"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {isLoading ? 'Converting...' : 'Convert to Speech'}
          </button>
        </form>

        {isLoading && (
          <div className="flex justify-center items-center my-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        )}

        {result && (
          <div className={`p-4 rounded-md mb-4 ${result.success ? 'bg-green-50 dark:bg-green-900' : 'bg-red-50 dark:bg-red-900'}`}>
            <h3 className={`font-medium ${result.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
              {result.success ? 'Success!' : 'Error'}
            </h3>
            {!result.success && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {JSON.stringify(result.error)}
              </p>
            )}
          </div>
        )}

        {audioUrl && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Audio Result</h3>
            <audio controls src={audioUrl} className="w-full" />
            <div className="flex justify-center mt-4">
              <button
                onClick={handlePlay}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Play Audio
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default GoogleTtsTest; 