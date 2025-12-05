import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTheme } from '../../context';

interface NavItem {
  name: string;
  title: string;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  href: string;
}

interface MobileNavbarProps {
  items: NavItem[];
}

const MobileNavbar: React.FC<MobileNavbarProps> = ({ items }) => {
  const { colors } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  if (Platform.OS !== 'web') return null;

  const isActive = (href: string) => {
    const current = pathname || '';
    if (href === '/(tabs)/home' || href === '/(tabs)') {
      return current === '/(tabs)/home' || current === '/(tabs)' || current === '/';
    }
    return current === href || current?.startsWith(href);
  };

  const styles = StyleSheet.create({
    container: {
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: 60,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      zIndex: 50,
    },
    item: {
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
    },
    label: {
      fontSize: 12,
      marginTop: 2,
      color: colors.textSecondary,
    },
  });

  return (
    <View style={styles.container}>
      {items.map((item) => {
        const active = isActive(item.href);
        return (
          <TouchableOpacity
            key={item.name}
            style={styles.item}
            onPress={() => router.push(item.href as any)}
          >
            <FontAwesome name={item.icon} size={20} color={active ? colors.primary : colors.textSecondary} />
            <Text style={[styles.label, active && { color: colors.primary }]}>{item.title}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default MobileNavbar;
