import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProcessing } from '../context/ProcessingContext';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

const POLLING_INTERVAL = 2000; // 2 seconds

const processingSteps = [
  { id: 1, name: 'Uploading file', description: 'Securely transferring your presentation' },
  { id: 2, name: 'Extracting content', description: 'Analyzing slides and extracting text' },
  { id: 3, name: 'Generating audio', description: 'Converting content to natural speech' },
  { id: 4, name: 'Finalizing', description: 'Preparing your audio presentation' },
];

function ProcessingStatus() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { checkStatus } = useProcessing();
  const [status, setStatus] = useState({
    status: 'processing',
    progress: 0,
    error: null,
  });

  useEffect(() => {
    let pollingInterval;

    const pollStatus = async () => {
      try {
        const result = await checkStatus(id);
        setStatus(result);

        if (result.status === 'completed') {
          clearInterval(pollingInterval);
          navigate(`/player/${id}`);
        } else if (result.status === 'failed') {
          clearInterval(pollingInterval);
        }
      } catch (error) {
        console.error('Status check failed:', error);
        setStatus((prev) => ({
          ...prev,
          status: 'failed',
          error: 'Failed to check processing status',
        }));
        clearInterval(pollingInterval);
      }
    };

    // Initial check
    pollStatus();

    // Start polling
    pollingInterval = setInterval(pollStatus, POLLING_INTERVAL);

    return () => {
      clearInterval(pollingInterval);
    };
  }, [id, checkStatus, navigate]);

  const getStatusIcon = () => {
    switch (status.status) {
      case 'completed':
        return (
          <CheckCircleIcon className="h-16 w-16 text-accent-500" aria-hidden="true" />
        );
      case 'failed':
        return (
          <XCircleIcon className="h-16 w-16 text-red-500" aria-hidden="true" />
        );
      default:
        return (
          <ArrowPathIcon
            className="h-16 w-16 text-primary-500 animate-spin"
            aria-hidden="true"
          />
        );
    }
  };

  const getStatusMessage = () => {
    switch (status.status) {
      case 'completed':
        return 'Processing completed successfully!';
      case 'failed':
        return `Processing failed: ${status.error || 'Unknown error'}`;
      default:
        return 'Processing your presentation...';
    }
  };

  // Calculate current step based on progress
  const getCurrentStep = () => {
    const progress = status.progress || 0;
    if (progress < 25) return 1;
    if (progress < 50) return 2;
    if (progress < 75) return 3;
    return 4;
  };

  const currentStep = getCurrentStep();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-fade-in">
      <div className="card p-8">
        <div className="space-y-8">
          {/* Status Icon and Message */}
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-4 rounded-full bg-primary-50 dark:bg-primary-900/20">
              {getStatusIcon()}
            </div>
            <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">
              {getStatusMessage()}
            </h2>
            
            {status.status === 'processing' && (
              <p className="text-secondary-600 dark:text-secondary-300">
                Please wait while we process your presentation. This may take a few minutes.
              </p>
            )}
          </div>

          {/* Progress Bar */}
          {status.status === 'processing' && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium text-secondary-600 dark:text-secondary-300">
                <span>Progress</span>
                <span>{status.progress}%</span>
              </div>
              <div className="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-3">
                <div
                  className="bg-primary-600 dark:bg-primary-500 h-3 rounded-full transition-all duration-500 relative"
                  style={{ width: `${status.progress}%` }}
                >
                  {status.progress > 5 && (
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                      {status.progress}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Processing Steps */}
          {status.status === 'processing' && (
            <div className="mt-8">
              <h3 className="text-lg font-medium text-secondary-900 dark:text-white mb-4">
                Processing Steps
              </h3>
              <div className="space-y-4">
                {processingSteps.map((step) => (
                  <div 
                    key={step.id} 
                    className={`flex items-start p-4 rounded-lg ${
                      step.id === currentStep 
                        ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800' 
                        : step.id < currentStep 
                          ? 'bg-secondary-50 dark:bg-secondary-800/50' 
                          : 'bg-white dark:bg-secondary-800/20'
                    }`}
                  >
                    <div className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full ${
                      step.id < currentStep 
                        ? 'bg-accent-500 text-white' 
                        : step.id === currentStep 
                          ? 'bg-primary-500 text-white animate-pulse' 
                          : 'bg-secondary-200 dark:bg-secondary-700 text-secondary-500 dark:text-secondary-400'
                    }`}>
                      {step.id < currentStep ? (
                        <CheckCircleIcon className="h-5 w-5" />
                      ) : (
                        <span>{step.id}</span>
                      )}
                    </div>
                    <div className="ml-4 flex-1">
                      <h4 className={`text-base font-medium ${
                        step.id <= currentStep 
                          ? 'text-secondary-900 dark:text-white' 
                        : 'text-secondary-500 dark:text-secondary-400'
                      }`}>
                        {step.name}
                      </h4>
                      <p className="text-sm text-secondary-500 dark:text-secondary-400">
                        {step.description}
                      </p>
                    </div>
                    {step.id === currentStep && (
                      <div className="flex-shrink-0">
                        <ArrowPathIcon className="h-5 w-5 text-primary-500 animate-spin" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {status.status === 'failed' && (
            <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <XCircleIcon className="h-6 w-6 text-red-500" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-red-800 dark:text-red-300">
                    Processing Error
                  </h3>
                  <p className="mt-2 text-red-700 dark:text-red-300">
                    {status.error || "An unknown error occurred while processing your presentation."}
                  </p>
                  <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                    Please try again or contact support if the problem persists.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-center mt-8">
            {status.status === 'failed' ? (
              <button
                onClick={() => navigate('/upload')}
                className="btn-primary flex items-center"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Try Again
              </button>
            ) : (
              <button
                onClick={() => navigate('/')}
                className="btn-outline flex items-center"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back to Home
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProcessingStatus; 