import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import Unauthorized from './pages/Unauthorized';
import CanchaAdminTable from './components/CanchaAdminTable';
import CatalogoCanchas from './components/CatalogoCanchas';
import ReportesAdmin from './components/ReportesAdmin';
import AdminReservas from './components/AdminReservas';
import MisReservas from './components/MisReservas';

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
                to={user.rol === 'ROLE_ADMIN' ? '/admin' : '/dashboard'}
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

// Panel de Usuario Regular / Jugador (ROLE_USER)
const DashboardUsuario = () => {
  const { user, logout } = useAuth();
  const [tabActiva, setTabActiva] = React.useState('canchas'); // 'canchas' | 'reservas'

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-sm">
              C
            </div>
            <div>
              <span className="font-bold text-lg text-slate-800 leading-none block">CourtMaster Pro</span>
              <span className="text-xs text-emerald-600 font-semibold">Panel de Jugador</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              <span>
                Jugador: <strong className="text-slate-800">{user?.nombre}</strong>
              </span>
            </div>
            {user?.rol === 'ROLE_ADMIN' && (
              <Link
                to="/admin"
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition shadow-sm flex items-center gap-1.5"
              >
                ⚙️ Panel Administrador
              </Link>
            )}
            <button
              onClick={logout}
              className="px-3.5 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-semibold transition"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Pestañas de Navegación del Jugador */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-2 pt-2 border-t border-slate-100 bg-white">
          <button
            onClick={() => setTabActiva('canchas')}
            className={`px-4 py-2 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 ${
              tabActiva === 'canchas'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            🏟️ <span>Canchas Disponibles</span>
          </button>
          <button
            onClick={() => setTabActiva('reservas')}
            className={`px-4 py-2 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 ${
              tabActiva === 'reservas'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            📅 <span>Mis Reservas y Perfil</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {tabActiva === 'canchas' ? (
          <>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Reservar Canchas Deportivas</h2>
              <p className="text-sm text-slate-500">
                Selecciona una instalación, consulta la disponibilidad de horarios en tiempo real y confirma tu turno
              </p>
            </div>
            <CatalogoCanchas onReservaExitosa={() => setTabActiva('reservas')} />
          </>
        ) : (
          <MisReservas onReservarNuevo={() => setTabActiva('canchas')} />
        )}
      </main>
    </div>
  );
};

// Panel de Administrador
const DashboardAdmin = () => {
  const { user, logout } = useAuth();
  const [tabActiva, setTabActiva] = React.useState('canchas'); // 'canchas' | 'reservas' | 'reportes'

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
              to="/dashboard"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
            >
              Vista de Jugador
            </Link>
            <button
              onClick={logout}
              className="px-3.5 py-1.5 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 rounded-xl text-xs font-semibold transition"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Pestañas de Navegación del Panel Admin */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-2 pt-2">
          <button
            onClick={() => setTabActiva('canchas')}
            className={`px-4 py-2 font-semibold text-sm border-b-2 transition-all ${
              tabActiva === 'canchas'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            🏟️ Inventario de Canchas
          </button>
          <button
            onClick={() => setTabActiva('reservas')}
            className={`px-4 py-2 font-semibold text-sm border-b-2 transition-all ${
              tabActiva === 'reservas'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            📅 Gestión de Reservas
          </button>
          <button
            onClick={() => setTabActiva('reportes')}
            className={`px-4 py-2 font-semibold text-sm border-b-2 transition-all ${
              tabActiva === 'reportes'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            📊 Reportes de Utilización
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {tabActiva === 'canchas' && <CanchaAdminTable />}
        {tabActiva === 'reservas' && <AdminReservas />}
        {tabActiva === 'reportes' && <ReportesAdmin />}
      </main>
    </div>
  );
};

// Redirecciona al panel correspondiente según el rol del usuario autenticado
const HomeDispatcher = () => {
  const { user } = useAuth();
  if (user?.rol === 'ROLE_ADMIN') {
    return <Navigate to="/admin" replace />;
  }
  return <Navigate to="/dashboard" replace />;
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
            <Route path="/" element={<HomeDispatcher />} />
            <Route path="/dashboard" element={<DashboardUsuario />} />
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
