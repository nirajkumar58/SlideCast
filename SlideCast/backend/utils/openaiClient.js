import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Create OpenAI client with custom configuration
const openai = axios.create({
  baseURL: process.env.BASE_URL,
  headers: {
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

// Add response interceptor for better error handling
openai.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('OpenAI API Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
        model: error.config?.data?.model
      }
    });

    // Enhance error message based on response
    let errorMessage = 'Failed to generate content';
    if (error.response) {
      switch (error.response.status) {
        case 401:
          errorMessage = 'Invalid API key or unauthorized access';
          break;
        case 429:
          errorMessage = 'Too many requests, please try again later';
          break;
        case 500:
          errorMessage = 'OpenAI service error, please try again';
          break;
        default:
          errorMessage = error.response.data?.error?.message || errorMessage;
      }
    } else if (error.request) {
      errorMessage = 'No response from OpenAI service';
    }

    const enhancedError = new Error(errorMessage);
    enhancedError.originalError = error;
    enhancedError.response = error.response;
    throw enhancedError;
  }
);

// Helper function to validate completion response
const validateCompletionResponse = (response) => {
  if (!response?.data?.choices?.[0]?.message?.content) {
    throw new Error('Invalid response format from OpenAI');
  }
  return response.data.choices[0].message.content;
};

// Export the configured client and helpers
export { openai, validateCompletionResponse };

// Export a function to check API connectivity
export const testConnection = async () => {
  try {
    const response = await openai.post('/chat/completions', {
      model: process.env.MODEL,
      messages: [{ role: "user", content: "test" }],
      max_tokens: 1
    });
    console.log('OpenAI connection test successful:', {
      baseUrl: process.env.BASE_URL,
      model: process.env.MODEL,
      status: response.status
    });
    return true;
  } catch (error) {
    console.error('OpenAI connection test failed:', error.message);
    return false;
  }
};
