import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Loader2, Activity, Wand2, Download, RefreshCw, PlayCircle, Film, XCircle, Mic2, Volume2 } from 'lucide-react';
import FileUpload from './components/FileUpload';
import AnalysisDisplay from './components/AnalysisDisplay';
import StoryboardGrid from './components/StoryboardGrid';
import PlayerOverlay from './components/PlayerOverlay';
import IntroCurtains from './components/IntroCurtains';
import { analyzeAudio, generateImageForScene, playWelcomeMessage } from './services/geminiService';
import { downloadStoryboardCollage, renderVideo } from './services/exportService';
import { saveSession, loadSession, clearSession } from './services/storageService';
import { AnalysisResult, AppState } from './types';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isRenderingVideo, setIsRenderingVideo] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  
  // Audio state
  const [audioFile, setAudioFile] = useState<Blob | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  // Refs for cancellation
  const cancelRenderRef = useRef(false);

  // Load session on mount
  useEffect(() => {
    const init = async () => {
      const session = await loadSession();
      if (session) {
        setResult(session.analysisResult);
        setAudioFile(session.audioBlob);
        setAppState(session.appState as AppState);
      }
    };
    init();
  }, []);

  // Persist state updates
  useEffect(() => {
    if (appState === AppState.COMPLETE && result && audioFile) {
      saveSession(audioFile, audioFile.type, result, appState);
    }
  }, [appState, result, audioFile]);

  // Create Object URL for playback
  const audioUrl = useMemo(() => {
    if (!audioFile) return '';
    return URL.createObjectURL(audioFile);
  }, [audioFile]);

  // Helper: Delay function
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handlePlayIntro = async () => {
    try {
      await playWelcomeMessage();
    } catch (e) {
      console.error("Failed to play intro", e);
    }
  };

  const processFile = async (file: File) => {
    try {
      setAppState(AppState.ANALYZING);
      setError(null);
      setResult(null);
      setAudioFile(file);

      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const base64Content = base64String.split(',')[1];
        const mimeType = file.type || 'audio/mp3';

        try {
          const analysisData = await analyzeAudio(base64Content, mimeType);
          
          setResult({
            ...analysisData,
            storyboard: analysisData.storyboard.map(s => ({ ...s, isLoadingImage: true, isUserUploaded: false }))
          });
          
          setAppState(AppState.GENERATING_IMAGES);

          // BATCHED IMAGE GENERATION
          // To handle 40+ scenes without hitting API rate limits or freezing UI
          const BATCH_SIZE = 3; 
          const scenes = analysisData.storyboard;
          
          for (let i = 0; i < scenes.length; i += BATCH_SIZE) {
            const batch = scenes.slice(i, i + BATCH_SIZE);
            
            await Promise.all(batch.map(async (scene, batchIndex) => {
              const actualIndex = i + batchIndex;
              try {
                const imageUrl = await generateImageForScene(scene.visual_prompt);
                
                setResult(prev => {
                  if (!prev) return null;
                  if (prev.storyboard[actualIndex].isUserUploaded) return prev;

                  const newStoryboard = [...prev.storyboard];
                  newStoryboard[actualIndex] = {
                    ...newStoryboard[actualIndex],
                    imageUrl,
                    isLoadingImage: false
                  };
                  return { ...prev, storyboard: newStoryboard };
                });
              } catch (e) {
                console.error(`Failed to generate image for scene ${actualIndex}`, e);
                // Mark as failed but don't crash
                setResult(prev => {
                    if (!prev) return null;
                    const newStoryboard = [...prev.storyboard];
                    newStoryboard[actualIndex] = {
                      ...newStoryboard[actualIndex],
                      isLoadingImage: false
                    };
                    return { ...prev, storyboard: newStoryboard };
                });
              }
            }));

            // Small delay to be gentle on rate limits
            if (i + BATCH_SIZE < scenes.length) {
              await delay(500); 
            }
          }

          setAppState(AppState.COMPLETE);

        } catch (err) {
          console.error(err);
          setError("Failed to process with Gemini. Please try again.");
          setAppState(AppState.ERROR);
        }
      };
      
      reader.onerror = () => {
        setError("Failed to read file.");
        setAppState(AppState.ERROR);
      };

    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
      setAppState(AppState.ERROR);
    }
  };

  const handleSceneImageUpdate = (index: number, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const newUrl = e.target?.result as string;
      const isVideo = file.type.startsWith('video/');

      setResult((prev) => {
        if (!prev) return null;
        const newStoryboard = [...prev.storyboard];
        newStoryboard[index] = {
          ...newStoryboard[index],
          imageUrl: isVideo ? undefined : newUrl, // If video, clear the image URL
          videoUrl: isVideo ? newUrl : undefined, // If video, set the video URL
          isLoadingImage: false,
          isUserUploaded: true,
          isRegenerating: false
        };
        if (audioFile) saveSession(audioFile, audioFile.type, { ...prev, storyboard: newStoryboard }, AppState.COMPLETE);
        return { ...prev, storyboard: newStoryboard };
      });
    };
    reader.readAsDataURL(file);
  };

  const handleScenePromptUpdate = (index: number, newPrompt: string) => {
    setResult((prev) => {
      if (!prev) return null;
      const newStoryboard = [...prev.storyboard];
      newStoryboard[index] = {
        ...newStoryboard[index],
        visual_prompt: newPrompt
      };
      return { ...prev, storyboard: newStoryboard };
    });
  };

  const handleSceneCaptionUpdate = (index: number, newCaption: string) => {
    setResult((prev) => {
      if (!prev) return null;
      const newStoryboard = [...prev.storyboard];
      newStoryboard[index] = {
        ...newStoryboard[index],
        caption: newCaption
      };
      return { ...prev, storyboard: newStoryboard };
    });
  };

  const handleRegenerateImage = async (index: number, visualPrompt: string) => {
    // Set loading state for this specific scene
    setResult((prev) => {
      if (!prev) return null;
      const newStoryboard = [...prev.storyboard];
      newStoryboard[index] = { ...newStoryboard[index], isRegenerating: true };
      return { ...prev, storyboard: newStoryboard };
    });

    try {
      const imageUrl = await generateImageForScene(visualPrompt);
      
      setResult((prev) => {
        if (!prev) return null;
        const newStoryboard = [...prev.storyboard];
        newStoryboard[index] = {
          ...newStoryboard[index],
          imageUrl,
          videoUrl: undefined, // Clear any user uploaded video when generating new image
          isRegenerating: false,
          isUserUploaded: false 
        };
        
        if (audioFile) {
            saveSession(audioFile, audioFile.type, { ...prev, storyboard: newStoryboard }, AppState.COMPLETE);
        }
        return { ...prev, storyboard: newStoryboard };
      });
    } catch (e) {
      console.error("Failed to regenerate image", e);
      // Reset loading state on error
      setResult((prev) => {
        if (!prev) return null;
        const newStoryboard = [...prev.storyboard];
        newStoryboard[index] = { ...newStoryboard[index], isRegenerating: false };
        return { ...prev, storyboard: newStoryboard };
      });
    }
  };

  const handleSceneTimestampUpdate = (index: number, timestamp: number) => {
    setResult((prev) => {
      if (!prev) return null;
      const newStoryboard = [...prev.storyboard];
      newStoryboard[index] = {
        ...newStoryboard[index],
        timestamp: timestamp
      };
      if (audioFile) saveSession(audioFile, audioFile.type, { ...prev, storyboard: newStoryboard }, AppState.COMPLETE);
      return { ...prev, storyboard: newStoryboard };
    });
  };

  const handleExport = async () => {
    if (!result) return;
    setIsExporting(true);
    setTimeout(async () => {
        await downloadStoryboardCollage(result.title, result.storyboard);
        setIsExporting(false);
    }, 100);
  };
  
  const handleVideoExport = async () => {
    if (!result || !audioFile) return;
    setIsRenderingVideo(true);
    setRenderProgress(0);
    cancelRenderRef.current = false;
    try {
      const blob = await renderVideo(
        audioFile, 
        result.storyboard, 
        (progress) => setRenderProgress(progress),
        () => cancelRenderRef.current
      );
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${result.title.replace(/[^a-z0-9]/gi, '_')}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error("Video rendering failed", e);
      alert("Failed to render video. Please try again.");
    } finally {
      setIsRenderingVideo(false);
      setRenderProgress(0);
    }
  };

  const cancelVideoRender = () => {
    cancelRenderRef.current = true;
    setIsRenderingVideo(false);
  };

  const handleReset = async () => {
    await clearSession();
    setAppState(AppState.IDLE);
    setResult(null);
    setAudioFile(null);
  };

  return (
    <div className="min-h-screen bg-[#1a0505] text-echo-cream selection:bg-echo-gold selection:text-white pb-20 overflow-x-hidden">
      
      {/* INTRO CURTAINS OVERLAY */}
      <IntroCurtains onOpen={handlePlayIntro} />

      {/* THEATER CURTAINS - Fixed decorative sidebars */}
      <div className="fixed inset-y-0 left-0 w-8 md:w-24 bg-curtain-pattern shadow-2xl z-0 border-r-4 border-[#2a0505]"></div>
      <div className="fixed inset-y-0 right-0 w-8 md:w-24 bg-curtain-pattern shadow-2xl z-0 border-l-4 border-[#2a0505]"></div>

      {/* Stage Floor Gradient at bottom */}
      <div className="fixed bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#0f0303] to-transparent z-0 pointer-events-none"></div>

      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-16 md:px-32">
        
        {/* Header - Vintage Poster Style */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-[#2a0a0a] border border-echo-gold/30 text-echo-gold text-xs font-bold uppercase tracking-widest mb-4 shadow-lg">
            <Mic2 size={14} />
            <span>The Medical Theater Presents</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-white mb-2 uppercase drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]" style={{ fontFamily: 'Oswald, sans-serif', textShadow: '4px 4px 0px #450a0a' }}>
            ECHO<span className="text-echo-gold">MASTERS</span>
          </h1>
          
          <div className="relative inline-block px-8 py-2">
            <div className="absolute inset-0 bg-echo-red transform -skew-x-12 rounded-sm shadow-lg"></div>
            <h2 className="relative text-2xl md:text-3xl text-white font-bold uppercase tracking-widest font-brand" style={{textShadow: '2px 2px 0px black'}}>
              Sonography Songs & Lectures
            </h2>
          </div>

          <div className="h-1 w-32 bg-echo-gold mx-auto rounded-full mt-8 mb-6"></div>
          
          <p className="text-xl text-[#d4b996] max-w-2xl mx-auto font-serif italic opacity-90 hidden md:block">
            "A Deep Dive into Ultrasound Physics & Clinical Education from the Stage."
          </p>
        </div>

        {/* Upload Section */}
        {appState === AppState.IDLE && (
          <div className="animate-fade-in-up">
            <FileUpload onFileSelect={processFile} />
          </div>
        )}

        {/* Processing State */}
        {(appState === AppState.ANALYZING || (appState === AppState.ERROR && !result)) && (
           <div className="flex flex-col items-center justify-center py-20 space-y-8 bg-[#2a0a0a] border border-echo-gold/20 rounded-sm shadow-2xl p-12 max-w-2xl mx-auto relative overflow-hidden">
             
             {/* Loading Light Bulbs decoration */}
             <div className="absolute top-0 inset-x-0 flex justify-center gap-8 opacity-20">
               <div className="w-12 h-12 rounded-full bg-echo-gold blur-xl"></div>
               <div className="w-12 h-12 rounded-full bg-echo-gold blur-xl"></div>
               <div className="w-12 h-12 rounded-full bg-echo-gold blur-xl"></div>
             </div>

             {appState === AppState.ERROR ? (
               <div className="text-red-400 text-lg bg-red-950/30 px-6 py-4 border-l-4 border-red-500 max-w-md text-center">
                 {error}
                 <button 
                   onClick={handleReset}
                   className="block mt-6 text-sm bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-2 uppercase tracking-wider transition-colors mx-auto shadow-lg"
                 >
                   Reset System
                 </button>
               </div>
             ) : (
               <>
                 <div className="relative">
                   <div className="w-24 h-24 rounded-full border-4 border-[#450a0a] border-t-echo-gold animate-spin"></div>
                   <div className="absolute inset-0 flex items-center justify-center">
                     <Activity size={32} className="text-echo-gold animate-pulse" />
                   </div>
                 </div>
                 <div className="text-center">
                   <h3 className="text-3xl font-bold text-white mb-2 brand-font uppercase tracking-wide">Preparing the Stage</h3>
                   <p className="text-[#d4b996] font-serif text-lg italic">Writing the script • Sketching diagrams • Warming up the band</p>
                 </div>
               </>
             )}
           </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-12 pb-20">
            {/* Actions Bar - Gold & Burgundy Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-4 sticky top-6 z-50 bg-[#1a0505]/90 p-4 rounded-b-lg backdrop-blur-sm border-b border-echo-gold/20 shadow-xl">
               {appState === AppState.COMPLETE && (
                 <>
                   <button 
                     onClick={() => setIsPlayerOpen(true)}
                     className="flex items-center gap-2 bg-echo-gold hover:bg-yellow-600 text-[#2a0a0a] px-6 py-3 transition-all shadow-[0_0_15px_rgba(217,119,6,0.3)] hover:shadow-[0_0_25px_rgba(217,119,6,0.5)] font-bold uppercase tracking-wider border-b-4 border-yellow-800 active:border-b-0 active:translate-y-1 rounded-sm"
                   >
                     <PlayCircle size={20} />
                     Start Show
                   </button>
                   
                   <button 
                     onClick={handleVideoExport}
                     className="flex items-center gap-2 bg-[#2a0a0a] hover:bg-[#3a0a0a] text-echo-gold border border-echo-gold px-6 py-3 transition-all font-bold uppercase tracking-wider shadow-lg active:scale-95 rounded-sm"
                   >
                     <Film size={18} />
                     Export Tape
                   </button>

                   <button 
                     onClick={handleExport}
                     disabled={isExporting}
                     className="flex items-center gap-2 bg-[#7f1d1d] hover:bg-[#991b1b] text-white px-6 py-3 transition-all font-bold uppercase tracking-wider border-b-4 border-[#450a0a] active:border-b-0 active:translate-y-1 rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     {isExporting ? <Loader2 size={18} className="animate-spin"/> : <Download size={18} />}
                     {isExporting ? 'Saving...' : 'Save Script'}
                   </button>
                 </>
               )}

               <button 
                 onClick={handleReset}
                 className="flex items-center gap-2 text-[#d4b996] hover:text-white px-6 py-3 transition-all font-serif italic hover:underline"
               >
                 <RefreshCw size={18} />
                 New Case
               </button>
            </div>

            <AnalysisDisplay data={result} />
            
            <div className="border-t-2 border-dashed border-echo-gold/30 pt-10">
              <div className="flex items-center gap-4 mb-8 bg-[#2a0a0a] p-4 border border-echo-gold/20 rounded-sm shadow-inner">
                 <div className="h-8 w-1 bg-echo-gold"></div>
                 <h2 className="text-3xl font-bold text-white uppercase brand-font tracking-wide">The Visual Storyboard</h2>
                 {appState === AppState.GENERATING_IMAGES && (
                   <div className="ml-auto flex items-center gap-3 text-echo-gold bg-echo-gold/10 px-4 py-2 border border-echo-gold/20 rounded-sm">
                     <Loader2 size={16} className="animate-spin" />
                     <span className="text-xs font-mono uppercase">Sketching Scenes... ({result.storyboard.filter(s => !s.isLoadingImage).length}/{result.storyboard.length})</span>
                   </div>
                 )}
              </div>
              
              <StoryboardGrid 
                scenes={result.storyboard} 
                onSceneImageUpdate={handleSceneImageUpdate} 
                onSceneTimestampUpdate={handleSceneTimestampUpdate}
                onScenePromptUpdate={handleScenePromptUpdate}
                onSceneCaptionUpdate={handleSceneCaptionUpdate}
                onRegenerateImage={handleRegenerateImage}
              />
            </div>
          </div>
        )}

      </main>
      
      {/* Player Overlay */}
      {isPlayerOpen && result && audioUrl && (
        <PlayerOverlay 
          audioUrl={audioUrl} 
          scenes={result.storyboard} 
          title={result.title}
          onClose={() => setIsPlayerOpen(false)} 
        />
      )}
      
      {/* Video Rendering Modal */}
      {isRenderingVideo && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center p-6">
           <div className="w-full max-w-md bg-[#2a0a0a] border-2 border-echo-gold/50 p-8 rounded-sm shadow-[0_0_50px_rgba(217,119,6,0.2)] relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-echo-gold to-transparent animate-pulse"></div>
              
              <div className="flex flex-col items-center text-center space-y-6">
                 <div className="w-16 h-16 rounded-full border-4 border-[#450a0a] border-t-echo-gold animate-spin"></div>
                 
                 <div>
                    <h3 className="text-2xl font-bold text-echo-gold uppercase brand-font">Recording Show</h3>
                    <p className="text-[#d4b996] text-sm font-serif italic mt-2">Capturing frames to tape • {Math.round(renderProgress)}% Complete</p>
                    <p className="text-slate-500 text-xs mt-4 uppercase tracking-widest">Do not close this window</p>
                 </div>

                 <div className="w-full bg-[#1a0505] h-3 rounded-full overflow-hidden border border-[#450a0a]">
                    <div 
                      className="bg-echo-gold h-full transition-all duration-200"
                      style={{ width: `${renderProgress}%` }}
                    ></div>
                 </div>

                 <button 
                   onClick={cancelVideoRender}
                   className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors uppercase text-xs font-bold tracking-widest mt-4"
                 >
                   <XCircle size={16} />
                   Cancel Recording
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* CSS Animation Utilities */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default App;