
import { Novel, AppSettings, ViewMode, Quote, Achievement } from '../types';

const STORAGE_KEY = 'fantic_writer_data';
const SETTINGS_KEY = 'fantic_writer_settings';
const VIEW_MODE_KEY = 'fantic_writer_view_mode';
const QUOTES_KEY = 'fantic_writer_quotes';
const ACHIEVEMENTS_KEY = 'fantic_writer_achievements';

export const storageService = {
  saveNovel: (novel: Novel) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(novel));
  },

  getNovel: (): Novel | null => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  },

  saveSettings: (settings: AppSettings) => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  },

  getSettings: (): AppSettings => {
    const data = localStorage.getItem(SETTINGS_KEY);
    return data ? JSON.parse(data) : {
      fontSize: 20,
      lineHeight: 1.8,
      theme: 'light',
      isMuted: false,
      volume: 0.5,
      ambientMode: true
    };
  },

  saveViewMode: (mode: ViewMode) => {
    localStorage.setItem(VIEW_MODE_KEY, mode);
  },

  getViewMode: (): ViewMode => {
    return (localStorage.getItem(VIEW_MODE_KEY) as ViewMode) || 'Choice';
  },

  // Quotes
  getQuotes: (): Quote[] => {
    const data = localStorage.getItem(QUOTES_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveQuote: (quote: Quote) => {
    const quotes = storageService.getQuotes();
    quotes.push(quote);
    localStorage.setItem(QUOTES_KEY, JSON.stringify(quotes));
  },

  deleteQuote: (id: string) => {
    const quotes = storageService.getQuotes().filter(q => q.id !== id);
    localStorage.setItem(QUOTES_KEY, JSON.stringify(quotes));
  },

  // Achievements
  getAchievements: (): Achievement[] => {
    const data = localStorage.getItem(ACHIEVEMENTS_KEY);
    return data ? JSON.parse(data) : [];
  },

  unlockAchievement: (achievement: Achievement) => {
    const achievements = storageService.getAchievements();
    if (!achievements.find(a => a.id === achievement.id)) {
      achievements.push(achievement);
      localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievements));
      return true;
    }
    return false;
  },

  exportAsJson: (novel: Novel) => {
    const blob = new Blob([JSON.stringify(novel, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${novel.title.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
};
