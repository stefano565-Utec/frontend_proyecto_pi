import React, { ReactNode } from 'react';
import { View, ViewStyle, Platform } from 'react-native';
import { useTheme } from '../../context';
import './Card.css';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, style, className }) => {
  const { colors } = useTheme();
  
  return (
    <View 
      style={[{
        backgroundColor: colors.cardBackground,
        borderRadius: 12,
        padding: 16,
        marginVertical: 8,
        shadowColor: colors.shadow,
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
      }, style]} 
      className={Platform.OS === 'web' ? (className ? `${className} card` : 'card') : undefined}
    >
      {children}
    </View>
  );
};

export default Card;

