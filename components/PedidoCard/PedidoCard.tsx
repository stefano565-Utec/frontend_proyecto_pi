import React from 'react';
import { View, Text, Platform } from 'react-native';
import { format } from 'date-fns';
import type { Order } from '../../types';
import { useTheme } from '../../context';
import Card from '../Card/Card';
import Button from '../Button/Button';
import './PedidoCard.css';

interface PedidoCardProps {
  pedido: Order;
  onCancelar?: (id: number) => void;
  onDarFeedback?: (pedido: Order) => void;
  onPagar?: (pedido: Order) => void;
  paying?: boolean;
  hasFeedback?: boolean;
}

const PedidoCard: React.FC<PedidoCardProps> = ({ 
  pedido, 
  onCancelar, 
  onDarFeedback, 
  onPagar, 
  paying = false,
  hasFeedback = false
}) => {
  const { colors } = useTheme();
  const isWeb = Platform.OS === 'web';

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE_PAGO':
        return 'Pendiente de Pago';
      case 'PAGADO':
        return 'Pagado';
      case 'LISTO_PARA_RECOJO':
        return 'Listo para Recojo';
      case 'COMPLETADO':
        return 'Completado';
      case 'CANCELADO':
        return 'Cancelado';
      default:
        return estado;
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE_PAGO':
        return '#FFA500';
      case 'PAGADO':
        return '#4CAF50';
      case 'LISTO_PARA_RECOJO':
        return '#2196F3';
      case 'COMPLETADO':
        return '#8BC34A';
      case 'CANCELADO':
        return '#F44336';
      default:
        return '#524E4E';
    }
  };

  const calcularTotal = () => {
    if (!pedido.items || pedido.items.length === 0) return '0.00';
    return pedido.items.reduce((total, item) => {
      return total + (parseFloat(item.price) * item.quantity);
    }, 0).toFixed(2);
  };

  const dynamicStyles = {
    card: {
      marginBottom: 16,
    },
    header: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: 12,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold' as const,
      color: colors.text,
    },
    estadoBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    estadoText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600' as const,
    },
    infoRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      marginBottom: 8,
    },
    label: {
      fontSize: 14,
      color: colors.text,
    },
    value: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500' as const,
    },
    total: {
      fontSize: 16,
      fontWeight: 'bold' as const,
      color: colors.text,
    },
    itemsContainer: {
      marginBottom: 12,
    },
    itemText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginLeft: 8,
      marginTop: 4,
    },
    actions: {
      flexDirection: 'row' as const,
      gap: 8,
      marginTop: 12,
    },
    pickupCodeContainer: {
      marginTop: 12,
      padding: 12,
      backgroundColor: colors.inputBackground,
      borderRadius: 8,
      alignItems: 'center' as const,
    },
    pickupCodeLabel: {
      fontSize: 12,
      color: colors.text,
      marginBottom: 8,
      fontWeight: '600' as const,
    },
    pickupCodeBox: {
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: colors.primary,
      borderStyle: 'dashed' as const,
    },
    pickupCode: {
      fontSize: 24,
      fontWeight: 'bold' as const,
      color: colors.text,
      letterSpacing: 4,
      fontFamily: 'monospace',
    },
    paymentMethod: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 8,
      opacity: 0.8,
    },
  };

  return (
    <Card style={dynamicStyles.card} className={isWeb ? 'pedido-card' : undefined}>
      <View style={dynamicStyles.header} className={isWeb ? 'pedido-card__header' : undefined}>
        <Text style={dynamicStyles.title} className={isWeb ? 'pedido-card__title' : undefined}>
          Pedido #{pedido.id}
        </Text>
        <View 
          style={[dynamicStyles.estadoBadge, { backgroundColor: getEstadoColor(pedido.status) }]}
          className={isWeb ? 'pedido-card__estado-badge' : undefined}
        >
          <Text style={dynamicStyles.estadoText} className={isWeb ? 'pedido-card__estado-text' : undefined}>
            {getEstadoLabel(pedido.status)}
          </Text>
        </View>
      </View>
      
      {pedido.userName && (
        <View style={dynamicStyles.infoRow} className={isWeb ? 'pedido-card__info-row' : undefined}>
          <Text style={dynamicStyles.label} className={isWeb ? 'pedido-card__label' : undefined}>Cliente:</Text>
          <Text style={dynamicStyles.value} className={isWeb ? 'pedido-card__value' : undefined}>
            {pedido.userName}
          </Text>
        </View>
      )}
      
      {pedido.vendorName && (
        <View style={dynamicStyles.infoRow} className={isWeb ? 'pedido-card__info-row' : undefined}>
          <Text style={dynamicStyles.label} className={isWeb ? 'pedido-card__label' : undefined}>Vendedor:</Text>
          <Text style={dynamicStyles.value} className={isWeb ? 'pedido-card__value' : undefined}>
            {pedido.vendorName}
          </Text>
        </View>
      )}
      
      {pedido.items && pedido.items.length > 0 && (
        <View style={dynamicStyles.itemsContainer} className={isWeb ? 'pedido-card__items-container' : undefined}>
          <Text style={dynamicStyles.label} className={isWeb ? 'pedido-card__label' : undefined}>Items:</Text>
          {pedido.items.map((item, index) => (
            <Text key={index} style={dynamicStyles.itemText} className={isWeb ? 'pedido-card__item-text' : undefined}>
              {item.quantity}x {item.itemName} - S/ {item.price}
            </Text>
          ))}
        </View>
      )}
      
      <View style={dynamicStyles.infoRow} className={isWeb ? 'pedido-card__info-row' : undefined}>
        <Text style={dynamicStyles.label} className={isWeb ? 'pedido-card__label' : undefined}>Total:</Text>
        <Text style={dynamicStyles.total} className={isWeb ? 'pedido-card__total' : undefined}>
          S/ {calcularTotal()}
        </Text>
      </View>
      
      {pedido.pickup_time && (
        <View style={dynamicStyles.infoRow} className={isWeb ? 'pedido-card__info-row' : undefined}>
          <Text style={dynamicStyles.label} className={isWeb ? 'pedido-card__label' : undefined}>Hora de Recojo:</Text>
          <Text style={dynamicStyles.value} className={isWeb ? 'pedido-card__value' : undefined}>
            {format(new Date(pedido.pickup_time), "dd/MM/yyyy HH:mm")}
          </Text>
        </View>
      )}
      
      {pedido.pickupCode && (
        <View style={dynamicStyles.pickupCodeContainer} className={isWeb ? 'pedido-card__pickup-code-container' : undefined}>
          <Text style={dynamicStyles.pickupCodeLabel} className={isWeb ? 'pedido-card__pickup-code-label' : undefined}>
            Código de Recogida:
          </Text>
          <View style={dynamicStyles.pickupCodeBox} className={isWeb ? 'pedido-card__pickup-code-box' : undefined}>
            <Text style={dynamicStyles.pickupCode} className={isWeb ? 'pedido-card__pickup-code' : undefined}>
              {pedido.pickupCode}
            </Text>
          </View>
          {pedido.paymentMethod && (
            <Text style={dynamicStyles.paymentMethod} className={isWeb ? 'pedido-card__payment-method' : undefined}>
              Pagado con: {pedido.paymentMethod === 'YAPE' ? '💚 Yape' : '💙 Plin'}
            </Text>
          )}
        </View>
      )}
      
      <View style={dynamicStyles.actions} className={isWeb ? 'pedido-card__actions' : undefined}>
        {pedido.status === 'PENDIENTE_PAGO' && onPagar && pedido.id && (
          <Button 
            variant="primary" 
            size="small" 
            loading={paying}
            disabled={paying}
            onPress={() => {
              if (onPagar && pedido.id && !paying) {
                onPagar(pedido);
              }
            }}
          >
            {paying ? 'Pagando...' : 'Pagar Pedido'}
          </Button>
        )}
        
        {pedido.status === 'PENDIENTE_PAGO' && onCancelar && pedido.id && (
          <Button variant="danger" size="small" onPress={() => onCancelar(pedido.id!)}>
            Cancelar Pedido
          </Button>
        )}
        
        {pedido.status === 'COMPLETADO' && onDarFeedback && (
          <Button 
            variant="secondary" 
            size="small" 
            onPress={() => onDarFeedback(pedido)}
            disabled={hasFeedback}
          >
            {hasFeedback ? 'Ya comentaste' : 'Dar Feedback'}
          </Button>
        )}

      </View>
    </Card>
  );
};

export default PedidoCard;
