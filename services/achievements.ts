
import { Achievement } from '../types';
import { storageService } from './storage';

const ACHIEVEMENT_LIST: Record<string, Omit<Achievement, 'unlockedAt'>> = {
  'first_chapter': {
    id: 'first_chapter',
    title: 'Beginnings',
    description: 'You read your first chapter.',
    icon: '📖'
  },
  'quote_saved': {
    id: 'quote_saved',
    title: 'Scribe',
    description: 'Saved your first quote.',
    icon: '✍️'
  },
  'marathon_reader': {
    id: 'marathon_reader',
    title: 'Deep Focus',
    description: 'Spent 30 minutes reading in one session.',
    icon: '⏳'
  },
  'completionist': {
    id: 'completionist',
    title: 'Chronicler',
    description: 'Finished 5 chapters.',
    icon: '📜'
  }
};

export const achievementsService = {
  checkAndUnlock: (id: string) => {
    const base = ACHIEVEMENT_LIST[id];
    if (!base) return null;
    
    const unlocked = storageService.unlockAchievement({
      ...base,
      unlockedAt: Date.now()
    });

    return unlocked ? base : null;
  }
};
