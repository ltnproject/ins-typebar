import React, { useState, useEffect, useMemo } from 'react';
import type { TypeBarSettings } from './types';
import { PredictionEngine } from './services/predictionEngine';
import { ThemeProvider } from './components/ThemeContext';
import { Overlay } from './components/Overlay';
import { SettingsPanel } from './components/SettingsPanel';

const STORAGE_KEY = 'typebar-settings';

const DEFAULT_SETTINGS: TypeBarSettings = {
  autoCorrect: true,
  predictions: true,
  emojis: true,
  soundEffects: true,
  blurEffects: true,
  theme: 'light', // Frosted glass light mode default ("Light mode round")
  animationSpeed: 0.15,
  opacity: 0.95,
  overlayPosition: 'bottom',
  startup: false
};

const App: React.FC = () => {
  // Load settings from localStorage or fallback
  const [settings, setSettings] = useState<TypeBarSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
    return DEFAULT_SETTINGS;
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Initialize prediction engine instance
  const predictionEngine = useMemo(() => new PredictionEngine(), []);

  // Sync settings back to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSetting = <K extends keyof TypeBarSettings>(key: K, value: TypeBarSettings[K]) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: value };
      
      // Handle Electron level effects (such as dynamic opacity/blur adjustments if needed)
      if (key === 'startup') {
        // Option to wire up Registry/Shortcut startup if needed
      }

      return updated;
    });
  };

  const handleInteractiveEnter = () => {
    window.electronAPI.setIgnoreMouseEvents(false);
  };

  const handleInteractiveLeave = () => {
    // If settings are open, we keep interaction active to prevent close glitches
    if (!isSettingsOpen) {
      window.electronAPI.setIgnoreMouseEvents(true);
    }
  };

  // When settings close, we reset window click-through
  useEffect(() => {
    if (!isSettingsOpen) {
      window.electronAPI.setIgnoreMouseEvents(true);
    }
  }, [isSettingsOpen]);

  return (
    <ThemeProvider initialSettings={settings}>
      {/* Full transparent 480px Electron viewport wrapper */}
      <div className="w-full h-screen flex flex-col justify-end p-4 overflow-hidden select-none">
        
        {/* Interactive Settings Container */}
        <div
          onMouseEnter={handleInteractiveEnter}
          onMouseLeave={handleInteractiveLeave}
          className="w-full"
        >
          <SettingsPanel
            isOpen={isSettingsOpen}
            settings={settings}
            onUpdateSetting={updateSetting}
            onClose={() => setIsSettingsOpen(false)}
          />
        </div>

        {/* Dynamic spacer */}
        {isSettingsOpen && <div className="h-3 flex-shrink-0" />}

        {/* Interactive Bottom Overlay Container */}
        <div
          onMouseEnter={handleInteractiveEnter}
          onMouseLeave={handleInteractiveLeave}
          className="w-full"
        >
          <Overlay
            settings={settings}
            onOpenSettings={() => setIsSettingsOpen(prev => !prev)}
            predictionEngine={predictionEngine}
          />
        </div>
      </div>
    </ThemeProvider>
  );
};

export default App;
