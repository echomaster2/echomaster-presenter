import React, { useState } from 'react';
import { StoryboardScene } from '../types';
import { Image as ImageIcon, Loader2, Upload, Clock, RefreshCw, Bold, Italic, Eye, X, Edit2, Video, Sparkles, PenTool, Copy, Check } from 'lucide-react';

interface StoryboardGridProps {
  scenes: StoryboardScene[];
  onSceneImageUpdate: (index: number, file: File) => void;
  onSceneTimestampUpdate: (index: number, timestamp: number) => void;
  onScenePromptUpdate: (index: number, prompt: string) => void;
  onSceneCaptionUpdate: (index: number, caption: string) => void;
  onRegenerateImage: (index: number, visualPrompt: string) => void;
}

const StoryboardGrid: React.FC<StoryboardGridProps> = ({ 
  scenes, 
  onSceneImageUpdate, 
  onSceneTimestampUpdate, 
  onScenePromptUpdate, 
  onSceneCaptionUpdate,
  onRegenerateImage 
}) => {
  const [previewPrompt, setPreviewPrompt] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

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

  const insertFormatting = (index: number, field: 'prompt' | 'caption', type: 'bold' | 'italic') => {
    const elementId = field === 'prompt' ? `prompt-textarea-${index}` : `caption-textarea-${index}`;
    const textarea = document.getElementById(elementId) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = field === 'prompt' ? scenes[index].visual_prompt : scenes[index].caption;
    const selectedText = text.substring(start, end);
    
    const wrapper = type === 'bold' ? '**' : '*';
    const newText = text.substring(0, start) + wrapper + selectedText + wrapper + text.substring(end);
    
    if (field === 'prompt') {
        onScenePromptUpdate(index, newText);
    } else {
        onSceneCaptionUpdate(index, newText);
    }
    
    // Defer focus back to allow React render cycle
    setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + wrapper.length, end + wrapper.length);
    }, 0);
  };

  const formatTime = (seconds?: number) => {
    if (seconds === undefined) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopyPrompt = async () => {
    if (previewPrompt) {
        try {
            await navigator.clipboard.writeText(previewPrompt);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    }
  };

  // Simple renderer for the preview modal to show bold/italics
  const renderPreviewText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-echo-gold">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} className="text-echo-cream/80">{part.slice(1, -1)}</em>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
      
      {/* CSS for custom animations */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .animate-shimmer {
          background: linear-gradient(110deg, #0f0303 30%, #2a0a0a 50%, #0f0303 70%);
          background-size: 200% 100%;
          animation: shimmer 2s linear infinite;
        }
      `}</style>

      {/* Preview Modal */}
      {previewPrompt !== null && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#1a0505] border-2 border-echo-gold w-full max-w-2xl shadow-2xl rounded-sm flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between p-4 border-b border-echo-gold/30 bg-[#2a0a0a]">
              <h3 className="text-echo-gold font-brand uppercase tracking-widest text-lg flex items-center gap-2">
                <Eye size={20} /> Prompt Preview
              </h3>
              <div className="flex items-center gap-2">
                <button 
                    onClick={handleCopyPrompt}
                    className="flex items-center gap-2 px-3 py-1.5 border border-echo-gold/30 text-echo-gold hover:bg-echo-gold hover:text-[#2a0a0a] transition-colors rounded-sm text-xs font-bold uppercase tracking-wider"
                >
                    {isCopied ? <Check size={14} /> : <Copy size={14} />}
                    {isCopied ? 'Copied' : 'Copy Text'}
                </button>
                <button 
                    onClick={() => setPreviewPrompt(null)}
                    className="text-slate-400 hover:text-white transition-colors p-1"
                >
                    <X size={24} />
                </button>
              </div>
            </div>
            <div className="p-8 overflow-y-auto font-serif text-lg leading-relaxed text-[#d4b996] selection:bg-echo-gold selection:text-[#2a0a0a]">
              {renderPreviewText(previewPrompt)}
            </div>
            <div className="p-4 border-t border-echo-gold/10 bg-[#0f0303] text-center">
               <span className="text-xs text-slate-500 uppercase tracking-widest">This visual direction will be sent to the AI Artist</span>
            </div>
          </div>
        </div>
      )}

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
              <div className="aspect-video w-full bg-[#0f0303] relative overflow-hidden border-b-4 border-[#1a0505]">
                
                {/* Actions Overlay - Only visible when not regenerating/loading (or if we want to allow cancel?) */}
                {!scene.isLoadingImage && (
                  <div className="absolute top-0 right-0 p-3 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-2 transform translate-y-[-10px] group-hover:translate-y-0 transition-transform">
                    {/* Regenerate Button */}
                    <button 
                      onClick={() => onRegenerateImage(index, scene.visual_prompt)}
                      className="flex items-center gap-2 bg-[#2a0a0a] hover:bg-[#3a0a0a] text-echo-gold hover:text-white px-3 py-2 shadow-lg font-bold uppercase text-[10px] tracking-wider border border-[#450a0a] disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Regenerate this image with AI"
                      disabled={scene.isRegenerating}
                    >
                      <RefreshCw size={12} className={scene.isRegenerating ? "animate-spin" : ""} />
                      <span className="hidden sm:inline">Regenerate</span>
                    </button>

                    {/* Upload Image Button */}
                    <label 
                      className="cursor-pointer flex items-center gap-2 bg-[#7f1d1d] hover:bg-[#991b1b] text-white px-3 py-2 shadow-lg font-bold uppercase text-[10px] tracking-wider border border-[#450a0a]"
                      title="Upload your own picture for this scene"
                    >
                      <Upload size={12} />
                      <span className="hidden sm:inline">Image</span>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => handleFileChange(index, e)}
                        onClick={(e) => (e.target as HTMLInputElement).value = ''} 
                      />
                    </label>
                    
                    {/* Upload Video Button */}
                    <label 
                      className="cursor-pointer flex items-center gap-2 bg-[#451a03] hover:bg-[#78350f] text-white px-3 py-2 shadow-lg font-bold uppercase text-[10px] tracking-wider border border-[#450a0a]"
                      title="Upload your own video clip for this scene"
                    >
                      <Video size={12} />
                      <span className="hidden sm:inline">Video</span>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="video/*"
                        onChange={(e) => handleFileChange(index, e)}
                        onClick={(e) => (e.target as HTMLInputElement).value = ''} 
                      />
                    </label>
                  </div>
                )}
                
                {/* RENDER CONTENT */}
                {scene.videoUrl ? (
                    <video 
                        src={scene.videoUrl}
                        className="w-full h-full object-cover"
                        controls
                        muted
                        loop
                        playsInline
                    />
                ) : scene.imageUrl ? (
                  <div className="relative w-full h-full">
                    <img 
                      src={scene.imageUrl} 
                      alt={`Scene ${index + 1}`}
                      loading="lazy"
                      className={`w-full h-full object-cover transition-all duration-700 ${
                          scene.isRegenerating ? 'opacity-20 blur-md scale-105' : 'opacity-90 group-hover:opacity-100 scale-100'
                      } filter sepia-[0.2] contrast-125`}
                    />
                    
                    {/* Loading Overlay during Regeneration (over existing image) */}
                    {scene.isRegenerating && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                            <div className="bg-[#1a0505]/90 p-5 rounded-full backdrop-blur-md border border-echo-gold/50 shadow-[0_0_30px_rgba(217,119,6,0.3)] flex flex-col items-center gap-3 animate-pulse">
                                <Sparkles size={24} className="text-echo-gold animate-spin" style={{ animationDuration: '3s' }} />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-echo-gold">Redrawing</span>
                            </div>
                        </div>
                    )}
                  </div>
                ) : (
                  // EMPTY / LOADING STATE
                  <div className="absolute inset-0 flex flex-col items-center justify-center relative overflow-hidden group-hover:bg-[#150505] transition-colors">
                    
                    {scene.isLoadingImage ? (
                        <>
                            {/* Shimmer Background */}
                            <div className="absolute inset-0 animate-shimmer opacity-30"></div>
                            
                            {/* Central Animated Graphic */}
                            <div className="relative z-10 flex flex-col items-center gap-4 p-6">
                                <div className="relative w-16 h-16">
                                    <div className="absolute inset-0 border-2 border-echo-gold/10 rounded-full scale-110"></div>
                                    <div className="absolute inset-0 border-t-2 border-echo-gold rounded-full animate-spin"></div>
                                    <div className="absolute inset-2 bg-[#2a0a0a] rounded-full flex items-center justify-center shadow-inner">
                                        <PenTool size={20} className="text-echo-gold animate-bounce" style={{ animationDuration: '2s' }} />
                                    </div>
                                </div>
                                <div className="text-center space-y-1">
                                    <span className="block text-xs font-bold uppercase text-echo-gold tracking-widest animate-pulse">Artist Working</span>
                                    <span className="block text-[9px] text-echo-gold/50 font-mono">Developing Scene {index + 1}...</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        // Pending State (Static Placeholder)
                        <div className="text-center px-4 opacity-30 group-hover:opacity-50 transition-all duration-300">
                            <div className="w-16 h-16 mx-auto mb-3 border-2 border-dashed border-[#d4b996] rounded-full flex items-center justify-center group-hover:border-echo-gold group-hover:scale-110 transition-all">
                                <ImageIcon size={24} className="text-[#d4b996] group-hover:text-echo-gold" />
                            </div>
                            <span className="text-xs font-mono uppercase text-[#d4b996] tracking-widest group-hover:text-echo-gold">Scene Pending</span>
                        </div>
                    )}
                  </div>
                )}
              </div>

              {/* Caption & Prompt - Script Style */}
              <div className="p-6 flex-grow flex flex-col bg-[#fef3c7] text-[#2a0a0a]">
                
                {/* Editable Caption Area */}
                <div className="relative mb-4 flex-grow group/edit">
                    {/* Caption Formatting Toolbar */}
                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover/edit:opacity-100 transition-opacity bg-[#fef3c7] p-1 rounded-sm border border-[#7f1d1d]/10 shadow-sm z-10">
                        <button 
                            onClick={() => insertFormatting(index, 'caption', 'bold')} 
                            className="p-1 text-[#7f1d1d] hover:bg-[#7f1d1d]/10 rounded transition-colors"
                            title="Bold"
                        >
                            <Bold size={12} />
                        </button>
                        <button 
                            onClick={() => insertFormatting(index, 'caption', 'italic')} 
                            className="p-1 text-[#7f1d1d] hover:bg-[#7f1d1d]/10 rounded transition-colors"
                            title="Italic"
                        >
                            <Italic size={12} />
                        </button>
                    </div>

                    <textarea
                        id={`caption-textarea-${index}`}
                        value={scene.caption}
                        onChange={(e) => onSceneCaptionUpdate(index, e.target.value)}
                        className="w-full bg-transparent font-serif font-medium text-lg leading-tight italic border-l-4 border-[#7f1d1d] pl-4 outline-none resize-none h-full min-h-[5rem] focus:bg-[#450a0a]/5 transition-colors rounded-r-sm placeholder-[#7f1d1d]/40"
                        placeholder="Write a caption..."
                    />
                </div>

                <div className="bg-[#2a0a0a]/5 border-t border-[#2a0a0a]/10 flex flex-col">
                   <div className="flex items-center justify-between bg-[#2a0a0a]/10 px-3 py-1">
                      <span className="text-[#450a0a]/80 text-[10px] font-bold uppercase tracking-wider">Visual Direction (Editable)</span>
                      
                      {/* Rich Text Toolbar */}
                      <div className="flex items-center gap-1">
                          <button 
                            onClick={() => insertFormatting(index, 'prompt', 'bold')}
                            className="p-1 text-[#450a0a] hover:bg-[#2a0a0a]/10 rounded"
                            title="Bold (**text**)"
                          >
                             <Bold size={12} />
                          </button>
                          <button 
                            onClick={() => insertFormatting(index, 'prompt', 'italic')}
                            className="p-1 text-[#450a0a] hover:bg-[#2a0a0a]/10 rounded"
                            title="Italic (*text*)"
                          >
                             <Italic size={12} />
                          </button>
                          <div className="w-[1px] h-3 bg-[#450a0a]/20 mx-1"></div>
                          <button 
                            onClick={() => setPreviewPrompt(scene.visual_prompt)}
                            className="p-1 text-[#450a0a] hover:bg-[#2a0a0a]/10 rounded hover:text-echo-gold"
                            title="Preview Prompt"
                          >
                             <Eye size={12} />
                          </button>

                          <div className="w-[1px] h-3 bg-[#450a0a]/20 mx-1"></div>
                          
                          {/* IN-LINE REGENERATE BUTTON */}
                          <button 
                            onClick={() => onRegenerateImage(index, scene.visual_prompt)}
                            disabled={scene.isRegenerating}
                            className="flex items-center gap-1.5 px-2 py-0.5 ml-2 bg-echo-gold text-[#2a0a0a] hover:bg-[#b45309] hover:text-white rounded-sm shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed text-[9px] font-bold uppercase tracking-wider"
                            title="Redraw image using this specific prompt"
                          >
                             <RefreshCw size={10} className={scene.isRegenerating ? "animate-spin" : ""} />
                             Redraw
                          </button>
                      </div>
                   </div>
                   
                   <textarea
                     id={`prompt-textarea-${index}`}
                     value={scene.visual_prompt}
                     onChange={(e) => onScenePromptUpdate(index, e.target.value)}
                     className="w-full bg-transparent p-3 text-[#450a0a] text-xs font-mono leading-relaxed opacity-90 focus:opacity-100 focus:bg-[#2a0a0a]/5 outline-none resize-none h-24 custom-scrollbar"
                     placeholder="Describe the scene..."
                   />
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