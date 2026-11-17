import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axiosClient from '../api/axiosClient';

export default function ReportesAdmin() {
  // Inicialización de rango de fechas por defecto (del primer día del mes actual a hoy)
  const hoyStr = new Date().toISOString().split('T')[0];
  const primerDiaMesStr = (() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  })();

  const [fechaInicio, setFechaInicio] = useState(primerDiaMesStr);
  const [fechaFin, setFechaFin] = useState(hoyStr);
  const [reporte, setReporte] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const cargarReporte = useCallback(async () => {
    if (!fechaInicio || !fechaFin) {
      setErrorMsg('Por favor selecciona tanto la fecha de inicio como la de fin.');
      return;
    }
    if (fechaInicio > fechaFin) {
      setErrorMsg('La fecha de inicio no puede ser posterior a la fecha de fin.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      const res = await axiosClient.get('/reportes/ingresos', {
        params: { fechaInicio, fechaFin },
      });
      setReporte(res.data);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error al obtener el reporte de ingresos.');
    } finally {
      setLoading(false);
    }
  }, [fechaInicio, fechaFin]);

  useEffect(() => {
    cargarReporte();
  }, [cargarReporte]);

  // Totales acumulados
  const totales = useMemo(() => {
    const reservas = reporte.reduce((acc, curr) => acc + Number(curr.totalReservas || 0), 0);
    const ingresos = reporte.reduce((acc, curr) => acc + Number(curr.ingresosTotales || 0), 0);
    return { reservas, ingresos };
  }, [reporte]);

  // Descarga del reporte CSV usando responseType: 'blob'
  const handleExportarCsv = async () => {
    try {
      setExporting(true);
      setErrorMsg('');

      const response = await axiosClient.get('/reportes/ingresos/csv', {
        params: { fechaInicio, fechaFin },
        responseType: 'blob',
      });

      // Creación dinámica del enlace en el DOM para forzar la descarga
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `reporte_ingresos_${fechaInicio}_a_${fechaFin}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      setErrorMsg('No se pudo exportar el archivo CSV. Intenta nuevamente.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Título de la sección */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Reporte de Utilización e Ingresos</h2>
          <p className="text-sm text-slate-500">
            Métricas consolidadas de ocupación por cancha deportiva (reservas activas)
          </p>
        </div>

        {/* Botón de Exportación CSV */}
        <button
          onClick={handleExportarCsv}
          disabled={exporting || loading || reporte.length === 0}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-5 rounded-xl shadow-sm transition-all text-sm"
        >
          {exporting ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            /* Icono SVG de Descarga */
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          )}
          <span>{exporting ? 'Generando CSV...' : 'Exportar a CSV'}</span>
        </button>
      </div>

      {/* Barra de Filtro de Fechas */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-end md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="border border-slate-300 rounded-xl px-3.5 py-2 text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Fecha Fin
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="border border-slate-300 rounded-xl px-3.5 py-2 text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 shadow-sm"
            />
          </div>

          <button
            onClick={cargarReporte}
            disabled={loading}
            className="self-end px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition shadow-sm flex items-center gap-2"
          >
            {loading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
            <span>Generar Reporte</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 self-start md:self-center">
          Período evaluado: <span className="font-semibold text-slate-800">{fechaInicio}</span> al <span className="font-semibold text-slate-800">{fechaFin}</span>
        </div>
      </div>

      {/* Alerta de Error */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-sm flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-rose-500 hover:text-rose-700 font-bold ml-2">×</button>
        </div>
      )}

      {/* Cards de Métricas Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl font-bold">
            💰
          </div>
          <div>
            <p className="text-xs uppercase font-bold text-slate-400">Ingresos Totales</p>
            <p className="text-2xl font-black text-slate-900">
              ${totales.ingresos.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center text-xl font-bold">
            📅
          </div>
          <div>
            <p className="text-xs uppercase font-bold text-slate-400">Total Reservas Confirmadas</p>
            <p className="text-2xl font-black text-slate-900">{totales.reservas}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl font-bold">
            🏟️
          </div>
          <div>
            <p className="text-xs uppercase font-bold text-slate-400">Canchas con Actividad</p>
            <p className="text-2xl font-black text-slate-900">{reporte.length}</p>
          </div>
        </div>
      </div>

      {/* Tabla Estilizada de Reportes */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-slate-600 font-semibold">
              <tr>
                <th className="px-6 py-4 text-left">Cancha Deportiva</th>
                <th className="px-6 py-4 text-center">Total Reservas</th>
                <th className="px-6 py-4 text-right">Ingresos Totales</th>
                <th className="px-6 py-4 text-right">% de Participación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center py-10 text-slate-500">
                    <div className="inline-block animate-spin rounded-full h-7 w-7 border-b-2 border-emerald-600 mr-2 align-middle"></div>
                    Calculando métricas de utilización...
                  </td>
                </tr>
              ) : reporte.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-12 text-slate-400">
                    No se registraron reservas activas para el período seleccionado.
                  </td>
                </tr>
              ) : (
                reporte.map((fila) => {
                  const porcentaje = totales.ingresos > 0 
                    ? ((Number(fila.ingresosTotales) / totales.ingresos) * 100).toFixed(1)
                    : 0;

                  return (
                    <tr key={fila.canchaId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">
                        {fila.nombreCancha}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {fila.totalReservas} turnos
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-slate-900 text-base">
                        ${Number(fila.ingresosTotales).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right text-slate-500 text-xs font-medium">
                        {porcentaje}%
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Fila Total General */}
            {reporte.length > 0 && !loading && (
              <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-200">
                <tr>
                  <td className="px-6 py-4 text-slate-900 uppercase text-xs tracking-wider">
                    Total General
                  </td>
                  <td className="px-6 py-4 text-center text-slate-900">
                    {totales.reservas} turnos
                  </td>
                  <td className="px-6 py-4 text-right text-emerald-700 text-lg font-black">
                    ${totales.ingresos.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-400 text-xs">
                    100%
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
