import React from 'react';
import { StoryboardScene } from '../types';
import { Image as ImageIcon, Loader2, Upload, Clock } from 'lucide-react';

interface StoryboardGridProps {
  scenes: StoryboardScene[];
  onSceneImageUpdate: (index: number, file: File) => void;
  onSceneTimestampUpdate: (index: number, timestamp: number) => void;
}

const StoryboardGrid: React.FC<StoryboardGridProps> = ({ scenes, onSceneImageUpdate, onSceneTimestampUpdate }) => {
  
  const handleFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onSceneImageUpdate(index, e.target.files[0]);
    }
  };

  const handleTimestampClick = (index: number, currentTimestamp: number = 0) => {
    const minutes = Math.floor(currentTimestamp / 60);
    const seconds = currentTimestamp % 60;
    const currentStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    const input = window.prompt("Enter start time for this scene (mm:ss):", currentStr);
    if (input) {
        const parts = input.split(':');
        if (parts.length === 2) {
            const m = parseInt(parts[0]);
            const s = parseInt(parts[1]);
            if (!isNaN(m) && !isNaN(s)) {
                onSceneTimestampUpdate(index, m * 60 + s);
            }
        } else if (parts.length === 1) {
             const s = parseInt(parts[0]);
             if(!isNaN(s)) onSceneTimestampUpdate(index, s);
        }
    }
  };

  const formatTime = (seconds?: number) => {
    if (seconds === undefined) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {scenes.map((scene, index) => (
          <div 
            key={index}
            className="group relative flex flex-col"
          >
            {/* Frame Decoration - Golden Border */}
            <div className="absolute -inset-2 bg-gradient-to-br from-yellow-600 via-yellow-400 to-yellow-700 rounded-sm opacity-100 shadow-2xl z-0"></div>
            
            <div className="relative z-10 bg-[#0f0303] flex flex-col h-full border border-black">
              
              {/* Header / Timestamp Strip */}
              <div className="bg-[#2a0a0a] border-b border-[#450a0a] px-4 py-3 flex justify-between items-center">
                 <div className="text-[10px] font-bold text-echo-gold uppercase tracking-[0.2em]">
                    Scene {index + 1}
                 </div>
                 <div 
                     onClick={() => handleTimestampClick(index, scene.timestamp)}
                     className="flex items-center gap-1 text-[#d4b996] hover:text-white cursor-pointer transition-colors text-xs font-mono bg-black/50 px-2 py-0.5 border border-[#450a0a] hover:border-echo-gold"
                  >
                     <Clock size={10} />
                     {formatTime(scene.timestamp)}
                  </div>
              </div>

              {/* Image Container - Cinema Screen */}
              <div className="aspect-video w-full bg-black relative overflow-hidden border-b-4 border-[#1a0505]">
                
                {/* Upload Button Overlay */}
                <div className="absolute top-0 right-0 p-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <label 
                    className="cursor-pointer flex items-center gap-2 bg-[#7f1d1d] hover:bg-[#991b1b] text-white px-3 py-2 shadow-lg transform translate-y-[-10px] group-hover:translate-y-0 transition-all font-bold uppercase text-[10px] tracking-wider border border-[#450a0a]"
                    title="Upload your own picture for this scene"
                  >
                    <Upload size={12} />
                    <span>Replace</span>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => handleFileChange(index, e)}
                      onClick={(e) => (e.target as HTMLInputElement).value = ''} 
                    />
                  </label>
                </div>

                {scene.imageUrl ? (
                  <img 
                    src={scene.imageUrl} 
                    alt={`Scene ${index + 1}`}
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity filter sepia-[0.2] contrast-125"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 gap-3">
                    {scene.isLoadingImage ? (
                      <>
                        <Loader2 size={32} className="animate-spin text-echo-gold" />
                        <span className="text-xs font-mono uppercase text-echo-gold animate-pulse">Artist Working...</span>
                      </>
                    ) : (
                      <div className="text-center px-4">
                        <ImageIcon size={32} className="mx-auto mb-2 opacity-30" />
                        <span className="text-xs font-mono uppercase opacity-50">Pending</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Caption & Prompt - Script Style */}
              <div className="p-6 flex-grow flex flex-col bg-[#fef3c7] text-[#2a0a0a]">
                <p className="font-serif font-medium text-lg mb-4 leading-tight flex-grow italic border-l-4 border-[#7f1d1d] pl-4">
                  "{scene.caption}"
                </p>
                <div className="bg-[#2a0a0a]/5 p-3 border-t border-[#2a0a0a]/10">
                   <p className="text-[#450a0a]/60 text-[10px] font-bold uppercase tracking-wider mb-1">Visual Direction:</p>
                   <p className="text-[#450a0a] text-xs font-mono leading-relaxed opacity-80">
                    {scene.visual_prompt}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StoryboardGrid;