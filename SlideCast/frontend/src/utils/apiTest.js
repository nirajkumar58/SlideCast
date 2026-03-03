import api from './axios'

// File conversion test
export const testFileConversion = async (file) => {
  try {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await api.post('/files/convert', formData)
    return response.data
  } catch (error) {
    console.error('File conversion test failed:', error)
    throw error
  }
}

// Audio generation test
export const testAudioGeneration = async (fileId, slideNumber, mode) => {
  try {
    // Set audio configuration
    await api.post(`/audio/${fileId}/config`, { mode })
    
    // Generate audio
    const response = await api.post(`/audio/${fileId}/generate/${slideNumber}`)
    return response.data
  } catch (error) {
    console.error('Audio generation test failed:', error)
    throw error
  }
}

// Enhanced content test
export const testContentEnhancement = async (fileId, slideNumber) => {
  try {
    const response = await api.post(`/audio/${fileId}/enhance/${slideNumber}`)
    return response.data
  } catch (error) {
    console.error('Content enhancement test failed:', error)
    throw error
  }
}

// Test note operations
export const testNoteOperations = async (fileId, slideNumber) => {
  try {
    // Add note
    const addResponse = await api.post(`/audio/${fileId}/notes`, {
      slideNumber,
      content: 'Test note content',
      timestamp: Date.now()
    })

    // Verify note was added
    const getResponse = await api.get(`/audio/${fileId}/notes`)
    
    return {
      addedNote: addResponse.data,
      allNotes: getResponse.data
    }
  } catch (error) {
    console.error('Note operations test failed:', error)
    throw error
  }
}

// Comprehensive system test
export const runSystemTest = async (file) => {
  const results = {
    fileConversion: null,
    audioGeneration: null,
    contentEnhancement: null,
    noteOperations: null
  }

  try {
    // Test file conversion
    console.log('Testing file conversion...')
    results.fileConversion = await testFileConversion(file)

    // Test audio generation
    console.log('Testing audio generation...')
    results.audioGeneration = await testAudioGeneration(
      results.fileConversion.fileId,
      0,
      'narrator_expert'
    )

    // Test content enhancement
    console.log('Testing content enhancement...')
    results.contentEnhancement = await testContentEnhancement(
      results.fileConversion.fileId,
      0
    )

    // Test note operations
    console.log('Testing note operations...')
    results.noteOperations = await testNoteOperations(
      results.fileConversion.fileId,
      0
    )

    console.log('All tests completed successfully:', results)
    return results
  } catch (error) {
    console.error('System test failed:', error)
    throw error
  }
}

// Helper functions
export const checkServerHealth = async () => {
  try {
    const response = await api.get('/health')
    return response.data
  } catch (error) {
    console.error('Health check failed:', error)
    throw error
  }
}

export const validateFile = (file) => {
  const validTypes = ['.ppt', '.pptx']
  const maxSize = 50 * 1024 * 1024 // 50MB
  
  const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
  
  const validation = {
    isValid: true,
    errors: []
  }

  if (!validTypes.includes(fileExtension)) {
    validation.isValid = false
    validation.errors.push('Invalid file type. Only .ppt and .pptx files are supported.')
  }

  if (file.size > maxSize) {
    validation.isValid = false
    validation.errors.push('File size exceeds 50MB limit.')
  }

  return validation
}

// Export test utilities
export const testUtils = {
  createMockFile: () => {
    return new File(['test content'], 'test.pptx', { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' })
  },
  
  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  generateRandomSlideContent: () => {
    return {
      title: 'Test Slide',
      content: 'This is test slide content.',
      bulletPoints: ['Point 1', 'Point 2', 'Point 3']
    }
  }
}
