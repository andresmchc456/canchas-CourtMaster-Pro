import React, { useState, useEffect, useMemo } from 'react';
import axiosClient from '../api/axiosClient';

export default function CatalogoCanchas({ onSelectCancha }) {
  const [canchas, setCanchas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [filtroSuelo, setFiltroSuelo] = useState('TODOS');
  const [precioMax, setPrecioMax] = useState('');

  useEffect(() => {
    const fetchCanchasActivas = async () => {
      try {
        setLoading(true);
        setErrorMsg('');
        const res = await axiosClient.get('/canchas/activas');
        setCanchas(res.data);
      } catch (err) {
        setErrorMsg('No se pudieron cargar las canchas disponibles. Por favor, intenta más tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchCanchasActivas();
  }, []);

  // Filtrado local reactivo en memoria
  const canchasFiltradas = useMemo(() => {
    return canchas.filter((cancha) => {
      const matchSuelo =
        filtroSuelo === 'TODOS' ||
        cancha.tipoSuelo.toLowerCase() === filtroSuelo.toLowerCase();

      const matchPrecio =
        precioMax === '' ||
        Number(cancha.tarifaBase) <= Number(precioMax);

      return matchSuelo && matchPrecio;
    });
  }, [canchas, filtroSuelo, precioMax]);

  return (
    <div className="space-y-8">
      {/* Barra de Filtros */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Superficie
              </label>
              <select
                value={filtroSuelo}
                onChange={(e) => setFiltroSuelo(e.target.value)}
                className="border border-slate-300 rounded-xl px-3.5 py-2 text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
              >
                <option value="TODOS">Todas las superficies</option>
                <option value="Césped Sintético">Césped Sintético</option>
                <option value="Parquet">Parquet</option>
                <option value="Arcilla">Arcilla</option>
                <option value="Cemento">Cemento</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Precio Máximo / Hora ($)
              </label>
              <input
                type="number"
                min="0"
                placeholder="Cualquier precio"
                value={precioMax}
                onChange={(e) => setPrecioMax(e.target.value)}
                className="border border-slate-300 rounded-xl px-3.5 py-2 text-sm w-36 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
              />
            </div>

            {(filtroSuelo !== 'TODOS' || precioMax !== '') && (
              <button
                onClick={() => {
                  setFiltroSuelo('TODOS');
                  setPrecioMax('');
                }}
                className="self-end mb-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          <div className="text-xs font-medium text-slate-500 self-start md:self-center">
            Mostrando <span className="font-bold text-slate-800">{canchasFiltradas.length}</span> de {canchas.length} canchas
          </div>
        </div>
      </div>

      {/* Manejo de estados de carga y error */}
      {errorMsg && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm">
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
          <p className="text-sm font-medium">Buscando canchas disponibles...</p>
        </div>
      ) : canchasFiltradas.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-8">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h4 className="text-base font-bold text-slate-800 mb-1">No se encontraron canchas</h4>
          <p className="text-sm text-slate-500">Prueba cambiando los filtros de superficie o aumentando el precio máximo.</p>
        </div>
      ) : (
        /* Grid de Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {canchasFiltradas.map((cancha) => (
            <div
              key={cancha.id}
              className="group bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Header visual con degradado moderno */}
                <div className="h-32 bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-800 p-5 flex flex-col justify-between text-white relative">
                  <div className="flex justify-between items-start">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md">
                      {cancha.tipoSuelo}
                    </span>
                    {cancha.iluminacion && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-400/90 text-slate-900 px-2.5 py-0.5 rounded-full shadow-sm">
                        ⚡ LED
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-white group-hover:translate-x-0.5 transition-transform">
                    {cancha.nombre}
                  </h3>
                </div>

                {/* Detalles de la tarjeta */}
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between text-sm py-1 border-b border-slate-100">
                    <span className="text-slate-500">Iluminación Nocturna</span>
                    <span className={`font-semibold ${cancha.iluminacion ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {cancha.iluminacion ? 'Disponible' : 'No disponible'}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-xs uppercase font-bold text-slate-400">Tarifa por hora</span>
                    <div className="text-right">
                      <span className="text-2xl font-black text-slate-900">
                        ${Number(cancha.tarifaBase).toFixed(2)}
                      </span>
                      <span className="text-xs text-slate-500 block">Impuestos incluidos</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botón de Acción */}
              <div className="p-5 pt-0">
                <button
                  onClick={() => {
                    if (onSelectCancha) {
                      onSelectCancha(cancha);
                    } else {
                      alert(`Has seleccionado ${cancha.nombre} para reservar.`);
                    }
                  }}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-semibold rounded-xl shadow-sm transition-all text-sm flex items-center justify-center gap-2"
                >
                  <span>Reservar Horario</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

