import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axiosClient from '../api/axiosClient';

export default function AdminReservas() {
  const [reservas, setReservas] = useState([]);
  const [canchas, setCanchas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filtros
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroCanchaId, setFiltroCanchaId] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [busquedaJugador, setBusquedaJugador] = useState('');

  // Modal de Reprogramación
  const [reservaAReprogramar, setReservaAReprogramar] = useState(null);
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [nuevaHoraInicio, setNuevaHoraInicio] = useState('');
  const [bloquesDisponibles, setBloquesDisponibles] = useState([]);
  const [cargandoBloques, setCargandoBloques] = useState(false);
  const [errorModalReprogramar, setErrorModalReprogramar] = useState('');
  const [guardandoReprogramacion, setGuardandoReprogramacion] = useState(false);

  // Modal de Confirmación de Cancelación
  const [reservaACancelar, setReservaACancelar] = useState(null);
  const [cancelando, setCancelando] = useState(false);

  const cargarCanchas = useCallback(async () => {
    try {
      const res = await axiosClient.get('/canchas');
      setCanchas(res.data);
    } catch {
      // Silencioso si falla catálogo secundario; la tabla igual funciona
    }
  }, []);

  const cargarReservas = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const params = {};
      if (filtroFecha) params.fecha = filtroFecha;
      if (filtroCanchaId) params.canchaId = filtroCanchaId;
      if (filtroEstado) params.estado = filtroEstado;

      const res = await axiosClient.get('/admin/reservas', { params });
      setReservas(res.data);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error al cargar el listado de reservas.');
    } finally {
      setLoading(false);
    }
  }, [filtroFecha, filtroCanchaId, filtroEstado]);

  useEffect(() => {
    cargarCanchas();
  }, [cargarCanchas]);

  useEffect(() => {
    cargarReservas();
  }, [cargarReservas]);

  const cargarDisponibilidadModal = useCallback(async (canchaId, fecha) => {
    if (!canchaId || !fecha) return;
    try {
      setCargandoBloques(true);
      const res = await axiosClient.get(`/canchas/${canchaId}/disponibilidad`, {
        params: { fecha },
      });
      setBloquesDisponibles(res.data);
    } catch (err) {
      setBloquesDisponibles([]);
      setErrorModalReprogramar(
        err.response?.data?.message || 'No se pudo consultar la disponibilidad horaria para esa fecha.'
      );
    } finally {
      setCargandoBloques(false);
    }
  }, []);

  const abrirModalReprogramar = (reserva) => {
    setErrorModalReprogramar('');
    setSuccessMsg('');
    setReservaAReprogramar(reserva);
    setNuevaFecha(reserva.fecha);
    setNuevaHoraInicio(reserva.horaInicio);
    cargarDisponibilidadModal(reserva.canchaId, reserva.fecha);
  };

  const cerrarModalReprogramar = () => {
    setReservaAReprogramar(null);
    setNuevaFecha('');
    setNuevaHoraInicio('');
    setBloquesDisponibles([]);
    setErrorModalReprogramar('');
  };

  const handleCambioFechaModal = (e) => {
    const fechaSeleccionada = e.target.value;
    setNuevaFecha(fechaSeleccionada);
    setNuevaHoraInicio('');
    setErrorModalReprogramar('');
    if (reservaAReprogramar && fechaSeleccionada) {
      cargarDisponibilidadModal(reservaAReprogramar.canchaId, fechaSeleccionada);
    }
  };

  const handleGuardarReprogramacion = async (e) => {
    e.preventDefault();
    if (!reservaAReprogramar || !nuevaFecha || !nuevaHoraInicio) {
      setErrorModalReprogramar('Debes seleccionar una fecha y una franja horaria disponible.');
      return;
    }

    try {
      setGuardandoReprogramacion(true);
      setErrorModalReprogramar('');

      await axiosClient.patch(`/admin/reservas/${reservaAReprogramar.id}/horario`, {
        fecha: nuevaFecha,
        horaInicio: nuevaHoraInicio,
      });

      const horaFmt = formatearHora(nuevaHoraInicio);
      setSuccessMsg(
        `Reserva #${reservaAReprogramar.id} reprogramada exitosamente para el ${nuevaFecha} a las ${horaFmt}.`
      );
      cerrarModalReprogramar();
      await cargarReservas();
    } catch (err) {
      if (err.response?.status === 409) {
        setErrorModalReprogramar(
          err.response.data?.message || 'El nuevo horario seleccionado ya se encuentra ocupado.'
        );
        cargarDisponibilidadModal(reservaAReprogramar.canchaId, nuevaFecha);
      } else {
        setErrorModalReprogramar(
          err.response?.data?.message || 'Ocurrió un error al intentar reprogramar la reserva.'
        );
      }
    } finally {
      setGuardandoReprogramacion(false);
    }
  };

  const handleConfirmarCancelacion = async () => {
    if (!reservaACancelar) return;
    try {
      setCancelando(true);
      setErrorMsg('');
      setSuccessMsg('');

      await axiosClient.patch(`/admin/reservas/${reservaACancelar.id}/cancelar`);

      setSuccessMsg(
        `Reserva #${reservaACancelar.id} (${reservaACancelar.usuarioNombre}) cancelada correctamente. El bloque horario fue liberado.`
      );
      setReservaACancelar(null);
      await cargarReservas();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error al cancelar la reserva.');
      setReservaACancelar(null);
    } finally {
      setCancelando(false);
    }
  };

  const limpiarFiltros = () => {
    setFiltroFecha('');
    setFiltroCanchaId('');
    setFiltroEstado('');
    setBusquedaJugador('');
  };

  const reservasFiltradas = useMemo(() => {
    const termino = busquedaJugador.trim().toLowerCase();
    if (!termino) return reservas;
    return reservas.filter(
      (r) =>
        (r.usuarioNombre && r.usuarioNombre.toLowerCase().includes(termino)) ||
        (r.usuarioEmail && r.usuarioEmail.toLowerCase().includes(termino))
    );
  }, [reservas, busquedaJugador]);

  const formatearHora = (horaStr) => {
    if (!horaStr) return '';
    return horaStr.slice(0, 5);
  };

  const hayFiltrosActivos = filtroFecha || filtroCanchaId || filtroEstado || busquedaJugador;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Gestión de Reservas</h2>
          <p className="text-sm text-slate-500">
            Visualiza todas las reservas del sistema, reprograma horarios o cancela turnos activos
          </p>
        </div>
        <button
          onClick={cargarReservas}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-sm rounded-xl shadow-xs transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span>Actualizar</span>
        </button>
      </div>

      {/* Alertas globales */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-sm flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-700 font-bold ml-3">
            ✕
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-red-700 font-bold ml-3">
            ✕
          </button>
        </div>
      )}

      {/* Barra de Filtros */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Buscar Jugador</label>
            <input
              type="text"
              value={busquedaJugador}
              onChange={(e) => setBusquedaJugador(e.target.value)}
              placeholder="Nombre o correo..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha</label>
            <input
              type="date"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Cancha</label>
            <select
              value={filtroCanchaId}
              onChange={(e) => setFiltroCanchaId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            >
              <option value="">Todas las canchas</option>
              {canchas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Estado</label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            >
              <option value="">Todas</option>
              <option value="ACTIVA">ACTIVA</option>
              <option value="CANCELADA">CANCELADA</option>
            </select>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2">
            {hayFiltrosActivos && (
              <button
                onClick={limpiarFiltros}
                className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabla de Reservas */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">ID</th>
                <th className="py-3.5 px-4">Jugador</th>
                <th className="py-3.5 px-4">Cancha</th>
                <th className="py-3.5 px-4">Fecha</th>
                <th className="py-3.5 px-4">Franja Horaria</th>
                <th className="py-3.5 px-4">Valor</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    Cargando reservas...
                  </td>
                </tr>
              ) : reservasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No se encontraron reservas con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                reservasFiltradas.map((reserva) => {
                  const esActiva = reserva.estado === 'ACTIVA';
                  return (
                    <tr key={reserva.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">#{reserva.id}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{reserva.usuarioNombre}</div>
                        <div className="text-xs text-slate-500">{reserva.usuarioEmail}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{reserva.canchaNombre}</div>
                        {reserva.canchaTipoSuelo && (
                          <div className="text-xs text-slate-500">{reserva.canchaTipoSuelo}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-800">
                        {reserva.fecha}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 text-xs">
                          {formatearHora(reserva.horaInicio)} - {formatearHora(reserva.horaFin)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                        ${Number(reserva.precioHistorico || 0).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            esActiva
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-100 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {reserva.estado}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {esActiva ? (
                          <div className="inline-flex items-center justify-end gap-2">
                            <button
                              onClick={() => abrirModalReprogramar(reserva)}
                              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 text-xs font-semibold transition"
                            >
                              Modificar Hora
                            </button>
                            <button
                              onClick={() => setReservaACancelar(reserva)}
                              className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition"
                            >
                              Cancelar Reserva
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Sin acciones</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Reprogramación de Hora */}
      {reservaAReprogramar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Modificar Horario — Reserva #{reservaAReprogramar.id}</h3>
                <p className="text-xs text-slate-300">
                  {reservaAReprogramar.usuarioNombre} ({reservaAReprogramar.usuarioEmail}) •{' '}
                  {reservaAReprogramar.canchaNombre}
                </p>
              </div>
              <button
                type="button"
                onClick={cerrarModalReprogramar}
                className="text-slate-400 hover:text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarReprogramacion} className="p-6 space-y-5">
              {/* Info actual */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-600 flex flex-wrap gap-4 justify-between">
                <span>
                  <strong>Horario actual:</strong> {reservaAReprogramar.fecha} de{' '}
                  {formatearHora(reservaAReprogramar.horaInicio)} a{' '}
                  {formatearHora(reservaAReprogramar.horaFin)}
                </span>
                <span>
                  <strong>Tarifa congelada:</strong> $
                  {Number(reservaAReprogramar.precioHistorico || 0).toFixed(2)}
                </span>
              </div>

              {/* Alerta de conflicto o error dentro del modal */}
              {errorModalReprogramar && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium">
                  {errorModalReprogramar}
                </div>
              )}

              {/* Selector de nueva fecha */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Nueva Fecha
                </label>
                <input
                  type="date"
                  required
                  value={nuevaFecha}
                  onChange={handleCambioFechaModal}
                  className="w-full sm:w-64 px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>

              {/* Selector de bloques horarios */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Selecciona el Nuevo Bloque Horario (08:00 - 22:00)
                </label>

                {cargandoBloques ? (
                  <div className="py-8 text-center text-sm text-slate-500">
                    Consultando disponibilidad...
                  </div>
                ) : bloquesDisponibles.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                    No hay bloques disponibles para mostrar en esta fecha.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-64 overflow-y-auto pr-1">
                    {bloquesDisponibles.map((bloque) => {
                      const esHorarioActual =
                        nuevaFecha === reservaAReprogramar.fecha &&
                        bloque.horaInicio === reservaAReprogramar.horaInicio;
                      const seleccionable = bloque.disponible || esHorarioActual;
                      const seleccionado = nuevaHoraInicio === bloque.horaInicio;

                      return (
                        <button
                          key={bloque.horaInicio}
                          type="button"
                          disabled={!seleccionable}
                          onClick={() => {
                            setNuevaHoraInicio(bloque.horaInicio);
                            setErrorModalReprogramar('');
                          }}
                          className={`p-2.5 rounded-xl border text-left transition flex flex-col ${
                            seleccionado
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                              : seleccionable
                              ? 'bg-white hover:bg-emerald-50 text-slate-800 border-slate-200 hover:border-emerald-300'
                              : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-70'
                          }`}
                        >
                          <span className="text-xs font-bold">
                            {formatearHora(bloque.horaInicio)} - {formatearHora(bloque.horaFin)}
                          </span>
                          <span
                            className={`text-[10px] font-semibold mt-0.5 ${
                              seleccionado
                                ? 'text-emerald-100'
                                : esHorarioActual
                                ? 'text-amber-600'
                                : bloque.disponible
                                ? 'text-emerald-600'
                                : 'text-rose-500'
                            }`}
                          >
                            {esHorarioActual
                              ? 'Horario actual'
                              : bloque.disponible
                              ? 'Disponible'
                              : 'Ocupado'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={guardandoReprogramacion}
                  onClick={cerrarModalReprogramar}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoReprogramacion || !nuevaHoraInicio}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-sm shadow-sm transition"
                >
                  {guardandoReprogramacion ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Cancelación */}
      {reservaACancelar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                ⚠️
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">¿Cancelar Reserva #{reservaACancelar.id}?</h3>
                <p className="text-xs text-slate-500">Esta acción liberará el horario inmediatamente</p>
              </div>
            </div>

            <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-4 text-xs text-rose-900 space-y-1.5 mb-6">
              <p>
                <strong>Jugador:</strong> {reservaACancelar.usuarioNombre} ({reservaACancelar.usuarioEmail})
              </p>
              <p>
                <strong>Cancha:</strong> {reservaACancelar.canchaNombre}
              </p>
              <p>
                <strong>Fecha:</strong> {reservaACancelar.fecha}
              </p>
              <p>
                <strong>Horario:</strong> {formatearHora(reservaACancelar.horaInicio)} -{' '}
                {formatearHora(reservaACancelar.horaFin)}
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
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm shadow-sm transition"
              >
                {cancelando ? 'Cancelando...' : 'Sí, Cancelar Reserva'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
