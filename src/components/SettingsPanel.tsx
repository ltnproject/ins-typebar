import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ToggleLeft, ToggleRight, Sparkles, SpellCheck, Smile, Volume2, Layers, Sun, Eye, Activity, LogIn } from 'lucide-react';
import type { TypeBarSettings } from '../types';

interface SettingsPanelProps {
  isOpen: boolean;
  settings: TypeBarSettings;
  onUpdateSetting: <K extends keyof TypeBarSettings>(key: K, value: TypeBarSettings[K]) => void;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  settings,
  onUpdateSetting,
  onClose
}) => {
  const toggle = <K extends keyof TypeBarSettings>(key: K) => {
    onUpdateSetting(key, !settings[key] as any);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="w-full max-h-[300px] rounded-2xl border border-overlay bg-overlay/95 backdrop-blur-xl p-5 text-primary shadow-2xl flex flex-col gap-4 overflow-y-auto"
        >
          {/* Header */}
          <div className="flex justify-between items-center border-b border-primary/10 pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent animate-pulse" />
              <h2 className="font-bold text-sm tracking-wider uppercase">TypeBar Settings</h2>
            </div>
            <button
              onClick={onClose}
              className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-primary/10 hover:bg-primary/20 text-secondary transition-colors"
            >
              Close
            </button>
          </div>

          {/* Grid Settings */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-[11px] font-medium text-secondary">
            {/* Toggle 1: Auto Correct */}
            <div className="flex justify-between items-center py-0.5">
              <div className="flex items-center gap-2">
                <SpellCheck className="w-3.5 h-3.5" />
                <span>Auto Correction</span>
              </div>
              <button onClick={() => toggle("autoCorrect")} className="text-primary hover:text-accent cursor-pointer">
                {settings.autoCorrect ? (
                  <ToggleRight className="w-6 h-6 text-accent" />
                ) : (
                  <ToggleLeft className="w-6 h-6" />
                )}
              </button>
            </div>

            {/* Toggle 2: Word Predictions */}
            <div className="flex justify-between items-center py-0.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Word Predictions</span>
              </div>
              <button onClick={() => toggle("predictions")} className="text-primary hover:text-accent cursor-pointer">
                {settings.predictions ? (
                  <ToggleRight className="w-6 h-6 text-accent" />
                ) : (
                  <ToggleLeft className="w-6 h-6" />
                )}
              </button>
            </div>

            {/* Toggle 3: Emojis */}
            <div className="flex justify-between items-center py-0.5">
              <div className="flex items-center gap-2">
                <Smile className="w-3.5 h-3.5" />
                <span>Emoji Predictions</span>
              </div>
              <button onClick={() => toggle("emojis")} className="text-primary hover:text-accent cursor-pointer">
                {settings.emojis ? (
                  <ToggleRight className="w-6 h-6 text-accent" />
                ) : (
                  <ToggleLeft className="w-6 h-6" />
                )}
              </button>
            </div>

            {/* Toggle 4: Sound Effects */}
            <div className="flex justify-between items-center py-0.5">
              <div className="flex items-center gap-2">
                <Volume2 className="w-3.5 h-3.5" />
                <span>Typing Sounds</span>
              </div>
              <button onClick={() => toggle("soundEffects")} className="text-primary hover:text-accent cursor-pointer">
                {settings.soundEffects ? (
                  <ToggleRight className="w-6 h-6 text-accent" />
                ) : (
                  <ToggleLeft className="w-6 h-6" />
                )}
              </button>
            </div>

            {/* Toggle 5: Glass Blur */}
            <div className="flex justify-between items-center py-0.5">
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5" />
                <span>Frosted Glass Blur</span>
              </div>
              <button onClick={() => toggle("blurEffects")} className="text-primary hover:text-accent cursor-pointer">
                {settings.blurEffects ? (
                  <ToggleRight className="w-6 h-6 text-accent" />
                ) : (
                  <ToggleLeft className="w-6 h-6" />
                )}
              </button>
            </div>

            {/* Toggle 6: Windows Startup */}
            <div className="flex justify-between items-center py-0.5">
              <div className="flex items-center gap-2">
                <LogIn className="w-3.5 h-3.5" />
                <span>Startup with Windows</span>
              </div>
              <button onClick={() => toggle("startup")} className="text-primary hover:text-accent cursor-pointer">
                {settings.startup ? (
                  <ToggleRight className="w-6 h-6 text-accent" />
                ) : (
                  <ToggleLeft className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>

          {/* Theme Selector */}
          <div className="flex justify-between items-center border-t border-primary/10 pt-3 text-[11px] font-semibold">
            <div className="flex items-center gap-2 text-secondary">
              <Sun className="w-3.5 h-3.5" />
              <span>UI Theme</span>
            </div>
            <div className="flex gap-1 bg-primary/5 p-0.5 rounded-lg border border-primary/10">
              {(["light", "dark", "cyberpunk"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => onUpdateSetting("theme", t)}
                  className={`px-3 py-1 rounded-md capitalize text-[10px] cursor-pointer font-bold tracking-wide transition-all ${
                    settings.theme === t
                      ? "bg-accent text-white shadow-sm"
                      : "text-secondary hover:text-primary hover:bg-primary/5"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Sliders Area */}
          <div className="flex flex-col gap-3 border-t border-primary/10 pt-3 text-[11px] font-semibold text-secondary">
            {/* Slider 1: Opacity */}
            <div className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-2 min-w-[120px]">
                <Eye className="w-3.5 h-3.5" />
                <span>Overlay Opacity</span>
              </div>
              <input
                type="range"
                min="0.3"
                max="1.0"
                step="0.05"
                value={settings.opacity}
                onChange={(e) => onUpdateSetting("opacity", parseFloat(e.target.value))}
                className="w-full h-1 bg-primary/10 rounded-lg appearance-none cursor-pointer accent-accent"
              />
              <span className="text-[10px] font-bold w-8 text-right text-primary">
                {Math.round(settings.opacity * 100)}%
              </span>
            </div>

            {/* Slider 2: Animation Speed */}
            <div className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-2 min-w-[120px]">
                <Activity className="w-3.5 h-3.5" />
                <span>Animation Speed</span>
              </div>
              <input
                type="range"
                min="0.3"
                max="2.0"
                step="0.1"
                value={settings.animationSpeed}
                onChange={(e) => onUpdateSetting("animationSpeed", parseFloat(e.target.value))}
                className="w-full h-1 bg-primary/10 rounded-lg appearance-none cursor-pointer accent-accent"
              />
              <span className="text-[10px] font-bold w-8 text-right text-primary">
                {settings.animationSpeed}s
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
