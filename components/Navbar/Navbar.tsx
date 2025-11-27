import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTheme } from '../../context';
import './Navbar.css';

interface NavItem {
  name: string;
  title: string;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  href: string;
}

interface NavbarProps {
  items: NavItem[];
}

const Navbar: React.FC<NavbarProps> = ({ items }) => {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = React.useState<string | null>(null);

  if (Platform.OS !== 'web') {
    return null;
  }

  const dynamicStyles = StyleSheet.create({
    navbar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingHorizontal: 24,
      paddingVertical: 16,
      height: 64,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 3,
    },
    navLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    navTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    navItems: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    navItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: 'transparent',
    },
    navItemActive: {
      backgroundColor: colors.primary,
    },
    navItemText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    navItemTextActive: {
      color: colors.text,
    },
    navIcon: {
      marginRight: 4,
    },
  });

  const isActive = (href: string) => {
    const normalizedPathname = pathname || '';
    
    if (href === '/(tabs)/home' || href === '/(tabs)') {
      return normalizedPathname === '/(tabs)/home' || normalizedPathname === '/(tabs)' || normalizedPathname === '/';
    }
    
    return normalizedPathname === href || normalizedPathname?.startsWith(href);
  };

  return (
    <View style={dynamicStyles.navbar}>
      <View style={dynamicStyles.navLeft}>
        <Text style={dynamicStyles.navTitle}>Comedor UTEC</Text>
      </View>
      <View style={dynamicStyles.navItems}>
        {items.map((item) => {
          const active = isActive(item.href);
          const isHovered = hoveredItem === item.name;
          return (
            <TouchableOpacity
              key={item.name}
              style={[
                dynamicStyles.navItem,
                active && dynamicStyles.navItemActive,
              ]}
              onPress={() => router.push(item.href as any)}
              {...(Platform.OS === 'web' && {
                onMouseEnter: () => setHoveredItem(item.name),
                onMouseLeave: () => setHoveredItem(null),
              })}
              className="nav-item"
            >
              <FontAwesome
                name={item.icon}
                size={18}
                color={active ? (isDark ? '#E0E0E0' : '#2A2A2A') : (isHovered ? colors.text : colors.textSecondary)}
                style={dynamicStyles.navIcon}
              />
              <Text
                className="nav-item-text"
                style={[
                  dynamicStyles.navItemText,
                  active && {
                    ...dynamicStyles.navItemTextActive,
                    color: isDark ? '#E0E0E0' : '#2A2A2A',
                    textShadowColor: colors.shadow,
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 2,
                  },
                  isHovered && !active && { 
                    color: isDark ? '#E0E0E0' : '#2A2A2A',
                    textShadowColor: colors.shadow,
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 2,
                  },
                ]}
              >
                {item.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default Navbar;

