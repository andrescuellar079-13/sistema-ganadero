// frontend/src/pages/DashboardPage.jsx
// Centro de control operativo: solo lectura + navegación.
// Todos los KPIs provienen de los resolvers de resumen reales de cada módulo
// (ver useDashboard). El Dashboard no recalcula ni duplica datos.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDashboard } from '../hooks/useDashboard'
import { useFincas } from '../hooks/useFincas'
import DashboardCard from '../components/DashboardCard'

import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

import {
  Box, Grid, Paper, Typography, Stack, Divider, Button, Chip,
  Select, MenuItem, FormControl, TextField, CircularProgress, Alert,
  List, ListItemButton, ListItemIcon, ListItemText, Avatar,
} from '@mui/material'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell,
} from 'recharts'

import PetsOutlinedIcon from '@mui/icons-material/PetsOutlined'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined'
import SellOutlinedIcon from '@mui/icons-material/SellOutlined'
import HeartBrokenOutlinedIcon from '@mui/icons-material/HeartBrokenOutlined'
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined'
import ScaleOutlinedIcon from '@mui/icons-material/ScaleOutlined'
import FitnessCenterOutlinedIcon from '@mui/icons-material/FitnessCenterOutlined'
import PregnantWomanOutlinedIcon from '@mui/icons-material/PregnantWomanOutlined'
import ChildCareOutlinedIcon from '@mui/icons-material/ChildCareOutlined'
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined'
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined'
import VaccinesOutlinedIcon from '@mui/icons-material/VaccinesOutlined'
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined'
import LocalHospitalOutlinedIcon from '@mui/icons-material/LocalHospitalOutlined'
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined'
import PriceCheckOutlinedIcon from '@mui/icons-material/PriceCheckOutlined'
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined'
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined'
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined'
import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import DonutLargeOutlinedIcon from '@mui/icons-material/DonutLargeOutlined'
import ShowChartOutlinedIcon from '@mui/icons-material/ShowChartOutlined'
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined'

const PIE_COLORS = ['#047857', '#0284C7', '#EA580C', '#9333EA', '#0891B2', '#DC2626', '#7C3AED', '#0E7490', '#CA8A04', '#57534E']

// Paleta de marca
const GREEN = '#047857'
const GREEN_DARK = '#064E3B'
const SOFT_SHADOW = '0 1px 3px rgba(16,24,40,0.06)'

// Estilo base para paneles/tarjetas contenedoras
const panelSx = {
  p: { xs: 2, md: 2.5 },
  border: '1px solid #EAECF0',
  borderRadius: '16px',
  boxShadow: SOFT_SHADOW,
  bgcolor: '#fff',
}

const fmtDinero = (v) => 'Bs. ' + Number(v || 0).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')
const fmtLeche = (v) => Number(v || 0).toFixed(1).replace(/\d(?=(\d{3})+\.)/g, '$&,') + ' Lts'
const fmtEjeMoneda = (v) => {
  if (v >= 1_000_000) return `Bs. ${(v / 1_000_000).toFixed(1).replace('.0', '')}M`
  if (v >= 1_000) return `Bs. ${(v / 1_000).toFixed(1).replace('.0', '')}K`
  return `Bs. ${v}`
}

// Título de sección con barra de acento
const SectionTitle = ({ children, color = GREEN }) => (
  <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mt: 4, mb: 2 }}>
    <Box sx={{ width: 4, height: 20, borderRadius: 2, bgcolor: color }} />
    <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: 'text.primary', letterSpacing: 0.2 }}>
      {children}
    </Typography>
  </Stack>
)

// Panel de gráfico reutilizable (encabezado con ícono + contenedor consistente)
const ChartPanel = ({ title, icon: Icon, iconColor = GREEN, children }) => (
  <Paper elevation={0} sx={panelSx}>
    <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 2 }}>
      <Box sx={{
        width: 34, height: 34, borderRadius: '10px', flexShrink: 0,
        bgcolor: iconColor + '16',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {Icon && <Icon sx={{ fontSize: 19, color: iconColor }} />}
      </Box>
      <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
    </Stack>
    {children}
  </Paper>
)

// Estado vacío para gráficos
const SinDatos = () => (
  <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <Typography variant="body2" color="text.disabled">Sin datos para este periodo</Typography>
  </Box>
)

const DashboardPage = () => {
  const navigate = useNavigate()
  const { fincaActual } = useFincas()
  const fincaId = fincaActual?.id || '1'

  const [tipoFiltro, setTipoFiltro] = useState('ANIO')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')

  const {
    loading, error,
    datosMensuales, secciones, finanzas, distribucionCategoria, alertasPorTipo,
  } = useDashboard(fincaId, { tipoFiltro, fechaInicio, fechaFin })

  // -------- Estados globales de carga / error --------
  if (loading && !secciones?.animales) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 2 }}>
        <CircularProgress sx={{ color: GREEN }} />
        <Typography color="text.secondary">Cargando Dashboard...</Typography>
      </Box>
    )
  }
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
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

  // -------- Acciones pendientes (derivadas de contadores reales > 0) --------
  const acciones = [
    { label: 'Animales sin pesaje', count: p.animalesSinPesaje, icon: ScaleOutlinedIcon, to: '/produccion', color: '#EA580C' },
    { label: 'Próximos partos (30 días)', count: r.proximosPartos, icon: PregnantWomanOutlinedIcon, to: '/reproduccion', color: '#9333EA' },
    { label: 'Tratamientos activos', count: s.tratamientosActivos, icon: MedicalServicesOutlinedIcon, to: '/sanidad', color: '#EA580C' },
    { label: 'Vacunas vencidas', count: s.vacunasVencidas, icon: VaccinesOutlinedIcon, to: '/sanidad', color: '#DC2626' },
    { label: 'Desparasitaciones vencidas', count: s.desparasitacionesVencidas, icon: BugReportOutlinedIcon, to: '/sanidad', color: '#DC2626' },
    { label: 'Animales en retiro', count: s.animalesEnRetiro, icon: TimerOutlinedIcon, to: '/sanidad', color: '#DC2626' },
    { label: 'Alertas críticas', count: al.criticas, icon: ReportProblemOutlinedIcon, to: '/alertas', color: '#DC2626' },
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
    <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100%', p: { xs: 2, md: 3 } }}>
      <Box sx={{ maxWidth: 1720, mx: 'auto' }}>

        {/* ===================== ENCABEZADO (banner verde) ===================== */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3 },
            mb: 3,
            borderRadius: '18px',
            color: '#fff',
            background: `linear-gradient(120deg, ${GREEN_DARK} 0%, ${GREEN} 100%)`,
            boxShadow: '0 10px 30px rgba(4,120,87,0.25)',
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { md: 'center' },
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: -0.5 }}>
              Centro de Control Ganadero
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', mt: 0.5 }}>
              Resumen operativo en tiempo real · {fincaActual?.nombre || 'Finca'}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.25} alignItems="center" flexWrap="wrap" useFlexGap>
            <FormControl size="small">
              <Select
                value={tipoFiltro}
                onChange={(e) => setTipoFiltro(e.target.value)}
                sx={{
                  minWidth: 160,
                  bgcolor: '#fff',
                  borderRadius: '10px',
                  fontWeight: 600,
                  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
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
                  size="small" type="date" label="Desde" InputLabelProps={{ shrink: true }}
                  value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)}
                  sx={{ bgcolor: '#fff', borderRadius: '10px', '& .MuiOutlinedInput-notchedOutline': { border: 'none' } }}
                />
                <TextField
                  size="small" type="date" label="Hasta" InputLabelProps={{ shrink: true }}
                  value={fechaFin} onChange={(e) => setFechaFin(e.target.value)}
                  sx={{ bgcolor: '#fff', borderRadius: '10px', '& .MuiOutlinedInput-notchedOutline': { border: 'none' } }}
                />
              </>
            )}
            <Button
              size="small" variant="contained" onClick={exportarExcel}
              startIcon={<FileDownloadOutlinedIcon />}
              sx={{ bgcolor: '#fff', color: GREEN, borderRadius: '10px', '&:hover': { bgcolor: '#ECFDF5' } }}
            >
              Excel
            </Button>
            <Button
              size="small" variant="outlined" onClick={exportarPDF}
              startIcon={<PictureAsPdfOutlinedIcon />}
              sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.6)', borderRadius: '10px', '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.12)' } }}
            >
              PDF
            </Button>
          </Stack>
        </Paper>

        {/* ===================== RESUMEN GENERAL ===================== */}
        <SectionTitle color="#0284C7">Resumen General</SectionTitle>
        <Grid container spacing={2.5}>
          <Grid item xs={6} md={3}>
            <DashboardCard title="Total animales" value={a.total} icon={PetsOutlinedIcon} accent="#0284C7" subtitle={`${a.machos ?? 0} machos · ${a.hembras ?? 0} hembras`} onClick={() => navigate('/animales')} />
          </Grid>
          <Grid item xs={6} md={3}>
            <DashboardCard title="Animales activos" value={a.activos} icon={CheckCircleOutlineIcon} accent={GREEN} onClick={() => navigate('/animales')} />
          </Grid>
          <Grid item xs={6} md={3}>
            <DashboardCard title="Animales vendidos" value={a.vendidos} icon={SellOutlinedIcon} accent="#0891B2" onClick={() => navigate('/ventas')} />
          </Grid>
          <Grid item xs={6} md={3}>
            <DashboardCard title="Bajas / Muertes" value={a.bajas} icon={HeartBrokenOutlinedIcon} accent="#64748B" onClick={() => navigate('/bajas')} />
          </Grid>
        </Grid>

        {/* ===================== PRODUCCIÓN ===================== */}
        <SectionTitle color="#CA8A04">Producción</SectionTitle>
        <Grid container spacing={2.5}>
          <Grid item xs={6} md={3}>
            <DashboardCard title="Leche hoy" value={fmtLeche(finanzas.lecheHoy)} icon={WaterDropOutlinedIcon} accent="#CA8A04" subtitle={`Prom. ${Number(p.promedioLitrosVaca || 0).toFixed(1)} L/vaca`} onClick={() => navigate('/produccion')} />
          </Grid>
          <Grid item xs={6} md={3}>
            <DashboardCard title="Leche del mes" value={fmtLeche(finanzas.lecheMes)} icon={WaterDropOutlinedIcon} accent="#CA8A04" onClick={() => navigate('/produccion')} />
          </Grid>
          <Grid item xs={6} md={3}>
            <DashboardCard title="Animales en engorde" value={p.animalesEngorde} icon={FitnessCenterOutlinedIcon} accent="#EA580C" subtitle={p.animalesListosVenta > 0 ? `${p.animalesListosVenta} listos p/ venta` : null} onClick={() => navigate('/produccion')} />
          </Grid>
          <Grid item xs={6} md={3}>
            <DashboardCard title="Animales sin pesaje" value={p.animalesSinPesaje} icon={ScaleOutlinedIcon} accent="#EA580C" highlight={p.animalesSinPesaje > 0} onClick={() => navigate('/produccion')} />
          </Grid>
        </Grid>

        {/* ===================== REPRODUCCIÓN ===================== */}
        <SectionTitle color="#9333EA">Reproducción</SectionTitle>
        <Grid container spacing={2.5}>
          <Grid item xs={6} md={3}>
            <DashboardCard title="Vacas preñadas" value={r.vacasPrenadas} icon={PregnantWomanOutlinedIcon} accent="#9333EA" onClick={() => navigate('/reproduccion')} />
          </Grid>
          <Grid item xs={6} md={3}>
            <DashboardCard title="Próximos partos (30 días)" value={r.proximosPartos} icon={ChildCareOutlinedIcon} accent="#7C3AED" highlight={r.proximosPartos > 0} onClick={() => navigate('/reproduccion')} />
          </Grid>
        </Grid>

        {/* ===================== SANIDAD ===================== */}
        <SectionTitle color="#DC2626">Sanidad</SectionTitle>
        <Grid container spacing={2.5}>
          <Grid item xs={6} md={2.4}>
            <DashboardCard title="Tratamientos activos" value={s.tratamientosActivos} icon={MedicalServicesOutlinedIcon} accent="#EA580C" highlight={s.tratamientosActivos > 0} onClick={() => navigate('/sanidad')} />
          </Grid>
          <Grid item xs={6} md={2.4}>
            <DashboardCard title="Animales en retiro" value={s.animalesEnRetiro} icon={TimerOutlinedIcon} accent="#DC2626" highlight={s.animalesEnRetiro > 0} onClick={() => navigate('/sanidad')} />
          </Grid>
          <Grid item xs={6} md={2.4}>
            <DashboardCard title="Vacunas vencidas" value={s.vacunasVencidas} icon={VaccinesOutlinedIcon} accent="#DC2626" highlight={s.vacunasVencidas > 0} onClick={() => navigate('/sanidad')} />
          </Grid>
          <Grid item xs={6} md={2.4}>
            <DashboardCard title="Despar. vencidas" value={s.desparasitacionesVencidas} icon={BugReportOutlinedIcon} accent="#DC2626" highlight={s.desparasitacionesVencidas > 0} onClick={() => navigate('/sanidad')} />
          </Grid>
          <Grid item xs={6} md={2.4}>
            <DashboardCard title="Mastitis activas" value={s.mastitisActivas} icon={LocalHospitalOutlinedIcon} accent="#DB2777" highlight={s.mastitisActivas > 0} onClick={() => navigate('/sanidad')} />
          </Grid>
        </Grid>

        {/* ===================== FINANZAS ===================== */}
        <SectionTitle color={GREEN}>Finanzas</SectionTitle>
        <Grid container spacing={2.5}>
          <Grid item xs={12} md={4}>
            <DashboardCard title={`Ventas ${etiquetaPeriodo}`} value={fmtDinero(finanzas.ventasPeriodo)} icon={PaidOutlinedIcon} accent={GREEN} onClick={() => navigate('/ventas')} />
          </Grid>
          <Grid item xs={12} md={4}>
            <DashboardCard title={`Gastos ${etiquetaPeriodo}`} value={fmtDinero(finanzas.gastosPeriodo)} icon={PriceCheckOutlinedIcon} accent="#DC2626" onClick={() => navigate('/alertas')} />
          </Grid>
          <Grid item xs={12} md={4}>
            <DashboardCard title={`Balance ${etiquetaPeriodo}`} value={fmtDinero(finanzas.balancePeriodo)} icon={AccountBalanceOutlinedIcon} accent={finanzas.balancePeriodo >= 0 ? '#0284C7' : '#DC2626'} />
          </Grid>
        </Grid>

        {/* ===================== ALERTAS ===================== */}
        <SectionTitle color="#EA580C">Alertas</SectionTitle>
        <Grid container spacing={2.5}>
          <Grid item xs={6} md={3}>
            <DashboardCard title="Alertas críticas" value={al.criticas} icon={ReportProblemOutlinedIcon} accent="#DC2626" highlight={al.criticas > 0} onClick={() => navigate('/alertas')} />
          </Grid>
          <Grid item xs={6} md={3}>
            <DashboardCard title="Alertas vencidas" value={al.vencidas} icon={NotificationsActiveOutlinedIcon} accent="#EA580C" highlight={al.vencidas > 0} onClick={() => navigate('/alertas')} />
          </Grid>
          <Grid item xs={6} md={3}>
            <DashboardCard title="Alertas pendientes" value={al.pendientes} icon={NotificationsActiveOutlinedIcon} accent="#CA8A04" onClick={() => navigate('/alertas')} />
          </Grid>
          <Grid item xs={6} md={3}>
            <DashboardCard title="Alertas resueltas" value={al.resueltas} icon={CheckCircleOutlineIcon} accent={GREEN} onClick={() => navigate('/alertas')} />
          </Grid>
        </Grid>

        {/* ===================== ACCIONES PENDIENTES + DISTRIBUCIÓN ===================== */}
        <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{ ...panelSx, height: '100%' }}>
              <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 1.5 }}>
                <Box sx={{
                  width: 34, height: 34, borderRadius: '10px', flexShrink: 0,
                  bgcolor: '#EA580C16',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <PendingActionsOutlinedIcon sx={{ fontSize: 19, color: '#EA580C' }} />
                </Box>
                <Typography variant="subtitle1" fontWeight={700}>Acciones pendientes</Typography>
                {acciones.length > 0 && <Chip size="small" color="warning" label={acciones.length} />}
              </Stack>
              <Divider sx={{ mb: 1 }} />
              {acciones.length === 0 ? (
                <Box sx={{ py: 5, textAlign: 'center' }}>
                  <Typography color="text.secondary">Sin acciones pendientes 🎉</Typography>
                </Box>
              ) : (
                <List dense disablePadding>
                  {acciones.map((ac, i) => (
                    <ListItemButton key={i} onClick={() => navigate(ac.to)} sx={{ borderRadius: '10px', mb: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 44 }}>
                        <Avatar sx={{ width: 34, height: 34, borderRadius: '10px', bgcolor: ac.color + '18', color: ac.color }} variant="rounded">
                          <ac.icon sx={{ fontSize: 18 }} />
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText primary={ac.label} primaryTypographyProps={{ fontWeight: 600, fontSize: '0.85rem' }} />
                      <Chip size="small" label={ac.count} sx={{ bgcolor: ac.color + '18', color: ac.color, fontWeight: 700, mr: 0.5 }} />
                      <ChevronRightIcon sx={{ color: 'text.disabled' }} />
                    </ListItemButton>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            <ChartPanel title="Distribución de animales por categoría" icon={DonutLargeOutlinedIcon} iconColor="#0284C7">
              <Box sx={{ height: 340 }}>
                {distribucionCategoria.length === 0 ? <SinDatos /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
                      <Pie
                        data={distribucionCategoria}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={58}
                        outerRadius={95}
                        paddingAngle={2}
                        label={(e) => `${e.name} (${e.value})`}
                        labelLine={{ stroke: '#CBD5E1' }}
                      >
                        {distribucionCategoria.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="#fff" strokeWidth={2} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: SOFT_SHADOW }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </ChartPanel>
          </Grid>
        </Grid>

        {/* ===================== GRÁFICOS FINANCIEROS / PRODUCTIVOS ===================== */}
        <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
          <Grid item xs={12} lg={6}>
            <ChartPanel title="Balance Financiero Mensual" icon={BarChartOutlinedIcon} iconColor={GREEN}>
              <Box sx={{ height: 340 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={datosMensuales} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EDF2F7" />
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={fmtEjeMoneda} />
                    <Tooltip
                      cursor={{ fill: 'rgba(4,120,87,0.06)' }}
                      contentStyle={{ borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: SOFT_SHADOW }}
                      formatter={(v) => 'Bs. ' + Number(v).toLocaleString('es-ES')}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: 10, fontSize: 13 }} />
                    <Bar dataKey="ventas" name="Ventas" fill="#047857" radius={[6, 6, 0, 0]} maxBarSize={36} />
                    <Bar dataKey="gastos" name="Gastos" fill="#DC2626" radius={[6, 6, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </ChartPanel>
          </Grid>

          <Grid item xs={12} lg={6}>
            <ChartPanel title="Tendencia de Producción Lechera" icon={ShowChartOutlinedIcon} iconColor="#CA8A04">
              <Box sx={{ height: 340 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={datosMensuales} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="lecheStroke" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#F59E0B" />
                        <stop offset="100%" stopColor="#CA8A04" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EDF2F7" />
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v} L`} />
                    <Tooltip
                      contentStyle={{ borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: SOFT_SHADOW }}
                      formatter={(v) => Number(v).toLocaleString('es-ES') + ' Lts'}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: 10, fontSize: 13 }} />
                    <Line type="monotone" dataKey="leche" name="Producción (Litros)" stroke="url(#lecheStroke)" strokeWidth={3} dot={{ r: 3, fill: '#CA8A04' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </ChartPanel>
          </Grid>

          <Grid item xs={12}>
            <ChartPanel title="Alertas por tipo" icon={NotificationsActiveOutlinedIcon} iconColor="#EA580C">
              <Box sx={{ height: 340 }}>
                {alertasPorTipo.length === 0 ? <SinDatos /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={alertasPorTipo} layout="vertical" margin={{ top: 5, right: 24, left: 40, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#EDF2F7" />
                      <XAxis type="number" stroke="#94A3B8" fontSize={12} allowDecimals={false} tickLine={false} axisLine={false} />
                      <YAxis type="category" dataKey="name" stroke="#64748B" fontSize={12} width={190} tickLine={false} axisLine={false} />
                      <Tooltip
                        cursor={{ fill: 'rgba(234,88,12,0.06)' }}
                        contentStyle={{ borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: SOFT_SHADOW }}
                      />
                      <Bar dataKey="value" name="Alertas" fill="#EA580C" radius={[0, 6, 6, 0]} maxBarSize={22} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </ChartPanel>
          </Grid>
        </Grid>

      </Box>
    </Box>
  )
}

export default DashboardPage
