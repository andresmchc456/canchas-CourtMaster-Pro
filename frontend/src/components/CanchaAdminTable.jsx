import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

const initialFormState = {
  nombre: '',
  tipoSuelo: 'Césped Sintético',
  iluminacion: true,
  tarifaBase: '',
  activa: true,
};

export default function CanchaAdminTable() {
  const [canchas, setCanchas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const cargarCanchas = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await axiosClient.get('/canchas');
      setCanchas(res.data);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error al cargar el inventario de canchas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCanchas();
  }, []);

  const handleOpenModal = (cancha = null) => {
    setErrorMsg('');
    setSuccessMsg('');
    if (cancha) {
      setEditingId(cancha.id);
      setFormData({
        nombre: cancha.nombre,
        tipoSuelo: cancha.tipoSuelo,
        iluminacion: cancha.iluminacion,
        tarifaBase: cancha.tarifaBase,
        activa: cancha.activa,
      });
    } else {
      setEditingId(null);
      setFormData(initialFormState);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData(initialFormState);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const payload = {
        ...formData,
        tarifaBase: parseFloat(formData.tarifaBase),
      };

      if (editingId) {
        await axiosClient.put(`/canchas/${editingId}`, payload);
        setSuccessMsg('Cancha actualizada correctamente.');
      } else {
        await axiosClient.post('/canchas', payload);
        setSuccessMsg('Cancha creada exitosamente.');
      }

      handleCloseModal();
      cargarCanchas();
    } catch (err) {
      const serverErrors = err.response?.data?.errors;
      if (serverErrors) {
        const errorList = Object.values(serverErrors).join(', ');
        setErrorMsg(errorList);
      } else {
        setErrorMsg(err.response?.data?.message || 'Error al guardar la cancha.');
      }
    }
  };

  const handleDesactivar = async (id, nombre) => {
    if (!window.confirm(`¿Estás seguro de desactivar la cancha "${nombre}"? No aparecerá en el catálogo de clientes.`)) {
      return;
    }
    try {
      setErrorMsg('');
      await axiosClient.delete(`/canchas/${id}`);
      setSuccessMsg(`Cancha "${nombre}" desactivada.`);
      cargarCanchas();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error al desactivar la cancha.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header y Acciones */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Inventario y Configuración de Canchas</h2>
          <p className="text-sm text-slate-500">Administra disponibilidad, tipos de superficie y tarifas</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-xl shadow-sm transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Nueva Cancha
        </button>
      </div>

      {/* Notificaciones */}
      {errorMsg && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-red-500 hover:text-red-700 font-bold ml-2">×</button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-sm flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-500 hover:text-emerald-700 font-bold ml-2">×</button>
        </div>
      )}

      {/* Tabla con estilo Tailwind */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-slate-600 font-semibold">
              <tr>
                <th className="px-6 py-3.5 text-left">Nombre</th>
                <th className="px-6 py-3.5 text-left">Superficie</th>
                <th className="px-6 py-3.5 text-center">Iluminación</th>
                <th className="px-6 py-3.5 text-left">Tarifa Base</th>
                <th className="px-6 py-3.5 text-center">Estado</th>
                <th className="px-6 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-500">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600 mr-2"></div>
                    Cargando canchas...
                  </td>
                </tr>
              ) : canchas.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-400">
                    No hay canchas registradas en el sistema.
                  </td>
                </tr>
              ) : (
                canchas.map((cancha) => (
                  <tr key={cancha.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">{cancha.nombre}</td>
                    <td className="px-6 py-4 text-slate-600">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                        {cancha.tipoSuelo}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {cancha.iluminacion ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          ⚡ LED Activa
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Sin luz</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      ${Number(cancha.tarifaBase).toFixed(2)} <span className="text-xs text-slate-400 font-normal">/ hora</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                          cancha.activa
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {cancha.activa ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenModal(cancha)}
                        className="px-3 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                      >
                        Editar
                      </button>
                      {cancha.activa && (
                        <button
                          onClick={() => handleDesactivar(cancha.id, cancha.nombre)}
                          className="px-3 py-1 text-xs font-semibold text-rose-600 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
                        >
                          Desactivar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para Crear y Editar Cancha */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <h3 className="text-xl font-bold text-slate-900">
                {editingId ? 'Editar Cancha' : 'Nueva Cancha Deportiva'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Nombre de la Cancha *
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                  placeholder="Ej. Cancha Principal de Fútbol 5"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Tipo de Suelo *
                  </label>
                  <select
                    value={formData.tipoSuelo}
                    onChange={(e) => setFormData({ ...formData, tipoSuelo: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white transition"
                  >
                    <option value="Césped Sintético">Césped Sintético</option>
                    <option value="Parquet">Parquet</option>
                    <option value="Arcilla">Arcilla</option>
                    <option value="Cemento">Cemento</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Tarifa Base ($ / hora) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={formData.tarifaBase}
                    onChange={(e) => setFormData({ ...formData, tarifaBase: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                    placeholder="Ej. 40.00"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.iluminacion}
                    onChange={(e) => setFormData({ ...formData, iluminacion: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="text-sm font-medium text-slate-800">
                    Cuenta con Iluminación Artificial
                  </span>
                </label>

                {editingId && (
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.activa}
                      onChange={(e) => setFormData({ ...formData, activa: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    />
                    <span className="text-sm font-medium text-slate-800">
                      Cancha habilitada (Activa)
                    </span>
                  </label>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl font-medium text-sm transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-sm shadow-sm transition"
                >
                  {editingId ? 'Guardar Cambios' : 'Crear Cancha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

