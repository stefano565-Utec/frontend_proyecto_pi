import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Modal, TextInput, TouchableOpacity, Platform, RefreshControl } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useRouter } from 'expo-router';
import { menuItemService, orderService, vendorService } from '../../services';
import { useAuth, useTheme } from '../../context';
import type { MenuItem, Vendor, OrderItem, Order } from '../../types';
import { Button, Loading, MenuCard, PaymentModal, Card } from '../../components';

type FilterType = 'today' | 'week' | 'date' | null;

export default function MenusScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  // Custom renderers to ensure calendar respects theme on mobile
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
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuItemsFiltrados, setMenuItemsFiltrados] = useState<MenuItem[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendorSeleccionado, setVendorSeleccionado] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<FilterType>('today');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedWeekStart, setSelectedWeekStart] = useState<string>('');
  const [searchText, setSearchText] = useState('');
  const [modalReserva, setModalReserva] = useState<MenuItem | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [carrito, setCarrito] = useState<Array<{ item: MenuItem; quantity: number; vendorId: number; date?: string }>>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [hoveredFilter, setHoveredFilter] = useState<string | null>(null);
  const usuarioId = user?.id || 0;
  const [refreshing, setRefreshing] = useState(false);

  // Obtener fecha de hoy en formato yyyy-MM-dd
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Obtener inicio de semana (lunes) en formato yyyy-MM-dd
  const getWeekStartDate = () => {
    const today = new Date();
    const day = today.getDay();
    // Calcular diferencia para llegar al lunes (0 = domingo, 1 = lunes, etc.)
    const diff = day === 0 ? -6 : 1 - day; // Si es domingo, retroceder 6 días; si no, retroceder (day - 1) días
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    return monday.toISOString().split('T')[0];
  };

  // Obtener fecha de hoy para usar como inicio cuando se selecciona "Esta Semana"
  const getTodayForWeek = () => {
    return getTodayDate();
  };

  // Obtener fin de semana (domingo) en formato yyyy-MM-dd
  const getWeekEndDate = () => {
    const today = new Date();
    const day = today.getDay();
    // Calcular diferencia para llegar al domingo (0 = domingo)
    const diff = day === 0 ? 0 : 7 - day; // Si es domingo, no mover; si no, avanzar hasta el domingo
    const sunday = new Date(today);
    sunday.setDate(today.getDate() + diff);
    return sunday.toISOString().split('T')[0];
  };

  useEffect(() => {
    const initData = async () => {
      const today = getTodayDate();
      const weekStart = getWeekStartDate();
      setSelectedDate(today);
      setSelectedWeekStart(weekStart);
      
      try {
        setLoading(true);
        await cargarVendors();
      } catch (error) {
        // Error silencioso en carga inicial
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await cargarVendors();
      await cargarMenuItemsConFiltros();
    } catch (e) {
      // silent
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Solo cargar menús si las fechas ya están inicializadas
    if (selectedDate && selectedWeekStart) {
      cargarMenuItemsConFiltros();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorSeleccionado, filterType, selectedDate, selectedWeekStart]);

  const cargarMenuItemsConFiltros = async () => {
    // No cargar si las fechas no están inicializadas
    if (!selectedDate || !selectedWeekStart) {
      return;
    }

    try {
      setLoading(true);
      let response;
      
      if (filterType === 'date' && selectedDate) {
        // Filtrar por fecha específica
        if (vendorSeleccionado) {
          response = await menuItemService.getByVendorAndDate(vendorSeleccionado, selectedDate);
        } else {
          response = await menuItemService.getByDate(selectedDate);
        }
      } else if (filterType === 'week' && selectedWeekStart) {
        // Filtrar por semana (desde hoy hasta el domingo)
        // Usar la fecha de hoy como inicio en lugar del lunes
        const todayForWeek = getTodayForWeek();
        const weekEnd = getWeekEndDate();
        
        if (vendorSeleccionado) {
          response = await menuItemService.getByVendorAndWeek(vendorSeleccionado, selectedWeekStart);
        } else {
          response = await menuItemService.getByWeek(selectedWeekStart);
        }
        
        // Filtrar en el frontend para mostrar solo desde hoy hasta el domingo
        const todayDate = new Date(todayForWeek);
        const weekEndDate = new Date(weekEnd);
        
        response.data = response.data.filter(item => {
          if (!item.date) return false;
          const itemDate = new Date(item.date);
          // Normalizar fechas para comparar solo el día (sin hora)
          itemDate.setHours(0, 0, 0, 0);
          todayDate.setHours(0, 0, 0, 0);
          weekEndDate.setHours(0, 0, 0, 0);
          
          // Incluir solo fechas desde hoy hasta el domingo
          return itemDate >= todayDate && itemDate <= weekEndDate;
        });
      } else {
        // Filtrar por hoy (default)
        if (vendorSeleccionado) {
          response = await menuItemService.getByVendorToday(vendorSeleccionado);
        } else {
          response = await menuItemService.getToday();
        }
      }
      
      const itemsFiltrados = response.data.filter(item => item.isAvailable && item.stock > 0);
      setMenuItems(itemsFiltrados);
      setMenuItemsFiltrados(itemsFiltrados);
    } catch (error) {
      try {
        const fallbackResponse = vendorSeleccionado 
          ? await menuItemService.getByVendorToday(vendorSeleccionado)
          : await menuItemService.getToday();
        const itemsFiltrados = fallbackResponse.data.filter(item => item.isAvailable && item.stock > 0);
        setMenuItems(itemsFiltrados);
        setMenuItemsFiltrados(itemsFiltrados);
      } catch (fallbackError) {
        setMenuItems([]);
        setMenuItemsFiltrados([]);
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
        const nombreVendor = item.vendorName?.toLowerCase() || '';
        
        return nombre.includes(textoBusqueda) ||
               descripcion.includes(textoBusqueda) ||
               precio.includes(textoBusqueda) ||
               nombreVendor.includes(textoBusqueda);
      });
      setMenuItemsFiltrados(filtrados);
    }
  }, [searchText, menuItems]);

  const cargarVendors = async () => {
    try {
      const response = await vendorService.getAll();
      setVendors(response.data);
    } catch (error) {
      // Error silencioso al cargar vendors
    }
  };

  const handleAgregarAlCarrito = (menu: MenuItem) => {
    setModalReserva(menu);
    setCantidad(1);
  };

  const incrementarCantidad = () => {
    if (modalReserva && cantidad < modalReserva.stock) {
      setCantidad(cantidad + 1);
    }
  };

  const decrementarCantidad = () => {
    if (cantidad > 1) {
      setCantidad(cantidad - 1);
    }
  };

  const agregarAlCarrito = () => {
    if (!modalReserva) return;

    // Determine reservation date: prefer modalReserva.date if present (menu-specific),
    // else use selectedDate (when user used date filter), otherwise today
    const reservationDate = modalReserva?.date ? (modalReserva.date.split('T')[0]) : (selectedDate || getTodayDate());

    const itemExistente = carrito.find(c => c.item.id === modalReserva.id && c.vendorId === modalReserva.vendorId && c.date === reservationDate);

    if (itemExistente) {
      setCarrito(carrito.map(c => 
        c.item.id === modalReserva.id && c.vendorId === modalReserva.vendorId && c.date === reservationDate
          ? { ...c, quantity: c.quantity + cantidad }
          : c
      ));
    } else {
      setCarrito([...carrito, { 
        item: modalReserva, 
        quantity: cantidad,
        vendorId: modalReserva.vendorId,
        date: reservationDate,
      }]);
    }

    setModalReserva(null);
  };

  const confirmarPedido = () => {
    if (carrito.length === 0) {
      Alert.alert('Error', 'El carrito está vacío');
      return;
    }
    setShowPaymentModal(true);
  };

  const handlePaymentConfirm = async (paymentMethod: string) => {
    try {
      if (carrito.length === 0) {
        Alert.alert('Error', 'El carrito está vacío');
        return;
      }

      // Agrupar items por vendorId y por fecha de reserva para crear pedidos separados
      const pedidosMap = new Map<string, OrderItem[]>();
      // Key format: `${vendorId}::${date || 'nodate'}`

      carrito.forEach(c => {
        const vendorId = c.vendorId || c.item.vendorId;
        const dateKey = c.date || '';
        const mapKey = `${vendorId}::${dateKey}`;
        if (!pedidosMap.has(mapKey)) {
          pedidosMap.set(mapKey, []);
        }
        // include date in item payload (backend may accept extra fields)
        pedidosMap.get(mapKey)!.push({
          menuItemId: c.item.id!,
          quantity: c.quantity,
          // @ts-ignore allow extra prop
          date: dateKey,
        } as any);
      });

      // Crear un pedido por cada vendor
      const pedidosCreados: Order[] = [];
      
      try {
        const pedidosPromises = Array.from(pedidosMap.entries()).map(async ([mapKey, items]) => {
          // mapKey is `${vendorId}::${date}`
          const [vendorIdStr, dateStr] = mapKey.split('::');
          const vendorId = parseInt(vendorIdStr, 10);
          const orderBody: any = {
            userId: usuarioId,
            vendorId: vendorId,
            paymentMethod: paymentMethod,
            items: items,
          };
          if (dateStr) {
            // ensure only yyyy-MM-dd is sent (strip time if present)
            orderBody.date = dateStr.split('T')[0];
          }

          const orderResponse = await orderService.create(orderBody);

          return orderResponse.data;
        });
        
        const resultados = await Promise.all(pedidosPromises);
        pedidosCreados.push(...resultados);

        // Navegar a pantalla de pago Yape
        if (pedidosCreados.length === 1) {
          // Si hay un solo pedido, navegar directamente a la pantalla de pago
          router.push({
            pathname: '/(tabs)/pago-yape',
            params: {
              orderId: pedidosCreados[0].id!.toString(),
              total: calcularTotalCarrito().toString(),
            },
          });
        } else {
          // Si hay múltiples pedidos, mostrar mensaje y navegar a "Mis Pedidos"
          Alert.alert(
            'Pedidos creados',
            `Se crearon ${pedidosCreados.length} pedidos. Ve a "Mis Pedidos" para pagar cada uno.`,
            [
              {
                text: 'Ver Pedidos',
                onPress: () => {
                  router.push('/(tabs)/mis-pedidos');
                },
              },
              { text: 'OK' },
            ]
          );
        }

        setCarrito([]);
        setShowPaymentModal(false);
      } catch (createError: any) {
        for (const pedido of pedidosCreados) {
          try {
            if (pedido.id) {
              await orderService.cancel(pedido.id);
            }
          } catch (cancelError) {
            // Error silencioso al cancelar pedido
          }
        }
        
        throw createError;
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Error al realizar el pedido. El stock no se ha descontado.');
    }
  };

  const eliminarDelCarrito = (itemId: number, vendorId?: number, dateArg?: string) => {
    if (vendorId && dateArg) {
      setCarrito(carrito.filter(c => !(c.item.id === itemId && c.vendorId === vendorId && c.date === dateArg)));
    } else if (vendorId) {
      setCarrito(carrito.filter(c => !(c.item.id === itemId && c.vendorId === vendorId)));
    } else {
      setCarrito(carrito.filter(c => c.item.id !== itemId));
    }
  };

  const calcularTotalCarrito = () => {
    return carrito.reduce((total, c) => {
      return total + (parseFloat(c.item.price) * c.quantity);
    }, 0);
  };

  if (loading) {
    return <Loading />;
  }

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
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
      marginBottom: 16,
    },
    filterContainer: {
      marginTop: 8,
    },
    filterLabel: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 8,
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
    carritoItemDate: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
    },
    calendarContainer: {
      marginTop: 12,
      marginBottom: 8,
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 12,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    calendar: {
      borderRadius: 10,
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
    menusContainer: {
      padding: 16,
    },
    emptyContainer: {
      padding: 40,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
    carritoContainer: {
      backgroundColor: colors.surface,
      borderTopWidth: 2,
      borderTopColor: colors.primary,
      padding: 20,
      maxHeight: 300,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 8,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    },
    carritoTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 12,
    },
    carritoItems: {
      maxHeight: 150,
      marginBottom: 12,
    },
    carritoItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    carritoItemInfo: {
      flex: 1,
    },
    carritoItemText: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '600',
    },
    carritoItemVendor: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    carritoItemPrice: {
      fontSize: 12,
      color: colors.text,
      marginTop: 2,
    },
    carritoItemDelete: {
      fontSize: 14,
      color: colors.danger,
      fontWeight: '600',
    },
    carritoTotal: {
      marginBottom: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    carritoTotalText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
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
      padding: 24,
      width: '90%',
      maxWidth: 400,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 16,
    },
    modalText: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 8,
    },
    modalBold: {
      fontWeight: 'bold',
    },
    modalInputContainer: {
      marginVertical: 16,
    },
    modalLabel: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 8,
      fontWeight: '600',
    },
    quantityContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 8,
    },
    quantityButton: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.text,
    },
    quantityButtonDisabled: {
      backgroundColor: colors.inputBackground,
      borderColor: colors.border,
    },
    quantityButtonText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
    },
    quantityText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginHorizontal: 20,
      minWidth: 40,
      textAlign: 'center',
    },
    quantityButtonTextDisabled: {
      color: colors.textSecondary,
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 20,
      gap: 12,
    },
  });

  return (
    <View style={dynamicStyles.container}>
      <ScrollView style={dynamicStyles.scrollView} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={dynamicStyles.header}>
          <Text style={dynamicStyles.title}>Menús Disponibles</Text>
          
          {/* Filtros por tipo de fecha */}
          <View style={dynamicStyles.filterContainer}>
            <Text style={dynamicStyles.filterLabel}>Ver por:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[
                  dynamicStyles.filterChip,
                  filterType === 'today' && dynamicStyles.filterChipActive,
                  hoveredFilter === 'today' && Platform.OS === 'web' && dynamicStyles.filterChipHover
                ]}
                onPress={() => setFilterType('today')}
                {...(Platform.OS === 'web' && {
                  onMouseEnter: () => setHoveredFilter('today'),
                  onMouseLeave: () => setHoveredFilter(null),
                })}
                className="filter-chip"
              >
                <Text style={[dynamicStyles.filterChipText, filterType === 'today' && dynamicStyles.filterChipTextActive]}>
                  Hoy
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  dynamicStyles.filterChip,
                  filterType === 'week' && dynamicStyles.filterChipActive,
                  hoveredFilter === 'week' && Platform.OS === 'web' && dynamicStyles.filterChipHover
                ]}
                onPress={() => setFilterType('week')}
                {...(Platform.OS === 'web' && {
                  onMouseEnter: () => setHoveredFilter('week'),
                  onMouseLeave: () => setHoveredFilter(null),
                })}
                className="filter-chip"
              >
                <Text style={[dynamicStyles.filterChipText, filterType === 'week' && dynamicStyles.filterChipTextActive]}>
                  Esta Semana
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  dynamicStyles.filterChip,
                  filterType === 'date' && dynamicStyles.filterChipActive,
                  hoveredFilter === 'date' && Platform.OS === 'web' && dynamicStyles.filterChipHover
                ]}
                onPress={() => setFilterType('date')}
                {...(Platform.OS === 'web' && {
                  onMouseEnter: () => setHoveredFilter('date'),
                  onMouseLeave: () => setHoveredFilter(null),
                })}
                className="filter-chip"
              >
                <Text style={[dynamicStyles.filterChipText, filterType === 'date' && dynamicStyles.filterChipTextActive]}>
                  Fecha Específica
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Selector de fecha si está en modo fecha específica */}
          {filterType === 'date' && (
            <View style={dynamicStyles.calendarContainer}>
              <Text style={dynamicStyles.filterLabel}>Selecciona una fecha:</Text>
              <Card style={{ padding: 0 }}>
              <Calendar
                key={isDark ? 'dark' : 'light'}
                current={selectedDate}
                renderHeader={renderCalendarHeader}
                dayComponent={DayComponent}
                onDayPress={(day) => {
                  setSelectedDate(day.dateString);
                }}
                markedDates={{
                  [selectedDate]: {
                    selected: true,
                    selectedColor: '#BEE0E7',
                    selectedTextColor: '#524E4E',
                  },
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
                minDate={new Date().toISOString().split('T')[0]} // Solo permitir fechas futuras o hoy
              />
              </Card>
            </View>
          )}

          {/* Filtros por vendedor */}
          {vendors.length > 0 && (
            <View style={dynamicStyles.filterContainer}>
              <Text style={dynamicStyles.filterLabel}>Vendedor:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                       <TouchableOpacity
                         style={[
                           dynamicStyles.filterChip,
                           !vendorSeleccionado && dynamicStyles.filterChipActive,
                           hoveredFilter === 'vendor-all' && Platform.OS === 'web' && dynamicStyles.filterChipHover
                         ]}
                         onPress={() => setVendorSeleccionado(null)}
                         {...(Platform.OS === 'web' && {
                           onMouseEnter: () => setHoveredFilter('vendor-all'),
                           onMouseLeave: () => setHoveredFilter(null),
                         })}
                         className="filter-chip"
                       >
                         <Text style={[dynamicStyles.filterChipText, !vendorSeleccionado && dynamicStyles.filterChipTextActive]}>
                           Todos
                         </Text>
                       </TouchableOpacity>
                       {vendors.map(vendor => (
                         <TouchableOpacity
                           key={vendor.id}
                           style={[
                             dynamicStyles.filterChip,
                             vendorSeleccionado === vendor.id && dynamicStyles.filterChipActive,
                             hoveredFilter === `vendor-${vendor.id}` && Platform.OS === 'web' && dynamicStyles.filterChipHover
                           ]}
                          onPress={() => setVendorSeleccionado(vendor.id || null)}
                          {...(Platform.OS === 'web' && {
                            onMouseEnter: () => setHoveredFilter(`vendor-${vendor.id}`),
                            onMouseLeave: () => setHoveredFilter(null),
                          })}
                          className="filter-chip"
                         >
                           <Text style={[dynamicStyles.filterChipText, vendorSeleccionado === vendor.id && dynamicStyles.filterChipTextActive]}>
                             {vendor.name}
                           </Text>
                         </TouchableOpacity>
                       ))}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={dynamicStyles.searchContainer}>
          <TextInput
            style={dynamicStyles.searchInput}
            placeholder="Buscar por nombre, descripción, precio o vendor..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor={colors.textSecondary}
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

        {menuItemsFiltrados.length === 0 ? (
          <View style={dynamicStyles.emptyContainer}>
            <Text style={dynamicStyles.emptyText}>
              {searchText.trim() ? 'No se encontraron menús que coincidan con la búsqueda' : 'No hay items disponibles'}
            </Text>
          </View>
        ) : (
          <View style={dynamicStyles.menusContainer}>
            {menuItemsFiltrados.map(menu => (
              <MenuCard
                key={menu.id}
                menu={menu}
                onReservar={handleAgregarAlCarrito}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {carrito.length > 0 && (
        <View style={dynamicStyles.carritoContainer}>
          <Text style={dynamicStyles.carritoTitle}>Carrito ({carrito.length} items)</Text>
          <ScrollView style={dynamicStyles.carritoItems}>
              {carrito.map((c, index) => (
                <View key={`${c.item.id}-${c.vendorId}-${index}-${c.date || 'nodate'}`} style={dynamicStyles.carritoItem}>
                  <View style={dynamicStyles.carritoItemInfo}>
                    <Text style={dynamicStyles.carritoItemText}>
                      {c.quantity}x {c.item.itemName}
                    </Text>
                    {c.item.vendorName && (
                      <Text style={dynamicStyles.carritoItemVendor}>
                        Vendedor: {c.item.vendorName}
                      </Text>
                    )}
                    <Text style={dynamicStyles.carritoItemPrice}>
                      S/ {parseFloat(c.item.price).toFixed(2)} c/u
                    </Text>
                    {c.date && (
                      <Text style={dynamicStyles.carritoItemDate}>
                        Fecha reserva: {new Date(c.date).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => eliminarDelCarrito(c.item.id!, c.vendorId, c.date)}>
                    <Text style={dynamicStyles.carritoItemDelete}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              ))}
          </ScrollView>
          <View style={dynamicStyles.carritoTotal}>
            <Text style={dynamicStyles.carritoTotalText}>
              Total: S/ {calcularTotalCarrito().toFixed(2)}
            </Text>
          </View>
          <Button variant="primary" onPress={confirmarPedido}>
            Confirmar Pedido
          </Button>
        </View>
      )}

      <Modal
        visible={modalReserva !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setModalReserva(null)}
      >
        <View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
            <Text style={dynamicStyles.modalTitle}>Agregar al Carrito</Text>
            {modalReserva && (
              <>
                <Text style={dynamicStyles.modalText}><Text style={dynamicStyles.modalBold}>Item:</Text> {modalReserva.itemName}</Text>
                <Text style={dynamicStyles.modalText}><Text style={dynamicStyles.modalBold}>Precio unitario:</Text> S/ {parseFloat(modalReserva.price).toFixed(2)}</Text>
                
                <View style={dynamicStyles.modalInputContainer}>
                  <Text style={dynamicStyles.modalLabel}>Cantidad:</Text>
                  <View style={dynamicStyles.quantityContainer}>
                    <TouchableOpacity
                      style={[dynamicStyles.quantityButton, cantidad <= 1 && dynamicStyles.quantityButtonDisabled]}
                      onPress={decrementarCantidad}
                      disabled={cantidad <= 1}
                    >
                      <Text style={dynamicStyles.quantityButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={dynamicStyles.quantityText}>{cantidad}</Text>
                    <TouchableOpacity
                      style={[dynamicStyles.quantityButton, cantidad >= modalReserva.stock && dynamicStyles.quantityButtonDisabled]}
                      onPress={incrementarCantidad}
                      disabled={cantidad >= modalReserva.stock}
                    >
                      <Text style={dynamicStyles.quantityButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={dynamicStyles.modalText}>
                    Stock disponible: {modalReserva.stock} unidades
                  </Text>
                </View>

                <Text style={dynamicStyles.modalText}>
                  <Text style={dynamicStyles.modalBold}>Subtotal:</Text> S/ {(parseFloat(modalReserva.price) * cantidad).toFixed(2)}
                </Text>
              </>
            )}

            <View style={dynamicStyles.modalActions}>
              <Button variant="secondary" onPress={() => setModalReserva(null)}>
                Cancelar
              </Button>
              <Button variant="primary" onPress={agregarAlCarrito}>
                Agregar al Carrito
              </Button>
            </View>
          </View>
          </View>
        </Modal>

        <PaymentModal
          visible={showPaymentModal}
          total={calcularTotalCarrito()}
          vendorId={carrito.length > 0 ? (carrito[0].vendorId || carrito[0].item.vendorId) : 0}
          onClose={() => setShowPaymentModal(false)}
          onConfirm={handlePaymentConfirm}
        />
      </View>
    );
  }

const stylesOld = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEFCF3',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#524E4E',
    marginBottom: 16,
  },
  filterContainer: {
    marginTop: 8,
  },
  filterLabel: {
    fontSize: 14,
    color: '#524E4E',
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterChipActive: {
    backgroundColor: '#BEE0E7',
    borderColor: '#BEE0E7',
  },
  filterChipHover: {
    backgroundColor: '#E8E8E8',
    transform: [{ translateY: -1 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  filterChipText: {
    fontSize: 14,
    color: '#524E4E',
  },
  filterChipTextActive: {
    fontWeight: 'bold',
  },
  calendarContainer: {
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  calendar: {
    borderRadius: 10,
    marginTop: 8,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#F5F5F5',
    color: '#524E4E',
  },
  clearButton: {
    marginLeft: 8,
    padding: 8,
  },
  clearButtonText: {
    fontSize: 18,
    color: '#999',
    fontWeight: 'bold',
  },
  menusContainer: {
    padding: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#524E4E',
    fontStyle: 'italic',
  },
  carritoContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 2,
    borderTopColor: '#BEE0E7',
    padding: 20,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  carritoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#524E4E',
    marginBottom: 12,
  },
  carritoItems: {
    maxHeight: 150,
    marginBottom: 12,
  },
  carritoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  carritoItemInfo: {
    flex: 1,
  },
  carritoItemText: {
    fontSize: 14,
    color: '#524E4E',
    fontWeight: '600',
  },
  carritoItemVendor: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  carritoItemPrice: {
    fontSize: 12,
    color: '#524E4E',
    marginTop: 2,
  },
  carritoItemDelete: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  carritoTotal: {
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  carritoTotalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#524E4E',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#524E4E',
    marginBottom: 16,
  },
  modalText: {
    fontSize: 14,
    color: '#524E4E',
    marginBottom: 8,
  },
  modalBold: {
    fontWeight: 'bold',
  },
  modalInputContainer: {
    marginVertical: 16,
  },
  modalLabel: {
    fontSize: 14,
    color: '#524E4E',
    marginBottom: 8,
    fontWeight: '600',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  quantityButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#BEE0E7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#524E4E',
  },
  quantityButtonDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  quantityButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#524E4E',
  },
  quantityButtonTextDisabled: {
    color: '#999',
  },
  quantityValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#524E4E',
    marginHorizontal: 24,
    minWidth: 40,
    textAlign: 'center',
  },
  quantityHint: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#524E4E',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  modalTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#524E4E',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
});

