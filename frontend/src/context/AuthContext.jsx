import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('courtmaster_token') || null);
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('courtmaster_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Al cargar la app, se valida que el token y usuario persistan de forma íntegra
    const savedToken = localStorage.getItem('courtmaster_token');
    const savedUser = localStorage.getItem('courtmaster_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axiosClient.post('/auth/login', { email, password });
      const data = response.data;

      const userData = {
        id: data.id,
        nombre: data.nombre,
        email: data.email,
        rol: data.rol,
      };

      // Persistencia en LocalStorage
      localStorage.setItem('courtmaster_token', data.token);
      localStorage.setItem('courtmaster_user', JSON.stringify(userData));

      setToken(data.token);
      setUser(userData);

      return { success: true, user: userData };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        'Error al iniciar sesión. Revisa tus credenciales.';
      return { success: false, error: message };
    }
  };

  const register = async (formData) => {
    try {
      const response = await axiosClient.post('/auth/register', formData);
      const data = response.data;

      const userData = {
        id: data.id,
        nombre: data.nombre,
        email: data.email,
        rol: data.rol,
      };

      // Autologin luego del registro exitoso
      localStorage.setItem('courtmaster_token', data.token);
      localStorage.setItem('courtmaster_user', JSON.stringify(userData));

      setToken(data.token);
      setUser(userData);

      return { success: true, user: userData };
    } catch (error) {
      let message = 'Error al registrar usuario.';
      if (error.response?.data?.errors) {
        // Errores de validación de campos
        message = Object.values(error.response.data.errors).join(', ');
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      }
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('courtmaster_token');
    localStorage.removeItem('courtmaster_user');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    role: user?.rol || null,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.rol === 'ROLE_ADMIN',
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

