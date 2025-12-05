import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Modal, TextInput, TouchableOpacity, Platform, RefreshControl, useWindowDimensions } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useRouter } from 'expo-router';
import { menuItemService, orderService, vendorService } from '../../services';
import { useAuth, useTheme } from '../../context';
import type { MenuItem, Vendor, OrderItem, Order } from '../../types';
import { Button, Loading, MenuCard, PaymentModal, Card } from '../../components';

type FilterType = 'today' | 'week' | 'date' | 'all' | null;

export default function MenusScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();

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

  // Date helpers requested by user
  const getLocalTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getNextSundayString = () => {
    const d = new Date();
    const dayOfWeek = d.getDay(); // 0 (Sun) - 6 (Sat)
    const diffToSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    const sunday = new Date(d);
    sunday.setDate(d.getDate() + diffToSunday);
    const y = sunday.getFullYear();
    const m = String(sunday.getMonth() + 1).padStart(2, '0');
    const dd = String(sunday.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };

  // compatibility wrappers
  const getTodayDate = () => getLocalTodayString();
  const getWeekStartDate = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diff);
    const y = monday.getFullYear();
    const m = String(monday.getMonth() + 1).padStart(2, '0');
    const dd = String(monday.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };

  const normalizeMenuItems = (data: any[]): any[] => {
    const out: any[] = [];
    data.forEach(orig => {
      if (!orig) return;
      if (orig.date) { out.push({ ...orig }); return; }
      if (Array.isArray(orig.availabilities) && orig.availabilities.length > 0) {
        orig.availabilities.forEach((a: any) => out.push({ ...orig, date: a.date, isAvailable: a.isAvailable, stock: a.stock }));
        return;
      }
      out.push({ ...orig });
    });
    return out;
  };

  const cargarVendors = async () => {
    try {
      const response = await vendorService.getAll();
      setVendors(response.data || []);
      // Selección automática del primer vendor para evitar estado null (modo 'Todos' no soportado)
      if (Array.isArray(response.data) && response.data.length > 0) {
        const firstId = response.data[0]?.id;
        if (firstId !== undefined && firstId !== null) setVendorSeleccionado(firstId as number);
      }
    } catch (error) {
      // silent
    }
  };

  useEffect(() => {
    const initData = async () => {
      const today = getTodayDate();
      const weekStart = getWeekStartDate();
      setSelectedDate(today);
      setSelectedWeekStart(weekStart);
      try { setLoading(true); await cargarVendors(); } catch (e) { } finally { setLoading(false); }
    };
    initData();
  }, []);

  useEffect(() => {
    if (filterType === 'today') setSelectedDate(getTodayDate());
    if (filterType === 'week') { setSelectedWeekStart(getWeekStartDate()); setSelectedDate(getTodayDate()); }
    if (filterType !== 'date') setSelectedDate(getTodayDate());
  }, [filterType]);

  const cargarMenuItemsConFiltros = useCallback(async () => {
    setLoading(true);
    try {
      // Constantes iniciales
      const today = getLocalTodayString();
      const sunday = getNextSundayString();
      const isGlobalMode = vendorSeleccionado === null; // CRÍTICO: comprobación explícita
      console.log(`[FETCH] Modo: ${isGlobalMode ? 'GLOBAL' : 'VENDOR'} | vendorSeleccionado=${vendorSeleccionado} | filterType=${filterType}`);

      let response: any = { data: [] };

      // ===== Árbol de decisión estricto para fetch =====
      if (isGlobalMode) {
        // === MODO GLOBAL (Todos los vendedores) ===
        if (filterType === 'date') {
          const target = selectedDate || today;
          console.log(`[FETCH] Modo: GLOBAL | getByDate(${target})`);
          response = await menuItemService.getByDate(target);
        } else if (filterType === 'today') {
          console.log(`[FETCH] Modo: GLOBAL | getByDate(${today})`);
          response = await menuItemService.getByDate(today);
        } else {
          // week OR all -> get full global history
          console.log(`[FETCH] Modo: GLOBAL | getAll()`);
          response = await menuItemService.getAll();
        }

        if (!response?.data || (Array.isArray(response.data) && response.data.length === 0)) {
          console.warn(`[WARN] Modo GLOBAL: respuesta vacía para filterType='${filterType}'.`);
        }
      } else {
        // === MODO VENDEDOR ESPECÍFICO ===
        const vendorId = vendorSeleccionado as number;
        if (filterType === 'date') {
          const target = selectedDate || today;
          console.log(`[FETCH] Modo: VENDOR | getByVendorAndDate(${vendorId}, ${target})`);
          response = await menuItemService.getByVendorAndDate(vendorId, target);
        } else if (filterType === 'today') {
          console.log(`[FETCH] Modo: VENDOR | getByVendorAndDate(${vendorId}, ${today})`);
          response = await menuItemService.getByVendorAndDate(vendorId, today);
        } else {
          // week OR all -> get full vendor history
          console.log(`[FETCH] Modo: VENDOR | getAllByVendor(${vendorId})`);
          response = await menuItemService.getAllByVendor(vendorId);
        }
      }

      // Mantener normalización y guillotina
      const normalized = normalizeMenuItems(response?.data || []);

      const filtered = normalized.filter((item: any) => {
        if (!item.isAvailable) return false;
        if (item.stock !== undefined && Number(item.stock) <= 0) return false;
        if (!item.date) return true; // keep undated (permanent) items

        const itemDate = String(item.date).split('T')[0];
        if (filterType === 'date') return itemDate === selectedDate;
        if (itemDate < today) return false;
        if (filterType === 'week' && itemDate > sunday) return false;
        return true;
      });

      filtered.sort((a: any, b: any) => {
        const aDate = a.date ? String(a.date).split('T')[0] : '';
        const bDate = b.date ? String(b.date).split('T')[0] : '';
        if (aDate === bDate) return 0;
        if (!aDate) return -1;
        if (!bDate) return 1;
        return aDate > bDate ? 1 : -1;
      });

      setMenuItems(filtered);
      setMenuItemsFiltrados(filtered);
    } catch (e) {
      console.error('[ERROR] cargarMenuItemsConFiltros', e);
      setMenuItems([]);
      setMenuItemsFiltrados([]);
    } finally {
      setLoading(false);
    }
  }, [filterType, selectedDate, vendorSeleccionado]);

  useEffect(() => { cargarMenuItemsConFiltros(); }, [cargarMenuItemsConFiltros, selectedWeekStart, selectedDate, vendorSeleccionado]);

  useEffect(() => {
    if (searchText.trim() === '') setMenuItemsFiltrados(menuItems);
    else {
      const textoBusqueda = searchText.toLowerCase().trim();
      const filtrados = menuItems.filter(item => {
        const nombre = item.itemName?.toLowerCase() || '';
        const descripcion = item.description?.toLowerCase() || '';
        const precio = item.price?.toLowerCase() || '';
        const nombreVendor = item.vendorName?.toLowerCase() || '';
        return nombre.includes(textoBusqueda) || descripcion.includes(textoBusqueda) || precio.includes(textoBusqueda) || nombreVendor.includes(textoBusqueda);
      });
      setMenuItemsFiltrados(filtrados);
    }
  }, [searchText, menuItems]);

  const onRefresh = async () => { setRefreshing(true); try { await cargarVendors(); await cargarMenuItemsConFiltros(); } catch (e) { } finally { setRefreshing(false); } };

  const handleAgregarAlCarrito = (menu: MenuItem) => { setModalReserva(menu); setCantidad(1); };
  const incrementarCantidad = () => { if (modalReserva && cantidad < modalReserva.stock) setCantidad(cantidad + 1); };
  const decrementarCantidad = () => { if (cantidad > 1) setCantidad(cantidad - 1); };

  const agregarAlCarrito = () => {
    if (!modalReserva) return;
    const reservationDate = modalReserva?.date ? (modalReserva.date.split('T')[0]) : (selectedDate || getTodayDate());
    const itemExistente = carrito.find(c => c.item.id === modalReserva.id && c.vendorId === modalReserva.vendorId && c.date === reservationDate);
    if (itemExistente) setCarrito(carrito.map(c => c.item.id === modalReserva.id && c.vendorId === modalReserva.vendorId && c.date === reservationDate ? { ...c, quantity: c.quantity + cantidad } : c));
    else setCarrito([...carrito, { item: modalReserva, quantity: cantidad, vendorId: modalReserva.vendorId, date: reservationDate }]);
    setModalReserva(null);
  };

  const confirmarPedido = () => { if (carrito.length === 0) { Alert.alert('Error', 'El carrito está vacío'); return; } setShowPaymentModal(true); };

  // payment logic kept intact
  const handlePaymentConfirm = async (paymentMethod: string) => {
    try {
      if (carrito.length === 0) { Alert.alert('Error', 'El carrito está vacío'); return; }
      const pedidosMap = new Map<string, OrderItem[]>();
      carrito.forEach(c => {
        const vendorId = c.vendorId || c.item.vendorId;
        const dateKey = c.date || '';
        const mapKey = `${vendorId}::${dateKey}`;
        if (!pedidosMap.has(mapKey)) pedidosMap.set(mapKey, []);
        pedidosMap.get(mapKey)!.push({ menuItemId: c.item.id!, quantity: c.quantity, // @ts-ignore
          date: dateKey } as any);
      });
      const pedidosCreados: Order[] = [];
      try {
        const pedidosPromises = Array.from(pedidosMap.entries()).map(async ([mapKey, items]) => {
          const [vendorIdStr, dateStr] = mapKey.split('::');
          const vendorId = parseInt(vendorIdStr, 10);
          const orderBody: any = { userId: usuarioId, vendorId: vendorId, paymentMethod: paymentMethod, items: items };
          if (dateStr) orderBody.date = dateStr.split('T')[0];
          const orderResponse = await orderService.create(orderBody);
          return orderResponse.data;
        });
        const resultados = await Promise.all(pedidosPromises);
        pedidosCreados.push(...resultados);
        if (pedidosCreados.length === 1) router.push({ pathname: '/(tabs)/pago-yape', params: { orderId: pedidosCreados[0].id!.toString(), total: calcularTotalCarrito().toString() } });
        else Alert.alert('Pedidos creados', `Se crearon ${pedidosCreados.length} pedidos. Ve a \"Mis Pedidos\" para pagar cada uno.`, [{ text: 'Ver Pedidos', onPress: () => { router.push('/(tabs)/mis-pedidos'); } }, { text: 'OK' }]);
        setCarrito([]); setShowPaymentModal(false);
      } catch (createError: any) {
        for (const pedido of pedidosCreados) { try { if (pedido.id) await orderService.cancel(pedido.id); } catch (cancelError) { } }
        throw createError;
      }
    } catch (error: any) { Alert.alert('Error', error.response?.data?.message || 'Error al realizar el pedido. El stock no se ha descontado.'); }
  };

  const eliminarDelCarrito = (itemId: number, vendorId?: number, dateArg?: string) => {
    if (vendorId && dateArg) setCarrito(carrito.filter(c => !(c.item.id === itemId && c.vendorId === vendorId && c.date === dateArg)));
    else if (vendorId) setCarrito(carrito.filter(c => !(c.item.id === itemId && c.vendorId === vendorId)));
    else setCarrito(carrito.filter(c => c.item.id !== itemId));
  };

  const calcularTotalCarrito = () => carrito.reduce((total, c) => total + (parseFloat(c.item.price) * c.quantity), 0);

  if (loading) return <Loading />;

  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isMobileUserAgent = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isMobileWeb = isWeb && (isMobileUserAgent || width < 768);
  const bottomPadding = isMobileWeb ? 88 : 0;

  const dynamicStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, paddingBottom: bottomPadding },
    scrollView: { flex: 1 },
    header: { padding: 20, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
    title: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 16 },
    filterContainer: { marginTop: 8 },
    filterLabel: { fontSize: 14, color: colors.text, marginBottom: 8 },
    filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.filterChipBackground, marginRight: 8, borderWidth: 1, borderColor: colors.border },
    filterChipActive: { backgroundColor: colors.filterChipActive, borderColor: colors.filterChipActive },
    filterChipHover: { backgroundColor: colors.filterChipHover, transform: [{ translateY: -1 }], shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
    filterChipText: { fontSize: 14, color: colors.text },
    filterChipTextActive: { fontWeight: 'bold' },
    carritoItemDate: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
    calendarContainer: { marginTop: 12, marginBottom: 8, backgroundColor: colors.cardBackground, borderRadius: 12, padding: 12 },
    calendar: { borderRadius: 10, marginTop: 8 },
    searchContainer: { padding: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center' },
    searchInput: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, backgroundColor: colors.inputBackground, color: colors.text },
    clearButton: { marginLeft: 8, padding: 8 },
    clearButtonText: { fontSize: 18, color: colors.textSecondary, fontWeight: 'bold' },
    menusContainer: { padding: 16 },
    emptyContainer: { padding: 40, alignItems: 'center' },
    emptyText: { fontSize: 16, color: colors.textSecondary, fontStyle: 'italic' },
    carritoContainer: { backgroundColor: colors.surface, borderTopWidth: 2, borderTopColor: colors.primary, padding: 20, maxHeight: 300, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
    carritoTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 12 },
    carritoItems: { maxHeight: 150, marginBottom: 12 },
    carritoItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
    carritoItemInfo: { flex: 1 },
    carritoItemText: { fontSize: 14, color: colors.text, fontWeight: '600' },
    carritoItemVendor: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    carritoItemPrice: { fontSize: 12, color: colors.text, marginTop: 2 },
    carritoItemDelete: { fontSize: 14, color: colors.danger, fontWeight: '600' },
    carritoTotal: { marginBottom: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
    carritoTotalText: { fontSize: 18, fontWeight: 'bold', color: colors.text },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: colors.cardBackground, borderRadius: 12, padding: 24, width: '90%', maxWidth: 400 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 16 },
    modalText: { fontSize: 14, color: colors.text, marginBottom: 8 },
    modalBold: { fontWeight: 'bold' },
    modalInputContainer: { marginVertical: 16 },
    modalLabel: { fontSize: 14, color: colors.text, marginBottom: 8, fontWeight: '600' },
    quantityContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 8 },
    quantityButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.text },
    quantityButtonDisabled: { backgroundColor: colors.inputBackground, borderColor: colors.border },
    quantityButtonText: { fontSize: 24, fontWeight: 'bold', color: colors.text },
    quantityText: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginHorizontal: 20, minWidth: 40, textAlign: 'center' },
    quantityButtonTextDisabled: { color: colors.textSecondary },
    modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, gap: 12 },
  });

  return (
    <View style={dynamicStyles.container}>
      <ScrollView style={dynamicStyles.scrollView} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {isMobileWeb && (
        <View style={dynamicStyles.header}>
          <Text style={dynamicStyles.title}>Menús Disponibles</Text>
          <View style={dynamicStyles.filterContainer}>
            <Text style={dynamicStyles.filterLabel}>Ver por:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity style={[dynamicStyles.filterChip, filterType === 'today' && dynamicStyles.filterChipActive, hoveredFilter === 'today' && Platform.OS === 'web' && dynamicStyles.filterChipHover]} onPress={() => setFilterType('today')} {...(Platform.OS === 'web' && { onMouseEnter: () => setHoveredFilter('today'), onMouseLeave: () => setHoveredFilter(null) })} className="filter-chip"><Text style={[dynamicStyles.filterChipText, filterType === 'today' && dynamicStyles.filterChipTextActive]}>Hoy</Text></TouchableOpacity>
              <TouchableOpacity style={[dynamicStyles.filterChip, filterType === 'week' && dynamicStyles.filterChipActive, hoveredFilter === 'week' && Platform.OS === 'web' && dynamicStyles.filterChipHover]} onPress={() => setFilterType('week')} {...(Platform.OS === 'web' && { onMouseEnter: () => setHoveredFilter('week'), onMouseLeave: () => setHoveredFilter(null) })} className="filter-chip"><Text style={[dynamicStyles.filterChipText, filterType === 'week' && dynamicStyles.filterChipTextActive]}>Esta Semana</Text></TouchableOpacity>
              <TouchableOpacity style={[dynamicStyles.filterChip, filterType === 'all' && dynamicStyles.filterChipActive, hoveredFilter === 'all' && Platform.OS === 'web' && dynamicStyles.filterChipHover]} onPress={() => setFilterType('all')} {...(Platform.OS === 'web' && { onMouseEnter: () => setHoveredFilter('all'), onMouseLeave: () => setHoveredFilter(null) })} className="filter-chip"><Text style={[dynamicStyles.filterChipText, filterType === 'all' && dynamicStyles.filterChipTextActive]}>Todos</Text></TouchableOpacity>
              <TouchableOpacity style={[dynamicStyles.filterChip, filterType === 'date' && dynamicStyles.filterChipActive, hoveredFilter === 'date' && Platform.OS === 'web' && dynamicStyles.filterChipHover]} onPress={() => setFilterType('date')} {...(Platform.OS === 'web' && { onMouseEnter: () => setHoveredFilter('date'), onMouseLeave: () => setHoveredFilter(null) })} className="filter-chip"><Text style={[dynamicStyles.filterChipText, filterType === 'date' && dynamicStyles.filterChipTextActive]}>Fecha Específica</Text></TouchableOpacity>
            </ScrollView>
          </View>

          {filterType === 'date' && (
            <View style={dynamicStyles.calendarContainer}>
              <Text style={dynamicStyles.filterLabel}>Selecciona una fecha:</Text>
              <Card style={{ padding: 0 }}>
                <Calendar key={isDark ? 'dark' : 'light'} current={selectedDate} onDayPress={(day) => setSelectedDate(day.dateString)} markedDates={{ [selectedDate]: { selected: true, selectedColor: '#BEE0E7', selectedTextColor: '#524E4E' } }} theme={{ backgroundColor: colors.cardBackground, calendarBackground: colors.cardBackground, textSectionTitleColor: colors.textSecondary, selectedDayBackgroundColor: colors.primary, selectedDayTextColor: colors.text, todayTextColor: colors.primary, dayTextColor: colors.text, textDisabledColor: colors.textSecondary, dotColor: colors.primary, selectedDotColor: colors.text, arrowColor: colors.primary, monthTextColor: colors.text, indicatorColor: colors.primary, textDayFontWeight: '500', textMonthFontWeight: 'bold', textDayHeaderFontWeight: '600', textDayFontSize: 14, textMonthFontSize: 16, textDayHeaderFontSize: 13 }} style={[dynamicStyles.calendar, { backgroundColor: colors.cardBackground }]} minDate={getTodayDate()} />
              </Card>
            </View>
          )}

          {vendors.length > 0 && (
            <View style={dynamicStyles.filterContainer}>
              <Text style={dynamicStyles.filterLabel}>Vendedor:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {vendors.map(vendor => (
                  <TouchableOpacity key={vendor.id} style={[dynamicStyles.filterChip, vendorSeleccionado === vendor.id && dynamicStyles.filterChipActive, hoveredFilter === `vendor-${vendor.id}` && Platform.OS === 'web' && dynamicStyles.filterChipHover]} onPress={() => setVendorSeleccionado(vendor.id || null)} {...(Platform.OS === 'web' && { onMouseEnter: () => setHoveredFilter(`vendor-${vendor.id}`), onMouseLeave: () => setHoveredFilter(null) })} className="filter-chip"><Text style={[dynamicStyles.filterChipText, vendorSeleccionado === vendor.id && dynamicStyles.filterChipTextActive]}>{vendor.name}</Text></TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
        )}

        {isMobileWeb && (
          <View style={dynamicStyles.searchContainer}>
            <TextInput style={dynamicStyles.searchInput} placeholder="Buscar por nombre, descripción, precio o vendor..." value={searchText} onChangeText={setSearchText} placeholderTextColor={colors.textSecondary} />
            {searchText.length > 0 && (<TouchableOpacity style={dynamicStyles.clearButton} onPress={() => setSearchText('')}><Text style={dynamicStyles.clearButtonText}>✕</Text></TouchableOpacity>)}
          </View>
        )}

        {menuItemsFiltrados.length === 0 ? (
          <View style={dynamicStyles.emptyContainer}><Text style={dynamicStyles.emptyText}>{searchText.trim() ? 'No se encontraron menús que coincidan con la búsqueda' : 'No hay items disponibles'}</Text></View>
        ) : (
          <View style={dynamicStyles.menusContainer}>{menuItemsFiltrados.map(menu => <MenuCard key={`${menu.id}-${menu.date || 'no-date'}`} menu={menu} onReservar={handleAgregarAlCarrito} />)}</View>
        )}
      </ScrollView>

      {carrito.length > 0 && (
        <View style={dynamicStyles.carritoContainer}>
          <Text style={dynamicStyles.carritoTitle}>Carrito ({carrito.length} items)</Text>
          <ScrollView style={dynamicStyles.carritoItems}>
            {carrito.map((c, index) => {
              const uniqueKey = `carrito-${c.item.id}-${c.vendorId}-${c.date || 'no-date'}-${index}`;
              return (
                <View key={uniqueKey} style={dynamicStyles.carritoItem}>
                  <View style={dynamicStyles.carritoItemInfo}>
                    <Text style={dynamicStyles.carritoItemText}>{c.quantity}x {c.item.itemName}</Text>
                    {c.item.vendorName && <Text style={dynamicStyles.carritoItemVendor}>Vendedor: {c.item.vendorName}</Text>}
                    <Text style={dynamicStyles.carritoItemPrice}>S/ {parseFloat(c.item.price).toFixed(2)} c/u</Text>
                    {c.date && <Text style={dynamicStyles.carritoItemDate}>Fecha reserva: {new Date(c.date).toLocaleDateString()}</Text>}
                  </View>
                  <TouchableOpacity onPress={() => eliminarDelCarrito(c.item.id!, c.vendorId, c.date)}><Text style={dynamicStyles.carritoItemDelete}>Eliminar</Text></TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>
          <View style={dynamicStyles.carritoTotal}><Text style={dynamicStyles.carritoTotalText}>Total: S/ {calcularTotalCarrito().toFixed(2)}</Text></View>
          <Button variant="primary" onPress={confirmarPedido}>Confirmar Pedido</Button>
        </View>
      )}

      <Modal visible={modalReserva !== null} transparent animationType="slide" onRequestClose={() => setModalReserva(null)}>
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
                    <TouchableOpacity style={[dynamicStyles.quantityButton, cantidad <= 1 && dynamicStyles.quantityButtonDisabled]} onPress={decrementarCantidad} disabled={cantidad <= 1}><Text style={dynamicStyles.quantityButtonText}>-</Text></TouchableOpacity>
                    <Text style={dynamicStyles.quantityText}>{cantidad}</Text>
                    <TouchableOpacity style={[dynamicStyles.quantityButton, cantidad >= modalReserva.stock && dynamicStyles.quantityButtonDisabled]} onPress={incrementarCantidad} disabled={cantidad >= modalReserva.stock}><Text style={dynamicStyles.quantityButtonText}>+</Text></TouchableOpacity>
                  </View>
                  <Text style={dynamicStyles.modalText}>Stock disponible: {modalReserva.stock} unidades</Text>
                </View>
                <Text style={dynamicStyles.modalText}><Text style={dynamicStyles.modalBold}>Subtotal:</Text> S/ {(parseFloat(modalReserva.price) * cantidad).toFixed(2)}</Text>
              </>
            )}
            <View style={dynamicStyles.modalActions}><Button variant="secondary" onPress={() => setModalReserva(null)}>Cancelar</Button><Button variant="primary" onPress={agregarAlCarrito}>Agregar al Carrito</Button></View>
          </View>
        </View>
      </Modal>

      <PaymentModal visible={showPaymentModal} total={calcularTotalCarrito()} vendorId={carrito.length > 0 ? (carrito[0].vendorId || carrito[0].item.vendorId) : 0} onClose={() => setShowPaymentModal(false)} onConfirm={handlePaymentConfirm} />
    </View>
  );
}


