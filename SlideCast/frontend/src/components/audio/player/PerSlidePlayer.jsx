import React, { useState, useEffect, useRef } from 'react';
import { 
  PlayIcon, 
  PauseIcon, 
  BackwardIcon, 
  ForwardIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ArrowDownTrayIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/solid';

function PerSlidePlayer({ slides, title }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const audioRef = useRef(null);
  const progressBarRef = useRef(null);

  // Get current slide data
  const currentSlide = slides[currentSlideIndex] || {};

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Reset audio when changing slides
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      
      // Load the new audio
      if (currentSlide.audioUrl) {
        audioRef.current.src = currentSlide.audioUrl;
        audioRef.current.load();
      }
    }
  }, [currentSlideIndex, currentSlide]);

  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handlePlayPause = () => {
    if (audioRef.current.paused) {
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    setDuration(audioRef.current.duration);
  };

  const handleProgressClick = (event) => {
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = (event.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = pos * audioRef.current.duration;
  };

  const handleVolumeChange = (event) => {
    const value = parseFloat(event.target.value);
    setVolume(value);
    setIsMuted(value === 0);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleSkip = (direction) => {
    const skipAmount = 5; // seconds
    audioRef.current.currentTime += direction * skipAmount;
  };

  const handleNextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  const handlePrevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  const handleDownload = () => {
    if (!currentSlide.audioUrl) return;
    
    // Create a temporary anchor element
    const a = document.createElement('a');
    a.href = currentSlide.audioUrl;
    a.download = `${title || 'presentation'}-slide-${currentSlide.slideNumber || currentSlideIndex + 1}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Auto-advance to next slide when current slide ends
  const handleAudioEnded = () => {
    setIsPlaying(false);
    
    // Auto-advance to next slide after a short delay
    if (currentSlideIndex < slides.length - 1) {
      setTimeout(() => {
        handleNextSlide();
      }, 1500);
    }
  };

  return (
    <div className="card p-6 bg-white dark:bg-secondary-800 rounded-xl shadow-card">
      <div className="space-y-6">
        {/* Audio Element */}
        <audio
          ref={audioRef}
          src={currentSlide.audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleAudioEnded}
          preload="metadata"
        />

        {/* Title and Slide Navigation */}
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-secondary-900 dark:text-white">
              {title || 'Presentation'}
            </h3>
            <p className="text-secondary-600 dark:text-secondary-400">
              Slide {currentSlide.slideNumber || currentSlideIndex + 1} of {slides.length}
            </p>
          </div>
          <button 
            onClick={handleDownload}
            className="p-2 text-secondary-500 hover:text-primary-600 dark:text-secondary-400 dark:hover:text-primary-400"
            title="Download audio for this slide"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Slide Content */}
        <div className="bg-secondary-50 dark:bg-secondary-800/50 p-4 rounded-lg">
          <h4 className="font-medium text-secondary-900 dark:text-white mb-2">
            {currentSlide.title || `Slide ${currentSlide.slideNumber || currentSlideIndex + 1}`}
          </h4>
          <p className="text-secondary-700 dark:text-secondary-300">
            {currentSlide.content || 'No content available for this slide.'}
          </p>
        </div>

        {/* Slide Navigation */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={handlePrevSlide}
            disabled={currentSlideIndex === 0}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-md ${
              currentSlideIndex === 0
                ? 'text-secondary-400 dark:text-secondary-600 cursor-not-allowed'
                : 'text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700'
            }`}
          >
            <ChevronLeftIcon className="h-4 w-4" />
            <span>Previous</span>
          </button>
          
          <button
            onClick={handleNextSlide}
            disabled={currentSlideIndex === slides.length - 1}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-md ${
              currentSlideIndex === slides.length - 1
                ? 'text-secondary-400 dark:text-secondary-600 cursor-not-allowed'
                : 'text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700'
            }`}
          >
            <span>Next</span>
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Playback Controls */}
        <div className="space-y-4">
          {/* Progress Bar */}
          <div
            ref={progressBarRef}
            className="audio-progress cursor-pointer"
            onClick={handleProgressClick}
          >
            <div
              className="audio-progress-bar"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>

          {/* Time Display */}
          <div className="flex justify-between text-sm text-secondary-600 dark:text-secondary-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>

          {/* Control Buttons */}
          <div className="audio-controls flex items-center justify-between">
            {/* Volume Control */}
            <div className="flex items-center space-x-2">
              <button onClick={toggleMute} className="text-secondary-600 dark:text-secondary-400">
                {isMuted ? (
                  <SpeakerXMarkIcon className="h-5 w-5" />
                ) : (
                  <SpeakerWaveIcon className="h-5 w-5" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-20"
              />
            </div>

            {/* Playback Controls */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleSkip(-5)}
                className="p-2 text-secondary-600 hover:text-primary-600 dark:text-secondary-400 dark:hover:text-primary-400"
              >
                <BackwardIcon className="h-5 w-5" />
              </button>

              <button
                onClick={handlePlayPause}
                className="p-3 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 rounded-full text-white"
              >
                {isPlaying ? (
                  <PauseIcon className="h-6 w-6" />
                ) : (
                  <PlayIcon className="h-6 w-6" />
                )}
              </button>

              <button
                onClick={() => handleSkip(5)}
                className="p-2 text-secondary-600 hover:text-primary-600 dark:text-secondary-400 dark:hover:text-primary-400"
              >
                <ForwardIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Playback Speed */}
            <select
              className="bg-secondary-100 dark:bg-secondary-700 text-secondary-900 dark:text-white rounded-md px-2 py-1 text-sm"
              onChange={(e) => {
                audioRef.current.playbackRate = parseFloat(e.target.value);
              }}
              defaultValue="1"
            >
              <option value="0.5">0.5x</option>
              <option value="0.75">0.75x</option>
              <option value="1">1x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2x</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PerSlidePlayer; 