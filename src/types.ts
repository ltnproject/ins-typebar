// Runtime constant to prevent bundlers from stripping this file during compilation
export const TYPEBAR_VERSION = "1.0.0";

export interface KeyboardEventData {
  key: string;
  character: string;
  vk: number;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  win: boolean;
}

export interface WindowEventData {
  process: string;
  title: string;
}

export interface SuppressedKeyEventData {
  key: "Tab" | "Right" | "F1" | "F2" | "F3" | "F4" | "F5";
}

export interface TypeBarSettings {
  autoCorrect: boolean;
  predictions: boolean;
  emojis: boolean;
  soundEffects: boolean;
  blurEffects: boolean;
  theme: "light" | "dark" | "cyberpunk";
  animationSpeed: number; // 1 = normal, 0.5 = fast, 1.5 = slow
  opacity: number; // 0.1 to 1
  overlayPosition: "bottom" | "top"; // vertical positioning
  startup: boolean;
}

export interface ElectronAPI {
  onKeyboardEvent: (callback: (data: KeyboardEventData) => void) => () => void;
  onWindowEvent: (callback: (data: WindowEventData) => void) => () => void;
  onSuppressedKeyEvent: (callback: (data: SuppressedKeyEventData) => void) => () => void;
  onHotkeyToggle: (callback: () => void) => () => void;
  onForceShow: (callback: () => void) => () => void;
  onEmergencyDeactivate: (callback: () => void) => () => void;
  
  setSuppressKeys: (suppress: boolean) => void;
  simulateInput: (text: string) => void;
  simulateBackspace: (count: number) => void;
  simulateKey: (key: string) => void;
  setIgnoreMouseEvents: (ignore: boolean) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
