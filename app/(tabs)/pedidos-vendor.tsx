import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, TextInput, Platform } from 'react-native';
import { orderService, userService } from '../../services';
import { useAuth, useTheme } from '../../context';
import type { Order } from '../../types';
import { Button, Loading, PedidoCard } from '../../components';

export default function PedidosVendorScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [pedidos, setPedidos] = useState<Order[]>([]);
  const [pedidosFiltrados, setPedidosFiltrados] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [vendorId, setVendorId] = useState<number | null>(user?.vendorId || null);
  const [hoveredFilter, setHoveredFilter] = useState<string | null>(null);

  useEffect(() => {
    if (user?.vendorId) {
      setVendorId(user.vendorId);
    } else if (user?.id && !vendorId) {
      // Si no hay vendorId, intentar cargarlo desde el backend
      cargarVendorId();
    }
  }, [user]);

  // Efecto para cargar pedidos cuando tenemos vendorId
  useEffect(() => {
    if (vendorId) {
      cargarPedidos();
    }
  }, [vendorId, filtroEstado]);

  const calcularTotalPedido = (pedido: Order): number => {
    if (!pedido.items || pedido.items.length === 0) return 0;
    return pedido.items.reduce((total, item) => {
      return total + (parseFloat(item.price) * item.quantity);
    }, 0);
  };

  const obtenerNombresItems = (pedido: Order): string => {
    if (!pedido.items || pedido.items.length === 0) return '';
    return pedido.items.map(item => item.itemName || '').join(' ').toLowerCase();
  };

  // Efecto para filtrar pedidos por búsqueda
  useEffect(() => {
    let filtrados = pedidos;
    
    if (filtroEstado) {
      filtrados = filtrados.filter(p => p.status === filtroEstado);
    }
    
    if (searchText.trim()) {
      const textoBusqueda = searchText.toLowerCase().trim();
      filtrados = filtrados.filter(p => {
        const id = p.id?.toString() || '';
        const codigoRecojo = p.pickupCode?.toLowerCase() || '';
        const nombreUsuario = p.userName?.toLowerCase() || '';
        const nombreVendor = p.vendorName?.toLowerCase() || '';
        const metodoPago = p.paymentMethod?.toLowerCase() || '';
        const nombresItems = obtenerNombresItems(p);
        const total = calcularTotalPedido(p).toFixed(2);
        const totalStr = total.replace('.', ',');
        
        return id.includes(textoBusqueda) ||
               codigoRecojo.includes(textoBusqueda) ||
               nombreUsuario.includes(textoBusqueda) ||
               nombreVendor.includes(textoBusqueda) ||
               metodoPago.includes(textoBusqueda) ||
               nombresItems.includes(textoBusqueda) ||
               total.includes(textoBusqueda) ||
               totalStr.includes(textoBusqueda);
      });
    }
    
    setPedidosFiltrados(filtrados);
  }, [searchText, filtroEstado, pedidos]);

  const cargarVendorId = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Usar el endpoint /users/me que obtiene el usuario actual desde el token
      const response = await userService.getCurrentUser();
      const usuarioCompleto = response.data;
      
      if (usuarioCompleto.vendorId) {
        setVendorId(usuarioCompleto.vendorId);
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

  const cargarPedidos = async () => {
    if (!vendorId) {
      setError('No tienes un vendor asignado');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await orderService.getByVendorId(vendorId);
      setPedidos(response.data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        setError('No se encontraron pedidos para tu vendor. Asegúrate de tener un vendor válido asignado.');
      } else {
        setError('No se pudieron cargar los pedidos');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMarcarListo = async (pedidoId: number) => {
    try {
      await orderService.markAsReady(pedidoId);
      Alert.alert('Éxito', 'Pedido marcado como listo para recoger');
      cargarPedidos();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo marcar el pedido como listo');
    }
  };

  const handleMarcarCompletado = async (pedidoId: number) => {
    try {
      await orderService.markAsCompleted(pedidoId);
      Alert.alert('Éxito', 'Pedido marcado como completado');
      cargarPedidos();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo marcar el pedido como completado');
    }
  };


  const estados = [
    { label: 'Todos', value: null },
    { label: 'Pendiente Pago', value: 'PENDIENTE_PAGO' },
    { label: 'Pagado', value: 'PAGADO' },
    { label: 'Listo', value: 'LISTO_PARA_RECOJO' },
    { label: 'Completado', value: 'COMPLETADO' },
  ];

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
    filters: {
      padding: 16,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    filterChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.filterChipBackground,
      marginRight: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterChipActive: {
      backgroundColor: colors.filterChipActive,
      borderColor: colors.filterChipActive,
    },
    filterChipHover: {
      backgroundColor: colors.filterChipHover,
      transform: [{ translateY: -1 }],
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    filterChipText: {
      fontSize: 14,
      color: colors.text,
    },
    filterChipTextActive: {
      fontWeight: 'bold',
    },
    emptyContainer: {
      padding: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    errorContainer: {
      padding: 20,
      alignItems: 'center',
    },
    errorText: {
      fontSize: 16,
      color: colors.danger,
      textAlign: 'center',
    },
    pedidosContainer: {
      padding: 16,
    },
    pedidoWrapper: {
      marginBottom: 16,
    },
    actions: {
      marginTop: 8,
      paddingHorizontal: 16,
    },
    actionButton: {
      marginTop: 8,
    },
  });

  if (loading) {
    return <Loading />;
  }

  return (
    <ScrollView style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.title}>Pedidos del Vendor</Text>
      </View>

      <View style={dynamicStyles.searchContainer}>
        <TextInput
          style={dynamicStyles.searchInput}
          placeholder="Buscar por código de recojo, ID, cliente, items, monto, método de pago..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor="#999"
        />
        {searchText.length > 0 && (
          <TouchableOpacity
            style={dynamicStyles.clearButton}
            onPress={() => setSearchText('')}
          >
            <Text style={dynamicStyles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={dynamicStyles.filters}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                 {estados.map((estado) => (
            <TouchableOpacity
              key={estado.value || 'all'}
              style={[
                dynamicStyles.filterChip,
                filtroEstado === estado.value && dynamicStyles.filterChipActive,
                hoveredFilter === `estado-${estado.value || 'all'}` && Platform.OS === 'web' && dynamicStyles.filterChipHover
              ]}
              onPress={() => setFiltroEstado(estado.value)}
              {...(Platform.OS === 'web' && {
                onMouseEnter: () => setHoveredFilter(`estado-${estado.value || 'all'}`),
                onMouseLeave: () => setHoveredFilter(null),
              })}
              className="filter-chip"
            >
              <Text style={[dynamicStyles.filterChipText, filtroEstado === estado.value && dynamicStyles.filterChipTextActive]}>
                {estado.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {error ? (
        <View style={dynamicStyles.emptyContainer}>
          <Text style={dynamicStyles.errorText}>{error}</Text>
        </View>
      ) : pedidosFiltrados.length === 0 ? (
        <View style={dynamicStyles.emptyContainer}>
          <Text style={dynamicStyles.emptyText}>
            {searchText.trim() || filtroEstado ? 'No se encontraron pedidos que coincidan con los filtros' : 'No hay pedidos disponibles'}
          </Text>
        </View>
      ) : (
        <View style={dynamicStyles.pedidosContainer}>
          {pedidosFiltrados.map((pedido) => (
            <View key={pedido.id} style={dynamicStyles.pedidoWrapper}>
              <PedidoCard 
                pedido={pedido} 
                onCancelar={undefined}
                onDarFeedback={undefined}
                onPagar={undefined}
              />
              <View style={dynamicStyles.actions}>
                {pedido.status === 'PAGADO' && (
                  <Button
                    variant="primary"
                    onPress={() => handleMarcarListo(pedido.id!)}
                    style={dynamicStyles.actionButton}
                  >
                    Marcar como Listo
                  </Button>
                )}
                {pedido.status === 'LISTO_PARA_RECOJO' && (
                  <Button
                    variant="primary"
                    onPress={() => handleMarcarCompletado(pedido.id!)}
                    style={dynamicStyles.actionButton}
                  >
                    Marcar como Completado
                  </Button>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

// Estilos estáticos eliminados - se usan dynamicStyles

