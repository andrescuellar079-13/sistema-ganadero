// frontend/src/pages/DashboardPage.jsx
import React, { useState } from 'react'
import { useDashboard } from '../hooks/useDashboard'
import { useFincas } from '../hooks/useFincas' 
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'

// Importamos componentes visuales de Recharts
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, CartesianGrid
} from 'recharts'

const DashboardPage = () => {
  const { fincaActual } = useFincas()
  const fincaId = fincaActual?.id || "1" 

  // Estados para manejar el rango de fechas en la interfaz
  const [tipoFiltro, setTipoFiltro] = useState('ANIO') // Opciones: 'ANIO', 'MES', 'PERSONALIZADO'
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')

  // Pasamos los parámetros de filtrado directo al hook actualizado
  const { loading, error, kpis, datosMensuales } = useDashboard(fincaId, {
    tipoFiltro,
    fechaInicio,
    fechaFin
  })

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />

  // Formateadores para las tarjetas superiores
  const formatearDinero = (valor) => {
    const numero = typeof valor === 'number' ? valor : 0;
    return '$ ' + numero.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
  };

  const formatearLeche = (litros) => {
    const numero = typeof litros === 'number' ? litros : 0;
    return numero.toFixed(1).replace(/\d(?=(\d{3})+\.)/g, '$&,') + ' Lts';
  };

  // Formateador compacto para el eje vertical ($2M, $4M, etc.)
  const formatearEjeMoneda = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1).replace('.0', '')}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1).replace('.0', '')}K`;
    }
    return `$${value}`;
  };

  // Texto dinámico para las etiquetas según el filtro activo
  const obtenerEtiquetaPeriodo = (textoBase) => {
    if (tipoFiltro === 'ANIO') return `${textoBase} del Año`;
    if (tipoFiltro === 'MES') return `${textoBase} del Mes`;
    return `${textoBase} del Período`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Encabezado con Barra de Herramientas Temporal */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Dashboard Ganadero</h1>
          <p className="text-sm text-gray-400 mt-1">Análisis operativo de la finca</p>
        </div>
        
        {/* Controles del Filtro de Tiempo */}
        <div className="flex flex-wrap items-center gap-3">
          <select 
            value={tipoFiltro}
            onChange={(e) => setTipoFiltro(e.target.value)}
            className="text-sm bg-gray-50 border border-gray-200 text-gray-700 px-3 py-2 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ANIO">Resumen Anual</option>
            <option value="MES">Mes Actual</option>
            <option value="PERSONALIZADO">Rango Personalizado</option>
          </select>

          {/* Renderizado Condicional: Muestra calendarios solo si elige 'Rango Personalizado' */}
          {tipoFiltro === 'PERSONALIZADO' && (
            <div className="flex items-center gap-2 animate-fadeIn">
              <input 
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="text-sm bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-400 font-bold">al</span>
              <input 
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="text-sm bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Grid de Bloques Numéricos (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Animales</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{kpis.totalAnimales}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-pink-500 hover:shadow-md transition-shadow">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Vacas Totales</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{kpis.vacas}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Crías / Terneros</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{kpis.crias}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Partos (Próx. 30 días)</p>
          <p className="text-3xl font-bold text-purple-600 mt-2">{kpis.partosProximos}</p>
        </div>

        {/* Tarjetas dinámicas basadas en el filtro seleccionado */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{obtenerEtiquetaPeriodo('Ventas')}</p>
          <p className="text-2xl font-bold text-emerald-600 mt-2">{formatearDinero(kpis.ventasMes)}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{obtenerEtiquetaPeriodo('Gastos')}</p>
          <p className="text-2xl font-bold text-red-600 mt-2">{formatearDinero(kpis.gastosMes)}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Producción Leche</p>
          <p className="text-2xl font-bold text-amber-600 mt-2">{formatearLeche(kpis.produccionMes)}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Enfermos / Tratamiento</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">{kpis.enfermos}</p>
        </div>
      </div>

      {/* SECCIÓN DE GRÁFICOS ESTADÍSTICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        
        {/* Gráfico 1: Balance Financiero */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-md font-bold text-gray-700 uppercase tracking-wider mb-4">Balance Financiero Mensual</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datosMensuales} margin={{ top: 10, right: 10, left: 15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} tickFormatter={formatearEjeMoneda} />
                <Tooltip formatter={(value) => ['$' + value.toLocaleString('es-ES'), '']} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px', fontSize: '13px' }} />
                <Bar dataKey="ventas" name="Ventas" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="gastos" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Tendencia de Leche */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-md font-bold text-gray-700 uppercase tracking-wider mb-4">Tendencia de Producción Lechera</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={datosMensuales} margin={{ top: 10, right: 20, left: 15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} tickFormatter={(value) => `${value} L`} />
                <Tooltip formatter={(value) => [value.toLocaleString('es-ES') + ' Lts', 'Leche']} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px', fontSize: '13px' }} />
                <Line type="monotone" dataKey="leche" name="Producción (Litros)" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  )
}

export default DashboardPage