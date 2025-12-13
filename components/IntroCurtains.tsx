import React, { useState } from 'react';
import { Ticket, Mic2 } from 'lucide-react';

interface IntroCurtainsProps {
  onOpen: () => void;
}

const IntroCurtains: React.FC<IntroCurtainsProps> = ({ onOpen }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  const handleEnter = () => {
    setIsOpen(true);
    onOpen();
    
    // Remove from DOM after animation completes to allow interaction with app
    setTimeout(() => {
      setIsHidden(true);
    }, 2500);
  };

  if (isHidden) return null;

  return (
    <div className={`fixed inset-0 z-[100] overflow-hidden pointer-events-none`}>
      {/* CSS for Curtain Texture */}
      <style>{`
        .curtain-texture {
          background-color: #450a0a;
          background-image: 
            repeating-linear-gradient(90deg, 
              #450a0a 0px, 
              #2a0505 40px, 
              #7f1d1d 80px, 
              #450a0a 120px
            );
          box-shadow: inset 0 0 100px #000;
        }
        .spotlight {
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0) 60%);
        }
      `}</style>

      {/* Left Curtain */}
      <div 
        className={`absolute top-0 left-0 w-1/2 h-full curtain-texture transition-transform duration-[2000ms] ease-in-out z-20 border-r-4 border-yellow-900/50 flex items-center justify-end pointer-events-auto ${isOpen ? '-translate-x-full' : 'translate-x-0'}`}
      >
        <div className="w-12 h-full bg-gradient-to-r from-transparent to-black/30"></div>
      </div>

      {/* Right Curtain */}
      <div 
        className={`absolute top-0 right-0 w-1/2 h-full curtain-texture transition-transform duration-[2000ms] ease-in-out z-20 border-l-4 border-yellow-900/50 flex items-center justify-start pointer-events-auto ${isOpen ? 'translate-x-full' : 'translate-x-0'}`}
      >
         <div className="w-12 h-full bg-gradient-to-l from-transparent to-black/30"></div>
      </div>

      {/* Curtain Fringe/Valance (Top) */}
      <div 
         className={`absolute top-0 left-0 right-0 h-24 bg-[#2a0505] z-30 transition-transform duration-[2000ms] delay-100 ease-in-out border-b-4 border-echo-gold/50 shadow-2xl flex items-end justify-center pointer-events-none ${isOpen ? '-translate-y-full' : 'translate-y-0'}`}
         style={{
            backgroundImage: 'radial-gradient(circle at 50% 120%, #7f1d1d 50%, transparent 50%)',
            backgroundSize: '80px 80px'
         }}
      >
         <div className="w-full h-8 bg-gradient-to-b from-black/50 to-transparent absolute top-0"></div>
      </div>

      {/* Center Content (The "Stage") */}
      <div 
        className={`absolute inset-0 z-40 flex flex-col items-center justify-center pointer-events-auto transition-opacity duration-1000 ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        {/* Spotlight Effect */}
        <div className="absolute inset-0 spotlight pointer-events-none"></div>

        <div className="relative transform scale-100 hover:scale-105 transition-transform duration-500">
            {/* Glowing Logo Container */}
            <div className="text-center mb-12 drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)]">
                <h1 className="text-7xl md:text-9xl font-bold tracking-tighter text-white mb-2 uppercase" style={{ fontFamily: 'Oswald, sans-serif', textShadow: '4px 4px 0px #450a0a' }}>
                    ECHO<span className="text-echo-gold">MASTERS</span>
                </h1>
                <div className="text-echo-gold text-lg md:text-xl font-brand uppercase tracking-[0.5em] border-t border-b border-echo-gold/30 py-2 mt-4 inline-block bg-[#000000]/40 px-8 backdrop-blur-sm">
                    The Medical Theater
                </div>
            </div>

            {/* Admit One Button */}
            <button 
                onClick={handleEnter}
                className="group relative flex flex-col items-center justify-center w-64 h-32 bg-[#d97706] text-[#2a0a0a] rounded-sm shadow-[0_0_50px_rgba(217,119,6,0.4)] hover:shadow-[0_0_80px_rgba(217,119,6,0.6)] border-4 border-double border-[#78350f] transition-all overflow-hidden"
            >
                {/* Perforation lines */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-black rounded-r-full"></div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-black rounded-l-full"></div>
                
                <div className="flex items-center gap-2 mb-1">
                    <Ticket size={24} className="text-[#2a0a0a]" />
                    <span className="font-brand font-bold text-2xl uppercase tracking-widest">Admit One</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-[#78350f] group-hover:text-white transition-colors">
                     <Mic2 size={12} />
                     <span>Start The Show</span>
                </div>

                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
            </button>

            <p className="text-[#d4b996] text-xs font-serif italic mt-8 text-center opacity-60">
                Click to open the curtains and enable audio
            </p>
        </div>
      </div>
    </div>
  );
};

export default IntroCurtains;