import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Modal, TextInput, TouchableOpacity, RefreshControl, KeyboardAvoidingView, Platform } from 'react-native';
import { vendorService } from '../../services';
import { useTheme } from '../../context';
import type { Vendor } from '../../types';
import { Button, Loading, Card } from '../../components';

/**
 * Pantalla de gestión de vendors (puestos de comida) para administradores
 * Permite crear, ver, editar y eliminar vendors
 */
export default function GestionarVendorsScreen() {
  const { colors, isDark } = useTheme();
  // Estados principales
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Estados del modal
  const [modalVisible, setModalVisible] = useState(false);
  const [vendorEditando, setVendorEditando] = useState<Vendor | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    ubication: '',
    openingTime: '',
    closingTime: '',
  });

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarVendors();
  }, []);

  /**
   * Carga la lista de vendors desde el backend
   */
  const cargarVendors = async () => {
    try {
      setLoading(true);
      const response = await vendorService.getAll();
      
      if (!response || !response.data) {
        throw new Error('Respuesta inválida del servidor: sin data');
      }
      
      if (!Array.isArray(response.data)) {
        throw new Error('Respuesta inválida del servidor: data no es un array');
      }
      
      setVendors(response.data);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error ||
                          error.message || 
                          'Error desconocido al cargar vendors';
      Alert.alert('Error', `No se pudieron cargar los vendors: ${errorMessage}`);
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Maneja el pull-to-refresh
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await cargarVendors();
    } catch (error) {
      // Error silencioso en refresh
    } finally {
      setRefreshing(false);
    }
  }, []);

  /**
   * Abre el modal para crear o editar un vendor
   */
  const abrirModal = (vendor?: Vendor) => {
    if (vendor) {
      // Modo edición
      setVendorEditando(vendor);
      setFormData({
        name: vendor.name || '',
        ubication: vendor.ubication || '',
        openingTime: vendor.openingTime || '',
        closingTime: vendor.closingTime || '',
      });
    } else {
      // Modo creación
      setVendorEditando(null);
      setFormData({
        name: '',
        ubication: '',
        openingTime: '',
        closingTime: '',
      });
    }
    setModalVisible(true);
  };

  /**
   * Cierra el modal y resetea los estados
   */
  const cerrarModal = () => {
    setModalVisible(false);
    setVendorEditando(null);
    setFormData({
      name: '',
      ubication: '',
      openingTime: '',
      closingTime: '',
    });
  };


  /**
   * Guarda los cambios del vendor
   */
  const handleGuardar = async () => {
    // Validar campos
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Por favor ingresa el nombre del vendor');
      return;
    }

    try {
      setSaving(true);

      // Validar formato de horarios (HH:mm)
      const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
      if (formData.openingTime && !timeRegex.test(formData.openingTime)) {
        Alert.alert('Error', 'El formato de hora de apertura es inválido. Use el formato HH:mm (ej: 08:00, 17:30)');
        return;
      }
      if (formData.closingTime && !timeRegex.test(formData.closingTime)) {
        Alert.alert('Error', 'El formato de hora de cierre es inválido. Use el formato HH:mm (ej: 08:00, 17:30)');
        return;
      }

      const vendorData = {
        name: formData.name.trim(),
        ubication: formData.ubication?.trim() || undefined,
        openingTime: formData.openingTime?.trim() || undefined,
        closingTime: formData.closingTime?.trim() || undefined,
      };

      let savedVendor: Vendor;
      if (vendorEditando) {
        const response = await vendorService.update(vendorEditando.id!, vendorData);
        savedVendor = response.data;
        Alert.alert('Éxito', 'Vendor actualizado correctamente');
      } else {
        const response = await vendorService.create(vendorData);
        savedVendor = response.data;
        Alert.alert('Éxito', 'Vendor creado correctamente');
      }
      
      await cargarVendors();
      cerrarModal();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error ||
                          error.message || 
                          'No se pudo guardar el vendor';
      
      Alert.alert('Error', `No se pudo guardar el vendor: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Elimina un vendor
   */
  const handleEliminar = async (vendor: Vendor) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de que deseas eliminar el vendor "${vendor.name}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await vendorService.delete(vendor.id!);
              Alert.alert('Éxito', 'Vendor eliminado correctamente');
              await cargarVendors();
            } catch (error: any) {
              const errorMessage = error.response?.data?.message || 
                                  error.response?.data?.error ||
                                  error.message || 
                                  'No se pudo eliminar el vendor';
              Alert.alert('Error', errorMessage);
            }
          },
        },
      ]
    );
  };

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
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      opacity: 0.7,
    },
    actionsContainer: {
      padding: 16,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    addButton: {
      minWidth: 150,
    },
    emptyContainer: {
      padding: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyIcon: {
      fontSize: 48,
      marginBottom: 16,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptySubtext: {
      fontSize: 14,
      color: colors.textSecondary,
      opacity: 0.7,
      marginBottom: 16,
      textAlign: 'center',
    },
    refreshButton: {
      marginTop: 8,
    },
    vendorsContainer: {
      padding: 16,
    },
    vendorCard: {
      marginBottom: 16,
    },
    vendorHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    vendorInfo: {
      flex: 1,
    },
    vendorName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    vendorUbication: {
      fontSize: 14,
      color: colors.textSecondary,
      opacity: 0.7,
      marginBottom: 4,
    },
    vendorSchedule: {
      fontSize: 14,
      color: colors.textSecondary,
      opacity: 0.7,
      marginTop: 4,
    },
    vendorActions: {
      flexDirection: 'row',
      gap: 8,
    },
    editButton: {
      flex: 1,
    },
    deleteButton: {
      flex: 1,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(0, 0, 0, 0.4)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    keyboardAvoidingView: {
      width: '100%',
      maxWidth: 500,
      maxHeight: '90%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: '100%',
      maxWidth: 500,
      padding: 24,
      maxHeight: '90%',
      alignSelf: 'center',
    },
    modalScrollView: {
      maxHeight: 400,
    },
    modalScrollContent: {
      paddingBottom: 10,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      color: colors.text,
      marginBottom: 8,
      fontWeight: '600',
    },
    hint: {
      fontSize: 12,
      color: colors.textSecondary,
      opacity: 0.6,
      marginTop: 4,
      marginBottom: 16,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
      fontSize: 16,
      backgroundColor: isDark ? '#2D2D2D' : colors.inputBackground,
      color: isDark ? '#FFFFFF' : colors.text,
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 20,
      gap: 12,
    },
    modalButton: {
      flex: 1,
    },
  });

  // Mostrar loading mientras se cargan los datos iniciales
  if (loading) {
    return <Loading />;
  }

  return (
    <ScrollView 
      style={dynamicStyles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.title}>Gestionar Vendors</Text>
        <Text style={dynamicStyles.subtitle}>
          {vendors.length} {vendors.length === 1 ? 'vendor' : 'vendors'} registrado{vendors.length === 1 ? '' : 's'}
        </Text>
      </View>

      <View style={dynamicStyles.actionsContainer}>
        <Button
          variant="primary"
          onPress={() => abrirModal()}
          style={dynamicStyles.addButton}
          disabled={saving}
        >
          Agregar Vendor
        </Button>
      </View>

      {vendors.length === 0 ? (
        <View style={dynamicStyles.emptyContainer}>
          <Text style={dynamicStyles.emptyIcon}>🏪</Text>
          <Text style={dynamicStyles.emptyText}>No hay vendors registrados</Text>
          <Text style={dynamicStyles.emptySubtext}>
            Crea un vendor para poder asignar el rol VENDOR a usuarios
          </Text>
          <Button
            variant="secondary"
            onPress={cargarVendors}
            style={dynamicStyles.refreshButton}
          >
            Recargar
          </Button>
        </View>
      ) : (
        <View style={dynamicStyles.vendorsContainer}>
          {vendors.map((vendor) => (
            <Card key={vendor.id} style={dynamicStyles.vendorCard}>
              <View style={dynamicStyles.vendorHeader}>
                <View style={dynamicStyles.vendorInfo}>
                  <Text style={dynamicStyles.vendorName}>{vendor.name}</Text>
                  {vendor.ubication && (
                    <Text style={dynamicStyles.vendorUbication}>📍 {vendor.ubication}</Text>
                  )}
                  {(vendor.openingTime || vendor.closingTime) && (
                    <Text style={dynamicStyles.vendorSchedule}>
                      🕐 {vendor.openingTime || '--:--'} - {vendor.closingTime || '--:--'}
                    </Text>
                  )}
                </View>
              </View>
              <View style={dynamicStyles.vendorActions}>
                <Button
                  variant="secondary"
                  onPress={() => abrirModal(vendor)}
                  style={dynamicStyles.editButton}
                  disabled={saving}
                >
                  Editar
                </Button>
                <Button
                  variant="danger"
                  onPress={() => handleEliminar(vendor)}
                  style={dynamicStyles.deleteButton}
                  disabled={saving}
                >
                  Eliminar
                </Button>
              </View>
            </Card>
          ))}
        </View>
      )}

      {/* Modal para crear/editar vendor */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={cerrarModal}
      >
        <View style={dynamicStyles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={dynamicStyles.keyboardAvoidingView}
          >
            <Card style={dynamicStyles.modalContent}>
              <Text style={dynamicStyles.modalTitle}>
                {vendorEditando ? 'Editar Vendor' : 'Nuevo Vendor'}
              </Text>

              <ScrollView 
                style={dynamicStyles.modalScrollView}
                contentContainerStyle={dynamicStyles.modalScrollContent}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={dynamicStyles.label}>Nombre del Vendor *</Text>
                <TextInput
                  style={dynamicStyles.input}
                  placeholder="Ej: Puesto de Comida 1"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  editable={!saving}
                />

                <Text style={dynamicStyles.label}>Ubicación (Opcional)</Text>
                <TextInput
                  style={dynamicStyles.input}
                  placeholder="Ej: Campus UTEC, Pabellón A"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.ubication}
                  onChangeText={(text) => setFormData({ ...formData, ubication: text })}
                  editable={!saving}
                />

                <Text style={dynamicStyles.label}>Hora de Apertura (Opcional)</Text>
                <TextInput
                  style={dynamicStyles.input}
                  placeholder="08:00"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.openingTime}
                  onChangeText={(text) => setFormData({ ...formData, openingTime: text })}
                  keyboardType="default"
                  maxLength={5}
                  editable={!saving}
                />
                <Text style={dynamicStyles.hint}>Formato: HH:mm (ej: 08:00, 17:30)</Text>

                <Text style={dynamicStyles.label}>Hora de Cierre (Opcional)</Text>
                <TextInput
                  style={dynamicStyles.input}
                  placeholder="17:00"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.closingTime}
                  onChangeText={(text) => setFormData({ ...formData, closingTime: text })}
                  keyboardType="default"
                  maxLength={5}
                  editable={!saving}
                />
                <Text style={dynamicStyles.hint}>Formato: HH:mm (ej: 08:00, 17:30). Debe ser posterior a la hora de apertura.</Text>
              </ScrollView>

              <View style={dynamicStyles.modalActions}>
                <Button 
                  variant="secondary" 
                  onPress={cerrarModal} 
                  style={dynamicStyles.modalButton}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button 
                  variant="primary" 
                  onPress={handleGuardar} 
                  style={dynamicStyles.modalButton}
                  loading={saving}
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </Button>
              </View>
            </Card>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </ScrollView>
  );
}

// Estilos estáticos eliminados - se usan dynamicStyles

