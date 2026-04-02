import { EmotionType } from './types';

export const EMOTION_CONFIGS: Record<EmotionType, { 
  border: string; 
  musicVibe: string;
  audioUrl: string;
  bgOverlay: string;
}> = {
  [EmotionType.Calm]: { 
    border: 'from-blue-200 via-white to-blue-200', 
    musicVibe: 'Soft Piano',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 
    bgOverlay: 'rgba(173, 216, 230, 0.05)'
  },
  [EmotionType.Dark]: { 
    border: 'from-white via-black to-white', 
    musicVibe: 'Low Drone',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    bgOverlay: 'rgba(0, 0, 0, 0.05)'
  },
  [EmotionType.Epic]: { 
    border: 'from-zinc-800 via-black to-zinc-800', 
    musicVibe: 'Cinematic Pad',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    bgOverlay: 'rgba(30, 30, 30, 0.05)'
  },
  [EmotionType.Tender]: { 
    border: 'from-white via-rose-100 to-white', 
    musicVibe: 'Gentle Strings',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    bgOverlay: 'rgba(255, 182, 193, 0.05)'
  },
  [EmotionType.Tense]: { 
    border: 'from-black via-amber-400 to-black', 
    musicVibe: 'Heartbeat Pulse',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    bgOverlay: 'rgba(255, 191, 0, 0.05)'
  },
  [EmotionType.Hopeful]: { 
    border: 'from-black via-white to-black', 
    musicVibe: 'Light Piano',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    bgOverlay: 'rgba(255, 255, 240, 0.05)'
  },
  [EmotionType.Mysterious]: { 
    border: 'from-white via-amber-200 to-white', 
    musicVibe: 'Echo Pads',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
    bgOverlay: 'rgba(128, 0, 128, 0.05)'
  },
  [EmotionType.LovePain]: { 
    border: 'from-rose-600 via-violet-200 to-rose-600', 
    musicVibe: 'Emotional Piano',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    bgOverlay: 'rgba(255, 0, 127, 0.05)'
  },
  [EmotionType.AngerExcitement]: { 
    border: 'from-red-600 via-orange-400 to-red-600', 
    musicVibe: 'Hybrid Percussion',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
    bgOverlay: 'rgba(255, 69, 0, 0.05)'
  },
  [EmotionType.PainRage]: { 
    border: 'from-red-950 via-red-600 to-red-950', 
    musicVibe: 'Distorted Bass',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
    bgOverlay: 'rgba(139, 0, 0, 0.05)'
  }
};

export const INITIAL_NOVEL: any = {
  id: 'novel-1',
  title: 'The Silent Echo',
  author: 'Unknown Author',
  chapters: [
    {
      id: 'c-0.1',
      chapterNumber: 0,
      title: 'Title Page',
      illustration: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=800',
      content: '<div class="flex flex-col items-center justify-center h-[60vh] text-center"><h1 class="text-7xl md:text-9xl font-serif font-bold mb-6 tracking-tighter animate-[pulse_4s_ease-in-out_infinite]">THE SILENT ECHO</h1><div class="w-24 h-1 bg-current opacity-40 mx-auto my-8"></div><h2 class="text-2xl md:text-4xl font-light uppercase tracking-[0.4em] opacity-70 animate-[fadeIn_2s_ease-out]">A Journey Beyond</h2></div>',
      emotion: EmotionType.Epic,
      order: 0.1,
      isSpecial: true
    },
    {
      id: 'c-0.2',
      chapterNumber: 0,
      title: 'Dedication',
      illustration: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&q=80&w=800',
      content: '<div class="flex flex-col items-center justify-center h-[50vh] text-center italic font-serif"><p class="text-2xl md:text-3xl leading-relaxed opacity-80 mb-8">"To those who listen when the world is quiet."</p><p class="text-xs uppercase tracking-widest opacity-50">— For A.M.</p></div>',
      emotion: EmotionType.Tender,
      order: 0.2,
      isSpecial: true
    },
    {
      id: 'c-0.3',
      chapterNumber: 0,
      title: 'Epigraph',
      illustration: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&q=80&w=800',
      content: '<div class="flex flex-col items-center justify-center h-[50vh] px-8 md:px-24"><blockquote class="text-xl md:text-3xl font-serif leading-loose text-center opacity-90">"We are but dust and shadows, drifting in the cosmic wind, seeking a place to land."</blockquote><cite class="mt-8 text-xs uppercase tracking-widest opacity-50">— The First Archives</cite></div>',
      emotion: EmotionType.Mysterious,
      order: 0.3,
      isSpecial: true
    },
    {
      id: 'c-0.4',
      chapterNumber: 0,
      title: 'Prologue',
      illustration: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=800',
      content: '<p>Before the silence fell, there was the hum. A low, vibrating frequency that rattled the teeth of the mountains and stirred the depths of the oceans.</p><p>They called it the Song of the Architect. But songs end. And when this one did, it didn\'t fade out. It snapped.</p>',
      emotion: EmotionType.Dark,
      order: 0.4,
      isSpecial: true
    },
    {
      id: 'chapter-1',
      chapterNumber: 1,
      title: 'The First Whisper',
      illustration: 'https://images.unsplash.com/photo-1516339901600-2e1a6298ed34?auto=format&fit=crop&q=80&w=800',
      content: '<p>The world ended not with a bang, but with a total, crushing silence. It was as if the universe itself had held its breath, waiting for a word that never came.</p><p>Elias stood at the edge of the cliff, his hand trembling as he held the silver compass. It didn\'t point North. It pointed at the void.</p>',
      emotion: EmotionType.Mysterious,
      order: 1,
      isSpecial: false
    }
  ]
};
