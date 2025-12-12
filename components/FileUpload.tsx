import React, { useCallback, useState } from 'react';
import { Upload, Music, AlertCircle, Mic2 } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      validateAndSelect(files[0]);
    }
  }, [disabled]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSelect(e.target.files[0]);
    }
  };

  const validateAndSelect = (file: File) => {
    setError(null);
    if (!file.type.startsWith('audio/')) {
      setError("Please upload a valid audio file (MP3, WAV, etc).");
      return;
    }
    // Limit to ~10MB for this demo
    if (file.size > 10 * 1024 * 1024) {
      setError("File size is too large. Please upload a file smaller than 10MB.");
      return;
    }
    onFileSelect(file);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-4 border-double rounded-sm p-16 transition-all duration-300 ease-out
          flex flex-col items-center justify-center text-center cursor-pointer group
          ${isDragging 
            ? 'border-echo-gold bg-[#2a0a0a]' 
            : 'border-echo-gold/30 bg-[#2a0a0a] hover:border-echo-gold hover:bg-[#1a0505]'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          shadow-2xl
        `}
      >
        {/* Decorative corner accents */}
        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-echo-gold"></div>
        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-echo-gold"></div>
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-echo-gold"></div>
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-echo-gold"></div>

        <input
          type="file"
          accept="audio/*"
          onChange={handleInputChange}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-20"
        />
        
        <div className={`
          p-6 rounded-full mb-6 transition-all border-4
          ${isDragging 
            ? 'bg-echo-gold text-[#2a0a0a] border-[#2a0a0a]' 
            : 'bg-[#1a0505] text-echo-gold border-echo-gold group-hover:scale-110'
          }
        `}>
          <Mic2 size={48} strokeWidth={1.5} />
        </div>

        <h3 className="text-3xl font-bold text-white mb-2 uppercase brand-font tracking-wide">
          Upload Lecture Audio
        </h3>
        <p className="text-[#d4b996] text-sm max-w-sm mx-auto mb-8 font-serif italic">
          "Drop your recording here to begin the show." <br/> Max size 10MB.
        </p>
        
        <div className="px-8 py-3 bg-[#7f1d1d] text-white text-xs font-bold uppercase tracking-widest rounded-sm border border-[#450a0a] group-hover:bg-[#991b1b] transition-colors shadow-lg">
          Select Audio Track
        </div>
        
        {error && (
          <div className="flex items-center gap-2 text-red-200 text-sm bg-red-900/80 px-4 py-2 border border-red-500 mt-6 absolute bottom-4 rounded-sm shadow-lg z-30">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;