import { Redirect } from 'expo-router';
import { useAuth } from '../context';
import { Loading } from '../components';

export default function Index() {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (!isAuthenticated || !user) {
    return <Redirect href="/login" />;
  }

  const userRole = user.role?.toUpperCase();
  
  if (userRole === 'ADMIN') {
    return <Redirect href="/(tabs)/dashboard" />;
  }
  
  if (userRole === 'VENDOR') {
    return <Redirect href="/(tabs)/pedidos-vendor" />;
  }

  return <Redirect href="/(tabs)/home" />;
}
