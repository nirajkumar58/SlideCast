import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../utils/axios'
import { 
  ArrowDownTrayIcon, 
  DocumentIcon, 
  ArrowLeftIcon,
  SpeakerWaveIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from './ui/Card'
import { Button } from './ui/Button'
import { ProcessingAnimation, ErrorState } from './ui/ProcessingAnimation'
import AudioPlayer from './audio/AudioPlayer'
import ConversationModeSelector from './audio/ConversationModeSelector'
import EnhancedContent from './audio/EnhancedContent'
import toast from 'react-hot-toast'

const POLL_INTERVAL = 3000 // 3 seconds
const POLL_MAX_RETRIES = 20 // Maximum number of polling attempts

const ShareLink = () => {
  const { shareableLink } = useParams()
  const pollRef = useRef({
    timeoutId: null,
    abortController: null,
    retryCount: 0
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [fileInfo, setFileInfo] = useState(null)
  const [selectedMode, setSelectedMode] = useState(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [slides, setSlides] = useState([])
  const [audioLoading, setAudioLoading] = useState(false)
  const [enhancedContent, setEnhancedContent] = useState(null)
  const [processingStatus, setProcessingStatus] = useState('loading')
  const [progress, setProgress] = useState({
    pdfConverted: false,
    textExtracted: false,
    totalSlides: 0,
    currentStep: 'uploading',
    percentage: 0,
    stepDetails: ''
  })

  const updateProgress = useCallback((status, fileData) => {
    const getProgressDetails = () => {
      switch (status) {
        case 'converting':
          return {
            message: 'Converting your presentation...',
            detail: fileData.progress.pdfConverted ? 'Optimizing PDF output' : 'Converting to PDF format',
            progress: fileData.progress.pdfConverted ? 40 : 20
          }
        case 'processing':
          return {
            message: 'Extracting text from slides...',
            detail: `${fileData.progress.totalSlides} slides detected`,
            progress: fileData.progress.pdfConverted ? 80 : 60
          }
        case 'completed':
          return {
            message: 'Processing complete!',
            detail: 'Your presentation is ready',
            progress: 100
          }
        default:
          return {
            message: 'Processing your file...',
            detail: 'Starting conversion',
            progress: 0
          }
      }
    }

    const details = getProgressDetails()
    setProgress(prev => ({
      ...prev,
      ...fileData.progress,
      percentage: details.progress,
      currentStep: details.message,
      stepDetails: details.detail
    }))
  }, [])

  const checkFileStatus = useCallback(async (signal) => {
    try {
      const fileResponse = await api.get(`/files/${shareableLink}/info`, { signal })
      const fileData = fileResponse.data
      
      setFileInfo(fileData)
      updateProgress(fileData.status, fileData)
      setProcessingStatus(fileData.status)

      if (fileData.status === 'completed') {
        try {
          const slidesResponse = await api.get(`/files/${shareableLink}/slides`, { signal })
          if (slidesResponse.data.status === 'completed') {
            setSlides(slidesResponse.data.slides)
            const iframe = document.getElementById('pdf-viewer')
            if (iframe) {
              iframe.src = `/files/${shareableLink}/view`
            }
            setProcessingStatus('completed')
            setLoading(false)
            return fileData
          }
        } catch (error) {
          if (error.name === 'AbortError') throw error
          console.error('Error fetching slides:', error)
        }
      } else if (fileData.status === 'failed') {
        setError('File processing failed')
        setProcessingStatus('failed')
        setLoading(false)
        return fileData
      }

      return fileData
    } catch (err) {
      if (err.name === 'AbortError') throw err
      setError('Failed to load content. The link may be invalid or expired.')
      setProcessingStatus('failed')
      setLoading(false)
      return null
    }
  }, [shareableLink, updateProgress])

  useEffect(() => {
    const controller = new AbortController()

    const poll = async () => {
      if (pollRef.current.retryCount >= POLL_MAX_RETRIES) {
        setError('File processing timed out')
        setLoading(false)
        return
      }

      try {
        const fileData = await checkFileStatus(controller.signal)
        if (!fileData) return // Request was aborted or failed

        // Continue polling if not complete
        if (!['completed', 'failed'].includes(fileData.status)) {
          pollRef.current.retryCount++
          pollRef.current.timeoutId = setTimeout(poll, POLL_INTERVAL)
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error during polling:', error)
          setError('Failed to check file status')
          setLoading(false)
        }
      }
    }

    poll() // Start polling

    return () => {
      controller.abort()
      if (pollRef.current.timeoutId) {
        clearTimeout(pollRef.current.timeoutId)
        pollRef.current.timeoutId = null
      }
    }
  }, [checkFileStatus])

  const handleModeSelect = async (mode) => {
    try {
      if (!fileInfo || !fileInfo._id) {
        throw new Error('File information not available');
      }

      setAudioLoading(true);
      
      // Create an AbortController for this request
      const controller = new AbortController();
      
      try {
        console.log('Setting audio mode:', {
          fileId: fileInfo._id,
          mode: mode
        });

        const response = await api.post(`/audio/${fileInfo._id}/config`, { mode }, {
          signal: controller.signal,
          timeout: 30000 // 30 seconds timeout
        });
        
        console.log('Audio mode response:', response.data);
        
        setSelectedMode(mode);
        toast.success('Audio mode configured');
        
        // Wait a bit before starting audio generation to avoid race conditions
        await new Promise(resolve => setTimeout(resolve, 1000));
        await generateAudio();
      } catch (error) {
        if (error.name === 'CanceledError') {
          console.log('Request was canceled');
        } else {
          throw error;
        }
      } finally {
        controller.abort(); // Clean up the controller
      }
    } catch (error) {
      console.error('Error configuring audio mode:', error)
      toast.error('Failed to configure audio mode')
      setAudioLoading(false)
    }
  }

  const generateAudio = async () => {
    // Create an AbortController for audio generation
    const controller = new AbortController();
    
    try {
      setAudioLoading(true);
      
      // Use text content from slides array
      const slide = slides[currentSlide]
      if (!slide || !slide.textContent) {
        throw new Error('No text content found for this slide')
      }

      // Generate audio for the slide
      const generateResponse = await api.post(`/audio/${fileInfo._id}/generate/${currentSlide}`, {
        mode: selectedMode
      }, {
        signal: controller.signal,
        timeout: 30000 // 30 seconds timeout
      });

      if (generateResponse.data.status === 'completed') {
        // Load audio content and enhanced information
        const [audioResponse, enhanceResponse] = await Promise.all([
          api.get(`/audio/${fileInfo._id}/audio/${currentSlide}`, { signal: controller.signal }),
          api.get(`/audio/${fileInfo._id}/enhance/${currentSlide}`, { signal: controller.signal })
        ]);

        // Update enhanced content first to avoid UI flicker
        setEnhancedContent({
          ...enhanceResponse.data,
          audioBase64: audioResponse.data.audioBase64
        });
        
        // Update audio player
        const audioPlayer = document.getElementById('audio-player')
        if (audioPlayer) {
          audioPlayer.src = `data:audio/mp3;base64,${audioResponse.data.audioBase64}`
          audioPlayer.load() // Force reload of audio
        }
        
        toast.success('Audio generated successfully')
      } else {
        throw new Error(generateResponse.data.message || 'Audio generation failed')
      }
    } catch (error) {
      if (error.name === 'CanceledError') {
        console.log('Audio generation request was canceled');
      } else {
        console.error('Error generating audio:', error);
        toast.error(error.message || 'Failed to generate audio');
      }
    } finally {
      controller.abort(); // Clean up the controller
      setAudioLoading(false);
    }
  }

  const handleSlideChange = async (newSlide) => {
    setCurrentSlide(newSlide)
    
    // Update PDF viewer to show the current slide
    const iframe = document.getElementById('pdf-viewer')
    if (iframe && iframe.contentWindow) {
      try {
        iframe.contentWindow.postMessage({
          type: 'setPage',
          page: newSlide + 1
        }, '*')
      } catch (error) {
        console.error('Error updating PDF viewer page:', error)
      }
    }

    // Generate audio for new slide if mode is selected
    if (selectedMode) {
      await generateAudio()
    }
  }

  useEffect(() => {
    // Listen for PDF viewer messages
    const handlePdfMessage = (event) => {
      if (event.data && event.data.type === 'pageChanged') {
        const newPage = event.data.page - 1 // PDF pages are 1-based
        if (newPage !== currentSlide) {
          handleSlideChange(newPage)
        }
      }
    }

    window.addEventListener('message', handlePdfMessage)
    return () => window.removeEventListener('message', handlePdfMessage)
  }, [currentSlide])

  useEffect(() => {
    // Setup PDF viewer
    const iframe = document.getElementById('pdf-viewer')
    if (iframe && fileInfo && processingStatus === 'completed') {
      iframe.onload = () => {
        try {
          iframe.contentWindow.postMessage({
            type: 'init',
            currentPage: currentSlide + 1
          }, '*')
        } catch (error) {
          console.error('Error initializing PDF viewer:', error)
        }
      }
    }
  }, [fileInfo, processingStatus, currentSlide])

  const handleDownload = async () => {
    try {
      const response = await api.get(`/files/${shareableLink}/download`, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${fileInfo.originalName}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('Download started!')
    } catch (err) {
      console.error('Download error:', err)
      toast.error('Failed to download file')
    }
  }

  const renderProcessingState = () => {
    const getProcessingMessage = () => {
      if (!fileInfo) return 'Initializing...';
      
      switch (fileInfo.status) {
        case 'processing':
          return 'Processing your presentation file...';
        case 'converting':
          if (!progress.pdfConverted) {
            return 'Converting presentation to PDF format...';
          }
          return 'Extracting and analyzing slide content...';
        case 'completed':
          return 'Processing complete!';
        case 'failed':
          return 'Processing failed. Please try again.';
        default:
          return 'Processing your file...';
      }
    };

    return (
      <div className="text-center">
        <ProcessingAnimation />
        <p className="mt-4 text-gray-600">{progress.currentStep || getProcessingMessage()}</p>
        <div className="mt-2">
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-500 ease-out"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">{progress.percentage}% complete</p>
        </div>
        {progress.stepDetails && (
          <p className="mt-2 text-sm text-gray-500">{progress.stepDetails}</p>
        )}
        {processingStatus === 'converting' && progress.pdfConverted && !progress.textExtracted && (
          <p className="mt-2 text-sm text-yellow-600">
            This might take a few moments for large presentations...
          </p>
        )}
      </div>
    );
  };

  const renderLoadingState = () => {
    if (error || processingStatus === 'failed') {
      return (
        <ErrorState message={error || 'File processing failed'}>
          <Link 
            to="/"
            className="inline-flex items-center mt-4 text-blue-500 hover:text-blue-600"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1.5" />
            Convert another file
          </Link>
        </ErrorState>
      )
    }

    if (pollRef.current.retryCount >= POLL_MAX_RETRIES) {
      return (
        <ErrorState message="File processing timed out">
          <Link 
            to="/"
            className="inline-flex items-center mt-4 text-blue-500 hover:text-blue-600"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1.5" />
            Try again
          </Link>
        </ErrorState>
      )
    }

    return renderProcessingState()
  }

  if (loading || ['converting', 'processing'].includes(processingStatus)) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Processing File</CardTitle>
            {fileInfo && (
              <CardDescription className="text-sm mt-0.5">
                {fileInfo.originalName}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {renderLoadingState()}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!fileInfo || !slides.length) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Loading Presentation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <ProcessingAnimation />
              <p className="mt-4 text-gray-600">Loading presentation details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - PDF Viewer */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">Your PDF is ready!</CardTitle>
                  {fileInfo && (
                    <CardDescription className="text-sm mt-0.5">
                      {fileInfo.originalName}
                      <span className="text-xs opacity-75 ml-2">
                        Expires {new Date(fileInfo.expiresAt).toLocaleDateString()}
                      </span>
                    </CardDescription>
                  )}
                </div>
                <Button
                  size="sm"
                  icon={ArrowDownTrayIcon}
                  onClick={handleDownload}
                >
                  Download
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="relative">
                <div className="w-full aspect-[4/3] bg-gray-50">
                  <iframe
                    id="pdf-viewer"
                    className="w-full h-full border-none"
                    title="PDF Viewer"
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-between items-center py-3">
              <Button
                variant="secondary"
                size="sm"
                icon={ArrowLeftIcon}
                as={Link}
                to="/"
              >
                Convert another
              </Button>
              <span className="text-xs text-gray-500">
                Link expires in {Math.ceil((new Date(fileInfo?.expiresAt) - new Date()) / (1000 * 60 * 60 * 24))} days
              </span>
            </CardFooter>
          </Card>
        </div>

        {/* Right Column - Audio Features */}
        <div className="space-y-6">
          {/* Audio Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <SpeakerWaveIcon className="h-5 w-5" />
                <span>Audio Generation</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {audioLoading ? (
                <div className="text-center py-4">
                  <ProcessingAnimation />
                  <p className="mt-4 text-gray-600">Generating audio...</p>
                </div>
              ) : !selectedMode ? (
                processingStatus !== 'completed' ? (
                  <div className="text-center py-4">
                    <ProcessingAnimation />
                    <p className="mt-4 text-gray-600">Please wait while your presentation is being processed...</p>
                    <p className="mt-2 text-sm text-gray-500">Audio configuration will be available once processing is complete.</p>
                  </div>
                ) : !slides.length ? (
                  <div className="text-center py-4">
                    <p className="text-gray-600">No slides found in the presentation.</p>
                  </div>
                ) : (
                  <ConversationModeSelector
                    onSelect={handleModeSelect}
                    selectedMode={selectedMode}
                    processing={processingStatus !== 'completed'}
                    progress={progress}
                  />
                )
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col gap-4">
                    <AudioPlayer
                      id="audio-player"
                      src={`data:audio/mp3;base64,${enhancedContent?.audioBase64}`}
                      title={`Slide ${currentSlide + 1} of ${slides.length}`}
                      showWaveform
                    />
                    <div className="flex justify-between items-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSlideChange(Math.max(0, currentSlide - 1))}
                        disabled={currentSlide === 0 || audioLoading}
                      >
                        Previous Slide
                      </Button>
                      <span className="text-sm text-gray-600">
                        {currentSlide + 1} / {slides.length}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSlideChange(Math.min(slides.length - 1, currentSlide + 1))}
                        disabled={currentSlide === slides.length - 1 || audioLoading}
                      >
                        Next Slide
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedMode(null)}
                        className="flex-1"
                        disabled={audioLoading}
                      >
                        Change Voice Style
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => generateAudio()}
                        className="flex-1"
                        disabled={audioLoading}
                      >
                        Regenerate Audio
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enhanced Content */}
          {selectedMode && enhancedContent && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Enhanced Content</CardTitle>
              </CardHeader>
              <CardContent>
                <EnhancedContent
                  additionalPoints={enhancedContent.additionalPoints}
                  statistics={enhancedContent.statistics}
                  newsUpdates={enhancedContent.newsUpdates}
                  notes={enhancedContent.notes}
                  onAddNote={() => {}} // We'll implement this later
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default ShareLink
