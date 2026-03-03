import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Handle file uploads
    if (config.data instanceof FormData) {
      config.headers['Content-Type'] = 'multipart/form-data'
    }
    
    // Handle audio streaming
    if (config.url.includes('/audio/') && config.method === 'get') {
      config.responseType = 'arraybuffer'
      config.headers['Accept'] = 'audio/mpeg'
    }

    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Handle audio stream responses
    if (response.config.responseType === 'arraybuffer') {
      return response
    }
    return response
  },
  (error) => {
    // Handle canceled requests without showing error toast
    if (error.name === 'CanceledError' || error.code === 'ECONNABORTED') {
      console.log('Request canceled or aborted:', error.message);
      return Promise.reject(error);
    }

    console.error('Response error:', error);

    // Handle network errors
    if (!error.response) {
      toast.error('Network error. Please check your connection.');
      return Promise.reject(new Error('Network error'));
    }

    // Handle specific error status codes
    switch (error.response.status) {
      case 400:
        toast.error(error.response.data.error || 'Invalid request')
        break
      case 404:
        toast.error('Resource not found')
        break
      case 413:
        toast.error('File too large')
        break
      case 415:
        toast.error('Unsupported file type')
        break
      case 429:
        toast.error('Too many requests. Please try again later.')
        break
      case 500:
        toast.error('Server error. Please try again later.')
        break
      default:
        toast.error('Something went wrong')
    }

    return Promise.reject(error)
  }
)

// Helper function to handle audio uploads with progress
export const uploadWithProgress = async (url, formData, onProgress) => {
  try {
    const response = await api.post(url, formData, {
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        )
        if (onProgress) {
          onProgress(percentCompleted)
        }
      }
    })
    return response.data
  } catch (error) {
    console.error('Upload error:', error)
    throw error
  }
}

// Helper function to download files
export const downloadFile = async (url, filename) => {
  try {
    const response = await api.get(url, {
      responseType: 'blob'
    })
    
    const blob = new Blob([response.data])
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(downloadUrl)
  } catch (error) {
    console.error('Download error:', error)
    throw error
  }
}

// Helper function to stream audio
export const streamAudio = async (url) => {
  try {
    const response = await api.get(url)
    return response.data
  } catch (error) {
    console.error('Audio streaming error:', error)
    throw error
  }
}

export default api
