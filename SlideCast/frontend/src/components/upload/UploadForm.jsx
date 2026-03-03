import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProcessing } from '../../context/ProcessingContext';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';

function UploadForm() {
  const navigate = useNavigate();
  const { uploadPresentation, processingStatus, checkApiStatus } = useProcessing();
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState('dual');
  const [isUploading, setIsUploading] = useState(false);
  const [apiStatus, setApiStatus] = useState({
    openai: { available: false, lastChecked: null },
    perplexity: { available: false, lastChecked: null }
  });
  const [isCheckingApi, setIsCheckingApi] = useState(false);

  // Check API status on component mount
  useEffect(() => {
    checkApiHealth();
  }, []);

  const checkApiHealth = async () => {
    setIsCheckingApi(true);
    try {
      const status = await checkApiStatus();
      setApiStatus(status);
      
      // Show warning if both APIs are down
      if (!status.openai.available && !status.perplexity.available) {
        toast.error('Warning: AI services are currently unavailable. Processing may fail or use basic fallback.');
      } 
      // Show warning if primary API is down
      else if (!status.openai.available && status.perplexity.available) {
        toast.warning('Primary AI service is unavailable. Will use Perplexity AI as fallback.');
      }
    } catch (error) {
      console.error('Failed to check API status:', error);
    } finally {
      setIsCheckingApi(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/vnd.ms-powerpoint': ['.ppt']
    },
    maxFiles: 1,
    onDrop: acceptedFiles => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0]);
      }
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }
    
    // Check API status before uploading
    await checkApiHealth();
    
    // Warn user if both APIs are down
    if (!apiStatus.openai.available && !apiStatus.perplexity.available) {
      const confirm = window.confirm(
        'Warning: AI services are currently unavailable. Processing may fail or use basic fallback. Do you want to continue?'
      );
      if (!confirm) return;
    }
    
    setIsUploading(true);
    
    try {
      const response = await uploadPresentation(file, mode);
      if (response && response.id) {
        navigate(`/processing/${response.id}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed: ' + (error.message || 'Unknown error'));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-card p-6">
        <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-6">
          Upload Presentation
        </h2>
        
        {/* API Status Indicator */}
        <div className="mb-6 p-4 rounded-lg bg-secondary-50 dark:bg-secondary-700/30">
          <h3 className="text-lg font-medium text-secondary-900 dark:text-white mb-2">
            AI Service Status
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-secondary-700 dark:text-secondary-300">OpenAI (Primary):</span>
              {isCheckingApi ? (
                <span className="text-secondary-500 dark:text-secondary-400">Checking...</span>
              ) : (
                <span className={`flex items-center ${apiStatus.openai.available ? 'text-green-500' : 'text-red-500'}`}>
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${apiStatus.openai.available ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  {apiStatus.openai.available ? 'Available' : 'Unavailable'}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-secondary-700 dark:text-secondary-300">Perplexity (Fallback):</span>
              {isCheckingApi ? (
                <span className="text-secondary-500 dark:text-secondary-400">Checking...</span>
              ) : (
                <span className={`flex items-center ${apiStatus.perplexity.available ? 'text-green-500' : 'text-red-500'}`}>
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${apiStatus.perplexity.available ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  {apiStatus.perplexity.available ? 'Available' : 'Unavailable'}
                </span>
              )}
            </div>
            <button 
              onClick={checkApiHealth}
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 mt-2"
            >
              Refresh Status
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                PowerPoint File
              </label>
              <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragActive 
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' 
                    : 'border-secondary-300 dark:border-secondary-700 hover:border-primary-500 dark:hover:border-primary-500'
                }`}
              >
                <input {...getInputProps()} />
                {file ? (
                  <div className="text-secondary-900 dark:text-white">
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-secondary-500 dark:text-secondary-400">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-secondary-700 dark:text-secondary-300">
                      Drag & drop your PowerPoint file here, or click to select
                    </p>
                    <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">
                      Supports .ppt and .pptx files
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Processing Mode */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Processing Mode
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div 
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    mode === 'overview' 
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10 ring-2 ring-primary-500/20' 
                      : 'border-secondary-200 dark:border-secondary-700 hover:border-primary-300 dark:hover:border-primary-700'
                  }`}
                  onClick={() => setMode('overview')}
                >
                  <h3 className="font-medium text-secondary-900 dark:text-white">Overview</h3>
                  <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">
                    Summarizes the entire presentation in a single audio file
                  </p>
                </div>
                
                <div 
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    mode === 'per-slide' 
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10 ring-2 ring-primary-500/20' 
                      : 'border-secondary-200 dark:border-secondary-700 hover:border-primary-300 dark:hover:border-primary-700'
                  }`}
                  onClick={() => setMode('per-slide')}
                >
                  <h3 className="font-medium text-secondary-900 dark:text-white">Per Slide</h3>
                  <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">
                    Creates separate audio for each slide with detailed explanations
                  </p>
                </div>
                
                <div 
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    mode === 'dual' 
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10 ring-2 ring-primary-500/20' 
                      : 'border-secondary-200 dark:border-secondary-700 hover:border-primary-300 dark:hover:border-primary-700'
                  }`}
                  onClick={() => setMode('dual')}
                >
                  <h3 className="font-medium text-secondary-900 dark:text-white">Dual Narration</h3>
                  <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">
                    Creates a conversation between a narrator and an expert
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={!file || isUploading}
                className={`w-full py-3 px-4 rounded-md font-medium text-white transition-colors ${
                  !file || isUploading
                    ? 'bg-secondary-400 dark:bg-secondary-700 cursor-not-allowed'
                    : 'bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600'
                }`}
              >
                {isUploading ? 'Uploading...' : 'Upload and Process'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UploadForm; 