import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const ProcessingContext = createContext();

export function useProcessing() {
  return useContext(ProcessingContext);
}

export function ProcessingProvider({ children }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingId, setProcessingId] = useState(null);
  const [currentPresentationId, setCurrentPresentationId] = useState(null);
  const [processingStatus, setProcessingStatus] = useState(null);

  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });

  const uploadPresentation = useCallback(async (file, mode = 'dual') => {
    try {
      setIsProcessing(true);
      setProcessingProgress(0);
      setProcessingStatus('uploading');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('mode', mode);

      const response = await api.post('/audio/process', formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProcessingProgress(percentCompleted);
        }
      });

      setCurrentPresentationId(response.data.id);
      setProcessingStatus('processing');
      toast.success('Presentation uploaded successfully!');
      return response.data;
    } catch (error) {
      console.error('Upload error:', error);
      setProcessingStatus('error');
      toast.error(error.response?.data?.error || 'Failed to upload presentation');
      throw error;
    }
  }, [api]);

  const checkStatus = useCallback(async (presentationId) => {
    try {
      const response = await api.get(`/audio/status/${presentationId}`);
      console.log('Status update:', response.data);
      
      // Update progress and status
      setProcessingProgress(response.data.progress || 0);
      setProcessingStatus(response.data.status);
      
      // If completed, stop processing
      if (response.data.status === 'completed') {
        setIsProcessing(false);
      }
      
      // If failed, show error
      if (response.data.status === 'failed') {
        setIsProcessing(false);
        setProcessingStatus('error');
        setProcessingProgress(0);
        toast.error(response.data.error || 'Processing failed');
      }
      
      return response.data;
    } catch (error) {
      console.error('Status check error:', error);
      setProcessingStatus('error');
      toast.error('Failed to check processing status');
      throw error;
    }
  }, [api]);

  const getContent = useCallback(async (presentationId) => {
    try {
      const response = await api.get(`/audio/content/${presentationId}`);
      if (response.data) {
        setProcessingStatus('completed');
        setProcessingProgress(100);
      }
      return response.data;
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.status === 'processing') {
        // Content not ready yet, continue polling
        setProcessingStatus('processing');
        setProcessingProgress(error.response.data.progress || 0);
        throw new Error('Content not ready');
      } else {
        console.error('Content fetch error:', error);
        setProcessingStatus('error');
        toast.error('Failed to fetch presentation content');
        throw error;
      }
    }
  }, [api]);

  // Polling effect for status updates
  useEffect(() => {
    let pollInterval;

    const pollStatus = async () => {
      if (!currentPresentationId || !processingStatus) return;
      
      // Only poll if we're uploading or processing
      if (['uploading', 'processing'].includes(processingStatus)) {
        try {
          const status = await checkStatus(currentPresentationId);
          console.log('Poll status:', status);
          
          if (status.status === 'completed') {
            clearInterval(pollInterval);
            setIsProcessing(false);
            setProcessingProgress(100);
            toast.success('Processing completed successfully!');
          } else if (status.status === 'failed') {
            clearInterval(pollInterval);
            setIsProcessing(false);
            setProcessingStatus('error');
            setProcessingProgress(0);
            toast.error('Processing failed: ' + (status.error || 'Unknown error'));
          }
        } catch (error) {
          console.error('Polling error:', error);
          // Don't clear interval on network errors
          if (error.response?.status !== 404 && error.response?.status !== 500) {
            clearInterval(pollInterval);
            setIsProcessing(false);
            setProcessingStatus('error');
          }
        }
      } else {
        // Clear interval if we're not in a polling state
        clearInterval(pollInterval);
      }
    };

    if (currentPresentationId && ['uploading', 'processing'].includes(processingStatus)) {
      // Start polling immediately
      pollStatus();
      pollInterval = setInterval(pollStatus, 2000);
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [currentPresentationId, processingStatus, checkStatus]);

  // Check API status
  const checkApiStatus = async () => {
    try {
      const response = await api.get('/audio/api-status');
      return response.data;
    } catch (error) {
      console.error('API status check error:', error);
      return {
        openai: { available: false, error: 'Could not check status' },
        perplexity: { available: false, error: 'Could not check status' },
        timestamp: new Date()
      };
    }
  };

  const value = {
    isProcessing,
    processingError,
    processingProgress,
    processingId,
    currentPresentationId,
    processingStatus,
    uploadPresentation,
    checkStatus,
    getContent,
    checkApiStatus
  };

  return (
    <ProcessingContext.Provider value={value}>
      {children}
    </ProcessingContext.Provider>
  );
}

export default ProcessingProvider; 