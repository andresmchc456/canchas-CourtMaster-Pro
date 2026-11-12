import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import Unauthorized from './pages/Unauthorized';

// Vistas de Demostración para ilustrar el funcionamiento de las rutas
const DashboardUsuario = () => {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Panel de Reservas - CourtMaster Pro</h1>
            <p className="text-slate-500">Bienvenido, {user?.nombre} ({user?.rol})</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-medium transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
        <p className="text-slate-600">Aquí podrás consultar canchas disponibles y crear nuevas reservas.</p>
      </div>
    </div>
  );
};

const DashboardAdmin = () => {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-emerald-400">Panel de Administración</h1>
            <p className="text-slate-400">Sesión iniciada como: {user?.email} [ADMINISTRADOR]</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
        <p className="text-slate-300">Gestión de canchas, tarifas, horarios y reportes de facturación.</p>
      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Rutas Protegidas para cualquier usuario autenticado (ROLE_USER y ROLE_ADMIN) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashboardUsuario />} />
          </Route>

          {/* Rutas Protegidas exclusivas para ROLE_ADMIN */}
          <Route element={<ProtectedRoute allowedRoles={['ROLE_ADMIN']} />}>
            <Route path="/admin" element={<DashboardAdmin />} />
          </Route>

          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

