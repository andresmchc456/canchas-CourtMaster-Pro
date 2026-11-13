import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import Unauthorized from './pages/Unauthorized';
import CanchaAdminTable from './components/CanchaAdminTable';
import CatalogoCanchas from './components/CatalogoCanchas';

// Catálogo Público (accesible sin iniciar sesión)
const CatalogoPublico = () => {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black text-lg">
              C
            </div>
            <span className="font-bold text-xl text-slate-800 tracking-tight">CourtMaster Pro</span>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to={user.rol === 'ROLE_ADMIN' ? '/admin' : '/'}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition shadow-sm"
              >
                Ir a mi Panel
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-slate-700 hover:text-emerald-600 text-sm font-semibold transition"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition shadow-sm"
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
            Canchas Deportivas Disponibles
          </h1>
          <p className="mt-3 text-slate-600">
            Explora nuestras instalaciones de alta calidad y reserva el horario que prefieras.
          </p>
        </div>
        <CatalogoCanchas />
      </main>
    </div>
  );
};

// Panel de Usuario Regular
const DashboardUsuario = () => {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black text-lg">
              C
            </div>
            <div>
              <span className="font-bold text-lg text-slate-800 leading-none block">CourtMaster Pro</span>
              <span className="text-xs text-slate-500">Panel de Jugador</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600 hidden sm:inline">
              Hola, <strong className="text-slate-800">{user?.nombre}</strong>
            </span>
            <button
              onClick={logout}
              className="px-3.5 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-semibold transition"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Reservar Canchas</h2>
          <p className="text-sm text-slate-500">Selecciona una cancha deportiva activa para ver horarios disponibles</p>
        </div>
        <CatalogoCanchas />
      </main>
    </div>
  );
};

// Panel de Administrador
const DashboardAdmin = () => {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-900 border-b border-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center text-slate-900 font-black text-lg">
              C
            </div>
            <div>
              <span className="font-bold text-lg text-white leading-none block">CourtMaster Pro</span>
              <span className="text-xs text-emerald-400 font-medium">Panel Administrativo</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400 hidden sm:inline">
              Admin: <strong className="text-slate-200">{user?.email}</strong>
            </span>
            <Link
              to="/canchas"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
            >
              Ver Catálogo Público
            </Link>
            <button
              onClick={logout}
              className="px-3.5 py-1.5 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 rounded-xl text-xs font-semibold transition"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CanchaAdminTable />
      </main>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/canchas" element={<CatalogoPublico />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Rutas Protegidas para usuarios autenticados */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashboardUsuario />} />
          </Route>

          {/* Rutas Protegidas exclusivas para ROLE_ADMIN */}
          <Route element={<ProtectedRoute allowedRoles={['ROLE_ADMIN']} />}>
            <Route path="/admin" element={<DashboardAdmin />} />
          </Route>

          {/* Redirección por defecto al catálogo */}
          <Route path="*" element={<Navigate to="/canchas" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
