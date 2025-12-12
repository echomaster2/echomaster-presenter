import React, { useRef, useState, useEffect } from 'react';
import { X, Play, Pause, SkipBack, SkipForward, Maximize2, Subtitles, Volume2, VolumeX } from 'lucide-react';
import { StoryboardScene } from '../types';

interface PlayerOverlayProps {
  audioUrl: string;
  scenes: StoryboardScene[];
  title: string;
  onClose: () => void;
}

const PlayerOverlay: React.FC<PlayerOverlayProps> = ({ audioUrl, scenes, title, onClose }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [showCaptions, setShowCaptions] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  
  // State for cross-fade logic
  const [backgroundImage, setBackgroundImage] = useState<string | undefined>(scenes[0]?.imageUrl);

  // Update active scene based on time
  useEffect(() => {
    // Find the scene that has the highest timestamp less than or equal to current time
    let newIndex = 0;
    for (let i = 0; i < scenes.length; i++) {
      const sceneTime = scenes[i].timestamp || 0;
      if (currentTime >= sceneTime) {
        newIndex = i;
      } else {
        break; // Timestamps should be ordered
      }
    }
    setActiveSceneIndex(newIndex);
  }, [currentTime, scenes]);

  const currentScene = scenes[activeSceneIndex];

  // Handle Image Transition Logic
  useEffect(() => {
    if (currentScene?.imageUrl) {
      // After the animation duration (700ms), update the background to match the current image
      // This prepares the background for the NEXT transition
      const timer = setTimeout(() => {
        setBackgroundImage(currentScene.imageUrl);
      }, 700); 
      return () => clearTimeout(timer);
    }
  }, [currentScene?.imageUrl]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
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
      audioRef.current.play().then(() => setIsPlaying(true)).catch(e => console.log("Autoplay prevented", e));
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (audioRef.current) {
      audioRef.current.muted = newMuted;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0b1120] flex flex-col items-center justify-center animate-fade-in">
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 text-slate-400 hover:text-orange-500 p-2 hover:bg-slate-900 transition-colors z-50 border border-transparent hover:border-orange-500 rounded-sm"
      >
        <X size={32} />
      </button>

      <div className="w-full max-w-6xl px-6 flex flex-col h-full justify-center">
        
        {/* Monitor Branding */}
        <div className="flex items-center justify-between mb-2 px-2">
            <h2 className="text-xl text-cyan-500 font-bold uppercase tracking-widest brand-font">
            Echomasters Player
            </h2>
            <div className="text-xs font-mono text-slate-500 uppercase">
                {title}
            </div>
        </div>
        

        {/* Visual Stage - Monitor Look */}
        <div className="relative aspect-video w-full bg-black border-4 border-slate-800 shadow-2xl mb-8 group overflow-hidden rounded-sm ring-1 ring-slate-700">
          
          {/* Layer 1: Background Image */}
          {backgroundImage && (
            <img 
              src={backgroundImage} 
              alt="Background" 
              className="absolute inset-0 w-full h-full object-contain bg-black opacity-100" 
            />
          )}

          {/* Layer 2: Foreground Image */}
          {currentScene?.imageUrl ? (
            <img 
              key={currentScene.imageUrl}
              src={currentScene.imageUrl} 
              alt={currentScene.caption} 
              className="absolute inset-0 w-full h-full object-contain bg-black animate-cinematic-fade" 
            />
          ) : (
             <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                 <div className="text-cyan-500 font-mono text-sm animate-pulse">NO SIGNAL / RENDERING</div>
            </div>
          )}
          
          {/* CRT Scanline Effect Overlay (Optional aesthetic touch) */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-30"
               style={{ background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))', backgroundSize: '100% 2px, 3px 100%' }}>
          </div>

          {/* Caption Overlay - Subtitle Style */}
          {showCaptions && (
            <div className="absolute bottom-10 inset-x-0 flex justify-center z-40 px-8">
               <div className="bg-black/80 px-6 py-3 border-l-4 border-orange-500 backdrop-blur-sm max-w-4xl animate-slide-up">
                  <p 
                    key={currentScene?.caption} 
                    className="text-white text-xl md:text-2xl font-semibold text-center leading-relaxed font-sans"
                  >
                    {currentScene?.caption}
                  </p>
               </div>
            </div>
          )}
        </div>

        {/* Controls Console */}
        <div className="w-full max-w-4xl mx-auto bg-slate-900 border border-slate-800 p-6 rounded-sm shadow-xl">
          {/* Progress Bar */}
          <div className="flex items-center gap-4 text-sm text-cyan-400 font-mono mb-6">
            <span>{formatTime(currentTime)}</span>
            <input 
              type="range" 
              min="0" 
              max={duration || 100} 
              value={currentTime} 
              onChange={handleSeek}
              className="flex-1 h-2 bg-slate-800 rounded-none appearance-none cursor-pointer accent-orange-500 hover:accent-orange-400 transition-all"
            />
            <span>{formatTime(duration)}</span>
          </div>

          {/* Buttons Row */}
          <div className="relative flex items-center justify-center py-2">
            
            {/* Volume Control - Absolute Left */}
            <div className="absolute left-0 hidden sm:flex items-center gap-2 group">
              <button 
                onClick={toggleMute}
                className="text-slate-500 hover:text-cyan-400 transition-colors p-2"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <div className="w-20 sm:w-24">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500 opacity-60 hover:opacity-100 transition-opacity"
                  title="Volume"
                />
              </div>
            </div>

            {/* Transport Controls - Center */}
            <div className="flex items-center gap-6 md:gap-10">
              <button 
                onClick={() => {
                  if (audioRef.current) audioRef.current.currentTime = Math.max(0, currentTime - 10);
                }}
                className="text-slate-500 hover:text-cyan-400 transition-colors active:scale-95"
              >
                <SkipBack size={32} />
              </button>
              
              <button 
                onClick={togglePlay}
                className={`w-20 h-20 flex items-center justify-center rounded-full border-4 transition-all shadow-lg active:scale-95 ${isPlaying 
                    ? 'border-orange-500 bg-orange-900/20 text-orange-500 shadow-orange-900/20' 
                    : 'border-cyan-500 bg-cyan-900/20 text-cyan-400 shadow-cyan-900/20 hover:bg-cyan-500 hover:text-white'
                }`}
              >
                {isPlaying ? <Pause size={36} fill="currentColor" /> : <Play size={36} fill="currentColor" className="ml-2" />}
              </button>

              <button 
                onClick={() => {
                  if (audioRef.current) audioRef.current.currentTime = Math.min(duration, currentTime + 10);
                }}
                className="text-slate-500 hover:text-cyan-400 transition-colors active:scale-95"
              >
                <SkipForward size={32} />
              </button>
            </div>

            {/* Captions Toggle - Absolute Right */}
            <div className="absolute right-0">
              <button
                onClick={() => setShowCaptions(!showCaptions)}
                title="Toggle Captions"
                className={`p-2 rounded-sm border transition-colors ${
                  showCaptions 
                    ? 'text-orange-500 border-orange-500 bg-orange-900/10' 
                    : 'text-slate-500 border-slate-700 hover:text-cyan-400 hover:border-cyan-500'
                }`}
              >
                <Subtitles size={24} />
              </button>
            </div>

          </div>
        </div>
      </div>

      <audio 
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />
      
      <style>{`
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
        
        /* Combines opacity fade with a subtle zoom out for a cinematic feel */
        .animate-cinematic-fade {
          animation: cinematicFade 0.7s ease-out forwards;
        }

        .animate-slide-up {
          animation: slideUp 0.3s ease-out forwards;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes cinematicFade {
          0% { 
            opacity: 0; 
            transform: scale(1.02); 
          }
          100% { 
            opacity: 1; 
            transform: scale(1); 
          }
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default PlayerOverlay;