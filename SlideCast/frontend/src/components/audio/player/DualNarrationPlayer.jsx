import React, { useState, useEffect, useRef } from 'react';
import { 
  PlayIcon, 
  PauseIcon, 
  BackwardIcon, 
  ForwardIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ArrowDownTrayIcon,
  UserIcon,
  UserGroupIcon
} from '@heroicons/react/24/solid';

function DualNarrationPlayer({ audioUrl, title, transcript }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [activeSegment, setActiveSegment] = useState(null);
  const audioRef = useRef(null);
  const progressBarRef = useRef(null);

  // Parse transcript into segments with speaker roles
  const segments = transcript ? parseTranscript(transcript) : [];

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Find active segment based on current time
  useEffect(() => {
    if (!segments.length) return;
    
    const currentSegment = segments.find(segment => {
      return currentTime >= segment.startTime && currentTime <= segment.endTime;
    });
    
    if (currentSegment && (!activeSegment || activeSegment.id !== currentSegment.id)) {
      setActiveSegment(currentSegment);
    }
  }, [currentTime, segments, activeSegment]);

  // Parse transcript into segments with timing information
  function parseTranscript(transcript) {
    // This is a simplified implementation
    // In a real app, you would have proper timing information from the backend
    
    // Split by speaker changes (Narrator: or Expert:)
    const lines = transcript.split(/\\n|\\r\\n/);
    let segments = [];
    let currentTime = 0;
    
    lines.forEach((line, index) => {
      if (!line.trim()) return;
      
      const isNarrator = line.trim().startsWith('Narrator:');
      const isExpert = line.trim().startsWith('Expert:');
      
      if (isNarrator || isExpert) {
        const role = isNarrator ? 'narrator' : 'expert';
        const content = line.trim().replace(/^(Narrator:|Expert:)\\s*/, '').trim();
        
        // Estimate duration based on word count (very rough approximation)
        const wordCount = content.split(/\\s+/).length;
        const estimatedDuration = wordCount * 0.5; // 0.5 seconds per word
        
        segments.push({
          id: index,
          role,
          content,
          startTime: currentTime,
          endTime: currentTime + estimatedDuration
        });
        
        currentTime += estimatedDuration;
      }
    });
    
    return segments;
  }

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
    const skipAmount = 10; // seconds
    audioRef.current.currentTime += direction * skipAmount;
  };

  const handleDownload = () => {
    // Create a temporary anchor element
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `${title || 'dual-narration'}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Jump to a specific segment
  const jumpToSegment = (segment) => {
    if (audioRef.current && segment.startTime !== undefined) {
      audioRef.current.currentTime = segment.startTime;
      if (!isPlaying) {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  return (
    <div className="card p-6 bg-white dark:bg-secondary-800 rounded-xl shadow-card">
      <div className="space-y-6">
        {/* Audio Element */}
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          preload="metadata"
        />

        {/* Title */}
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-secondary-900 dark:text-white">
              {title || 'Dual Narration'}
            </h3>
            <p className="text-secondary-600 dark:text-secondary-400">
              Interactive conversation between narrator and expert
            </p>
          </div>
          <button 
            onClick={handleDownload}
            className="p-2 text-secondary-500 hover:text-primary-600 dark:text-secondary-400 dark:hover:text-primary-400"
            title="Download audio"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Waveform Visualization Placeholder */}
        <div className="waveform-container bg-secondary-100 dark:bg-secondary-700 h-24 rounded-lg">
          {/* Waveform visualization would go here */}
          <div className="h-full w-full flex items-center justify-center">
            <span className="text-secondary-500 dark:text-secondary-400">Audio Waveform</span>
          </div>
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
                onClick={() => handleSkip(-10)}
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
                onClick={() => handleSkip(10)}
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

        {/* Conversation Transcript */}
        {segments.length > 0 && (
          <div className="mt-6">
            <h4 className="text-lg font-medium text-secondary-900 dark:text-white mb-2">
              Conversation
            </h4>
            <div className="space-y-4 max-h-80 overflow-y-auto p-2">
              {segments.map((segment) => (
                <div 
                  key={segment.id}
                  onClick={() => jumpToSegment(segment)}
                  className={`flex items-start p-3 rounded-lg cursor-pointer transition-all ${
                    activeSegment && activeSegment.id === segment.id
                      ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800'
                      : 'hover:bg-secondary-50 dark:hover:bg-secondary-800/50'
                  }`}
                >
                  <div className={`flex-shrink-0 p-2 rounded-full ${
                    segment.role === 'narrator'
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                      : 'bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400'
                  }`}>
                    {segment.role === 'narrator' ? (
                      <UserIcon className="h-5 w-5" />
                    ) : (
                      <UserGroupIcon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-secondary-900 dark:text-white">
                      {segment.role === 'narrator' ? 'Narrator' : 'Expert'}
                    </p>
                    <p className="text-secondary-700 dark:text-secondary-300">
                      {segment.content}
                    </p>
                  </div>
                  {activeSegment && activeSegment.id === segment.id && (
                    <div className="flex-shrink-0 self-center">
                      <div className="h-2 w-2 bg-primary-500 rounded-full animate-pulse"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DualNarrationPlayer; 