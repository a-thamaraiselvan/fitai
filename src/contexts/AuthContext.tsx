import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';

interface User {
  id: number;
  email: string;
  name: string;
  profilePicture?: string;
  height?: number;
  weight?: number;
  fitnessGoals?: string;
  role: 'user' | 'admin';
  isApproved: boolean;
  notificationsEnabled?: boolean;
}

  interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<any>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  loading: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  height?: number;
  weight?: number;
  fitnessGoals?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// MOVE normalizeUser HERE — outside AuthProvider
const normalizeUser = (user: User): User | null => {
  if (!user) return null;

  const baseUrl = import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || `http://${window.location.hostname}:3001`;

  let profilePictureUrl: string | undefined;

  if (user.profilePicture) {
    profilePictureUrl = user.profilePicture.startsWith('http')
      ? user.profilePicture
      : `${baseUrl}${user.profilePicture.startsWith('/') ? '' : '/'}${user.profilePicture}`;
  }

  return {
    ...user,
    profilePicture: profilePictureUrl,
  };
};




export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const response = await api.get('/Auth/GetCurrentUser');
      setUser(normalizeUser(response.data.user));
    } catch (error) {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await api.post('/Auth/LoginUser', { email, password });
    if (response.data.mustResetPassword) {
      return response;
    }
    const { token, user: userData } = response.data;
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(normalizeUser(userData));
    return response;
  };

  const register = async (userData: RegisterData) => {
    await api.post('/Auth/RegisterUser', userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const updateProfile = async (userData: Partial<User>) => {
    const response = await api.put('/Auth/UpdateUserProfile', userData);
    setUser(normalizeUser(response.data.user));
  };

  const value = {
    user,
    login,
    register,
    logout,
    updateProfile,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
