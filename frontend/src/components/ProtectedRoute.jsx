import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Guardia de ruta protegida con soporte para RBAC (Role-Based Access Control).
 * @param {Array<string>} allowedRoles - Lista opcional de roles permitidos (ej. ['ROLE_ADMIN']).
 */
const ProtectedRoute = ({ allowedRoles, children }) => {
  const { isAuthenticated, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-600 font-medium">Verificando sesión...</span>
        </div>
      </div>
    );
  }

  // 1. Validar si está autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Validar si tiene los permisos requeridos por rol
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Si pasa las validaciones, renderiza los hijos o la salida anidada de react-router
  return children ? children : <Outlet />;
};

export default ProtectedRoute;

