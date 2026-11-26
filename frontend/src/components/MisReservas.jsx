import React, { useState, useEffect, useMemo } from 'react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';

export default function MisReservas({ onReservarNuevo }) {
  const { user } = useAuth();
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODAS'); // 'TODAS' | 'ACTIVA' | 'CANCELADA'

  // Modal de confirmación de cancelación
  const [reservaACancelar, setReservaACancelar] = useState(null);
  const [cancelando, setCancelando] = useState(false);

  const cargarMisReservas = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await axiosClient.get('/reservas/mis-reservas');
      setReservas(res.data);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error al cargar tu historial de reservas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarMisReservas();
  }, []);

  const handleConfirmarCancelacion = async () => {
    if (!reservaACancelar) return;

    try {
      setCancelando(true);
      setErrorMsg('');
      setSuccessMsg('');

      // Soporta PATCH o PUT /api/reservas/{id}/cancelar
      await axiosClient.patch(`/reservas/${reservaACancelar.id}/cancelar`);

      setSuccessMsg(`Reserva #${reservaACancelar.id} en ${reservaACancelar.canchaNombre} cancelada con éxito. El horario ha sido liberado.`);
      setReservaACancelar(null);
      // Recargar lista actualizada
      await cargarMisReservas();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error al cancelar la reserva. Por favor intenta más tarde.');
    } finally {
      setCancelando(false);
    }
  };

  // Métricas rápidas del jugador
  const metricas = useMemo(() => {
    const activas = reservas.filter((r) => r.estado === 'ACTIVA');
    const canceladas = reservas.filter((r) => r.estado === 'CANCELADA');
    const totalInvertido = activas.reduce((acc, curr) => acc + Number(curr.precioHistorico || 0), 0);

    return {
      total: reservas.length,
      activas: activas.length,
      canceladas: canceladas.length,
      totalInvertido,
    };
  }, [reservas]);

  // Reservas filtradas por estado
  const reservasFiltradas = useMemo(() => {
    if (filtroEstado === 'TODAS') return reservas;
    return reservas.filter((r) => r.estado === filtroEstado);
  }, [reservas, filtroEstado]);

  const formatearHora = (horaStr) => {
    if (!horaStr) return '';
    return horaStr.slice(0, 5);
  };

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '';
    try {
      const [year, month, day] = fechaStr.split('-');
      const fecha = new Date(year, month - 1, day);
      return fecha.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return fechaStr;
    }
  };

  return (
    <div className="space-y-8">
      {/* Tarjeta de Perfil del Usuario / Jugador */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white font-extrabold text-2xl flex items-center justify-center shadow-md shadow-emerald-600/20">
              {user?.nombre ? user.nombre.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-slate-900">{user?.nombre || 'Jugador'}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {user?.rol === 'ROLE_ADMIN' ? 'Administrador' : 'Jugador Oficial'}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">{user?.email}</p>
            </div>
          </div>

          {onReservarNuevo && (
            <button
              onClick={onReservarNuevo}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition shadow-sm hover:shadow flex items-center gap-2"
            >
              <span>+ Nueva Reserva</span>
            </button>
          )}
        </div>

        {/* Resumen de estadísticas del jugador */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Total Reservas</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{metricas.total}</p>
          </div>
          <div className="bg-emerald-50/60 rounded-xl p-4 border border-emerald-100">
            <span className="text-xs font-bold uppercase text-emerald-700 tracking-wider">Activas</span>
            <p className="text-2xl font-black text-emerald-800 mt-1">{metricas.activas}</p>
          </div>
          <div className="bg-rose-50/60 rounded-xl p-4 border border-rose-100">
            <span className="text-xs font-bold uppercase text-rose-700 tracking-wider">Canceladas</span>
            <p className="text-2xl font-black text-rose-800 mt-1">{metricas.canceladas}</p>
          </div>
          <div className="bg-cyan-50/60 rounded-xl p-4 border border-cyan-100">
            <span className="text-xs font-bold uppercase text-cyan-700 tracking-wider">Inversión Activa</span>
            <p className="text-2xl font-black text-cyan-900 mt-1">${metricas.totalInvertido.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Alertas */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-sm flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-700 font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-red-700 font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Barra de Filtro de Estados */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-2">Filtrar:</span>
          <button
            onClick={() => setFiltroEstado('TODAS')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              filtroEstado === 'TODAS'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todas ({metricas.total})
          </button>
          <button
            onClick={() => setFiltroEstado('ACTIVA')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              filtroEstado === 'ACTIVA'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Activas ({metricas.activas})
          </button>
          <button
            onClick={() => setFiltroEstado('CANCELADA')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              filtroEstado === 'CANCELADA'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            Canceladas ({metricas.canceladas})
          </button>
        </div>

        <button
          onClick={cargarMisReservas}
          className="text-xs font-semibold text-slate-500 hover:text-emerald-600 flex items-center gap-1 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualizar lista
        </button>
      </div>

      {/* Listado de Reservas */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
          <p className="text-sm font-medium">Cargando tus reservas...</p>
        </div>
      ) : reservasFiltradas.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-8">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h4 className="text-base font-bold text-slate-800 mb-1">
            {filtroEstado === 'TODAS'
              ? 'Aún no tienes reservas registradas'
              : `No tienes reservas en estado ${filtroEstado.toLowerCase()}`}
          </h4>
          <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
            Explora las canchas disponibles y asegura tu horario favorito ahora mismo.
          </p>
          {onReservarNuevo && (
            <button
              onClick={onReservarNuevo}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition shadow-sm"
            >
              Ver Catálogo de Canchas
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reservasFiltradas.map((reserva) => {
            const esActiva = reserva.estado === 'ACTIVA';
            return (
              <div
                key={reserva.id}
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md ${
                  esActiva ? 'border-slate-200' : 'border-slate-200 opacity-80'
                }`}
              >
                <div>
                  {/* Header de la reserva */}
                  <div
                    className={`p-4 border-b flex items-center justify-between ${
                      esActiva
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div>
                      <span className="text-[11px] uppercase font-bold tracking-wider opacity-80">
                        Reserva #{reserva.id}
                      </span>
                      <h3 className="text-lg font-bold leading-tight">{reserva.canchaNombre}</h3>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide flex items-center gap-1.5 ${
                        esActiva
                          ? 'bg-white/20 text-white backdrop-blur-md'
                          : 'bg-rose-100 text-rose-700 border border-rose-200'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          esActiva ? 'bg-emerald-300' : 'bg-rose-500'
                        }`}
                      ></span>
                      {reserva.estado}
                    </span>
                  </div>

                  {/* Cuerpo con detalles */}
                  <div className="p-5 space-y-3.5 text-sm">
                    <div>
                      <span className="text-xs uppercase font-bold text-slate-400 block mb-0.5">Fecha del Partido</span>
                      <span className="font-semibold text-slate-800 capitalize">
                        {formatearFecha(reserva.fecha)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-2 border-y border-slate-100">
                      <div>
                        <span className="text-xs uppercase font-bold text-slate-400 block mb-0.5">Franja Horaria</span>
                        <span className="font-bold text-emerald-700 text-base">
                          {formatearHora(reserva.horaInicio)} - {formatearHora(reserva.horaFin)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs uppercase font-bold text-slate-400 block mb-0.5">Precio Congelado</span>
                        <span className="font-extrabold text-slate-900 text-base">
                          ${Number(reserva.precioHistorico).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {reserva.createdAt && (
                      <p className="text-[11px] text-slate-400">
                        Reservado el: {new Date(reserva.createdAt).toLocaleString('es-ES')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer con acción de cancelación */}
                <div className="p-5 pt-0">
                  {esActiva ? (
                    <button
                      onClick={() => setReservaACancelar(reserva)}
                      className="w-full py-2.5 px-4 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 active:scale-[0.99] font-semibold text-xs transition flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Cancelar Reserva</span>
                    </button>
                  ) : (
                    <div className="py-2 text-center text-xs text-slate-400 italic bg-slate-50 rounded-xl border border-slate-100">
                      Horario liberado para otros usuarios
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Confirmación de Cancelación */}
      {reservaACancelar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                ⚠️
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">¿Cancelar Reserva?</h3>
                <p className="text-xs text-slate-500">Esta acción liberará el horario inmediatamente</p>
              </div>
            </div>

            <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-4 text-xs text-rose-900 space-y-1.5 mb-6">
              <p>
                <strong>Cancha:</strong> {reservaACancelar.canchaNombre}
              </p>
              <p>
                <strong>Fecha:</strong> {reservaACancelar.fecha}
              </p>
              <p>
                <strong>Horario:</strong> {formatearHora(reservaACancelar.horaInicio)} a{' '}
                {formatearHora(reservaACancelar.horaFin)}
              </p>
              <p className="pt-1 text-rose-700 font-medium">
                Al confirmar, el estado cambiará a <strong>CANCELADA</strong> y la franja horaria volverá a estar disponible para el público.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                disabled={cancelando}
                onClick={() => setReservaACancelar(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50 transition"
              >
                Volver
              </button>
              <button
                type="button"
                disabled={cancelando}
                onClick={handleConfirmarCancelacion}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm shadow-sm transition flex items-center gap-2"
              >
                {cancelando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Cancelando...</span>
                  </>
                ) : (
                  <span>Sí, Cancelar Reserva</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
