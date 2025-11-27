import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Modal, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { userService, vendorService } from '../../services';
import { useTheme } from '../../context';
import type { User, Vendor } from '../../types';
import { Button, Loading, Card } from '../../components';

/**
 * Pantalla de gestión de usuarios para administradores
 * Permite ver y modificar roles de usuarios
 */
export default function GestionarUsuariosScreen() {
  const { colors, isDark } = useTheme();
  // Estados principales
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Estados del modal
  const [modalVisible, setModalVisible] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<User | null>(null);
  const [rolSeleccionado, setRolSeleccionado] = useState<string>('USER');
  const [vendorSeleccionado, setVendorSeleccionado] = useState<number | null>(null);
  
  // Estado del modal de confirmación
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<{ rol: string; vendorId: number | null } | null>(null);

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarDatos();
  }, []);

  /**
   * Carga usuarios y vendors en paralelo
   */
  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([cargarUsuarios(), cargarVendors()]);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los datos. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Carga la lista de usuarios desde el backend
   */
  const cargarUsuarios = async () => {
    try {
      const response = await userService.getAll();
      
      if (!response || !response.data) {
        throw new Error('Respuesta inválida del servidor: sin data');
      }
      
      if (!Array.isArray(response.data)) {
        throw new Error('Respuesta inválida del servidor: data no es un array');
      }
      
      setUsuarios(response.data);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error ||
                          error.message || 
                          'Error desconocido al cargar usuarios';
      Alert.alert('Error', `No se pudieron cargar los usuarios: ${errorMessage}`);
      setUsuarios([]);
    }
  };

  /**
   * Carga la lista de vendors desde el backend
   */
  const cargarVendors = async () => {
    try {
      const response = await vendorService.getAll();
      setVendors(response.data || []);
    } catch (error: any) {
      setVendors([]);
    }
  };

  /**
   * Maneja el pull-to-refresh
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([cargarUsuarios(), cargarVendors()]);
    } catch (error) {
      // Error silencioso en refresh
    } finally {
      setRefreshing(false);
    }
  }, []);

  /**
   * Abre el modal para editar el rol de un usuario
   * Valida que el usuario tenga ID y carga vendors si es necesario
   */
  const abrirModal = async (usuario: User) => {
    if (!usuario || !usuario.id) {
      Alert.alert('Error', 'Usuario inválido');
      return;
    }

    try {
      if (vendors.length === 0) {
        await cargarVendors();
      }

      setUsuarioEditando(usuario);
      
      const currentRole = (usuario.role || 'USER').toUpperCase();
      setRolSeleccionado(currentRole);

      if (currentRole === 'VENDOR' && usuario.vendorId) {
        setVendorSeleccionado(usuario.vendorId);
      } else {
        setVendorSeleccionado(null);
      }

      setModalVisible(true);
    } catch (error) {
      Alert.alert('Error', 'No se pudo abrir el modal de edición');
    }
  };

  /**
   * Cierra el modal y resetea los estados
   */
  const cerrarModal = () => {
    setModalVisible(false);
    setUsuarioEditando(null);
    setRolSeleccionado('USER');
    setVendorSeleccionado(null);
  };

  /**
   * Guarda los cambios del rol del usuario
   * Incluye validaciones exhaustivas
   */
  const handleGuardar = async () => {
    if (!usuarioEditando || !usuarioEditando.id) {
      Alert.alert('Error', 'No se pudo identificar el usuario');
      return;
    }

    if (!rolSeleccionado || rolSeleccionado.trim() === '') {
      Alert.alert('Error', 'Debes seleccionar un rol');
      return;
    }

    const rolNormalizado = rolSeleccionado.toUpperCase().trim();
    
    if (!['ADMIN', 'USER', 'VENDOR'].includes(rolNormalizado)) {
      Alert.alert('Error', 'Rol inválido');
      return;
    }

    let vendorIdToSend: number | null = null;
    if (rolNormalizado === 'VENDOR' && vendorSeleccionado && vendorSeleccionado !== 0) {
      const vendorExiste = vendors.find(v => v.id === vendorSeleccionado);
      if (!vendorExiste) {
        Alert.alert('Error', 'El vendor seleccionado no es válido');
        return;
      }
      vendorIdToSend = vendorSeleccionado;
    }

    const rolActual = usuarioEditando.role?.toUpperCase() || 'USER';
    
    if (rolActual !== rolNormalizado) {
      setPendingUpdate({ rol: rolNormalizado, vendorId: vendorIdToSend });
      setConfirmModalVisible(true);
    } else {
      realizarActualizacion(rolNormalizado, vendorIdToSend);
    }
  };

  /**
   * Maneja la confirmación del cambio de rol
   */
  const handleConfirmarCambio = () => {
    if (pendingUpdate && usuarioEditando?.id) {
      setConfirmModalVisible(false);
      realizarActualizacion(pendingUpdate.rol, pendingUpdate.vendorId);
      setPendingUpdate(null);
    }
  };

  const handleCancelarCambio = () => {
    setConfirmModalVisible(false);
    setPendingUpdate(null);
  };

  /**
   * Realiza la actualización del rol en el backend
   */
  const realizarActualizacion = async (rolNormalizado: string, vendorIdToSend: number | null) => {
    if (!usuarioEditando?.id) {
      return;
    }

    try {
      setSaving(true);

      const response = await userService.updateRole(
        usuarioEditando.id,
        rolNormalizado,
        vendorIdToSend
      );

      // Mensaje de éxito personalizado
      let mensajeExito = `Rol ${rolNormalizado} asignado correctamente`;
      if (rolNormalizado === 'VENDOR') {
        if (vendorIdToSend) {
          const vendor = vendors.find(v => v.id === vendorIdToSend);
          mensajeExito = `Rol VENDOR asignado y asociado al vendor "${vendor?.name || 'N/A'}"`;
        } else {
          mensajeExito = 'Rol VENDOR asignado correctamente (sin vendor asociado)';
        }
      }

      Alert.alert('Éxito', mensajeExito);
      cerrarModal();
      
      await cargarUsuarios();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error ||
                          error.message || 
                          'No se pudo actualizar el rol';
      
      Alert.alert('Error', `No se pudo actualizar el rol: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Obtiene el color del badge según el rol
   */
  const getRolColor = (role: string | undefined): string => {
    const roleUpper = (role || 'USER').toUpperCase();
    switch (roleUpper) {
      case 'ADMIN':
        return '#FF6B6B';
      case 'VENDOR':
        return '#BEE0E7';
      case 'USER':
        return '#E0E0E0';
      default:
        return '#E0E0E0';
    }
  };

  /**
   * Obtiene el nombre del vendor si existe
   */
  const getVendorName = (vendorId: number | undefined): string => {
    if (!vendorId) return '';
    const vendor = vendors.find(v => v.id === vendorId);
    return vendor?.name || '';
  };

  /**
   * Filtra usuarios según la búsqueda
   */
  const usuariosFiltrados = useMemo(() => {
    if (!searchQuery.trim()) {
      return usuarios;
    }

    const query = searchQuery.toLowerCase().trim();
    return usuarios.filter(usuario => {
      const nombreCompleto = `${usuario.firstName} ${usuario.lastName}`.toLowerCase();
      const email = (usuario.email || '').toLowerCase();
      const rol = (usuario.role || '').toLowerCase();
      const vendorName = getVendorName(usuario.vendorId).toLowerCase();

      return (
        nombreCompleto.includes(query) ||
        email.includes(query) ||
        rol.includes(query) ||
        vendorName.includes(query)
      );
    });
  }, [usuarios, searchQuery, vendors]);

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
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      opacity: 0.7,
    },
    usuariosContainer: {
      padding: 16,
    },
    usuarioCard: {
      marginBottom: 16,
    },
    usuarioHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    usuarioInfo: {
      flex: 1,
      marginRight: 12,
    },
    usuarioName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    usuarioEmail: {
      fontSize: 14,
      color: colors.textSecondary,
      opacity: 0.7,
      marginBottom: 4,
    },
    vendorInfo: {
      fontSize: 12,
      color: colors.textSecondary,
      opacity: 0.6,
      marginTop: 4,
    },
    rolBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      minWidth: 70,
      alignItems: 'center',
    },
    rolText: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    editButton: {
      marginTop: 8,
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
      fontSize: 16,
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
    searchContainer: {
      padding: 16,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
    },
    searchInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      backgroundColor: isDark ? '#2D2D2D' : colors.inputBackground,
      color: isDark ? '#FFFFFF' : colors.text,
    },
    clearButton: {
      marginLeft: 8,
      padding: 8,
    },
    clearButtonText: {
      fontSize: 18,
      color: colors.textSecondary,
      fontWeight: 'bold',
    },
    searchResultsContainer: {
      padding: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    searchResultsText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(0, 0, 0, 0.4)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 20,
      width: '90%',
      maxWidth: 500,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 20,
    },
    modalSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 24,
    },
    rolContainer: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 24,
    },
    rolOption: {
      flex: 1,
      padding: 16,
      borderRadius: 8,
      borderWidth: 2,
      alignItems: 'center',
      backgroundColor: colors.cardBackground,
      borderColor: colors.border,
    },
    rolOptionSelected: {
      backgroundColor: colors.filterChipActive,
      borderColor: colors.filterChipActive,
    },
    rolOptionText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    rolOptionTextSelected: {
      color: colors.text,
      fontWeight: 'bold',
    },
    vendorContainer: {
      marginBottom: 24,
    },
    vendorSelector: {
      maxHeight: 150,
    },
    vendorEmptyContainer: {
      padding: 16,
      backgroundColor: colors.inputBackground,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    vendorEmptyText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    vendorOption: {
      padding: 12,
      borderRadius: 8,
      backgroundColor: colors.filterChipBackground,
      marginBottom: 8,
    },
    vendorOptionActive: {
      backgroundColor: colors.filterChipActive,
    },
    vendorOptionContent: {
      flexDirection: 'column',
    },
    vendorOptionText: {
      fontSize: 14,
      color: colors.text,
    },
    vendorOptionTextActive: {
      fontWeight: 'bold',
      color: colors.text,
    },
    vendorOptionUbication: {
      fontSize: 12,
      color: colors.textSecondary,
      opacity: 0.6,
      marginTop: 4,
    },
    vendorOptionUbicationActive: {
      opacity: 0.8,
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
    usuarioInfoModal: {
      marginBottom: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    usuarioNameModal: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    usuarioEmailModal: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    labelHint: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 12,
      fontStyle: 'italic',
    },
    rolesContainer: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 24,
    },
    confirmText: {
      fontSize: 16,
      color: colors.text,
      marginBottom: 20,
      textAlign: 'center',
      lineHeight: 24,
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
        <Text style={dynamicStyles.title}>Gestionar Usuarios</Text>
        <Text style={dynamicStyles.subtitle}>
          {usuarios.length} {usuarios.length === 1 ? 'usuario' : 'usuarios'} registrado{usuarios.length === 1 ? '' : 's'}
        </Text>
      </View>

      {/* Buscador */}
      <View style={dynamicStyles.searchContainer}>
        <TextInput
          style={dynamicStyles.searchInput}
          placeholder="Buscar por nombre, email, rol o vendor..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.textSecondary}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={dynamicStyles.clearButton}
            onPress={() => setSearchQuery('')}
          >
            <Text style={dynamicStyles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {searchQuery.trim() && (
        <View style={dynamicStyles.searchResultsContainer}>
          <Text style={dynamicStyles.searchResultsText}>
            {usuariosFiltrados.length} resultado{usuariosFiltrados.length !== 1 ? 's' : ''} encontrado{usuariosFiltrados.length !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {usuarios.length === 0 ? (
        <View style={dynamicStyles.emptyContainer}>
          <Text style={dynamicStyles.emptyIcon}>👥</Text>
          <Text style={dynamicStyles.emptyText}>No hay usuarios registrados</Text>
          <Button
            variant="secondary"
            onPress={cargarDatos}
            style={dynamicStyles.refreshButton}
          >
            Recargar
          </Button>
        </View>
      ) : usuariosFiltrados.length === 0 ? (
        <View style={dynamicStyles.emptyContainer}>
          <Text style={dynamicStyles.emptyIcon}>🔍</Text>
          <Text style={dynamicStyles.emptyText}>No se encontraron usuarios</Text>
          <Text style={dynamicStyles.emptySubtext}>
            Intenta con otros términos de búsqueda
          </Text>
          <Button
            variant="secondary"
            onPress={() => setSearchQuery('')}
            style={dynamicStyles.refreshButton}
          >
            Limpiar búsqueda
          </Button>
        </View>
      ) : (
        <View style={dynamicStyles.usuariosContainer}>
          {usuariosFiltrados.map((usuario) => {
            const roleDisplay = (usuario.role || 'USER').toUpperCase();
            const vendorName = getVendorName(usuario.vendorId);
            
            return (
              <Card key={usuario.id} style={dynamicStyles.usuarioCard}>
                <View style={dynamicStyles.usuarioHeader}>
                  <View style={dynamicStyles.usuarioInfo}>
                    <Text style={dynamicStyles.usuarioName}>
                      {usuario.firstName} {usuario.lastName}
                    </Text>
                    <Text style={dynamicStyles.usuarioEmail}>{usuario.email}</Text>
                    {roleDisplay === 'VENDOR' && vendorName && (
                      <Text style={dynamicStyles.vendorInfo}>
                        📍 Vendor: {vendorName}
                      </Text>
                    )}
                  </View>
                  <View
                    style={[
                      dynamicStyles.rolBadge,
                      { backgroundColor: getRolColor(usuario.role) },
                    ]}
                  >
                    <Text style={dynamicStyles.rolText}>{roleDisplay}</Text>
                  </View>
                </View>
                <Button
                  variant="secondary"
                  onPress={() => abrirModal(usuario)}
                  style={dynamicStyles.editButton}
                  disabled={saving}
                >
                  Cambiar Rol
                </Button>
              </Card>
            );
          })}
        </View>
      )}

      {/* Modal de edición de rol */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={cerrarModal}
      >
        <View style={dynamicStyles.modalOverlay}>
          <Card style={dynamicStyles.modalContent}>
            <Text style={dynamicStyles.modalTitle}>
              Cambiar Rol de Usuario
            </Text>
            
            {usuarioEditando && (
              <View style={dynamicStyles.usuarioInfoModal}>
                <Text style={dynamicStyles.usuarioNameModal}>
                  {usuarioEditando.firstName} {usuarioEditando.lastName}
                </Text>
                <Text style={dynamicStyles.usuarioEmailModal}>
                  {usuarioEditando.email}
                </Text>
              </View>
            )}

            <Text style={dynamicStyles.label}>Seleccionar Rol:</Text>
            <View style={dynamicStyles.rolesContainer}>
              {['USER', 'VENDOR', 'ADMIN'].map((rol) => (
                <TouchableOpacity
                  key={rol}
                  style={[
                    dynamicStyles.rolOption,
                    rolSeleccionado === rol && dynamicStyles.rolOptionSelected,
                    { borderColor: getRolColor(rol) },
                  ]}
                  onPress={() => {
                    setRolSeleccionado(rol);
                    if (rol !== 'VENDOR') {
                      setVendorSeleccionado(null);
                    }
                  }}
                  disabled={saving}
                >
                  <Text
                    style={[
                      dynamicStyles.rolOptionText,
                      rolSeleccionado === rol && dynamicStyles.rolOptionTextSelected,
                    ]}
                  >
                    {rol}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {rolSeleccionado === 'VENDOR' && (
              <View style={dynamicStyles.vendorContainer}>
                <Text style={dynamicStyles.label}>Asociar con Vendor (Opcional):</Text>
                <Text style={dynamicStyles.labelHint}>
                  Puedes asociar este usuario con un vendor existente, o dejarlo sin vendor.
                </Text>
                
                <TouchableOpacity
                  style={[
                    dynamicStyles.vendorOption,
                    !vendorSeleccionado && dynamicStyles.vendorOptionActive,
                    { marginBottom: 8 }
                  ]}
                  onPress={() => setVendorSeleccionado(null)}
                  disabled={saving}
                >
                  <Text
                    style={[
                      dynamicStyles.vendorOptionText,
                      !vendorSeleccionado && dynamicStyles.vendorOptionTextActive,
                    ]}
                  >
                    Sin vendor (solo rol VENDOR)
                  </Text>
                </TouchableOpacity>

                {vendors.length === 0 ? (
                  <View style={dynamicStyles.vendorEmptyContainer}>
                    <Text style={dynamicStyles.vendorEmptyText}>
                      No hay vendors disponibles. Puedes asignar el rol VENDOR sin asociar un vendor.
                    </Text>
                  </View>
                ) : (
                  <ScrollView style={dynamicStyles.vendorSelector}>
                    {vendors.map((vendor) => (
                      <TouchableOpacity
                        key={vendor.id}
                        style={[
                          dynamicStyles.vendorOption,
                          vendorSeleccionado === vendor.id && dynamicStyles.vendorOptionActive,
                        ]}
                        onPress={() => setVendorSeleccionado(vendor.id || null)}
                        disabled={saving}
                      >
                        <View style={dynamicStyles.vendorOptionContent}>
                          <Text
                            style={[
                              dynamicStyles.vendorOptionText,
                              vendorSeleccionado === vendor.id && dynamicStyles.vendorOptionTextActive,
                            ]}
                          >
                            {vendor.name || `Vendor #${vendor.id}`}
                          </Text>
                          {vendor.ubication && (
                            <Text
                              style={[
                                dynamicStyles.vendorOptionUbication,
                                vendorSeleccionado === vendor.id && dynamicStyles.vendorOptionUbicationActive,
                              ]}
                            >
                              📍 {vendor.ubication}
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}

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
        </View>
      </Modal>

      {/* Modal de confirmación de cambio de rol */}
      <Modal
        visible={confirmModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={handleCancelarCambio}
      >
        <View style={dynamicStyles.modalOverlay}>
          <Card style={dynamicStyles.modalContent}>
            <Text style={dynamicStyles.modalTitle}>Confirmar cambio de rol</Text>
            <Text style={dynamicStyles.confirmText}>
              {`¿Estás seguro de cambiar el rol de ${usuarioEditando?.firstName || ''} ${usuarioEditando?.lastName || ''} de ${(usuarioEditando?.role || 'USER').toUpperCase()} a ${pendingUpdate?.rol || ''}?`}
            </Text>
            <View style={dynamicStyles.modalActions}>
              <Button 
                variant="secondary" 
                onPress={handleCancelarCambio} 
                style={dynamicStyles.modalButton}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button 
                variant="primary" 
                onPress={handleConfirmarCambio} 
                style={dynamicStyles.modalButton}
                loading={saving}
                disabled={saving}
              >
                Confirmar
              </Button>
            </View>
          </Card>
        </View>
      </Modal>
    </ScrollView>
  );
}

// Estilos estáticos eliminados - se usan dynamicStyles
