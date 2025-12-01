import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, TextInput, Platform, RefreshControl } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { orderService, userService } from '../../services';
import { useAuth, useTheme } from '../../context';
import type { Order } from '../../types';
import { Button, Loading, PedidoCard, Card } from '../../components';

export default function PedidosVendorScreen() {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const renderCalendarHeader = (date: any) => {
    const d = new Date(date);
    const title = d.toLocaleString(undefined, { month: 'long', year: 'numeric' });
    return (
      <View style={{ backgroundColor: colors.cardBackground, paddingVertical: 10 }}>
        <Text style={{ textAlign: 'center', color: colors.text, fontWeight: '700' }}>{title}</Text>
      </View>
    );
  };

  const DayComponent = ({ date, state, marking, onPress }: any) => {
    const isSelected = marking?.selected;
    const isDisabled = marking?.disabled;
    const dayText = String(date?.day || '');

    const selectedTextColor = isDark ? colors.surface : colors.text;

    return (
      <TouchableOpacity
        onPress={() => onPress && onPress(date)}
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          padding: 6,
          width: 48,
          height: 48,
        }}
        activeOpacity={0.7}
        disabled={isDisabled}
      >
        {isSelected ? (
          <View style={{
            backgroundColor: colors.primary,
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Text style={{ color: selectedTextColor, fontWeight: '600' }}>{dayText}</Text>
          </View>
        ) : (
          <Text style={{ color: isDisabled ? colors.textSecondary : colors.text }}>{dayText}</Text>
        )}
      </TouchableOpacity>
    );
  };
  const [pedidos, setPedidos] = useState<Order[]>([]);
  const [pedidosFiltrados, setPedidosFiltrados] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<string | null>(null);
  // Date filters: 'today' | 'week' | 'date' | 'all'
  const [dateFilterType, setDateFilterType] = useState<'today' | 'week' | 'date' | 'all'>('today');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedWeekStart, setSelectedWeekStart] = useState<string>('');
  const [searchText, setSearchText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [vendorId, setVendorId] = useState<number | null>(user?.vendorId || null);
  const [hoveredFilter, setHoveredFilter] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.vendorId) {
      setVendorId(user.vendorId);
    } else if (user?.id && !vendorId) {
      // Si no hay vendorId, intentar cargarlo desde el backend
      cargarVendorId();
    }
  }, [user]);

  // Inicializar fechas para filtros
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getWeekStartDate = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    return monday.toISOString().split('T')[0];
  };

  const getWeekEndDate = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? 0 : 7 - day;
    const sunday = new Date(today);
    sunday.setDate(today.getDate() + diff);
    return sunday.toISOString().split('T')[0];
  };

  // Efecto para cargar pedidos cuando tenemos vendorId
  useEffect(() => {
    if (vendorId) {
      cargarPedidos();
    }
  }, [vendorId, filtroEstado]);

  // Inicializar fechas al montar
  useEffect(() => {
    const today = getTodayDate();
    const weekStart = getWeekStartDate();
    setSelectedDate(today);
    setSelectedWeekStart(weekStart);
  }, []);

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

    // Filtrar por fecha según dateFilterType
    if (dateFilterType && dateFilterType !== 'all') {
      filtrados = filtrados.filter(p => {
        // Tratar de usar createdAt si está disponible, sino intentar pickup_time
        const raw = (p as any).createdAt || (p as any).created_at || p.pickup_time || '';
        if (!raw) return false;
        const d = new Date(raw);
        d.setHours(0, 0, 0, 0);

        if (dateFilterType === 'today') {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return d.getTime() === today.getTime();
        }

        if (dateFilterType === 'week') {
          const today = new Date();
          const weekEnd = new Date(getWeekEndDate());
          today.setHours(0, 0, 0, 0);
          weekEnd.setHours(0, 0, 0, 0);
          return d.getTime() >= today.getTime() && d.getTime() <= weekEnd.getTime();
        }

        if (dateFilterType === 'date') {
          if (!selectedDate) return true;
          const sel = new Date(selectedDate);
          sel.setHours(0, 0, 0, 0);
          return d.getTime() === sel.getTime();
        }

        return true;
      });
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
  }, [searchText, filtroEstado, pedidos, dateFilterType, selectedDate]);

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

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await cargarPedidos();
    } finally {
      setRefreshing(false);
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
    // Date filter styles
    filtersContainer: {
      padding: 16,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    filterLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    calendarContainer: {
      padding: 16,
      backgroundColor: colors.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    calendar: {
      borderRadius: 8,
      overflow: 'hidden',
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
    <ScrollView style={dynamicStyles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
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
      {/* Date filters */}
      <View style={dynamicStyles.filtersContainer}>
        <Text style={dynamicStyles.filterLabel}>Filtrar por fecha:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
          <TouchableOpacity
            style={[
              dynamicStyles.filterChip,
              dateFilterType === 'today' && dynamicStyles.filterChipActive,
              hoveredFilter === 'date-today' && Platform.OS === 'web' && dynamicStyles.filterChipHover,
            ]}
            onPress={() => setDateFilterType('today')}
            {...(Platform.OS === 'web' && {
              onMouseEnter: () => setHoveredFilter('date-today'),
              onMouseLeave: () => setHoveredFilter(null),
            })}
            className="filter-chip"
          >
            <Text style={[dynamicStyles.filterChipText, dateFilterType === 'today' && dynamicStyles.filterChipTextActive]}>Hoy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              dynamicStyles.filterChip,
              dateFilterType === 'week' && dynamicStyles.filterChipActive,
              hoveredFilter === 'date-week' && Platform.OS === 'web' && dynamicStyles.filterChipHover,
            ]}
            onPress={() => setDateFilterType('week')}
            {...(Platform.OS === 'web' && {
              onMouseEnter: () => setHoveredFilter('date-week'),
              onMouseLeave: () => setHoveredFilter(null),
            })}
            className="filter-chip"
          >
            <Text style={[dynamicStyles.filterChipText, dateFilterType === 'week' && dynamicStyles.filterChipTextActive]}>Esta Semana</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              dynamicStyles.filterChip,
              dateFilterType === 'date' && dynamicStyles.filterChipActive,
              hoveredFilter === 'date-date' && Platform.OS === 'web' && dynamicStyles.filterChipHover,
            ]}
            onPress={() => setDateFilterType('date')}
            {...(Platform.OS === 'web' && {
              onMouseEnter: () => setHoveredFilter('date-date'),
              onMouseLeave: () => setHoveredFilter(null),
            })}
            className="filter-chip"
          >
            <Text style={[dynamicStyles.filterChipText, dateFilterType === 'date' && dynamicStyles.filterChipTextActive]}>Fecha Específica</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              dynamicStyles.filterChip,
              dateFilterType === 'all' && dynamicStyles.filterChipActive,
              hoveredFilter === 'date-all' && Platform.OS === 'web' && dynamicStyles.filterChipHover,
            ]}
            onPress={() => setDateFilterType('all')}
            {...(Platform.OS === 'web' && {
              onMouseEnter: () => setHoveredFilter('date-all'),
              onMouseLeave: () => setHoveredFilter(null),
            })}
            className="filter-chip"
          >
            <Text style={[dynamicStyles.filterChipText, dateFilterType === 'all' && dynamicStyles.filterChipTextActive]}>Desde Siempre</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Estado filters (original) */}
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

      {/* Calendar for specific date */}
      {dateFilterType === 'date' && (
        <View style={dynamicStyles.calendarContainer}>
          <Text style={dynamicStyles.filterLabel}>Selecciona una fecha:</Text>
          <Card style={{ padding: 0 }}>
          <Calendar
            renderHeader={renderCalendarHeader}
            dayComponent={DayComponent}
            key={isDark ? 'dark' : 'light'}
            current={selectedDate}
            onDayPress={(day) => setSelectedDate(day.dateString)}
            markedDates={{
              [selectedDate]: { selected: true, selectedColor: '#BEE0E7', selectedTextColor: '#524E4E' },
            }}
            theme={{
              backgroundColor: colors.cardBackground,
              calendarBackground: colors.cardBackground,
              textSectionTitleColor: colors.textSecondary,
              selectedDayBackgroundColor: colors.primary,
              selectedDayTextColor: colors.text,
              todayTextColor: colors.primary,
              dayTextColor: colors.text,
              textDisabledColor: colors.textSecondary,
              dotColor: colors.primary,
              selectedDotColor: colors.text,
              arrowColor: colors.primary,
              monthTextColor: colors.text,
              indicatorColor: colors.primary,
              textDayFontWeight: '500',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '600',
              textDayFontSize: 14,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 13,
            }}
            style={[dynamicStyles.calendar, { backgroundColor: colors.cardBackground }]}
            minDate={new Date().toISOString().split('T')[0]}
          />
          </Card>
        </View>
      )}

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

