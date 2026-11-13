import React, { useState, useEffect, useCallback } from 'react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function CalendarioReservas({ cancha, onClose, onReservaCompletada }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const fechaHoy = new Date().toISOString().split('T')[0];
  const [fechaSeleccionada, setFechaSeleccionada] = useState(fechaHoy);
  const [bloques, setBloques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  // Estados para el Modal de Confirmación
  const [bloqueAConfirmar, setBloqueAConfirmar] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para Alertas
  const [alertaConflicto, setAlertaConflicto] = useState('');
  const [alertaExito, setAlertaExito] = useState('');

  const cargarDisponibilidad = useCallback(async () => {
    if (!cancha?.id) return;
    try {
      setLoading(true);
      setErrorCarga('');
      const res = await axiosClient.get(`/canchas/${cancha.id}/disponibilidad`, {
        params: { fecha: fechaSeleccionada },
      });
      setBloques(res.data);
    } catch (err) {
      setErrorCarga('Error al cargar la disponibilidad horaria.');
    } finally {
      setLoading(false);
    }
  }, [cancha?.id, fechaSeleccionada]);

  useEffect(() => {
    cargarDisponibilidad();
  }, [cargarDisponibilidad]);

  const handleSeleccionarBloque = (bloque) => {
    if (!bloque.disponible) return;

    if (!user) {
      if (window.confirm('Debes iniciar sesión para realizar una reserva. ¿Deseas ir al login?')) {
        navigate('/login');
      }
      return;
    }

    setAlertaConflicto('');
    setAlertaExito('');
    setBloqueAConfirmar(bloque);
  };

  const handleConfirmarReserva = async () => {
    if (!bloqueAConfirmar) return;

    try {
      setIsSubmitting(true);
      setAlertaConflicto('');

      const payload = {
        canchaId: cancha.id,
        fecha: fechaSeleccionada,
        horaInicio: bloqueAConfirmar.horaInicio,
        horaFin: bloqueAConfirmar.horaFin,
      };

      // Paso 2: Envío de solicitud POST /api/reservas
      const res = await axiosClient.post('/reservas', payload);

      if (res.status === 201) {
        setAlertaExito(
          `¡Reserva confirmada con éxito para el horario ${bloqueAConfirmar.horaInicio.slice(0, 5)} - ${bloqueAConfirmar.horaFin.slice(0, 5)}!`
        );
        setBloqueAConfirmar(null);
        // Recargar la grilla para reflejar el nuevo bloque como reservado
        cargarDisponibilidad();
        if (onReservaCompletada) {
          onReservaCompletada(res.data);
        }
      }
    } catch (err) {
      // Manejo específico del 409 Conflict (Concurrencia)
      if (err.response?.status === 409) {
        setAlertaConflicto(
          err.response.data?.message || '¡Horario recién ocupado por otro usuario! Por favor selecciona otra franja.'
        );
        setBloqueAConfirmar(null);
        // Re-disparar inmediatamente el GET para actualizar la grilla
        cargarDisponibilidad();
      } else {
        alert(err.response?.data?.message || 'Error inesperado al crear la reserva.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatearHora = (horaStr) => {
    if (!horaStr) return '';
    return horaStr.slice(0, 5);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-w-4xl w-full mx-auto animate-in fade-in zoom-in-95 duration-200">
      {/* Header Cancha */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-cyan-800 p-6 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase">
              {cancha?.tipoSuelo}
            </span>
            {cancha?.iluminacion && (
              <span className="bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full text-xs font-bold">
                ⚡ LED
              </span>
            )}
          </div>
          <h2 className="text-2xl font-bold tracking-tight">{cancha?.nombre}</h2>
          <p className="text-emerald-100 text-sm">
            Tarifa Base: <strong className="text-white">${Number(cancha?.tarifaBase).toFixed(2)}</strong> / hora
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="self-end sm:self-center text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-xl text-sm transition"
          >
            ✕ Cerrar
          </button>
        )}
      </div>

      <div className="p-6 space-y-6">
        {/* Barra de Filtro de Fecha */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3">
            <label htmlFor="fechaReserva" className="text-sm font-bold text-slate-700">
              Seleccionar Fecha:
            </label>
            <input
              type="date"
              id="fechaReserva"
              min={fechaHoy}
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm"
            />
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-emerald-700">
              <span className="w-3.5 h-3.5 rounded bg-emerald-500 border border-emerald-600 inline-block"></span>
              Disponible
            </span>
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="w-3.5 h-3.5 rounded bg-slate-200 border border-slate-300 inline-block"></span>
              Ocupado
            </span>
          </div>
        </div>

        {/* Notificación de Error 409 Conflict (Modal / Alerta Roja) */}
        {alertaConflicto && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-sm flex items-start gap-3 shadow-sm animate-bounce">
            <svg className="w-5 h-5 flex-shrink-0 text-rose-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <h4 className="font-bold">Conflicto de Disponibilidad</h4>
              <p className="mt-0.5">{alertaConflicto}</p>
              <p className="text-xs text-rose-600 mt-1">La grilla de horarios ha sido actualizada automáticamente.</p>
            </div>
            <button
              onClick={() => setAlertaConflicto('')}
              className="text-rose-500 hover:text-rose-700 font-bold ml-2 text-lg leading-none"
            >
              &times;
            </button>
          </div>
        )}

        {/* Notificación de Éxito 201 Created */}
        {alertaExito && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm flex items-start gap-3 shadow-sm">
            <svg className="w-5 h-5 flex-shrink-0 text-emerald-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h4 className="font-bold">¡Reserva Confirmada!</h4>
              <p className="mt-0.5">{alertaExito}</p>
            </div>
            <button
              onClick={() => setAlertaExito('')}
              className="text-emerald-600 hover:text-emerald-800 font-bold ml-2 text-lg leading-none"
            >
              &times;
            </button>
          </div>
        )}

        {errorCarga && (
          <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm">
            {errorCarga}
          </div>
        )}

        {/* Grilla de Disponibilidad Horaria */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            <p className="text-xs font-semibold">Consultando disponibilidad en tiempo real...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {bloques.map((bloque, index) => {
              const inicio = formatearHora(bloque.horaInicio);
              const fin = formatearHora(bloque.horaFin);

              if (bloque.disponible) {
                return (
                  <button
                    key={index}
                    onClick={() => handleSeleccionarBloque(bloque)}
                    className="p-3.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-600 text-emerald-900 hover:text-white transition-all shadow-sm hover:shadow hover:scale-[1.02] flex flex-col items-center justify-center gap-1 group text-center"
                  >
                    <span className="font-extrabold text-base tracking-tight">
                      {inicio} - {fin}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-700 group-hover:text-emerald-100 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 group-hover:bg-white inline-block"></span>
                      Disponible
                    </span>
                  </button>
                );
              }

              return (
                <div
                  key={index}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed flex flex-col items-center justify-center gap-1 opacity-70 text-center select-none"
                >
                  <span className="font-bold text-base tracking-tight line-through">
                    {inicio} - {fin}
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">
                    Ocupado
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Confirmación de Reserva */}
      {bloqueAConfirmar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                ⚽
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">Confirmar Reserva</h3>
                <p className="text-xs text-slate-500">Revisa los detalles antes de reservar el turno</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 space-y-2.5 text-sm mb-6 border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Cancha:</span>
                <span className="font-bold text-slate-800">{cancha?.nombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fecha:</span>
                <span className="font-semibold text-slate-800">{fechaSeleccionada}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Franja Horaria:</span>
                <span className="font-bold text-emerald-700">
                  {formatearHora(bloqueAConfirmar.horaInicio)} a {formatearHora(bloqueAConfirmar.horaFin)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="text-slate-700 font-medium">Total a Pagar:</span>
                <span className="font-black text-slate-900 text-lg">
                  ${Number(cancha?.tarifaBase).toFixed(2)}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-6">
              * El horario quedará bloqueado exclusivamente a tu nombre de manera inmediata con protección contra doble reserva.
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setBloqueAConfirmar(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmarReserva}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Procesando...</span>
                  </>
                ) : (
                  <span>Confirmar y Reservar</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

