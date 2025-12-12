import React, { useState } from 'react';
import { AnalysisResult } from '../types';
import { Tag, FileText, Target, Activity, Stethoscope, BookOpen, Users, HelpCircle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

interface AnalysisDisplayProps {
  data: AnalysisResult;
}

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ data }) => {
  const [showTranscript, setShowTranscript] = useState(false);
  const [revealedAnswers, setRevealedAnswers] = useState<number[]>([]);

  const toggleAnswer = (idx: number) => {
    if (revealedAnswers.includes(idx)) {
      setRevealedAnswers(revealedAnswers.filter(i => i !== idx));
    } else {
      setRevealedAnswers([...revealedAnswers, idx]);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header Section - Vintage Showbill Look */}
      <div className="bg-[#2a0a0a] border-y-4 border-double border-echo-gold/40 p-10 shadow-2xl relative overflow-hidden">
        {/* Background Texture */}
        <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'radial-gradient(circle, #d97706 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>

        <div className="relative z-10 text-center">
            <div className="flex items-center justify-center gap-3 text-echo-gold text-sm font-bold uppercase tracking-[0.2em] mb-4">
              <span className="h-[1px] w-12 bg-echo-gold"></span>
              <span>{data.lesson?.target_audience || "Medical Lesson Plan"}</span>
              <span className="h-[1px] w-12 bg-echo-gold"></span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-white uppercase tracking-tight brand-font mb-6 leading-none text-shadow-md">
            {data.lesson?.topic || data.title}
          </h1>
          
          <p className="text-[#d4b996] text-xl font-serif italic max-w-3xl mx-auto mb-8 leading-relaxed">
            "{data.description}"
          </p>
          
          {/* Keywords */}
          <div className="flex flex-wrap justify-center gap-3">
            {data.keywords.map((keyword, idx) => (
              <span 
                key={idx} 
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#1a0505] text-echo-gold text-xs font-bold uppercase tracking-wider border border-echo-gold/30 rounded-sm shadow-sm"
              >
                <Tag size={10} />
                {keyword}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Lesson Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Objectives & Anatomy - CHALKBOARD STYLE */}
        <div className="space-y-8">
          {/* Learning Objectives */}
          <div className="bg-echo-blackboard border-8 border-[#3a2a1a] rounded-sm shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{backgroundImage: 'url("https://www.transparenttextures.com/patterns/blackboard.png")'}}></div>
            
            <div className="p-6 border-b border-white/10 relative z-10 flex items-center justify-center">
               <div className="flex items-center gap-3 text-echo-chalk">
                  <Target size={24} />
                  <h2 className="text-xl font-bold uppercase brand-font tracking-widest border-b-2 border-echo-chalk/30 pb-1">Objectives</h2>
               </div>
            </div>
            <div className="p-8 relative z-10">
              <ul className="space-y-6 font-handwriting">
                {data.lesson?.learning_objectives?.map((obj, i) => (
                  <li key={i} className="flex items-start gap-4 text-echo-chalk group">
                    <div className="mt-1 text-echo-gold shrink-0">
                       <CheckCircle2 size={18} />
                    </div>
                    <span className="leading-snug text-lg font-serif italic">{obj}</span>
                  </li>
                )) || <p className="text-slate-500 italic">No specific objectives extracted.</p>}
              </ul>
            </div>
          </div>

           {/* Anatomical Structures - CHALKBOARD STYLE */}
           <div className="bg-echo-blackboard border-8 border-[#3a2a1a] rounded-sm shadow-xl relative overflow-hidden">
             <div className="absolute inset-0 opacity-20 pointer-events-none" style={{backgroundImage: 'url("https://www.transparenttextures.com/patterns/blackboard.png")'}}></div>
            
            <div className="p-6 border-b border-white/10 relative z-10 flex items-center justify-center">
               <div className="flex items-center gap-3 text-echo-chalk">
                  <Activity size={24} />
                  <h2 className="text-xl font-bold uppercase brand-font tracking-widest border-b-2 border-echo-chalk/30 pb-1">Anatomy Board</h2>
               </div>
            </div>
            <div className="p-8 flex flex-wrap gap-3 relative z-10 justify-center">
               {data.lesson?.anatomical_structures?.map((item, i) => (
                 <span key={i} className="px-3 py-1 border-2 border-echo-chalk/30 text-echo-chalk text-base font-serif italic rounded-full transform hover:-rotate-2 transition-transform cursor-default">
                   {item}
                 </span>
               )) || <p className="text-slate-500 italic">No anatomy specified.</p>}
            </div>
          </div>
        </div>

        {/* Right Column: Clinical & Tips - VINTAGE PAPER STYLE */}
        <div className="space-y-8">
          {/* Clinical Correlation */}
          <div className="bg-echo-cream text-[#2a0a0a] border border-[#d4b996] shadow-xl p-8 relative rotate-1">
             {/* Paper Texture Effect */}
             <div className="absolute top-0 left-0 w-full h-8 bg-[#d97706]/10 border-b border-[#d97706]/20 mb-4"></div>
             <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#2a0a0a] rounded-full shadow-sm z-20"></div> {/* Pin */}

            <div className="flex items-center gap-3 text-[#7f1d1d] mb-6 mt-4">
               <Stethoscope size={24} />
               <h2 className="text-2xl font-bold uppercase brand-font tracking-wide">Clinical Notes</h2>
            </div>
            
            <div className="space-y-6">
              <p className="text-[#450a0a] leading-relaxed font-serif text-lg">
                {data.lesson?.clinical_correlation || "No specific clinical notes available."}
              </p>
              
              <div className="mt-6 pt-6 border-t-2 border-dotted border-[#450a0a]/20">
                 <div className="flex items-center gap-2 text-[#7f1d1d] font-bold uppercase text-xs mb-2">
                    <BookOpen size={14} />
                    <span>Pro Tip</span>
                 </div>
                 <div className="bg-yellow-100 p-4 border-l-4 border-[#d97706]">
                    <p className="text-[#450a0a] text-sm italic font-serif font-bold">
                       "{data.lesson?.technique_tips || "Standard scanning protocols apply."}"
                    </p>
                 </div>
              </div>
            </div>
          </div>

          {/* Community Discussion */}
          <div className="bg-[#2a0a0a] border border-echo-gold/30 p-8 shadow-xl relative">
             <div className="flex items-center gap-3 text-echo-gold mb-4">
                <Users size={24} />
                <h2 className="text-xl font-bold uppercase brand-font tracking-wide">Cast Party Discussion</h2>
             </div>
            <div className="p-6 bg-[#1a0505] border border-echo-gold/10">
              <p className="text-[#d4b996] italic text-lg font-serif">
                "{data.lesson?.community_discussion || "Discuss this case with your study group."}"
              </p>
              <p className="mt-4 text-xs text-echo-gold/50 uppercase tracking-wider font-bold">
                 For The Green Room
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quiz Section - Game Show Style */}
      {data.lesson?.quiz && data.lesson.quiz.length > 0 && (
        <div className="bg-gradient-to-r from-[#7f1d1d] to-[#450a0a] border-4 border-[#2a0a0a] rounded-lg p-8 shadow-2xl relative">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
           
           <div className="flex items-center justify-center gap-3 mb-10 text-white relative z-10">
              <HelpCircle size={32} className="text-echo-gold" />
              <h2 className="text-3xl font-bold uppercase brand-font tracking-widest text-shadow-lg">Board Exam Review</h2>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
             {data.lesson.quiz.map((q, idx) => (
               <div key={idx} className="bg-[#2a0a0a] border-2 border-echo-gold/30 p-6 flex flex-col justify-between hover:border-echo-gold transition-colors shadow-lg group">
                 <div>
                   <span className="inline-block px-2 py-1 bg-echo-gold text-[#2a0a0a] text-[10px] font-bold uppercase mb-4 tracking-widest rounded-sm">Question {idx + 1}</span>
                   <p className="text-white font-medium mb-6 leading-relaxed font-serif">{q.question}</p>
                 </div>
                 
                 <div className="mt-auto">
                   {revealedAnswers.includes(idx) ? (
                     <div className="bg-green-900/30 text-green-400 p-4 text-sm border-l-4 border-green-500 animate-fade-in font-serif">
                       <span className="font-bold block mb-1 text-[10px] uppercase opacity-70 font-sans">Correct Answer</span>
                       {q.answer}
                     </div>
                   ) : (
                     <button 
                       onClick={() => toggleAnswer(idx)}
                       className="w-full text-xs bg-[#1a0505] hover:bg-echo-gold hover:text-[#2a0a0a] text-echo-gold border border-echo-gold/50 font-bold uppercase py-3 tracking-wider transition-all"
                     >
                       Reveal Answer
                     </button>
                   )}
                 </div>
               </div>
             ))}
           </div>
        </div>
      )}

      {/* Collapsible Transcript */}
      <div className="border-t border-[#450a0a] pt-6 flex justify-center">
        <button 
          onClick={() => setShowTranscript(!showTranscript)}
          className="flex items-center gap-2 text-[#7f1d1d] hover:text-echo-gold transition-colors py-2 uppercase text-xs font-bold tracking-widest bg-[#2a0a0a] px-6 rounded-full border border-[#450a0a]"
        >
          <FileText size={16} />
          <span>Show Full Script</span>
          {showTranscript ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
        
      {showTranscript && (
        <div className="mt-4 bg-[#fef3c7] text-[#2a0a0a] p-8 border-4 border-[#2a0a0a] font-serif whitespace-pre-wrap max-h-96 overflow-y-auto custom-scrollbar text-base leading-relaxed shadow-inner">
          {data.transcript}
        </div>
      )}
    </div>
  );
};

export default AnalysisDisplay;