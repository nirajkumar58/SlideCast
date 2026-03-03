import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProcessing } from '../../context/ProcessingContext';
import {
  PlayIcon,
  PauseIcon,
  BackwardIcon,
  ForwardIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  LightBulbIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/solid';
import { synthesizeSegment, synthesizeTranscript } from '../../utils/googleTts';
import OverviewPlayer from './player/OverviewPlayer';

// Add CSS for notification animation
const notificationStyle = `
  @keyframes fadeInOut {
    0% { opacity: 0; transform: translateY(-20px); }
    10% { opacity: 1; transform: translateY(0); }
    90% { opacity: 1; transform: translateY(0); }
    100% { opacity: 0; transform: translateY(-20px); }
  }
  .notification {
    position: fixed;
    top: 1rem;
    right: 1rem;
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    color: white;
    z-index: 50;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    animation: fadeInOut 3s ease-in-out forwards;
  }
  .notification-success {
    background-color: #3b82f6;
  }
  .notification-error {
    background-color: #ef4444;
  }
  .notification-warning {
    background-color: #f59e0b;
  }
  
  .notes-container {
    background-color: white;
    border-radius: 0.75rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    padding: 1rem;
    height: 100%;
  }
  
  .notes-container.dark {
    background-color: #1f2937;
    color: #f3f4f6;
  }
  
  .note-item {
    padding: 0.5rem;
    margin-bottom: 0.5rem;
    border-radius: 0.5rem;
    background-color: #f9fafb;
    border-left: 3px solid #3b82f6;
  }
  
  .note-item.dark {
    background-color: #374151;
  }
`;

function base64ToArrayBuffer(base64) {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function AudioPlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getContent, setProcessing } = useProcessing();
  const [audioData, setAudioData] = useState(null);
  const [transcript, setTranscript] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [title, setTitle] = useState('Audio Overview');
  const [useWebSpeech, setUseWebSpeech] = useState(false);
  
  // Add a ref for the OverviewPlayer component
  const overviewPlayerRef = useRef(null);
  
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [hasAudioFailed, setHasAudioFailed] = useState(false);
  const [webSpeechSupported, setWebSpeechSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoices, setSelectedVoices] = useState({
    narrator: null,
    expert: null
  });
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [webSpeechAudioUrl, setWebSpeechAudioUrl] = useState(null);
  const audioRef = useRef(null);
  const progressBarRef = useRef(null);
  const speechSynthesisRef = useRef(null);
  const audioContextRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [webSpeechDuration, setWebSpeechDuration] = useState(0);
  const [webSpeechCurrentTime, setWebSpeechCurrentTime] = useState(0);
  const webSpeechTimerRef = useRef(null);
  const [speechPermissionGranted, setSpeechPermissionGranted] = useState(false);
  const [isUsingGoogleTTS, setIsUsingGoogleTTS] = useState(true);
  const [googleTTSAudio, setGoogleTTSAudio] = useState([]);
  const [googleTTSCurrentIndex, setGoogleTTSCurrentIndex] = useState(0);
  const [googleTTSProgress, setGoogleTTSProgress] = useState(0);
  const [isGeneratingGoogleTTS, setIsGeneratingGoogleTTS] = useState(false);
  const currentGoogleTTSAudioRef = useRef(null);
  const [likeStatus, setLikeStatus] = useState(null);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const moreOptionsRef = useRef(null);
  // Add new state for enhanced voice settings
  const [voiceSettings, setVoiceSettings] = useState({
    narrator: {
      voice: null,
      pitch: 1.0,
      rate: 1.0,
      style: 'newscast-casual'
    },
    expert: {
      voice: null,
      pitch: 0.9,
      rate: 0.95,
      style: 'newscast-formal'
    },
    host: {
      voice: null,
      pitch: 1.1,
      rate: 1.05,
      style: 'conversational'
    },
    guest: {
      voice: null,
      pitch: 0.95,
      rate: 1.0,
      style: 'conversational'
    }
  });
  const [notes, setNotes] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  // Add a new state for AI-generated notes
  const [aiNotes, setAiNotes] = useState([]);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  // First, add a new state variable for the summary
  const [aiSummary, setAiSummary] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // Add a useEffect to inject the CSS
  useEffect(() => {
    // Create a style element
    const styleElement = document.createElement('style');
    styleElement.textContent = notificationStyle;
    document.head.appendChild(styleElement);
    
    // Clean up on unmount
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Show notification function
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Check if Web Speech API is supported
  useEffect(() => {
    if ('speechSynthesis' in window) {
      setWebSpeechSupported(true);
      speechSynthesisRef.current = window.speechSynthesis;
      
      // Diagnostic function to check speech synthesis state
      const checkSpeechSynthesis = () => {
        try {
          console.log('Speech synthesis diagnostic check:');
          console.log('- speechSynthesis available:', typeof speechSynthesis !== 'undefined');
          console.log('- speechSynthesisRef.current:', !!speechSynthesisRef.current);
          
          if (speechSynthesisRef.current) {
            console.log('- pending:', speechSynthesisRef.current.pending);
            console.log('- speaking:', speechSynthesisRef.current.speaking);
            console.log('- paused:', speechSynthesisRef.current.paused);
            
            // We won't test with an utterance here as it might trigger the not-allowed error
            console.log('Speech synthesis initialized and ready');
          }
        } catch (error) {
          console.error('Speech synthesis diagnostic error:', error);
        }
      };
      
      // Run diagnostic check after a delay
      setTimeout(checkSpeechSynthesis, 2000);
      
      // Load available voices
    const loadVoices = () => {
        console.log('Loading voices...');
        
        // Force cancel any ongoing speech
        if (speechSynthesisRef.current) {
          speechSynthesisRef.current.cancel();
        }
        
        const voices = speechSynthesisRef.current.getVoices();
        console.log(`Loaded ${voices.length} voices`);
        
        if (voices.length > 0) {
          // Filter for English voices first
          const englishVoices = voices.filter(voice => voice.lang.startsWith('en-'));
          console.log(`Found ${englishVoices.length} English voices`);
          
          // Categorize voices by gender and accent
          const maleVoices = englishVoices.filter(v => 
            v.name.toLowerCase().includes('male') || 
            v.name.toLowerCase().includes('guy') ||
            v.name.toLowerCase().includes('james') ||
            v.name.toLowerCase().includes('david')
          );
          
          const femaleVoices = englishVoices.filter(v => 
            v.name.toLowerCase().includes('female') || 
            v.name.toLowerCase().includes('woman') ||
            v.name.toLowerCase().includes('girl') ||
            v.name.toLowerCase().includes('sarah') ||
            v.name.toLowerCase().includes('lisa')
          );
          
          // Assign voices based on typical podcast roles
          const newVoiceSettings = { ...voiceSettings };
          
          // Narrator: Clear, professional female voice
          newVoiceSettings.narrator.voice = femaleVoices.find(v => 
            v.name.toLowerCase().includes('professional') ||
            v.name.toLowerCase().includes('clear')
          ) || femaleVoices[0];
          
          // Expert: Authoritative male voice
          newVoiceSettings.expert.voice = maleVoices.find(v => 
            v.name.toLowerCase().includes('formal') ||
            v.name.toLowerCase().includes('professional')
          ) || maleVoices[0];
          
          // Host: Engaging female voice
          newVoiceSettings.host.voice = femaleVoices.find(v => 
            v.name.toLowerCase().includes('casual') ||
            v.name.toLowerCase().includes('friendly')
          ) || (femaleVoices[1] || femaleVoices[0]);
          
          // Guest: Different male voice
          newVoiceSettings.guest.voice = maleVoices.find(v => 
            v !== newVoiceSettings.expert.voice
          ) || (maleVoices[1] || maleVoices[0]);
          
          setVoiceSettings(newVoiceSettings);
          console.log('Voice settings updated:', newVoiceSettings);
        } else {
          console.warn('No voices available yet, will retry');
          // If no voices are available yet, we'll retry after a delay
          setTimeout(loadVoices, 500);
        }
      };
      
      // Chrome loads voices asynchronously
      if (typeof speechSynthesis !== 'undefined') {
        // Set up voice changed event
        speechSynthesis.onvoiceschanged = () => {
          console.log('Voices changed event fired');
    loadVoices();
        };
        
        // Initial load attempt
    loadVoices();
        
        // Retry loading voices after a short delay (helps in some browsers)
        setTimeout(loadVoices, 1000);
      }

    return () => {
        if (webSpeechTimerRef.current) {
          clearInterval(webSpeechTimerRef.current);
        }
        if (speechSynthesisRef.current) {
          speechSynthesisRef.current.cancel();
        }
      };
    } else {
      console.log('Web Speech API is not supported in this browser');
      setWebSpeechSupported(false);
    }
  }, []);

  // Add a function to log the content structure for debugging
  const logContentStructure = (data) => {
    if (!data) {
      console.log('No data provided to logContentStructure');
      return;
    }
    
    console.log('Content structure:');
    console.log('- Keys:', Object.keys(data));
    
    if (data.slides) {
      console.log('- Slides:', Array.isArray(data.slides) ? `Array with ${data.slides.length} items` : typeof data.slides);
      if (Array.isArray(data.slides) && data.slides.length > 0) {
        console.log('- First slide keys:', Object.keys(data.slides[0]));
      }
    }
    
    if (data.content) {
      console.log('- Content type:', typeof data.content);
      console.log('- Content length:', typeof data.content === 'string' ? data.content.length : 'not a string');
    }
    
    if (data.audioScript) {
      console.log('- AudioScript type:', typeof data.audioScript);
      console.log('- AudioScript length:', typeof data.audioScript === 'string' ? data.audioScript.length : 'not a string');
    }
    
    if (data.audioTranscript) {
      console.log('- AudioTranscript:', Array.isArray(data.audioTranscript) ? `Array with ${data.audioTranscript.length} items` : typeof data.audioTranscript);
    }
  };

  // Fetch content function
    const fetchContent = async () => {
      try {
      setIsLoading(true);
      setError(null);
      
        const data = await getContent(id);
        console.log('Fetched audio content:', data);
      
      // Log the content structure for debugging
      logContentStructure(data);
      
      // Check for specific error messages
      if (data.error && data.error.includes("Failed to generate script: 500 Internal Server Error")) {
        console.error('OpenAI service error detected');
        setError("We encountered an issue generating the script for this presentation. Our primary service (Perplexity AI) and fallback service (OpenAI) are both currently unavailable. Please try again later when the services are back online.");
        setHasAudioFailed(true);
        setIsLoading(false);
        return;
      }
        
        let audioUrl = null;
        let hasAudioFailed = false;
        
        // Handle the new combined audio format
        if (data.audioData && typeof data.audioData === 'string') {
          console.log('Using new combined audio format');
          const audioBuffer = base64ToArrayBuffer(data.audioData);
          const audioBlob = new Blob([audioBuffer], { type: data.mimeType || 'audio/mpeg' });
          audioUrl = URL.createObjectURL(audioBlob);
        } 
        // Handle the legacy format with array of audio segments
        else if (data.audioData && Array.isArray(data.audioData) && data.audioData.length > 0) {
          console.log('Using legacy audio format with segments');
          if (!data.audioData[0].audio) {
            console.log('Invalid audio data format, will use Web Speech API if available');
            hasAudioFailed = true;
          } else {
            const audioBuffer = base64ToArrayBuffer(data.audioData[0].audio);
            const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
            audioUrl = URL.createObjectURL(audioBlob);
          }
        } else {
          console.log('No audio data available, will use Web Speech API if available');
          hasAudioFailed = true;
        }
        
        // Process transcript data if needed
      let transcript = [];
      if (data.audioTranscript && Array.isArray(data.audioTranscript) && data.audioTranscript.length > 0) {
        transcript = data.audioTranscript;
      } else if (data.audioScript) {
        transcript = [{
              role: 'Narrator',
              text: data.audioScript
            }];
      } else if (data.content) {
        transcript = [{
              role: 'Narrator',
              text: data.content
            }];
          }
      
      // Extract original PowerPoint content if available
      let originalContent = null;
      if (data.originalContent) {
        originalContent = data.originalContent;
      } else if (data.slides) {
        originalContent = data.slides;
      } else if (data.extractedText) {
        originalContent = data.extractedText;
      } else if (data.rawText) {
        originalContent = data.rawText;
      }
      
      // If we have original content, add it to the data object
      if (originalContent) {
        data.pptContent = originalContent;
      }
      
      // Set title based on available data
      const title = data.title || data.filename || 'Audio Overview';
      
      // Update state with all the data
      setAudioData(data);
      setTranscript(transcript);
      setAudioUrl(audioUrl);
      setTitle(title);
        setHasAudioFailed(hasAudioFailed);
      setIsLoading(false);
      
      // Generate AI notes and summary
      generateAiNotes(data);
      generateAiSummary(data);
      
      } catch (error) {
      console.error('Error fetching content:', error);
      setError('Failed to load audio content. Please try again later.');
      setIsLoading(false);
    }
  };

  // Fetch content when component mounts
  useEffect(() => {
    fetchContent();
  }, [id]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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

  // Add these new functions for button actions
  const handleLike = () => {
    if (likeStatus === 'liked') {
      setLikeStatus(null);
      console.log('Like removed');
    } else {
      setLikeStatus('liked');
      console.log('Content liked');
      // If content was previously disliked, remove the dislike
      if (likeStatus === 'disliked') {
        console.log('Dislike removed');
      }
    }
  };

  const handleDislike = () => {
    if (likeStatus === 'disliked') {
      setLikeStatus(null);
      console.log('Dislike removed');
    } else {
      setLikeStatus('disliked');
      console.log('Content disliked');
      // If content was previously liked, remove the like
      if (likeStatus === 'liked') {
        console.log('Like removed');
      }
    }
  };

  const handleShare = () => {
    // Create a shareable link
    const shareableLink = window.location.href;
    
    // Try to use the Web Share API if available
    if (navigator.share) {
      navigator.share({
        title: audioData?.title?.replace(/\*\*/g, '') || 'Audio Presentation',
        text: 'Check out this audio presentation',
        url: shareableLink,
      })
        .then(() => console.log('Successful share'))
        .catch((error) => {
          console.log('Error sharing:', error);
          // Fallback to clipboard if Web Share API fails
          copyToClipboard(shareableLink);
        });
    } else {
      // Fallback: copy to clipboard
      copyToClipboard(shareableLink);
    }
  };

  // Helper function to copy to clipboard with visual feedback
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        showNotification('Link copied to clipboard!', 'success');
      })
      .catch(err => {
        console.error('Failed to copy link: ', err);
        showNotification('Could not copy link to clipboard. Please copy the URL manually.', 'error');
      });
  };

  // Handle clicking outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (moreOptionsRef.current && !moreOptionsRef.current.contains(event.target)) {
        setShowMoreOptions(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [moreOptionsRef]);

  const handleMoreOptions = () => {
    setShowMoreOptions(!showMoreOptions);
  };

  const handleReport = () => {
    showNotification('Content reported. Thank you for your feedback.', 'success');
    setShowMoreOptions(false);
  };

  const handleAddToPlaylist = () => {
    showNotification('Added to your playlist', 'success');
    setShowMoreOptions(false);
  };

  // Web Speech API functions
  const speakTranscript = () => {
    // Always use Google TTS
    toggleGoogleTTSAudio();
  };
  
  // Function to detect role from content
  const detectRole = (text) => {
    const lowerText = text.toLowerCase();
    
    // Check for expert indicators
    if (
      lowerText.includes('research shows') ||
      lowerText.includes('studies indicate') ||
      lowerText.includes('according to') ||
      lowerText.includes('evidence suggests') ||
      lowerText.includes('analysis') ||
      lowerText.includes('data shows') ||
      lowerText.match(/\d+%/) || // Contains percentages
      lowerText.match(/\d+ percent/) ||
      lowerText.match(/\(\d{4}\)/) // Contains years in parentheses
    ) {
      return 'expert';
    }
    
    // Check for host/interviewer indicators
    if (
      lowerText.includes('tell us about') ||
      lowerText.includes('what do you think') ||
      lowerText.includes('could you explain') ||
      lowerText.includes('let\'s discuss') ||
      lowerText.includes('interesting point') ||
      lowerText.endsWith('?')
    ) {
      return 'host';
    }
    
    // Check for guest indicators
    if (
      lowerText.includes('in my experience') ||
      lowerText.includes('i believe') ||
      lowerText.includes('from my perspective') ||
      lowerText.includes('i think')
    ) {
      return 'guest';
    }
    
    // Default to narrator
    return 'narrator';
  };

  // Enhanced voice loading function
  const loadVoices = () => {
    console.log('Loading voices...');
    
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
    }
    
    const voices = speechSynthesisRef.current.getVoices();
    console.log(`Loaded ${voices.length} voices`);
    
    if (voices.length > 0) {
      // Filter for English voices first
      const englishVoices = voices.filter(voice => voice.lang.startsWith('en-'));
      console.log(`Found ${englishVoices.length} English voices`);
      
      // Categorize voices by gender and accent
      const maleVoices = englishVoices.filter(v => 
        v.name.toLowerCase().includes('male') || 
        v.name.toLowerCase().includes('guy') ||
        v.name.toLowerCase().includes('james') ||
        v.name.toLowerCase().includes('david')
      );
      
      const femaleVoices = englishVoices.filter(v => 
        v.name.toLowerCase().includes('female') || 
        v.name.toLowerCase().includes('woman') ||
        v.name.toLowerCase().includes('girl') ||
        v.name.toLowerCase().includes('sarah') ||
        v.name.toLowerCase().includes('lisa')
      );
      
      // Assign voices based on typical podcast roles
      const newVoiceSettings = { ...voiceSettings };
      
      // Narrator: Clear, professional female voice
      newVoiceSettings.narrator.voice = femaleVoices.find(v => 
        v.name.toLowerCase().includes('professional') ||
        v.name.toLowerCase().includes('clear')
      ) || femaleVoices[0];
      
      // Expert: Authoritative male voice
      newVoiceSettings.expert.voice = maleVoices.find(v => 
        v.name.toLowerCase().includes('formal') ||
        v.name.toLowerCase().includes('professional')
      ) || maleVoices[0];
      
      // Host: Engaging female voice
      newVoiceSettings.host.voice = femaleVoices.find(v => 
        v.name.toLowerCase().includes('casual') ||
        v.name.toLowerCase().includes('friendly')
      ) || (femaleVoices[1] || femaleVoices[0]);
      
      // Guest: Different male voice
      newVoiceSettings.guest.voice = maleVoices.find(v => 
        v !== newVoiceSettings.expert.voice
      ) || (maleVoices[1] || maleVoices[0]);
      
      setVoiceSettings(newVoiceSettings);
      console.log('Voice settings updated:', newVoiceSettings);
    }
  };

  // Enhanced speak segment function
  const speakSegment = async (index) => {
    try {
      if (!webSpeechSupported || !isSpeaking) {
        return;
      }
      
      const transcript = audioData.audioTranscript;
      if (!transcript || !Array.isArray(transcript) || index >= transcript.length) {
        setIsSpeaking(false);
        if (webSpeechTimerRef.current) {
          clearInterval(webSpeechTimerRef.current);
        }
        setCurrentSegmentIndex(0);
        return;
      }
      
      const segment = transcript[index];
      if (!segment || !segment.text) {
        if (index < transcript.length - 1) {
          setTimeout(() => speakSegment(index + 1), 100);
        }
        return;
      }
      
      // Detect role if not explicitly set
      const role = segment.role?.toLowerCase() || detectRole(segment.text);
      const settings = voiceSettings[role] || voiceSettings.narrator;
      
      console.log(`Speaking segment ${index} as ${role}`);
      
      const utterance = new SpeechSynthesisUtterance(segment.text);
      
      // Apply voice settings
      if (settings.voice) {
        utterance.voice = settings.voice;
        utterance.pitch = settings.pitch;
        utterance.rate = settings.rate;
        utterance.volume = 1.0;
      }
      
      // Add natural pauses for better pacing
      const punctuationPauses = {
        '.': 800,
        '!': 800,
        '?': 800,
        ',': 400,
        ';': 600,
        ':': 600
      };
      
      // Add pauses after punctuation
      let textWithPauses = segment.text;
      Object.entries(punctuationPauses).forEach(([punct, pause]) => {
        textWithPauses = textWithPauses.replace(
          new RegExp(`\\${punct}\\s`, 'g'), 
          `${punct} <break time="${pause}ms"/> `
        );
      });
      
      utterance.text = textWithPauses;
      
      // Event handlers
      utterance.onstart = () => {
        console.log(`Started speaking segment ${index} as ${role}`);
        setCurrentSegmentIndex(index);
      };
      
      utterance.onend = () => {
        if (isSpeaking && index < transcript.length - 1) {
          setTimeout(() => speakSegment(index + 1), 800); // Add pause between segments
        } else if (index >= transcript.length - 1) {
          setIsSpeaking(false);
          if (webSpeechTimerRef.current) {
            clearInterval(webSpeechTimerRef.current);
          }
          setCurrentSegmentIndex(0);
        }
      };
      
      utterance.onerror = (event) => {
        console.error(`Speech error in segment ${index}:`, event);
        if (event.error === 'not-allowed') {
          showNotification('Please click on the page to enable speech synthesis', 'warning');
        }
        if (index < transcript.length - 1) {
          setTimeout(() => speakSegment(index + 1), 500);
        }
      };
      
      speechSynthesisRef.current.speak(utterance);
      
    } catch (error) {
      console.error('Error in speakSegment:', error);
      if (index < transcript.length - 1) {
        setTimeout(() => speakSegment(index + 1), 500);
      }
    }
  };

  // Update the transcript display to show role icons
  const getRoleIcon = (role) => {
    switch(role.toLowerCase()) {
      case 'expert':
        return (
          <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
        );
      case 'host':
        return (
          <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        );
      case 'guest':
        return (
          <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
        );
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (webSpeechTimerRef.current) {
        clearInterval(webSpeechTimerRef.current);
      }
      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.cancel();
      }
      if (currentGoogleTTSAudioRef.current) {
        currentGoogleTTSAudioRef.current.pause();
        currentGoogleTTSAudioRef.current = null;
      }
      // Clean up any Google TTS audio elements
      if (googleTTSAudio.length > 0) {
        googleTTSAudio.forEach(audio => {
          if (audio && audio.pause) {
            audio.pause();
            audio.src = '';
          }
        });
      }
    };
  }, [googleTTSAudio]);

  // Update the audio player display for Web Speech
  const getDisplayTime = () => {
    if (!hasAudioFailed) {
      return {
        current: formatTime(currentTime),
        total: formatTime(duration)
      };
    } else if (webSpeechSupported && webSpeechDuration > 0) {
      return {
        current: formatTime(webSpeechCurrentTime),
        total: formatTime(webSpeechDuration)
      };
    }
    return { current: '0:00', total: '0:00' };
  };

  // Generate and record audio for download
  const generateDownloadableAudio = async () => {
    if (!webSpeechSupported || !audioData?.audioTranscript || isGeneratingAudio) return;
    
    setIsGeneratingAudio(true);
    
    try {
      // Create audio context and nodes
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const merger = audioContext.createChannelMerger(2);
      const audioDestination = audioContext.createMediaStreamDestination();
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 1.0;
      
      // Connect nodes
      merger.connect(gainNode);
      gainNode.connect(audioDestination);
      
      // Create media recorder
      const mediaRecorder = new MediaRecorder(audioDestination.stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      });
      
      const audioChunks = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        if (audioChunks.length > 0) {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm;codecs=opus' });
          const url = URL.createObjectURL(audioBlob);
          setWebSpeechAudioUrl(url);
        }
        setIsGeneratingAudio(false);
      };
      
      // Start recording
      mediaRecorder.start(100);
      
      // Create a silent oscillator to keep the audio context active
      const oscillator = audioContext.createOscillator();
      oscillator.frequency.value = 0;
      oscillator.connect(merger);
      oscillator.start();
      
      // Process each segment
      const transcript = audioData.audioTranscript;
      for (let i = 0; i < transcript.length; i++) {
        const segment = transcript[i];
        await new Promise((resolve, reject) => {
          const utterance = new SpeechSynthesisUtterance(segment.text);
          
          // Set voice and properties
          if (segment.role.toLowerCase() === 'narrator') {
            utterance.voice = selectedVoices.narrator;
            utterance.pitch = 1.1;
            utterance.rate = 1.0;
          } else if (segment.role.toLowerCase() === 'expert') {
            utterance.voice = selectedVoices.expert;
            utterance.pitch = 0.9;
            utterance.rate = 0.95;
          }
          
          // Handle speech events
          utterance.onstart = () => {
            // Create an audio element when speech starts
            const audio = new Audio();
            const source = audioContext.createMediaElementSource(audio);
            source.connect(merger);
          };
          
          utterance.onend = () => {
            setTimeout(resolve, 500); // Add a small pause between segments
          };
          
          utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            reject(event);
          };
          
          speechSynthesisRef.current.speak(utterance);
        });
      }
      
      // Ensure all audio is captured
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Stop recording and cleanup
      oscillator.stop();
      mediaRecorder.stop();
      
      // Close audio context after a short delay to ensure all data is captured
      setTimeout(() => {
        audioContext.close();
      }, 500);
      
      } catch (error) {
      console.error('Error generating downloadable audio:', error);
      setIsGeneratingAudio(false);
      
      // Show error message to user
      setError('Failed to generate audio. Please try again.');
    }
  };

  const handleVoiceChange = (role, voiceIndex) => {
    const voice = availableVoices[voiceIndex];
    console.log(`Changing ${role} voice to:`, voice ? voice.name : 'none');
    
    setSelectedVoices(prev => ({
      ...prev,
      [role]: voice
    }));
    
    // If we're currently speaking, restart with the new voice
    if (isSpeaking) {
      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.cancel();
      }
      setIsSpeaking(false);
      if (webSpeechTimerRef.current) {
        clearInterval(webSpeechTimerRef.current);
      }
      setWebSpeechCurrentTime(0);
      
      // Restart speech after a short delay to allow state to update
      setTimeout(() => {
        speakTranscript();
      }, 100);
    }
  };

  const downloadAudio = () => {
    try {
      showNotification('Preparing download...', 'success');
      
      if (isUsingGoogleTTS && googleTTSAudio.length > 0) {
        // For Google TTS, we need to combine all the audio segments
        // This requires Web Audio API to concatenate the audio files
        downloadGoogleTTSAudio()
          .then(() => {
            showNotification('Download started!', 'success');
          })
          .catch(error => {
            console.error('Download error:', error);
            showNotification('Download failed. Please try again.', 'error');
          });
      } else if (webSpeechAudioUrl) {
        const a = document.createElement('a');
        a.href = webSpeechAudioUrl;
        a.download = `${audioData?.title || 'audio-presentation'}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        showNotification('Download started!', 'success');
      } else if (audioData?.audioUrl) {
        const a = document.createElement('a');
        a.href = audioData.audioUrl;
        a.download = `${audioData?.title || 'audio-presentation'}.mp3`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        showNotification('Download started!', 'success');
        } else {
        // No audio available
        showNotification('No audio available to download', 'warning');
        }
      } catch (error) {
      console.error('Download error:', error);
      showNotification('Failed to download audio. Please try again.', 'error');
    }
  };

  // Function to download Google TTS audio
  const downloadGoogleTTSAudio = async () => {
    if (!googleTTSAudio || googleTTSAudio.length === 0) {
      return Promise.reject(new Error('No Google TTS audio available'));
    }
    
    return new Promise(async (resolve, reject) => {
      try {
        setIsGeneratingAudio(true);
        
        // Create a new audio context
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Fetch all audio files and decode them
        const audioBuffers = await Promise.all(
          googleTTSAudio.map(async (audio) => {
            // Get the source URL from the audio element
            const src = audio.src;
            
            // Fetch the audio data
            const response = await fetch(src);
            const arrayBuffer = await response.arrayBuffer();
            
            // Decode the audio data
            return await audioContext.decodeAudioData(arrayBuffer);
          })
        );
        
        // Calculate the total duration
        const totalDuration = audioBuffers.reduce((acc, buffer) => acc + buffer.duration, 0);
        
        // Create a buffer with enough space for all audio
        const combinedBuffer = audioContext.createBuffer(
          2, // Stereo
          audioContext.sampleRate * totalDuration,
          audioContext.sampleRate
        );
        
        // Copy each buffer into the combined buffer
        let offset = 0;
        for (const buffer of audioBuffers) {
          // Get the channel data
          const leftChannel = buffer.getChannelData(0);
          const rightChannel = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : buffer.getChannelData(0);
          
          // Copy the channel data to the combined buffer
          combinedBuffer.getChannelData(0).set(leftChannel, offset);
          combinedBuffer.getChannelData(1).set(rightChannel, offset);
          
          // Update the offset
          offset += buffer.length;
        }
        
        // Create a buffer source
        const source = audioContext.createBufferSource();
        source.buffer = combinedBuffer;
        
        // Create a media stream destination
        const destination = audioContext.createMediaStreamDestination();
        source.connect(destination);
        
        // Create a media recorder
        const mediaRecorder = new MediaRecorder(destination.stream, {
          mimeType: 'audio/webm;codecs=opus',
          audioBitsPerSecond: 128000
        });
        
        const chunks = [];
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };
        
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/webm;codecs=opus' });
          const url = URL.createObjectURL(blob);
          
          // Create a download link
          const a = document.createElement('a');
          a.href = url;
          a.download = `${audioData?.title || 'google-tts-audio'}.webm`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          
          // Clean up
          URL.revokeObjectURL(url);
          setIsGeneratingAudio(false);
          resolve();
        };
        
        // Start recording and playing
        mediaRecorder.start();
        source.start();
        
        // Stop recording when the audio finishes
        source.onended = () => {
          mediaRecorder.stop();
          audioContext.close();
        };
        
        // Set a timeout to stop recording if it doesn't end naturally
        setTimeout(() => {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            audioContext.close();
          }
        }, (totalDuration * 1000) + 1000); // Add 1 second buffer
        
      } catch (error) {
        console.error('Error downloading Google TTS audio:', error);
        setIsGeneratingAudio(false);
        reject(error);
      }
    });
  };

  // Function to request speech synthesis permission
  const requestSpeechPermission = () => {
    try {
      // Try to speak a silent utterance to request permission
      const permissionUtterance = new SpeechSynthesisUtterance('');
      permissionUtterance.volume = 0; // Silent
      permissionUtterance.onend = () => {
        console.log('Permission utterance completed successfully');
        setSpeechPermissionGranted(true);
      };
      permissionUtterance.onerror = (event) => {
        console.error('Permission utterance error:', event);
        alert('Could not enable speech synthesis. Please try again or check your browser settings.');
      };
      
      // Cancel any ongoing speech first
      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.cancel();
      }
      
      // Speak the permission utterance
      speechSynthesisRef.current.speak(permissionUtterance);
    } catch (error) {
      console.error('Error requesting speech permission:', error);
      alert('Could not enable speech synthesis. Please try again or check your browser settings.');
    }
  };

  // Google TTS functions
  const generateGoogleTTSAudio = async () => {
    if (!audioData?.audioTranscript || isGeneratingGoogleTTS) return;
    
    setIsGeneratingGoogleTTS(true);
    setGoogleTTSProgress(0);
    
    try {
      // Clear any existing audio
      if (currentGoogleTTSAudioRef.current) {
        currentGoogleTTSAudioRef.current.pause();
        currentGoogleTTSAudioRef.current = null;
      }
      
      setGoogleTTSAudio([]);
      
      // Generate audio for each segment
      const audioElements = await synthesizeTranscript(
        audioData.audioTranscript,
        (progress) => {
          setGoogleTTSProgress(progress);
        },
        (audioElements) => {
          setGoogleTTSAudio(audioElements);
          setIsGeneratingGoogleTTS(false);
          
          // Start playing if we have audio elements
          if (audioElements.length > 0) {
            playGoogleTTSAudio(0);
          } else {
            // If no audio elements were generated, show a message
            showNotification('No audio could be generated. Using browser speech synthesis instead.', 'warning');
            // Fall back to browser speech synthesis
            if (webSpeechSupported) {
              setTimeout(() => {
                setIsSpeaking(true);
                speakSegment(0);
              }, 1000);
            }
          }
        },
        (error) => {
          console.error('Error generating Google TTS audio:', error);
          setIsGeneratingGoogleTTS(false);
          showNotification('Failed to generate audio using Google TTS. Using browser speech synthesis instead.', 'warning');
          
          // Fall back to browser speech synthesis
          if (webSpeechSupported) {
            setTimeout(() => {
              setIsSpeaking(true);
              speakSegment(0);
            }, 1000);
          } else {
            showNotification('Speech synthesis is not supported in your browser.', 'error');
          }
        }
      );
      
    } catch (error) {
      console.error('Error in generateGoogleTTSAudio:', error);
      setIsGeneratingGoogleTTS(false);
      showNotification('Failed to generate audio. Please try again later.', 'error');
      
      // Fall back to browser speech synthesis
      if (webSpeechSupported) {
        setTimeout(() => {
          setIsSpeaking(true);
          speakSegment(0);
        }, 1000);
      }
    }
  };
  
  const playGoogleTTSAudio = (index) => {
    if (!googleTTSAudio || googleTTSAudio.length === 0 || index >= googleTTSAudio.length) {
      return;
    }
    
    // Stop any currently playing audio
    if (currentGoogleTTSAudioRef.current) {
      currentGoogleTTSAudioRef.current.pause();
    }
    
    // Set the current segment index for highlighting
    setCurrentSegmentIndex(index);
    setGoogleTTSCurrentIndex(index);
    
    // Get the audio element for this segment
    const audio = googleTTSAudio[index];
    currentGoogleTTSAudioRef.current = audio;
    
    // Set up event handlers
    audio.onended = () => {
      // Play the next segment when this one ends
      if (index < googleTTSAudio.length - 1) {
        playGoogleTTSAudio(index + 1);
      } else {
        // End of transcript
        setCurrentSegmentIndex(0);
        setGoogleTTSCurrentIndex(0);
        currentGoogleTTSAudioRef.current = null;
        setIsSpeaking(false);
      }
    };
    
    // Start playing
    audio.play().catch(error => {
      console.error('Error playing Google TTS audio:', error);
      
      // Try to continue with the next segment
      if (index < googleTTSAudio.length - 1) {
        setTimeout(() => {
          playGoogleTTSAudio(index + 1);
        }, 500);
      }
    });
  };
  
  const stopGoogleTTSAudio = () => {
    if (currentGoogleTTSAudioRef.current) {
      currentGoogleTTSAudioRef.current.pause();
      currentGoogleTTSAudioRef.current = null;
    }
    
    setCurrentSegmentIndex(0);
    setGoogleTTSCurrentIndex(0);
    setIsSpeaking(false);
  };
  
  const toggleGoogleTTSAudio = () => {
    if (isSpeaking) {
      stopGoogleTTSAudio();
    } else {
      if (googleTTSAudio.length > 0) {
        setIsSpeaking(true);
        playGoogleTTSAudio(0);
      } else {
        generateGoogleTTSAudio();
      }
    }
  };

  // Check for dark mode
  useEffect(() => {
    const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(isDark);
    
    // Listen for changes in color scheme
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Generate notes from original content
  useEffect(() => {
    if (audioData) {
      console.log('AudioData available for notes generation');
      logContentStructure(audioData);
      // Try to generate AI-powered notes first
      generateAiNotes(audioData);
    }
  }, [audioData]);

  // Function to generate AI-powered notes using Perplexity AI
  const generateAiNotes = async (content) => {
    if (!content || isGeneratingNotes) return;
    
    setIsGeneratingNotes(true);
    showNotification('Generating AI-powered notes...', 'success');
    
    try {
      // Extract the transcript content from the data
      let transcriptContent = '';
      
      // First check if we have a transcript array
      if (content.audioTranscript && Array.isArray(content.audioTranscript) && content.audioTranscript.length > 0) {
        console.log('Using audioTranscript for notes generation');
        transcriptContent = content.audioTranscript
          .map(segment => segment.text || '')
          .join('\n\n');
      } 
      // Then check for audioScript
      else if (content.audioScript) {
        console.log('Using audioScript for notes generation');
        transcriptContent = content.audioScript;
      }
      // Then check for other content sources
      else if (content.pptContent) {
        console.log('Using pptContent for notes generation');
        if (Array.isArray(content.pptContent)) {
          transcriptContent = content.pptContent.map(slide => {
            return slide.content || slide.text || '';
          }).join('\n\n');
        } else {
          transcriptContent = content.pptContent;
        }
      }
      else if (content.slides && Array.isArray(content.slides)) {
        console.log('Using slides array for notes generation');
        transcriptContent = content.slides.map(slide => {
          return slide.content || slide.text || '';
        }).join('\n\n');
      } 
      else if (content.originalContent) {
        console.log('Using originalContent for notes generation');
        transcriptContent = content.originalContent;
      }
      else if (content.content) {
        console.log('Using content field for notes generation');
        transcriptContent = content.content;
      }
      
      console.log('Content available for notes generation:', !!transcriptContent);
      
      if (!transcriptContent) {
        console.error('No content found in:', Object.keys(content));
        
        // Try direct extraction as a fallback
        const extractedNotes = extractNotesDirectly(content);
        if (extractedNotes.length > 0) {
          setAiNotes(extractedNotes);
          showNotification('Generated notes from available content', 'success');
          setIsGeneratingNotes(false);
          return;
        }
        
        showNotification('No content available to generate notes from', 'warning');
        setIsGeneratingNotes(false);
        return;
      }
      
      // Make a request to the backend to generate notes using Perplexity AI
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const endpoint = apiUrl.endsWith('/api') ? '/audio/generate-notes' : '/api/audio/generate-notes';
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: transcriptContent,
          title: content.title || 'Presentation',
        }),
      });
      
      console.log('Notes API request sent to:', `${apiUrl}${endpoint}`);
      
      if (!response.ok) {
        throw new Error(`Failed to generate notes: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.notes && Array.isArray(data.notes)) {
        setAiNotes(data.notes);
        showNotification('AI-powered notes generated successfully!', 'success');
      } else {
        // If the API doesn't return notes in the expected format,
        // fall back to our local extraction method
        generateNotesFromContent(content);
        showNotification('Using locally extracted notes', 'warning');
      }
    } catch (error) {
      console.error('Error generating AI notes:', error);
      showNotification('Failed to generate AI notes, using local extraction', 'error');
      
      // Fall back to our local extraction method
      generateNotesFromContent(content);
    } finally {
      setIsGeneratingNotes(false);
    }
  };

  // Add a direct extraction function as a last resort
  const extractNotesDirectly = (data) => {
    const extractedNotes = [];
    
    // Try to extract from transcript if available
    if (data.audioTranscript && Array.isArray(data.audioTranscript)) {
      console.log('Extracting notes directly from transcript');
      
      // Get the first few segments
      const segments = data.audioTranscript.slice(0, Math.min(5, data.audioTranscript.length));
      
      segments.forEach(segment => {
        if (!segment.text) return;
        
        // Get the first sentence from each segment
        const firstSentence = segment.text.split(/[.!?]+/)[0].trim();
        if (firstSentence.length > 10 && firstSentence.length < 150) {
          extractedNotes.push(firstSentence);
        }
      });
    }
    
    // If we have a title, add it as a note
    if (extractedNotes.length < 3 && data.title) {
      extractedNotes.push(`Key topic: ${data.title.replace(/\*\*/g, '')}`);
    }
    
    return extractedNotes;
  };

  // Update the generateNotesFromContent function to ensure it works as a fallback
  const generateNotesFromContent = (data) => {
    console.log('Generating notes from content locally');
    
    // Initialize an empty array for notes
    const notes = [];
    
    try {
      // First try to extract from transcript if available
      if (data.audioTranscript && Array.isArray(data.audioTranscript) && data.audioTranscript.length > 0) {
        console.log('Extracting notes from audioTranscript');
        
        // Process each segment of the transcript
        data.audioTranscript.forEach(segment => {
          if (!segment.text) return;
          
          // Split text into sentences
          const sentences = segment.text.split(/[.!?]+/).filter(s => s.trim().length > 0);
          
          sentences.forEach(sentence => {
            // Check for key phrases that indicate important information
            const lowerSentence = sentence.toLowerCase();
            if (
              lowerSentence.includes('important') ||
              lowerSentence.includes('key') ||
              lowerSentence.includes('main') ||
              lowerSentence.includes('significant') ||
              lowerSentence.includes('essential') ||
              lowerSentence.includes('critical') ||
              lowerSentence.includes('fundamental') ||
              lowerSentence.includes('crucial') ||
              lowerSentence.includes('primary') ||
              lowerSentence.includes('major') ||
              lowerSentence.includes('highlight') ||
              lowerSentence.includes('takeaway') ||
              lowerSentence.includes('conclusion') ||
              lowerSentence.includes('in summary') ||
              lowerSentence.includes('to summarize')
            ) {
              // Add this as a note if not already included
              const cleanSentence = sentence.trim();
              if (cleanSentence.length > 10 && !notes.includes(cleanSentence)) {
                notes.push(cleanSentence);
              }
            }
          });
        });
      }
      
      // If we couldn't extract enough notes from the transcript, try to extract from title and content
      if (notes.length < 3) {
        console.log('Not enough notes from transcript, extracting from content');
        
        // Extract from title if available
        if (data.title && data.title !== 'Processing...' && !notes.includes(data.title)) {
          notes.push(`Topic: ${data.title}`);
        }
        
        // Try to extract from content if available
        let contentText = '';
        if (data.pptContent) {
          contentText = Array.isArray(data.pptContent) 
            ? data.pptContent.map(slide => slide.content || slide.text || '').join(' ') 
            : data.pptContent;
        } else if (data.content) {
          contentText = data.content;
        } else if (data.originalContent) {
          contentText = data.originalContent;
        }
        
        if (contentText) {
          // Split content into sentences and extract key ones
          const contentSentences = contentText.split(/[.!?]+/).filter(s => s.trim().length > 0);
          
          // Take the first few sentences that are long enough to be meaningful
          contentSentences.forEach(sentence => {
            const cleanSentence = sentence.trim();
            if (cleanSentence.length > 15 && !notes.includes(cleanSentence) && notes.length < 7) {
              notes.push(cleanSentence);
            }
          });
        }
      }
      
      // If we still don't have enough notes, add a fallback message
      if (notes.length === 0) {
        notes.push("No key points could be extracted from the content");
        notes.push("Try regenerating notes with AI");
      }
      
      console.log('Extracted notes:', notes);
      setAiNotes(notes);
      showNotification('Generated notes from content', 'success');
    } catch (error) {
      console.error('Error generating notes from content:', error);
      setAiNotes([
        "Failed to extract notes from content",
        "Try regenerating notes with AI"
      ]);
      showNotification('Failed to generate notes from content', 'error');
    }
  };

  // Update the regenerateNotes function to ensure it works properly
  const regenerateNotes = () => {
    if (isGeneratingNotes || !audioData) return;
    
    // Clear current notes
    setAiNotes([]);
    
    // Try to generate new AI notes
    showNotification('Regenerating notes...', 'info');
    generateAiNotes(audioData);
  };

  // Add a function to generate the summary
  const generateAiSummary = async (content) => {
    if (!content || isGeneratingSummary) return;
    
    setIsGeneratingSummary(true);
    showNotification('Generating AI-powered summary...', 'success');
    
    try {
      // Extract the transcript content from the data
      let transcriptContent = '';
      
      // First check if we have a transcript array
      if (content.audioTranscript && Array.isArray(content.audioTranscript) && content.audioTranscript.length > 0) {
        console.log('Using audioTranscript for summary generation');
        transcriptContent = content.audioTranscript
          .map(segment => segment.text || '')
          .join('\n\n');
      } 
      // Then check for audioScript
      else if (content.audioScript) {
        console.log('Using audioScript for summary generation');
        transcriptContent = content.audioScript;
      }
      // Then check for other content sources
      else if (content.pptContent) {
        console.log('Using pptContent for summary generation');
        if (Array.isArray(content.pptContent)) {
          transcriptContent = content.pptContent.map(slide => {
            return slide.content || slide.text || '';
          }).join('\n\n');
        } else {
          transcriptContent = content.pptContent;
        }
      }
      else if (content.slides && Array.isArray(content.slides)) {
        console.log('Using slides array for summary generation');
        transcriptContent = content.slides.map(slide => {
          return slide.content || slide.text || '';
        }).join('\n\n');
      } 
      else if (content.originalContent) {
        console.log('Using originalContent for summary generation');
        transcriptContent = content.originalContent;
      }
      else if (content.content) {
        console.log('Using content field for summary generation');
        transcriptContent = content.content;
      }
      
      console.log('Content available for summary generation:', !!transcriptContent);
      
      if (!transcriptContent) {
        console.error('No content found in:', Object.keys(content));
        showNotification('No content available to generate summary from', 'warning');
        setIsGeneratingSummary(false);
        return;
      }
      
      // Make a request to the backend to generate summary using Perplexity AI
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const endpoint = apiUrl.endsWith('/api') ? '/audio/generate-summary' : '/api/audio/generate-summary';
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: transcriptContent,
          title: content.title || 'Presentation',
        }),
      });
      
      console.log('Summary API request sent to:', `${apiUrl}${endpoint}`);
      
      if (!response.ok) {
        throw new Error(`Failed to generate summary: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.summary) {
        setAiSummary(data.summary);
        showNotification('AI-powered summary generated successfully!', 'success');
      } else {
        // If the API doesn't return summary in the expected format,
        // fall back to our local extraction method
        generateSummaryLocally(content);
        showNotification('Using locally generated summary', 'warning');
      }
    } catch (error) {
      console.error('Error generating AI summary:', error);
      showNotification('Failed to generate AI summary, using local extraction', 'error');
      
      // Fall back to our local extraction method
      generateSummaryLocally(content);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Add a function to generate summary locally
  const generateSummaryLocally = (data) => {
    console.log('Generating summary locally');
    
    try {
      let summary = '';
      
      // First try to extract from transcript if available
      if (data.audioTranscript && Array.isArray(data.audioTranscript) && data.audioTranscript.length > 0) {
        console.log('Extracting summary from audioTranscript');
        
        // Get the first few segments (introduction) and last few segments (conclusion)
        const introSegments = data.audioTranscript.slice(0, 3);
        const outroSegments = data.audioTranscript.slice(-2);
        
        const introText = introSegments
          .map(segment => segment.text || '')
          .join(' ')
          .trim();
        
        const outroText = outroSegments
          .map(segment => segment.text || '')
          .join(' ')
          .trim();
        
        // Create a more structured summary
        summary = `This presentation discusses ${data.title || 'the topic'}. \n\nIntroduction: ${introText}\n\nConclusion: ${outroText}`;
      } 
      // If no transcript, try to use title and content
      else if (data.title) {
        summary = `This presentation titled "${data.title}" discusses key concepts related to the topic.`;
        
        // Try to extract from content if available
        let contentText = '';
        if (data.pptContent) {
          contentText = Array.isArray(data.pptContent) 
            ? data.pptContent.map(slide => slide.content || slide.text || '').join(' ') 
            : data.pptContent;
        } else if (data.content) {
          contentText = data.content;
        } else if (data.originalContent) {
          contentText = data.originalContent;
        } else if (data.audioScript) {
          contentText = data.audioScript;
        }
        
        if (contentText) {
          // Take the first 300 characters as a preview
          const preview = contentText.substring(0, 300).trim();
          summary += `\n\nPreview: ${preview}...\n\nThis is a locally generated summary as the AI-powered summary generation is currently unavailable. Please try regenerating for a better summary.`;
        }
      } else {
        summary = "No content available to generate a summary. Please try regenerating with AI for better results.";
      }
      
      console.log('Generated local summary');
      setAiSummary(summary);
      showNotification('Generated summary from content', 'success');
    } catch (error) {
      console.error('Error generating summary locally:', error);
      setAiSummary("Failed to generate summary from content. Try regenerating with AI.");
      showNotification('Failed to generate summary from content', 'error');
    }
  };

  // Add a function to regenerate the summary
  const regenerateSummary = () => {
    if (isGeneratingSummary || !audioData) return;
    
    // Clear current summary
    setAiSummary('');
    
    // Try to generate new AI summary
    showNotification('Regenerating summary...', 'info');
    generateAiSummary(audioData);
  };

  // Add a useEffect to log when the summary changes
  useEffect(() => {
    console.log('AI Summary state updated:', aiSummary ? `${aiSummary.substring(0, 50)}...` : 'No summary');
  }, [aiSummary]);

  // Render loading state
  if (isLoading) {
      return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-pulse text-center">
          <div className="text-lg font-medium text-secondary-700 dark:text-secondary-300">
            Loading audio content...
          </div>
          <div className="mt-2 text-sm text-secondary-500 dark:text-secondary-400">
            This may take a moment
          </div>
        </div>
        </div>
      );
    }

  // Render error state
  if (error) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center max-w-md">
          <div className="text-lg font-medium text-red-600 dark:text-red-400 mb-2">
            Error Loading Audio
          </div>
          <div className="text-secondary-700 dark:text-secondary-300">
            {error}
          </div>
        <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
            Go Back
        </button>
        </div>
      </div>
    );
  }

  // Render the audio player
  return (
    <div className="container mx-auto px-4 py-8">
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
        </div>
          )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <OverviewPlayer 
            ref={overviewPlayerRef}
            audioUrl={audioUrl} 
            title={title}
            transcript={transcript}
            />
          </div>
        
        {(notes.length > 0 || aiNotes.length > 0) && (
          <div className="lg:col-span-1">
            <div className={`notes-container ${isDarkMode ? 'dark' : ''}`}>
              <div className="flex items-center mb-2">
                <LightBulbIcon className="h-5 w-5 text-primary-600 dark:text-primary-400 mr-2" />
                <h3 className="text-lg font-bold text-secondary-900 dark:text-white">
                  AI-Powered Notes
              </h3>
                {isGeneratingNotes && (
                  <div className="ml-2 animate-pulse text-primary-600 dark:text-primary-400 text-xs">
                    Generating...
            </div>
          )}
                </div>
              
              {isGeneratingNotes ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/5"></div>
              </div>
              ) : aiNotes.length > 0 ? (
                <div className="space-y-2">
                  {aiNotes.map((note, index) => (
                    <div key={index} className={`note-item ${isDarkMode ? 'dark' : ''}`}>
                      <p className="text-secondary-700 dark:text-secondary-300 flex text-sm leading-tight">
                        <span className="mr-1 text-primary-600 dark:text-primary-400">•</span>
                        <span>{note}</span>
                      </p>
            </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-2">
                  <p className="text-secondary-500 dark:text-secondary-400 text-sm mb-1">No notes available yet</p>
                  <p className="text-secondary-500 dark:text-secondary-400 text-xs mb-2">Generate AI-powered notes about the topic being discussed</p>
                </div>
              )}
              
              {/* Add a button to regenerate notes */}
              <div className="mt-2 flex justify-end">
                <button
                  onClick={regenerateNotes}
                  disabled={isGeneratingNotes}
                  className="px-2 py-1 text-xs bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <LightBulbIcon className="h-3 w-3 mr-1" />
                  {isGeneratingNotes ? 'Generating...' : 'Regenerate Notes'}
                </button>
          </div>
                </div>
              </div>
        )}
            </div>
      {/* Add the AI-powered summary section below the transcript */}
      {audioData && (
        <div className="mt-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border-l-4 border-primary-500">
            <div className="flex items-center mb-2">
              <DocumentTextIcon className="h-5 w-5 text-primary-600 dark:text-primary-400 mr-2" />
              <h3 className="text-lg font-bold text-secondary-900 dark:text-white">
                AI-Powered Summary
              </h3>
              {isGeneratingSummary && (
                <div className="ml-2 animate-pulse text-primary-600 dark:text-primary-400 text-xs">
                  Generating...
          </div>
                  )}
        </div>
            
            {isGeneratingSummary ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
      </div>
            ) : aiSummary ? (
              <div className="prose dark:prose-invert max-w-none text-sm max-h-60 overflow-y-auto pr-1">
                {aiSummary.split('\n\n').map((paragraph, index) => (
                  <p key={index} className="mb-2 leading-tight">{paragraph.replace(/\n\n/g, '\n')}</p>
                ))}
          </div>
        ) : (
              <div className="text-center py-2">
                <p className="text-secondary-500 dark:text-secondary-400 text-sm mb-1">No summary available yet</p>
                <p className="text-secondary-500 dark:text-secondary-400 text-xs mb-2">Generate AI-powered summary of the content</p>
          </div>
        )}

            {/* Add a button to regenerate summary */}
            <div className="mt-2 flex justify-end">
              <button
                onClick={regenerateSummary}
                disabled={isGeneratingSummary}
                className="px-2 py-1 text-xs bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <DocumentTextIcon className="h-3 w-3 mr-1" />
                {isGeneratingSummary ? 'Generating...' : 'Regenerate Summary'}
              </button>
        </div>
                    </div>
              </div>
      )}
    </div>
  );
}

export default AudioPlayer;

