import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Keyboard, ShieldAlert, Sparkles, Flame, EyeOff } from 'lucide-react';
import type { KeyboardEventData, WindowEventData, SuppressedKeyEventData, TypeBarSettings } from '../types';
import { PredictionEngine } from '../services/predictionEngine';
import { SuggestionCapsule } from './SuggestionCapsule';

interface OverlayProps {
  settings: TypeBarSettings;
  onOpenSettings: () => void;
  predictionEngine: PredictionEngine;
}

const QUICK_TEMPLATES = ["wsg", "help", "low", "come here", "ggs"];

export const Overlay: React.FC<OverlayProps> = ({
  settings,
  onOpenSettings,
  predictionEngine
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [buffer, setBuffer] = useState<string>("");
  const [wpm, setWpm] = useState<number>(0);
  const [activeApp, setActiveApp] = useState<string>("Desktop");
  const [predictions, setPredictions] = useState<string[]>([]);
  const [emojis, setEmojis] = useState<string[]>([]);
  const [autocorrect, setAutocorrect] = useState<string | undefined>(undefined);
  const [isDeactivated, setIsDeactivated] = useState<boolean>(false);

  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Refs to avoid stale closures in the single-instance IPC listeners
  const settingsRef = useRef(settings);
  const isDeactivatedRef = useRef(isDeactivated);
  const autocorrectRef = useRef(autocorrect);
  const predictionsRef = useRef(predictions);
  const emojisRef = useRef(emojis);
  const isVisibleRef = useRef(isVisible);

  // Keep refs in sync with state updates
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { isDeactivatedRef.current = isDeactivated; }, [isDeactivated]);
  useEffect(() => { autocorrectRef.current = autocorrect; }, [autocorrect]);
  useEffect(() => { predictionsRef.current = predictions; }, [predictions]);
  useEffect(() => { emojisRef.current = emojis; }, [emojis]);
  useEffect(() => { isVisibleRef.current = isVisible; }, [isVisible]);

  // Synchronize key suppression mode dynamically based on layout visibility and buffer state
  useEffect(() => {
    if (!isVisible) {
      window.electronAPI.setSuppressKeys(false);
      return;
    }
    if (!buffer) {
      // Show F1-F5 quick templates when buffer is empty, so suppress F1-F5
      window.electronAPI.setSuppressKeys(true);
    } else {
      const hasOptions = predictions.length > 0 || emojis.length > 0 || !!autocorrect;
      window.electronAPI.setSuppressKeys(hasOptions);
    }
  }, [isVisible, buffer, predictions, emojis, autocorrect]);

  // Play synthetic mechanical mechanical-switch typing click
  const playClickSound = () => {
    if (!settingsRef.current.soundEffects) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      // mechanical click pitch modulation
      osc.frequency.setValueAtTime(650 + Math.random() * 200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.04);
      
      gain.gain.setValueAtTime(0.015, ctx.currentTime); 
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.04);
    } catch (e) {
      console.error('Audio synthesis failed:', e);
    }
  };

  // Reset inactivity fade out timer
  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    
    setIsVisible(true);

    inactivityTimerRef.current = setTimeout(() => {
      // Fade away after 3.5 seconds of typing silence
      setIsVisible(false);
      predictionEngine.clearBuffer();
      setBuffer("");
      setPredictions([]);
      setEmojis([]);
      setAutocorrect(undefined);
      window.electronAPI.setSuppressKeys(false);
    }, 3500);
  };

  // Trigger suggestion autocomplete replacement
  const acceptSuggestion = (suggestion: string) => {
    const wordToReplace = predictionEngine.getBuffer();

    if (wordToReplace) {
      // Send Backspaces to delete typo or partial word, then type suggestion and trailing space
      window.electronAPI.simulateBackspace(wordToReplace.length);
    }
    
    // Type the suggestion and a trailing space
    window.electronAPI.simulateInput(suggestion + " ");

    // Reset local engine state
    predictionEngine.clearBuffer();
    setBuffer("");
    setPredictions([]);
    setEmojis([]);
    setAutocorrect(undefined);
    window.electronAPI.setSuppressKeys(false);

    // Briefly keep bar visible then reset timer
    resetInactivityTimer();
  };

  // Keyboard hook listeners registered exactly ONCE
  useEffect(() => {
    // 1. Process keypresses
    const removeKeyboard = window.electronAPI.onKeyboardEvent((data: KeyboardEventData) => {
      if (isDeactivatedRef.current) return;

      // Ignore all system modifier key presses, function keys, and shortcut combinations (Ctrl/Alt/Win combinations)
      const isSystemOrShortcut = 
        data.ctrl || 
        data.alt || 
        data.win ||
        ["Control", "Alt", "Shift", "LWin", "RWin", "CapsLock", "NumLock", "ScrollLock", "Escape"].includes(data.key) ||
        /^F\d+$/.test(data.key);

      if (isSystemOrShortcut) return;

      playClickSound();
      predictionEngine.recordKeypress(data.key, data.character);
      
      const newBuffer = predictionEngine.getBuffer();
      setBuffer(newBuffer);
      setWpm(predictionEngine.calculateWPM());

      // Fetch suggestion values
      const res = predictionEngine.getSuggestions(
        settingsRef.current.autoCorrect,
        settingsRef.current.predictions,
        settingsRef.current.emojis
      );

      setAutocorrect(res.autocorrect);
      setPredictions(res.predictions);
      setEmojis(res.emojis);

      // Instruct C# whether to suppress Tab / Right Arrow based on suggestions being available
      const hasOptions = res.predictions.length > 0 || res.emojis.length > 0 || !!res.autocorrect;
      window.electronAPI.setSuppressKeys(hasOptions);

      resetInactivityTimer();
    });

    // 2. Process active window change
    const removeWindow = window.electronAPI.onWindowEvent((data: WindowEventData) => {
      if (isDeactivatedRef.current) return;
      
      predictionEngine.setActiveApp(data.process);
      // Clean process names
      let cleanedApp = data.process;
      if (data.process.toLowerCase().includes('chrome')) cleanedApp = 'Chrome';
      else if (data.process.toLowerCase().includes('discord')) cleanedApp = 'Discord';
      else if (data.process.toLowerCase().includes('roblox')) cleanedApp = 'Roblox';
      else if (data.process.toLowerCase().includes('code')) cleanedApp = 'VSCode';
      else if (data.process.toLowerCase().includes('explorer')) cleanedApp = 'Desktop';

      setActiveApp(cleanedApp);
      predictionEngine.clearBuffer();
      setBuffer("");
      setPredictions([]);
      setEmojis([]);
      setAutocorrect(undefined);
      window.electronAPI.setSuppressKeys(false);
    });

    // 3. Process suppressed key (Tab/Right Arrow/F1-F5) when suggestions exist
    const removeSuppressed = window.electronAPI.onSuppressedKeyEvent((data: SuppressedKeyEventData) => {
      if (isDeactivatedRef.current) return;

      const isBufferEmpty = !predictionEngine.getBuffer();
      if (isBufferEmpty) {
        if (data.key === "F1") acceptSuggestion(QUICK_TEMPLATES[0]);
        else if (data.key === "F2") acceptSuggestion(QUICK_TEMPLATES[1]);
        else if (data.key === "F3") acceptSuggestion(QUICK_TEMPLATES[2]);
        else if (data.key === "F4") acceptSuggestion(QUICK_TEMPLATES[3]);
        else if (data.key === "F5") acceptSuggestion(QUICK_TEMPLATES[4]);
        return;
      }

      const suggestionsList = autocorrectRef.current ? [autocorrectRef.current, ...predictionsRef.current] : predictionsRef.current;
      const allOptions = [...suggestionsList, ...emojisRef.current];
      
      if (data.key === "Tab") {
        if (suggestionsList.length > 0) {
          acceptSuggestion(suggestionsList[0]);
        } else if (emojisRef.current.length > 0) {
          acceptSuggestion(emojisRef.current[0]);
        }
      } else if (data.key === "Right") {
        if (suggestionsList.length > 1) {
          acceptSuggestion(suggestionsList[1]);
        } else if (emojisRef.current.length > 0) {
          acceptSuggestion(emojisRef.current[0]);
        }
      } else if (data.key === "F1") {
        if (allOptions.length > 0) acceptSuggestion(allOptions[0]);
      } else if (data.key === "F2") {
        if (allOptions.length > 1) acceptSuggestion(allOptions[1]);
      } else if (data.key === "F3") {
        if (allOptions.length > 2) acceptSuggestion(allOptions[2]);
      } else if (data.key === "F4") {
        if (allOptions.length > 3) acceptSuggestion(allOptions[3]);
      } else if (data.key === "F5") {
        if (allOptions.length > 4) acceptSuggestion(allOptions[4]);
      }
    });

    // 4. Ctrl+Alt+S toggle manually
    const removeHotkey = window.electronAPI.onHotkeyToggle(() => {
      if (isDeactivatedRef.current) return;
      setIsVisible(prev => {
        const nextVal = !prev;
        if (nextVal) {
          setTimeout(() => resetInactivityTimer(), 0);
        }
        return nextVal;
      });
    });

    // 5. Tray wake
    const removeForceShow = window.electronAPI.onForceShow(() => {
      if (isDeactivatedRef.current) return;
      setIsVisible(true);
      resetInactivityTimer();
    });

    // 6. Emergency deactivation
    const removeEmergency = window.electronAPI.onEmergencyDeactivate(() => {
      setIsDeactivated(true);
      setIsVisible(false);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    });

    return () => {
      removeKeyboard();
      removeWindow();
      removeSuppressed();
      removeHotkey();
      removeForceShow();
      removeEmergency();
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, []);

  const hasSuggestions = predictions.length > 0 || emojis.length > 0 || !!autocorrect;

  const getShortcutLabel = (index: number): string | undefined => {
    if (index === 0) return "F1 · Tab";
    if (index === 1) return "F2 · →";
    if (index === 2) return "F3";
    if (index === 3) return "F4";
    if (index === 4) return "F5";
    return undefined;
  };

  return (
    <AnimatePresence>
      {(isVisible || isDeactivated) && (
        <motion.div
          initial={{ opacity: 0, y: 15, scale: 0.98 }}
          animate={{ 
            opacity: settings.opacity, 
            y: 0, 
            scale: 1 
          }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ duration: 0.15 }}
          style={{ 
            transitionDuration: `${settings.animationSpeed}s`,
            backdropFilter: settings.blurEffects ? "blur(18px)" : "none",
            WebkitBackdropFilter: settings.blurEffects ? "blur(18px)" : "none"
          }}
          className="w-full h-[74px] rounded-full border border-overlay bg-overlay/90 shadow-xl flex items-center justify-between px-6 select-none relative overflow-hidden"
        >
          {/* Deactivated Mode banner */}
          {isDeactivated && (
            <div className="absolute inset-0 bg-red-950/80 backdrop-blur-md flex items-center justify-center gap-3 z-50 text-red-200">
              <ShieldAlert className="w-5 h-5 text-red-400 animate-bounce" />
              <span className="font-extrabold text-xs uppercase tracking-wider">TypeBar Hook Deactivated (CTRL+ALT+SHIFT)</span>
              <span className="text-[10px] opacity-75">Restart app to enable</span>
            </div>
          )}

          {/* Left Block: Active App & WPM Gauge */}
          <div className="flex items-center gap-3.5 border-r border-primary/10 pr-4">
            {/* WPM circle indicator */}
            <div className="relative w-11 h-11 flex items-center justify-center rounded-full border border-primary/5 bg-primary/5">
              <Flame className={`w-5 h-5 ${wpm > 45 ? "text-orange-500 animate-pulse" : "text-accent"}`} />
              <div className="absolute -top-1 -right-1 flex items-center justify-center min-w-4 h-4 rounded-full bg-accent text-white text-[8px] font-extrabold px-1 border border-overlay">
                {wpm}
              </div>
            </div>
            
            {/* Application detector status */}
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-secondary font-bold">Target App</span>
              <span className="text-xs font-bold text-primary max-w-[85px] truncate">{activeApp}</span>
            </div>
          </div>

          {/* Center Block: Typing Buffer and Suggestions */}
          <div className="flex-1 flex items-center justify-start px-5 gap-3 overflow-hidden">
            {buffer ? (
              <div className="flex items-center gap-1.5 min-w-[70px] max-w-[120px] truncate border-r border-primary/5 pr-3">
                <Keyboard className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
                <span className="text-xs font-semibold tracking-wide text-primary italic truncate">
                  {buffer}
                </span>
                <span className="w-1.5 h-1.5 bg-accent rounded-full animate-ping" />
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-secondary text-[11px] font-semibold border-r border-primary/5 pr-3 min-w-[70px]">
                <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
                <span className="italic">Type...</span>
              </div>
            )}

            {/* List of suggestions */}
            <div className="flex-1 flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
              {buffer ? (
                <>
                  {/* Autocorrect priority suggestion */}
                  {autocorrect && (
                    <SuggestionCapsule
                      key={`ac-${autocorrect}`}
                      text={autocorrect}
                      shortcut={getShortcutLabel(0)}
                      onClick={() => acceptSuggestion(autocorrect)}
                      index={0}
                    />
                  )}

                  {/* Word predictions */}
                  {predictions.map((word, idx) => {
                    const targetIndex = idx + (autocorrect ? 1 : 0);
                    return (
                      <SuggestionCapsule
                        key={`pred-${word}`}
                        text={word}
                        shortcut={getShortcutLabel(targetIndex)}
                        onClick={() => acceptSuggestion(word)}
                        index={targetIndex}
                      />
                    );
                  })}

                  {/* Emoji predictions */}
                  {emojis.map((emoji, idx) => {
                    const targetIndex = idx + predictions.length + (autocorrect ? 1 : 0);
                    return (
                      <SuggestionCapsule
                        key={`emoji-${emoji}-${idx}`}
                        text={emoji}
                        isEmoji={true}
                        shortcut={getShortcutLabel(targetIndex)}
                        onClick={() => acceptSuggestion(emoji)}
                        index={targetIndex}
                      />
                    );
                  })}
                </>
              ) : (
                <>
                  {QUICK_TEMPLATES.map((phrase, idx) => (
                    <SuggestionCapsule
                      key={`template-${phrase}`}
                      text={phrase}
                      shortcut={`F${idx + 1}`}
                      onClick={() => acceptSuggestion(phrase)}
                      index={idx}
                    />
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Right Block: Settings gear button */}
          <div className="border-l border-primary/10 pl-4 flex items-center gap-2">
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-full border border-primary/5 bg-primary/5 text-secondary hover:text-accent hover:bg-overlay/50 hover:border-accent transition-all duration-200 cursor-pointer shadow-sm"
            >
              <Settings className="w-4 h-4 hover:rotate-45 transition-transform" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
