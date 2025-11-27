import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme as useSystemColorScheme } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  primary: string;
  primaryHover: string;
  secondary: string;
  danger: string;
  dangerHover: string;
  border: string;
  borderLight: string;
  shadow: string;
  cardBackground: string;
  inputBackground: string;
  filterChipBackground: string;
  filterChipActive: string;
  filterChipHover: string;
}

interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const lightColors: ThemeColors = {
  background: '#F5F7FA',
  surface: '#FAFBFC',
  text: '#2C3E50',
  textSecondary: '#7F8C8D',
  primary: '#BEE0E7',
  primaryHover: '#9BCBD5',
  secondary: '#F0F4F8',
  danger: '#CC211B',
  dangerHover: '#B01A15',
  border: '#D1D9E0',
  borderLight: '#E8EDF2',
  shadow: 'rgba(0, 0, 0, 0.1)',
  cardBackground: '#FAFBFC',
  inputBackground: '#F8F9FA',
  filterChipBackground: '#F0F4F8',
  filterChipActive: '#BEE0E7',
  filterChipHover: '#E1E8ED',
};

const darkColors: ThemeColors = {
  background: '#1A1A1A',
  surface: '#2D2D2D',
  text: '#E8E8E8',
  textSecondary: '#C0C0C0',
  primary: '#4A9BA8',
  primaryHover: '#3A8B98',
  secondary: '#3D3D3D',
  danger: '#D1221B',
  dangerHover: '#B01A15',
  border: '#404040',
  borderLight: '#353535',
  shadow: 'rgba(0, 0, 0, 0.5)',
  cardBackground: '#2D2D2D',
  inputBackground: '#3A3A3A',
  filterChipBackground: '#353535',
  filterChipActive: '#4A9BA8',
  filterChipHover: '#454545',
};

const ThemeContext = createContext<Theme | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const systemColorScheme = useSystemColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system')) {
          setThemeMode(savedTheme as ThemeMode);
        }
      } catch (error) {
        // Error silencioso
      } finally {
        setLoading(false);
      }
    };
    loadTheme();
  }, []);

  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');
  const colors = isDark ? darkColors : lightColors;

  const toggleTheme = async () => {
    const newMode: ThemeMode = isDark ? 'light' : 'dark';
    setThemeMode(newMode);
    try {
      await AsyncStorage.setItem('theme', newMode);
    } catch (error) {
      // Error silencioso
    }
  };

  const setTheme = async (mode: ThemeMode) => {
    setThemeMode(mode);
    try {
      await AsyncStorage.setItem('theme', mode);
    } catch (error) {
      // Error silencioso
    }
  };

  if (loading) {
    return null;
  }

  return (
    <ThemeContext.Provider
      value={{
        mode: themeMode,
        colors,
        isDark,
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

