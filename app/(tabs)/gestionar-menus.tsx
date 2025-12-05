import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Modal, TextInput, TouchableOpacity, RefreshControl } from 'react-native';
import { menuItemService, userService } from '../../services';
import { useAuth, useTheme } from '../../context';
import type { MenuItem } from '../../types';
import { Button, Loading, MenuCard } from '../../components';

export default function GestionarMenusScreen() {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuItemsFiltrados, setMenuItemsFiltrados] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vendorId, setVendorId] = useState<number | null>(null);
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [itemEditando, setItemEditando] = useState<MenuItem | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemAEliminar, setItemAEliminar] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    itemName: '',
    description: '',
    price: '',
    stock: '',
    isAvailable: true,
    date: '',
  });

  useEffect(() => {
    if (user?.vendorId) {
      setVendorId(user.vendorId);
      cargarMenuItems(user.vendorId);
    } else if (user?.id) {
      // Si no hay vendorId, intentar cargarlo desde el backend
      cargarVendorId();
    } else {
      setError('Usuario no autenticado');
      setLoading(false);
    }
  }, [user]);

  const cargarVendorId = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Usar el endpoint /users/me que obtiene el usuario actual desde el token
      const response = await userService.getCurrentUser();
      const usuarioCompleto = response.data;
      
      if (usuarioCompleto.vendorId) {
        setVendorId(usuarioCompleto.vendorId);
        cargarMenuItems(usuarioCompleto.vendorId);
      } else {
        setError('No tienes un vendor asignado. Contacta al administrador para que te asigne un vendor.');
        setLoading(false);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Error desconocido';
      setError(`No se pudo cargar la información del vendor: ${errorMessage}. Asegúrate de tener un vendor asignado.`);
      setLoading(false);
    }
  };

  const cargarMenuItems = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await menuItemService.getAllByVendor(id);
      setMenuItems(response.data);
      setMenuItemsFiltrados(response.data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        setError('No se encontraron items para tu vendor. Asegúrate de tener un vendor válido asignado.');
      } else {
        setError('No se pudieron cargar los items del menú');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchText.trim() === '') {
      setMenuItemsFiltrados(menuItems);
    } else {
      const textoBusqueda = searchText.toLowerCase().trim();
      const filtrados = menuItems.filter(item => {
        const nombre = item.itemName?.toLowerCase() || '';
        const descripcion = item.description?.toLowerCase() || '';
        const precio = item.price?.toLowerCase() || '';
        // Usar la parte YYYY-MM-DD del ISO string para evitar conversiones automáticas de zona horaria
        const fecha = item.date ? item.date.split('T')[0] : '';
        const fechaISO = item.date ? item.date.split('T')[0] : '';
        
        return nombre.includes(textoBusqueda) ||
               descripcion.includes(textoBusqueda) ||
               precio.includes(textoBusqueda) ||
               fecha.includes(textoBusqueda) ||
               fechaISO.includes(textoBusqueda);
      });
      setMenuItemsFiltrados(filtrados);
    }
  }, [searchText, menuItems]);

  const getTodayDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (vendorId) {
        await cargarMenuItems(vendorId);
      } else {
        await cargarVendorId();
      }
    } finally {
      setRefreshing(false);
    }
  };

  const abrirModal = (item?: MenuItem) => {
    if (item) {
      setItemEditando(item);
      setFormData({
        itemName: item.itemName,
        description: item.description || '',
        price: item.price,
        stock: item.stock.toString(),
        isAvailable: item.isAvailable,
        date: item.date ? item.date.split('T')[0] : getTodayDate(),
      });
    } else {
      setItemEditando(null);
      setFormData({
        itemName: '',
        description: '',
        price: '',
        stock: '',
        isAvailable: true,
        date: getTodayDate(),
      });
    }
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setItemEditando(null);
    setFormData({
      itemName: '',
      description: '',
      price: '',
      stock: '',
      isAvailable: true,
      date: getTodayDate(),
    });
  };

  const handleGuardar = async () => {
    if (!formData.itemName.trim() || !formData.price.trim() || !formData.stock.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos requeridos');
      return;
    }

    if (!vendorId) {
      Alert.alert('Error', 'No tienes un vendor asignado');
      return;
    }

    try {
      const stockNum = parseInt(formData.stock);
      if (isNaN(stockNum) || stockNum < 0) {
        Alert.alert('Error', 'Por favor ingresa un stock válido (número mayor o igual a 0)');
        return;
      }

      let dateToSend: string | undefined = undefined;
      if (formData.date && formData.date.trim()) {
        const dateStr = formData.date.trim();
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        
        if (!dateRegex.test(dateStr)) {
          Alert.alert('Error', `El formato de fecha es inválido. Use el formato yyyy-MM-dd (ej: ${getTodayDate()})`);
          return;
        }
        
        // CORRECCIÓN: Parsear manualmente para respetar zona horaria local
        const [yyyy, mm, dd] = dateStr.split('-').map(Number);
        const selectedDate = new Date(yyyy, mm - 1, dd); // Mes es base 0

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalizar hoy a media noche

        if (selectedDate < today) {
          Alert.alert('Error', 'No se pueden crear menús para fechas pasadas. Por favor selecciona una fecha de hoy en adelante.');
          return;
        }
        
        // Enviar la fecha con hora fija al mediodía para evitar desfases por zona horaria
        dateToSend = dateStr + 'T12:00:00';
      }

      const menuItemData = {
        itemName: formData.itemName.trim(),
        description: formData.description?.trim() || '',
        price: formData.price.trim(),
        vendorId: vendorId,
        stock: stockNum,
        isAvailable: formData.isAvailable,
        date: dateToSend,
      };

      if (itemEditando) {
        // Actualizar item existente
        await menuItemService.update(itemEditando.id!, menuItemData);
        Alert.alert('Éxito', 'Item actualizado correctamente');
      } else {
        // Crear nuevo item
        await menuItemService.create(menuItemData);
        Alert.alert('Éxito', 'Item creado correctamente');
      }
      cerrarModal();
      cargarMenuItems(vendorId);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo guardar el item');
    }
  };

  const handleEliminar = async (item: MenuItem) => {
    if (!item.id) {
      Alert.alert('Error', 'No se puede eliminar: ID inválido');
      return;
    }
    
    setItemAEliminar(item);
    setDeleteModalVisible(true);
  };

  const confirmarEliminacion = async () => {
    if (!itemAEliminar || !itemAEliminar.id) {
      return;
    }

    try {
      if (itemAEliminar.date) {
        const dateStr = itemAEliminar.date.split('T')[0];
        await menuItemService.deleteAvailability(itemAEliminar.id, dateStr);
        Alert.alert('Éxito', 'Disponibilidad eliminada correctamente');
      } else {
        await menuItemService.delete(itemAEliminar.id);
        Alert.alert('Éxito', 'Item eliminado correctamente');
      }
      setDeleteModalVisible(false);
      setItemAEliminar(null);
      if (vendorId) {
        await cargarMenuItems(vendorId);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error ||
                          error.message || 
                          'No se pudo eliminar el item';
      Alert.alert('Error', `No se pudo eliminar el item: ${errorMessage}`);
      setDeleteModalVisible(false);
      setItemAEliminar(null);
    }
  };

  const cancelarEliminacion = () => {
    setDeleteModalVisible(false);
    setItemAEliminar(null);
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
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
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
    addButton: {
      minWidth: 120,
    },
    menuContainer: {
      padding: 16,
    },
    menuItemWrapper: {
      marginBottom: 16,
    },
    itemInfo: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: colors.inputBackground,
      borderRadius: 8,
      marginTop: 8,
    },
    dateText: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '600',
    },
    dateTextPast: {
      color: colors.danger,
      fontStyle: 'italic',
    },
    itemActions: {
      marginTop: 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
      zIndex: 10,
    },
    editButton: {
      flex: 1,
      minWidth: 100,
      zIndex: 10,
    },
    deleteButton: {
      flex: 1,
      minWidth: 100,
      zIndex: 10,
    },
    deleteButtonTouchable: {
      backgroundColor: colors.danger,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    stockText: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '600',
      width: '100%',
      marginTop: 8,
      textAlign: 'center',
    },
    emptyContainer: {
      padding: 40,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    errorText: {
      fontSize: 16,
      color: colors.danger,
      textAlign: 'center',
      fontWeight: '600',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      fontSize: 16,
      backgroundColor: isDark ? '#2D2D2D' : colors.inputBackground,
      color: isDark ? '#FFFFFF' : colors.text,
    },
    textArea: {
      height: 80,
      textAlignVertical: 'top',
    },
    label: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 8,
      fontWeight: '600',
    },
    hint: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: -8,
      marginBottom: 12,
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
      backgroundColor: colors.inputBackground,
      color: colors.text,
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
    switchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    switchLabel: {
      fontSize: 16,
      color: colors.text,
      marginRight: 12,
    },
    switch: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.filterChipBackground,
    },
    switchActive: {
      backgroundColor: colors.filterChipActive,
    },
    switchText: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '600',
    },
    deleteModalText: {
      fontSize: 16,
      color: colors.text,
      marginBottom: 20,
      textAlign: 'center',
      lineHeight: 24,
    },
  });

  if (loading) {
    return <Loading />;
  }

  return (
    <ScrollView style={dynamicStyles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.title}>Gestionar Menús</Text>
        <Button variant="primary" onPress={() => abrirModal()} style={dynamicStyles.addButton}>
          Agregar Item
        </Button>
      </View>

      {error ? (
        <View style={dynamicStyles.emptyContainer}>
          <Text style={dynamicStyles.errorText}>{error}</Text>
        </View>
      ) : menuItemsFiltrados.length === 0 ? (
        <View style={dynamicStyles.emptyContainer}>
          <Text style={dynamicStyles.emptyText}>
            {searchText.trim() ? 'No se encontraron items que coincidan con la búsqueda' : 'No hay items en el menú'}
          </Text>
        </View>
      ) : (
        <View style={dynamicStyles.menuContainer}>
          {menuItemsFiltrados.map((item, index) => {
            const itemDate = item.date ? new Date(item.date) : null;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const isPast = itemDate ? itemDate < today : false;
            const dateStr = itemDate ? itemDate.toLocaleDateString('es-PE', { 
              year: 'numeric', 
              month: '2-digit', 
              day: '2-digit' 
            }) : 'Sin fecha';
            
            return (
              <View key={`${item.id}-${item.date || index}`} style={dynamicStyles.menuItemWrapper}>
                <MenuCard menu={item} onReservar={() => abrirModal(item)} />
                <View style={dynamicStyles.itemInfo}>
                  <Text style={[dynamicStyles.dateText, isPast && dynamicStyles.dateTextPast]}>
                    📅 Fecha: {dateStr} {isPast && '(Pasada)'}
                  </Text>
                </View>
                <View style={dynamicStyles.itemActions}>
                  <Button
                    variant="secondary"
                    onPress={() => abrirModal(item)}
                    style={dynamicStyles.editButton}
                  >
                    Editar
                  </Button>
                  <TouchableOpacity
                    style={[dynamicStyles.deleteButtonTouchable, dynamicStyles.deleteButton]}
                    onPress={() => handleEliminar(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={dynamicStyles.deleteButtonText}>Eliminar</Text>
                  </TouchableOpacity>
                  <Text style={dynamicStyles.stockText}>
                    Stock: {item.stock} | {item.isAvailable ? 'Disponible' : 'No Disponible'}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={cerrarModal}
      >
        <View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
            <Text style={dynamicStyles.modalTitle}>
              {itemEditando ? 'Editar Item' : 'Nuevo Item'}
            </Text>

            <TextInput
              style={dynamicStyles.input}
              placeholder="Nombre del item *"
              placeholderTextColor={colors.textSecondary}
              value={formData.itemName}
              onChangeText={(text) => setFormData({ ...formData, itemName: text })}
            />

            <TextInput
              style={[dynamicStyles.input, dynamicStyles.textArea]}
              placeholder="Descripción"
              placeholderTextColor={colors.textSecondary}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
              numberOfLines={3}
            />

            <TextInput
              style={dynamicStyles.input}
              placeholder="Precio *"
              placeholderTextColor={colors.textSecondary}
              value={formData.price}
              onChangeText={(text) => setFormData({ ...formData, price: text })}
              keyboardType="decimal-pad"
            />

            <TextInput
              style={dynamicStyles.input}
              placeholder="Stock *"
              placeholderTextColor={colors.textSecondary}
              value={formData.stock}
              onChangeText={(text) => setFormData({ ...formData, stock: text })}
              keyboardType="numeric"
            />

            <Text style={dynamicStyles.label}>Fecha de disponibilidad (Opcional)</Text>
            <TextInput
              style={dynamicStyles.input}
              placeholder={`yyyy-MM-dd (ej: ${getTodayDate()})`}
              placeholderTextColor={colors.textSecondary}
              value={formData.date}
              onChangeText={(text) => setFormData({ ...formData, date: text })}
              keyboardType="default"
            />
            <Text style={dynamicStyles.hint}>
              Si no especificas una fecha, se usará la fecha de hoy. Solo se permiten fechas de hoy en adelante. Formato: yyyy-MM-dd
            </Text>

            <View style={dynamicStyles.switchContainer}>
              <Text style={dynamicStyles.switchLabel}>Disponible:</Text>
              <TouchableOpacity
                style={[dynamicStyles.switch, formData.isAvailable && dynamicStyles.switchActive]}
                onPress={() => setFormData({ ...formData, isAvailable: !formData.isAvailable })}
              >
                <Text style={dynamicStyles.switchText}>
                  {formData.isAvailable ? 'Sí' : 'No'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={dynamicStyles.modalActions}>
              <Button variant="secondary" onPress={cerrarModal} style={dynamicStyles.modalButton}>
                Cancelar
              </Button>
              <Button variant="primary" onPress={handleGuardar} style={dynamicStyles.modalButton}>
                Guardar
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de confirmación de eliminación */}
      <Modal
        visible={deleteModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={cancelarEliminacion}
      >
        <View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
            <Text style={dynamicStyles.modalTitle}>Confirmar eliminación</Text>
            <Text style={dynamicStyles.deleteModalText}>
              {itemAEliminar?.date 
                ? `¿Estás seguro de que deseas eliminar la disponibilidad de "${itemAEliminar?.itemName}" para la fecha ${itemAEliminar.date.split('T')[0]}? Esta acción eliminará solo esta fecha específica.`
                : `¿Estás seguro de que deseas eliminar "${itemAEliminar?.itemName}"? Esta acción eliminará el menú completo.`}
            </Text>
            <View style={dynamicStyles.modalActions}>
              <Button variant="secondary" onPress={cancelarEliminacion} style={dynamicStyles.modalButton}>
                Cancelar
              </Button>
              <Button variant="danger" onPress={confirmarEliminacion} style={dynamicStyles.modalButton}>
                Eliminar
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// Estilos estáticos eliminados - se usan dynamicStyles

