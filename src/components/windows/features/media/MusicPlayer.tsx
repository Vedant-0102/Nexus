
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, AlertCircle } from 'lucide-react';

export const MusicPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState(0);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [loadError, setLoadError] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const songs = [
    { 
      title: "Midnight Dreams", 
      artist: "Lunar Echo",
      src: "https://cdn.freesound.org/previews/659/659732_5674468-lq.mp3"
    },
    { 
      title: "Sunshine Boulevard", 
      artist: "Coastal Waves",
      src: "https://cdn.freesound.org/previews/663/663699_11861866-lq.mp3"
    },
    { 
      title: "Electric Horizon", 
      artist: "Neon Pulse",
      src: "https://cdn.freesound.org/previews/670/670437_1648170-lq.mp3"
    },
    { 
      title: "Mountain Memories", 
      artist: "Alpine Echoes",
      src: "https://cdn.freesound.org/previews/617/617306_1648170-lq.mp3"
    }
  ];

  // Initialize audio on component mount
  useEffect(() => {
    audioRef.current = new Audio();
    
    const handleError = () => {
      console.error("Error loading audio source");
      setLoadError(true);
      setIsPlaying(false);
    };
    
    audioRef.current.addEventListener('error', handleError);
    
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('error', handleError);
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Handle song changes
  useEffect(() => {
    if (!audioRef.current) return;
    
    setLoadError(false);
    setIsPlaying(false);
    
    // Update source
    audioRef.current.src = songs[currentSong].src;
    audioRef.current.volume = isMuted ? 0 : volume;
    setProgress(0);
    
    // Load and play
    const loadPromise = audioRef.current.load();
    
    // Play after loading if was previously playing
    audioRef.current.addEventListener('loadeddata', () => {
      if (isPlaying) {
        audioRef.current?.play().catch(err => {
          console.error("Playback failed:", err);
          setIsPlaying(false);
          setLoadError(true);
        });
      }
    });
    
    // Setup event listeners
    const handleTimeUpdate = () => {
      if (audioRef.current && audioRef.current.duration) {
        setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
      }
    };
    
    const handleLoadedMetadata = () => {
      if (audioRef.current) {
        setDuration(audioRef.current.duration);
      }
    };
    
    const handleEnded = () => {
      nextSong();
    };
    
    audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
    audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
    audioRef.current.addEventListener('ended', handleEnded);
    
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audioRef.current.removeEventListener('ended', handleEnded);
      }
    };
  }, [currentSong]);
  
  // Handle play/pause
  useEffect(() => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.error("Playback failed:", err);
          setIsPlaying(false);
          setLoadError(true);
        });
      }
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);
  
  // Handle volume changes
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  const togglePlay = () => {
    if (loadError) {
      // Try to reload the audio
      if (audioRef.current) {
        audioRef.current.load();
        setLoadError(false);
      }
    }
    setIsPlaying(!isPlaying);
  };

  const nextSong = () => {
    setCurrentSong((prev) => (prev + 1) % songs.length);
    setIsPlaying(true);
  };

  const prevSong = () => {
    setCurrentSong((prev) => (prev - 1 + songs.length) % songs.length);
    setIsPlaying(true);
  };
  
  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current || !audioRef.current.duration) return;
    
    const newProgress = parseFloat(e.target.value);
    setProgress(newProgress);
    
    // Calculate the time based on percentage
    const newTime = (newProgress / 100) * audioRef.current.duration;
    
    // Ensure time is a valid number 
    if (isFinite(newTime)) {
      audioRef.current.currentTime = newTime;
    } else {
      console.error("Invalid time calculation:", newTime);
    }
  };
  
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(false);
  };
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  const formatTime = (timeInSeconds: number) => {
    if (!isFinite(timeInSeconds)) return '0:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className="p-4 h-full">
      <h2 className="text-2xl font-semibold mb-4">Music Player</h2>
      <div className="bg-white/50 p-6 rounded-lg max-w-md mx-auto">
        <div className="bg-gray-800 h-32 rounded-lg mb-4 flex items-center justify-center relative">
          <div className="text-white text-center">
            <div className="font-bold text-lg">{songs[currentSong].title}</div>
            <div className="text-sm opacity-70">{songs[currentSong].artist}</div>
            <div className="mt-3 text-xs opacity-50">
              {audioRef.current ? formatTime(audioRef.current.currentTime) : '0:00'} / 
              {duration ? formatTime(duration) : '0:00'}
            </div>
          </div>
          
          {loadError && (
            <div className="absolute top-2 right-2 text-red-400 flex items-center">
              <AlertCircle size={16} className="mr-1" />
              <span className="text-xs">Error loading audio</span>
            </div>
          )}
        </div>
        
        <div className="mt-4">
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={handleProgressChange}
            className="w-full h-1.5 bg-gray-300 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        
        <div className="flex items-center justify-center gap-4 mt-6">
          <button 
            onClick={prevSong}
            className="p-2 rounded-full hover:bg-gray-200/50 transition-colors"
          >
            <SkipBack size={20} />
          </button>
          
          <button 
            onClick={togglePlay}
            className="p-3 rounded-full bg-win-blue text-white hover:bg-win-blue-dark transition-colors"
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>
          
          <button 
            onClick={nextSong}
            className="p-2 rounded-full hover:bg-gray-200/50 transition-colors"
          >
            <SkipForward size={20} />
          </button>
        </div>
        
        <div className="flex items-center mt-4 gap-2">
          <button onClick={toggleMute} className="p-1">
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="w-full h-1.5 bg-gray-300 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
