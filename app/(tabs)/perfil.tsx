import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Platform, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { userService } from '../../services';
import { useAuth, useTheme } from '../../context';
import type { User } from '../../types';
import { Button, Card, Loading, ToggleSwitch } from '../../components';

export default function PerfilScreen() {
  const { user: authUser, logout } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const [usuario, setUsuario] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const usuarioId = authUser?.id;
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await cargarUsuario();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Usar los datos del usuario autenticado directamente si están disponibles
    if (authUser) {
      setUsuario({
        id: authUser.id,
        firstName: authUser.firstName,
        lastName: authUser.lastName,
        email: authUser.email,
        role: authUser.role,
        vendorId: undefined, // No viene en AuthResponse
      });
      setLoading(false);
    } else if (usuarioId) {
      // Si no tenemos los datos completos, intentar cargar desde el backend
      cargarUsuario();
    } else {
      setLoading(false);
    }
  }, [authUser, usuarioId]);

  const cargarUsuario = async () => {
    if (!usuarioId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await userService.getById(usuarioId);
      setUsuario(response.data);
    } catch (error: any) {
      // Si falla, usar los datos del authUser como fallback
      if (authUser) {
        setUsuario({
          id: authUser.id,
          firstName: authUser.firstName,
          lastName: authUser.lastName,
          email: authUser.email,
          role: authUser.role,
          vendorId: undefined,
        });
      }
    } finally {
      setLoading(false);
    }
  };


  const handleLogout = async () => {
    try {
      await logout();
      setUsuario(null);
      
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
          return;
        }
      }
      
      router.replace('/login');
    } catch (error) {
      // Aun así, intentar redirigir
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.location.href = '/login';
      } else {
        router.replace('/login');
      }
    }
  };

  if (loading) {
    return <Loading />;
  }

  const errorStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    errorContainer: {
      padding: 40,
      alignItems: 'center',
    },
    errorText: {
      fontSize: 16,
      color: colors.text,
    },
  });

  if (!usuario) {
    return (
      <View style={errorStyles.container}>
        <View style={errorStyles.errorContainer}>
          <Text style={errorStyles.errorText}>No se pudo cargar la información del usuario</Text>
        </View>
      </View>
    );
  }

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: 20,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 3,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
    },
    card: {
      margin: 16,
    },
    formGroup: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 8,
      fontWeight: '600',
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      backgroundColor: colors.inputBackground,
      color: colors.text,
    },
    inputDisabled: {
      backgroundColor: colors.inputBackground,
      color: colors.textSecondary,
    },
    logoutContainer: {
      padding: 16,
      paddingBottom: 40,
    },
    errorContainer: {
      padding: 40,
      alignItems: 'center',
    },
    errorText: {
      fontSize: 16,
      color: colors.text,
    },
    themeToggleContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    themeToggleText: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '600',
    },
  });

  return (
    <ScrollView style={dynamicStyles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.title}>Mi Perfil</Text>
      </View>

      <View style={dynamicStyles.themeToggleContainer}>
        <Text style={dynamicStyles.themeToggleText}>Modo Oscuro</Text>
        <ToggleSwitch
          value={isDark}
          onValueChange={(value) => {
            if (value !== isDark) {
              toggleTheme();
            }
          }}
        />
      </View>

      <Card style={dynamicStyles.card}>
        <View style={dynamicStyles.formGroup}>
          <Text style={dynamicStyles.label}>Nombre:</Text>
          <TextInput
            style={[dynamicStyles.input, dynamicStyles.inputDisabled]}
            value={usuario.firstName}
            editable={false}
          />
        </View>

        <View style={dynamicStyles.formGroup}>
          <Text style={dynamicStyles.label}>Apellido:</Text>
          <TextInput
            style={[dynamicStyles.input, dynamicStyles.inputDisabled]}
            value={usuario.lastName}
            editable={false}
          />
        </View>

        <View style={dynamicStyles.formGroup}>
          <Text style={dynamicStyles.label}>Email:</Text>
          <TextInput
            style={[dynamicStyles.input, dynamicStyles.inputDisabled]}
            value={usuario.email}
            editable={false}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={dynamicStyles.formGroup}>
          <Text style={dynamicStyles.label}>Rol:</Text>
          <TextInput
            style={[dynamicStyles.input, dynamicStyles.inputDisabled]}
            value={usuario.role}
            editable={false}
          />
        </View>
      </Card>

      <View style={dynamicStyles.logoutContainer}>
        <Button 
          variant="danger" 
          onPress={handleLogout}
        >
          Cerrar Sesión
        </Button>
      </View>
    </ScrollView>
  );
}

// Estilos estáticos eliminados - se usan dynamicStyles

