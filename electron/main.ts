import { app, BrowserWindow, ipcMain, globalShortcut, Tray, Menu, screen, nativeImage } from 'electron';
import * as path from 'path';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import * as readline from 'readline';

let mainWindow: BrowserWindow | null = null;
let hookProcess: ChildProcessWithoutNullStreams | null = null;
let tray: Tray | null = null;
let isDeactivated = false;

const OVERLAY_WIDTH = 650;
const OVERLAY_HEIGHT = 480;

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.bounds;

  // Center horizontally, floating slightly (~60px) above the bottom taskbar
  const x = Math.round((width - OVERLAY_WIDTH) / 2);
  const y = Math.round(height - OVERLAY_HEIGHT - 65);

  mainWindow = new BrowserWindow({
    width: OVERLAY_WIDTH,
    height: OVERLAY_HEIGHT,
    x: x,
    y: y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    focusable: false, // Never steals keyboard focus
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Render above Roblox / other fullscreen games (using screen-saver level)
  mainWindow.setAlwaysOnTop(true, 'screen-saver', 1);
  mainWindow.setVisibleOnAllWorkspaces(true);

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Set initial state to ignore mouse events (click-through)
  mainWindow.setIgnoreMouseEvents(true, { forward: true });

  mainWindow.on('closed', () => {
    mainWindow = null;
    cleanupHook();
  });
}

// Spawns the C# Keyboard Hook and links communication
function startKeyboardHook() {
  if (isDeactivated) return;
  cleanupHook();

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  
  // Resolve path to the compiled TypeBarHook.exe
  let hookPath = '';
  if (isDev) {
    hookPath = path.join(__dirname, '../keyboard-hook/bin/Debug/net8.0/TypeBarHook.exe');
  } else {
    hookPath = path.join(process.resourcesPath, 'TypeBarHook.exe');
  }

  console.log('Spawning keyboard hook at:', hookPath);

  try {
    hookProcess = spawn(hookPath, [], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const reader = readline.createInterface({
      input: hookProcess.stdout,
      terminal: false
    });

    reader.on('line', (line) => {
      if (!mainWindow) return;
      try {
        const payload = JSON.parse(line);
        if (payload.event === 'keydown') {
          mainWindow.webContents.send('keyboard-event', payload.data);
        } else if (payload.event === 'window_changed') {
          mainWindow.webContents.send('window-event', payload.data);
        } else if (payload.event === 'suppressed_key') {
          mainWindow.webContents.send('suppressed-key-event', payload.data);
        } else if (payload.event === 'emergency_deactivate') {
          emergencyDisable();
        } else if (payload.event === 'error') {
          console.error('Hook error:', payload.data.message);
        }
      } catch (err) {
        console.error('Failed to parse hook output:', line, err);
      }
    });

    hookProcess.stderr.on('data', (data) => {
      console.error(`Hook stderr: ${data.toString()}`);
    });

    hookProcess.on('exit', (code) => {
      console.log(`Keyboard hook process exited with code ${code}`);
      hookProcess = null;
    });

  } catch (error) {
    console.error('Failed to spawn keyboard hook process:', error);
  }
}

function cleanupHook() {
  if (hookProcess) {
    hookProcess.kill();
    hookProcess = null;
  }
}

function registerHotkeys() {
  // CTRL + ALT + S to manually show/hide or wake overlay
  globalShortcut.register('CommandOrControl+Alt+S', () => {
    if (mainWindow) {
      mainWindow.webContents.send('hotkey-toggle');
    }
  });

  // CTRL + ALT + SHIFT + D to emergency disable hooks and deactivate overlay
  globalShortcut.register('CommandOrControl+Alt+Shift+D', () => {
    emergencyDisable();
  });
}

function emergencyDisable() {
  isDeactivated = true;
  cleanupHook();
  
  if (mainWindow) {
    mainWindow.webContents.send('emergency-deactivate');
    mainWindow.hide();
  }

  // Show standard Windows Notification
  const { Notification } = require('electron');
  if (Notification.isSupported()) {
    new Notification({
      title: 'TypeBar Deactivated',
      body: 'All keyboard hooks disabled. Restart the app to reactivate TypeBar.',
      silent: false
    }).show();
  }

  console.log('TypeBar Emergency Deactivated.');
}

function createTray() {
  // A blank 1x1 image as placeholder, or we can draw one or use a file
  // Using nativeImage to create a simple indicator icon
  const icon = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAK0lEQVQ4T2NkoBAwUqifgbqGBgYZgJnFwMhIp/gYGBkYqGsArW0gB0D2MwAAPA0HC/l/M5gAAAAASUVORK5CYII='
  );

  tray = new Tray(icon);
  const contextMenu = Menu.buildFromTemplate([
    { label: 'TypeBar Assistant', enabled: false },
    { type: 'separator' },
    {
      label: 'Wake / Show',
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('force-show');
        }
      }
    },
    {
      label: 'Emergency Disable',
      click: () => {
        emergencyDisable();
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setToolTip('TypeBar Smart Typing Assistant');
  tray.setContextMenu(contextMenu);
}

// IPC Receivers from React Renderer
ipcMain.on('set-suppress-keys', (event, suppress: boolean) => {
  if (hookProcess && hookProcess.stdin && !hookProcess.killed) {
    hookProcess.stdin.write(JSON.stringify({ action: 'set_suppress', suppress }) + '\n');
  }
});

ipcMain.on('simulate-input', (event, text: string) => {
  if (hookProcess && hookProcess.stdin && !hookProcess.killed) {
    hookProcess.stdin.write(JSON.stringify({ action: 'simulate_input', text }) + '\n');
  }
});

ipcMain.on('simulate-backspace', (event, count: number) => {
  if (hookProcess && hookProcess.stdin && !hookProcess.killed) {
    hookProcess.stdin.write(JSON.stringify({ action: 'simulate_backspace', count }) + '\n');
  }
});

ipcMain.on('simulate-key', (event, key: string) => {
  if (hookProcess && hookProcess.stdin && !hookProcess.killed) {
    hookProcess.stdin.write(JSON.stringify({ action: 'simulate_key', key }) + '\n');
  }
});

// Toggles mouse click-through dynamically when cursor enters/leaves UI interactive parts
ipcMain.on('set-ignore-mouse-events', (event, ignore: boolean) => {
  if (mainWindow) {
    if (ignore) {
      mainWindow.setIgnoreMouseEvents(true, { forward: true });
    } else {
      mainWindow.setIgnoreMouseEvents(false);
    }
  }
});

app.whenReady().then(() => {
  createWindow();
  startKeyboardHook();
  registerHotkeys();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  cleanupHook();
  globalShortcut.unregisterAll();
});
