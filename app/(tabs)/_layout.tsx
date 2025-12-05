import React from 'react';
import { Platform, View, useWindowDimensions } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs, Redirect } from 'expo-router';
import { useAuth, useTheme } from '../../context';
import { Navbar } from '../../components';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const { isAuthenticated, loading, user } = useAuth();
  const { colors } = useTheme();
  
  // --- Lógica de Detección de Plataforma Mejorada ---
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  
  // Detectar si es un navegador móvil (User Agent o Ancho de pantalla típico de tablet/celular)
  const isMobileUserAgent = typeof navigator !== 'undefined' && 
    /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  const isMobileWeb = isWeb && (isMobileUserAgent || width < 1024); // Aumentamos el breakpoint a 1024px para incluir tablets en modo "móvil"
  
  // Decidir si mostrar el TabBar nativo (Bottom Menu)
  // Se muestra en Apps Nativas (iOS/Android) Y en Web Móvil.
  // Se oculta SOLO en Web Desktop (porque ahí usas el Navbar superior).
  const showBottomTabs = !isWeb || isMobileWeb;

  const userRole = user?.role?.toUpperCase();

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  // Configuración de Tabs según Rol
  const allTabs = {
    home: {
      title: 'Inicio',
      icon: 'home' as const,
      roles: ['USER'] as const,
    },
    menus: {
      title: 'Menús',
      icon: 'cutlery' as const,
      roles: ['USER'] as const,
    },
    'mis-pedidos': {
      title: 'Mis Pedidos',
      icon: 'list-ul' as const,
      roles: ['USER'] as const,
    },
    'pedidos-vendor': {
      title: 'Pedidos',
      icon: 'list-alt' as const,
      roles: ['VENDOR'] as const,
    },
    'gestionar-menus': {
      title: 'Menús',
      icon: 'cutlery' as const,
      roles: ['VENDOR'] as const,
    },
    dashboard: {
      title: 'Dashboard',
      icon: 'tachometer' as const,
      roles: ['ADMIN'] as const,
    },
    'gestionar-usuarios': {
      title: 'Usuarios',
      icon: 'users' as const,
      roles: ['ADMIN'] as const,
    },
    'gestionar-vendors': {
      title: 'Vendors',
      icon: 'building' as const,
      roles: ['ADMIN'] as const,
    },
    comentarios: {
      title: 'Comentarios',
      icon: 'comments' as const,
      roles: ['ADMIN', 'VENDOR'] as const,
    },
    perfil: {
      title: 'Perfil',
      icon: 'user' as const,
      roles: ['USER', 'VENDOR', 'ADMIN'] as const,
    },
  };

  const currentRole = (userRole || 'USER') as 'USER' | 'VENDOR' | 'ADMIN';
  const tabsToShow = Object.entries(allTabs).filter(([_, config]) => 
    (config.roles as readonly string[]).includes(currentRole)
  );

  const allTabNames = Object.keys(allTabs);
  const hiddenTabs = allTabNames.filter(name => 
    !tabsToShow.some(([shownName]) => shownName === name)
  );

  const navbarItems = tabsToShow.map(([name, config]) => ({
    name,
    title: config.title,
    icon: config.icon,
    href: `/(tabs)/${name}` as any,
  }));

  return (
    <>
      {/* Navbar Superior: Solo visible en Desktop Web */}
      {isWeb && !isMobileWeb && <Navbar items={navbarItems} />}

      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          // Header superior nativo
          headerShown: isWeb ? isMobileWeb : false, 
          headerStyle: {
            backgroundColor: colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 18,
          },
          // Estilo del Menú Inferior (Tabs)
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            // Altura adaptable según plataforma
            height: Platform.select({ ios: 85, android: 60, web: 65 }),
            paddingBottom: Platform.select({ ios: 25, android: 8, web: 10 }),
            paddingTop: 8,
            // Control de visibilidad explícito
            display: showBottomTabs ? 'flex' : 'none',
            position: isWeb ? 'fixed' : undefined, // Asegurar que se quede abajo en web
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 100,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
            marginBottom: Platform.select({ web: 4, default: 0 }),
          },
        }}>
        
        {tabsToShow.map(([name, config]) => (
          <Tabs.Screen
            key={name}
            name={name}
            options={{
              title: config.title,
              tabBarIcon: ({ color }) => <TabBarIcon name={config.icon} color={color} />,
            }}
          />
        ))}
        
        {/* Tabs Ocultos (Rutas accesibles pero sin botón en el menú) */}
        {hiddenTabs.map(name => (
          <Tabs.Screen 
            key={`hidden-${name}`} 
            name={name} 
            options={{ href: null }} 
          />
        ))}
        
        <Tabs.Screen 
          name="pago-yape" 
          options={{ 
            href: null,
            headerShown: false,
            tabBarStyle: { display: 'none' } // Ocultar tabs en pantalla de pago
          }} 
        />
      </Tabs>
    </>
  );
}