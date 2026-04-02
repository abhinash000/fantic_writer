
import React, { useState, useEffect } from 'react';
import { ViewMode, Novel, AppSettings } from './types';
import { storageService } from './services/storage';
import { INITIAL_NOVEL } from './constants';
import ChoiceScreen from './components/ChoiceScreen';
import ReaderView from './components/ReaderView';
import WriterView from './components/WriterView';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>(() => storageService.getViewMode());
  const [novel, setNovel] = useState<Novel>(() => storageService.getNovel() || INITIAL_NOVEL);
  const [settings, setSettings] = useState<AppSettings>(() => storageService.getSettings());

  useEffect(() => {
    storageService.saveViewMode(viewMode);
  }, [viewMode]);

  useEffect(() => {
    storageService.saveSettings(settings);
  }, [settings]);

  const handleSelectView = (mode: ViewMode) => {
    setViewMode(mode);
  };

  const handleBackToChoice = () => {
    setViewMode('Choice');
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${settings.theme === 'dark' ? 'bg-[#111]' : 'bg-[#faf9f6]'}`}>
      {viewMode === 'Choice' && (
        <ChoiceScreen onSelect={handleSelectView} />
      )}

      {viewMode === 'Writer' && (
        <WriterView 
          novel={novel} 
          setNovel={setNovel} 
          onBack={handleBackToChoice} 
          settings={settings}
          setSettings={setSettings}
        />
      )}

      {viewMode === 'Reader' && (
        <ReaderView 
          novel={novel} 
          setNovel={setNovel} 
          onBack={handleBackToChoice} 
          settings={settings}
          setSettings={setSettings}
        />
      )}

      <audio id="ambient-audio" loop />
    </div>
  );
};

export default App;
