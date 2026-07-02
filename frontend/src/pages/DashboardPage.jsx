// frontend/src/pages/DashboardPage.jsx
// Centro de control operativo: solo lectura + navegación.
// Todos los KPIs provienen de los resolvers de resumen reales de cada módulo
// (ver useDashboard). El Dashboard no recalcula ni duplica datos.
//
// Capa de presentación migrada al design system GanadoSoft
// (ver ../theme/ganadoTokens y ../components/dashboard). El color de cada tile
// NO se hardcodea: se deriva del valor real vía resolverEstado (PASO 3).
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDashboard } from '../hooks/useDashboard'
import { useFincas } from '../hooks/useFincas'

import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

import {
  Box, Stack, Button, Select, MenuItem, FormControl, TextField,
  CircularProgress, Alert, Typography,
} from '@mui/material'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined'

import { ganado } from '../theme/ganadoTokens'
import {
  StatTile, FinanceCard, SectionHeader, AttentionStrip, ActionRow, Panel, DonutChart,
  resolverEstado,
} from '../components/dashboard'

// Formatea el componente numérico del dinero (sin prefijo de moneda): 6,645,533.40
const fmtNum = (v) => Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// Grilla de tiles con colapso responsive (5→3→2→1 según el brief).
const gridTiles = (cols) => ({
  display: 'grid',
  gap: `${ganado.space.tileGap}px`,
  gridTemplateColumns: {
    xs: '1fr',
    sm: 'repeat(2, 1fr)',
    md: `repeat(${Math.min(cols, 3)}, 1fr)`,
    lg: `repeat(${cols}, 1fr)`,
  },
})

const sectionSx = { mb: `${ganado.space.sectionGap}px` }

const DashboardPage = () => {
  const navigate = useNavigate()
  const { fincaActual } = useFincas()
  const fincaId = fincaActual?.id || '1'
  const anioActual = new Date().getFullYear()

  const [tipoFiltro, setTipoFiltro] = useState('ANIO')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')

  const {
    loading, error,
    datosMensuales, secciones, finanzas, distribucionCategoria,
  } = useDashboard(fincaId, { tipoFiltro, fechaInicio, fechaFin })

  // -------- Estados globales de carga / error --------
  if (loading && !secciones?.animales) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 2, bgcolor: ganado.color.bg }}>
        <CircularProgress sx={{ color: ganado.color.primary }} />
        <Typography sx={{ color: ganado.color.muted }}>Cargando Dashboard...</Typography>
      </Box>
    )
  }
  if (error) {
    return (
      <Box sx={{ p: 3, bgcolor: ganado.color.bg, minHeight: '100%' }}>
        <Alert severity="error" sx={{ maxWidth: 640, mx: 'auto', mt: 6 }}>
          Error al cargar resumen. {error.message}
        </Alert>
      </Box>
    )
  }

  const a = secciones.animales || {}
  const p = secciones.produccion || {}
  const s = secciones.sanidad || {}
  const r = secciones.reproduccion || {}
  const al = secciones.alertas || {}

  const etiquetaPeriodo = tipoFiltro === 'ANIO' ? 'del Año' : tipoFiltro === 'MES' ? 'del Mes' : 'del Período'

  // -------- Estados derivados (función pura del PASO 3 sobre valores reales) --------
  const estRetiro   = resolverEstado('animalesEnRetiro', s.animalesEnRetiro)
  const estTrat     = resolverEstado('tratamientosActivos', s.tratamientosActivos)
  const estVacunas  = resolverEstado('vacunasVencidas', s.vacunasVencidas)
  const estDespar   = resolverEstado('desparasitacionesVencidas', s.desparasitacionesVencidas)
  const estMastitis = resolverEstado('mastitisActivas', s.mastitisActivas)
  const estCriticas = resolverEstado('alertasCriticas', al.criticas)
  const estVencidas = resolverEstado('alertasVencidas', al.vencidas)
  const estPend     = resolverEstado('alertasPendientes', al.pendientes)

  const sanidadAccion = [estVacunas, estDespar, estMastitis].filter((st) => st === 'warn' || st === 'crit').length
  const alertasSinResolver = (al.pendientes ?? 0) + (al.vencidas ?? 0) + (al.criticas ?? 0)

  // -------- Barra "Requiere tu atención hoy" (firma del diseño) --------
  const atencion = [
    { value: al.vencidas ?? 0, label: 'Alertas vencidas' },
    { value: al.pendientes ?? 0, label: 'Pendientes' },
    { value: (s.vacunasVencidas ?? 0) + (s.desparasitacionesVencidas ?? 0), label: 'Vacunas/Desp.' },
    { value: p.animalesSinPesaje ?? 0, label: 'Sin pesaje' },
  ]

  // -------- Acciones pendientes (derivadas de contadores reales > 0) --------
  const acciones = [
    { label: 'Animales sin pesaje', count: p.animalesSinPesaje, icon: 'scale', to: '/produccion' },
    { label: 'Próximos partos (30 días)', count: r.proximosPartos, icon: 'crib', to: '/reproduccion' },
    { label: 'Tratamientos por cerrar', count: s.tratamientosActivos, icon: 'medical_services', to: '/sanidad' },
    { label: 'Vacunas por aplicar', count: s.vacunasVencidas, icon: 'vaccines', to: '/sanidad' },
    { label: 'Desparasitaciones por aplicar', count: s.desparasitacionesVencidas, icon: 'pest_control', to: '/sanidad' },
    { label: 'Animales en retiro', count: s.animalesEnRetiro, icon: 'block', to: '/sanidad' },
    { label: 'Alertas críticas', count: al.criticas, icon: 'crisis_alert', to: '/alertas' },
  ].filter((x) => (x.count ?? 0) > 0)

  // -------- Exportaciones (mantiene funcionalidad previa: balance financiero) --------
  const exportarExcel = () => {
    const filas = datosMensuales.map((m) => ({ Mes: m.name, Ventas: m.ventas, Gastos: m.gastos, 'Leche (L)': m.leche }))
    const ws = XLSX.utils.json_to_sheet(filas)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Resumen')
    XLSX.writeFile(wb, `Dashboard_${tipoFiltro}.xlsx`)
  }
  const exportarPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(16); doc.text('Resumen del Dashboard', 14, 18)
    doc.setFontSize(10); doc.text(`Periodo: ${etiquetaPeriodo}`, 14, 26)
    doc.autoTable({
      startY: 32,
      head: [['Mes', 'Ventas (Bs.)', 'Gastos (Bs.)', 'Leche (L)']],
      body: datosMensuales.map((m) => [m.name, m.ventas.toFixed(0), m.gastos.toFixed(0), m.leche.toFixed(1)]),
    })
    doc.save(`Dashboard_${tipoFiltro}.pdf`)
  }

  return (
    <Box sx={{ bgcolor: ganado.color.bg, minHeight: '100%', fontFamily: ganado.font.sans, color: ganado.color.ink }}>
      <Box sx={{ maxWidth: 1360, width: '100%', mx: 'auto', p: { xs: '18px', md: '26px 28px 48px' } }}>

        {/* ===================== ENCABEZADO + CONTROLES ===================== */}
        <Box sx={{ display: 'flex', alignItems: { md: 'center' }, justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: '24px' }}>
          <Box>
            <Typography component="h1" sx={{ fontSize: '19px', fontWeight: 600, letterSpacing: '-.3px', lineHeight: 1.2 }}>
              Dashboard
            </Typography>
            <Typography sx={{ fontSize: '11.5px', color: ganado.color.muted, mt: '2px' }}>
              Resumen operativo · {fincaActual?.nombre || 'Finca'}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.25} alignItems="center" flexWrap="wrap" useFlexGap>
            <FormControl size="small">
              <Select
                value={tipoFiltro}
                onChange={(e) => setTipoFiltro(e.target.value)}
                sx={{
                  minWidth: 160, bgcolor: ganado.color.surface, borderRadius: `${ganado.radius.sm}px`, fontWeight: 500,
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: ganado.color.lineStrong },
                }}
              >
                <MenuItem value="ANIO">Resumen Anual</MenuItem>
                <MenuItem value="MES">Mes Actual</MenuItem>
                <MenuItem value="PERSONALIZADO">Rango Personalizado</MenuItem>
              </Select>
            </FormControl>
            {tipoFiltro === 'PERSONALIZADO' && (
              <>
                <TextField
                  size="small" type="date" label="Desde" slotProps={{ inputLabel: { shrink: true } }}
                  value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)}
                  sx={{ bgcolor: ganado.color.surface, borderRadius: `${ganado.radius.sm}px` }}
                />
                <TextField
                  size="small" type="date" label="Hasta" slotProps={{ inputLabel: { shrink: true } }}
                  value={fechaFin} onChange={(e) => setFechaFin(e.target.value)}
                  sx={{ bgcolor: ganado.color.surface, borderRadius: `${ganado.radius.sm}px` }}
                />
              </>
            )}
            <Button
              size="small" variant="contained" onClick={exportarExcel} startIcon={<FileDownloadOutlinedIcon />}
              sx={{ bgcolor: ganado.color.primary, borderRadius: `${ganado.radius.sm}px`, '&:hover': { bgcolor: ganado.color.primary600 } }}
            >
              Excel
            </Button>
            <Button
              size="small" variant="outlined" onClick={exportarPDF} startIcon={<PictureAsPdfOutlinedIcon />}
              sx={{ color: ganado.color.primary600, borderColor: ganado.color.lineStrong, borderRadius: `${ganado.radius.sm}px`, '&:hover': { borderColor: ganado.color.primary, bgcolor: ganado.color.primaryTint } }}
            >
              PDF
            </Button>
          </Stack>
        </Box>

        {/* ===================== SIGNATURE: barra de atención ===================== */}
        <AttentionStrip items={atencion} />

        {/* ===================== PRODUCCIÓN & REPRODUCCIÓN ===================== */}
        <Box sx={sectionSx}>
          <SectionHeader title="Producción & Reproducción" count={`${a.activos ?? 0} animales activos`} />
          <Box sx={gridTiles(4)}>
            <StatTile
              index={0}
              label="Producción lechera promedio"
              value={Number(p.promedioLitrosVaca || 0).toFixed(1)}
              unit="L/vaca"
              icon="water_drop"
              state={resolverEstado('produccionLeche', p.promedioLitrosVaca)}
              foot={{ icon: 'schedule', text: 'Promedio del día' }}
              onClick={() => navigate('/produccion')}
            />
            <StatTile
              index={1}
              label="Vacas preñadas"
              value={r.vacasPrenadas ?? 0}
              icon="pregnant_woman"
              state={resolverEstado('vacasPrenadas', r.vacasPrenadas)}
              foot={(r.vacasPrenadas ?? 0) > 0 ? 'En gestación' : 'Ningún diagnóstico registrado'}
              onClick={() => navigate('/reproduccion')}
            />
            <StatTile
              index={2}
              label="Próximos partos (30 días)"
              value={r.proximosPartos ?? 0}
              icon="crib"
              state={resolverEstado('proximosPartos', r.proximosPartos)}
              foot={(r.proximosPartos ?? 0) > 0 ? 'Previstos este mes' : 'Sin partos previstos'}
              onClick={() => navigate('/reproduccion')}
            />
            <StatTile
              index={3}
              label="Animales en retiro"
              value={s.animalesEnRetiro ?? 0}
              icon="block"
              state={estRetiro}
              foot={(s.animalesEnRetiro ?? 0) > 0 ? { icon: 'error', text: 'En periodo de retiro' } : 'Todos aptos para venta'}
              onClick={() => navigate('/sanidad')}
            />
          </Box>
        </Box>

        {/* ===================== SANIDAD ===================== */}
        <Box sx={sectionSx}>
          <SectionHeader
            title="Sanidad"
            count={sanidadAccion > 0 ? `${sanidadAccion} indicador${sanidadAccion > 1 ? 'es' : ''} requiere${sanidadAccion > 1 ? 'n' : ''} acción` : 'Todo en orden'}
          />
          <Box sx={gridTiles(4)}>
            <StatTile
              index={0}
              label="Tratamientos activos"
              value={s.tratamientosActivos ?? 0}
              icon="medical_services"
              state={estTrat}
              foot={{ icon: 'visibility', text: 'En seguimiento' }}
              onClick={() => navigate('/sanidad')}
            />
            <StatTile
              index={1}
              label="Vacunas vencidas"
              value={s.vacunasVencidas ?? 0}
              icon="vaccines"
              state={estVacunas}
              foot={(s.vacunasVencidas ?? 0) > 0 ? { icon: 'error', text: 'Aplicar pronto' } : { icon: 'verified', text: 'Al día' }}
              onClick={() => navigate('/sanidad')}
            />
            <StatTile
              index={2}
              label="Desparasitaciones vencidas"
              value={s.desparasitacionesVencidas ?? 0}
              icon="pest_control"
              state={estDespar}
              foot={(s.desparasitacionesVencidas ?? 0) > 0 ? { icon: 'error', text: 'Aplicar pronto' } : { icon: 'verified', text: 'Al día' }}
              onClick={() => navigate('/sanidad')}
            />
            <StatTile
              index={3}
              label="Mastitis activas"
              value={s.mastitisActivas ?? 0}
              icon={(s.mastitisActivas ?? 0) > 0 ? 'sick' : 'check_circle'}
              state={estMastitis}
              foot={(s.mastitisActivas ?? 0) > 0 ? { icon: 'error', text: 'Requiere atención' } : { icon: 'verified', text: 'Sin casos' }}
              onClick={() => navigate('/sanidad')}
            />
          </Box>
        </Box>

        {/* ===================== FINANZAS ===================== */}
        <Box sx={sectionSx}>
          <SectionHeader title={`Finanzas ${etiquetaPeriodo}`} count={tipoFiltro === 'ANIO' ? `Gestión ${anioActual}` : etiquetaPeriodo} />
          <Box sx={{ display: 'grid', gap: `${ganado.space.tileGap}px`, gridTemplateColumns: { xs: '1fr', md: '1.4fr 1fr 1fr' } }}>
            <FinanceCard
              variant="hero"
              label={`Balance ${etiquetaPeriodo}`}
              currency="Bs"
              value={fmtNum(finanzas.balancePeriodo)}
              icon="account_balance"
              sub={(
                <>
                  <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: '2px', color: (finanzas.balancePeriodo ?? 0) >= 0 ? ganado.financeHero.subUp : ganado.financeHero.subDown }}>
                    {(finanzas.balancePeriodo ?? 0) >= 0 ? 'Positivo' : 'Negativo'}
                  </Box>
                  {(finanzas.gastosPeriodo ?? 0) === 0 && ' · sin egresos registrados aún'}
                </>
              )}
            />
            <FinanceCard
              variant="sky"
              label={`Ventas ${etiquetaPeriodo}`}
              currency="Bs"
              value={fmtNum(finanzas.ventasPeriodo)}
              icon="payments"
              sub="Ingresos acumulados"
            />
            <FinanceCard
              variant="default"
              label={`Gastos ${etiquetaPeriodo}`}
              currency="Bs"
              value={fmtNum(finanzas.gastosPeriodo)}
              icon="receipt_long"
              sub={(finanzas.gastosPeriodo ?? 0) > 0 ? 'Egresos del período' : 'Ningún gasto capturado'}
            />
          </Box>
        </Box>

        {/* ===================== ALERTAS ===================== */}
        <Box sx={sectionSx}>
          <SectionHeader title="Alertas" count={`${alertasSinResolver} sin resolver`} />
          <Box sx={gridTiles(4)}>
            <StatTile
              index={0}
              label="Alertas críticas"
              value={al.criticas ?? 0}
              icon="crisis_alert"
              state={estCriticas}
              foot={(al.criticas ?? 0) > 0 ? { icon: 'error', text: 'Atender ya' } : { icon: 'verified', text: 'Nada crítico' }}
              onClick={() => navigate('/alertas')}
            />
            <StatTile
              index={1}
              label="Alertas vencidas"
              value={al.vencidas ?? 0}
              icon="notification_important"
              state={estVencidas}
              foot={(al.vencidas ?? 0) > 0 ? { icon: 'error', text: 'Fuera de plazo' } : { icon: 'verified', text: 'Al día' }}
              onClick={() => navigate('/alertas')}
            />
            <StatTile
              index={2}
              label="Alertas pendientes"
              value={al.pendientes ?? 0}
              icon="pending_actions"
              state={estPend}
              foot={(al.pendientes ?? 0) > 0 ? { icon: 'schedule', text: 'Por revisar' } : 'Sin pendientes'}
              onClick={() => navigate('/alertas')}
            />
            <StatTile
              index={3}
              label="Alertas resueltas"
              value={al.resueltas ?? 0}
              icon="task_alt"
              state={resolverEstado('alertasResueltas', al.resueltas)}
              foot={(al.resueltas ?? 0) > 0 ? `${al.resueltas} resueltas` : 'Aún sin resolver'}
              onClick={() => navigate('/alertas')}
            />
          </Box>
        </Box>

        {/* ===================== ACCIONES PENDIENTES + DISTRIBUCIÓN ===================== */}
        <Box sx={{ display: 'grid', gap: `${ganado.space.tileGap}px`, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
          <Panel title="Acciones pendientes" icon="checklist" pill={acciones.length > 0 ? `${acciones.length} tarea${acciones.length > 1 ? 's' : ''}` : null}>
            {acciones.length === 0 ? (
              <Box sx={{ py: 4, textAlign: 'center', color: ganado.color.muted }}>Sin acciones pendientes 🎉</Box>
            ) : (
              acciones.map((ac, i) => (
                <ActionRow key={i} icon={ac.icon} label={ac.label} count={ac.count} onClick={() => navigate(ac.to)} />
              ))
            )}
          </Panel>

          <Panel title="Distribución por categoría" icon="donut_small">
            {distribucionCategoria.length === 0 ? (
              <Box sx={{ py: 4, textAlign: 'center', color: ganado.color.muted }}>Sin datos de categorías</Box>
            ) : (
              <DonutChart segments={distribucionCategoria} total={a.total} label="ANIMALES" />
            )}
          </Panel>
        </Box>

      </Box>
    </Box>
  )
}

export default DashboardPage
