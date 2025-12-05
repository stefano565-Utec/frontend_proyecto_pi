import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TextInput, KeyboardAvoidingView, Platform, Linking, Image, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { paymentService } from '../../services';
import { useAuth, useTheme } from '../../context';
import { Button, Loading, Card } from '../../components';

export default function PagoYapeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { colors } = useTheme();
  const orderId = params.orderId ? parseInt(params.orderId as string) : null;
  const total = params.total ? parseFloat(params.total as string) : 0;

  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatingToken, setGeneratingToken] = useState(false);

  const handleGenerateToken = async (phone: string, otpCode: string) => {
    try {
      setGeneratingToken(true);
      const response = await paymentService.generateYapeToken(phone, otpCode);
      return typeof response.data === 'string' ? response.data : String(response.data);
    } catch (error: any) {
      let errorMessage = 'Error al generar token Yape';
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 400) {
          errorMessage = data?.message || data?.error || 'Datos inválidos. Verifica tu número de celular y código OTP.';
        } else {
          errorMessage = data?.message || data?.error || `Error ${status}`;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
      throw error;
    } finally {
      setGeneratingToken(false);
    }
  };

  const handlePay = async () => {
    if (!orderId) {
      Alert.alert('Error', 'No se encontró el ID del pedido');
      return;
    }

    if (!phoneNumber.trim() || !otp.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    const phoneDigits = phoneNumber.trim().replace(/\D/g, '');
    if (phoneDigits.length < 9 || phoneDigits.length > 15) {
      Alert.alert('Error', 'El número de celular debe tener entre 9 y 15 dígitos');
      return;
    }

    const otpDigits = otp.trim().replace(/\D/g, '');
    if (otpDigits.length !== 6) {
      Alert.alert('Error', 'El código OTP debe tener exactamente 6 dígitos');
      return;
    }

    try {
      setLoading(true);

      const phoneDigits = phoneNumber.trim().replace(/\D/g, '');
      const otpDigits = otp.trim().replace(/\D/g, '');

      const token = await handleGenerateToken(phoneDigits, otpDigits);
      const paymentResponse = await paymentService.createYapePayment(orderId, token, user?.email || '');

      // Debug log (temporary)
      console.log('[PagoYape] paymentResponse:', paymentResponse?.data);

      const resp = paymentResponse?.data;
      // If backend returns a payment URL, open it so user completes the payment
      if (resp?.paymentUrl) {
        const url = resp.paymentUrl;
        // On web and native, open the URL
        try {
          await Linking.openURL(url);
          // After opening payment URL, navigate user to Mis Pedidos to wait for confirmation
          Alert.alert('Pago', 'Se abrió la ventana de pago. Completa el pago en la plataforma externa.');
          router.replace('/(tabs)/mis-pedidos');
          return;
        } catch (linkErr) {
          console.warn('[PagoYape] error opening payment URL', linkErr);
        }
      }

      // If backend returns a QR code (base64 or URL), show it so user can scan
      if (resp?.qrCode) {
        // Simple handling: open as data URL if starts with data:, otherwise open link
        const qr = resp.qrCode;
        if (qr.startsWith('data:') || qr.startsWith('http')) {
          try {
            await Linking.openURL(qr);
            Alert.alert('Pago', 'Se abrió el QR de pago. Escanéalo para completar el pago.');
            router.replace('/(tabs)/mis-pedidos');
            return;
          } catch (e) {
            console.warn('[PagoYape] error opening QR', e);
          }
        }
      }

      // If backend explicitly returns an approval indicator, honor it
      if (resp && (((resp as any).status === 'approved') || ((resp as any).paymentStatus === 'approved') || ((resp as any).approved === true))) {
        Alert.alert('Pago Exitoso', 'Tu pago ha sido procesado correctamente.', [{ text: 'OK', onPress: () => router.replace('/(tabs)/mis-pedidos') }]);
        return;
      }

      // If none of the above, show a safe message with returned payload for debugging
      Alert.alert('Pago', 'Respuesta recibida del servidor. Revisa "Mis Pedidos" para verificar el estado.', [{ text: 'OK', onPress: () => router.replace('/(tabs)/mis-pedidos') }]);

    } catch (error: any) {
      let errorMessage = 'Error al procesar el pago';
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data && typeof data === 'object') {
          errorMessage = data.message || data.error || data.errorMessage || JSON.stringify(data);
        } else if (status === 400) {
          errorMessage = 'Datos inválidos. Verifica tu número de celular y código OTP.';
        } else if (status === 401) {
          errorMessage = 'Error de autenticación con Mercado Pago';
        } else if (status === 500) {
          errorMessage = 'Error del servidor. Por favor intenta nuevamente.';
        } else {
          errorMessage = `Error ${status}: ${JSON.stringify(data)}`;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
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
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 20,
    },
    header: {
      padding: 20,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    card: {
      margin: 20,
      padding: 24,
    },
    instructionsTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 12,
    },
    instructionsText: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 24,
    },
    inputContainer: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
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
    hint: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
    },
    confirmButton: {
      marginTop: 8,
      marginBottom: 12,
    },
    backButton: {
      marginTop: 8,
    },
  });

  return (
    <KeyboardAvoidingView
      style={dynamicStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView style={dynamicStyles.scrollView} contentContainerStyle={dynamicStyles.scrollContent}>
        <View style={dynamicStyles.header}>
          <Text style={dynamicStyles.title}>Pago con Yape</Text>
          <Text style={dynamicStyles.subtitle}>Total a pagar: S/ {total.toFixed(2)}</Text>
        </View>

        <Card style={dynamicStyles.card}>
          <Text style={dynamicStyles.instructionsTitle}>Ingresa tus datos de Yape</Text>
          <Text style={dynamicStyles.instructionsText}>
            Para completar el pago, necesitamos tu número de celular asociado a Yape y el código OTP de 6 dígitos que aparece en tu app Yape.
          </Text>

          <View style={dynamicStyles.inputContainer}>
            <Text style={dynamicStyles.label}>Número de Celular Yape *</Text>
            <TextInput
              style={dynamicStyles.input}
              placeholder="Ej: 987654321"
              placeholderTextColor={colors.textSecondary}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              maxLength={15}
              editable={!loading && !generatingToken}
            />
            <Text style={dynamicStyles.hint}>Ingresa el número asociado a tu cuenta Yape.</Text>
          </View>

          <View style={dynamicStyles.inputContainer}>
            <Text style={dynamicStyles.label}>Código OTP de Yape *</Text>
            <TextInput
              style={dynamicStyles.input}
              placeholder="Ej: 123456"
              placeholderTextColor={colors.textSecondary}
              value={otp}
              onChangeText={setOtp}
              keyboardType="numeric"
              maxLength={6}
              editable={!loading && !generatingToken}
            />
            <Text style={dynamicStyles.hint}>Encuentra este código de 6 dígitos en tu app Yape.</Text>
          </View>

          <Button
            variant="primary"
            onPress={handlePay}
            style={dynamicStyles.confirmButton}
            loading={loading || generatingToken}
            disabled={loading || generatingToken || !phoneNumber.trim() || !otp.trim()}
          >
            {loading || generatingToken ? 'Procesando Pago...' : 'Confirmar Pago'}
          </Button>

          <Button
            variant="secondary"
            onPress={() => router.replace('/(tabs)/mis-pedidos')}
            style={dynamicStyles.backButton}
            disabled={loading || generatingToken}
          >
            Volver a Mis Pedidos
          </Button>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
