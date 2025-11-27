import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { dashboardService } from '../../services';
import type { DashboardStats } from '../../services/api';
import { Loading, Card } from '../../components';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context';

/**
 * Dashboard del administrador
 * Muestra estadísticas generales del sistema
 */
export default function DashboardScreen() {
  const { colors } = useTheme();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    cargarStats();
  }, []);

  const cargarStats = async () => {
    try {
      setLoading(true);
      const response = await dashboardService.getStats();
      setStats(response.data);
    } catch (error: any) {
      Alert.alert('Error', `No se pudieron cargar las estadísticas: ${error.response?.data?.message || error.message || 'Error desconocido'}`);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await cargarStats();
    } catch (error) {
      // Error silencioso en refresh
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

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
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      opacity: 0.7,
    },
    section: {
      padding: 16,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 12,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    statCard: {
      flex: 1,
      minWidth: '45%',
      padding: 16,
      alignItems: 'center',
      backgroundColor: colors.cardBackground,
    },
    statIconContainer: {
      marginBottom: 8,
    },
    statValue: {
      fontSize: 32,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      opacity: 0.7,
      textAlign: 'center',
    },
    sectionTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionTitleIcon: {
      marginRight: 8,
    },
    quickActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    quickActionButton: {
      flex: 1,
      minWidth: '30%',
      backgroundColor: colors.cardBackground,
      padding: 20,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    quickActionIconContainer: {
      marginBottom: 8,
    },
    quickActionText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    errorContainer: {
      padding: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    errorText: {
      fontSize: 16,
      color: colors.text,
      textAlign: 'center',
    },
  });

  if (!stats) {
    return (
      <ScrollView style={dynamicStyles.container}>
        <View style={dynamicStyles.errorContainer}>
          <Text style={dynamicStyles.errorText}>No se pudieron cargar las estadísticas</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={dynamicStyles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.title}>Dashboard</Text>
        <Text style={dynamicStyles.subtitle}>Vista general del sistema</Text>
      </View>

      {/* Estadísticas de Usuarios */}
      <View style={dynamicStyles.section}>
        <View style={dynamicStyles.sectionTitleContainer}>
          <FontAwesome name="users" size={20} color={colors.primary} style={dynamicStyles.sectionTitleIcon} />
          <Text style={dynamicStyles.sectionTitle}>Usuarios</Text>
        </View>
        <View style={dynamicStyles.statsGrid}>
          <Card style={dynamicStyles.statCard}>
            <View style={dynamicStyles.statIconContainer}>
              <FontAwesome name="users" size={24} color={colors.primary} />
            </View>
            <Text style={dynamicStyles.statValue}>{stats.totalUsers ?? 0}</Text>
            <Text style={dynamicStyles.statLabel}>Total Usuarios</Text>
          </Card>
          <Card style={dynamicStyles.statCard}>
            <View style={dynamicStyles.statIconContainer}>
              <FontAwesome name="user" size={24} color={colors.primary} />
            </View>
            <Text style={dynamicStyles.statValue}>{stats.totalRegularUsers ?? 0}</Text>
            <Text style={dynamicStyles.statLabel}>Usuarios</Text>
          </Card>
          <Card style={dynamicStyles.statCard}>
            <View style={dynamicStyles.statIconContainer}>
              <FontAwesome name="shopping-bag" size={24} color={colors.primary} />
            </View>
            <Text style={dynamicStyles.statValue}>{stats.totalVendors ?? 0}</Text>
            <Text style={dynamicStyles.statLabel}>Vendedores</Text>
          </Card>
          <Card style={dynamicStyles.statCard}>
            <View style={dynamicStyles.statIconContainer}>
              <FontAwesome name="shield" size={24} color={colors.primary} />
            </View>
            <Text style={dynamicStyles.statValue}>{stats.totalAdmins ?? 0}</Text>
            <Text style={dynamicStyles.statLabel}>Administradores</Text>
          </Card>
        </View>
      </View>

      {/* Estadísticas de Vendors y Menús */}
      <View style={dynamicStyles.section}>
        <View style={dynamicStyles.sectionTitleContainer}>
          <FontAwesome name="shopping-bag" size={20} color={colors.primary} style={dynamicStyles.sectionTitleIcon} />
          <Text style={dynamicStyles.sectionTitle}>Vendors y Menús</Text>
        </View>
        <View style={dynamicStyles.statsGrid}>
          <Card style={dynamicStyles.statCard}>
            <View style={dynamicStyles.statIconContainer}>
              <FontAwesome name="building" size={24} color={colors.primary} />
            </View>
            <Text style={dynamicStyles.statValue}>{stats.totalVendorsEntities ?? 0}</Text>
            <Text style={dynamicStyles.statLabel}>Vendors</Text>
          </Card>
          <Card style={dynamicStyles.statCard}>
            <View style={dynamicStyles.statIconContainer}>
              <FontAwesome name="cutlery" size={24} color={colors.primary} />
            </View>
            <Text style={dynamicStyles.statValue}>{stats.totalMenuItems ?? 0}</Text>
            <Text style={dynamicStyles.statLabel}>Menús</Text>
          </Card>
        </View>
      </View>

      {/* Estadísticas de Pedidos */}
      <View style={dynamicStyles.section}>
        <View style={dynamicStyles.sectionTitleContainer}>
          <FontAwesome name="shopping-cart" size={20} color={colors.primary} style={dynamicStyles.sectionTitleIcon} />
          <Text style={dynamicStyles.sectionTitle}>Pedidos</Text>
        </View>
        <View style={dynamicStyles.statsGrid}>
          <Card style={dynamicStyles.statCard}>
            <View style={dynamicStyles.statIconContainer}>
              <FontAwesome name="list-alt" size={24} color={colors.primary} />
            </View>
            <Text style={dynamicStyles.statValue}>{stats.totalOrders ?? 0}</Text>
            <Text style={dynamicStyles.statLabel}>Total Pedidos</Text>
          </Card>
          <Card style={dynamicStyles.statCard}>
            <View style={dynamicStyles.statIconContainer}>
              <FontAwesome name="calendar" size={24} color={colors.primary} />
            </View>
            <Text style={dynamicStyles.statValue}>{stats.totalOrdersToday ?? 0}</Text>
            <Text style={dynamicStyles.statLabel}>Hoy</Text>
          </Card>
          <Card style={dynamicStyles.statCard}>
            <View style={dynamicStyles.statIconContainer}>
              <FontAwesome name="calendar-o" size={24} color={colors.primary} />
            </View>
            <Text style={dynamicStyles.statValue}>{stats.totalOrdersThisWeek ?? 0}</Text>
            <Text style={dynamicStyles.statLabel}>Esta Semana</Text>
          </Card>
        </View>
      </View>

      {/* Estadísticas de Feedback */}
      <View style={dynamicStyles.section}>
        <View style={dynamicStyles.sectionTitleContainer}>
          <FontAwesome name="comments" size={20} color={colors.primary} style={dynamicStyles.sectionTitleIcon} />
          <Text style={dynamicStyles.sectionTitle}>Comentarios</Text>
        </View>
        <View style={dynamicStyles.statsGrid}>
          <Card style={dynamicStyles.statCard}>
            <View style={dynamicStyles.statIconContainer}>
              <FontAwesome name="comment" size={24} color={colors.primary} />
            </View>
            <Text style={dynamicStyles.statValue}>{stats.totalFeedback ?? 0}</Text>
            <Text style={dynamicStyles.statLabel}>Total Comentarios</Text>
          </Card>
        </View>
      </View>

      {/* Accesos Rápidos */}
      <View style={dynamicStyles.section}>
        <View style={dynamicStyles.sectionTitleContainer}>
          <FontAwesome name="bolt" size={20} color={colors.primary} style={dynamicStyles.sectionTitleIcon} />
          <Text style={dynamicStyles.sectionTitle}>Accesos Rápidos</Text>
        </View>
        <View style={dynamicStyles.quickActions}>
          <TouchableOpacity
            style={dynamicStyles.quickActionButton}
            onPress={() => router.push('/(tabs)/gestionar-usuarios')}
          >
            <View style={dynamicStyles.quickActionIconContainer}>
              <FontAwesome name="users" size={32} color={colors.primary} />
            </View>
            <Text style={dynamicStyles.quickActionText}>Usuarios</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={dynamicStyles.quickActionButton}
            onPress={() => router.push('/(tabs)/gestionar-vendors')}
          >
            <View style={dynamicStyles.quickActionIconContainer}>
              <FontAwesome name="shopping-bag" size={32} color={colors.primary} />
            </View>
            <Text style={dynamicStyles.quickActionText}>Vendors</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={dynamicStyles.quickActionButton}
            onPress={() => router.push('/(tabs)/comentarios')}
          >
            <View style={dynamicStyles.quickActionIconContainer}>
              <FontAwesome name="comments" size={32} color={colors.primary} />
            </View>
            <Text style={dynamicStyles.quickActionText}>Comentarios</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

