import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, RefreshControl, TextInput, TouchableOpacity, Platform } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { feedbackService, userService } from '../../services';
import { useAuth, useTheme } from '../../context';
import type { Feedback } from '../../types';
import { Loading, Card } from '../../components';

type FiltroFecha = 'todos' | 'hoy' | 'semana' | 'mes';

export default function ComentariosScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [comentarios, setComentarios] = useState<Feedback[]>([]);
  const [comentariosFiltrados, setComentariosFiltrados] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vendorId, setVendorId] = useState<number | null>(null);
  const [searchText, setSearchText] = useState('');
  const [filtroFecha, setFiltroFecha] = useState<FiltroFecha>('todos');
  const [filtroRating, setFiltroRating] = useState<number | null>(null);
  const [hoveredFilter, setHoveredFilter] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role?.toUpperCase() === 'VENDOR') {
      cargarVendorId();
    } else {
      cargarComentarios();
    }
  }, [user]);

  const cargarVendorId = async () => {
    try {
      setLoading(true);
      const response = await userService.getCurrentUser();
      if (response.data.vendorId) {
        setVendorId(response.data.vendorId);
        cargarComentariosVendor(response.data.vendorId);
      } else {
        Alert.alert('Error', 'No tienes un vendor asignado');
        setLoading(false);
      }
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo cargar la información del vendor');
      setLoading(false);
    }
  };

  const cargarComentariosVendor = async (id: number) => {
    try {
      setLoading(true);
      const response = await feedbackService.getByVendor(id);
      
      if (!response || !response.data) {
        throw new Error('Respuesta inválida del servidor: sin data');
      }
      
      if (!Array.isArray(response.data)) {
        throw new Error('Respuesta inválida del servidor: data no es un array');
      }
      
      setComentarios(response.data);
      setComentariosFiltrados(response.data);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error ||
                          error.message || 
                          'Error desconocido al cargar comentarios';
      Alert.alert('Error', `No se pudieron cargar los comentarios: ${errorMessage}`);
      setComentarios([]);
      setComentariosFiltrados([]);
    } finally {
      setLoading(false);
    }
  };

  const cargarComentarios = async () => {
    try {
      setLoading(true);
      const response = await feedbackService.getAll();
      
      if (!response || !response.data) {
        throw new Error('Respuesta inválida del servidor: sin data');
      }
      
      if (!Array.isArray(response.data)) {
        throw new Error('Respuesta inválida del servidor: data no es un array');
      }
      
      setComentarios(response.data);
      setComentariosFiltrados(response.data);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error ||
                          error.message || 
                          'Error desconocido al cargar comentarios';
      Alert.alert('Error', `No se pudieron cargar los comentarios: ${errorMessage}`);
      setComentarios([]);
      setComentariosFiltrados([]);
    } finally {
      setLoading(false);
    }
  };

  const esFechaEnRango = (fechaStr: string | undefined, rango: FiltroFecha): boolean => {
    if (rango === 'todos') return true;
    if (!fechaStr) return false;
    
    try {
      const fecha = new Date(fechaStr);
      if (isNaN(fecha.getTime())) return false;
      
      const ahora = new Date();
      const inicioDia = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
      inicioDia.setHours(0, 0, 0, 0);
      
      switch (rango) {
        case 'hoy':
          return fecha >= inicioDia;
        case 'semana':
          const inicioSemana = new Date(inicioDia);
          inicioSemana.setDate(inicioDia.getDate() - inicioDia.getDay());
          return fecha >= inicioSemana;
        case 'mes':
          const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
          inicioMes.setHours(0, 0, 0, 0);
          return fecha >= inicioMes;
        default:
          return true;
      }
    } catch {
      return false;
    }
  };

  useEffect(() => {
    let filtrados = comentarios;
    
    if (searchText.trim()) {
      const textoBusqueda = searchText.toLowerCase().trim();
      filtrados = filtrados.filter(c => {
        const comentario = c.comment?.toLowerCase() || '';
        const itemName = c.itemName?.toLowerCase() || '';
        const vendorName = c.vendorName?.toLowerCase() || '';
        const rating = c.rating?.toString() || '';
        
        return comentario.includes(textoBusqueda) ||
               itemName.includes(textoBusqueda) ||
               vendorName.includes(textoBusqueda) ||
               rating.includes(textoBusqueda);
      });
    }
    
    if (filtroFecha !== 'todos') {
      filtrados = filtrados.filter(c => esFechaEnRango(c.createdAt, filtroFecha));
    }
    
    if (filtroRating !== null) {
      filtrados = filtrados.filter(c => c.rating === filtroRating);
    }
    
    setComentariosFiltrados(filtrados);
  }, [searchText, filtroFecha, filtroRating, comentarios]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (user?.role?.toUpperCase() === 'VENDOR' && vendorId) {
        await cargarComentariosVendor(vendorId);
      } else {
        await cargarComentarios();
      }
    } catch (error) {
      // Error silencioso en refresh
    } finally {
      setRefreshing(false);
    }
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
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      opacity: 0.7,
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
    filtersContainer: {
      padding: 16,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    filtersLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    filtersScroll: {
      marginHorizontal: -16,
      paddingHorizontal: 16,
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
    filterStarsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    starsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    starIcon: {
      marginRight: 4,
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
    comentariosContainer: {
      padding: 16,
    },
    comentarioCard: {
      marginBottom: 16,
    },
    comentarioHeader: {
      marginBottom: 12,
    },
    userName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    itemName: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    vendorName: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    comment: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },
  });

  const renderStars = (rating: number) => {
    return (
      <View style={dynamicStyles.starsContainer}>
        {[1, 2, 3, 4, 5].map((num) => (
          <FontAwesome
            key={num}
            name={num <= rating ? 'star' : 'star-o'}
            size={16}
            color={num <= rating ? '#FFD700' : colors.border}
            style={dynamicStyles.starIcon}
          />
        ))}
      </View>
    );
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <ScrollView 
      style={dynamicStyles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.title}>
          {user?.role?.toUpperCase() === 'VENDOR' ? 'Comentarios de Mis Menús' : 'Comentarios de Usuarios'}
        </Text>
        <Text style={dynamicStyles.subtitle}>
          {comentariosFiltrados.length} de {comentarios.length} comentarios {user?.role?.toUpperCase() === 'VENDOR' ? 'de mis menús' : 'totales'}
        </Text>
      </View>

      <View style={dynamicStyles.searchContainer}>
        <TextInput
          style={dynamicStyles.searchInput}
          placeholder="Buscar por comentario, menú, vendedor o calificación..."
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

      <View style={dynamicStyles.filtersContainer}>
        <Text style={dynamicStyles.filtersLabel}>Filtrar por fecha:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={dynamicStyles.filtersScroll}>
          {(['todos', 'hoy', 'semana', 'mes'] as FiltroFecha[]).map((fecha) => (
            <TouchableOpacity
              key={fecha}
              style={[
                dynamicStyles.filterChip,
                filtroFecha === fecha && dynamicStyles.filterChipActive,
                hoveredFilter === `fecha-${fecha}` && Platform.OS === 'web' && dynamicStyles.filterChipHover
              ]}
              onPress={() => setFiltroFecha(fecha)}
              {...(Platform.OS === 'web' && {
                onMouseEnter: () => setHoveredFilter(`fecha-${fecha}`),
                onMouseLeave: () => setHoveredFilter(null),
              })}
              className="filter-chip"
            >
              <Text style={[dynamicStyles.filterChipText, filtroFecha === fecha && dynamicStyles.filterChipTextActive]}>
                {fecha === 'todos' ? 'Todos' : fecha === 'hoy' ? 'Hoy' : fecha === 'semana' ? 'Esta Semana' : 'Este Mes'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={dynamicStyles.filtersContainer}>
        <Text style={dynamicStyles.filtersLabel}>Filtrar por calificación:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={dynamicStyles.filtersScroll}>
          <TouchableOpacity
            style={[
              dynamicStyles.filterChip,
              filtroRating === null && dynamicStyles.filterChipActive,
              hoveredFilter === 'rating-all' && Platform.OS === 'web' && dynamicStyles.filterChipHover
            ]}
            onPress={() => setFiltroRating(null)}
            {...(Platform.OS === 'web' && {
              onMouseEnter: () => setHoveredFilter('rating-all'),
              onMouseLeave: () => setHoveredFilter(null),
            })}
            className="filter-chip"
          >
            <Text style={[dynamicStyles.filterChipText, filtroRating === null && dynamicStyles.filterChipTextActive]}>
              Todas
            </Text>
          </TouchableOpacity>
          {[5, 4, 3, 2, 1].map((rating) => (
            <TouchableOpacity
              key={rating}
              style={[
                dynamicStyles.filterChip,
                filtroRating === rating && dynamicStyles.filterChipActive,
                hoveredFilter === `rating-${rating}` && Platform.OS === 'web' && dynamicStyles.filterChipHover
              ]}
              onPress={() => setFiltroRating(filtroRating === rating ? null : rating)}
              {...(Platform.OS === 'web' && {
                onMouseEnter: () => setHoveredFilter(`rating-${rating}`),
                onMouseLeave: () => setHoveredFilter(null),
              })}
              className="filter-chip"
            >
              <View style={dynamicStyles.filterStarsContainer}>
                {[1, 2, 3, 4, 5].map((num) => (
                  <FontAwesome
                    key={num}
                    name={num <= rating ? 'star' : 'star-o'}
                    size={14}
                    color={num <= rating ? '#FFD700' : '#E0E0E0'}
                  />
                ))}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {comentarios.length === 0 ? (
        <View style={dynamicStyles.emptyContainer}>
          <Text style={dynamicStyles.emptyText}>No hay comentarios disponibles</Text>
        </View>
      ) : comentariosFiltrados.length === 0 ? (
        <View style={dynamicStyles.emptyContainer}>
          <Text style={dynamicStyles.emptyText}>
            {searchText.trim() || filtroFecha !== 'todos' || filtroRating !== null 
              ? 'No se encontraron comentarios que coincidan con los filtros' 
              : 'No hay comentarios disponibles'}
          </Text>
        </View>
      ) : (
        <View style={dynamicStyles.comentariosContainer}>
          {comentariosFiltrados.map((comentario) => (
            <Card key={comentario.id} style={dynamicStyles.comentarioCard}>
              <View style={dynamicStyles.comentarioHeader}>
                <View>
                  <Text style={dynamicStyles.userName}>Usuario Anónimo</Text>
                  {comentario.itemName && (
                    <Text style={dynamicStyles.itemName}>Menú: {comentario.itemName}</Text>
                  )}
                  {comentario.vendorName && (
                    <Text style={dynamicStyles.vendorName}>Vendedor: {comentario.vendorName}</Text>
                  )}
                </View>
                {renderStars(comentario.rating)}
              </View>
              {comentario.comment && (
                <Text style={dynamicStyles.comment}>{comentario.comment}</Text>
              )}
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

// Estilos estáticos eliminados - se usan dynamicStyles

