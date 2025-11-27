import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services';
import type { AuthResponse, LoginRequest, RegisterRequest } from '../types';

interface AuthContextType {
  user: AuthResponse | null;
  loading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStoredAuth = async () => {
      const timeoutId = setTimeout(() => {
        setLoading(false);
        setUser(null);
      }, 3000);

      try {
        const token = await AsyncStorage.getItem('token');
        const userData = await AsyncStorage.getItem('user');
        
        clearTimeout(timeoutId);
        
        if (token && userData) {
          try {
            const parsedUser = JSON.parse(userData);
            if (parsedUser && parsedUser.id && parsedUser.token && parsedUser.email) {
              if (token === parsedUser.token) {
                setUser(parsedUser);
              } else {
                await AsyncStorage.removeItem('token');
                await AsyncStorage.removeItem('user');
                setUser(null);
              }
            } else {
              await AsyncStorage.removeItem('token');
              await AsyncStorage.removeItem('user');
              setUser(null);
            }
          } catch (error) {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        clearTimeout(timeoutId);
        setUser(null);
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    loadStoredAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      const response = await authService.login(credentials);
      const authData = response.data;
      
      await AsyncStorage.setItem('token', authData.token);
      await AsyncStorage.setItem('user', JSON.stringify(authData));
      setUser(authData);
    } catch (error: any) {
      throw error;
    }
  };

  const register = async (userData: RegisterRequest) => {
    try {
      const response = await authService.register(userData);
      const authData = response.data;
      
      await AsyncStorage.setItem('token', authData.token);
      await AsyncStorage.setItem('user', JSON.stringify(authData));
      setUser(authData);
    } catch (error: any) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      setUser(null);
    } catch (error) {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
