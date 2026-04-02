
import React from 'react';
import { ViewMode } from '../types';

interface ChoiceScreenProps {
  onSelect: (mode: ViewMode) => void;
}

const ChoiceScreen: React.FC<ChoiceScreenProps> = ({ onSelect }) => {
  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-4xl md:text-6xl font-serif mb-4 tracking-tight">Fantic Writer</h1>
      <p className="text-zinc-500 max-w-md mb-12 text-lg">
        Enter a private universe of storytelling. Disconnect and immerse yourself.
      </p>
      
      <div className="flex flex-col md:flex-row gap-8 w-full max-w-3xl">
        <button
          onClick={() => onSelect('Reader')}
          className="flex-1 group relative h-64 border border-zinc-200 rounded-xl overflow-hidden bg-[#faf9f6] transition-all hover:border-zinc-400 hover:shadow-xl"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent group-hover:from-black/30 transition-all"></div>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-800 group-hover:text-black">
            <span className="text-sm uppercase tracking-[0.2em] mb-2 opacity-60">Immerse Yourself</span>
            <span className="text-3xl font-serif">Reader</span>
          </div>
        </button>

        <button
          onClick={() => onSelect('Writer')}
          className="flex-1 group relative h-64 border border-zinc-200 rounded-xl overflow-hidden bg-zinc-900 transition-all hover:border-zinc-600 hover:shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-800/50 to-transparent group-hover:from-black transition-all"></div>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/80 group-hover:text-white">
            <span className="text-sm uppercase tracking-[0.2em] mb-2 opacity-60">Create a World</span>
            <span className="text-3xl font-serif">Writer</span>
          </div>
        </button>
      </div>

      <p className="absolute bottom-8 text-xs text-zinc-400 uppercase tracking-widest">
        Private & Offline • Local Only
      </p>
    </div>
  );
};

export default ChoiceScreen;
