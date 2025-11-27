import React from 'react';
import { View, ActivityIndicator, Text, Platform } from 'react-native';
import { useTheme } from '../../context';
import './Loading.css';

const Loading: React.FC = () => {
  const { colors } = useTheme();
  
  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: colors.background,
    }} className={Platform.OS === 'web' ? 'loading' : undefined}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={{
        marginTop: 12,
        fontSize: 16,
        color: colors.text,
      }} className={Platform.OS === 'web' ? 'loading__text' : undefined}>
        Cargando...
      </Text>
    </View>
  );
};

export default Loading;

