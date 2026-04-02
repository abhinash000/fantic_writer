
import React from 'react';
import { Quote } from '../types';

interface QuotesPanelProps {
  quotes: Quote[];
  onDelete: (id: string) => void;
  onJump: (id: string) => void;
  onClose: () => void;
  isDark: boolean;
}

const QuotesPanel: React.FC<QuotesPanelProps> = ({ quotes, onDelete, onJump, onClose, isDark }) => {
  return (
    <div className={`fixed inset-y-0 right-0 w-full max-w-md z-[200] shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 border-l ${isDark ? 'bg-[#1a1a1a] border-white/5' : 'bg-[#faf9f6] border-black/5'}`}>
      <div className="p-8 border-b border-black/5 flex items-center justify-between">
        <div>
          <h2 className={`font-serif text-3xl mb-1 ${isDark ? 'text-white' : 'text-zinc-900'}`}>Saved Quotes</h2>
          <p className={`text-[10px] uppercase tracking-widest font-bold ${isDark ? 'text-white/30' : 'text-zinc-400'}`}>{quotes.length} Collected Fragments</p>
        </div>
        <button onClick={onClose} className={`p-2 transition-colors ${isDark ? 'text-white/40 hover:text-white' : 'text-zinc-400 hover:text-zinc-900'}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        {quotes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className={`w-16 h-16 rounded-full border mb-6 flex items-center justify-center ${isDark ? 'border-white/5 text-white/10' : 'border-black/5 text-zinc-300'}`}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </div>
            <p className={`text-sm italic ${isDark ? 'text-white/20' : 'text-zinc-400'}`}>Select text in the reader to save your first fragment.</p>
          </div>
        ) : (
          quotes.sort((a, b) => b.timestamp - a.timestamp).map(quote => (
            <div key={quote.id} className="group relative">
              <div className={`reader-text-container font-serif text-lg leading-relaxed italic mb-4 relative pl-6 border-l-2 ${isDark ? 'text-white/80 border-white/20' : 'text-zinc-700 border-black/10'}`}>
                "{quote.text}"
              </div>
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => onJump(quote.chapterId)}
                  className={`text-[9px] uppercase font-bold tracking-widest transition-colors ${isDark ? 'text-white/40 hover:text-white' : 'text-zinc-400 hover:text-zinc-900'}`}
                >
                  From: {quote.chapterTitle}
                </button>
                <button 
                  onClick={() => onDelete(quote.id)}
                  className="text-[9px] uppercase font-bold tracking-widest text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Discard
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className={`p-8 border-t border-black/5 text-center ${isDark ? 'bg-black/20' : 'bg-black/5'}`}>
        <p className={`text-[8px] uppercase tracking-[0.4em] font-bold ${isDark ? 'text-white/20' : 'text-zinc-400'}`}>Quotes are stored locally</p>
      </div>
    </div>
  );
};

export default QuotesPanel;
