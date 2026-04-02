
export enum EmotionType {
  Calm = 'Calm',
  Dark = 'Dark',
  Epic = 'Epic',
  Tender = 'Tender',
  Tense = 'Tense',
  Hopeful = 'Hopeful',
  Mysterious = 'Mysterious',
  LovePain = 'Love + Pain',
  AngerExcitement = 'Anger + Excitement',
  PainRage = 'Pain + Rage'
}

export interface Highlight {
  id: string;
  text: string;
  colorClass: string;
  startIndex: number;
  endIndex: number;
}

export interface Quote {
  id: string;
  text: string;
  chapterId: string;
  chapterTitle: string;
  timestamp: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlockedAt: number;
  icon: string;
}

export interface Chapter {
  id: string;
  chapterNumber?: number; // Logical sequence number
  title: string;
  content: string;
  illustration?: string; // Author-provided art
  image?: string;       // Chapter cover image (AVIF)
  emotion: EmotionType;
  musicUrl?: string;
  order: number;
  highlights?: Highlight[];
  isSpecial?: boolean;
}

export interface Novel {
  id: string;
  title: string;
  author: string;
  chapters: Chapter[];
  lastReadChapterId?: string;
  lastReadPageIndex?: number;
  lastScrollPosition?: number;
}

export type ViewMode = 'Choice' | 'Reader' | 'Writer';

export interface AppSettings {
  fontSize: number;
  lineHeight: number;
  theme: 'light' | 'dark';
  isMuted: boolean;
  volume: number;
  ambientMode: boolean;
}
