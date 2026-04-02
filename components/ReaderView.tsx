
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Novel, AppSettings, EmotionType, Highlight, Quote, Achievement } from '../types';
import { EMOTION_CONFIGS } from '../constants';
import { storageService } from '../services/storage';
import { achievementsService } from '../services/achievements';
import StoryMap from './StoryMap';
import QuotesPanel from './QuotesPanel';

interface ReaderViewProps {
  novel: Novel;
  setNovel: React.Dispatch<React.SetStateAction<Novel>>;
  onBack: () => void;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

const ReaderView: React.FC<ReaderViewProps> = ({ novel, setNovel, onBack, settings, setSettings }) => {
  const sortedChapters = useMemo(() => {
    return [...novel.chapters].sort((a, b) => a.order - b.order);
  }, [novel.chapters]);

  const [currentChapterIndex, setCurrentChapterIndex] = useState(() => {
    const idx = sortedChapters.findIndex(c => c.id === novel.lastReadChapterId);
    return idx === -1 ? 0 : idx;
  });

  const [showUI, setShowUI] = useState(true);
  const [transitioning, setTransitioning] = useState<'in' | 'out' | 'none'>('none');
  const [isRitualActive, setIsRitualActive] = useState(false);
  const [quoteCapturePosition, setQuoteCapturePosition] = useState<{ top: number; left: number } | null>(null);
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(!!document.fullscreenElement);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isQuotesOpen, setIsQuotesOpen] = useState(false);
  const [quotes, setQuotes] = useState<Quote[]>(() => storageService.getQuotes());
  const [activeAchievement, setActiveAchievement] = useState<Omit<Achievement, 'unlockedAt'> | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const uiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ritualTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sessionStartTime = useRef(Date.now());
  
  const currentChapter = sortedChapters[currentChapterIndex];
  const emotionConfig = EMOTION_CONFIGS[currentChapter?.emotion || EmotionType.Calm];

  const isDark = settings.theme === 'dark';
  const progress = ((currentChapterIndex + 1) / sortedChapters.length) * 100;

  useEffect(() => {
    const handleFsChange = () => setIsBrowserFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  useEffect(() => {
    if (novel.lastScrollPosition && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = novel.lastScrollPosition;
    }
  }, []);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      storageService.saveNovel({
        ...novel,
        lastScrollPosition: scrollContainerRef.current.scrollTop
      });
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const elapsed = (Date.now() - sessionStartTime.current) / 1000 / 60;
      if (elapsed >= 30) {
        const unlocked = achievementsService.checkAndUnlock('marathon_reader');
        if (unlocked) {
          setActiveAchievement(unlocked);
          setTimeout(() => setActiveAchievement(null), 5000);
        }
      }
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const startRitual = useCallback(() => {
    if (ritualTimeoutRef.current) clearTimeout(ritualTimeoutRef.current);
    setIsRitualActive(true);
    ritualTimeoutRef.current = setTimeout(() => setIsRitualActive(false), 4000);
    
    const unlocked = achievementsService.checkAndUnlock('first_chapter');
    if (unlocked) {
      setActiveAchievement(unlocked);
      setTimeout(() => setActiveAchievement(null), 5000);
    }
  }, [currentChapterIndex]);

  useEffect(() => {
    startRitual();
  }, [currentChapterIndex]);

  useEffect(() => {
    const audio = document.getElementById('ambient-audio') as HTMLAudioElement;
    if (!audio) return;
    audioRef.current = audio;
    
    const playMusic = async () => {
      const targetUrl = currentChapter?.musicUrl || emotionConfig.audioUrl;
      
      if (targetUrl && audio.src !== targetUrl) {
        setIsAudioLoading(true);
        audio.src = targetUrl;
        audio.load();
      }

      try {
        if (!settings.isMuted) {
          audio.volume = 0;
          await audio.play();
          let vol = 0;
          const fadeInterval = setInterval(() => {
            vol += 0.02;
            if (vol >= settings.volume) {
              audio.volume = settings.volume;
              clearInterval(fadeInterval);
            } else {
              audio.volume = vol;
            }
          }, 100);
        } else {
          audio.pause();
        }
      } catch (e) { console.warn("Audio issue:", e); } finally { setIsAudioLoading(false); }
    };
    playMusic();
  }, [currentChapterIndex, emotionConfig.audioUrl, currentChapter?.musicUrl]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const chapterNum = parseInt(searchQuery);
    if (!isNaN(chapterNum)) {
      const targetChapter = sortedChapters.find(c => c.order === chapterNum);
      if (targetChapter) {
        changeChapter(targetChapter.id);
        setIsSearchOpen(false);
        setSearchQuery('');
      }
    }
  };

  const changeChapter = (dir: 'next' | 'prev' | string) => {
    let nextIdx = currentChapterIndex;
    if (dir === 'next') {
      nextIdx = currentChapterIndex + 1;
    } else if (dir === 'prev') {
      nextIdx = currentChapterIndex - 1;
    } else {
      nextIdx = sortedChapters.findIndex(c => c.id === dir);
    }

    if (nextIdx >= 0 && nextIdx < sortedChapters.length) {
      setTransitioning('out');
      setQuoteCapturePosition(null);
      setTimeout(() => {
        setCurrentChapterIndex(nextIdx);
        setTransitioning('in');
        storageService.saveNovel({
          ...novel,
          lastReadChapterId: sortedChapters[nextIdx].id,
          lastScrollPosition: 0
        });
        if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
        setTimeout(() => setTransitioning('none'), 700);
      }, 700);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  };

  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (contentRef.current && contentRef.current.contains(range.commonAncestorContainer)) {
        setQuoteCapturePosition({
          top: rect.top + window.scrollY - 50,
          left: rect.left + window.scrollX + rect.width / 2,
        });
      }
    } else {
      setQuoteCapturePosition(null);
    }
  };

  const saveQuote = () => {
    const text = window.getSelection()?.toString().trim();
    if (!text) return;
    const quote: Quote = { id: `q-${Date.now()}`, text, chapterId: currentChapter.id, chapterTitle: currentChapter.title, timestamp: Date.now() };
    storageService.saveQuote(quote);
    setQuotes(storageService.getQuotes());
    setQuoteCapturePosition(null);
    window.getSelection()?.removeAllRanges();
  };

  return (
    <div 
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className={`fixed inset-0 transition-colors duration-2000 overflow-y-auto overflow-x-hidden select-text cursor-default ${isDark ? 'bg-[#111]' : 'bg-[#faf9f6]'}`}
      onMouseUp={handleMouseUp}
    >
      {/* EMOTION OVERLAY */}
      <div 
        className="fixed inset-0 pointer-events-none transition-all duration-2000 z-[1]"
        style={{ backgroundColor: emotionConfig.bgOverlay }}
      />

      {/* CHAPTER RITUAL OVERLAY */}
      {isRitualActive && (
        <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-black ritual-overlay">
          <div className="text-center ritual-text px-6">
            <h1 className="font-serif text-5xl md:text-8xl text-white mb-6 tracking-tight leading-tight">{currentChapter?.title}</h1>
            <div className="w-24 h-px bg-white/20 mx-auto mb-6" />
            <p className="text-white/40 uppercase tracking-[0.6em] text-[10px] font-black">Chapter {currentChapter?.order}</p>
          </div>
        </div>
      )}

      {/* TOP PROGRESS */}
      <div className="top-progress" style={{ width: `${progress}%`, backgroundColor: isDark ? '#fff' : '#000' }} />

      {/* OVERLAYS */}
      {isMapOpen && <StoryMap novel={novel} currentChapterId={currentChapter.id} isDark={isDark} onClose={() => setIsMapOpen(false)} onJump={(id) => { changeChapter(id); setIsMapOpen(false); }} />}
      {isQuotesOpen && <QuotesPanel quotes={quotes} isDark={isDark} onClose={() => setIsQuotesOpen(false)} onDelete={(id) => { storageService.deleteQuote(id); setQuotes(storageService.getQuotes()); }} onJump={(id) => { changeChapter(id); setIsQuotesOpen(false); }} />}

      {/* ILLUSTRATION AREA */}
      <div className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[28%] items-center justify-center p-12 z-10 pointer-events-none transition-opacity duration-1000">
        <div className="w-full h-full max-h-[75vh] relative flex items-center justify-center">
          {currentChapter?.illustration ? (
            <img 
              src={currentChapter.illustration} 
              alt="Art" 
              className={`w-full h-full object-cover rounded-md shadow-2xl grayscale transition-all duration-2000 hover:grayscale-0 ${isDark ? 'opacity-25 hover:opacity-100' : 'opacity-80 hover:opacity-100'}`}
            />
          ) : (
            <div className={`w-full h-full border-2 border-dashed flex items-center justify-center rounded-xl ${isDark ? 'border-white/5 text-white/5' : 'border-zinc-200/40 text-zinc-200'}`}>
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            </div>
          )}
        </div>
      </div>

      {/* MAIN TEXT */}
      <div className={`relative min-h-screen flex flex-col pt-32 pb-48 px-6 lg:pl-[32%] transition-all duration-1000 z-[5] ${
        transitioning === 'out' ? 'page-exit' : transitioning === 'in' ? 'page-enter' : 'page-active'
      }`}>
        <div className="max-w-[50vw] w-full mx-auto lg:mx-0">
          <header className="mb-28 text-left">
             <div className="flex items-center gap-4 mb-8">
                <div className={`w-8 h-px ${isDark ? 'bg-white/20' : 'bg-zinc-200'}`} />
                <span className={`text-[10px] uppercase font-black tracking-[0.4em] ${isDark ? 'text-white/30' : 'text-zinc-400'}`}>Chapter {currentChapter?.order}</span>
             </div>
            <h2 className={`font-serif text-5xl md:text-8xl mb-12 tracking-tight transition-all duration-1000 leading-[1.1] ${isDark ? 'text-white' : 'text-zinc-900'}`}>
              {currentChapter?.title}
            </h2>
          </header>

          <div 
            ref={contentRef}
            className={`reader-text-container font-serif w-full transition-all duration-700 prose prose-lg md:prose-2xl selection:bg-zinc-500/20 ${isDark ? 'prose-invert text-zinc-100' : 'text-zinc-800'}`}
            style={{ fontSize: `${settings.fontSize}px`, lineHeight: settings.lineHeight || 1.8 }}
            dangerouslySetInnerHTML={{ __html: currentChapter?.content || '' }}
          />
        </div>
      </div>

      {/* QUOTE UI */}
      {quoteCapturePosition && (
        <div className="fixed z-[100] animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ top: `${quoteCapturePosition.top}px`, left: `${quoteCapturePosition.left}px`, transform: 'translateX(-50%)' }}>
          <button onClick={saveQuote} className={`px-6 py-2 rounded-full shadow-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all hover:scale-110 active:scale-95 ${isDark ? 'bg-white text-black border-white' : 'bg-black text-white border-black'}`}>Capture Fragment</button>
        </div>
      )}

      {/* EMOTION BORDER */}
      <div className={`fixed bottom-0 left-0 right-0 h-2 emotion-border bg-gradient-to-r ${emotionConfig?.border || 'from-transparent to-transparent'} transition-all duration-2000 z-[100] ${showUI ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-1'}`} />

      {/* TOP CONTROLS */}
      <div className={`fixed top-0 left-0 right-0 h-28 flex items-center justify-between px-12 transition-all duration-700 z-[100] ${showUI ? 'opacity-100 bg-gradient-to-b from-black/20 via-black/5 to-transparent' : 'opacity-0 pointer-events-none -translate-y-4'}`}>
        <button onClick={onBack} className={`text-[10px] uppercase tracking-[0.4em] font-black flex items-center gap-4 transition-all hover:gap-6 ${isDark ? 'text-white/60 hover:text-white' : 'text-zinc-400 hover:text-zinc-900'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
          Exit World
        </button>

        <div className="flex items-center gap-10">
           <button onClick={() => setIsMapOpen(true)} className={`text-[10px] uppercase tracking-widest font-black transition-colors ${isDark ? 'text-white/60 hover:text-white' : 'text-zinc-400 hover:text-zinc-900'}`}>Story Map</button>
           <button onClick={() => setIsQuotesOpen(true)} className={`text-[10px] uppercase tracking-widest font-black transition-colors ${isDark ? 'text-white/60 hover:text-white' : 'text-zinc-400 hover:text-zinc-900'}`}>Collected Fragments ({quotes.length})</button>
           
           <div className="flex items-center gap-4 group/vol">
              <button onClick={() => setSettings(s => ({ ...s, isMuted: !s.isMuted }))} className={`p-2 rounded-full transition-all ${isDark ? 'text-white/40 hover:text-white hover:bg-white/5' : 'text-zinc-400 hover:text-zinc-900 hover:bg-black/5'}`}>
                {settings.isMuted ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg> : <svg className={`w-5 h-5 ${isAudioLoading ? 'animate-pulse' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>}
              </button>
              <input type="range" min="0" max="1" step="0.01" value={settings.volume} onChange={(e) => setSettings(s => ({ ...s, volume: parseFloat(e.target.value), isMuted: false }))} className="w-20 h-1 rounded-full cursor-pointer accent-zinc-500 opacity-0 group-hover/vol:opacity-100 transition-all scale-x-0 group-hover/vol:scale-x-100 origin-right" />
           </div>

           <div className="flex items-center gap-6">
              <div className="relative">
                <button 
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className={`p-2 rounded-full transition-all ${isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-zinc-900'}`}
                  title="Search"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                </button>
                {isSearchOpen && (
                  <form onSubmit={handleSearch} className={`absolute top-12 right-0 p-2 rounded-xl shadow-xl border w-48 animate-in fade-in zoom-in-95 duration-200 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100'}`}>
                    <input
                      autoFocus
                      type="number"
                      placeholder="chapter number"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`w-full bg-transparent border-none outline-none text-sm font-bold p-2 ${isDark ? 'text-white placeholder:text-zinc-600' : 'text-zinc-900 placeholder:text-zinc-300'}`}
                    />
                  </form>
                )}
              </div>
              <button 
                onClick={toggleFullscreen} 
                className={`p-2 rounded-full transition-all ${isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-zinc-900'}`}
                title="Toggle Fullscreen"
              >
                {isBrowserFullscreen ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>
                )}
              </button>

              <button onClick={() => setSettings(s => ({ ...s, theme: s.theme === 'light' ? 'dark' : 'light' }))} className={`p-2 rounded-full transition-all ${isDark ? 'text-yellow-400 bg-white/5' : 'text-zinc-400 hover:text-zinc-900'}`}>
                {isDark ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>}
              </button>
           </div>
        </div>
      </div>

      {/* BOTTOM CONTROLS */}
      <div className={`fixed bottom-12 left-0 right-0 flex items-center justify-between px-20 transition-all duration-700 z-[100] ${showUI ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <button onClick={() => changeChapter('prev')} disabled={currentChapterIndex === 0} className={`disabled:opacity-0 transition-all uppercase text-[10px] tracking-[0.6em] font-black ${isDark ? 'text-white/40 hover:text-white' : 'text-zinc-400 hover:text-zinc-900'}`}>Back</button>
        <div className="flex flex-col items-center">
            <span className={`text-[10px] uppercase tracking-[0.4em] mb-4 font-black transition-all ${isDark ? 'text-white/30' : 'text-zinc-400'}`}>Chapter {currentChapter?.order} • {currentChapterIndex + 1} / {sortedChapters.length}</span>
            <div className={`w-96 h-[2px] rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-zinc-100'}`}>
                <div className={`h-full transition-all duration-1000 cubic-bezier(0.23, 1, 0.32, 1) ${isDark ? 'bg-white/50' : 'bg-zinc-900'}`} style={{ width: `${progress}%` }} />
            </div>
        </div>
        <button onClick={() => changeChapter('next')} disabled={currentChapterIndex === sortedChapters.length - 1} className={`disabled:opacity-0 transition-all uppercase text-[10px] tracking-[0.6em] font-black ${isDark ? 'text-white/40 hover:text-white' : 'text-zinc-400 hover:text-zinc-900'}`}>Forward</button>
      </div>

      {/* FLOATING ACTION BUTTONS */}
      <div className="fixed top-32 right-12 flex flex-col gap-4 z-[100]">
        <button 
          onClick={toggleFullscreen}
          className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all shadow-xl hover:scale-110 active:scale-90 ${isDark ? 'border-white/10 text-white/40 bg-[#111] hover:text-white' : 'border-zinc-100 text-zinc-300 bg-white hover:text-zinc-900'}`}
        >
          {isBrowserFullscreen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>
          )}
        </button>
        
        <button className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all shadow-xl hover:scale-110 active:scale-90 ${isDark ? 'border-white/10 text-white/40 bg-[#111] hover:text-white' : 'border-zinc-100 text-zinc-300 bg-white hover:text-zinc-900'}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>
        </button>
      </div>
    </div>
  );
};

export default ReaderView;
