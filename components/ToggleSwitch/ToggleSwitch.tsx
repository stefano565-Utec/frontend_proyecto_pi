import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../context';
import './ToggleSwitch.css';

interface ToggleSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  value,
  onValueChange,
  disabled = false,
}) => {
  const { colors, isDark } = useTheme();

  const dynamicStyles = StyleSheet.create({
    toggleSwitch: {
      width: 50,
      height: 30,
      borderRadius: 15,
      backgroundColor: value ? colors.primary : colors.border,
      padding: 2,
      justifyContent: 'center',
      position: 'relative' as const,
      opacity: disabled ? 0.5 : 1,
    },
    toggleCircle: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: colors.surface,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 3,
      position: 'absolute' as const,
      left: value ? 22 : 2,
    },
  });

  return (
    <TouchableOpacity
      style={dynamicStyles.toggleSwitch}
      onPress={() => !disabled && onValueChange(!value)}
      disabled={disabled}
      activeOpacity={0.8}
      className="toggle-switch"
    >
      <View style={dynamicStyles.toggleCircle} className="toggle-circle" />
    </TouchableOpacity>
  );
};

export default ToggleSwitch;

