import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Alert, ScrollView } from 'react-native';
import Button from '../Button/Button';
import Card from '../Card/Card';
import { vendorService } from '../../services';
import type { Vendor } from '../../types';
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
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Método de Pago</Text>
            <Text style={styles.total}>Total a pagar: S/ {total.toFixed(2)}</Text>

            {loadingVendor ? (
              <Text style={styles.loadingText}>Cargando información de pago...</Text>
            ) : (
              <>
                <View style={styles.methodsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.methodOption,
                      selectedMethod === 'YAPE' && styles.methodOptionSelected,
                    ]}
                    onPress={() => handleMethodSelect('YAPE')}
                  >
                    <Text style={styles.methodIcon}>💚</Text>
                    <Text
                      style={[
                        styles.methodText,
                        selectedMethod === 'YAPE' && styles.methodTextSelected,
                      ]}
                    >
                      Yape
                    </Text>
                  </TouchableOpacity>
                </View>

                {selectedMethod && (
                  <View style={styles.infoBox}>
                    <Text style={styles.infoText}>
                      El pago se procesará a través de Mercado Pago usando Yape.{'\n\n'}
                      Necesitarás ingresar:{'\n'}
                      • Tu número de celular (el que tienes asociado a tu cuenta Yape){'\n'}
                      • El código OTP de 6 dígitos que aparece en tu app Yape
                    </Text>
                  </View>
                )}
              </>
            )}

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
          </ScrollView>
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
  } as const,
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#524E4E',
    marginBottom: 8,
    textAlign: 'center',
  } as const,
  total: {
    fontSize: 18,
    fontWeight: '600',
    color: '#524E4E',
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
    borderColor: '#E0E0E0',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  } as const,
  methodOptionSelected: {
    borderColor: '#BEE0E7',
    backgroundColor: '#F0F9FA',
  } as const,
  methodIcon: {
    fontSize: 40,
    marginBottom: 8,
  } as const,
  methodText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#524E4E',
  } as const,
  methodTextSelected: {
    color: '#BEE0E7',
  } as const,
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
    flex: 1,
  } as const,
  loadingText: {
    fontSize: 14,
    color: '#524E4E',
    textAlign: 'center',
    marginVertical: 20,
  } as const,
  infoBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BEE0E7',
  } as const,
  infoText: {
    fontSize: 13,
    color: '#524E4E',
    lineHeight: 18,
    textAlign: 'center',
  } as const,
});

export default PaymentModal;
