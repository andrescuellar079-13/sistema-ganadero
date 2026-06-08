// frontend/src/hooks/useDashboard.js
import { useQuery } from '@apollo/client'
import { GET_DASHBOARD_COMPLETO } from '../graphql/dashboard'

export const useDashboard = (fincaId, filtroParams) => {
  const anioActual = new Date().getFullYear();
  const { tipoFiltro, fechaInicio, fechaFin } = filtroParams;

  // Seguimos pidiendo los datos del año completo al backend para armar los gráficos estables
  const { data, loading, error } = useQuery(GET_DASHBOARD_COMPLETO, {
    variables: { fincaId, anio: anioActual },
    skip: !fincaId,
  });

  // Estructura base para los gráficos (Enero a Diciembre siempre fijos)
  const nombresMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const datosMensuales = nombresMeses.map(mes => ({
    name: mes,
    ventas: 0,
    gastos: 0,
    leche: 0
  }));

  const kpis = {
    totalAnimales: 0,
    vacas: 0,
    crias: 0,
    enfermos: 0,
    partosProximos: 0,
    ventasMes: 0,      // Ahora representará el total del período seleccionado
    gastosMes: 0,      // Ahora representará el total del período seleccionado
    produccionMes: 0   // Ahora representará el total del período seleccionado
  };

  // Función interna para validar si una fecha entra en el filtro seleccionado
  const cumpleFiltroFecha = (fechaStr) => {
    if (!fechaStr) return false;
    const fechaRegistro = new Date(fechaStr);
    const hoy = new Date();

    if (tipoFiltro === 'MES') {
      // Filtra si coincide con el mes actual y el año actual
      return fechaRegistro.getMonth() === hoy.getMonth() && 
             fechaRegistro.getFullYear() === hoy.getFullYear();
    }

    if (tipoFiltro === 'PERSONALIZADO') {
      // Filtra si está dentro del rango manual Desde / Hasta
      if (!fechaInicio || !fechaFin) return true; // Si falta alguna fecha, muestra todo
      const inicio = new Date(fechaInicio + 'T00:00:00');
      const fin = new Date(fechaFin + 'T23:59:59');
      return fechaRegistro >= inicio && fechaRegistro <= fin;
    }

    // Por defecto 'ANIO': entra todo el año actual
    return fechaRegistro.getFullYear() === anioActual;
  };

  if (data) {
    // 1. Procesar Animales (estos son totales fijos de la finca en tiempo real)
    kpis.totalAnimales = data.allAnimales?.length || 0;
    data.allAnimales?.forEach(animal => {
      const categoriaNom = animal.categoria?.nombre?.toUpperCase() || '';
      if (animal.sexo === 'HEMBRA' && categoriaNom.includes('VACA')) {
        kpis.vacas++;
      }
      if (categoriaNom.includes('CRIA') || categoriaNom.includes('TERNERO') || categoriaNom.includes('TERNERA')) {
        kpis.crias++;
      }
    });

    // 2. Partos Próximos
    kpis.partosProximos = data.proximosPartos?.length || 0;

    // 3. Procesar Ventas
    data.ventasPorAnio?.forEach(v => {
      const valor = parseFloat(v.montoTotal);
      const monto = isNaN(valor) ? 0 : valor;

      // Almacenar en el mes correspondiente para el gráfico (siempre anual)
      if (v.fechaVenta) {
        const mesIndex = new Date(v.fechaVenta).getMonth();
        if (mesIndex >= 0 && mesIndex < 12) {
          datosMensuales[mesIndex].ventas += monto;
        }
        
        // Sumar al KPI acumulador de arriba SOLO si cumple el filtro temporal
        if (cumpleFiltroFecha(v.fechaVenta)) {
          kpis.ventasMes += monto;
        }
      }
    });

    // 4. Procesar Gastos/Compras
    data.comprasPorAnio?.forEach(c => {
      const valor = parseFloat(c.montoTotal);
      const monto = isNaN(valor) ? 0 : valor;

      // Almacenar en el mes correspondiente para el gráfico
      if (c.fechaCompra) {
        const mesIndex = new Date(c.fechaCompra).getMonth();
        if (mesIndex >= 0 && mesIndex < 12) {
          datosMensuales[mesIndex].gastos += monto;
        }

        // Sumar al KPI acumulador SOLO si cumple el filtro temporal
        if (cumpleFiltroFecha(c.fechaCompra)) {
          kpis.gastosMes += monto;
        }
      }
    });

    // 5. Procesar Leche
    data.produccionesLeche?.forEach(p => {
      const valor = parseFloat(p.litros);
      const litros = isNaN(valor) ? 0 : valor;

      // Almacenar en el mes correspondiente para el gráfico
      if (p.fecha) {
        const mesIndex = new Date(p.fecha).getMonth();
        if (mesIndex >= 0 && mesIndex < 12) {
          datosMensuales[mesIndex].leche += litros;
        }

        // Sumar al KPI acumulador SOLO si cumple el filtro temporal
        if (cumpleFiltroFecha(p.fecha)) {
          kpis.produccionMes += litros;
        }
      }
    });
  }

  return { loading, error, kpis, datosMensuales };
};