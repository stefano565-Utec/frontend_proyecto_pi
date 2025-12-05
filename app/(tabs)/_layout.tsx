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
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const { isAuthenticated, loading, user } = useAuth();
  const { colors } = useTheme();
  const headerShown = Platform.OS === 'web' ? true : false;
  const userRole = user?.role?.toUpperCase();
  const isVendor = userRole === 'VENDOR';
  const isAdmin = userRole === 'ADMIN';

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

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
      icon: 'list' as const,
      roles: ['USER'] as const,
    },
    'pedidos-vendor': {
      title: 'Pedidos',
      icon: 'list' as const,
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

  const isWeb = Platform.OS === 'web';
  const { width } = useWindowDimensions();
  const isMobileUserAgent =
    typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isMobileWeb = isWeb && (isMobileUserAgent || width < 768);

  const navbarItems = tabsToShow.map(([name, config]) => ({
    name,
    title: config.title,
    icon: config.icon,
    href: `/(tabs)/${name}` as any,
  }));

  return (
    <>
      {isWeb && !isMobileWeb && <Navbar items={navbarItems} />}
      {/* mobile web uses the app's tabs (native tab bar) so we don't render a separate MobileNavbar */}
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
            tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
              ...(isWeb && !isMobileWeb && {
                display: 'none',
              }),
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: 'normal',
          },
          tabBarIconStyle: {
            marginBottom: -3,
          },
          headerShown: isWeb ? isMobileWeb : false,
          headerStyle: {
            backgroundColor: colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: 'bold',
            color: colors.text,
            fontSize: 18,
          },
        }}>
      {tabsToShow.map(([name, config]) => (
        <Tabs.Screen
          key={name}
          name={name as any}
          options={{
            title: config.title,
            tabBarIcon: ({ color }) => <TabBarIcon name={config.icon} color={color} />,
          }}
        />
      ))}
      
      {hiddenTabs.map(name => (
        <Tabs.Screen 
          key={`hidden-${name}`} 
          name={name as any} 
          options={{ href: null }} 
        />
      ))}
      
      <Tabs.Screen 
        name="pago-yape" 
        options={{ 
          href: null,
          headerShown: false,
        }} 
      />
    </Tabs>
    </>
  );
}
