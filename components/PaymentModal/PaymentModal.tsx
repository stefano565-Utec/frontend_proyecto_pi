import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Alert, ScrollView, Image } from 'react-native';
import Button from '../Button/Button';
import Card from '../Card/Card';
import { vendorService } from '../../services';
import type { Vendor } from '../../types';
import { useTheme } from '../../context';
import './PaymentModal.css';

interface PaymentModalProps {
  visible: boolean;
  total: number;
  vendorId: number;
  orderId?: number;
  onClose: () => void;
  onConfirm: (paymentMethod: string) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ visible, total, vendorId, orderId, onClose, onConfirm }) => {
  const [selectedMethod, setSelectedMethod] = useState<'YAPE' | null>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loadingVendor, setLoadingVendor] = useState(false);
  const { colors, isDark } = useTheme();

  // Cargar información del vendor cuando se abre el modal
  useEffect(() => {
    if (visible && vendorId) {
      loadVendor();
    } else {
      setVendor(null);
      setSelectedMethod(null);
    }
  }, [visible, vendorId]);

  const loadVendor = async () => {
    try {
      setLoadingVendor(true);
      const response = await vendorService.getById(vendorId);
      setVendor(response.data);
    } catch (error) {
      // Error silencioso al cargar vendor
    } finally {
      setLoadingVendor(false);
    }
  };

  const handleMethodSelect = (method: 'YAPE') => {
    setSelectedMethod(method);
  };

  const handleConfirm = () => {
    if (!selectedMethod) {
      Alert.alert('Error', 'Por favor selecciona un método de pago');
      return;
    }

    // Con Mercado Pago, no necesitamos validar el número del vendor
    // El pago se procesa directamente desde la cuenta Yape del comprador
    onConfirm(selectedMethod);
    // Reset
    setSelectedMethod(null);
  };

  const handleClose = () => {
    setSelectedMethod(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <Card style={styles.modalContent}>
          <ScrollView style={styles.scrollView} contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
            <Text style={[styles.title, { color: colors.text }]}>Método de Pago</Text>
            <Text style={[styles.total, { color: colors.text }]}>Total a pagar: S/ {total.toFixed(2)}</Text>

            {loadingVendor ? (
              <Text style={styles.loadingText}>Cargando información de pago...</Text>
            ) : (
              <>
                <View style={styles.methodsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.methodOption,
                      // Estilos base (sin seleccionar)
                      { 
                        backgroundColor: colors.cardBackground, 
                        borderColor: colors.border 
                      },
                      
                      // ESTILOS CUANDO ESTÁ SELECCIONADO (FIX PARA MODO OSCURO)
                      selectedMethod === 'YAPE' && {
                        // Borde: En claro usamos el morado oficial (#742384). 
                        // En oscuro usamos un lila más claro (#D68CE6) para que brille y destaque.
                        borderColor: isDark ? '#D68CE6' : '#742384',
                        
                        // Fondo: En claro un lila muy suave.
                        // En oscuro, un morado muy transparente para que no choque con el fondo gris.
                        backgroundColor: isDark ? 'rgba(116, 35, 132, 0.15)' : '#F3E5F5',
                      }
                    ]}
                    onPress={() => handleMethodSelect('YAPE')}
                  >
                    {/* LOGO */}
                    <Image 
                      source={require('../../assets/images/logo-yape.png')}
                      style={[
                        styles.methodLogo,
                        // En modo oscuro, le ponemos un fondo blanco redondeado al logo
                        // para que resalte y no parezca un "sticker" pegado.
                      ]}
                      resizeMode="contain"
                    />

                    {/* TEXTO */}
                    <Text
                      style={[
                        styles.methodText,
                        {
                          // LÓGICA DE COLOR DE TEXTO:
                          color: selectedMethod === 'YAPE'
                            // Si está seleccionado: Blanco puro en oscuro (máximo contraste), Morado en claro.
                            ? (isDark ? '#FFFFFF' : '#742384')
                            // Si NO está seleccionado: El color de texto normal del tema.
                            : colors.text
                        }
                      ]}
                    >
                      Yape
                    </Text>
                  </TouchableOpacity>
                </View>

                {selectedMethod && (
                  <View style={[styles.infoBox, { backgroundColor: colors.filterChipBackground, borderColor: colors.filterChipActive }] }>
                    <Text style={[styles.infoText, { color: colors.text }] }>
                      El pago se procesará a través de Mercado Pago usando Yape.{'\n\n'}
                      Necesitarás ingresar:{'\n'}
                      • Tu número de celular (el que tienes asociado a tu cuenta Yape){'\n'}
                      • El código OTP de 6 dígitos que aparece en tu app Yape
                    </Text>
                  </View>
                )}
              </>
            )}

          </ScrollView>

          <View style={styles.actions}>
            <Button variant="secondary" onPress={handleClose} style={styles.button}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onPress={handleConfirm}
              style={styles.button}
              disabled={!selectedMethod}
            >
              Continuar
            </Button>
          </View>
        </Card>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  } as const,
  modalContent: {
    width: '90%',
    maxWidth: 400,
    padding: 24,
    maxHeight: '80%',
  } as const,
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  } as const,
  total: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  } as const,
  methodsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  } as const,
  methodOption: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  } as const,
  methodOptionSelected: {} as const,
  methodLogo: {
    width: 60,   
    height: 60,
    marginBottom: 8,
  } as const,
  methodText: {
    fontSize: 16,
    fontWeight: '600',
  } as const,
  methodTextSelected: {} as const,
  methodOptionDisabled: {
    opacity: 0.5,
  } as const,
  methodTextDisabled: {
    opacity: 0.5,
  } as const,
  methodUnavailable: {
    fontSize: 10,
    color: '#FF6B6B',
    marginTop: 4,
  } as const,
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  } as const,
  button: {
    flex: 1,
  } as const,
  scrollView: {
    flexGrow: 1,
  } as const,
  loadingText: {
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 20,
  } as const,
  infoBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  } as const,
  infoText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  } as const,
});

export default PaymentModal;
