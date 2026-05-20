import React, { createContext, useContext, useState, useEffect } from 'react';
import type { TypeBarSettings } from '../types';

type Theme = 'light' | 'dark' | 'cyberpunk';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode; initialSettings: TypeBarSettings }> = ({ 
  children, 
  initialSettings 
}) => {
  const [theme, setThemeState] = useState<Theme>(initialSettings.theme);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  useEffect(() => {
    const root = document.documentElement;
    // Remove all theme classes first
    root.classList.remove('dark', 'cyberpunk');
    
    // Add active theme class
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'cyberpunk') {
      root.classList.add('cyberpunk');
    }
    // 'light' is the base style (no class needed or handled by CSS variables defaults)
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
