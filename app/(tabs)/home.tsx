import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Button, Card } from '../../components';
import { useTheme } from '../../context';

export default function HomeScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    hero: {
      padding: 20,
      alignItems: 'center',
      backgroundColor: colors.primary,
      paddingVertical: 60,
      borderBottomLeftRadius: 30,
      borderBottomRightRadius: 30,
    },
    heroTitle: {
      fontSize: 32,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 12,
    },
    heroSubtitle: {
      fontSize: 16,
      color: colors.text,
      textAlign: 'center',
      marginBottom: 24,
    },
    heroButton: {
      minWidth: 200,
      backgroundColor: isDark ? '#D9D9D9' : '#F7F7F7',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    heroButtonText: {
      color: '#2A2A2A',
      fontWeight: '600',
      fontSize: 18,
    },
    ctaButton: {
      minWidth: 200,
    },
    features: {
      padding: 24,
      backgroundColor: 'transparent',
    },
    sectionTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 24,
      textAlign: 'center',
      letterSpacing: -0.5,
    },
    featureCard: {
      marginBottom: 20,
      alignItems: 'center',
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 20,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    featureIconContainer: {
      marginBottom: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    featureTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    featureText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      fontStyle: 'italic',
    },
    cta: {
      padding: 20,
      paddingBottom: 40,
    },
    ctaCard: {
      alignItems: 'center',
    },
    ctaTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 12,
      textAlign: 'center',
    },
    ctaText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 20,
      fontStyle: 'italic',
    },
  });

  return (
    <ScrollView style={dynamicStyles.container}>
      <View style={dynamicStyles.hero}>
        <Text style={dynamicStyles.heroTitle}>Comedor Universitario UTEC</Text>
        <Text style={dynamicStyles.heroSubtitle}>
          Reserva tu menú favorito y recógelo cuando quieras
        </Text>
        <View style={{ alignItems: 'center' }}>
          <Button
            variant="primary"
            size="large"
            onPress={() => router.push('/(tabs)/menus')}
            style={dynamicStyles.heroButton}
          >
            <Text style={dynamicStyles.heroButtonText}>Ver Menús Disponibles</Text>
          </Button>
        </View>
      </View>

      <View style={dynamicStyles.features}>
        <Text style={dynamicStyles.sectionTitle}>¿Cómo funciona?</Text>
        
        <Card style={dynamicStyles.featureCard}>
          <View style={dynamicStyles.featureIconContainer}>
            <FontAwesome name="cutlery" size={46} color={colors.text} />
          </View>
          <Text style={dynamicStyles.featureTitle}>1. Explora el Menú</Text>
          <Text style={dynamicStyles.featureText}>
            Revisa los platos disponibles para hoy y los próximos días
          </Text>
        </Card>

        <Card style={dynamicStyles.featureCard}>
          <View style={dynamicStyles.featureIconContainer}>
            <FontAwesome name="mobile-phone" size={64} color={colors.text} />
          </View>
          <Text style={dynamicStyles.featureTitle}>2. Reserva en Línea</Text>
          <Text style={dynamicStyles.featureText}>
            Selecciona tu menú favorito y haz tu reserva en segundos
          </Text>
        </Card>

        <Card style={dynamicStyles.featureCard}>
          <View style={dynamicStyles.featureIconContainer}>
            <FontAwesome name="check-circle" size={50} color="#4CAF50" />
          </View>
          <Text style={dynamicStyles.featureTitle}>3. Recoge tu Pedido</Text>
          <Text style={dynamicStyles.featureText}>
            Pasa por el comedor y recoge tu comida sin esperar
          </Text>
        </Card>

        <Card style={dynamicStyles.featureCard}>
          <View style={dynamicStyles.featureIconContainer}>
            <FontAwesome name="star" size={50} color="#FFD700" />
          </View>
          <Text style={dynamicStyles.featureTitle}>4. Da tu Opinión</Text>
          <Text style={dynamicStyles.featureText}>
            Ayúdanos a mejorar calificando tu experiencia
          </Text>
        </Card>
      </View>

      <View style={dynamicStyles.cta}>
        <Card style={dynamicStyles.ctaCard}>
          <Text style={dynamicStyles.ctaTitle}>¿Listo para reservar?</Text>
          <Text style={dynamicStyles.ctaText}>
            Empieza ahora y disfruta de deliciosa comida sin complicaciones
          </Text>
          <Button
            variant="primary"
            size="large"
            onPress={() => router.push('/(tabs)/menus')}
            style={dynamicStyles.ctaButton}
          >
            Ver Menús del Día
          </Button>
        </Card>
      </View>
    </ScrollView>
  );
}


