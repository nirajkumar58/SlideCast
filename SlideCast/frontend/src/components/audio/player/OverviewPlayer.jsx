import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { 
  PlayIcon, 
  PauseIcon, 
  BackwardIcon, 
  ForwardIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/solid';

const OverviewPlayer = forwardRef(({ audioUrl, title, transcript }, ref) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [usingSpeechSynthesis, setUsingSpeechSynthesis] = useState(false);
  const [speechSynthesisAvailable, setSpeechSynthesisAvailable] = useState(false);
  const [voices, setVoices] = useState([]);
  const [currentVoiceIndex, setCurrentVoiceIndex] = useState(0);
  
  const audioRef = useRef(null);
  const progressBarRef = useRef(null);
  const utteranceRef = useRef(null);
  
  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    play: () => {
      if (usingSpeechSynthesis) {
        speakText();
      } else if (audioRef.current) {
        audioRef.current.play();
        setIsPlaying(true);
      }
    },
    pause: () => {
      if (usingSpeechSynthesis) {
        window.speechSynthesis.pause();
        setIsPlaying(false);
      } else if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    },
    stop: () => {
      if (usingSpeechSynthesis) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
      } else if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlaying(false);
        setCurrentTime(0);
      }
    }
  }));
  
  // Check for speech synthesis availability
  useEffect(() => {
    if (!audioUrl && window.speechSynthesis) {
      setSpeechSynthesisAvailable(true);
      setUsingSpeechSynthesis(true);
      
      // Load available voices
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        if (availableVoices.length > 0) {
          // Filter for English voices
          const englishVoices = availableVoices.filter(voice => 
            voice.lang.startsWith('en')
          );
          
          setVoices(englishVoices.length > 0 ? englishVoices : availableVoices);
          console.log('Loaded', englishVoices.length, 'English voices');
        }
      };
      
      // Chrome loads voices asynchronously
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
      
      loadVoices();
    }
  }, [audioUrl]);

  useEffect(() => {
    if (audioRef.current && !usingSpeechSynthesis) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted, usingSpeechSynthesis]);

  // Add effect to handle audio URL changes
  useEffect(() => {
    if (audioUrl && audioRef.current) {
      // Reset states when audio URL changes
      setCurrentTime(0);
      setDuration(0);
      
      // Force reload the audio element
      audioRef.current.load();
      
      // Set up event listeners
      const handleDurationChange = () => {
        if (audioRef.current && audioRef.current.duration && !isNaN(audioRef.current.duration)) {
          console.log('Audio duration loaded:', audioRef.current.duration);
          setDuration(audioRef.current.duration);
        }
      };
      
      const handleTimeUpdate = () => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
        }
      };
      
      audioRef.current.addEventListener('loadedmetadata', handleDurationChange);
      audioRef.current.addEventListener('durationchange', handleDurationChange);
      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      
      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('loadedmetadata', handleDurationChange);
          audioRef.current.removeEventListener('durationchange', handleDurationChange);
          audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        }
      };
    }
  }, [audioUrl]);

  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds) || timeInSeconds === Infinity) return '--:--';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handlePlayPause = () => {
    if (usingSpeechSynthesis) {
      if (isPlaying) {
        window.speechSynthesis.pause();
        setIsPlaying(false);
      } else {
        if (utteranceRef.current) {
          window.speechSynthesis.resume();
        } else {
          speakText();
        }
        setIsPlaying(true);
      }
    } else if (audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play();
        setIsPlaying(true);
      } else {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleProgressClick = (event) => {
    if (!usingSpeechSynthesis && audioRef.current && progressBarRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const pos = (event.clientX - rect.left) / rect.width;
      audioRef.current.currentTime = pos * audioRef.current.duration;
    }
  };

  const handleVolumeChange = (event) => {
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);
    if (audioRef.current && !usingSpeechSynthesis) {
      audioRef.current.volume = isMuted ? 0 : newVolume;
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current && !usingSpeechSynthesis) {
      audioRef.current.volume = !isMuted ? 0 : volume;
    }
  };

  const handleSkip = (direction) => {
    if (!usingSpeechSynthesis && audioRef.current) {
      audioRef.current.currentTime += direction * 10; // Skip 10 seconds
    }
  };
  
  const speakText = () => {
    if (!speechSynthesisAvailable) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    // Create a new utterance
    const text = Array.isArray(transcript) 
      ? transcript.map(segment => segment.text).join(' ') 
      : typeof transcript === 'string' 
        ? transcript 
        : title;
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set voice if available
    if (voices.length > 0) {
      utterance.voice = voices[currentVoiceIndex];
    }
    
    // Set properties
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = isMuted ? 0 : volume;
    
    // Set event handlers
    utterance.onstart = () => {
      setIsPlaying(true);
    };
    
    utterance.onend = () => {
      setIsPlaying(false);
      utteranceRef.current = null;
    };
    
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsPlaying(false);
      utteranceRef.current = null;
    };
    
    // Store reference to current utterance
    utteranceRef.current = utterance;
    
    // Speak
    window.speechSynthesis.speak(utterance);
  };
  
  const changeVoice = () => {
    if (voices.length > 0) {
      const newIndex = (currentVoiceIndex + 1) % voices.length;
      setCurrentVoiceIndex(newIndex);
      
      // If currently speaking, restart with new voice
      if (isPlaying) {
        window.speechSynthesis.cancel();
        setTimeout(() => speakText(), 50);
      }
    }
  };

  const handleDownload = () => {
    // Create a temporary anchor element
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `${title || 'audio-overview'}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-md p-6">
      <div className="space-y-6">
        {/* Audio Element */}
        {!usingSpeechSynthesis && audioUrl && (
          <audio
            ref={audioRef}
            src={audioUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
            preload="metadata"
          />
        )}

        {/* Title */}
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-secondary-900 dark:text-white">
            {title || 'Audio Overview'}
          </h3>
          <button 
            onClick={handleDownload}
            className="p-2 text-secondary-500 hover:text-primary-600 dark:text-secondary-400 dark:hover:text-primary-400"
            title="Download audio"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Waveform Visualization Placeholder */}
        <div className="bg-secondary-100 dark:bg-secondary-700 h-24 rounded-lg">
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
            className="relative h-2 bg-secondary-200 dark:bg-secondary-700 rounded-full overflow-hidden cursor-pointer"
            onClick={handleProgressClick}
          >
            <div
              className="absolute h-full bg-primary-500 transition-all duration-100"
              style={{ width: `${usingSpeechSynthesis ? (isPlaying ? 50 : 0) : (duration ? (currentTime / duration) * 100 : 0)}%` }}
            />
          </div>

          {/* Time Display */}
          <div className="flex justify-between text-sm text-secondary-600 dark:text-secondary-400">
            <span>{usingSpeechSynthesis ? '0:00' : formatTime(currentTime)}</span>
            <span>{usingSpeechSynthesis ? '--:--' : formatTime(duration)}</span>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
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
                if (audioRef.current) {
                  audioRef.current.playbackRate = parseFloat(e.target.value);
                }
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

        {/* Speech synthesis indicator */}
        {usingSpeechSynthesis && (
          <div className="mt-2 text-xs text-secondary-500 dark:text-secondary-400 text-center">
            {isPlaying ? 'Speaking...' : 'Using browser speech synthesis'}
          </div>
        )}

        {/* Transcript */}
        {transcript && (
          <div className="mt-6">
            <h4 className="text-lg font-medium text-secondary-900 dark:text-white mb-2">
              Transcript
            </h4>
            <div className="bg-secondary-50 dark:bg-secondary-800 p-4 rounded-lg max-h-60 overflow-y-auto">
              {Array.isArray(transcript) ? (
                <div className="space-y-4">
                  {transcript.map((segment, index) => (
                    <div key={index} className="transcript-segment">
                      <div className="font-medium text-primary-600 dark:text-primary-400 mb-1">
                        {segment.role || 'Speaker'}:
                      </div>
                      <p className="text-secondary-700 dark:text-secondary-300">
                        {segment.text}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-secondary-700 dark:text-secondary-300 whitespace-pre-line">
                  {transcript}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default OverviewPlayer; 