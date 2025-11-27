import React, { useState } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle, Platform } from 'react-native';
import { useTheme } from '../../context';
import './Button.css';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  onPress,
  disabled = false,
  loading = false,
  children,
  style,
}) => {
  const { colors, isDark } = useTheme();
  const [isHovered, setIsHovered] = useState(false);

  const hasCustomBackground = style && (style as any)?.backgroundColor;
  const { backgroundColor, ...restStyle } = (style || {}) as any;
  
  const getHoverBackgroundColor = () => {
    if (hasCustomBackground) {
      if (isDark) {
        if (backgroundColor === '#D9D9D9') {
          return '#E3E3E3';
        }
        return '#4D4D4D';
      }
      return colors.filterChipHover;
    }
    return null;
  };
  
  const buttonStyle = [
    {
      borderRadius: 8,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    variant === 'primary' && { backgroundColor: colors.primary },
    variant === 'secondary' && { backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.text },
    variant === 'danger' && { backgroundColor: colors.danger },
    size === 'small' && { paddingHorizontal: 12, paddingVertical: 8 },
    size === 'medium' && { paddingHorizontal: 16, paddingVertical: 12 },
    size === 'large' && { paddingHorizontal: 24, paddingVertical: 16 },
    disabled && { opacity: 0.5 },
    restStyle,
    isHovered && !disabled && Platform.OS === 'web' && hasCustomBackground && {
      backgroundColor: getHoverBackgroundColor(),
      transform: [{ translateY: -1 }],
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 6,
      elevation: 4,
    },
    isHovered && !disabled && Platform.OS === 'web' && !hasCustomBackground && variant === 'primary' && {
      backgroundColor: colors.primaryHover,
      transform: [{ translateY: -1 }],
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 6,
      elevation: 4,
    },
    isHovered && !disabled && Platform.OS === 'web' && !hasCustomBackground && variant === 'secondary' && {
      backgroundColor: colors.filterChipHover,
      borderColor: colors.text,
      transform: [{ translateY: -1 }],
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 4,
    },
    isHovered && !disabled && Platform.OS === 'web' && !hasCustomBackground && variant === 'danger' && {
      backgroundColor: colors.dangerHover,
      transform: [{ translateY: -1 }],
      shadowColor: colors.danger,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 4,
    },
    !isHovered && hasCustomBackground && { backgroundColor },
  ];

  const textStyle: TextStyle[] = [
    {
      fontFamily: 'System',
      fontWeight: '600' as const,
    },
    variant === 'primary' ? { color: colors.text } : null,
    variant === 'secondary' ? { color: colors.text } : null,
    variant === 'danger' ? { color: '#FFFFFF' } : null,
    size === 'small' ? { fontSize: 14 } : null,
    size === 'medium' ? { fontSize: 16 } : null,
    size === 'large' ? { fontSize: 18 } : null,
  ].filter(Boolean) as TextStyle[];

  const buttonClasses = Platform.OS === 'web' ? [
    'button',
    `button--${variant}`,
    `button--${size}`,
    disabled && 'button--disabled',
    isHovered && !disabled && 'button--hover',
  ].filter(Boolean).join(' ') : undefined;

  const textClasses = Platform.OS === 'web' ? [
    'button__text',
    `button__text--${variant}`,
    `button__text--${size}`,
  ].filter(Boolean).join(' ') : undefined;

  const handleMouseEnter = () => {
    if (Platform.OS === 'web' && !disabled && !loading) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (Platform.OS === 'web') {
      setIsHovered(false);
    }
  };

  return (
    <TouchableOpacity
      className={buttonClasses}
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...(Platform.OS === 'web' && {
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
      })}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'danger' ? '#FFFFFF' : colors.text} />
      ) : (
        typeof children === 'string' ? (
          <Text className={textClasses} style={textStyle}>{children}</Text>
        ) : (
          children
        )
      )}
    </TouchableOpacity>
  );
};

export default Button;
