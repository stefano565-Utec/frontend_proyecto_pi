import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Modal, TextInput, TouchableOpacity, RefreshControl } from 'react-native';
import { useDialog } from '../components/DialogProvider';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { orderService, feedbackService, paymentService } from '../../services';
import { useAuth, useTheme } from '../../context';
import type { Order } from '../../types';
import { Button, Loading, PedidoCard } from '../../components';

export default function MisPedidosScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [pedidos, setPedidos] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingOrderId, setPayingOrderId] = useState<number | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null);
  const usuarioId = user?.id || 0;
  const [modalFeedback, setModalFeedback] = useState<Order | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [pedidosConFeedback, setPedidosConFeedback] = useState<Set<number>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (usuarioId) {
      cargarPedidos();
      cargarFeedbacks();
    }
  }, [usuarioId]);

  const cargarPedidos = async () => {
    try {
      setLoading(true);
      const response = await orderService.getByUserId(usuarioId);
      setPedidos(response.data);
    } catch (error) {
      // Error silencioso en carga de pedidos
    } finally {
      setLoading(false);
    }
  };

  const cargarFeedbacks = async () => {
    try {
      const response = await feedbackService.getByUser(usuarioId);
      const pedidosConFeedbackSet = new Set<number>();
      response.data.forEach((feedback) => {
        if (feedback.orderId) {
          pedidosConFeedbackSet.add(feedback.orderId);
        }
      });
      setPedidosConFeedback(pedidosConFeedbackSet);
    } catch (error) {
      // Error silencioso en carga de feedbacks
    }
  };

  const dialog = useDialog();

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([cargarPedidos(), cargarFeedbacks()]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCancelar = async (id: number) => {

    if (!usuarioId) {
      await dialog.showAlert('Error', 'Por favor inicia sesión para poder cancelar el pedido');
      return;
    }

    const confirmed = await dialog.showConfirm(
      'Cancelar Pedido',
      '¿Estás seguro de cancelar este pedido? Se devolverá el stock y el pedido será cancelado.'
    );

    if (!confirmed) return;

    setCancellingOrderId(id);
    try {
      await orderService.cancel(id);
      await dialog.showAlert('Éxito', 'Pedido cancelado correctamente. El stock ha sido devuelto.');
      await cargarPedidos();
    } catch (error: any) {
      if (error.response?.status === 401) {
        await dialog.showAlert('Error', 'No autorizado. Por favor inicia sesión e inténtalo de nuevo.');
      } else {
        const errorMessage = error.response?.data?.message || 
                            error.response?.data?.error || 
                            error.message || 
                            'Error al cancelar el pedido';
        await dialog.showAlert('Error', errorMessage);
      }
    } finally {
      setCancellingOrderId(null);
    }
  };

  const handlePagar = async (pedido: Order) => {
    if (!pedido.id || !pedido.vendorId) {
      await dialog.showAlert('Error', 'Información del pedido incompleta');
      return;
    }

    if (payingOrderId === pedido.id) {
      return;
    }

    setPayingOrderId(pedido.id);

    try {
      const total = pedido.items?.reduce((sum, item) => 
        sum + (parseFloat(item.price) * item.quantity), 0
      ) || 0;

      // Todos los pagos usan Yape ahora
      router.push({
        pathname: '/(tabs)/pago-yape',
        params: {
          orderId: pedido.id.toString(),
          total: total.toFixed(2),
        },
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Error al crear el pago';
      await dialog.showAlert('Error', errorMessage);
    } finally {
      setPayingOrderId(null);
    }
  };

  const handleDarFeedback = async (pedido: Order) => {
    if (pedido.id && pedidosConFeedback.has(pedido.id)) {
      await dialog.showAlert('Ya has comentado', 'Solo puedes dejar un comentario por pedido. Ya has enviado un comentario para este pedido.');
      return;
    }
    setModalFeedback(pedido);
    setRating(5);
    setComment('');
  };

  const confirmarFeedback = async () => {
    if (!modalFeedback || !modalFeedback.id) return;

    // El backend requiere menuItemId, usar el primer item del pedido si existe
    const firstMenuItemId = modalFeedback.items && modalFeedback.items.length > 0 
      ? modalFeedback.items[0].menuItemId 
      : undefined;

    if (!firstMenuItemId) {
      await dialog.showAlert('Error', 'El pedido no tiene items para comentar');
      return;
    }

    // Optimistically close the modal so it disappears immediately on web
    const currentModal = modalFeedback;
    const closedPedidoId = modalFeedback.id;
    setModalFeedback(null);

    try {
      const payload = {
        rating,
        comment: comment || undefined,
        userId: usuarioId,
        orderId: closedPedidoId,
        menuItemId: firstMenuItemId,
      };
      console.log('Enviando feedback payload:', payload);
      await feedbackService.create(payload);

      // Immediately add to set so button disables and prevents double-submit
      if (closedPedidoId) {
        setPedidosConFeedback(prev => new Set(prev).add(closedPedidoId));
      }

      await dialog.showAlert('Éxito', '¡Feedback enviado con éxito!');
      cargarPedidos();
      cargarFeedbacks();
    } catch (error: any) {
      console.error('Error al enviar feedback:', error);

      // Show the error dialog while the feedback modal is closed so it appears on top
      // Manejar error de ngrok / servidor no disponible
      if (error && (error as any).isNgrokError) {
        await dialog.showAlert('Error', error.message || 'Error de conexión con el servidor');
        // Re-open modal so user can retry after dismissing the alert
        setModalFeedback(currentModal);
        return;
      }

      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error ||
                          error?.message ||
                          'Error al enviar el feedback';

      await dialog.showAlert('Error', errorMessage);
      // Re-open modal so user can retry after dismissing the alert
      setModalFeedback(currentModal);
    }
  };


  // Agrupar pedidos por estado
  const pedidosPendientes = pedidos.filter(p => p.status === 'PENDIENTE_PAGO');
  const pedidosPagados = pedidos.filter(p => p.status === 'PAGADO');
  const pedidosListos = pedidos.filter(p => p.status === 'LISTO_PARA_RECOJO');
  const pedidosCompletados = pedidos.filter(p => p.status === 'COMPLETADO');
  const pedidosCancelados = pedidos.filter(p => p.status === 'CANCELADO');

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
    },
    pedidosContainer: {
      padding: 16,
    },
    pedidoWrapper: {
      marginBottom: 16,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 12,
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
      marginBottom: 16,
    },
    modalBold: {
      fontWeight: 'bold',
    },
    modalInputContainer: {
      marginBottom: 16,
    },
    modalLabel: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 8,
      fontWeight: '600',
    },
    ratingContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
      gap: 12,
    },
    ratingStarButton: {
      padding: 8,
    },
    ratingHint: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 8,
      textAlign: 'center',
      fontWeight: '500',
    },
    modalInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      backgroundColor: colors.inputBackground,
      color: colors.text,
    },
    modalTextArea: {
      height: 100,
      textAlignVertical: 'top',
    },
    modalActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 16,
    },
  });

  return (
    <View style={dynamicStyles.container}>
      <ScrollView style={dynamicStyles.scrollView} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
        <View style={dynamicStyles.header}>
          <Text style={dynamicStyles.title}>Mis Pedidos</Text>
        </View>

        {pedidos.length === 0 ? (
          <View style={dynamicStyles.emptyContainer}>
            <Text style={dynamicStyles.emptyText}>Aún no tienes pedidos realizados</Text>
          </View>
        ) : (
          <View style={dynamicStyles.pedidosContainer}>
            {pedidosPendientes.length > 0 && (
              <View style={dynamicStyles.section}>
                <Text style={dynamicStyles.sectionTitle}>Pendientes de Pago</Text>
                {pedidosPendientes.map(pedido => (
                  <View key={pedido.id} style={dynamicStyles.pedidoWrapper}>
                    <PedidoCard
                      pedido={pedido}
                      onCancelar={handleCancelar}
                      onPagar={() => handlePagar(pedido)}
                      paying={payingOrderId === pedido.id}
                      cancelling={cancellingOrderId === pedido.id}
                    />
                  </View>
                ))}
              </View>
            )}

            {pedidosPagados.length > 0 && (
              <View style={dynamicStyles.section}>
                <Text style={dynamicStyles.sectionTitle}>Pagados</Text>
                {pedidosPagados.map(pedido => (
                  <PedidoCard
                    key={pedido.id}
                    pedido={pedido}
                    onCancelar={handleCancelar}
                    onDarFeedback={handleDarFeedback}
                    hasFeedback={pedido.id ? pedidosConFeedback.has(pedido.id) : false}
                    cancelling={cancellingOrderId === pedido.id}
                  />
                ))}
              </View>
            )}

            {pedidosListos.length > 0 && (
              <View style={dynamicStyles.section}>
                <Text style={dynamicStyles.sectionTitle}>Listos para Recojo</Text>
                {pedidosListos.map(pedido => (
                  <PedidoCard
                    key={pedido.id}
                    pedido={pedido}
                    cancelling={cancellingOrderId === pedido.id}
                  />
                ))}
              </View>
            )}

            {pedidosCompletados.length > 0 && (
              <View style={dynamicStyles.section}>
                <Text style={dynamicStyles.sectionTitle}>Completados</Text>
                {pedidosCompletados.map(pedido => (
                  <PedidoCard
                    key={pedido.id}
                    pedido={pedido}
                    onDarFeedback={handleDarFeedback}
                    hasFeedback={pedido.id ? pedidosConFeedback.has(pedido.id) : false}
                    cancelling={cancellingOrderId === pedido.id}
                  />
                ))}
              </View>
            )}

            {pedidosCancelados.length > 0 && (
              <View style={dynamicStyles.section}>
                <Text style={dynamicStyles.sectionTitle}>Cancelados</Text>
                {pedidosCancelados.map(pedido => (
                  <PedidoCard
                    key={pedido.id}
                    pedido={pedido}
                    cancelling={cancellingOrderId === pedido.id}
                  />
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={modalFeedback !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setModalFeedback(null)}
      >
        <View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
            <Text style={dynamicStyles.modalTitle}>Dar Feedback</Text>
            {modalFeedback && (
              <>
                <Text style={dynamicStyles.modalText}>
                  <Text style={dynamicStyles.modalBold}>Pedido:</Text> #{modalFeedback.id}
                </Text>
                
                <View style={dynamicStyles.modalInputContainer}>
                  <Text style={dynamicStyles.modalLabel}>Calificación:</Text>
                  <View style={dynamicStyles.ratingContainer}>
                    {[1, 2, 3, 4, 5].map((num) => (
                      <TouchableOpacity
                        key={num}
                        style={dynamicStyles.ratingStarButton}
                        onPress={() => setRating(num)}
                        activeOpacity={0.7}
                      >
                        <FontAwesome
                          name={rating >= num ? 'star' : 'star-o'}
                          size={36}
                          color={rating >= num ? '#FFD700' : colors.border}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={dynamicStyles.ratingHint}>
                    {rating === 1 ? 'Muy malo' : 
                     rating === 2 ? 'Malo' : 
                     rating === 3 ? 'Regular' : 
                     rating === 4 ? 'Bueno' : 
                     rating === 5 ? 'Excelente' : 'Selecciona una calificación'}
                  </Text>
                </View>

                <View style={dynamicStyles.modalInputContainer}>
                  <Text style={dynamicStyles.modalLabel}>Comentario (opcional):</Text>
                  <TextInput
                    style={[dynamicStyles.modalInput, dynamicStyles.modalTextArea]}
                    value={comment}
                    onChangeText={setComment}
                    placeholder="Tu opinión sobre el pedido..."
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    numberOfLines={4}
                  />
                </View>
              </>
            )}

            <View style={dynamicStyles.modalActions}>
              <Button variant="secondary" onPress={() => setModalFeedback(null)}>
                Cancelar
              </Button>
              <Button variant="primary" onPress={confirmarFeedback}>
                Enviar Feedback
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}


