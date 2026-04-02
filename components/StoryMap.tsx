import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Novel, EmotionType } from '../types';
import { EMOTION_CONFIGS } from '../constants';

interface StoryMapProps {
  novel: Novel;
  currentChapterId: string;
  onJump: (id: string) => void;
  onClose: () => void;
  isDark: boolean;
}

const StoryMap: React.FC<StoryMapProps> = ({ novel, currentChapterId, onJump, onClose, isDark }) => {
  const sortedChapters = useMemo(() => [...novel.chapters].sort((a, b) => a.order - b.order), [novel.chapters]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // High-speed scroll speed for mouse wheel
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY * 3;
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Handle Drag-to-Scroll
  const onMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const onMouseLeave = () => setIsDragging(false);
  const onMouseUp = () => setIsDragging(false);

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 4; 
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  // Center initial chapter on mount
  useEffect(() => {
    if (scrollRef.current) {
      const activeNode = scrollRef.current.querySelector(`[data-chapter-id="${currentChapterId}"]`);
      if (activeNode) {
        activeNode.scrollIntoView({ behavior: 'auto', inline: 'center' });
      }
    }
  }, []);

  // Neutral background to avoid "being affected by any color"
  const bgColor = isDark ? 'bg-zinc-950' : 'bg-[#faf9f6]';
  const textColor = isDark ? 'text-white' : 'text-black';

  return (
    <div className={`fixed inset-0 z-[200] flex flex-col items-center justify-center p-8 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-500 ${bgColor}`}>
      
      {/* Background Orbits - Now Neutral */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0">
        <div className={`absolute w-[120vw] h-[120vw] border-[0.5px] rounded-full opacity-[0.05] animate-[spin_180s_linear_infinite] ${isDark ? 'border-white' : 'border-black'}`} />
        <div className={`absolute w-[80vw] h-[80vw] border-[0.5px] rounded-full opacity-[0.08] animate-[spin_120s_linear_reverse_infinite] ${isDark ? 'border-white' : 'border-black'}`} />
      </div>

      <button 
        onClick={onClose}
        className={`absolute top-10 right-10 p-4 rounded-full transition-all z-50 hover:scale-110 active:scale-90 ${isDark ? 'text-white/40 hover:text-white hover:bg-white/10' : 'text-zinc-400 hover:text-zinc-900 hover:bg-black/5'}`}
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>

      <div className="text-center mb-8 relative z-10 pointer-events-none">
        <h2 className={`font-serif text-4xl md:text-5xl mb-2 tracking-tighter ${textColor}`}>
          Map of the Universe
        </h2>
        <p className={`text-[10px] uppercase tracking-[0.6em] font-black opacity-40 ${textColor}`}>
          Navigate the Celestial Script
        </p>
      </div>

      <div 
        ref={scrollRef}
        onMouseDown={onMouseDown}
        onMouseLeave={onMouseLeave}
        onMouseUp={onMouseUp}
        onMouseMove={onMouseMove}
        className={`w-full h-[50vh] flex items-center overflow-x-auto overflow-y-hidden scroll-smooth no-scrollbar relative select-none cursor-grab active:cursor-grabbing z-10`}
      >
        <div className="flex items-center gap-16 md:gap-24 px-[45vw] z-10">
          {sortedChapters.map((chapter, idx) => {
            const isActualCurrent = chapter.id === currentChapterId;
            const chapterImg = chapter.illustration || chapter.image || `https://picsum.photos/seed/${chapter.id}/300/300`;
            const config = EMOTION_CONFIGS[chapter.emotion];
            
            return (
              <React.Fragment key={chapter.id}>
                <div 
                  data-chapter-id={chapter.id}
                  className={`flex flex-col items-center gap-6 group relative transition-all duration-500`}
                >
                  {/* Current Position Marker */}
                  <div className={`absolute -top-12 transition-all duration-500 ${isActualCurrent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <div className={`text-[8px] font-black uppercase tracking-[0.3em] px-4 py-1.5 rounded-full border shadow-lg ${isDark ? 'border-white bg-black text-white' : 'border-black bg-white text-black'}`}>
                      Current
                    </div>
                  </div>

                  {/* Planet Node - Now smaller */}
                  <button 
                    onClick={() => !isDragging && onJump(chapter.id)}
                    className={`relative w-28 h-28 md:w-36 md:h-36 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.15)] transition-all duration-500 
                      ${isActualCurrent ? 'scale-110 ring-[4px] ring-black/10' : 'scale-100 hover:scale-105 opacity-60 hover:opacity-100'} 
                      overflow-hidden cursor-pointer active:scale-95 group`}
                  >
                    {/* Chapter Image */}
                    <div 
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-[4s] group-hover:scale-110 grayscale group-hover:grayscale-0" 
                      style={{ backgroundImage: `url(${chapterImg})` }}
                    />
                    
                    {/* Dark Scrim - for visibility */}
                    <div className={`absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all duration-500`} />

                    {/* Simple Chapter Number Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                       <span className={`text-[10px] font-black uppercase tracking-[0.2em] text-white drop-shadow-md`}>
                        {chapter.isSpecial ? 'Vol' : `${idx + 1}`}
                       </span>
                    </div>
                  </button>

                  {/* Exterior Text Label - Solid Black Titles */}
                  <div className={`text-center transition-all duration-500 w-48`}>
                     <p className={`text-[9px] font-black uppercase tracking-[0.4em] mb-1 ${textColor} opacity-30`}>
                      {chapter.isSpecial ? 'Section' : `Point ${idx + 1}`}
                     </p>
                     <p className={`font-serif text-sm md:text-base font-bold ${textColor} uppercase tracking-wider`}>
                       {chapter.title}
                     </p>
                  </div>
                </div>

                {/* Connection Line */}
                {idx < sortedChapters.length - 1 && (
                  <div className="relative w-16 md:w-24 flex items-center justify-center flex-shrink-0">
                    <div className={`h-[1px] w-full ${isDark ? 'bg-white' : 'bg-black'} opacity-10`} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Legend Footer - Simplified and Minimal */}
      <div className={`mt-12 pb-8 flex flex-wrap justify-center gap-x-10 gap-y-4 relative z-10 border-t pt-8 ${isDark ? 'border-white/5' : 'border-black/5'}`}>
        {Object.entries(EmotionType).map(([key, value]) => {
          const config = EMOTION_CONFIGS[value as EmotionType];
          return (
            <div key={key} className="flex items-center gap-3 opacity-40 hover:opacity-100 transition-opacity cursor-default">
              <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-br ${config.border} ring-1 ${isDark ? 'ring-white/5' : 'ring-black/5'}`} />
              <span className={`text-[9px] uppercase font-bold tracking-[0.2em] ${textColor}`}>
                {value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StoryMap;