import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { 
  CloudArrowUpIcon, 
  XMarkIcon, 
  DocumentTextIcon,
  CheckIcon,
  ExclamationCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useProcessing } from '../context/ProcessingContext';

const processingModes = [
  {
    id: 'overview',
    name: 'Overview',
    description: 'Generate a concise audio summary of the entire presentation (10-15 minutes)',
    icon: CloudArrowUpIcon,
  },
  {
    id: 'per-slide',
    name: 'Per Slide',
    description: 'Create individual audio segments for each slide (1-2 minutes per slide)',
    icon: DocumentTextIcon,
  },
  {
    id: 'dual',
    name: 'Dual Narration',
    description: 'Generate a conversation between a narrator and an expert',
    icon: CloudArrowUpIcon,
  },
];

function FileUpload() {
  const navigate = useNavigate();
  const { uploadPresentation, processing, progress } = useProcessing();
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedMode, setSelectedMode] = useState('overview');
  const [uploadError, setUploadError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles?.length > 0) {
      setSelectedFile(acceptedFiles[0]);
      setUploadError(null);
    }
  }, []);

  const { 
    getRootProps, 
    getInputProps, 
    isDragActive,
    isDragAccept,
    isDragReject
  } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
    },
    maxFiles: 1,
    multiple: false,
    onDragEnter: () => setIsDragOver(true),
    onDragLeave: () => setIsDragOver(false),
    onDropAccepted: () => setIsDragOver(false),
    onDropRejected: (fileRejections) => {
      setIsDragOver(false);
      if (fileRejections.length > 0) {
        const { errors } = fileRejections[0];
        if (errors[0]?.code === 'file-invalid-type') {
          setUploadError('Invalid file type. Please upload a PPT or PPTX file.');
        } else {
          setUploadError('There was an error with your file. Please try again.');
        }
      }
    }
  });

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const result = await uploadPresentation(selectedFile, selectedMode);
      navigate(`/status/${result.id}`);
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadError(error.message || 'Upload failed. Please try again.');
      setIsUploading(false);
    }
  };

  const clearSelection = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    setUploadError(null);
  };

  // Get border color based on drag state
  const getBorderColor = () => {
    if (isDragReject) return 'border-red-500 bg-red-50 dark:bg-red-900/20';
    if (isDragAccept) return 'border-accent-500 bg-accent-50 dark:bg-accent-900/20';
    if (isDragActive) return 'border-primary-500 bg-primary-50 dark:bg-primary-900/20';
    return 'border-secondary-300 dark:border-secondary-600 hover:border-primary-400 dark:hover:border-primary-500';
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-secondary-900 dark:text-white">
          Upload Your Presentation
        </h2>
        <p className="mt-3 text-lg text-secondary-600 dark:text-secondary-300">
          Choose how you want to convert your presentation into audio
        </p>
      </div>

      <div className="card p-8">
        {/* Processing Mode Selection */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-secondary-900 dark:text-white mb-4">
            Select Conversion Mode
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {processingModes.map((mode) => (
              <div
                key={mode.id}
                className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all duration-200 ${
                  selectedMode === mode.id
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-secondary-200 dark:border-secondary-700 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-50/50 dark:hover:bg-primary-900/10'
                }`}
                onClick={() => setSelectedMode(mode.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg ${selectedMode === mode.id ? 'bg-primary-500 text-white' : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-400'}`}>
                      <mode.icon className="h-5 w-5" />
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-secondary-900 dark:text-white">
                        {mode.name}
                      </p>
                      <p className="text-sm text-secondary-500 dark:text-secondary-400">
                        {mode.description}
                      </p>
                    </div>
                  </div>
                  {selectedMode === mode.id && (
                    <div className="h-5 w-5 text-primary-600 dark:text-primary-400">
                      <CheckIcon className="h-5 w-5" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* File Upload Area */}
        <div className="mt-8">
          <h3 className="text-lg font-medium text-secondary-900 dark:text-white mb-4">
            Upload Presentation File
          </h3>
          <div
            {...getRootProps()}
            className={`p-8 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all duration-200 ${getBorderColor()}`}
          >
            <input {...getInputProps()} />
            <div className="space-y-4">
              {selectedFile ? (
                <div className="flex flex-col items-center">
                  <div className="p-3 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 mb-2">
                    <DocumentTextIcon className="h-8 w-8" />
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-secondary-900 dark:text-white font-medium">
                      {selectedFile.name}
                    </span>
                    <span className="text-secondary-500 dark:text-secondary-400 text-sm">
                      ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                    <button
                      onClick={clearSelection}
                      className="p-1 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-500 dark:text-secondary-400"
                      aria-label="Remove file"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <span className="text-accent-600 dark:text-accent-400 text-sm mt-2 flex items-center">
                    <CheckIcon className="h-4 w-4 mr-1" />
                    File ready for upload
                  </span>
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-center">
                    <div className="p-4 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-500 dark:text-primary-400 mb-4">
                      <CloudArrowUpIcon className="h-10 w-10" />
                    </div>
                    <p className="text-lg font-medium text-secondary-900 dark:text-white">
                      Drag and drop your presentation here
                    </p>
                    <p className="text-secondary-500 dark:text-secondary-400 mt-1">
                      or <span className="text-primary-600 dark:text-primary-400 font-medium">click to browse</span>
                    </p>
                    <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-4">
                      Supports PPT and PPTX files
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {uploadError && (
            <div className="mt-3 text-red-600 dark:text-red-400 text-sm flex items-center">
              <ExclamationCircleIcon className="h-4 w-4 mr-1" />
              {uploadError}
            </div>
          )}
        </div>

        {/* Upload Button */}
        <div className="mt-8">
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className={`w-full btn-primary btn-lg flex items-center justify-center ${
              !selectedFile || isUploading
                ? 'opacity-60 cursor-not-allowed'
                : ''
            }`}
          >
            {isUploading ? (
              <>
                <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />
                Uploading ({progress}%)
              </>
            ) : (
              'Start Processing'
            )}
          </button>
          
          <p className="text-center text-sm text-secondary-500 dark:text-secondary-400 mt-4">
            By uploading, you agree to our <a href="#" className="text-primary-600 dark:text-primary-400 hover:underline">Terms of Service</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default FileUpload;
