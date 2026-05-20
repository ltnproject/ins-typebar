import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Receivers (Main -> Renderer)
  onKeyboardEvent: (callback: (data: any) => void) => {
    const subscription = (_: any, data: any) => callback(data);
    ipcRenderer.on('keyboard-event', subscription);
    return () => { ipcRenderer.removeListener('keyboard-event', subscription); };
  },
  onWindowEvent: (callback: (data: any) => void) => {
    const subscription = (_: any, data: any) => callback(data);
    ipcRenderer.on('window-event', subscription);
    return () => { ipcRenderer.removeListener('window-event', subscription); };
  },
  onSuppressedKeyEvent: (callback: (data: any) => void) => {
    const subscription = (_: any, data: any) => callback(data);
    ipcRenderer.on('suppressed-key-event', subscription);
    return () => { ipcRenderer.removeListener('suppressed-key-event', subscription); };
  },
  onHotkeyToggle: (callback: () => void) => {
    const subscription = () => callback();
    ipcRenderer.on('hotkey-toggle', subscription);
    return () => { ipcRenderer.removeListener('hotkey-toggle', subscription); };
  },
  onForceShow: (callback: () => void) => {
    const subscription = () => callback();
    ipcRenderer.on('force-show', subscription);
    return () => { ipcRenderer.removeListener('force-show', subscription); };
  },
  onEmergencyDeactivate: (callback: () => void) => {
    const subscription = () => callback();
    ipcRenderer.on('emergency-deactivate', subscription);
    return () => { ipcRenderer.removeListener('emergency-deactivate', subscription); };
  },

  // Senders (Renderer -> Main)
  setSuppressKeys: (suppress: boolean) => {
    ipcRenderer.send('set-suppress-keys', suppress);
  },
  simulateInput: (text: string) => {
    ipcRenderer.send('simulate-input', text);
  },
  simulateBackspace: (count: number) => {
    ipcRenderer.send('simulate-backspace', count);
  },
  simulateKey: (key: string) => {
    ipcRenderer.send('simulate-key', key);
  },
  setIgnoreMouseEvents: (ignore: boolean) => {
    ipcRenderer.send('set-ignore-mouse-events', ignore);
  }
});
