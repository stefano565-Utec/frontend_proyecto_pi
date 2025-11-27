import React from 'react';
import { View, Text, Platform } from 'react-native';
import type { MenuItem } from '../../types';
import { useTheme } from '../../context';
import Card from '../Card/Card';
import Button from '../Button/Button';
import './MenuCard.css';

// Función para obtener el nombre del día en español
const getDayName = (dateString?: string): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[date.getDay()];
  } catch (error) {
    return '';
  }
};

// Función para formatear la fecha
const formatDate = (dateString?: string): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    return `${day}/${month}`;
  } catch (error) {
    return '';
  }
};

interface MenuCardProps {
  menu: MenuItem;
  onReservar: (menu: MenuItem) => void;
}

const MenuCard: React.FC<MenuCardProps> = ({ menu, onReservar }) => {
  const { colors } = useTheme();
  const isWeb = Platform.OS === 'web';
  const dayName = getDayName(menu.date);
  const formattedDate = formatDate(menu.date);
  
  const dynamicStyles = {
    card: {
      marginBottom: 16,
    },
    header: {
      marginBottom: 8,
    },
    titleRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'flex-start' as const,
      marginBottom: 4,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold' as const,
      color: colors.text,
      flex: 1,
      marginRight: 8,
    },
    dayBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      alignItems: 'center' as const,
      minWidth: 80,
    },
    dayText: {
      fontSize: 12,
      fontWeight: 'bold' as const,
      color: colors.text,
    },
    dateText: {
      fontSize: 10,
      color: colors.text,
      opacity: 0.7,
      marginTop: 2,
    },
    vendor: {
      fontSize: 14,
      color: colors.primary,
      fontStyle: 'italic' as const,
    },
    description: {
      fontSize: 14,
      color: colors.textSecondary,
      fontStyle: 'italic' as const,
      marginBottom: 12,
    },
    info: {
      marginBottom: 12,
    },
    infoRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      marginBottom: 4,
    },
    label: {
      fontSize: 14,
      color: colors.text,
    },
    price: {
      fontSize: 16,
      fontWeight: 'bold' as const,
      color: colors.text,
    },
    stock: {
      fontSize: 14,
      color: colors.text,
    },
    stockEmpty: {
      color: colors.danger,
    },
  };
  
  return (
    <Card style={dynamicStyles.card} className={isWeb ? 'menu-card' : undefined}>
      <View style={dynamicStyles.header} className={isWeb ? 'menu-card__header' : undefined}>
        <View style={dynamicStyles.titleRow}>
          <Text style={dynamicStyles.title} className={isWeb ? 'menu-card__title' : undefined}>
            {menu.itemName}
          </Text>
          {dayName && (
            <View style={dynamicStyles.dayBadge}>
              <Text style={dynamicStyles.dayText}>{dayName}</Text>
              {formattedDate && (
                <Text style={dynamicStyles.dateText}>{formattedDate}</Text>
              )}
            </View>
          )}
        </View>
        {menu.vendorName && (
          <Text style={dynamicStyles.vendor} className={isWeb ? 'menu-card__vendor' : undefined}>
            {menu.vendorName}
          </Text>
        )}
      </View>
      
      {menu.description && (
        <Text style={dynamicStyles.description} className={isWeb ? 'menu-card__description' : undefined}>
          {menu.description}
        </Text>
      )}
      
      <View style={dynamicStyles.info} className={isWeb ? 'menu-card__info' : undefined}>
        <View style={dynamicStyles.infoRow} className={isWeb ? 'menu-card__info-row' : undefined}>
          <Text style={dynamicStyles.label} className={isWeb ? 'menu-card__label' : undefined}>Precio:</Text>
          <Text style={dynamicStyles.price} className={isWeb ? 'menu-card__price' : undefined}>
            S/ {parseFloat(menu.price).toFixed(2)}
          </Text>
        </View>
        
        <View style={dynamicStyles.infoRow} className={isWeb ? 'menu-card__info-row' : undefined}>
          <Text style={dynamicStyles.label} className={isWeb ? 'menu-card__label' : undefined}>Stock:</Text>
          <Text 
            style={[dynamicStyles.stock, (menu.stock === 0 || !menu.isAvailable) && dynamicStyles.stockEmpty]}
            className={isWeb ? `menu-card__stock ${(menu.stock === 0 || !menu.isAvailable) ? 'menu-card__stock--empty' : ''}` : undefined}
          >
            {menu.stock} unidades
          </Text>
        </View>
      </View>
      
      <Button
        variant="primary"
        onPress={() => onReservar(menu)}
        disabled={menu.stock === 0 || !menu.isAvailable}
      >
        {menu.stock === 0 || !menu.isAvailable ? 'Agotado' : 'Agregar al Pedido'}
      </Button>
    </Card>
  );
};

export default MenuCard;

