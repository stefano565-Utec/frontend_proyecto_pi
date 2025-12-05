import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform, AppState, View, useWindowDimensions } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import 'react-native-reanimated';
import { AuthProvider, ThemeProvider, useTheme } from '../context';
import DialogProvider from './components/DialogProvider';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Función para ocultar la barra de navegación del sistema en Android
  const hideNavigationBar = async () => {
    if (Platform.OS === 'android') {
      try {
        await NavigationBar.setVisibilityAsync('hidden');
        await NavigationBar.setBehaviorAsync('overlay-swipe');
      } catch (error) {
        // Error silencioso al ocultar barra de navegación
      }
    }
  };

  // Ocultar barra de navegación del sistema en Android al montar
  useEffect(() => {
    hideNavigationBar();
  }, []);

  // Reaplicar la configuración cuando la app vuelve al foreground
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        // Cuando la app vuelve a estar activa, reaplicar la configuración
        hideNavigationBar();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <DialogProvider>
          <RootLayoutNav />
        </DialogProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

function RootLayoutNav() {
  const { isDark } = useTheme();

  return (
    <NavigationThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </NavigationThemeProvider>
  );
}
