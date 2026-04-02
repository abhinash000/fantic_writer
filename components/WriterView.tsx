import React, { useState, useEffect, useRef } from 'react';
import { Novel, Chapter, EmotionType, AppSettings } from '../types';
import { storageService } from '../services/storage';
import { docxParserService } from '../services/docxParser';
import { EMOTION_CONFIGS } from '../constants';

interface WriterViewProps {
  novel: Novel;
  setNovel: React.Dispatch<React.SetStateAction<Novel>>;
  onBack: () => void;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

const WriterView: React.FC<WriterViewProps> = ({ novel, setNovel, onBack, settings, setSettings }) => {
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(novel.chapters[0]?.id || null);
  const [isZenMode, setIsZenMode] = useState(false);
  const [showMusicSettings, setShowMusicSettings] = useState(false);
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(!!document.fullscreenElement);
  const [importProgress, setImportProgress] = useState<number | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [animationKey, setAnimationKey] = useState(0);
  const editorRef = useRef<HTMLDivElement>(null);

  const selectedChapter = novel.chapters.find(c => c.id === selectedChapterId);
  const isDark = settings.theme === 'dark';

  useEffect(() => {
    const handleFsChange = () => setIsBrowserFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveChapter();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedChapter, novel]);

  const saveChapter = () => {
    if (!selectedChapterId || !editorRef.current) return;
    const content = editorRef.current.innerHTML;
    const updatedChapters = novel.chapters.map(c => 
      c.id === selectedChapterId ? { ...c, content } : c
    );
    const updatedNovel = { ...novel, chapters: updatedChapters };
    setNovel(updatedNovel);
    storageService.saveNovel(updatedNovel);
  };

  const addSpecialChapter = (type: 'title' | 'dedication' | 'epigraph' | 'prologue') => {
    let order = 0;
    let title = '';
    let content = '';
    let emotion = EmotionType.Calm;

    switch (type) {
      case 'title':
        order = 0.1;
        title = 'Title Page';
        emotion = EmotionType.Epic;
        content = '<div class="flex flex-col items-center justify-center h-[60vh] text-center"><h1 class="text-7xl md:text-9xl font-serif font-bold mb-6 tracking-tighter animate-[pulse_4s_ease-in-out_infinite]">THE SILENT ECHO</h1><div class="w-24 h-1 bg-current opacity-40 mx-auto my-8"></div><h2 class="text-2xl md:text-4xl font-light uppercase tracking-[0.4em] opacity-70 animate-[fadeIn_2s_ease-out]">A Journey Beyond</h2></div>';
        break;
      case 'dedication':
        order = 0.2;
        title = 'Dedication';
        emotion = EmotionType.Tender;
        content = '<div class="flex flex-col items-center justify-center h-[50vh] text-center italic font-serif"><p class="text-2xl md:text-3xl leading-relaxed opacity-80 mb-8">"To those who listen when the world is quiet."</p><p class="text-xs uppercase tracking-widest opacity-50">— For A.M.</p></div>';
        break;
      case 'epigraph':
        order = 0.3;
        title = 'Epigraph';
        emotion = EmotionType.Mysterious;
        content = '<div class="flex flex-col items-center justify-center h-[50vh] px-8 md:px-24"><blockquote class="text-xl md:text-3xl font-serif leading-loose text-center opacity-90">"We are but dust and shadows, drifting in the cosmic wind, seeking a place to land."</blockquote><cite class="mt-8 text-xs uppercase tracking-widest opacity-50">— The First Archives</cite></div>';
        break;
      case 'prologue':
        order = 0.4;
        title = 'Prologue';
        emotion = EmotionType.Dark;
        content = '<p>Before the silence fell, there was the hum. A low, vibrating frequency that rattled the teeth of the mountains and stirred the depths of the oceans.</p><p>They called it the Song of the Architect. But songs end. And when this one did, it didn\'t fade out. It snapped.</p>';
        break;
    }

    if (novel.chapters.some(c => c.order === order)) return;

    const newChapter: Chapter = { id: `c-special-${Date.now()}`, title, content, emotion, order, isSpecial: true };
    const updatedNovel = { ...novel, chapters: [...novel.chapters, newChapter] };
    setNovel(updatedNovel);
    setSelectedChapterId(newChapter.id);
    storageService.saveNovel(updatedNovel);
  };

  const addChapter = () => {
    const newChapter: Chapter = {
      id: `c-${Date.now()}`,
      title: `Chapter ${novel.chapters.filter(c => !c.isSpecial).length + 1}`,
      content: '<p>Start writing...</p>',
      emotion: EmotionType.Calm,
      order: Math.max(...novel.chapters.map(c => c.order), 0) + 1,
      isSpecial: false
    };
    const updatedNovel = { ...novel, chapters: [...novel.chapters, newChapter] };
    setNovel(updatedNovel);
    setSelectedChapterId(newChapter.id);
    storageService.saveNovel(updatedNovel);
  };

  const deleteChapter = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this chapter? This cannot be undone.')) return;
    
    const updatedChapters = novel.chapters.filter(c => c.id !== id);
    const updatedNovel = { ...novel, chapters: updatedChapters };
    setNovel(updatedNovel);
    storageService.saveNovel(updatedNovel);
    
    if (selectedChapterId === id) {
      setSelectedChapterId(updatedChapters[0]?.id || null);
    }
  };

  const handleImportDocx = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImportProgress(10);
      const parsedChapters = await docxParserService.parseDocx(file, (p) => setImportProgress(p));
      
      const newChapters: Chapter[] = parsedChapters.map((pc, idx) => ({
        ...pc,
        id: `c-import-${Date.now()}-${idx}`,
        order: Math.max(...novel.chapters.map(c => c.order), 0) + idx + 1,
        isSpecial: false
      }));

      const updatedNovel = {
        ...novel,
        chapters: [...novel.chapters, ...newChapters]
      };

      setNovel(updatedNovel);
      storageService.saveNovel(updatedNovel);
      
      if (newChapters.length > 0) {
        setSelectedChapterId(newChapters[0].id);
      }

      alert(`Successfully imported ${newChapters.length} chapters.`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error importing document");
    } finally {
      setImportProgress(null);
      e.target.value = ''; // Reset input
    }
  };

  const updateChapterMeta = (updates: Partial<Chapter>) => {
    const updatedChapters = novel.chapters.map(c => 
      c.id === selectedChapterId ? { ...c, ...updates } : c
    );
    const updatedNovel = { ...novel, chapters: updatedChapters };
    setNovel(updatedNovel);
    storageService.saveNovel(updatedNovel);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        updateChapterMeta({ illustration: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const chapterNum = parseInt(searchQuery);
    if (!isNaN(chapterNum)) {
      const targetChapter = novel.chapters.find(c => c.order === chapterNum);
      if (targetChapter) {
        saveChapter();
        setSelectedChapterId(targetChapter.id);
        setIsSearchOpen(false);
        setSearchQuery('');
      }
    }
  };

  const wordCount = selectedChapter?.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length || 0;

  return (
    <div className={`flex h-screen transition-colors duration-500 ${isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'}`}>
      {/* Sidebar */}
      {!isZenMode && (
        <aside className={`w-72 border-r flex flex-col h-full shadow-sm z-20 transition-colors ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
          <div className={`p-6 border-b flex items-center justify-between ${isDark ? 'border-zinc-800' : 'border-zinc-100'}`}>
            <h2 className="font-serif text-xl font-bold tracking-tight">Manuscript</h2>
            <button onClick={onBack} className={`p-2 transition-colors rounded-full ${isDark ? 'text-zinc-500 hover:text-white hover:bg-zinc-800' : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <div className="mb-6 border-b border-dashed border-zinc-200 dark:border-zinc-800 pb-4">
               <p className="text-[10px] uppercase font-black tracking-widest mb-2 opacity-50 pl-2">Front Matter</p>
               <div className="grid grid-cols-2 gap-2">
                 {!novel.chapters.find(c => c.order === 0.1) && <button onClick={() => addSpecialChapter('title')} className={`p-2 rounded text-[10px] uppercase font-bold tracking-wider border transition-all ${isDark ? 'border-zinc-800 hover:bg-zinc-800' : 'border-zinc-200 hover:bg-zinc-100'}`}>+ Title</button>}
                 {!novel.chapters.find(c => c.order === 0.2) && <button onClick={() => addSpecialChapter('dedication')} className={`p-2 rounded text-[10px] uppercase font-bold tracking-wider border transition-all ${isDark ? 'border-zinc-800 hover:bg-zinc-800' : 'border-zinc-200 hover:bg-zinc-100'}`}>+ Dedication</button>}
                 {!novel.chapters.find(c => c.order === 0.3) && <button onClick={() => addSpecialChapter('epigraph')} className={`p-2 rounded text-[10px] uppercase font-bold tracking-wider border transition-all ${isDark ? 'border-zinc-800 hover:bg-zinc-800' : 'border-zinc-200 hover:bg-zinc-100'}`}>+ Epigraph</button>}
                 {!novel.chapters.find(c => c.order === 0.4) && <button onClick={() => addSpecialChapter('prologue')} className={`p-2 rounded text-[10px] uppercase font-bold tracking-wider border transition-all ${isDark ? 'border-zinc-800 hover:bg-zinc-800' : 'border-zinc-200 hover:bg-zinc-100'}`}>+ Prologue</button>}
               </div>
            </div>

            {novel.chapters.sort((a,b) => a.order - b.order).map(chapter => (
              <div key={chapter.id} className="group relative">
                <button
                  onClick={() => { saveChapter(); setSelectedChapterId(chapter.id); }}
                  className={`w-full text-left p-3 rounded-lg text-sm transition-all pr-10 ${
                    selectedChapterId === chapter.id 
                      ? (isDark ? 'bg-zinc-100 text-zinc-900 shadow-lg translate-x-1' : 'bg-zinc-900 text-white shadow-lg translate-x-1')
                      : (isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-600')
                  }`}
                >
                  <div className="font-medium truncate">{chapter.title}</div>
                  <div className={`text-[10px] uppercase font-bold tracking-widest mt-1 ${selectedChapterId === chapter.id ? 'opacity-40' : (isDark ? 'text-zinc-600' : 'text-zinc-300')}`}>
                    {chapter.isSpecial ? 'Front Matter' : `Chapter ${chapter.order}`}
                  </div>
                </button>
                <button 
                  onClick={(e) => deleteChapter(chapter.id, e)}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md opacity-0 group-hover:opacity-100 transition-all active:scale-90 ${
                    selectedChapterId === chapter.id 
                      ? (isDark ? 'text-zinc-900/40 hover:text-zinc-900 hover:bg-black/5' : 'text-white/40 hover:text-white hover:bg-white/10') 
                      : (isDark ? 'text-zinc-600 hover:text-rose-400 hover:bg-zinc-700' : 'text-zinc-400 hover:text-rose-500 hover:bg-zinc-200')
                  }`}
                  title="Delete Chapter"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
            <button
              onClick={addChapter}
              className={`w-full mt-4 p-4 rounded-xl border-2 border-dashed transition-all text-sm font-bold uppercase tracking-widest ${isDark ? 'border-zinc-800 text-zinc-600 hover:border-zinc-700 hover:text-zinc-400' : 'border-zinc-200 text-zinc-400 hover:border-zinc-400 hover:text-zinc-600'}`}
            >
              + New Chapter
            </button>
          </div>

          <div className={`p-6 border-t space-y-3 ${isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-100 bg-zinc-50'}`}>
            <label className={`block w-full border p-3 rounded-lg text-[10px] uppercase tracking-widest font-bold text-center cursor-pointer transition-all active:scale-95 ${isDark ? 'bg-emerald-900/20 border-emerald-800 text-emerald-400 hover:bg-emerald-900/40' : 'bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100'}`}>
              {importProgress !== null ? `Parsing ${importProgress}%` : 'Import Word Book'}
              <input 
                type="file" 
                className="hidden" 
                accept=".docx" 
                onChange={handleImportDocx} 
                disabled={importProgress !== null}
              />
            </label>
            <button 
              onClick={() => storageService.exportAsJson(novel)}
              className={`w-full border p-3 rounded-lg text-[10px] uppercase tracking-widest font-bold transition-all active:scale-95 ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700' : 'bg-white border-zinc-200 text-zinc-900 hover:shadow-md'}`}
            >
              Export Universe
            </button>
          </div>
        </aside>
      )}

      {/* Editor Main */}
      <main className={`flex-1 flex flex-col overflow-hidden relative transition-colors duration-500 ${isDark ? 'bg-zinc-950' : 'bg-white'}`}>
        {importProgress !== null && (
          <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
             <div className="text-center">
                <div className="w-64 h-2 bg-white/10 rounded-full overflow-hidden mb-4">
                  <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${importProgress}%` }} />
                </div>
                <p className="text-white text-[10px] uppercase tracking-[0.4em] font-black animate-pulse">Deconstructing Manuscript...</p>
             </div>
          </div>
        )}

        {!isZenMode && (
          <header className={`h-24 border-b flex items-center justify-between px-10 z-10 shadow-sm transition-colors ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100'}`}>
            <div className="flex items-center gap-6 flex-1">
               <div className="flex flex-col relative">
                 <div className="flex items-center gap-2">
                   <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${isDark ? 'text-zinc-600' : 'text-zinc-300'}`}>
                     {selectedChapter?.isSpecial ? 'Front Matter' : `Chapter ${selectedChapter?.order}`}
                   </span>
                   {/* Small + button besides it */}
                   <button 
                    onClick={addChapter}
                    className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${isDark ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white' : 'bg-zinc-100 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-900'}`}
                    title="Quick Add Chapter"
                   >
                     <span className="text-[12px] font-bold">+</span>
                   </button>
                 </div>
                 <input
                  className={`text-2xl font-serif font-bold bg-transparent border-none outline-none focus:ring-0 w-full placeholder:text-zinc-300 transition-colors ${isDark ? 'text-white' : 'text-zinc-900'}`}
                  value={selectedChapter?.title || ''}
                  onChange={(e) => updateChapterMeta({ title: e.target.value })}
                  placeholder="Untitled Chapter..."
                />
               </div>
            </div>
            
            <div className="flex items-center gap-6">
              {selectedChapter?.order === 0.1 && (
                <button onClick={() => { saveChapter(); setAnimationKey(p => p + 1); }} className={`p-2 rounded-full transition-all ${isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-zinc-900'}`} title="Trigger Animation">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </button>
              )}

              {/* Illustration */}
              <div className={`flex items-center gap-4 pr-6 border-r ${isDark ? 'border-zinc-800' : 'border-zinc-100'}`}>
                <label className="cursor-pointer group flex items-center gap-3">
                  <div className={`w-10 h-14 rounded-md border-2 border-dashed flex items-center justify-center overflow-hidden transition-all shadow-sm ${selectedChapter?.illustration ? (isDark ? 'border-white' : 'border-zinc-900') : (isDark ? 'border-zinc-700' : 'border-zinc-200 group-hover:border-zinc-400')}`}>
                    {selectedChapter?.illustration ? (
                      <img src={selectedChapter.illustration} className="w-full h-full object-cover" alt="Art" />
                    ) : (
                      <svg className="w-5 h-5 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-[9px] uppercase font-black tracking-widest ${isDark ? 'text-zinc-400' : 'text-zinc-900'}`}>Cover Art</span>
                    <span className="text-[8px] text-zinc-400 font-bold">800x1200</span>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
              </div>

              {/* Music */}
              <div className="relative">
                <button 
                  onClick={() => setShowMusicSettings(!showMusicSettings)}
                  className={`p-3 rounded-xl flex items-center gap-3 transition-all ${showMusicSettings ? (isDark ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-900 text-white shadow-lg') : (isDark ? 'hover:bg-zinc-800 text-zinc-500' : 'hover:bg-zinc-50 text-zinc-400')}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/></svg>
                  <div className="text-left flex flex-col hidden md:flex">
                    <span className="text-[9px] uppercase font-black tracking-widest opacity-60">Music Mode</span>
                    <span className="text-[10px] font-bold">{selectedChapter ? EMOTION_CONFIGS[selectedChapter.emotion].musicVibe : 'None'}</span>
                  </div>
                </button>

                {showMusicSettings && (
                  <div className={`absolute top-16 right-0 w-64 rounded-2xl shadow-2xl border p-4 z-[50] animate-in zoom-in-95 duration-200 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100'}`}>
                    <h4 className={`text-[10px] uppercase font-black tracking-widest mb-4 border-b pb-2 ${isDark ? 'text-zinc-500 border-zinc-800' : 'text-zinc-400 border-zinc-50'}`}>Universe Soundscapes</h4>
                    <div className="space-y-1 mb-4">
                      {Object.values(EmotionType).map((type) => (
                        <button
                          key={type}
                          onClick={() => { updateChapterMeta({ emotion: type }); setShowMusicSettings(false); }}
                          className={`w-full text-left p-2 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-between transition-colors ${selectedChapter?.emotion === type ? (isDark ? 'bg-white text-zinc-900' : 'bg-zinc-900 text-white') : (isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-600')}`}
                        >
                          {EMOTION_CONFIGS[type].musicVibe}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Theme & Fullscreen Controls */}
              <div className="flex items-center gap-2 pl-4 border-l border-zinc-100 dark:border-zinc-800">
                <div className="relative">
                  <button 
                    onClick={() => setIsSearchOpen(!isSearchOpen)}
                    className={`p-3 rounded-full transition-all ${isDark ? 'text-zinc-500 hover:text-white hover:bg-zinc-800' : 'text-zinc-400 hover:bg-zinc-50 hover:text-zinc-900'}`}
                    title="Search"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                  </button>
                  {isSearchOpen && (
                    <form onSubmit={handleSearch} className={`absolute top-14 right-0 p-2 rounded-xl shadow-xl border w-48 z-50 animate-in fade-in zoom-in-95 duration-200 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100'}`}>
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
                  onClick={() => setSettings(s => ({ ...s, theme: s.theme === 'light' ? 'dark' : 'light' }))}
                  className={`p-3 rounded-full transition-all ${isDark ? 'text-yellow-400 hover:bg-zinc-800' : 'text-zinc-400 hover:bg-zinc-50 hover:text-zinc-900'}`}
                  title="Toggle Theme"
                >
                  {isDark ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
                  )}
                </button>

                <button 
                  onClick={toggleFullscreen}
                  className={`p-3 rounded-full transition-all ${isDark ? 'text-zinc-500 hover:text-white hover:bg-zinc-800' : 'text-zinc-400 hover:bg-zinc-50 hover:text-zinc-900'}`}
                  title="Toggle Browser Fullscreen"
                >
                   {isBrowserFullscreen ? (
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                   ) : (
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>
                   )}
                </button>

                <button 
                  onClick={() => setIsZenMode(!isZenMode)}
                  className={`p-3 rounded-full transition-all ${isZenMode ? (isDark ? 'text-white bg-zinc-800' : 'text-zinc-900 bg-zinc-100') : (isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-zinc-900')}`}
                  title="Toggle Zen UI"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                </button>
              </div>
            </div>
          </header>
        )}

        {isZenMode && (
           <div className="fixed top-8 right-8 flex gap-4 z-50">
             <button 
              onClick={() => setIsZenMode(false)}
              className={`p-3 backdrop-blur rounded-full shadow-lg border transition-all hover:scale-110 ${isDark ? 'bg-zinc-900/50 border-white/10 text-zinc-400 hover:text-white' : 'bg-white/50 border-zinc-200 text-zinc-500 hover:text-black'}`}
             >
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
             </button>
           </div>
        )}

        <div className={`flex-1 overflow-y-auto p-12 md:p-24 transition-colors duration-500 ${isDark ? 'bg-zinc-950' : 'bg-zinc-50/50'}`}>
           <div className={`max-w-3xl mx-auto shadow-2xl border min-h-[85vh] p-16 md:p-28 relative transition-all duration-1000 ${isZenMode ? 'scale-105' : 'scale-100'} ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-100 text-zinc-900'}`}>
              {selectedChapter ? (
                <div
                  key={selectedChapter.id + animationKey}
                  ref={editorRef}
                  contentEditable
                  onBlur={saveChapter}
                  className={`prose lg:prose-xl focus:outline-none min-h-full font-serif leading-relaxed ${isDark ? 'prose-invert' : 'prose-zinc'}`}
                  dangerouslySetInnerHTML={{ __html: selectedChapter.content }}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-zinc-300 italic font-serif text-lg">Select a chapter to begin...</div>
              )}
           </div>
        </div>

        <footer className={`h-12 border-t px-10 flex items-center justify-between text-[10px] uppercase font-black tracking-[0.3em] z-10 transition-colors ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-500' : 'bg-white border-zinc-100 text-zinc-400'}`}>
           <div className="flex gap-6 items-center">
              <span className={isDark ? 'text-zinc-300' : 'text-zinc-900'}>
                {selectedChapter?.isSpecial ? 'Front Matter' : `Chapter ${selectedChapter?.order || 0}`}
              </span>
              <div className={`w-px h-3 ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`} />
              <span>{wordCount} Words Written</span>
           </div>
           <div className="flex items-center gap-4">
              <div className={`w-2 h-2 rounded-full animate-pulse ${isDark ? 'bg-emerald-500' : 'bg-emerald-400'}`} />
              <span>Offline Session Active</span>
           </div>
        </footer>
      </main>
    </div>
  );
};

export default WriterView;