using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.Json;
using System.Threading;

namespace TypeBarHook
{
    class Program
    {
        // Structure for SendInput
        [StructLayout(LayoutKind.Sequential)]
        struct INPUT
        {
            public uint type;
            public InputUnion u;
        }

        [StructLayout(LayoutKind.Explicit)]
        struct InputUnion
        {
            [FieldOffset(0)] public MOUSEINPUT mi;
            [FieldOffset(0)] public KEYBDINPUT ki;
            [FieldOffset(0)] public HARDWAREINPUT hi;
        }

        [StructLayout(LayoutKind.Sequential)]
        struct KEYBDINPUT
        {
            public ushort wVk;
            public ushort wScan;
            public uint dwFlags;
            public uint time;
            public IntPtr dwExtraInfo;
        }

        [StructLayout(LayoutKind.Sequential)]
        struct MOUSEINPUT
        {
            public int dx;
            public int dy;
            public uint mouseData;
            public uint dwFlags;
            public uint time;
            public IntPtr dwExtraInfo;
        }

        [StructLayout(LayoutKind.Sequential)]
        struct HARDWAREINPUT
        {
            public uint uMsg;
            public ushort wParamL;
            public ushort wParamH;
        }

        [StructLayout(LayoutKind.Sequential)]
        struct KBDLLHOOKSTRUCT
        {
            public uint vkCode;
            public uint scanCode;
            public uint flags;
            public uint time;
            public IntPtr dwExtraInfo;
        }

        // Win32 API Imports
        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        static extern IntPtr SetWindowsHookEx(int idHook, LowLevelKeyboardProc lpfn, IntPtr hMod, uint dwThreadId);

        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        static extern bool UnhookWindowsHookEx(IntPtr hhk);

        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        static extern IntPtr CallNextHookEx(IntPtr hhk, int nCode, IntPtr wParam, IntPtr lParam);

        [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        static extern IntPtr GetModuleHandle(string lpModuleName);

        [DllImport("user32.dll")]
        static extern IntPtr GetForegroundWindow();

        [DllImport("user32.dll", SetLastError = true)]
        static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

        [DllImport("user32.dll", SetLastError = true)]
        static extern uint SendInput(uint nInputs, INPUT[] pInputs, int cbSize);

        [DllImport("user32.dll")]
        static extern uint MapVirtualKey(uint uCode, uint uMapType);

        [DllImport("user32.dll")]
        static extern short GetKeyState(int nVirtKey);

        [DllImport("user32.dll")]
        static extern short GetAsyncKeyState(int vKey);

        [DllImport("user32.dll")]
        static extern int ToUnicode(
            uint wVirtKey,
            uint wScanCode,
            byte[] lpKeyState,
            [Out, MarshalAs(UnmanagedType.LPWStr, SizeConst = 64)] StringBuilder pwszBuff,
            int cchBuff,
            uint wFlags);

        [DllImport("user32.dll")]
        static extern IntPtr SetWinEventHook(uint eventMin, uint eventMax, IntPtr hmodWinEventProc, WinEventDelegate lpfnWinEventProc, uint idProcess, uint idThread, uint dwFlags);

        [DllImport("user32.dll")]
        static extern bool UnhookWinEvent(IntPtr hWinEventHook);

        // Constants
        const int WH_KEYBOARD_LL = 13;
        const int WM_KEYDOWN = 0x0100;
        const int WM_KEYUP = 0x0101;
        const int WM_SYSKEYDOWN = 0x0104;
        const int WM_SYSKEYUP = 0x0105;

        const uint INPUT_KEYBOARD = 1;
        const uint KEYEVENTF_KEYUP = 0x0002;
        const uint KEYEVENTF_SCANCODE = 0x0008;
        const uint KEYEVENTF_UNICODE = 0x0004;

        const uint MAPVK_VK_TO_VSC = 0;
        const uint MAPVK_VSC_TO_VK = 1;

        const int VK_SHIFT = 0x10;
        const int VK_CONTROL = 0x11;
        const int VK_MENU = 0x12; // Alt
        const int VK_CAPITAL = 0x14; // Caps Lock

        const uint EVENT_SYSTEM_FOREGROUND = 0x0003;
        const uint WINEVENT_OUTOFCONTEXT = 0;

        // Delegates
        delegate IntPtr LowLevelKeyboardProc(int nCode, IntPtr wParam, IntPtr lParam);
        delegate void WinEventDelegate(IntPtr hWinEventHook, uint eventType, IntPtr hwnd, int idObject, int idChild, uint dwEventThread, uint dwmsEventTime);

        // State Variables
        static IntPtr _keyboardHookId = IntPtr.Zero;
        static IntPtr _windowHookId = IntPtr.Zero;
        static LowLevelKeyboardProc _keyboardProc = HookCallback;
        static WinEventDelegate _windowProc = WindowChangedCallback;
        static bool _suppressKeys = false;
        static IntPtr _lastForegroundWindow = IntPtr.Zero;

        static void Main(string[] args)
        {
            // Set output encoding to UTF-8 for smooth Unicode JSON streams
            Console.OutputEncoding = Encoding.UTF8;
            Console.InputEncoding = Encoding.UTF8;

            // Start standard input reading thread
            Thread inputThread = new Thread(ReadStdinLoop);
            inputThread.IsBackground = true;
            inputThread.Start();

            // Set up hooks
            _keyboardHookId = SetKeyboardHook(_keyboardProc);
            _windowHookId = SetWinEventHook(EVENT_SYSTEM_FOREGROUND, EVENT_SYSTEM_FOREGROUND, IntPtr.Zero, _windowProc, 0, 0, WINEVENT_OUTOFCONTEXT);

            // Report window on startup
            ReportActiveWindow(GetForegroundWindow());

            // Windows Message Loop (required for low-level hooks)
            MSG msg;
            while (GetMessage(out msg, IntPtr.Zero, 0, 0) > 0)
            {
                TranslateMessage(ref msg);
                DispatchMessage(ref msg);
            }

            // Cleanup hooks
            Cleanup();
        }

        static void Cleanup()
        {
            if (_keyboardHookId != IntPtr.Zero) UnhookWindowsHookEx(_keyboardHookId);
            if (_windowHookId != IntPtr.Zero) UnhookWinEvent(_windowHookId);
        }

        static IntPtr SetKeyboardHook(LowLevelKeyboardProc proc)
        {
            using (Process curProcess = Process.GetCurrentProcess())
            using (ProcessModule curModule = curProcess.MainModule!)
            {
                return SetWindowsHookEx(WH_KEYBOARD_LL, proc, GetModuleHandle(curModule.ModuleName), 0);
            }
        }

        // Low-level keyboard hook callback
        static IntPtr HookCallback(int nCode, IntPtr wParam, IntPtr lParam)
        {
            if (nCode >= 0)
            {
                int eventType = (int)wParam;
                if (eventType == WM_KEYDOWN || eventType == WM_SYSKEYDOWN)
                {
                    KBDLLHOOKSTRUCT hookStruct = Marshal.PtrToStructure<KBDLLHOOKSTRUCT>(lParam);
                    uint vkCode = hookStruct.vkCode;

                    // 1. Ignore our own synthetically injected keys to prevent feedback loops
                    // Using custom dwExtraInfo signature is 100% VM/RDP compatible
                    bool isOurOwnInjection = hookStruct.dwExtraInfo == (IntPtr)0x12345678;
                    if (isOurOwnInjection)
                    {
                        return CallNextHookEx(_keyboardHookId, nCode, wParam, lParam);
                    }

                    bool ctrl = (GetAsyncKeyState(VK_CONTROL) & 0x8000) != 0;
                    bool alt = (GetAsyncKeyState(VK_MENU) & 0x8000) != 0;
                    bool shift = (GetAsyncKeyState(VK_SHIFT) & 0x8000) != 0;
                    bool win = (GetAsyncKeyState(0x5B) & 0x8000) != 0 || (GetAsyncKeyState(0x5C) & 0x8000) != 0;

                    // 2. Emergency deactivate check (Ctrl + Alt + Shift pressed together)
                    if (ctrl && alt && shift)
                    {
                        SendEvent("emergency_deactivate", new { });
                        Cleanup();
                        return (IntPtr)1; // Consume key to prevent it leaking
                    }

                    // If suppression is active, intercept Tab, Right Arrow, or F1-F5 keys
                    if (_suppressKeys && !ctrl && !alt)
                    {
                        if (vkCode == 0x09 || vkCode == 0x27 || (vkCode >= 0x70 && vkCode <= 0x74)) // Tab, Right, or F1-F5
                        {
                            string keyName = "Tab";
                            if (vkCode == 0x27) keyName = "Right";
                            else if (vkCode == 0x70) keyName = "F1";
                            else if (vkCode == 0x71) keyName = "F2";
                            else if (vkCode == 0x72) keyName = "F3";
                            else if (vkCode == 0x73) keyName = "F4";
                            else if (vkCode == 0x74) keyName = "F5";

                            SendEvent("suppressed_key", new { key = keyName });
                            return (IntPtr)1; // Block the key press!
                        }
                    }

                    // Map key to a readable name or unicode character
                    string keyNameStr = GetKeyName(vkCode);
                    string character = GetUnicodeChar(vkCode, hookStruct.scanCode);

                    SendEvent("keydown", new
                    {
                        key = keyNameStr,
                        character = character,
                        vk = vkCode,
                        ctrl = ctrl,
                        alt = alt,
                        shift = shift,
                        win = win
                    });
                }
            }
            return CallNextHookEx(_keyboardHookId, nCode, wParam, lParam);
        }

        // Active window changed callback
        static void WindowChangedCallback(IntPtr hWinEventHook, uint eventType, IntPtr hwnd, int idObject, int idChild, uint dwEventThread, uint dwmsEventTime)
        {
            if (hwnd != IntPtr.Zero && hwnd != _lastForegroundWindow)
            {
                _lastForegroundWindow = hwnd;
                ReportActiveWindow(hwnd);
            }
        }

        static void ReportActiveWindow(IntPtr hwnd)
        {
            if (hwnd == IntPtr.Zero) return;

            GetWindowThreadProcessId(hwnd, out uint processId);
            string processName = "Unknown";
            try
            {
                using (Process proc = Process.GetProcessById((int)processId))
                {
                    processName = proc.ProcessName;
                }
            }
            catch {}

            StringBuilder titleBuilder = new StringBuilder(256);
            GetWindowText(hwnd, titleBuilder, 256);

            SendEvent("window_changed", new
            {
                process = processName,
                title = titleBuilder.ToString()
            });
        }

        // Map Virtual Keys to simple string identifiers
        static string GetKeyName(uint vkCode)
        {
            switch (vkCode)
            {
                case 0x08: return "Backspace";
                case 0x09: return "Tab";
                case 0x0D: return "Enter";
                case 0x1B: return "Escape";
                case 0x20: return "Space";
                case 0x25: return "Left";
                case 0x26: return "Up";
                case 0x27: return "Right";
                case 0x28: return "Down";
                case 0x2E: return "Delete";
                case 0x5B: return "LWin";
                case 0x5C: return "RWin";
                case 0x14: return "CapsLock";
                case 0x90: return "NumLock";
                case 0x91: return "ScrollLock";
                case 0x70: return "F1";
                case 0x71: return "F2";
                case 0x72: return "F3";
                case 0x73: return "F4";
                case 0x74: return "F5";
                case 0x75: return "F6";
                case 0x76: return "F7";
                case 0x77: return "F8";
                case 0x78: return "F9";
                case 0x79: return "F10";
                case 0x7A: return "F11";
                case 0x7B: return "F12";
                case 0x10: case 0xA0: case 0xA1: return "Shift";
                case 0x11: case 0xA2: case 0xA3: return "Control";
                case 0x12: case 0xA4: case 0xA5: return "Alt";
                default:
                    // Just return virtual key code if not explicitly mapped
                    return ((char)vkCode).ToString();
            }
        }

        // Map key event to its corresponding unicode text representation
        static string GetUnicodeChar(uint vkCode, uint scanCode)
        {
            // Skip control keys
            if (vkCode < 0x20 || (vkCode >= 0x70 && vkCode <= 0x87) || vkCode == 0x2E)
                return "";

            byte[] keyState = new byte[256];
            keyState[VK_SHIFT] = (byte)((GetKeyState(VK_SHIFT) & 0x8000) != 0 ? 0x80 : 0);
            keyState[VK_CONTROL] = (byte)((GetKeyState(VK_CONTROL) & 0x8000) != 0 ? 0x80 : 0);
            keyState[VK_MENU] = (byte)((GetKeyState(VK_MENU) & 0x8000) != 0 ? 0x80 : 0);
            keyState[VK_CAPITAL] = (byte)(GetKeyState(VK_CAPITAL) & 1);

            StringBuilder temp = new StringBuilder(64);
            int result = ToUnicode(vkCode, scanCode, keyState, temp, temp.Capacity, 0);

            if (result > 0)
                return temp.ToString();

            return "";
        }

        // Read commands from standard input
        static void ReadStdinLoop()
        {
            try
            {
                string? line;
                while ((line = Console.ReadLine()) != null)
                {
                    if (string.IsNullOrWhiteSpace(line)) continue;

                    using (JsonDocument doc = JsonDocument.Parse(line))
                    {
                        JsonElement root = doc.RootElement;
                        if (root.TryGetProperty("action", out JsonElement actionProp))
                        {
                            string action = actionProp.GetString() ?? "";
                            switch (action)
                            {
                                case "set_suppress":
                                    if (root.TryGetProperty("suppress", out JsonElement suppressProp))
                                    {
                                        _suppressKeys = suppressProp.GetBoolean();
                                    }
                                    break;

                                case "simulate_input":
                                    if (root.TryGetProperty("text", out JsonElement textProp))
                                    {
                                        SimulateTypeString(textProp.GetString() ?? "");
                                    }
                                    break;

                                case "simulate_backspace":
                                    if (root.TryGetProperty("count", out JsonElement countProp))
                                    {
                                        SimulateBackspace(countProp.GetInt32());
                                    }
                                    break;

                                case "simulate_key":
                                    if (root.TryGetProperty("key", out JsonElement keyProp))
                                    {
                                        string key = keyProp.GetString() ?? "";
                                        if (key == "Tab") SimulateTab();
                                        else if (key == "Right") SimulateRightArrow();
                                    }
                                    break;
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                SendEvent("error", new { message = ex.Message });
            }
            finally
            {
                // If stdin closes (parent process exited), shut down hook
                Environment.Exit(0);
            }
        }

        // Send JSON event to Electron stdout
        static void SendEvent(string eventType, object data)
        {
            var payload = new
            {
                @event = eventType,
                data = data
            };
            string json = JsonSerializer.Serialize(payload);
            Console.WriteLine(json);
            Console.Out.Flush(); // Force write to pipe immediately to prevent buffering delay
        }

        // Win32 Input Simulation helper - uses scan codes for max compatibility (e.g. Roblox)
        static void SendInputKeys(INPUT[] inputs)
        {
            SendInput((uint)inputs.Length, inputs, Marshal.SizeOf(typeof(INPUT)));
        }

        static void SimulateBackspace(int count)
        {
            if (count <= 0) return;

            ushort vk = 0x08; // VK_BACK
            ushort scan = (ushort)MapVirtualKey(vk, MAPVK_VK_TO_VSC);

            INPUT[] inputs = new INPUT[count * 2];
            for (int i = 0; i < count; i++)
            {
                // Key Down
                inputs[i * 2] = new INPUT
                {
                    type = INPUT_KEYBOARD,
                    u = new InputUnion
                    {
                        ki = new KEYBDINPUT
                        {
                            wVk = 0,
                            wScan = scan,
                            dwFlags = KEYEVENTF_SCANCODE,
                            time = 0,
                            dwExtraInfo = (IntPtr)0x12345678
                        }
                    }
                };
                // Key Up
                inputs[i * 2 + 1] = new INPUT
                {
                    type = INPUT_KEYBOARD,
                    u = new InputUnion
                    {
                        ki = new KEYBDINPUT
                        {
                            wVk = 0,
                            wScan = scan,
                            dwFlags = KEYEVENTF_SCANCODE | KEYEVENTF_KEYUP,
                            time = 0,
                            dwExtraInfo = (IntPtr)0x12345678
                        }
                    }
                };
            }
            SendInputKeys(inputs);
        }

        static void SimulateTab()
        {
            ushort vk = 0x09; // VK_TAB
            ushort scan = (ushort)MapVirtualKey(vk, MAPVK_VK_TO_VSC);

            INPUT[] inputs = new INPUT[]
            {
                new INPUT { type = INPUT_KEYBOARD, u = new InputUnion { ki = new KEYBDINPUT { wVk = 0, wScan = scan, dwFlags = KEYEVENTF_SCANCODE, dwExtraInfo = (IntPtr)0x12345678 } } },
                new INPUT { type = INPUT_KEYBOARD, u = new InputUnion { ki = new KEYBDINPUT { wVk = 0, wScan = scan, dwFlags = KEYEVENTF_SCANCODE | KEYEVENTF_KEYUP, dwExtraInfo = (IntPtr)0x12345678 } } }
            };
            SendInputKeys(inputs);
        }

        static void SimulateRightArrow()
        {
            ushort vk = 0x27; // VK_RIGHT
            ushort scan = (ushort)MapVirtualKey(vk, MAPVK_VK_TO_VSC);

            INPUT[] inputs = new INPUT[]
            {
                new INPUT { type = INPUT_KEYBOARD, u = new InputUnion { ki = new KEYBDINPUT { wVk = 0, wScan = (ushort)(scan | 0xE100), dwFlags = KEYEVENTF_SCANCODE, dwExtraInfo = (IntPtr)0x12345678 } } }, // Arrow keys are extended keys!
                new INPUT { type = INPUT_KEYBOARD, u = new InputUnion { ki = new KEYBDINPUT { wVk = 0, wScan = (ushort)(scan | 0xE100), dwFlags = KEYEVENTF_SCANCODE | KEYEVENTF_KEYUP, dwExtraInfo = (IntPtr)0x12345678 } } }
            };
            SendInputKeys(inputs);
        }

        static void SimulateTypeString(string text)
        {
            if (string.IsNullOrEmpty(text)) return;

            // Convert string to KEYBDINPUT commands with KEYEVENTF_UNICODE for proper text input injection
            INPUT[] inputs = new INPUT[text.Length * 2];
            for (int i = 0; i < text.Length; i++)
            {
                char c = text[i];

                inputs[i * 2] = new INPUT
                {
                    type = INPUT_KEYBOARD,
                    u = new InputUnion
                    {
                        ki = new KEYBDINPUT
                        {
                            wVk = 0,
                            wScan = c,
                            dwFlags = KEYEVENTF_UNICODE,
                            time = 0,
                            dwExtraInfo = (IntPtr)0x12345678
                        }
                    }
                };

                inputs[i * 2 + 1] = new INPUT
                {
                    type = INPUT_KEYBOARD,
                    u = new InputUnion
                    {
                        ki = new KEYBDINPUT
                        {
                            wVk = 0,
                            wScan = c,
                            dwFlags = KEYEVENTF_UNICODE | KEYEVENTF_KEYUP,
                            time = 0,
                            dwExtraInfo = (IntPtr)0x12345678
                        }
                    }
                };
            }
            SendInputKeys(inputs);
        }

        // Struct for message pumping
        [StructLayout(LayoutKind.Sequential)]
        struct MSG
        {
            public IntPtr hwnd;
            public uint message;
            public IntPtr wParam;
            public IntPtr lParam;
            public uint time;
            public System.Drawing.Point pt;
            public uint lPrivate;
        }

        [DllImport("user32.dll")]
        static extern int GetMessage(out MSG lpMsg, IntPtr hWnd, uint wMsgFilterMin, uint wMsgFilterMax);

        [DllImport("user32.dll")]
        static extern bool TranslateMessage(ref MSG lpMsg);

        [DllImport("user32.dll")]
        static extern IntPtr DispatchMessage(ref MSG lpMsg);
    }
}
