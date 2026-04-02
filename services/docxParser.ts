import { Chapter, EmotionType } from '../types';

// Load Mammoth from CDN dynamically for the browser
const MAMMOTH_URL = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';

export const docxParserService = {
  async parseDocx(file: File, onProgress?: (p: number) => void): Promise<Omit<Chapter, 'id'>[]> {
    return new Promise(async (resolve, reject) => {
      try {
        // Ensure Mammoth is available
        if (!(window as any).mammoth) {
          await this.loadScript(MAMMOTH_URL);
        }

        const arrayBuffer = await file.arrayBuffer();
        const mammoth = (window as any).mammoth;

        onProgress?.(20);

        const result = await mammoth.convertToHtml({ arrayBuffer });
        const fullHtml = result.value;
        
        onProgress?.(50);

        const chapters = this.splitIntoChapters(fullHtml);
        
        onProgress?.(100);
        resolve(chapters);
      } catch (error) {
        console.error("DOCX Parsing Error:", error);
        reject(new Error("Failed to parse document. Ensure it's a valid .docx file."));
      }
    });
  },

  // Removed 'private' modifier because it cannot be used in object literals
  splitIntoChapters(html: string): Omit<Chapter, 'id'>[] {
    // We look for <h1>, <h2> tags OR specific "Chapter X" text patterns
    // Using a temporary DOM parser to iterate through the structure
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const nodes = Array.from(doc.body.childNodes);
    
    const chapters: Omit<Chapter, 'id'>[] = [
      { title: 'Title', content: '', order: 1, emotion: EmotionType.Calm },
      { title: 'Prologue', content: '', order: 2, emotion: EmotionType.Calm },
      { title: 'Dedication', content: '', order: 3, emotion: EmotionType.Calm }
    ];
    let currentChapter: { title: string; content: string[] } | null = null;
    let chapterCount = 3;

    const chapterRegex = /^(chapter|ch\.|part)\s*(\d+)\b/i;

    nodes.forEach((node) => {
      const text = node.textContent?.trim() || '';
      const isHeading = ['H1', 'H2', 'H3'].includes((node as HTMLElement).tagName);
      const isChapterMarker = chapterRegex.test(text);

      if (isHeading || isChapterMarker) {
        // Start new chapter
        if (currentChapter) {
          chapters.push(this.finalizeChapter(currentChapter, ++chapterCount));
        }
        
        currentChapter = {
          title: text,
          content: []
        };
      } else if (currentChapter) {
        // Add to existing chapter content
        const outerHTML = (node as HTMLElement).outerHTML || node.textContent;
        if (outerHTML) currentChapter.content.push(outerHTML);
      } else if (text.length > 0) {
        // Initial text before any header - create an intro chapter
        currentChapter = {
          title: "Introduction",
          content: [(node as HTMLElement).outerHTML || text]
        };
      }
    });

    // Push the last one
    if (currentChapter) {
      chapters.push(this.finalizeChapter(currentChapter, ++chapterCount));
    }

    return chapters;
  },

  // Removed 'private' modifier because it cannot be used in object literals
  finalizeChapter(raw: { title: string; content: string[] }, order: number): Omit<Chapter, 'id'> {
    // Clean up title (remove "Chapter 1:" etc if redundant)
    let cleanTitle = raw.title.replace(/^(chapter|ch\.|part)\s*\d+[:\-\s]*/i, '').trim();
    if (!cleanTitle) cleanTitle = `Chapter ${order}`;

    return {
      title: cleanTitle,
      content: raw.content.join(''),
      order: order,
      emotion: EmotionType.Calm // Default emotion for imported chapters
    };
  },

  // Removed 'private' modifier because it cannot be used in object literals
  loadScript(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.onload = () => resolve();
      script.onerror = () => reject();
      document.head.appendChild(script);
    });
  }
};