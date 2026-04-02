
import { Novel, Chapter } from '../types';
import { storageService } from './storage';
import { INITIAL_NOVEL } from '../constants';

/**
 * Simulates a backend API for fetching chapter data.
 * In a real-world scenario, this would be a fetch call to GET /api/chapters.
 */
export const chapterApiService = {
  async getChapters(): Promise<Partial<Chapter>[]> {
    const novel: Novel = storageService.getNovel() || INITIAL_NOVEL;
    
    // Return a simplified version of chapters for the navigator
    return novel.chapters
      .sort((a, b) => a.order - b.order)
      .map(chapter => ({
        id: chapter.id,
        chapterNumber: chapter.chapterNumber || Math.floor(chapter.order),
        title: chapter.title,
        image: chapter.image || chapter.illustration || '/assets/default-cover.avif',
      }));
  }
};
