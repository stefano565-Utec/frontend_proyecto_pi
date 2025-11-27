import { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth, useTheme } from '../context';
import { loginSchema, registerSchema } from '../validations';
import { Button, Card, Loading } from '../components';

export default function LoginScreen() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const { login, register, isAuthenticated, loading: authLoading } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  // Redirigir si ya está autenticado (solo después de que termine de cargar)
  // La redirección según el rol se maneja en index.tsx
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      // Redirigir a index.tsx que manejará la redirección según el rol
      router.replace('/');
    }
  }, [isAuthenticated, authLoading, router]);

  const handleSubmit = async () => {
    setError('');
    setFieldErrors({});
    setLoading(true);

    try {
      // Validar con Zod antes de enviar
      if (isRegister) {
        const result = registerSchema.safeParse({
          firstName,
          lastName,
          email,
          password,
        });

        if (!result.success) {
          const errors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              errors[err.path[0].toString()] = err.message;
            }
          });
          setFieldErrors(errors);
          setLoading(false);
          return;
        }

        // Usar los datos validados y normalizados
        await register(result.data);
      } else {
        const result = loginSchema.safeParse({
          email,
          password,
        });

        if (!result.success) {
          const errors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              errors[err.path[0].toString()] = err.message;
            }
          });
          setFieldErrors(errors);
          setLoading(false);
          return;
        }

        // Usar los datos validados y normalizados
        await login(result.data);
      }
      
      router.replace('/');
    } catch (err: any) {
      let errorMessage = 'Error desconocido';
      
      if (err.response) {
        // Error de respuesta del servidor
        errorMessage = err.response?.data?.message || 
                      err.response?.data?.error || 
                      err.response?.statusText ||
                      (isRegister ? 'Error al registrarse' : 'Error al iniciar sesión');
      } else if (err.request) {
        // Error de red (sin respuesta del servidor)
        errorMessage = 'No se pudo conectar al servidor. Verifica que el backend esté corriendo.';
      } else {
        // Otro tipo de error
        errorMessage = err.message || (isRegister ? 'Error al registrarse' : 'Error al iniciar sesión');
      }
      
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 20,
      alignItems: 'center',
    },
    card: {
      padding: 24,
      width: Platform.OS === 'web' ? '100%' : '100%',
      maxWidth: Platform.OS === 'web' ? 450 : undefined,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 24,
      textAlign: 'center',
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      backgroundColor: colors.inputBackground,
      color: colors.text,
      marginBottom: 16,
    },
    inputError: {
      borderColor: colors.danger,
    },
    fieldError: {
      color: colors.danger,
      fontSize: 12,
      marginTop: -12,
      marginBottom: 12,
    },
    errorContainer: {
      backgroundColor: colors.danger + '20',
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
    },
    errorText: {
      color: colors.danger,
      fontSize: 14,
      textAlign: 'center',
    },
    button: {
      marginTop: 8,
      marginBottom: 16,
    },
    switchButton: {
      marginTop: 8,
    },
  });

  // Esperar a que termine de cargar la autenticación
  if (authLoading) {
    return (
      <View style={dynamicStyles.container}>
        <Loading />
      </View>
    );
  }

  // Si ya está autenticado, mostrar loading mientras redirige
  if (isAuthenticated) {
    return (
      <View style={dynamicStyles.container}>
        <Loading />
      </View>
    );
  }

  // Si llegamos aquí, NO está autenticado, mostrar el formulario
  return (
    <KeyboardAvoidingView 
      style={dynamicStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={dynamicStyles.scrollContent}>
        <Card style={dynamicStyles.card}>
          <Text style={dynamicStyles.title}>
            {isRegister ? 'Registrarse' : 'Iniciar Sesión'}
          </Text>

          {error ? (
            <View style={dynamicStyles.errorContainer}>
              <Text style={dynamicStyles.errorText}>{error}</Text>
            </View>
          ) : null}

          {isRegister && (
            <>
              <View>
                <TextInput
                  style={[dynamicStyles.input, fieldErrors.firstName && dynamicStyles.inputError]}
                  placeholder="Nombre"
                  placeholderTextColor={colors.textSecondary}
                  value={firstName}
                  onChangeText={(text) => {
                    setFirstName(text);
                    if (fieldErrors.firstName) {
                      setFieldErrors({ ...fieldErrors, firstName: '' });
                    }
                  }}
                  autoCapitalize="words"
                />
                {fieldErrors.firstName && (
                  <Text style={dynamicStyles.fieldError}>{fieldErrors.firstName}</Text>
                )}
              </View>
              <View>
                <TextInput
                  style={[dynamicStyles.input, fieldErrors.lastName && dynamicStyles.inputError]}
                  placeholder="Apellido"
                  placeholderTextColor={colors.textSecondary}
                  value={lastName}
                  onChangeText={(text) => {
                    setLastName(text);
                    if (fieldErrors.lastName) {
                      setFieldErrors({ ...fieldErrors, lastName: '' });
                    }
                  }}
                  autoCapitalize="words"
                />
                {fieldErrors.lastName && (
                  <Text style={dynamicStyles.fieldError}>{fieldErrors.lastName}</Text>
                )}
              </View>
            </>
          )}

          <View>
            <TextInput
              style={[dynamicStyles.input, fieldErrors.email && dynamicStyles.inputError]}
              placeholder="Email"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (fieldErrors.email) {
                  setFieldErrors({ ...fieldErrors, email: '' });
                }
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {fieldErrors.email && (
              <Text style={dynamicStyles.fieldError}>{fieldErrors.email}</Text>
            )}
          </View>

          <View>
            <TextInput
              style={[dynamicStyles.input, fieldErrors.password && dynamicStyles.inputError]}
              placeholder="Contraseña"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (fieldErrors.password) {
                  setFieldErrors({ ...fieldErrors, password: '' });
                }
              }}
              secureTextEntry
              autoCapitalize="none"
            />
            {fieldErrors.password && (
              <Text style={dynamicStyles.fieldError}>{fieldErrors.password}</Text>
            )}
          </View>

          {loading ? (
            <Loading />
          ) : (
            <Button variant="primary" onPress={handleSubmit} style={dynamicStyles.button}>
              {isRegister ? 'Registrarse' : 'Iniciar Sesión'}
            </Button>
          )}

          <Button
            variant="secondary"
            onPress={() => {
              setIsRegister(!isRegister);
              setError('');
              setFieldErrors({});
              setEmail('');
              setPassword('');
              setFirstName('');
              setLastName('');
            }}
            style={dynamicStyles.switchButton}
          >
            {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
          </Button>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}


